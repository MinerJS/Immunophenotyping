/**
 * cytometer-simulator.js
 * Interactive Flow Cytometer Instrument Simulator
 * Simulates fluidics (hydrodynamic focusing), optics (lasers/detection),
 * electronics (oscilloscope signal processing), and plotting of 6,000 events.
 */

// Plot configurations and educational text
const SIM_TUBES = {
  screen: {
    name: "Tube 1: QC & Gating",
    plots: [
      {
        title: "FSC-A vs SSC-A (Size vs Complexity)",
        xAttr: "FSC_A",
        yAttr: "SSC_A",
        xMin: 0, xMax: 1000,
        yMin: 0, yMax: 1000,
        xScale: "linear",
        yScale: "linear",
        xLabel: "FSC-A (Size - Linear)",
        yLabel: "SSC-A (Complexity - Linear)",
        edu: `
          <p><strong>Subsystem: Optics (Light Scattering)</strong></p>
          <p>This scatter plot displays <strong>Forward Scatter Area (FSC-A)</strong> on the X-axis against <strong>Side Scatter Area (SSC-A)</strong> on the Y-axis. Both parameters are displayed on <strong>linear scales</strong>.</p>
          <div style="margin: 10px 0; padding: 10px; background: rgba(255,255,255,0.03); border-radius: 6px; border: 1px solid rgba(255,255,255,0.05); font-size: 12.5px;">
            <strong>Forward Scatter (FSC)</strong>: Light diffracted at small angles (0.5° - 10°) in the path of the laser. FSC intensity is proportional to the cell's physical size or surface area.
            <br><br>
            <strong>Side Scatter (SSC)</strong>: Light reflected or refracted at 90 degrees by internal organelles, granules, or nuclear complexity. SSC intensity is proportional to internal granularity.
          </div>
          <p>In this whole blood sample, you can resolve these major populations:
            <br>- <span style="color:#00e5ff; font-weight:700;">Lymphocytes</span> (T, B, NK): Small size (low FSC), simple structure (low SSC).
            <br>- <span style="color:#4caf50; font-weight:700;">Monocytes</span>: Mid-to-large size, moderate complexity.
            <br>- <span style="color:#2196f3; font-weight:700;">Granulocytes</span>: Large size, highly complex (very high SSC due to granules).
          </p>
          <p><strong>Leukemia Check:</strong> In the <strong>AML Case</strong>, notice the massive expansion of <span style="color:#9c27b0; font-weight:700;">AML Blasts</span> (purple) clustering in the lower-middle region. They are CD45-dim and have low-to-moderate SSC, indicating primitive cells with low granularity.</p>
          <div style="margin: 10px 0; padding: 10px; background: rgba(56, 189, 248, 0.05); border-radius: 6px; border: 1px solid rgba(56, 189, 248, 0.15); font-size: 11.5px;">
            <strong>Beckman Coulter Navios Specs:</strong>
            <br>• <strong>Lasers Wavelengths & Power:</strong> 488 nm Blue (22 mW), 638 nm Red (25 mW), and 405 nm Violet (40 mW).
            <br>• <strong>Beam Spot Profiles:</strong> Blue (10 µm × 84 µm), Red (9.6 µm × 72 µm), Violet (8.9 µm × 70 µm).
            <br>• <strong>Beam Separation:</strong> 125 µm pinhole separation.
          </div>
        `
      },
      {
        title: "FSC-A vs FSC-H (Doublet Exclusion)",
        xAttr: "FSC_A",
        yAttr: "FSC_H",
        xMin: 0, xMax: 1000,
        yMin: 0, yMax: 1000,
        xScale: "linear",
        yScale: "linear",
        xLabel: "FSC-Area (Linear)",
        yLabel: "FSC-Height (Linear)",
        edu: `
          <p><strong>Subsystem: Electronics (Pulse Processing)</strong></p>
          <p>This plot is the primary Quality Control method to exclude cell aggregates, known as <strong>doublets</strong> (two cells passing the laser stuck together).</p>
          <div style="margin: 10px 0; padding: 10px; background: rgba(255,255,255,0.03); border-radius: 6px; border: 1px solid rgba(255,255,255,0.05); font-size: 12.5px;">
            <strong>Pulse Height (H)</strong>: The maximum voltage peak amplitude of the signal.
            <br>
            <strong>Pulse Area (A)</strong>: The integrated mathematical area under the pulse voltage curve.
            <br>
            <strong>Pulse Width (W)</strong>: The duration of time the cell spends passing through the laser beam.
          </div>
          <p>For a <strong>singlet</strong> (single cell), height and area are directly proportional, placing them along a tight diagonal. A doublet takes twice as long to pass, doubling the <strong>Area</strong> and <strong>Width</strong>, while the peak <strong>Height</strong> remains similar. Therefore, doublets fall below the diagonal.</p>
          <p><strong>Fluidics Connection:</strong> Increasing the <strong>Flow Rate</strong> to High widens the core stream, which allows cells to pass side-by-side or cluster. This creates a noticeable increase in doublet events (<span style="color:#795548; font-weight:700;">brown events</span> falling below the diagonal).</p>
          <div style="margin: 10px 0; padding: 10px; background: rgba(56, 189, 248, 0.05); border-radius: 6px; border: 1px solid rgba(56, 189, 248, 0.15); font-size: 11.5px;">
            <strong>Beckman Coulter Navios Pulse Specs:</strong>
            <br>• <strong>Digital Sampling Rate:</strong> 40 MHz high-speed digital signal processor (DSP).
            <br>• <strong>Dynamic Range:</strong> 20-bit dynamic range resolving 1,048,576 discrete channels.
            <br>• <strong>Nomenclature:</strong> Height is processed as <strong>FS PEAK (Height)</strong> in mV, Area as <strong>FS INT (Integral)</strong> in pC, and Width as <strong>FS TOF (Time-of-Flight)</strong> in µs.
          </div>
        `
      },
      {
        title: "Time vs FSC-A (Fluidics Stability)",
        xAttr: "Time",
        yAttr: "FSC_A",
        xMin: 0, xMax: 1000,
        yMin: 0, yMax: 1000,
        xScale: "linear",
        yScale: "linear",
        xLabel: "Time (Seconds - Linear)",
        yLabel: "FSC-A (Size - Linear)",
        edu: `
          <p><strong>Subsystem: Fluidics & Quality Control</strong></p>
          <p>Plotting <strong>Time</strong> on the X-axis against size (FSC-A) on the Y-axis monitors the stability of the cytometer's fluidic system during acquisition.</p>
          <p>A stable laminar flow cell with consistent sheath pressure produces a steady, horizontal band of events across time. Any fluidic perturbations, such as clogs in the injection needle, micro-bubbles, or pressure fluctuations in the pump system, disrupt this flow and appear as gaps or sudden shifts in the event band.</p>
          <p>In diagnostic labs, checking the Time gate is mandatory to confirm that the sample run was clean and free of fluidic glitches before final cell analysis.</p>
          <div style="margin: 10px 0; padding: 10px; background: rgba(56, 189, 248, 0.05); border-radius: 6px; border: 1px solid rgba(56, 189, 248, 0.15); font-size: 11.5px;">
            <strong>Beckman Coulter Navios Fluidics Specs:</strong>
            <br>• <strong>Flow Rates:</strong> Low (10 µL/min), Medium (30 µL/min), and High (60 µL/min).
            <br>• <strong>Hydrodynamic Core:</strong> Tight sheath fluid compression creates a stable laminar flow stream, minimizing sample variance (CV) at Low flow rate.
          </div>
        `
      },
      {
        title: "CD45 vs SSC-A (Leukocyte Classification)",
        xAttr: "CD45",
        yAttr: "SSC_A",
        xMin: 0, xMax: 1000,
        yMin: 0, yMax: 1000,
        xScale: "log",
        yScale: "linear",
        xLabel: "CD45-Fluorochrome (Log)",
        yLabel: "SSC-A (Complexity - Linear)",
        edu: `
          <p><strong>Subsystem: Gating & Classification</strong></p>
          <p>This plot is the clinical standard for initial leukocyte gating, plotting <strong>CD45 expression (logarithmic decade scale)</strong> against <strong>Side Scatter (linear scale)</strong>.</p>
          <p>CD45 (Leukocyte Common Antigen) is a cell surface marker expressed on all white blood cells. Different lineages express CD45 at distinct densities, yielding four primary clinical gates:
            <br>- <span style="color:#00e5ff; font-weight:700;">Lymphocytes</span>: CD45 extremely bright, low SSC.
            <br>- <span style="color:#4caf50; font-weight:700;">Monocytes</span>: CD45 bright, moderate SSC.
            <br>- <span style="color:#2196f3; font-weight:700;">Granulocytes</span>: CD45 moderate/dim, very high SSC.
            <br>- <span style="color:#e040fb; font-weight:700;">Blasts / Progenitors</span>: CD45 dim, low-to-mid SSC.
          </p>
          <p><strong>Pathology:</strong> In the <strong>AML Case</strong>, normal populations are compressed, and an enormous population of <span style="color:#9c27b0; font-weight:700;">AML Blasts</span> (purple) appears in the CD45-dim, low-SSC window, representing leukemic blast expansion in the bone marrow.</p>
          <div style="margin: 10px 0; padding: 10px; background: rgba(56, 189, 248, 0.05); border-radius: 6px; border: 1px solid rgba(56, 189, 248, 0.15); font-size: 11.5px;">
            <strong>Beckman Coulter Navios Detection Specs:</strong>
            <br>• CD45 is conjugated to Krome Orange (KRO, excited by 405 nm Violet laser).
            <br>• <strong>Dynamic Range:</strong> 20-bit digital data allows resolving dim CD45 populations from background noise without logarithmic pre-amplification.
          </div>
        `
      }
    ]
  },
  tcell: {
    name: "Tube 2: T-Cell Panel",
    plots: [
      {
        title: "CD45 vs SSC-A (Leukocyte Classification)",
        xAttr: "CD45",
        yAttr: "SSC_A",
        xMin: 0, xMax: 1000,
        yMin: 0, yMax: 1000,
        xScale: "log",
        yScale: "linear",
        xLabel: "CD45-Fluorochrome (Log)",
        yLabel: "SSC-A (Complexity - Linear)",
        edu: `
          <p><strong>Subsystem: Gating & Classification</strong></p>
          <p>This plot is the clinical standard for initial leukocyte gating, plotting <strong>CD45 expression (logarithmic decade scale)</strong> against <strong>Side Scatter (linear scale)</strong>.</p>
          <p>CD45 (Leukocyte Common Antigen) is a cell surface marker expressed on all white blood cells. Different lineages express CD45 at distinct densities, yielding four primary clinical gates:
            <br>- <span style="color:#00e5ff; font-weight:700;">Lymphocytes</span>: CD45 extremely bright, low SSC.
            <br>- <span style="color:#4caf50; font-weight:700;">Monocytes</span>: CD45 bright, moderate SSC.
            <br>- <span style="color:#2196f3; font-weight:700;">Granulocytes</span>: CD45 moderate/dim, very high SSC.
            <br>- <span style="color:#e040fb; font-weight:700;">Blasts / Progenitors</span>: CD45 dim, low-to-mid SSC.
          </p>
          <div style="margin: 10px 0; padding: 10px; background: rgba(56, 189, 248, 0.05); border-radius: 6px; border: 1px solid rgba(56, 189, 248, 0.15); font-size: 11.5px;">
            <strong>Beckman Coulter Navios Detection Specs:</strong>
            <br>• CD45 is conjugated to Krome Orange (KRO, excited by 405 nm Violet laser).
            <br>• <strong>Dynamic Range:</strong> 20-bit digital data allows resolving dim CD45 populations from background noise without logarithmic pre-amplification.
          </div>
        `
      },
      {
        title: "CD3 vs CD19 (T-Cell vs B-Cell Lineages)",
        xAttr: "CD3",
        yAttr: "CD19",
        xMin: 0, xMax: 1000,
        yMin: 0, yMax: 1000,
        xScale: "log",
        yScale: "log",
        xLabel: "CD3 (T-Cell Log)",
        yLabel: "CD19 (B-Cell Log)",
        edu: `
          <p><strong>Subsystem: Optics (Multicolor Fluorescence)</strong></p>
          <p>This immunotypic plot separates mature lymphocyte subpopulations, plotting <strong>CD3 (T-cell marker)</strong> on the X-axis against <strong>CD19 (B-cell marker)</strong> on the Y-axis, both on <strong>logarithmic scales</strong>.</p>
          <p>Because T-cell and B-cell lineages are mutually exclusive in normal cells:
            <br>- <span style="color:#00e5ff; font-weight:700;">T-lymphocytes</span> are CD3+ CD19- (forming a cluster on the bottom-right).
            <br>- <span style="color:#ff9800; font-weight:700;">B-lymphocytes</span> are CD3- CD19+ (forming a cluster on the top-left).
            <br>- <strong>NK Cells, Monocytes, and Granulocytes</strong> are double negative (CD3- CD19-, clustering in the bottom-left corner).
          </p>
          <p>This allows rapid calculation of helper ratios and lymphoid lineage distribution, which is vital for lymphoid leukemia screening.</p>
          <div style="margin: 10px 0; padding: 10px; background: rgba(56, 189, 248, 0.05); border-radius: 6px; border: 1px solid rgba(56, 189, 248, 0.15); font-size: 11.5px;">
            <strong>Beckman Coulter Navios Multicolor Optics:</strong>
            <br>• CD3 is conjugated to Pacific Blue (PB, excited by 405 nm Violet laser).
            <br>• CD19 is conjugated to Pacific Blue (PB, excited by 405 nm Violet laser).
            <br>• *Note: Since both are Pacific Blue, they are run in separate tubes in practice, but co-plotted here for lineage resolution.*
          </div>
        `
      },
      {
        title: "CD4 vs CD8 (T-Helper vs T-Cytotoxic Subsets)",
        xAttr: "CD4",
        yAttr: "CD8",
        xMin: 0, xMax: 1000,
        yMin: 0, yMax: 1000,
        xScale: "log",
        yScale: "log",
        xLabel: "CD4 (Helper Log)",
        yLabel: "CD8 (Cytotoxic Log)",
        edu: `
          <p><strong>Subsystem: T-Cell Subtyping</strong></p>
          <p>This plot subtypes T-lymphocytes (pre-gated CD3+ events) into helper T-cells and cytotoxic T-cells, both displayed on <strong>logarithmic scales</strong>.</p>
          <ul>
            <li><strong>CD4+ Helper T-cells</strong>: Coordinate adaptive immune responses by releasing cytokines. They bind MHC Class II. They form the cluster on the bottom-right.</li>
            <li><strong>CD8+ Cytotoxic T-cells</strong>: Directly lyse viral-infected and tumor cells. They bind MHC Class I. They form the cluster on the top-left.</li>
            <li><strong>Double Negative T-cells</strong>: Represent TCR gamma-delta T-cells or immature thymocytes (bottom-left).</li>
          </ul>
          <p>In mature healthy blood, T-cells are mutually exclusive for CD4 and CD8. The ratio of CD4:CD8 cells is typically around 1.5 to 2.0. A reversal of this ratio (<1.0) is a hallmark of immunodeficiency states like HIV infection.</p>
          <div style="margin: 10px 0; padding: 10px; background: rgba(56, 189, 248, 0.05); border-radius: 6px; border: 1px solid rgba(56, 189, 248, 0.15); font-size: 11.5px;">
            <strong>Beckman Coulter Navios Specs:</strong>
            <br>• CD4 is conjugated to Phycoerythrin (PE, excited by 488 nm Blue laser).
            <br>• CD8 is conjugated to APC-Alexa Fluor 750 (excited by 638 nm Red laser).
          </div>
        `
      },
      {
        title: "CD2 vs CD7 (T/NK Gating)",
        xAttr: "CD2",
        yAttr: "CD7",
        xMin: 0, xMax: 1000,
        yMin: 0, yMax: 1000,
        xScale: "log",
        yScale: "log",
        xLabel: "CD2 (T/NK Log)",
        yLabel: "CD7 (T/NK Log)",
        edu: `
          <p><strong>Subsystem: T/NK Cell Differentiation</strong></p>
          <p>This plot displays <strong>CD2 (Log)</strong> against <strong>CD7 (Log)</strong> expression. Both CD2 and CD7 are pan-T cell markers and are also expressed on NK cells.</p>
          <p>Healthy mature T-lymphocytes express high densities of both CD2 and CD7, placing them in the double positive quadrant (top-right).</p>
          <p><strong>Clinical Correlation:</strong> Loss or down-regulation of CD7 (or CD2) on T-cells is a key immunophenotypic hallmark of T-cell malignancies, such as Sezary Syndrome or T-cell Prolymphocytic Leukemia (T-PLL).</p>
          <div style="margin: 10px 0; padding: 10px; background: rgba(56, 189, 248, 0.05); border-radius: 6px; border: 1px solid rgba(56, 189, 248, 0.15); font-size: 11.5px;">
            <strong>Beckman Coulter Navios Specs:</strong>
            <br>• CD2 is conjugated to ECD (PE-Texas Red, excited by 488 nm Blue laser).
            <br>• CD7 is conjugated to APC-A700 (excited by 638 nm Red laser).
          </div>
        `
      },
      {
        title: "CD3 vs CD5 (T-Cell Co-Receptor expression)",
        xAttr: "CD3",
        yAttr: "CD5",
        xMin: 0, xMax: 1000,
        yMin: 0, yMax: 1000,
        xScale: "log",
        yScale: "log",
        xLabel: "CD3 (T-Cell Log)",
        yLabel: "CD5 (Log)",
        edu: `
          <p><strong>Subsystem: T-Cell Gating & Lineage</strong></p>
          <p>This plot maps <strong>CD3 (Log)</strong> against <strong>CD5 (Log)</strong> expression. CD3 and CD5 are co-expressed on almost all T-cells.</p>
          <p>Additionally, CD5 is expressed at a low density on a normal subset of B-lymphocytes (CD5+ B-cells). In CLL, B-cells aberrantly overexpress CD5.</p>
          <div style="margin: 10px 0; padding: 10px; background: rgba(56, 189, 248, 0.05); border-radius: 6px; border: 1px solid rgba(56, 189, 248, 0.15); font-size: 11.5px;">
            <strong>Beckman Coulter Navios Specs:</strong>
            <br>• CD3 is conjugated to Pacific Blue (PB, excited by 405 nm Violet laser).
            <br>• CD5 is conjugated to PE-Cy7 (PC7, excited by 488 nm Blue laser).
          </div>
        `
      }
    ]
  },
  bcell: {
    name: "Tube 3: B-Cell Panel",
    plots: [
      {
        title: "CD45 vs SSC-A (Leukocyte Gating)",
        xAttr: "CD45",
        yAttr: "SSC_A",
        xMin: 0, xMax: 1000,
        yMin: 0, yMax: 1000,
        xScale: "log",
        yScale: "linear",
        xLabel: "CD45-Fluorochrome (Log)",
        yLabel: "SSC-A (Complexity - Linear)",
        edu: `
          <p><strong>Subsystem: Gating & Classification</strong></p>
          <p>This plot is the clinical standard for initial leukocyte gating, plotting <strong>CD45 expression (logarithmic decade scale)</strong> against <strong>Side Scatter (linear scale)</strong>.</p>
          <p>CD45 (Leukocyte Common Antigen) is a cell surface marker expressed on all white blood cells. Different lineages express CD45 at distinct densities, yielding four primary clinical gates:
            <br>- <span style="color:#00e5ff; font-weight:700;">Lymphocytes</span>: CD45 extremely bright, low SSC.
            <br>- <span style="color:#4caf50; font-weight:700;">Monocytes</span>: CD45 bright, moderate SSC.
            <br>- <span style="color:#2196f3; font-weight:700;">Granulocytes</span>: CD45 moderate/dim, very high SSC.
            <br>- <span style="color:#e040fb; font-weight:700;">Blasts / Progenitors</span>: CD45 dim, low-to-mid SSC.
          </p>
          <div style="margin: 10px 0; padding: 10px; background: rgba(56, 189, 248, 0.05); border-radius: 6px; border: 1px solid rgba(56, 189, 248, 0.15); font-size: 11.5px;">
            <strong>Beckman Coulter Navios Detection Specs:</strong>
            <br>• CD45 is conjugated to Krome Orange (KRO, excited by 405 nm Violet laser).
            <br>• <strong>Dynamic Range:</strong> 20-bit digital data allows resolving dim CD45 populations from background noise without logarithmic pre-amplification.
          </div>
        `
      },
      {
        title: "CD19 vs CD20 (B-Cell Maturation)",
        xAttr: "CD19",
        yAttr: "CD20",
        xMin: 0, xMax: 1000,
        yMin: 0, yMax: 1000,
        xScale: "log",
        yScale: "log",
        xLabel: "CD19 (B-Cell Log)",
        yLabel: "CD20 (B-Cell Log)",
        edu: `
          <p><strong>Subsystem: B-Lymphocyte Development</strong></p>
          <p>This plot shows <strong>CD19 (Log)</strong> against <strong>CD20 (Log)</strong>. Both are pan-B cell markers, but they are expressed at different times during B-cell development.</p>
          <p>Mature B-lymphocytes are double positive (CD19+ CD20+). Pre-B cells in the bone marrow (hematogones) express CD19 before they acquire CD20.</p>
          <p><strong>AML Gating:</strong> In AML, myeloid blasts are negative for both markers, but normal residual B-cells will sit in the double-positive quadrant.</p>
          <div style="margin: 10px 0; padding: 10px; background: rgba(56, 189, 248, 0.05); border-radius: 6px; border: 1px solid rgba(56, 189, 248, 0.15); font-size: 11.5px;">
            <strong>Beckman Coulter Navios Optical System:</strong>
            <br>• CD19 is conjugated to Pacific Blue (PB, excited by 405 nm Violet laser).
            <br>• CD20 is conjugated to APC-A750 (excited by 638 nm Red laser).
          </div>
        `
      },
      {
        title: "Kappa vs Lambda (B-Cell Light Chain Clonality)",
        xAttr: "Kappa",
        yAttr: "Lambda",
        xMin: 0, xMax: 1000,
        yMin: 0, yMax: 1000,
        xScale: "log",
        yScale: "log",
        xLabel: "Kappa Light Chain (Log)",
        yLabel: "Lambda Light Chain (Log)",
        edu: `
          <p><strong>Subsystem: Clonality Gating</strong></p>
          <p>This plot displays <strong>Kappa (Log)</strong> against <strong>Lambda (Log)</strong> light chain expression, pre-gated on CD19+ B-cells.</p>
          <p>Normal reactive B-cells show a polyclonal distribution consisting of a mixture of Kappa-expressing and Lambda-expressing B-cells (a ratio of roughly 1.4:1 to 2:1), creating two separate populations along the axes.</p>
          <p><strong>Malignancy check:</strong> In B-cell lymphoma (like CLL or follicular lymphoma), clonal expansion leads to light chain restriction—where nearly all B-cells express only Kappa or only Lambda, causing one population to disappear.</p>
          <div style="margin: 10px 0; padding: 10px; background: rgba(56, 189, 248, 0.05); border-radius: 6px; border: 1px solid rgba(56, 189, 248, 0.15); font-size: 11.5px;">
            <strong>Beckman Coulter Navios Specs:</strong>
            <br>• Kappa is conjugated to FITC (excited by 488 nm Blue laser).
            <br>• Lambda is conjugated to PE (excited by 488 nm Blue laser).
          </div>
        `
      },
      {
        title: "CD10 vs CD20 (B-Cell Maturation/Classification)",
        xAttr: "CD10",
        yAttr: "CD20",
        xMin: 0, xMax: 1000,
        yMin: 0, yMax: 1000,
        xScale: "log",
        yScale: "log",
        xLabel: "CD10 (Progenitor/Germinal Log)",
        yLabel: "CD20 (B-Cell Log)",
        edu: `
          <p><strong>Subsystem: Germinal Center / Progenitor Development</strong></p>
          <p>Plots <strong>CD10 (Log)</strong> against <strong>CD20 (Log)</strong>. CD10 (CALLA) is expressed on early B-cell precursors (hematogones) and germinal center B-cells.</p>
          <p>Normal mature circulating B-cells are CD10- CD20+. In follicular lymphoma, the tumor cells are classically CD10+ CD20+.</p>
          <div style="margin: 10px 0; padding: 10px; background: rgba(56, 189, 248, 0.05); border-radius: 6px; border: 1px solid rgba(56, 189, 248, 0.15); font-size: 11.5px;">
            <strong>Beckman Coulter Navios Specs:</strong>
            <br>• CD10 is conjugated to PE-Texas Red (ECD, excited by 488 nm Blue laser).
            <br>• CD20 is conjugated to APC-A750 (excited by 638 nm Red laser).
          </div>
        `
      },
      {
        title: "CD19 vs CD200 (Chronic Lymphocytic Leukemia Gating)",
        xAttr: "CD19",
        yAttr: "CD200",
        xMin: 0, xMax: 1000,
        yMin: 0, yMax: 1000,
        xScale: "log",
        yScale: "log",
        xLabel: "CD19 (B-Cell Log)",
        yLabel: "CD200 (Log)",
        edu: `
          <p><strong>Subsystem: Lymphoma Diagnostics</strong></p>
          <p>This plot shows <strong>CD19 (Log)</strong> against <strong>CD200 (Log)</strong> expression.</p>
          <p>CD200 is highly expressed in Chronic Lymphocytic Leukemia (CLL) but negative or very dim in Mantle Cell Lymphoma (MCL). This differential expression is a key gate in clinical flow cytometry workflows.</p>
          <div style="margin: 10px 0; padding: 10px; background: rgba(56, 189, 248, 0.05); border-radius: 6px; border: 1px solid rgba(56, 189, 248, 0.15); font-size: 11.5px;">
            <strong>Beckman Coulter Navios Specs:</strong>
            <br>• CD19 is conjugated to Pacific Blue (PB, excited by 405 nm Violet laser).
            <br>• CD200 is conjugated to PE-Cy7 (PC7, excited by 488 nm Blue laser).
          </div>
        `
      }
    ]
  },
  myeloid: {
    name: "Tube 4: Myeloid Panel",
    plots: [
      {
        title: "CD45 vs SSC-A (Leukocyte Gating)",
        xAttr: "CD45",
        yAttr: "SSC_A",
        xMin: 0, xMax: 1000,
        yMin: 0, yMax: 1000,
        xScale: "log",
        yScale: "linear",
        xLabel: "CD45-Fluorochrome (Log)",
        yLabel: "SSC-A (Complexity - Linear)",
        edu: `
          <p><strong>Subsystem: Gating & Classification</strong></p>
          <p>This plot is the clinical standard for initial leukocyte gating, plotting <strong>CD45 expression (logarithmic decade scale)</strong> against <strong>Side Scatter (linear scale)</strong>.</p>
          <p>CD45 (Leukocyte Common Antigen) is a cell surface marker expressed on all white blood cells. Different lineages express CD45 at distinct densities, yielding four primary clinical gates:
            <br>- <span style="color:#00e5ff; font-weight:700;">Lymphocytes</span>: CD45 extremely bright, low SSC.
            <br>- <span style="color:#4caf50; font-weight:700;">Monocytes</span>: CD45 bright, moderate SSC.
            <br>- <span style="color:#2196f3; font-weight:700;">Granulocytes</span>: CD45 moderate/dim, very high SSC.
            <br>- <span style="color:#e040fb; font-weight:700;">Blasts / Progenitors</span>: CD45 dim, low-to-mid SSC.
          </p>
          <div style="margin: 10px 0; padding: 10px; background: rgba(56, 189, 248, 0.05); border-radius: 6px; border: 1px solid rgba(56, 189, 248, 0.15); font-size: 11.5px;">
            <strong>Beckman Coulter Navios Detection Specs:</strong>
            <br>• CD45 is conjugated to Krome Orange (KRO, excited by 405 nm Violet laser).
            <br>• <strong>Dynamic Range:</strong> 20-bit digital data allows resolving dim CD45 populations from background noise without logarithmic pre-amplification.
          </div>
        `
      },
      {
        title: "CD34 vs CD117 (Early Myeloid Blasts)",
        xAttr: "CD34",
        yAttr: "CD117",
        xMin: 0, xMax: 1000,
        yMin: 0, yMax: 1000,
        xScale: "log",
        yScale: "log",
        xLabel: "CD34 (Progenitor Log)",
        yLabel: "CD117 (c-kit Log)",
        edu: `
          <p><strong>Subsystem: Stem Cell & Myeloblast Gating</strong></p>
          <p>Plots <strong>CD34 (Log)</strong> against <strong>CD117 (Log)</strong>. These are early hematopoietic stem cell and progenitor markers.</p>
          <p>Normal hematopoietic stem cells are CD34+ CD117+. In <strong>Acute Myeloid Leukemia (AML)</strong>, the leukemic myeloblasts typically co-express both markers at high levels.</p>
          <p><strong>AML Case Check:</strong> Switch to AML Case to see a massive expansion of cells co-expressing CD34 and CD117, confirming a high blast count.</p>
          <div style="margin: 10px 0; padding: 10px; background: rgba(56, 189, 248, 0.05); border-radius: 6px; border: 1px solid rgba(56, 189, 248, 0.15); font-size: 11.5px;">
            <strong>Beckman Coulter Navios Specs:</strong>
            <br>• CD34 is conjugated to APC (excited by 638 nm Red laser).
            <br>• CD117 is conjugated to PE-Texas Red (ECD, excited by 488 nm Blue laser).
          </div>
        `
      },
      {
        title: "CD13 vs CD33 (Myeloid Maturation)",
        xAttr: "CD13",
        yAttr: "CD33",
        xMin: 0, xMax: 1000,
        yMin: 0, yMax: 1000,
        xScale: "log",
        yScale: "log",
        xLabel: "CD13 (Myeloid Log)",
        yLabel: "CD33 (Myeloid Log)",
        edu: `
          <p><strong>Subsystem: Myeloid Lineage Maturation</strong></p>
          <p>Plots <strong>CD13 (Log)</strong> against <strong>CD33 (Log)</strong>. Both markers are expressed throughout myeloid cell development (granulocytes and monocytes).</p>
          <p>Normal monocytes express bright CD33 and CD13. Granulocytes express them at moderate levels.</p>
          <p><strong>AML Pathology:</strong> Notice that in the <strong>AML Case</strong>, the myeloblasts show a distinct <strong>aberrant loss of CD13 expression</strong> (sitting in the CD13-dim/negative region), which is a key diagnostic marker for identifying leukemia blasts.</p>
          <div style="margin: 10px 0; padding: 10px; background: rgba(56, 189, 248, 0.05); border-radius: 6px; border: 1px solid rgba(56, 189, 248, 0.15); font-size: 11.5px;">
            <strong>Beckman Coulter Navios Specs:</strong>
            <br>• CD13 is conjugated to PE-Cy5.5 (PC5.5, excited by 488 nm Blue laser).
            <br>• CD33 is conjugated to PE-Cy7 (PC7, excited by 488 nm Blue laser).
          </div>
        `
      },
      {
        title: "HLA-DR vs CD11b (Blast vs Monocyte/Granulocyte Gating)",
        xAttr: "HLA_DR",
        yAttr: "CD11b",
        xMin: 0, xMax: 1000,
        yMin: 0, yMax: 1000,
        xScale: "log",
        yScale: "log",
        xLabel: "HLA-DR (Class II MHC Log)",
        yLabel: "CD11b (Adhesion Log)",
        edu: `
          <p><strong>Subsystem: Monocytic & Granulocytic Maturation</strong></p>
          <p>Plots <strong>HLA-DR (Log)</strong> against <strong>CD11b (Log)</strong>.</p>
          <p>Normal stem cells and myeloid blasts are HLA-DR+ CD11b-. As they mature into monocytes, they express both (HLA-DR+ CD11b+). As they mature into granulocytes, they lose HLA-DR and gain CD11b (HLA-DR- CD11b+).</p>
          <div style="margin: 10px 0; padding: 10px; background: rgba(56, 189, 248, 0.05); border-radius: 6px; border: 1px solid rgba(56, 189, 248, 0.15); font-size: 11.5px;">
            <strong>Beckman Coulter Navios Specs:</strong>
            <br>• HLA-DR is conjugated to APC-A750 (excited by 638 nm Red laser).
            <br>• CD11b is conjugated to Pacific Blue (PB, excited by 405 nm Violet laser).
          </div>
        `
      },
      {
        title: "CD14 vs CD64 (Monocyte Gating)",
        xAttr: "CD14",
        yAttr: "CD64",
        xMin: 0, xMax: 1000,
        yMin: 0, yMax: 1000,
        xScale: "log",
        yScale: "log",
        xLabel: "CD14 (Monocytic Log)",
        yLabel: "CD64 (FcγRI Log)",
        edu: `
          <p><strong>Subsystem: Monocytic Lineage</strong></p>
          <p>Plots CD14 against CD64. Both are expressed primarily on monocytes, though resting granulocytes express weak CD64 and no CD14.</p>
          <p>This plot is key to identifying monocytic leukemias (AMoL) or monocytic differentiation in myelodysplastic syndrome (MDS).</p>
          <div style="margin: 10px 0; padding: 10px; background: rgba(56, 189, 248, 0.05); border-radius: 6px; border: 1px solid rgba(56, 189, 248, 0.15); font-size: 11.5px;">
            <strong>Beckman Coulter Navios Specs:</strong>
            <br>• CD14 is conjugated to APC-A700 (excited by 638 nm Red laser).
            <br>• CD64 is conjugated to PE-Cy7 (PC7, excited by 488 nm Blue laser).
          </div>
        `
      },
      {
        title: "CD15 vs CD16 (Granulocyte Maturation)",
        xAttr: "CD15",
        yAttr: "CD16",
        xMin: 0, xMax: 1000,
        yMin: 0, yMax: 1000,
        xScale: "log",
        yScale: "log",
        xLabel: "CD15 (Granulocyte Log)",
        yLabel: "CD16 (FcγRIII Log)",
        edu: `
          <p><strong>Subsystem: Neutrophilic Maturation Pathways</strong></p>
          <p>Plots CD15 against CD16. In the bone marrow, neutrophilic precursors gain CD15, then gain CD16 as they become mature neutrophils.</p>
          <p>Normal circulating neutrophils are CD15+ CD16+ (double bright). Gaps or left-shifts indicate immature granulocytes (e.g. infection response or CML).</p>
          <div style="margin: 10px 0; padding: 10px; background: rgba(56, 189, 248, 0.05); border-radius: 6px; border: 1px solid rgba(56, 189, 248, 0.15); font-size: 11.5px;">
            <strong>Beckman Coulter Navios Specs:</strong>
            <br>• CD15 is conjugated to FITC (excited by 488 nm Blue laser).
            <br>• CD16 is conjugated to FITC (excited by 488 nm Blue laser).
          </div>
        `
      }
    ]
  }
};

const populationCentroids = {
  'Debris': { FSC_A: 100, SSC_A: 80, CD45: 100, FSC_H_ratio: 0.95 },
  'Doublets': { FSC_A: 650, SSC_A: 350, CD45: 500, FSC_H_ratio: 0.55 },
  'CD4_TCell': { FSC_A: 350, SSC_A: 120, CD45: 850, FSC_H_ratio: 0.98, CD3: 880, CD5: 850, CD2: 860, CD7: 870, CD4: 850, CD8: 80 },
  'CD8_TCell': { FSC_A: 350, SSC_A: 120, CD45: 850, FSC_H_ratio: 0.98, CD3: 880, CD5: 850, CD2: 860, CD7: 870, CD4: 80, CD8: 880 },
  'gd_TCell': { FSC_A: 350, SSC_A: 120, CD45: 850, FSC_H_ratio: 0.98, CD3: 880, CD5: 850, CD2: 860, CD7: 870, CD4: 80, CD8: 80, TCR_gd: 850 },
  'BCell': { FSC_A: 360, SSC_A: 125, CD45: 840, FSC_H_ratio: 0.98, CD19: 850, CD20: 880, CD200: 750 },
  'NKCell': { FSC_A: 380, SSC_A: 140, CD45: 820, FSC_H_ratio: 0.98, CD56: 850, CD16: 800, CD2: 780, CD7: 840, CD3: 80 },
  'Monocyte': { FSC_A: 620, SSC_A: 450, CD45: 720, FSC_H_ratio: 0.97, CD14: 850, CD64: 880, CD33: 860, CD13: 780, CD11b: 840, HLA_DR: 820, CD4: 450 },
  'Granulocyte': { FSC_A: 720, SSC_A: 820, CD45: 580, FSC_H_ratio: 0.96, CD16: 880, CD13: 820, CD10: 780, CD11b: 850, CD15: 850 },
  'AML_Blast': { FSC_A: 450, SSC_A: 220, CD45: 410, FSC_H_ratio: 0.98, CD34: 840, CD117: 780, CD38: 760, CD123: 560, HLA_DR: 650, CD33: 830, CD13: 110, CD7: 760 },
  'NormalProgenitor': { FSC_A: 400, SSC_A: 220, CD45: 420, FSC_H_ratio: 0.98 }
};

class FlowCytometerSimulator {
  constructor() {
    this.activeCase = 'normal';
    this.flowRate = 'low'; // 'low', 'medium', or 'high'
    this.runMode = 'setup'; // 'setup' or 'acquire'
    this.activeTube = 'screen'; // 'screen', 'tcell', 'bcell', or 'myeloid'
    this.runSpeed = 'medium'; // 'slow', 'medium', 'fast', 'instant'
    this.isRunning = false;
    this.plotsNeedRedraw = false;
    
    this.eventsList = [];
    this.acquiredEvents = [];
    this.currentIndex = 0;
    this.activePlotIdx = 0;
    
    // Animation frame handle
    this.animationFrameId = null;
    
    // Particle arrays for nozzle simulation
    this.particles = [];
    this.sheathLines = [];
    this.flyingDots = [];
    this.oscPulse = null; // Currently rendering pulse
    this.oscSweepX = 0;
    this.flashAlpha = 0;
    
    this.initElements();
    this.initCanvases();
    this.renderSidebarThumbnails();
    this.initEventListeners();
    this.resetSimulation();
  }

  initElements() {
    this.viewContainer = document.getElementById('cytometer-simulator-view');
    this.backBtn = document.getElementById('sim-back-btn');
    this.caseSelect = document.getElementById('case-select');
    this.runModeSelect = document.getElementById('sim-run-mode');
    this.tubeSelect = document.getElementById('sim-tube-select');
    this.flowRateSelect = document.getElementById('sim-flow-rate');
    this.runSpeedSelect = document.getElementById('sim-run-speed');
    this.runBtn = document.getElementById('sim-run-btn');
    this.resetBtn = document.getElementById('sim-reset-btn');
    this.eventCountSpan = document.getElementById('sim-event-count');
    this.focusedTitle = document.getElementById('sim-focused-plot-title');
    this.eduContent = document.getElementById('sim-edu-content');
    
    // Stats elements
    this.streamWidthText = document.getElementById('sim-stream-width-text');
    this.coincidenceRateText = document.getElementById('sim-coincidence-rate-text');
    this.alignmentText = document.getElementById('sim-alignment-text');
    
    // Oscilloscope text readouts
    this.pulseHeightText = document.getElementById('sim-pulse-height');
    this.pulseAreaText = document.getElementById('sim-pulse-area');
    this.pulseWidthText = document.getElementById('sim-pulse-width');
    this.pulseTypeText = document.getElementById('sim-pulse-type');
    this.pulseLabelX = document.getElementById('sim-pulse-label-x');
    this.pulseLabelY = document.getElementById('sim-pulse-label-y');
  }

  initCanvases() {
    this.thumbCanvases = [];
    this.thumbCtxs = [];
    
    // Focused canvas
    this.focusedCanvas = document.getElementById('sim-canvas-focused');
    this.focusedCtx = this.focusedCanvas.getContext('2d');
    
    // Instrument canvas
    this.instrumentCanvas = document.getElementById('sim-canvas-instrument');
    this.instrumentCtx = this.instrumentCanvas.getContext('2d');
    
    // Oscilloscope canvas
    this.oscilloscopeCanvas = document.getElementById('sim-canvas-oscilloscope');
    this.oscilloscopeCtx = this.oscilloscopeCanvas.getContext('2d');
  }

  renderSidebarThumbnails() {
    const container = document.getElementById('sim-sidebar-plots');
    if (!container) return;
    
    const activePlots = SIM_TUBES[this.activeTube].plots;
    let html = '';
    
    activePlots.forEach((plot, idx) => {
      const isActive = idx === this.activePlotIdx;
      const borderStyle = isActive ? 'border: 1.5px solid var(--border-active);' : 'border: 1.5px solid var(--border-color);';
      const activeClass = isActive ? 'sim-plot-thumb active' : 'sim-plot-thumb';
      
      html += `
        <div class="${activeClass}" data-plot-idx="${idx}" style="background-color: var(--bg-card); ${borderStyle} border-radius: 8px; padding: 6px; cursor: pointer; transition: all 0.2s ease;">
          <div style="font-size: 9px; font-weight: 700; text-transform: uppercase; color: var(--text-secondary); text-align: center; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${plot.title.split(' (')[0]}</div>
          <canvas id="sim-canvas-thumb-${idx}" width="168" height="130" style="width: 100%; display: block; background-color: #020617; border-radius: 4px;"></canvas>
        </div>
      `;
    });
    
    container.innerHTML = html;
    
    // Now re-initialize canvases and event listeners for thumbnails
    this.thumbCanvases = [];
    this.thumbCtxs = [];
    
    activePlots.forEach((plot, idx) => {
      const canvas = document.getElementById(`sim-canvas-thumb-${idx}`);
      if (canvas) {
        this.thumbCanvases.push(canvas);
        this.thumbCtxs.push(canvas.getContext('2d'));
      }
    });
    
    // Add click listeners
    const thumbs = container.querySelectorAll('.sim-plot-thumb');
    thumbs.forEach(thumb => {
      thumb.addEventListener('click', (e) => {
        const target = e.currentTarget;
        const idx = parseInt(target.getAttribute('data-plot-idx'), 10);
        
        // Remove active class and borders from all
        thumbs.forEach((t) => {
          t.classList.remove('active');
          t.style.border = '1.5px solid var(--border-color)';
        });
        
        // Add to clicked
        target.classList.add('active');
        target.style.border = '1.5px solid var(--border-active)';
        
        this.activePlotIdx = idx;
        this.updateFocusedPlotView();
      });
    });
  }

  initEventListeners() {
    // Back button
    if (this.backBtn) {
      this.backBtn.addEventListener('click', () => {
        if (typeof switchSidebarTab === 'function') {
          switchSidebarTab('gallery');
        } else {
          this.stopSimulation();
          this.viewContainer.style.display = 'none';
        }
      });
    }

    // Case Selector
    this.caseSelect.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val === 'compare') {
        this.activeCase = 'normal';
      } else {
        this.activeCase = val;
      }
      this.resetSimulation();
    });

    // Run Mode Select
    this.runModeSelect.addEventListener('change', (e) => {
      this.runMode = e.target.value;
      this.resetSimulation();
    });

    // Tube Select
    this.tubeSelect.addEventListener('change', (e) => {
      this.activeTube = e.target.value;
      this.activePlotIdx = 0;
      this.renderSidebarThumbnails();
      this.updateFocusedPlotView();
      this.redrawAllPlots();
    });

    // Flow Rate Select
    this.flowRateSelect.addEventListener('change', (e) => {
      this.flowRate = e.target.value;
      this.updateFluidicsUI();
    });

    // Run Speed Select
    this.runSpeedSelect.addEventListener('change', (e) => {
      this.runSpeed = e.target.value;
      this.updateWarningBanner();
    });

    // Run button (Start/Pause)
    this.runBtn.addEventListener('click', () => {
      if (this.isRunning) {
        this.pauseSimulation();
      } else {
        this.startSimulation();
      }
    });

    // Reset button
    this.resetBtn.addEventListener('click', () => {
      this.resetSimulation();
    });
  }

  updateFluidicsUI() {
    if (this.flowRate === 'low') {
      this.streamWidthText.innerText = "Narrow (10 µm)";
      this.streamWidthText.style.color = "var(--accent-cyan)";
      this.coincidenceRateText.innerText = "Low (<0.1%)";
      this.coincidenceRateText.style.color = "var(--accent-green)";
      this.alignmentText.innerText = "Single File";
      this.alignmentText.style.color = "var(--accent-green)";
    } else if (this.flowRate === 'medium') {
      this.streamWidthText.innerText = "Medium (20 µm)";
      this.streamWidthText.style.color = "var(--accent-cyan)";
      this.coincidenceRateText.innerText = "Moderate (~2.0%)";
      this.coincidenceRateText.style.color = "var(--accent-green)";
      this.alignmentText.innerText = "Good Alignment";
      this.alignmentText.style.color = "var(--accent-green)";
    } else { // high
      this.streamWidthText.innerText = "Wide (40 µm)";
      this.streamWidthText.style.color = "var(--accent-orange)";
      this.coincidenceRateText.innerText = "High (~15.0%)";
      this.coincidenceRateText.style.color = "var(--accent-red)";
      this.alignmentText.innerText = "Multi-File / Doublets";
      this.alignmentText.style.color = "var(--accent-orange)";
    }
    this.updateWarningBanner();
  }

  updateWarningBanner() {
    const warningMsg = document.getElementById('sim-warning-msg');
    if (warningMsg) {
      if (this.flowRate === 'high' && (this.runSpeed === 'fast' || this.runSpeed === 'instant')) {
        warningMsg.style.display = 'block';
      } else {
        warningMsg.style.display = 'none';
      }
    }
  }

  // Load and generate the events based on active case
  resetSimulation() {
    this.pauseSimulation();
    this.currentIndex = 0;
    this.acquiredEvents = [];
    this.particles = [];
    this.flyingDots = [];
    this.oscPulse = null;
    this.flashAlpha = 0;
    this.plotsNeedRedraw = false;
    this.eventCountSpan.innerText = "0";
    
    // Read the selected runMode
    if (this.runModeSelect) {
      this.runMode = this.runModeSelect.value;
    }
    
    // Generate case synthetic events using definitions in data.js
    if (this.activeCase === 'aml') {
      this.eventsList = generateAMLCase();
    } else {
      this.eventsList = generateNormalCase();
    }
    
    // Set dynamic properties and adjust according to flow rate
    this.eventsList.forEach((e, idx) => {
      // Set timestamp Time parameter sequentially
      e.Time = (idx / 6000) * 1000 + (Math.random() - 0.5) * 5;
      
      // 1. Doublet manipulation based on flow rate
      if (this.flowRate === 'low' && e.type === 'Doublets') {
        // Convert doublets to T-cells to achieve <0.1% coincidence
        e.type = 'CD4_TCell';
        e.FSC_A = 350;
        e.SSC_A = 120;
        e.CD45 = 850;
        e.CD3 = 880;
        e.CD4 = 850;
        e.CD8 = 80;
        e.CD5 = 850;
        e.CD2 = 860;
        e.CD7 = 870;
        e.FSC_H = e.FSC_A * 0.98;
      } else if (this.flowRate === 'high') {
        // Convert some normal cells to doublets (~15% coincidence rate)
        if (Math.random() < 0.15 && e.type !== 'Debris' && e.type !== 'Doublets') {
          e.type = 'Doublets';
          e.FSC_H = e.FSC_A * (0.4 + Math.random() * 0.2); // Lower height relative to area
        }
      }

      // 2. Adjust parameters for CV spreads (precise focusing for Low, broader for High)
      const centroidInfo = populationCentroids[e.type] || { FSC_H_ratio: 0.95 };
      
      // Adjust all markers
      if (typeof MARKERS !== 'undefined') {
        MARKERS.forEach(marker => {
          if (marker === 'Time' || marker === 'FSC_H' || marker === 'type') return;
          
          let C = 80; // default baseline autofluorescence / background
          if (centroidInfo[marker] !== undefined) {
            C = centroidInfo[marker];
          }
          
          let V = e[marker];
          if (this.flowRate === 'low') {
            V = C + (V - C) * 0.4; // narrow CVs
          } else if (this.flowRate === 'high') {
            V = C + (V - C) * 1.6; // broader CVs (random noise spread)
          }
          e[marker] = Math.max(0, Math.min(1000, V));
        });
      }

      // Adjust FSC_H to maintain correlation with FSC_A
      const ratioMean = centroidInfo.FSC_H_ratio || 0.95;
      let currentRatio = e.FSC_H / e.FSC_A;
      if (isNaN(currentRatio) || !isFinite(currentRatio)) currentRatio = ratioMean;
      
      let finalRatio = currentRatio;
      if (this.flowRate === 'low') {
        finalRatio = ratioMean + (currentRatio - ratioMean) * 0.4;
      } else if (this.flowRate === 'high') {
        finalRatio = ratioMean + (currentRatio - ratioMean) * 1.6;
      }
      e.FSC_H = Math.max(0, Math.min(1000, e.FSC_A * finalRatio));
    });

    this.initFluidicsStreamlines();
    
    // Reset all plot canvases to blank slate grid
    this.redrawAllPlots();
    this.updateFocusedPlotView();
    
    this.runBtn.innerText = "Start Run";
    this.runBtn.style.backgroundColor = "var(--accent-cyan)";
    this.runBtn.style.color = "#020617";
    
    this.updateFluidicsUI();
  }

  initFluidicsStreamlines() {
    this.sheathLines = [];
    const count = 12;
    for (let i = 0; i < count; i++) {
      const isLeft = i < count / 2;
      const indexInCol = i % (count / 2);
      const fraction = indexInCol / (count / 2 - 1);
      
      this.sheathLines.push({
        xOffset: isLeft ? 15 + fraction * 70 : 380 - fraction * 70,
        y: Math.random() * 350,
        speed: 1.5 + Math.random() * 0.5,
        isLeft: isLeft
      });
    }
  }

  startSimulation() {
    if (this.currentIndex >= 6000) {
      this.resetSimulation();
    }
    this.isRunning = true;
    this.runBtn.innerText = "Pause Run";
    this.runBtn.style.backgroundColor = "var(--accent-orange)";
    this.runBtn.style.color = "#020617";
    
    this.animationLoop();
  }

  pauseSimulation() {
    this.isRunning = false;
    this.runBtn.innerText = "Resume Run";
    this.runBtn.style.backgroundColor = "var(--accent-cyan)";
    this.runBtn.style.color = "#020617";
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.drawInstrument();
    this.drawOscilloscope();
  }

  stopSimulation() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  animationLoop() {
    if (!this.isRunning) return;
    
    this.updateSimulation();
    this.drawInstrument();
    this.drawOscilloscope();
    
    this.animationFrameId = requestAnimationFrame(() => this.animationLoop());
  }

  updateSimulation() {
    // 1. Process Injecting Cells based on speed
    if (this.runMode === 'acquire') {
      if (this.currentIndex < 6000) {
        let injectCount = 0;
        
        if (this.runSpeed === 'slow') {
          if (this.particles.length === 0 && Math.random() < 0.08) {
            injectCount = 1;
          }
        } else if (this.runSpeed === 'medium') {
          injectCount = Math.random() < 0.15 ? 1 : 0;
        } else if (this.runSpeed === 'fast') {
          injectCount = 4 + Math.floor(Math.random() * 3);
        } else if (this.runSpeed === 'instant') {
          this.acquireRemainingInstantly();
          return;
        }
        
        for (let i = 0; i < injectCount; i++) {
          if (this.currentIndex >= 6000) break;
          
          const cellData = this.eventsList[this.currentIndex];
          this.injectCellParticle(cellData, this.currentIndex);
          this.currentIndex++;
        }
      } else if (this.particles.length === 0 && this.flyingDots.length === 0) {
        // Completed acquisition
        this.pauseSimulation();
        this.runBtn.innerText = "Finished";
        this.runBtn.style.backgroundColor = "var(--accent-green)";
        this.runBtn.style.color = "#ffffff";
        return;
      }
    } else {
      // Setup Mode: continuous loop
      if (this.currentIndex >= 6000) {
        this.currentIndex = 0;
      }
      
      let injectCount = 0;
      if (this.runSpeed === 'slow') {
        if (this.particles.length === 0 && Math.random() < 0.08) {
          injectCount = 1;
        }
      } else if (this.runSpeed === 'medium') {
        injectCount = Math.random() < 0.15 ? 1 : 0;
      } else if (this.runSpeed === 'fast') {
        injectCount = 4 + Math.floor(Math.random() * 3);
      } else if (this.runSpeed === 'instant') {
        this.acquireSetupInstantly();
        return;
      }
      
      for (let i = 0; i < injectCount; i++) {
        const cellData = this.eventsList[this.currentIndex];
        this.injectCellParticle(cellData, this.currentIndex);
        this.currentIndex = (this.currentIndex + 1) % 6000;
      }
    }

    // 2. Update Sheath streamlines
    this.sheathLines.forEach(line => {
      line.y += line.speed;
      if (line.y > 350) {
        line.y = 0;
      }
    });

    // 3. Update flowing cell particles
    const nozzleCenterY = 160;
    
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.y += p.speed;
      
      // Hydrodynamic compression physics simulation:
      let targetWidth = 12;
      if (this.flowRate === 'low') {
        targetWidth = 6;
      } else if (this.flowRate === 'medium') {
        targetWidth = 12;
      } else { // high
        targetWidth = 24;
      }
      
      if (p.y < nozzleCenterY) {
        const compressionFactor = p.y / nozzleCenterY; // 0 to 1
        const initialWidth = 90;
        const widthAtY = initialWidth - (initialWidth - targetWidth) * compressionFactor;
        
        p.x = 250 + p.startRatio * (widthAtY / 2);
      } else {
        p.x = 250 + p.startRatio * (targetWidth / 2);
      }
      
      // Laser interaction check (Blue laser at Y = 175)
      const laserY = 175;
      if (p.y >= laserY - 8 && p.y <= laserY + 8 && !p.excited) {
        p.excited = true;
        this.flashAlpha = 0.8;
        
        this.triggerOscilloscopePulse(p.data);
        p.laserHighlight = true;
      }
      
      if (p.excited && p.y > laserY + 12) {
        p.laserHighlight = false;
      }

      // Exit point: trigger fly-out dot to graphs
      if (p.y > 220) {
        this.particles.splice(i, 1);
        
        if (this.runSpeed === 'slow' || this.runSpeed === 'medium' || (this.runSpeed === 'fast' && Math.random() < 0.25)) {
          this.spawnFlyingDot(p);
        } else {
          this.plotEvent(p.data);
        }
      }
    }

    // 4. Update flying dots animation
    for (let i = this.flyingDots.length - 1; i >= 0; i--) {
      const dot = this.flyingDots[i];
      dot.progress += dot.speed;
      
      if (dot.progress >= 1.0) {
        this.plotEvent(dot.data);
        this.flyingDots.splice(i, 1);
      }
    }

    // Decay flash alpha
    if (this.flashAlpha > 0) {
      this.flashAlpha -= 0.08;
    }

    // Redraw plots once per frame in Setup Mode if modified
    if (this.plotsNeedRedraw) {
      this.redrawAllPlots();
      this.updateFocusedPlotView();
      this.plotsNeedRedraw = false;
    }
  }

  injectCellParticle(cellData, index) {
    const isDoublet = cellData.type === 'Doublets';
    const cellColor = this.getCellColor(cellData);
    
    let maxRatio = 0.5;
    if (this.flowRate === 'low') {
      maxRatio = 0.2;
    } else if (this.flowRate === 'medium') {
      maxRatio = 0.5;
    } else { // high
      maxRatio = 0.85;
    }
    const startRatio = (Math.random() - 0.5) * 2 * maxRatio;
    
    const speed = 3.5 + Math.random() * 0.8;
    
    if (isDoublet) {
      this.particles.push({
        x: 250,
        y: -10,
        startRatio: startRatio,
        speed: speed,
        color: cellColor,
        size: 5,
        excited: false,
        data: cellData,
        isDoubletPart: 1
      });
      this.particles.push({
        x: 250,
        y: -24,
        startRatio: startRatio + (Math.random() - 0.5) * 0.1,
        speed: speed,
        color: cellColor,
        size: 5.2,
        excited: false,
        data: cellData,
        isDoubletPart: 2
      });
    } else {
      this.particles.push({
        x: 250,
        y: 0,
        startRatio: startRatio,
        speed: speed,
        color: cellColor,
        size: cellData.type === 'Debris' ? 3 : 6,
        excited: false,
        data: cellData
      });
    }
  }

  spawnFlyingDot(p) {
    const config = SIM_TUBES[this.activeTube].plots[this.activePlotIdx];
    const valX = p.data[config.xAttr];
    const valY = p.data[config.yAttr];
    
    const padding = { top: 30, right: 30, bottom: 50, left: 60 };
    const width = 380;
    const height = 380;
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;
    
    let fracX = 0;
    if (config.xScale === 'log') {
      fracX = (Math.log10(Math.max(1, valX)) - 0) / 3;
    } else {
      fracX = valX / 1000;
    }
    
    let fracY = 0;
    if (config.yScale === 'log') {
      fracY = (Math.log10(Math.max(1, valY)) - 0) / 3;
    } else {
      fracY = valY / 1000;
    }
    
    const focusedRect = this.focusedCanvas.getBoundingClientRect();
    const instRect = this.instrumentCanvas.getBoundingClientRect();
    
    const fx = padding.left + fracX * plotWidth;
    const fy = height - padding.bottom - fracY * plotHeight;
    
    const targetScreenX = focusedRect.left + fx;
    const targetScreenY = focusedRect.top + fy;
    
    const pCanvasX = p.x;
    const pCanvasY = p.y;
    const startScreenX = instRect.left + pCanvasX;
    const startScreenY = instRect.top + pCanvasY;
    
    this.flyingDots.push({
      startX: startScreenX,
      startY: startScreenY,
      targetX: targetScreenX,
      targetY: targetScreenY,
      color: p.color,
      progress: 0,
      speed: 0.04 + Math.random() * 0.02,
      data: p.data
    });
  }

  plotEvent(eventData) {
    const activePlots = SIM_TUBES[this.activeTube].plots;
    if (this.runMode === 'setup') {
      this.acquiredEvents.push(eventData);
      if (this.acquiredEvents.length > 500) {
        this.acquiredEvents.shift();
        this.plotsNeedRedraw = true;
      } else {
        for (let i = 0; i < activePlots.length; i++) {
          if (this.thumbCanvases[i]) {
            this.drawEventOnCanvas(this.thumbCanvases[i], this.thumbCtxs[i], eventData, activePlots[i], true);
          }
        }
        const activeConfig = activePlots[this.activePlotIdx];
        this.drawEventOnCanvas(this.focusedCanvas, this.focusedCtx, eventData, activeConfig, false);
      }
      this.eventCountSpan.innerText = `${this.acquiredEvents.length} (Setup)`;
    } else {
      this.acquiredEvents.push(eventData);
      this.eventCountSpan.innerText = this.acquiredEvents.length.toString();
      
      for (let i = 0; i < activePlots.length; i++) {
        if (this.thumbCanvases[i]) {
          this.drawEventOnCanvas(this.thumbCanvases[i], this.thumbCtxs[i], eventData, activePlots[i], true);
        }
      }
      
      const activeConfig = activePlots[this.activePlotIdx];
      this.drawEventOnCanvas(this.focusedCanvas, this.focusedCtx, eventData, activeConfig, false);
    }
  }

  acquireRemainingInstantly() {
    this.stopSimulation();
    
    while (this.currentIndex < 6000) {
      this.acquiredEvents.push(this.eventsList[this.currentIndex]);
      this.currentIndex++;
    }
    
    this.eventCountSpan.innerText = this.acquiredEvents.length.toString();
    
    this.redrawAllPlots();
    this.updateFocusedPlotView();
    
    this.isRunning = false;
    this.runBtn.innerText = "Finished";
    this.runBtn.style.backgroundColor = "var(--accent-green)";
    this.runBtn.style.color = "#ffffff";
    
    this.drawInstrument();
    this.drawOscilloscope();
  }

  acquireSetupInstantly() {
    this.stopSimulation();
    this.acquiredEvents = [];
    for (let i = 0; i < 500; i++) {
      this.acquiredEvents.push(this.eventsList[i]);
    }
    this.currentIndex = 500;
    this.eventCountSpan.innerText = "500 (Setup)";
    
    this.redrawAllPlots();
    this.updateFocusedPlotView();
    
    this.isRunning = false;
    this.runBtn.innerText = "Finished";
    this.runBtn.style.backgroundColor = "var(--accent-green)";
    this.runBtn.style.color = "#ffffff";
    
    this.drawInstrument();
    this.drawOscilloscope();
  }

  drawEventOnCanvas(canvas, ctx, cell, config, isSmallMode) {
    const padding = isSmallMode 
      ? { top: 15, right: 12, bottom: 25, left: 35 }
      : { top: 30, right: 30, bottom: 50, left: 60 };
      
    const w = canvas.width;
    const h = canvas.height;
    const plotWidth = w - padding.left - padding.right;
    const plotHeight = h - padding.top - padding.bottom;
    
    const valX = cell[config.xAttr];
    const valY = cell[config.yAttr];
    
    let fracX = 0;
    if (config.xScale === 'log') {
      fracX = (Math.log10(Math.max(1, valX)) - 0) / 3;
    } else {
      fracX = valX / 1000;
    }
    
    let fracY = 0;
    if (config.yScale === 'log') {
      fracY = (Math.log10(Math.max(1, valY)) - 0) / 3;
    } else {
      fracY = valY / 1000;
    }
    
    const px = padding.left + fracX * plotWidth;
    const py = h - padding.bottom - fracY * plotHeight;
    
    if (px >= padding.left && px <= w - padding.right && py >= padding.top && py <= h - padding.bottom) {
      const color = this.getCellColor(cell);
      const dotSize = isSmallMode ? 1.0 : 1.5;
      
      ctx.fillStyle = color;
      ctx.fillRect(px - dotSize/2, py - dotSize/2, dotSize, dotSize);
    }
  }

  redrawPlotGrid(canvas, ctx, config, isSmallMode) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const padding = isSmallMode 
      ? { top: 15, right: 12, bottom: 25, left: 35 }
      : { top: 30, right: 30, bottom: 50, left: 60 };
      
    const w = canvas.width;
    const h = canvas.height;
    const plotWidth = w - padding.left - padding.right;
    const plotHeight = h - padding.top - padding.bottom;
    
    ctx.fillStyle = '#0b1329';
    ctx.fillRect(padding.left, padding.top, plotWidth, plotHeight);
    
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(padding.left, padding.top, plotWidth, plotHeight);
    
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.5)';
    ctx.lineWidth = 0.5;
    
    const gridDivisions = 4;
    for (let i = 1; i < gridDivisions; i++) {
      const fraction = i / gridDivisions;
      
      const gx = padding.left + fraction * plotWidth;
      ctx.beginPath();
      ctx.moveTo(gx, padding.top);
      ctx.lineTo(gx, h - padding.bottom);
      ctx.stroke();
      
      const gy = padding.top + fraction * plotHeight;
      ctx.beginPath();
      ctx.moveTo(padding.left, gy);
      ctx.lineTo(w - padding.right, gy);
      ctx.stroke();
    }
    
    ctx.fillStyle = '#94a3b8';
    ctx.font = isSmallMode ? '7px sans-serif' : '10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    if (config.xScale === 'log') {
      const decades = ["10⁰", "10¹", "10²", "10³"];
      decades.forEach((dec, idx) => {
        const fraction = idx / 3;
        const tx = padding.left + fraction * plotWidth;
        
        ctx.strokeStyle = '#1e293b';
        ctx.beginPath();
        ctx.moveTo(tx, h - padding.bottom);
        ctx.lineTo(tx, h - padding.bottom + 4);
        ctx.stroke();
        
        ctx.fillText(dec, tx, h - padding.bottom + 6);
      });
    } else {
      const labels = ["0", "250", "500", "750", "1K"];
      labels.forEach((lbl, idx) => {
        const fraction = idx / 4;
        const tx = padding.left + fraction * plotWidth;
        
        ctx.strokeStyle = '#1e293b';
        ctx.beginPath();
        ctx.moveTo(tx, h - padding.bottom);
        ctx.lineTo(tx, h - padding.bottom + 4);
        ctx.stroke();
        
        ctx.fillText(lbl, tx, h - padding.bottom + 6);
      });
    }
    
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    if (config.yScale === 'log') {
      const decades = ["10⁰", "10¹", "10²", "10³"];
      decades.forEach((dec, idx) => {
        const fraction = idx / 3;
        const ty = h - padding.bottom - fraction * plotHeight;
        
        ctx.strokeStyle = '#1e293b';
        ctx.beginPath();
        ctx.moveTo(padding.left, ty);
        ctx.lineTo(padding.left - 4, ty);
        ctx.stroke();
        
        ctx.fillText(dec, padding.left - 6, ty);
      });
    } else {
      const labels = ["0", "250", "500", "750", "1K"];
      labels.forEach((lbl, idx) => {
        const fraction = idx / 4;
        const ty = h - padding.bottom - fraction * plotHeight;
        
        ctx.strokeStyle = '#1e293b';
        ctx.beginPath();
        ctx.moveTo(padding.left, ty);
        ctx.lineTo(padding.left - 4, ty);
        ctx.stroke();
        
        ctx.fillText(lbl, padding.left - 6, ty);
      });
    }
    
    if (!isSmallMode) {
      ctx.fillStyle = 'var(--text-secondary)';
      ctx.font = 'bold 10px sans-serif';
      
      ctx.textAlign = 'center';
      ctx.fillText(config.xLabel, padding.left + plotWidth/2, h - 18);
      
      ctx.save();
      ctx.translate(15, padding.top + plotHeight/2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.fillText(config.yLabel, 0, 0);
      ctx.restore();
    }
    
    const len = this.acquiredEvents.length;
    ctx.save();
    ctx.beginPath();
    ctx.rect(padding.left, padding.top, plotWidth, plotHeight);
    ctx.clip();
    
    const dotSize = isSmallMode ? 1.0 : 1.5;
    const halfSize = dotSize / 2;
    
    const colorGroups = {};
    for (let k = 0; k < len; k++) {
      const cell = this.acquiredEvents[k];
      const valX = cell[config.xAttr];
      const valY = cell[config.yAttr];
      
      let fracX = 0;
      if (config.xScale === 'log') {
        fracX = (Math.log10(Math.max(1, valX)) - 0) / 3;
      } else {
        fracX = valX / 1000;
      }
      
      let fracY = 0;
      if (config.yScale === 'log') {
        fracY = (Math.log10(Math.max(1, valY)) - 0) / 3;
      } else {
        fracY = valY / 1000;
      }
      
      const px = padding.left + fracX * plotWidth;
      const py = h - padding.bottom - fracY * plotHeight;
      
      const color = this.getCellColor(cell);
      if (!colorGroups[color]) {
        colorGroups[color] = [];
      }
      colorGroups[color].push({ x: px, y: py });
    }
    
    for (const [color, pts] of Object.entries(colorGroups)) {
      ctx.fillStyle = color;
      const ptsLen = pts.length;
      for (let j = 0; j < ptsLen; j++) {
        const pt = pts[j];
        ctx.fillRect(pt.x - halfSize, pt.y - halfSize, dotSize, dotSize);
      }
    }
    ctx.restore();
  }

  redrawAllPlots() {
    const activePlots = SIM_TUBES[this.activeTube].plots;
    for (let i = 0; i < activePlots.length; i++) {
      if (this.thumbCanvases[i]) {
        this.redrawPlotGrid(this.thumbCanvases[i], this.thumbCtxs[i], activePlots[i], true);
      }
    }
  }

  updateFocusedPlotView() {
    const activePlots = SIM_TUBES[this.activeTube].plots;
    const config = activePlots[this.activePlotIdx];
    if (!config) return;
    this.focusedTitle.innerText = config.title;
    this.eduContent.innerHTML = config.edu;
    
    if (this.pulseLabelX) {
      this.pulseLabelX.innerText = `CH1 (${config.xAttr}):`;
    }
    if (this.pulseLabelY) {
      this.pulseLabelY.innerText = `CH2 (${config.yAttr}):`;
    }
    
    this.redrawPlotGrid(this.focusedCanvas, this.focusedCtx, config, false);
  }

  drawInstrument() {
    const ctx = this.instrumentCtx;
    const w = this.instrumentCanvas.width;
    const h = this.instrumentCanvas.height;
    
    ctx.clearRect(0, 0, w, h);
    
    ctx.fillStyle = '#060a16';
    ctx.fillRect(0, 0, w, h);
    
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.02)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 30) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 30) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    
    ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
    this.sheathLines.forEach(line => {
      ctx.fillRect(line.xOffset, line.y, 1.2, 10);
    });

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.lineWidth = 2.0;
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(56, 189, 248, 0.3)';
    
    ctx.beginPath();
    ctx.moveTo(150, 0);
    ctx.lineTo(200, 100);
    ctx.lineTo(240, 150);
    ctx.lineTo(240, 210);
    ctx.lineTo(210, 300);
    ctx.lineTo(210, h);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(350, 0);
    ctx.lineTo(300, 100);
    ctx.lineTo(260, 150);
    ctx.lineTo(260, 210);
    ctx.lineTo(290, 300);
    ctx.lineTo(290, h);
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(247, 0, 6, 70);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.strokeRect(247, 0, 6, 70);
    
    let halfWidth = 6;
    let streamColor = 'rgba(0, 229, 255, 0.35)';
    if (this.flowRate === 'low') {
      halfWidth = 3;
      streamColor = 'rgba(0, 229, 255, 0.2)';
    } else if (this.flowRate === 'medium') {
      halfWidth = 6;
      streamColor = 'rgba(0, 229, 255, 0.35)';
    } else { // high
      halfWidth = 12;
      streamColor = 'rgba(0, 229, 255, 0.55)';
    }
    
    ctx.fillStyle = streamColor;
    ctx.beginPath();
    ctx.moveTo(247, 70);
    ctx.lineTo(253, 70);
    ctx.lineTo(250 + halfWidth, 150);
    ctx.lineTo(250 + halfWidth, 230);
    ctx.lineTo(250 + halfWidth, h);
    ctx.lineTo(250 - halfWidth, h);
    ctx.lineTo(250 - halfWidth, 230);
    ctx.lineTo(250 - halfWidth, 150);
    ctx.closePath();
    ctx.fill();

    // 405 nm Violet Laser at Y = 145
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.7)';
    ctx.shadowColor = '#8b5cf6';
    ctx.shadowBlur = 6;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(50, 145);
    ctx.lineTo(450, 145);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#a78bfa';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText("405 nm Laser (Violet)", 60, 138);

    // 488 nm Blue Laser at Y = 175
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
    ctx.shadowColor = '#3b82f6';
    ctx.shadowBlur = 8;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(50, 175);
    ctx.lineTo(450, 175);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#60a5fa';
    ctx.fillText("488 nm Laser (Blue)", 60, 168);
    
    // 633 nm Red Laser at Y = 205
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 6;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(50, 205);
    ctx.lineTo(450, 205);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#f87171';
    ctx.fillText("633 nm Laser (Red)", 60, 218);
    
    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = p.excited ? 12 : 0;
      
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      
      if (p.laserHighlight) {
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1.2;
        
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + 35, p.y + 25);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + 60, p.y - 40);
        ctx.stroke();
        
        ctx.setLineDash([]);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '8px sans-serif';
        ctx.fillText("Scatter", p.x + 40, p.y - 25);
      }
    });
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(20, 135, 30, 80);
    ctx.strokeStyle = '#475569';
    ctx.strokeRect(20, 135, 30, 80);
    ctx.fillStyle = '#38bdf8';
    ctx.font = '8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("Lasers", 35, 178);
    
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(410, 135, 40, 80);
    ctx.strokeStyle = '#475569';
    ctx.strokeRect(410, 135, 40, 80);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText("Optical", 430, 172);
    ctx.fillText("Sensors", 430, 184);

    this.flyingDots.forEach(dot => {
      const instRect = this.instrumentCanvas.getBoundingClientRect();
      
      const screenX = dot.startX + (dot.targetX - dot.startX) * dot.progress;
      const screenY = dot.startY + (dot.targetY - dot.startY) * dot.progress;
      
      const localX = screenX - instRect.left;
      const localY = screenY - instRect.top;
      
      ctx.fillStyle = dot.color;
      ctx.shadowColor = dot.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(localX, localY, 3, 0, Math.PI*2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;
    
    if (this.flashAlpha > 0) {
      ctx.fillStyle = `rgba(59, 130, 246, ${this.flashAlpha * 0.15})`;
      ctx.fillRect(220, 135, 60, 80);
    }
  }

  triggerOscilloscopePulse(cellData) {
    const isDoublet = cellData.type === 'Doublets';
    const cellColor = this.getCellColor(cellData);
    
    const activePlots = SIM_TUBES[this.activeTube].plots;
    const config = activePlots[this.activePlotIdx];
    
    const xAttr = config ? config.xAttr : 'FSC_A';
    const yAttr = config ? config.yAttr : 'FSC_H';
    
    // Read actual values for X and Y channels from cellData
    let valX = cellData[xAttr];
    let valY = cellData[yAttr];
    
    if (valX === undefined) valX = 0;
    if (valY === undefined) valY = 0;
    
    // Calculate pulse width based on doublet status
    const baseW = isDoublet ? 85 : 42;
    
    // Format display strings and units
    let displayX = Math.round(valX);
    let displayY = Math.round(valY);
    
    const getUnit = (attr) => {
      if (attr === 'Time') return 's';
      if (attr.includes('FSC') || attr.includes('SSC')) return 'mV';
      return 'MFI';
    };
    
    const unitX = getUnit(xAttr);
    const unitY = getUnit(yAttr);
    
    if (xAttr === 'Time') {
      displayX = (valX / 100).toFixed(1); // Scale time down for visual clarity (e.g. 0 to 10.0s)
    }
    if (yAttr === 'Time') {
      displayY = (valY / 100).toFixed(1);
    }
    
    this.oscPulse = {
      xValue: valX,
      yValue: valY,
      xAttr: xAttr,
      yAttr: yAttr,
      width: baseW,
      color: cellColor,
      isDoublet: isDoublet,
      type: cellData.type
    };
    
    this.oscSweepX = 0;
    
    this.pulseHeightText.innerText = `${displayX} ${unitX}`;
    this.pulseAreaText.innerText = `${displayY} ${unitY}`;
    this.pulseWidthText.innerText = `${baseW} µs`;
    
    let displayType = cellData.type;
    if (displayType === 'CD4_TCell' || displayType === 'CD8_TCell' || displayType === 'gd_TCell') {
      displayType = 'T-Lymphocyte';
    } else if (displayType === 'BCell') {
      displayType = 'B-Lymphocyte';
    } else if (displayType === 'NKCell') {
      displayType = 'NK Cell';
    } else if (displayType === 'NormalProgenitor') {
      displayType = 'HSC Progenitor';
    } else if (displayType === 'AML_Blast') {
      displayType = 'Myeloid Blast';
    } else if (displayType === 'Doublets') {
      displayType = 'Doublet Aggregate';
    } else if (displayType === 'Debris') {
      displayType = 'Cell Debris';
    }
    
    this.pulseTypeText.innerText = displayType;
    this.pulseTypeText.style.color = cellColor;
    this.pulseTypeText.style.backgroundColor = 'rgba(255,255,255,0.05)';
  }

  drawOscilloscope() {
    const ctx = this.oscilloscopeCtx;
    const w = this.oscilloscopeCanvas.width;
    const h = this.oscilloscopeCanvas.height;
    
    ctx.clearRect(0, 0, w, h);
    
    // Draw background grid scanlines (very subtle)
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    
    if (this.oscPulse) {
      this.oscSweepX += 8;
      if (this.oscSweepX > w) {
        this.oscSweepX = w;
      }
      
      const pulseCenter = w / 2;
      
      // Helper function to draw a pulse trace
      const drawPulseTrace = (value, attr, strokeColor, shadowColor) => {
        ctx.strokeStyle = strokeColor;
        ctx.shadowColor = shadowColor;
        ctx.shadowBlur = 6;
        ctx.lineWidth = 2.0;
        
        ctx.beginPath();
        ctx.moveTo(0, h - 25);
        
        const peakHeightVal = (value / 1000) * (h - 45);
        
        for (let x = 0; x <= this.oscSweepX; x++) {
          let voltage = 0;
          if (attr === 'Time') {
            // Flat reference baseline for Time parameter
            voltage = 5;
          } else if (this.oscPulse.isDoublet) {
            const peak1 = pulseCenter - 22;
            const peak2 = pulseCenter + 22;
            const width1 = this.oscPulse.width * 0.45;
            const width2 = this.oscPulse.width * 0.45;
            
            const y1 = peakHeightVal * Math.exp(-Math.pow(x - peak1, 2) / (2 * Math.pow(width1, 2)));
            const y2 = (peakHeightVal * 0.85) * Math.exp(-Math.pow(x - peak2, 2) / (2 * Math.pow(width2, 2)));
            
            voltage = Math.max(y1, y2);
          } else {
            const width = this.oscPulse.width * 0.4;
            voltage = peakHeightVal * Math.exp(-Math.pow(x - pulseCenter, 2) / (2 * Math.pow(width, 2)));
          }
          
          ctx.lineTo(x, h - 25 - voltage);
        }
        ctx.stroke();
      };
      
      // Draw CH1 (X parameter) - Neon Cyan
      drawPulseTrace(this.oscPulse.xValue, this.oscPulse.xAttr, '#00e5ff', '#00e5ff');
      
      // Draw CH2 (Y parameter) - Neon Magenta
      drawPulseTrace(this.oscPulse.yValue, this.oscPulse.yAttr, '#ff007f', '#ff007f');
      
      // Reset canvas style
      ctx.shadowBlur = 0;
      
      // Draw dynamic labels on the canvas screen (top-left)
      ctx.font = '9px monospace';
      ctx.fillStyle = '#00e5ff';
      ctx.fillText(`CH1: ${this.oscPulse.xAttr}`, 8, 14);
      ctx.fillStyle = '#ff007f';
      ctx.fillText(`CH2: ${this.oscPulse.yAttr}`, 8, 26);
    } else {
      // Draw resting flat baselines for both channels
      ctx.lineWidth = 1.5;
      
      ctx.strokeStyle = '#00e5ff';
      ctx.beginPath();
      ctx.moveTo(0, h - 25);
      ctx.lineTo(w, h - 25);
      ctx.stroke();
      
      ctx.strokeStyle = '#ff007f';
      ctx.beginPath();
      ctx.moveTo(0, h - 23);
      ctx.lineTo(w, h - 23);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  }

  getCellColor(cell) {
    if (cell.type === 'BCell') return '#ff9800'; // orange
    if (cell.type === 'CD4_TCell' || cell.type === 'CD8_TCell' || cell.type === 'gd_TCell') return '#00e5ff'; // cyan
    if (cell.type === 'NKCell') return '#ff2a2a'; // red
    if (cell.type === 'Monocyte') return '#4caf50'; // green
    if (cell.type === 'Granulocyte') return '#2196f3'; // blue
    if (cell.type === 'AML_Blast') return '#9c27b0'; // purple
    if (cell.type === 'NormalProgenitor') return '#e040fb'; // pink
    if (cell.type === 'Doublets') return '#795548'; // brown
    if (cell.type === 'Debris') return '#334155'; // dark slate
    return '#94a3b8';
  }
}

// Global simulator reference
let flowCytometerSim = null;

// Initialize function that connects to app.js
function openFlowSimulatorPage(originCase) {
  // Show Simulator page
  const simView = document.getElementById('cytometer-simulator-view');
  simView.style.display = 'flex';
  
  if (!flowCytometerSim) {
    flowCytometerSim = new FlowCytometerSimulator();
  }
  
  // Align select case matching originCase
  let selectCaseValue = 'normal';
  if (originCase) {
    if (originCase.toLowerCase().includes('aml') || originCase === 'aml') {
      selectCaseValue = 'aml';
    } else if (originCase.toLowerCase().includes('compare') || originCase === 'compare') {
      selectCaseValue = 'normal';
    }
  }
  flowCytometerSim.caseSelect.value = selectCaseValue;
  flowCytometerSim.activeCase = selectCaseValue;
  
  flowCytometerSim.resetSimulation();
}
