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
  'AML_Blast_M0': { FSC_A: 450, SSC_A: 220, CD45: 410, FSC_H_ratio: 0.98, CD34: 840, CD117: 780, CD38: 760, HLA_DR: 750, CD33: 450, CD13: 400, CD7: 700, CD56: 650 },
  'AML_Blast_M1': { FSC_A: 460, SSC_A: 220, CD45: 410, FSC_H_ratio: 0.98, CD34: 840, CD117: 800, CD38: 760, HLA_DR: 780, CD33: 830, CD13: 750, CD7: 650 },
  'AML_Blast_M2': { FSC_A: 450, SSC_A: 220, CD45: 410, FSC_H_ratio: 0.98, CD34: 840, CD117: 780, CD38: 760, HLA_DR: 700, CD33: 750, CD13: 650, CD19: 720, CD56: 600 },
  'AML_Blast_M2_Maturing': { FSC_A: 650, SSC_A: 450, CD45: 520, FSC_H_ratio: 0.98, CD15: 750, CD11b: 680, CD16: 450, CD13: 750, CD33: 700, CD38: 700 },
  'AML_Blast_M3': { FSC_A: 680, SSC_A: 680, CD45: 420, FSC_H_ratio: 0.98, CD34: 80, CD117: 320, CD38: 680, HLA_DR: 80, CD33: 950, CD13: 650, CD64: 720, CD2: 620 },
  'AML_Blast_M4_Blast': { FSC_A: 450, SSC_A: 220, CD45: 410, FSC_H_ratio: 0.98, CD34: 840, CD117: 780, CD38: 760, HLA_DR: 700, CD33: 750, CD13: 680 },
  'AML_Blast_M4_Mono': { FSC_A: 640, SSC_A: 350, CD45: 650, FSC_H_ratio: 0.98, CD34: 120, CD117: 100, CD38: 800, HLA_DR: 850, CD33: 900, CD13: 720, CD11b: 780, CD14: 750, CD64: 850, CD4: 450 },
  'AML_Blast_M5': { FSC_A: 680, SSC_A: 340, CD45: 580, FSC_H_ratio: 0.98, CD34: 120, CD117: 80, CD38: 820, HLA_DR: 900, CD33: 940, CD13: 600, CD11b: 720, CD14: 300, CD64: 880, CD4: 480, CD15: 450, CD56: 720 },
  'AML_Blast_M6_Erythroid': { FSC_A: 280, SSC_A: 130, CD45: 60, FSC_H_ratio: 0.98, CD117: 550, CD38: 800 },
  'AML_Blast_M6_Blast': { FSC_A: 450, SSC_A: 220, CD45: 410, FSC_H_ratio: 0.98, CD34: 840, CD117: 780, CD38: 760, HLA_DR: 750, CD13: 650, CD33: 700 },
  'AML_Blast_M7': { FSC_A: 500, SSC_A: 240, CD45: 410, FSC_H_ratio: 0.98, CD34: 550, CD117: 620, CD38: 750, HLA_DR: 120, CD13: 420, CD33: 480, CD56: 740 },
  'NormalProgenitor': { FSC_A: 400, SSC_A: 220, CD45: 420, FSC_H_ratio: 0.98 }
};

/* --------------------------------------------------------------------------
   Physical constants behind the schematic and the oscilloscope.

   Figures are typical of a clinical benchtop analyser with a cuvette flow
   cell (Beckman Coulter Navios / BD FACSCanto class instruments).
   -------------------------------------------------------------------------- */
const SIM_PHYSICS = {
  coreVelocityMps: 6.0,          // core stream velocity through the flow cell
  coreVelocityUmPerUs: 6.0,      // 6 m/s == 6 µm per µs
  beamHeightUm: 10,              // 488 nm waist along the flow axis
  beamWidthUm: 84,               // 488 nm waist across the stream
  beamSpacingUm: 125,            // pinhole separation between the three beams
  get laserDelayUs() { return this.beamSpacingUm / this.coreVelocityUmPerUs; },
  coreWidthUm: { low: 10, medium: 20, high: 40 },
  minCellUm: 2,                  // FSC 0    -> smallest debris
  maxCellUm: 20,                 // FSC 1000 -> largest granulocyte
  thresholdChannel: 30,          // FSC trigger threshold, in channels
  adcMHz: 10,                    // digitisation rate (100 ns per sample)
  scopeWindowUs: 16,             // oscilloscope time base
  scopeDivUs: 2,                 // one grid division
  // Detectors on the 90 degree arm. laser indexes into the beam list.
  channels: [
    { name: 'SSC', filter: '488/10', laser: 1, rgb: '34, 211, 238' },
    { name: 'FITC', filter: '525/40', laser: 1, rgb: '74, 222, 128' },
    { name: 'PE', filter: '575/26', laser: 1, rgb: '250, 204, 21' },
    { name: 'APC', filter: '660/20', laser: 2, rgb: '248, 113, 113' },
    { name: 'PB', filter: '450/50', laser: 0, rgb: '129, 140, 248' }
  ]
};

/* ====================================================================
   Component teaching notes.

   Every clickable part of the schematic has an entry here: what it is,
   why it matters at the bench, and (where useful) a question the
   identify-mode quiz can ask about it. Per-channel entries for the
   dichroics and PMTs are generated from SIM_PHYSICS.channels.
   ==================================================================== */
const SIM_COMPONENTS = {
  'sample-probe': {
    name: 'Sample injection probe',
    sub: 'stained cell suspension in',
    what: 'Draws the stained suspension out of the tube and injects it into the centre of the sheath stream.',
    why: 'Every clog, carry-over and bubble problem starts here. A partially blocked probe shows up as a falling event rate and an unstable time plot, which is why the backflush and daily clean cycles exist.',
    quiz: 'Which part draws the stained cell suspension into the instrument?'
  },
  'sheath-inlet': {
    name: 'Sheath fluid inlet',
    sub: 'isotonic buffer under pressure',
    what: 'Pressurised isotonic sheath fluid enters and surrounds the sample stream.',
    why: 'The sheath-to-sample pressure difference is what creates hydrodynamic focusing. A low sheath tank or air in the line destabilises the core — noisy time plots, broad CVs and drifting scatter.',
    quiz: 'Where does the pressurised isotonic sheath fluid enter the instrument?'
  },
  'nozzle': {
    name: 'Nozzle taper',
    sub: 'hydrodynamic focusing',
    what: 'The converging channel where laminar sheath flow squeezes the sample into a thin central core.',
    why: 'This is what puts cells in single file so only one is interrogated at a time. Without it you measure clumps, not cells.',
    quiz: 'Which part hydrodynamically focuses the sample into single file?'
  },
  'core-stream': {
    name: 'Sample core stream',
    sub: 'width set by the flow rate',
    what: 'The thin ribbon of sample fluid running down the centre of the sheath, 10 µm wide on Low and 40 µm on High.',
    why: 'Core width is the single control you have over data quality: narrow core = cells cross the same part of the beam = tight CVs and almost no doublets. Widening it for speed costs you resolution and adds coincidence.',
    quiz: 'Click the sample core stream, whose width the flow-rate setting controls.'
  },
  'flow-cell': {
    name: 'Quartz flow cell',
    sub: 'square bore, gel-coupled',
    what: 'A precision quartz cuvette with a square bore; the collection lens is optically coupled to its outer wall.',
    why: 'A fixed, enclosed cuvette collects far more light than a stream-in-air design, so an analyser like this is more sensitive for dim antigens. It also fixes the interrogation point, so alignment stays stable between runs.',
    quiz: 'Click the gel-coupled quartz cuvette the focused stream passes through.'
  },
  'interrogation-point': {
    name: 'Interrogation point',
    sub: 'beam × core intersection',
    what: 'Where the focused beam crosses the core stream. Each cell spends only a few microseconds here.',
    why: 'Everything you ever plot is generated in this spot. Alignment and beam shape here set your CVs, and the pulse height, area and width all come from this single transit.',
    quiz: 'Where in the instrument is every measurement actually made?'
  },
  'waste': {
    name: 'Waste line',
    sub: 'cells leave the fluidics',
    what: 'Carries the interrogated cells and sheath to the waste container.',
    why: 'On an analyser the cells are destroyed, not recovered — this is the difference from a sorter. It also means the waste is clinical material and the tank level is part of the daily start-up check.',
    quiz: 'Where do cells go after interrogation on an analyser (rather than a sorter)?'
  },
  'lasers': {
    name: 'Laser bench',
    sub: '405 nm · 488 nm · 638 nm',
    what: 'Three solid-state lasers, spatially separated so their beams cross the stream at different heights.',
    why: 'Your panel design starts here: every fluorochrome must be excited by a laser you actually have. Separating the beams stops one laser exciting another\'s dyes, at the cost of needing laser-delay compensation.',
    quiz: 'Which assembly generates the three excitation wavelengths?'
  },
  'focusing-lens': {
    name: 'Beam-shaping lens',
    sub: 'elliptical waist at the core',
    what: 'Crossed cylindrical lenses squeeze the round beam into a wide, flat ellipse (84 × 10 µm) at the stream.',
    why: 'Making the beam much wider than the core means a cell that wanders sideways still sees the same light intensity. That is what keeps the CV low, and why beam shape matters as much as beam power.',
    quiz: 'Which optic shapes the beam into a wide elliptical waist for even illumination?'
  },
  'beam-0': {
    name: '405 nm violet beam',
    sub: 'excites PB, KRO',
    what: 'The violet excitation beam, crossing the stream above the other two.',
    why: 'The violet detectors sit clear of the crowded blue-laser dyes, which is why the markers you must call confidently — CD45 for gating, CD3 and CD19 for lineage — are parked here.',
    quiz: 'Which beam excites Pacific Blue and Krome Orange?'
  },
  'beam-1': {
    name: '488 nm blue beam',
    sub: 'scatter + FITC, PE, PC5.5, PC7',
    what: 'The blue excitation beam. This is the scatter laser: FSC and SSC are both measured from it.',
    why: 'The workhorse line. It drives the FSC threshold that decides what counts as an event at all, and excites the crowded FITC/PE/PC5.5/PC7 stack where most of your compensation work lives.',
    quiz: 'Which beam produces FSC and SSC, and excites FITC, PE, PC5.5 and PC7?'
  },
  'beam-2': {
    name: '638 nm red beam',
    sub: 'excites APC, APC-A700, APC-A750',
    what: 'The red excitation beam, crossing the stream below the other two.',
    why: 'The APC family sits here with little spectral competition, so the red line is where dim or low-density antigens are best placed.',
    quiz: 'Which beam excites APC, APC-A700 and APC-A750?'
  },
  'beam-dump': {
    name: 'Beam dump',
    sub: 'absorbs the unscattered beam',
    what: 'A blackened trap that swallows each beam after it has crossed the stream.',
    why: 'Stray laser light reaching the detectors would raise the background on every channel. Keeping the noise floor low is what lets you resolve a dim positive from a negative.',
    quiz: 'Which component absorbs the unscattered beam so stray light cannot reach the detectors?'
  },
  'obscuration-bar': {
    name: 'Obscuration bar',
    sub: 'blocks the direct beam',
    what: 'A metal blocker sitting on the optical axis, shadowing the FSC diode from the intact beam.',
    why: 'It defines what FSC actually is: only light scattered out at roughly 0.5–10° gets past. Without it the direct beam would saturate — and eventually damage — the diode.',
    quiz: 'Which part blocks the direct beam and sets the 0.5–10° FSC collection angle?'
  },
  'fsc-detector': {
    name: 'FSC photodiode',
    sub: '0.5–10° forward scatter',
    what: 'A photodiode measuring light diffracted forwards, broadly proportional to cell size and refractive index.',
    why: 'FSC is normally the trigger parameter — the threshold set here decides what the instrument even records, and is how you keep platelets and debris out of the file. It is also half of the FSC-A/FSC-H doublet check.',
    quiz: 'Which detector reports cell size and normally carries the trigger threshold?'
  },
  'collection-lens': {
    name: '90° collection lens',
    sub: 'gel-coupled to the flow cell',
    what: 'A high-numerical-aperture lens gathering side scatter and fluorescence at right angles to the beam.',
    why: 'Collecting at 90° keeps the blinding direct beam out of the fluorescence path. How much light this lens gathers sets the sensitivity of every fluorescence channel behind it.',
    quiz: 'Which optic collects side scatter and fluorescence at 90° to the beam?'
  },
  'adc': {
    name: 'Preamp, ADC & list-mode file',
    sub: '10 MHz digitisation',
    what: 'Detector current is amplified and digitised, and each pulse is reduced to height, area and width per channel — one row per event.',
    why: 'Nothing on your plots is a photograph of a cell; it is arithmetic done here. FSC-A vs FSC-H doublet exclusion, compensation and every gate are applied to these numbers.',
    quiz: 'Where are pulse height, area and width digitised into the list-mode file?'
  }
};

// Per-channel notes for the 90° arm.
const SIM_CHANNEL_NOTES = {
  SSC: {
    what: 'Side scatter: 488 nm light scattered by internal structure, read through a narrow 488/10 filter.',
    why: 'SSC reports granularity and nuclear complexity — it is what separates lymphocytes, monocytes and granulocytes on the CD45/SSC plot, and what makes the blast gate possible.',
    quiz: 'Which detector reports internal complexity and granularity?'
  },
  FITC: { what: 'Green fluorescence collected through a 525/40 bandpass filter.', why: 'FITC is bright but has heavy spillover into PE, so it drives a large part of your compensation matrix.' },
  PE: { what: 'Yellow-orange fluorescence collected through a 575/26 bandpass filter.', why: 'PE is the brightest common conjugate — reserve it for the dimmest antigen in a panel.' },
  APC: { what: 'Far-red fluorescence from the 638 nm laser, through a 660/20 bandpass filter.', why: 'Little spectral competition on the red line, so APC channels are the natural home for dim markers like CD34.' },
  PB: { what: 'Blue fluorescence from the 405 nm laser, through a 450/50 bandpass filter.', why: 'A clean channel with very little spillover in from other dyes, so a PB positive can be trusted with minimal compensation argument.' }
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
    this.dataPulses = [];   // events travelling out to the list-mode file
    this.oscPulse = null;   // pulse currently on the screen
    this.oscSweep = 0;      // 0 -> 1 as the trace is swept out
    this.oscGhosts = [];    // phosphor persistence of recent events

    // Per-beam and per-detector highlight levels, decayed each frame.
    this.beamFlash = [0, 0, 0];
    this.detectorFlash = { fsc: 0, ssc: 0, pmt: [0, 0, 0, 0, 0] };
    this._layout = null;    // cached instrument geometry

    // Clickable schematic: hovered / selected component, and quiz state.
    this._hotspots = null;
    this._hotspotsKey = '';
    this.hoverSpot = null;
    this.selectedSpot = null;
    this.quiz = null;

    this.initElements();
    this.initCanvases();
    this.renderSidebarThumbnails();
    this.initEventListeners();
    this.initInstrumentInteraction();
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
    this.velocityText = document.getElementById('sim-velocity-text');

    // Oscilloscope text readouts
    this.pulseHeightText = document.getElementById('sim-pulse-height');
    this.pulseAreaText = document.getElementById('sim-pulse-area');
    this.pulseWidthText = document.getElementById('sim-pulse-width');
    this.pulseRatioText = document.getElementById('sim-pulse-ratio');
    this.pulseTypeText = document.getElementById('sim-pulse-type');
    this.pulseNoteText = document.getElementById('sim-pulse-note');
    this.pulseLabelX = document.getElementById('sim-pulse-label-x');
    this.pulseLabelY = document.getElementById('sim-pulse-label-y');

    // Component explorer / identify quiz
    this.componentPanel = document.getElementById('sim-component-panel');
    this.componentName = document.getElementById('sim-component-name');
    this.componentSub = document.getElementById('sim-component-sub');
    this.componentWhat = document.getElementById('sim-component-what');
    this.componentWhy = document.getElementById('sim-component-why');
    this.componentMarkers = document.getElementById('sim-component-markers');
    this.componentCloseBtn = document.getElementById('sim-component-close');
    this.quizBar = document.getElementById('sim-quiz-bar');
    this.quizPrompt = document.getElementById('sim-quiz-prompt');
    this.quizFeedback = document.getElementById('sim-quiz-feedback');
    this.quizScore = document.getElementById('sim-quiz-score');
    this.quizStartBtn = document.getElementById('sim-quiz-btn');
    this.quizSkipBtn = document.getElementById('sim-quiz-skip');
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

    // The focused plot is laid out by CSS, so repaint it whenever its box
    // changes — opening the sidebar or resizing alters its pixel dimensions.
    this.observeResize(this.focusedCanvas, () => this.updateFocusedPlotView());

    window.addEventListener('resize', () => {
      this._layout = null;
      if (this.viewContainer && this.viewContainer.style.display !== 'none') {
        this.drawInstrument();
        this.drawOscilloscope();
      }
    });
  }

  // Repaint on layout changes, coalesced to one call per frame.
  observeResize(element, callback) {
    if (!element || typeof ResizeObserver === 'undefined') return null;
    let pending = false;
    const ro = new ResizeObserver(() => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => { pending = false; callback(); });
    });
    ro.observe(element);
    return ro;
  }

  // Size a canvas to its CSS box at device-pixel resolution and return the
  // logical (CSS pixel) size, so 1 drawing unit == 1 CSS pixel.
  fitCanvas(canvas, ctx, minW, minH) {
    const rect = canvas.getBoundingClientRect();
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);
    if (w < (minW || 60) || h < (minH || 40)) return null; // hidden or not laid out yet
    const dpr = window.devicePixelRatio || 1;
    const bw = Math.round(w * dpr), bh = Math.round(h * dpr);
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Remembered so the incremental per-event draws use the same coordinates.
    canvas._logicalW = w;
    canvas._logicalH = h;
    return { w: w, h: h };
  }

  // Logical size established by the last fitCanvas, or null if never laid out.
  logicalSize(canvas) {
    return canvas._logicalW ? { w: canvas._logicalW, h: canvas._logicalH } : null;
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
          <canvas id="sim-canvas-thumb-${idx}" style="width: 100%; aspect-ratio: 168 / 130; display: block; background-color: #020617; border-radius: 4px;"></canvas>
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

    // These are rebuilt on every tube change, so re-attach the observer that
    // repaints them once the panel actually has a width (it is zero-sized
    // while the sidebar is closed).
    if (this.thumbResizeObserver) this.thumbResizeObserver.disconnect();
    this.thumbResizeObserver = this.observeResize(this.thumbCanvases[0], () => this.redrawAllPlots());


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

    // Flow Rate Select — the core width sets the coincidence rate, so the
    // event list has to be regenerated rather than just relabelled.
    this.flowRateSelect.addEventListener('change', (e) => {
      this.flowRate = e.target.value;
      this.resetSimulation();
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
    const P = SIM_PHYSICS;
    const um = P.coreWidthUm[this.flowRate];

    if (this.velocityText) this.velocityText.innerText = `${P.coreVelocityMps.toFixed(1)} m/s`;

    if (this.flowRate === 'low') {
      this.streamWidthText.innerText = `Narrow (${um} µm)`;
      this.streamWidthText.style.color = "var(--accent-cyan)";
      this.coincidenceRateText.innerText = "Low (<0.1%)";
      this.coincidenceRateText.style.color = "var(--accent-green)";
      this.alignmentText.innerText = "Single file";
      this.alignmentText.style.color = "var(--accent-green)";
    } else if (this.flowRate === 'medium') {
      this.streamWidthText.innerText = `Medium (${um} µm)`;
      this.streamWidthText.style.color = "var(--accent-cyan)";
      this.coincidenceRateText.innerText = "Moderate (~2%)";
      this.coincidenceRateText.style.color = "var(--accent-green)";
      this.alignmentText.innerText = "Good alignment";
      this.alignmentText.style.color = "var(--accent-green)";
    } else { // high
      this.streamWidthText.innerText = `Wide (${um} µm)`;
      this.streamWidthText.style.color = "var(--accent-orange)";
      this.coincidenceRateText.innerText = "High (~15%)";
      this.coincidenceRateText.style.color = "var(--accent-red)";
      this.alignmentText.innerText = "Off-axis / doublets";
      this.alignmentText.style.color = "var(--accent-orange)";
    }
    this._layout = null; // core width changed, so the schematic must re-measure
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
    this.dataPulses = [];
    this.oscPulse = null;
    this.oscSweep = 0;
    this.oscGhosts = [];
    this.beamFlash = [0, 0, 0];
    this.detectorFlash = { fsc: 0, ssc: 0, pmt: [0, 0, 0, 0, 0] };
    this.plotsNeedRedraw = false;
    this.eventCountSpan.innerText = "0";

    if (this.pulseHeightText) this.pulseHeightText.innerText = '-';
    if (this.pulseAreaText) this.pulseAreaText.innerText = '-';
    if (this.pulseWidthText) this.pulseWidthText.innerText = '-';
    if (this.pulseRatioText) {
      this.pulseRatioText.innerText = '-';
      this.pulseRatioText.style.color = 'var(--text-primary)';
    }
    if (this.pulseTypeText) {
      this.pulseTypeText.innerText = 'No Event';
      this.pulseTypeText.style.color = 'var(--text-muted)';
    }
    if (this.pulseNoteText) {
      this.pulseNoteText.innerText =
        'Start the run. The trace is the raw detector voltage as one cell crosses the 488 nm beam.';
    }
    
    // Read the selected runMode
    if (this.runModeSelect) {
      this.runMode = this.runModeSelect.value;
    }
    
    // Generate case synthetic events using definitions in data.js
    if (this.activeCase === 'normal') {
      this.eventsList = generateNormalCase();
    } else if (this.activeCase === 'aml') {
      this.eventsList = generateAMLCase();
    } else if (this.activeCase.startsWith('aml_m')) {
      this.eventsList = generateAMLSubtypeCase(this.activeCase);
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
        // Convert some normal cells to doublets (~15% coincidence rate).
        // Two cells cross the beam together, so the pulse area roughly doubles
        // while the peak height barely changes — FSC-H drops to about half of
        // FSC-A and the event falls below the singlet diagonal.
        if (Math.random() < 0.15 && e.type !== 'Debris' && e.type !== 'Doublets') {
          e.type = 'Doublets';
          e.FSC_A = Math.min(1000, e.FSC_A * (1.7 + Math.random() * 0.5));
          e.SSC_A = Math.min(1000, e.SSC_A * (1.6 + Math.random() * 0.5));
          e.FSC_H = e.FSC_A * (0.45 + Math.random() * 0.15);
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
      // A pulse can never be taller than its own area allows, so FSC-H cannot
      // exceed FSC-A. Without this clamp the widened high-flow CVs push events
      // above the singlet diagonal, which no real instrument produces.
      finalRatio = Math.max(0.2, Math.min(1.0, finalRatio));
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
    const count = 22;
    for (let i = 0; i < count; i++) {
      // Fractional offset across the channel; laminar flow keeps each
      // streamline at its own radius all the way down.
      const frac = -1 + 2 * (i / (count - 1));
      this.sheathLines.push({
        frac: frac * 0.92,
        y: Math.random() * 600,
        // Parabolic velocity profile: fastest in the middle, slowest at the wall.
        speed: 0.9 + 1.9 * (1 - frac * frac)
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
    this.dataPulses = [];
  }

  animationLoop() {
    if (!this.isRunning) return;

    // The schematic geometry drives the particle physics, so measure it first.
    this.ensureLayout();
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
      } else if (this.particles.length === 0) {
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

    // 3. Update flowing cell particles through the flow cell
    const L = this._layout;
    if (!L) return;

    const coreHalf = this.coreHalfWidthPx(L);
    const P = SIM_PHYSICS;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.y += p.speed;

      // Hydrodynamic focusing: the core is squeezed from the funnel width
      // down to its final diameter by the time it reaches the flow cell.
      if (p.y < L.yCellTop) {
        const t = Math.max(0, p.y / L.yCellTop);
        const halfAtY = L.funnelHalf + (coreHalf - L.funnelHalf) * t;
        p.x = L.AX + p.startRatio * halfAtY;
      } else {
        p.x = L.AX + p.startRatio * coreHalf;
      }

      // Interrogation: each spatially separated beam is crossed in turn.
      L.beams.forEach((b, bi) => {
        if (p.hits[bi]) return;
        if (p.y < b.y - p.size || p.y > b.y + p.size) return;
        p.hits[bi] = true;
        p.glow = 1;
        p.glowColor = b.color;
        this.beamFlash[bi] = 1;

        if (bi === L.scatterBeam && !p.silent) {
          // The 488 nm beam is the scatter laser: it drives FSC and SSC.
          this.detectorFlash.fsc = 1;
          this.detectorFlash.ssc = 1;
          this.triggerOscilloscopePulse(p.data);
        }
        // Every beam lights the PMTs that sit behind its own filters.
        P.channels.forEach((chan, ci) => {
          if (chan.laser === bi) this.detectorFlash.pmt[ci] = 1;
        });
      });

      if (p.glow > 0) p.glow = Math.max(0, p.glow - 0.06);

      // Leaving the flow cell: the event is either recorded or rejected.
      if (p.y > L.yCellBot) {
        this.particles.splice(i, 1);
        if (p.silent) continue;

        const fscH = p.data.FSC_H || p.data.FSC_A || 0;
        if (fscH < P.thresholdChannel) continue; // below trigger — never recorded

        this.plotEvent(p.data);
        if (this.runSpeed !== 'fast') this.emitDataPulse(p.color);
      }
    }

    // Decay the beam and detector highlights.
    for (let i = 0; i < this.beamFlash.length; i++) {
      if (this.beamFlash[i] > 0) this.beamFlash[i] = Math.max(0, this.beamFlash[i] - 0.09);
    }
    this.detectorFlash.fsc = Math.max(0, this.detectorFlash.fsc - 0.06);
    this.detectorFlash.ssc = Math.max(0, this.detectorFlash.ssc - 0.06);
    for (let i = 0; i < this.detectorFlash.pmt.length; i++) {
      this.detectorFlash.pmt[i] = Math.max(0, this.detectorFlash.pmt[i] - 0.05);
    }

    // Age the oscilloscope persistence ghosts.
    this.oscGhosts.forEach(g => { g.age++; });

    // 4. Advance the pulses running down the data path to the list-mode file.
    for (let i = this.dataPulses.length - 1; i >= 0; i--) {
      this.dataPulses[i].t += 0.045;
      if (this.dataPulses[i].t >= 1) this.dataPulses.splice(i, 1);
    }

    // Redraw plots once per frame in Setup Mode if modified
    if (this.plotsNeedRedraw) {
      this.redrawAllPlots();
      this.updateFocusedPlotView();
      this.plotsNeedRedraw = false;
    }
  }

  injectCellParticle(cellData, index) {
    const L = this._layout;
    if (!L) return;

    const isDoublet = cellData.type === 'Doublets';
    const cellColor = this.getCellColor(cellData);

    // Wider core -> cells can sit further off-axis and can travel side by side.
    const spread = SIM_PHYSICS.coreWidthUm[this.flowRate] / 80;
    const startRatio = (Math.random() - 0.5) * 2 * spread;

    // Slow motion actually slows the cell down so the trainee can follow it.
    const base = this.runSpeed === 'slow' ? 1.1 : 3.6;
    const speed = base + Math.random() * base * 0.2;

    const size = cellData.type === 'Debris' ? 2.5
      : 3 + (Math.min(1000, cellData.FSC_A || 300) / 1000) * 4;

    const make = (yOff, sizeAdj, ratioAdj) => ({
      x: L.AX,
      y: -12 + yOff,
      startRatio: startRatio + ratioAdj,
      speed: speed,
      color: cellColor,
      size: size + sizeAdj,
      data: cellData,
      hits: [false, false, false],
      glow: 0,
      glowColor: cellColor,
      plotted: false
    });

    if (isDoublet) {
      // Two cells in contact — the pair triggers one event.
      const lead = make(0, 0, 0);
      const trail = make(-size * 1.9, 0.2, (Math.random() - 0.5) * 0.04);
      trail.silent = true; // only the leading cell fires the electronics
      this.particles.push(lead, trail);
    } else {
      this.particles.push(make(0, 0, 0));
    }
  }

  // Pulse of light travelling out along the data path when an event is stored.
  emitDataPulse(color) {
    this.dataPulses.push({ t: 0, color: color });
    if (this.dataPulses.length > 12) this.dataPulses.shift();
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
      const ev = this.eventsList[this.currentIndex];
      // Sub-threshold events never open a data window, so they are not stored.
      if ((ev.FSC_H || ev.FSC_A || 0) >= SIM_PHYSICS.thresholdChannel) {
        this.acquiredEvents.push(ev);
      }
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
      const ev = this.eventsList[i];
      // Sub-threshold events never open a data window, so they are not stored.
      if ((ev.FSC_H || ev.FSC_A || 0) >= SIM_PHYSICS.thresholdChannel) {
        this.acquiredEvents.push(ev);
      }
    }
    this.currentIndex = 500;
    this.eventCountSpan.innerText = `${this.acquiredEvents.length} (Setup)`;
    
    this.redrawAllPlots();
    this.updateFocusedPlotView();
    
    this.isRunning = false;
    this.runBtn.innerText = "Finished";
    this.runBtn.style.backgroundColor = "var(--accent-green)";
    this.runBtn.style.color = "#ffffff";
    
    this.drawInstrument();
    this.drawOscilloscope();
  }

  /* Axis gutters, type size and dot size all scale with the canvas, so a
     thumbnail and the focused plot keep the same proportions no matter what
     pixel size the layout gives them. Both draw paths must agree on this or
     the incremental per-event dots would land off the grid. */
  plotMetrics(w, isSmallMode) {
    const k = Math.max(1, w / (isSmallMode ? 168 : 380));
    const base = isSmallMode
      ? { top: 15, right: 12, bottom: 25, left: 35 }
      : { top: 30, right: 30, bottom: 50, left: 60 };
    return {
      k: k,
      padding: {
        top: base.top * k, right: base.right * k,
        bottom: base.bottom * k, left: base.left * k
      },
      tickFont: `${(isSmallMode ? 7 : 10) * k}px ${isSmallMode ? 'sans-serif' : 'monospace'}`,
      axisFont: `bold ${10 * k}px sans-serif`,
      tick: 4 * k,
      gap: 6 * k,
      dotSize: (isSmallMode ? 1.0 : 1.5) * k
    };
  }

  drawEventOnCanvas(canvas, ctx, cell, config, isSmallMode) {
    // Drawn on top of the existing image, so never resize here — reuse the
    // coordinate space the last full redraw established.
    const size = this.logicalSize(canvas);
    if (!size) return;
    const w = size.w;
    const h = size.h;
    const m = this.plotMetrics(w, isSmallMode);
    const padding = m.padding;
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
      ctx.fillStyle = this.getCellColor(cell);
      ctx.fillRect(px - m.dotSize / 2, py - m.dotSize / 2, m.dotSize, m.dotSize);
    }
  }

  redrawPlotGrid(canvas, ctx, config, isSmallMode) {
    // Full repaint, so this is the moment to match the backing store to the
    // canvas's real pixel size — otherwise the browser upscales a small
    // bitmap and the plot looks soft.
    const size = this.fitCanvas(canvas, ctx, 40, 30);
    if (!size) return;
    const w = size.w;
    const h = size.h;
    ctx.clearRect(0, 0, w, h);

    const m = this.plotMetrics(w, isSmallMode);
    const padding = m.padding;

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
    ctx.font = m.tickFont;
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
        ctx.lineTo(tx, h - padding.bottom + m.tick);
        ctx.stroke();
        
        ctx.fillText(dec, tx, h - padding.bottom + m.gap);
      });
    } else {
      const labels = ["0", "250", "500", "750", "1K"];
      labels.forEach((lbl, idx) => {
        const fraction = idx / 4;
        const tx = padding.left + fraction * plotWidth;
        
        ctx.strokeStyle = '#1e293b';
        ctx.beginPath();
        ctx.moveTo(tx, h - padding.bottom);
        ctx.lineTo(tx, h - padding.bottom + m.tick);
        ctx.stroke();
        
        ctx.fillText(lbl, tx, h - padding.bottom + m.gap);
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
        ctx.lineTo(padding.left - m.tick, ty);
        ctx.stroke();
        
        ctx.fillText(dec, padding.left - m.gap, ty);
      });
    } else {
      const labels = ["0", "250", "500", "750", "1K"];
      labels.forEach((lbl, idx) => {
        const fraction = idx / 4;
        const ty = h - padding.bottom - fraction * plotHeight;
        
        ctx.strokeStyle = '#1e293b';
        ctx.beginPath();
        ctx.moveTo(padding.left, ty);
        ctx.lineTo(padding.left - m.tick, ty);
        ctx.stroke();
        
        ctx.fillText(lbl, padding.left - m.gap, ty);
      });
    }
    
    if (!isSmallMode) {
      ctx.fillStyle = '#cbd5e1';
      ctx.font = m.axisFont;
      
      ctx.textAlign = 'center';
      ctx.fillText(config.xLabel, padding.left + plotWidth / 2, h - 18 * m.k);
      
      ctx.save();
      ctx.translate(15 * m.k, padding.top + plotHeight / 2);
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
    
    const dotSize = m.dotSize;
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
    
    if (this.pulseLabelX) this.pulseLabelX.innerText = 'Height (FSC-H)';
    if (this.pulseLabelY) this.pulseLabelY.innerText = 'Area (FSC-A)';
    
    this.redrawPlotGrid(this.focusedCanvas, this.focusedCtx, config, false);
  }

  /* ------------------------------------------------------------------
     Optical bench.

     Side view: sheath and sample enter at the top, hydrodynamic focusing
     compresses the core to a single-file stream, and three spatially
     separated beams interrogate it a few microseconds apart inside the
     quartz flow cell. The 90 degree collection arm is physically at right
     angles to the beam and to the flow, so it points out of the screen —
     it is drawn folded down into the page, with a plan-view inset in the
     corner showing the true geometry.
     ------------------------------------------------------------------ */
  getInstrumentLayout(w, h) {
    if (this._layout && this._layout.w === w && this._layout.h === h) return this._layout;

    const AX = Math.round(w * 0.355);
    const bore = Math.max(11, Math.round(w * 0.033));
    const L = {
      w: w, h: h,
      AX: AX,
      bore: bore,
      wall: Math.max(30, Math.round(w * 0.082)),      // half-width of the quartz body
      funnelHalf: Math.max(44, Math.round(w * 0.115)),
      yProbeTop: Math.round(h * 0.015),
      yProbeTip: Math.round(h * 0.135),
      ySheath: Math.round(h * 0.075),
      yCellTop: Math.round(h * 0.25),
      yCellBot: Math.round(h * 0.655),
      lasersX: [Math.round(w * 0.012), Math.round(w * 0.072)],
      lensX: Math.round(w * 0.175),
      dumpX: Math.round(w * 0.55),
      barX: Math.round(w * 0.615),
      fscX: [Math.round(w * 0.665), Math.round(w * 0.80)],
      collectLens: { x: Math.round(w * 0.885), y: Math.round(h * 0.775) },
      railY: Math.round(h * 0.80),
      pmtY: Math.round(h * 0.875)
    };
    L.beams = [
      { y: Math.round(h * 0.325), nm: 405, name: 'Violet', color: '#a855f7', rgb: '168, 85, 247' },
      { y: Math.round(h * 0.405), nm: 488, name: 'Blue',   color: '#3b82f6', rgb: '59, 130, 246' },
      { y: Math.round(h * 0.485), nm: 638, name: 'Red',    color: '#ef4444', rgb: '239, 68, 68' }
    ];
    L.scatterBeam = 1; // FSC and SSC are taken from the 488 nm beam
    this._layout = L;
    return L;
  }

  // Measure the schematic without drawing it — the particle physics needs the
  // geometry before the first frame is painted.
  ensureLayout() {
    const rect = this.instrumentCanvas.getBoundingClientRect();
    const w = Math.round(rect.width), h = Math.round(rect.height);
    if (w < 60 || h < 40) return null;
    return this.getInstrumentLayout(w, h);
  }

  coreHalfWidthPx(L) {
    const um = SIM_PHYSICS.coreWidthUm[this.flowRate];
    // 40 µm of core maps to the full bore, so the visual scale is honest.
    return Math.max(1.5, (um / 80) * L.bore * 2);
  }

  drawInstrument() {
    const ctx = this.instrumentCtx;
    const size = this.fitCanvas(this.instrumentCanvas, ctx);
    if (!size) return;
    const w = size.w, h = size.h;
    const L = this.getInstrumentLayout(w, h);
    const AX = L.AX;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#050a16';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.025)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 28) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 28) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

    const label = (text, x, y, color, size, align, weight) => {
      ctx.fillStyle = color;
      ctx.font = `${weight || 600} ${size || 9}px ui-sans-serif, system-ui, sans-serif`;
      ctx.textAlign = align || 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, x, y);
    };

    // ==================== FLUIDICS ====================
    // sheath inlets
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
    ctx.fillStyle = 'rgba(56, 189, 248, 0.5)';
    ctx.lineWidth = 1.4;
    [[-1, AX - L.funnelHalf], [1, AX + L.funnelHalf]].forEach(([dir, x]) => {
      const from = x + dir * 34;
      ctx.beginPath(); ctx.moveTo(from, L.ySheath); ctx.lineTo(x + dir * 6, L.ySheath); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, L.ySheath);
      ctx.lineTo(x + dir * 7, L.ySheath - 3.5);
      ctx.lineTo(x + dir * 7, L.ySheath + 3.5);
      ctx.closePath(); ctx.fill();
    });
    label('Sheath', AX - L.funnelHalf - 38, L.ySheath - 9, 'rgba(125, 211, 252, 0.9)', 8.5, 'left');
    label('Sheath', AX + L.funnelHalf + 38, L.ySheath - 9, 'rgba(125, 211, 252, 0.9)', 8.5, 'right');

    // nozzle walls
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)';
    ctx.lineWidth = 1.6;
    [[-1, L.funnelHalf], [1, L.funnelHalf]].forEach(([dir, half]) => {
      ctx.beginPath();
      ctx.moveTo(AX + dir * half, L.ySheath - 14);
      ctx.lineTo(AX + dir * half, L.ySheath + 10);
      ctx.lineTo(AX + dir * L.bore, L.yCellTop);
      ctx.stroke();
    });

    // laminar sheath streamlines following the funnel then the bore
    ctx.lineCap = 'round';
    this.sheathLines.forEach(line => {
      const y = line.y;
      if (y < L.ySheath || y > L.yCellBot) return;
      const t = Math.min(1, Math.max(0, (y - L.ySheath) / (L.yCellTop - L.ySheath)));
      const half = L.funnelHalf + (L.bore - L.funnelHalf) * Math.min(1, t);
      const x = AX + line.frac * half;
      const len = 7 + line.speed * 3;
      ctx.strokeStyle = `rgba(56, 189, 248, ${0.10 + 0.12 * (1 - Math.abs(line.frac))})`;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, Math.min(L.yCellBot, y + len)); ctx.stroke();
    });
    ctx.lineCap = 'butt';

    // sample injection probe
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(AX - 4, L.yProbeTop, 8, L.yProbeTip - L.yProbeTop);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(AX - 4, L.yProbeTop, 2, L.yProbeTip - L.yProbeTop);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.strokeRect(AX - 4.5, L.yProbeTop + 0.5, 9, L.yProbeTip - L.yProbeTop);
    label('Sample probe', AX - 10, L.yProbeTop + 9, 'rgba(226, 232, 240, 0.85)', 8.5, 'right');
    label('(cell suspension)', AX - 10, L.yProbeTop + 19, 'rgba(148, 163, 184, 0.7)', 7.5, 'right');

    // ==================== FLOW CELL ====================
    const coreHalf = this.coreHalfWidthPx(L);
    ctx.fillStyle = 'rgba(103, 232, 249, 0.05)';
    ctx.strokeStyle = 'rgba(103, 232, 249, 0.35)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.rect(AX - L.wall, L.yCellTop, L.wall * 2, L.yCellBot - L.yCellTop);
    ctx.fill(); ctx.stroke();

    // bore
    ctx.fillStyle = 'rgba(56, 189, 248, 0.10)';
    ctx.fillRect(AX - L.bore, L.yCellTop, L.bore * 2, L.yCellBot - L.yCellTop);
    ctx.strokeStyle = 'rgba(103, 232, 249, 0.20)';
    ctx.beginPath();
    ctx.moveTo(AX - L.bore, L.yCellTop); ctx.lineTo(AX - L.bore, L.yCellBot);
    ctx.moveTo(AX + L.bore, L.yCellTop); ctx.lineTo(AX + L.bore, L.yCellBot);
    ctx.stroke();

    // hydrodynamically focused core
    const grad = ctx.createLinearGradient(0, L.ySheath, 0, L.yCellBot);
    grad.addColorStop(0, 'rgba(0, 229, 255, 0.05)');
    grad.addColorStop(0.35, 'rgba(0, 229, 255, 0.32)');
    grad.addColorStop(1, 'rgba(0, 229, 255, 0.22)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(AX - 4, L.yProbeTip);
    ctx.quadraticCurveTo(AX - 4, L.yCellTop - 12, AX - coreHalf, L.yCellTop);
    ctx.lineTo(AX - coreHalf, L.yCellBot);
    ctx.lineTo(AX + coreHalf, L.yCellBot);
    ctx.lineTo(AX + coreHalf, L.yCellTop);
    ctx.quadraticCurveTo(AX + 4, L.yCellTop - 12, AX + 4, L.yProbeTip);
    ctx.closePath();
    ctx.fill();

    label('Quartz flow cell', AX, L.beams[2].y + 22, 'rgba(103, 232, 249, 0.95)', 8.5, 'center');
    label('square bore, gel-coupled', AX, L.beams[2].y + 32, 'rgba(148, 163, 184, 0.7)', 7.5, 'center');

    // core width callout
    const coreUm = SIM_PHYSICS.coreWidthUm[this.flowRate];
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.6)';
    ctx.lineWidth = 1;
    const cy = L.yCellBot - 18;
    ctx.beginPath();
    ctx.moveTo(AX - coreHalf, cy); ctx.lineTo(AX + coreHalf, cy);
    ctx.moveTo(AX - coreHalf, cy - 3); ctx.lineTo(AX - coreHalf, cy + 3);
    ctx.moveTo(AX + coreHalf, cy - 3); ctx.lineTo(AX + coreHalf, cy + 3);
    ctx.stroke();
    label(`core ${coreUm} µm`, AX, cy + 10, 'rgba(0, 229, 255, 0.95)', 8, 'center');

    // waste
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(AX, L.yCellBot); ctx.lineTo(AX, L.yCellBot + 16);
    ctx.stroke();
    ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.beginPath();
    ctx.moveTo(AX, L.yCellBot + 21); ctx.lineTo(AX - 3.5, L.yCellBot + 14); ctx.lineTo(AX + 3.5, L.yCellBot + 14);
    ctx.closePath(); ctx.fill();
    label('to waste', AX + 7, L.yCellBot + 14, 'rgba(148, 163, 184, 0.7)', 8);

    // ==================== LASERS ====================
    ctx.fillStyle = '#111c2e';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    const lbTop = L.beams[0].y - 18, lbBot = L.beams[2].y + 18;
    ctx.fillRect(L.lasersX[0], lbTop, L.lasersX[1] - L.lasersX[0], lbBot - lbTop);
    ctx.strokeRect(L.lasersX[0] + 0.5, lbTop + 0.5, L.lasersX[1] - L.lasersX[0], lbBot - lbTop);
    label('LASERS', (L.lasersX[0] + L.lasersX[1]) / 2, lbTop - 9, 'rgba(148, 163, 184, 0.85)', 8, 'center', 700);

    // focusing lens
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.45)';
    ctx.fillStyle = 'rgba(226, 232, 240, 0.08)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(L.lensX, (lbTop + lbBot) / 2, 5, (lbBot - lbTop) / 2 - 4, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    label('Focusing', L.lensX, lbBot + 10, 'rgba(148, 163, 184, 0.75)', 8, 'center');
    label('lens', L.lensX, lbBot + 20, 'rgba(148, 163, 184, 0.75)', 8, 'center');

    // beams: collimated to the lens, converging to an elliptical waist at the core
    L.beams.forEach((b, i) => {
      const isScatter = (i === L.scatterBeam);
      const endX = isScatter ? L.barX : L.dumpX;
      const flash = this.beamFlash[i] || 0;
      const thick = 4.5;

      ctx.fillStyle = `rgba(${b.rgb}, ${0.16 + flash * 0.25})`;
      ctx.beginPath();
      ctx.moveTo(L.lasersX[1], b.y - thick);
      ctx.lineTo(L.lensX, b.y - thick);
      ctx.lineTo(AX, b.y - 1.1);
      ctx.lineTo(AX, b.y + 1.1);
      ctx.lineTo(L.lensX, b.y + thick);
      ctx.lineTo(L.lasersX[1], b.y + thick);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(AX, b.y - 1.1);
      ctx.lineTo(endX, b.y - thick * 0.8);
      ctx.lineTo(endX, b.y + thick * 0.8);
      ctx.lineTo(AX, b.y + 1.1);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = `rgba(${b.rgb}, ${0.75 + flash * 0.25})`;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 5 + flash * 10;
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(L.lasersX[1], b.y); ctx.lineTo(endX, b.y); ctx.stroke();
      ctx.shadowBlur = 0;

      // emitter
      ctx.fillStyle = b.color;
      ctx.fillRect(L.lasersX[1] - 4, b.y - 3, 4, 6);

      label(`${b.nm} nm`, L.lasersX[1] + 7, b.y - 9, b.color, 8.5, 'left', 700);
    });

    // Beam geometry facts, grouped clear of the bench above the flow cell.
    const capX = AX + L.wall + 8;
    label(`beam waist ${SIM_PHYSICS.beamWidthUm} × ${SIM_PHYSICS.beamHeightUm} µm`,
          capX, L.yCellTop - 26, 'rgba(148, 163, 184, 0.7)', 7.5, 'left');
    label(`beams ${SIM_PHYSICS.beamSpacingUm} µm apart`,
          capX, L.yCellTop - 16, 'rgba(148, 163, 184, 0.7)', 7.5, 'left');
    label(`= ${SIM_PHYSICS.laserDelayUs.toFixed(0)} µs laser delay`,
          capX, L.yCellTop - 6, 'rgba(226, 232, 240, 0.85)', 7.5, 'left', 700);

    // beam dumps for the two non-scatter beams
    L.beams.forEach((b, i) => {
      if (i === L.scatterBeam) return;
      ctx.fillStyle = '#0b1220';
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
      ctx.lineWidth = 1;
      ctx.fillRect(L.dumpX, b.y - 9, 9, 18);
      ctx.strokeRect(L.dumpX + 0.5, b.y - 8.5, 9, 18);
      label('dump', L.dumpX + 12, b.y, 'rgba(148, 163, 184, 0.6)', 7.5, 'left');
    });

    // ==================== FORWARD SCATTER ====================
    const sb = L.beams[L.scatterBeam];
    const fscFlash = this.detectorFlash.fsc || 0;

    // small-angle scattered light spilling around the obscuration bar
    if (fscFlash > 0.01) {
      ctx.fillStyle = `rgba(125, 211, 252, ${0.30 * fscFlash})`;
      ctx.beginPath();
      ctx.moveTo(AX, sb.y);
      ctx.lineTo(L.fscX[1], sb.y - 22);
      ctx.lineTo(L.fscX[1], sb.y + 22);
      ctx.closePath();
      ctx.fill();
    }

    // obscuration bar sits on the optical axis and shadows the diode
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(L.barX, sb.y - 7, 5, 14);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1;
    ctx.strokeRect(L.barX + 0.5, sb.y - 6.5, 5, 14);
    label('Obscuration bar', L.barX - 8, sb.y - 20, 'rgba(203, 213, 225, 0.9)', 8, 'right');

    // FSC photodiode
    ctx.fillStyle = fscFlash > 0.01 ? `rgba(125, 211, 252, ${0.15 + fscFlash * 0.5})` : '#111c2e';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.fillRect(L.fscX[0], sb.y - 16, L.fscX[1] - L.fscX[0], 32);
    ctx.strokeRect(L.fscX[0] + 0.5, sb.y - 15.5, L.fscX[1] - L.fscX[0], 32);
    label('FSC', (L.fscX[0] + L.fscX[1]) / 2, sb.y - 5, '#e2e8f0', 9.5, 'center', 700);
    label('photodiode', (L.fscX[0] + L.fscX[1]) / 2, sb.y + 6, 'rgba(148, 163, 184, 0.8)', 7.5, 'center');
    label('0.5–10° · direct beam blocked', (L.fscX[0] + L.fscX[1]) / 2, sb.y + 24, 'rgba(125, 211, 252, 0.8)', 7.5, 'center');

    // ==================== 90° COLLECTION ARM ====================
    const sscFlash = this.detectorFlash.ssc || 0;
    const cl = L.collectLens;

    // emission cone leaving the flow cell toward the collection optics
    ctx.fillStyle = `rgba(34, 211, 238, ${0.05 + sscFlash * 0.25})`;
    ctx.beginPath();
    ctx.moveTo(AX, sb.y);
    ctx.lineTo(cl.x - 6, cl.y - 16);
    ctx.lineTo(cl.x - 6, cl.y + 16);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.35)';
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(AX, sb.y); ctx.lineTo(cl.x - 6, cl.y); ctx.stroke();
    ctx.setLineDash([]);

    // 90° marker at the interrogation point
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(AX, sb.y, 17, 0, Math.atan2(cl.y - sb.y, cl.x - AX));
    ctx.stroke();
    label('90°', AX + L.wall + 8, sb.y + 30, 'rgba(226, 232, 240, 0.8)', 8.5, 'left', 700);

    // collection lens
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.5)';
    ctx.fillStyle = 'rgba(226, 232, 240, 0.08)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(cl.x, cl.y, 5, 15, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    label('Collection', cl.x + 8, cl.y - 6, 'rgba(148, 163, 184, 0.8)', 8, 'left');
    label('lens', cl.x + 8, cl.y + 4, 'rgba(148, 163, 184, 0.8)', 8, 'left');

    // optical rail running back across the bench, peeling off one band per PMT
    const channels = SIM_PHYSICS.channels;
    const railStart = cl.x - 10;
    const railEnd = Math.round(w * 0.055);
    ctx.strokeStyle = `rgba(226, 232, 240, ${0.18 + sscFlash * 0.35})`;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(railStart, L.railY); ctx.lineTo(railEnd, L.railY); ctx.stroke();

    const span = (railStart - railEnd) / channels.length;
    channels.forEach((chan, i) => {
      const x = railStart - span * (i + 0.5);
      const flash = (this.detectorFlash.pmt && this.detectorFlash.pmt[i]) || 0;

      // dichroic mirror, drawn at 45°
      ctx.strokeStyle = `rgba(${chan.rgb}, 0.85)`;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(x - 6, L.railY - 6); ctx.lineTo(x + 6, L.railY + 6);
      ctx.stroke();

      // reflected band drops to the bandpass filter and PMT
      ctx.strokeStyle = `rgba(${chan.rgb}, ${0.25 + flash * 0.6})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(x, L.railY + 6); ctx.lineTo(x, L.pmtY - 7); ctx.stroke();

      // bandpass filter
      ctx.fillStyle = `rgba(${chan.rgb}, 0.5)`;
      ctx.fillRect(x - 8, L.pmtY - 11, 16, 3.5);

      // PMT
      ctx.fillStyle = flash > 0.01 ? `rgba(${chan.rgb}, ${0.2 + flash * 0.55})` : '#111c2e';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      ctx.fillRect(x - 11, L.pmtY - 6, 22, 17);
      ctx.strokeRect(x - 10.5, L.pmtY - 5.5, 22, 17);

      label(chan.name, x, L.pmtY + 2, '#e2e8f0', 8, 'center', 700);
      label(chan.filter, x, L.pmtY + 18, `rgba(${chan.rgb}, 0.85)`, 7.5, 'center');
    });

    label('90° collection arm — dichroic mirrors split the light, one bandpass filter and PMT per colour',
          railEnd, L.railY - 12, 'rgba(148, 163, 184, 0.8)', 8, 'left');
    label('SSC reports internal complexity; the rest report antibody binding',
          railEnd, L.pmtY + 32, 'rgba(148, 163, 184, 0.6)', 7.5, 'left');

    // ==================== ELECTRONICS / DATA PATH ====================
    // Detector current -> preamp -> ADC -> one row in the list-mode file.
    const boxX = Math.round(w * 0.845), boxW = Math.round(w * 0.145);
    const boxY = sb.y + 44, boxH = 28;
    const fscMid = (L.fscX[0] + L.fscX[1]) / 2;
    const busY = boxY + 13;

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(fscMid, sb.y + 16); ctx.lineTo(fscMid, busY); ctx.lineTo(boxX, busY);
    ctx.moveTo(cl.x, cl.y - 16); ctx.lineTo(cl.x, boxY + boxH);
    ctx.stroke();

    // events travelling down the bus
    this.dataPulses.forEach(dp => {
      const t = Math.min(1, dp.t);
      const legA = busY - (sb.y + 16);          // vertical leg
      const legB = boxX - fscMid;               // horizontal leg
      const total = legA + legB;
      const d = t * total;
      const x = d < legA ? fscMid : fscMid + (d - legA);
      const y = d < legA ? sb.y + 16 + d : busY;
      ctx.fillStyle = dp.color;
      ctx.shadowColor = dp.color;
      ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.arc(x, y, 2.6, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    });

    const busy = this.dataPulses.some(dp => dp.t > 0.85);
    ctx.fillStyle = busy ? 'rgba(74, 222, 128, 0.18)' : '#111c2e';
    ctx.strokeStyle = busy ? 'rgba(74, 222, 128, 0.7)' : '#475569';
    ctx.lineWidth = 1;
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeRect(boxX + 0.5, boxY + 0.5, boxW, boxH);
    label(`ADC · ${SIM_PHYSICS.adcMHz} MHz`, boxX + boxW / 2, boxY + 9, '#e2e8f0', 8, 'center', 700);
    label('→ list-mode file', boxX + boxW / 2, boxY + 20, 'rgba(148, 163, 184, 0.85)', 7.5, 'center');

    // ==================== CELLS ====================
    this.particles.forEach(p => {
      const glow = p.glow || 0;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.glowColor || p.color;
      ctx.shadowBlur = glow * 16;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      if (glow > 0.02) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${glow * 0.7})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size + 3 + (1 - glow) * 7, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    // ==================== PLAN-VIEW INSET ====================
    this.drawGeometryInset(ctx, L, Math.round(w * 0.035), Math.round(h * 0.03), Math.round(Math.min(w * 0.15, 72)));

    // ==================== COMPONENT HIGHLIGHTS ====================
    this.drawHotspotOverlay(ctx, L);
  }

  // Small plan view looking down the stream, showing the true 0°/90° geometry.
  drawGeometryInset(ctx, L, x, y, size) {
    const cx = x + size / 2, cy = y + size / 2, r = size * 0.3;

    ctx.fillStyle = 'rgba(2, 6, 23, 0.75)';
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x, y, size, size + 12, 5) : ctx.rect(x, y, size, size + 12);
    ctx.fill(); ctx.stroke();

    // laser in from the left, FSC straight on, SSC/FL at 90°
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.9)';
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(cx - r - 8, cy); ctx.lineTo(cx + r + 8, cy); ctx.stroke();

    ctx.strokeStyle = 'rgba(34, 211, 238, 0.9)';
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy + r + 8); ctx.stroke();

    // right-angle tick
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(cx + 1.5, cy + 1.5, 5, 5);

    // the stream, coming out of the page
    ctx.fillStyle = 'rgba(0, 229, 255, 0.9)';
    ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.6)';
    ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.stroke();

    ctx.font = '7px ui-sans-serif, system-ui, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(125, 211, 252, 0.9)';
    ctx.textAlign = 'right';
    ctx.fillText('FSC 0°', x + size - 3, cy - 6);
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(34, 211, 238, 0.9)';
    ctx.fillText('SSC/FL 90°', cx, y + size - 4);
    ctx.fillStyle = 'rgba(148, 163, 184, 0.75)';
    ctx.textAlign = 'center';
    ctx.fillText('plan view · flow ⊙ toward you', x + size / 2, y + size + 5);
  }

  /* ------------------------------------------------------------------
     Clickable components.

     The hotspots mirror the geometry drawn in drawInstrument(), so they
     are rebuilt whenever the layout or the core width changes. Order
     matters: the list is hit-tested front to back, so small parts sitting
     inside larger ones (the interrogation point inside the flow cell)
     come first.
     ------------------------------------------------------------------ */
  getHotspots() {
    const L = this._layout;
    if (!L) return [];
    if (this._hotspots && this._hotspotsKey === `${L.w}x${L.h}:${this.flowRate}`) return this._hotspots;

    const AX = L.AX;
    const sb = L.beams[L.scatterBeam];
    const cl = L.collectLens;
    const w = L.w, h = L.h;
    const coreHalf = Math.max(5, this.coreHalfWidthPx(L));
    const lbTop = L.beams[0].y - 18, lbBot = L.beams[2].y + 18;
    const railStart = cl.x - 10;
    const railEnd = Math.round(w * 0.055);
    const channels = SIM_PHYSICS.channels;
    const span = (railStart - railEnd) / channels.length;
    const boxX = Math.round(w * 0.845), boxW = Math.round(w * 0.145);
    const boxY = sb.y + 44, boxH = 28;

    const spots = [];
    const add = (id, shapes, info) => {
      spots.push(Object.assign({ id: id, shapes: shapes }, info || SIM_COMPONENTS[id] || {}));
    };
    const rect = (x, y, rw, rh) => ({ type: 'rect', x: x, y: y, w: rw, h: rh });

    // Small targets first.
    add('interrogation-point', [{ type: 'circle', x: AX, y: sb.y, r: 15 }]);
    add('obscuration-bar', [rect(L.barX - 5, sb.y - 11, 15, 22)]);
    add('focusing-lens', [rect(L.lensX - 9, (lbTop + lbBot) / 2 - 22, 18, 44)]);
    add('collection-lens', [rect(cl.x - 9, cl.y - 19, 18, 38)]);
    add('sample-probe', [rect(AX - 8, L.yProbeTop, 16, L.yProbeTip - L.yProbeTop)]);
    add('sheath-inlet', [
      rect(AX - L.funnelHalf - 40, L.ySheath - 10, 44, 20),
      rect(AX + L.funnelHalf - 4, L.ySheath - 10, 44, 20)
    ]);
    add('beam-dump', L.beams
      .map((b, i) => (i === L.scatterBeam ? null : rect(L.dumpX - 2, b.y - 11, 14, 22)))
      .filter(Boolean));
    add('fsc-detector', [rect(L.fscX[0], sb.y - 17, L.fscX[1] - L.fscX[0], 34)]);
    add('lasers', [rect(L.lasersX[0], lbTop, L.lasersX[1] - L.lasersX[0], lbBot - lbTop)]);
    add('adc', [rect(boxX, boxY, boxW, boxH)]);

    // 90° arm: one dichroic and one detector per colour.
    channels.forEach((chan, i) => {
      const x = railStart - span * (i + 0.5);
      const note = SIM_CHANNEL_NOTES[chan.name] || {};
      add(`dichroic-${i}`, [rect(x - 9, L.railY - 9, 18, 18)], {
        group: 'dichroic',
        name: `Dichroic mirror — ${chan.name}`,
        sub: `reflects ${chan.filter} down, passes the rest along the rail`,
        what: 'A 45° interference mirror that reflects one band of light to the detector below it and transmits everything else to the next mirror.',
        why: 'This chain is how one beam of light becomes many measured colours. The mirror and filter combination defines the channel — and because real dyes emit over broad, overlapping ranges, it is also the reason compensation is unavoidable.',
        quiz: i === 0 ? 'Click a dichroic mirror — the optic that splits the collected light into separate colour channels.' : null
      });
      add(`pmt-${i}`, [rect(x - 12, L.pmtY - 13, 24, 26)], {
        group: `pmt-${chan.name}`,
        name: `${chan.name} detector`,
        sub: `${chan.filter} bandpass · ${L.beams[chan.laser].nm} nm laser`,
        markerLookup: { chan: chan.name, laser: L.beams[chan.laser].name.toLowerCase(), rgb: chan.rgb },
        what: note.what || `Photomultiplier behind a ${chan.filter} bandpass filter.`,
        why: note.why || 'The bandpass filter decides what this channel really sees; overlapping dye emission is what compensation corrects.',
        quiz: note.quiz || null
      });
    });

    // Beams, then the fluidics column, then the large containers.
    L.beams.forEach((b, i) => {
      const endX = (i === L.scatterBeam) ? L.barX : L.dumpX;
      const info = Object.assign({}, SIM_COMPONENTS[`beam-${i}`], {
        markerLookup: { laser: b.name.toLowerCase(), rgb: b.rgb }
      });
      add(`beam-${i}`, [rect(L.lasersX[1], b.y - 7, endX - L.lasersX[1], 14)], info);
    });

    add('core-stream', [rect(AX - coreHalf, L.yCellTop, coreHalf * 2, L.yCellBot - L.yCellTop)]);
    add('waste', [rect(AX - 14, L.yCellBot, 28, 26)]);
    add('nozzle', [{
      type: 'poly',
      pts: [
        [AX - L.funnelHalf, L.ySheath - 14], [AX + L.funnelHalf, L.ySheath - 14],
        [AX + L.funnelHalf, L.ySheath + 10], [AX + L.bore, L.yCellTop],
        [AX - L.bore, L.yCellTop], [AX - L.funnelHalf, L.ySheath + 10]
      ]
    }]);
    add('flow-cell', [rect(AX - L.wall, L.yCellTop, L.wall * 2, L.yCellBot - L.yCellTop)]);

    spots.forEach(s => { s.bbox = this.hotspotBBox(s); });
    this._hotspots = spots;
    this._hotspotsKey = `${L.w}x${L.h}:${this.flowRate}`;

    // Re-point anything held by identity at the rebuilt objects.
    const byId = (spot) => (spot ? spots.find(s => s.id === spot.id) || null : null);
    this.hoverSpot = byId(this.hoverSpot);
    this.selectedSpot = byId(this.selectedSpot);
    if (this.quiz && this.quiz.current) this.quiz.current = byId(this.quiz.current) || this.quiz.current;

    return spots;
  }

  hotspotBBox(spot) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    spot.shapes.forEach(s => {
      if (s.type === 'rect') {
        x0 = Math.min(x0, s.x); y0 = Math.min(y0, s.y);
        x1 = Math.max(x1, s.x + s.w); y1 = Math.max(y1, s.y + s.h);
      } else if (s.type === 'circle') {
        x0 = Math.min(x0, s.x - s.r); y0 = Math.min(y0, s.y - s.r);
        x1 = Math.max(x1, s.x + s.r); y1 = Math.max(y1, s.y + s.r);
      } else {
        s.pts.forEach(([px, py]) => {
          x0 = Math.min(x0, px); y0 = Math.min(y0, py);
          x1 = Math.max(x1, px); y1 = Math.max(y1, py);
        });
      }
    });
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }

  hitTestHotspot(x, y) {
    const spots = this.getHotspots();
    for (let i = 0; i < spots.length; i++) {
      const shapes = spots[i].shapes;
      for (let j = 0; j < shapes.length; j++) {
        const s = shapes[j];
        if (s.type === 'rect') {
          if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) return spots[i];
        } else if (s.type === 'circle') {
          const dx = x - s.x, dy = y - s.y;
          if (dx * dx + dy * dy <= s.r * s.r) return spots[i];
        } else if (this.pointInPoly(x, y, s.pts)) {
          return spots[i];
        }
      }
    }
    return null;
  }

  pointInPoly(x, y, pts) {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }

  // Outline whatever is hovered or selected, plus a floating name tag.
  drawHotspotOverlay(ctx, L) {
    this.getHotspots();   // rebuilds against the current layout if it changed
    const paint = (spot, color, alpha, showName) => {
      if (!spot) return;
      const b = spot.bbox;
      const pad = 5;
      ctx.save();
      ctx.strokeStyle = `rgba(${color}, ${alpha})`;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      const rx = b.x - pad, ry = b.y - pad, rw = b.w + pad * 2, rh = b.h + pad * 2;
      if (ctx.roundRect) ctx.roundRect(rx, ry, rw, rh, 6); else ctx.rect(rx, ry, rw, rh);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = `rgba(${color}, ${alpha * 0.10})`;
      ctx.fill();

      if (showName && spot.name) {
        ctx.font = '700 9px ui-sans-serif, system-ui, sans-serif';
        const tw = ctx.measureText(spot.name).width + 12;
        let tx = rx + rw / 2 - tw / 2;
        let ty = ry - 17;
        if (ty < 2) ty = ry + rh + 3;
        tx = Math.max(2, Math.min(L.w - tw - 2, tx));
        ctx.fillStyle = 'rgba(2, 6, 23, 0.92)';
        ctx.strokeStyle = `rgba(${color}, 0.8)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(tx, ty, tw, 15, 4); else ctx.rect(tx, ty, tw, 15);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(spot.name, tx + tw / 2, ty + 8);
      }
      ctx.restore();
    };

    if (this.selectedSpot && this.selectedSpot !== this.hoverSpot) {
      paint(this.selectedSpot, '0, 229, 255', 0.9, false);
    }
    if (this.hoverSpot) {
      const inQuiz = !!this.quiz;
      paint(this.hoverSpot, inQuiz ? '250, 204, 21' : '0, 229, 255', 0.95, !inQuiz);
    }
  }

  initInstrumentInteraction() {
    const canvas = this.instrumentCanvas;
    if (!canvas) return;
    canvas.setAttribute('tabindex', '0');
    canvas.setAttribute('role', 'application');
    canvas.setAttribute('aria-label',
      'Flow cytometer schematic. Click a component to read what it is and why it matters. Arrow keys cycle through components.');

    const localPoint = (e) => {
      const r = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - r.left) * (this._layout ? this._layout.w / r.width : 1),
        y: (e.clientY - r.top) * (this._layout ? this._layout.h / r.height : 1)
      };
    };

    canvas.addEventListener('mousemove', (e) => {
      if (!this.ensureLayout()) return;
      const p = localPoint(e);
      const hit = this.hitTestHotspot(p.x, p.y);
      canvas.style.cursor = hit ? 'pointer' : 'default';
      if (hit !== this.hoverSpot) {
        this.hoverSpot = hit;
        if (!this.isRunning) this.drawInstrument();
      }
    });

    canvas.addEventListener('mouseleave', () => {
      if (this.hoverSpot) {
        this.hoverSpot = null;
        if (!this.isRunning) this.drawInstrument();
      }
    });

    canvas.addEventListener('click', (e) => {
      if (!this.ensureLayout()) return;
      const p = localPoint(e);
      const hit = this.hitTestHotspot(p.x, p.y);
      if (!hit) return;
      if (this.quiz) this.answerQuiz(hit); else this.selectComponent(hit);
    });

    // Keyboard: cycle the hotspot list, Enter to answer during a quiz.
    canvas.addEventListener('keydown', (e) => {
      if (!this.ensureLayout()) return;
      const spots = this.getHotspots();
      if (!spots.length) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        const step = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : -1;
        const idx = spots.indexOf(this.hoverSpot);
        const next = (idx + step + spots.length) % spots.length;
        this.hoverSpot = spots[next];
        if (!this.quiz) this.selectComponent(this.hoverSpot);
        if (!this.isRunning) this.drawInstrument();
      } else if (e.key === 'Enter' || e.key === ' ') {
        if (!this.hoverSpot) return;
        e.preventDefault();
        if (this.quiz) this.answerQuiz(this.hoverSpot); else this.selectComponent(this.hoverSpot);
      } else if (e.key === 'Escape') {
        this.clearComponent();
      }
    });

    if (this.componentCloseBtn) {
      this.componentCloseBtn.addEventListener('click', () => this.clearComponent());
    }
    if (this.quizStartBtn) {
      this.quizStartBtn.addEventListener('click', () => {
        if (this.quiz) this.endQuiz(); else this.startQuiz();
      });
    }
    if (this.quizSkipBtn) {
      this.quizSkipBtn.addEventListener('click', () => this.nextQuizQuestion());
    }

    // The panel opening under the canvas changes its height, so repaint.
    this.observeResize(canvas, () => { if (!this.isRunning) this.drawInstrument(); });
  }

  /* Which CD markers land on which detector.

     Inverted from MARKER_FLUOROCHROMES in app.js (the same table the 3D
     conjugation view uses), so the panels and the bench can never drift
     apart. Built on first use because app.js loads after this file. */
  fluorIndex() {
    if (this._fluorIndex !== undefined) return this._fluorIndex;
    const src = (typeof MARKER_FLUOROCHROMES !== 'undefined') ? MARKER_FLUOROCHROMES : null;
    if (!src) { this._fluorIndex = null; return null; }

    const idx = {};
    Object.keys(src).forEach(key => {
      const entry = src[key];
      const code = entry.fluorochrome.split(' (')[0].trim();   // "PB (Pacific Blue)" -> "PB"
      if (!idx[code]) idx[code] = { code: code, laser: entry.laser, markers: [] };
      idx[code].markers.push(key === 'TCR_gd' ? 'TCR γδ' : key.replace('_', '-'));
    });
    // CD order reads more naturally than declaration order.
    const num = (m) => { const n = /^CD(\d+)/.exec(m); return n ? parseInt(n[1], 10) : 9999; };
    Object.keys(idx).forEach(code => idx[code].markers.sort((a, b) => num(a) - num(b) || a.localeCompare(b)));

    this._fluorIndex = idx;
    return idx;
  }

  // Marker chips for a detector, or the whole fluorochrome list for a beam.
  renderComponentMarkers(spot) {
    const el = this.componentMarkers;
    if (!el) return;
    const look = spot.markerLookup;
    const idx = look ? this.fluorIndex() : null;
    if (!look || !idx) { el.style.display = 'none'; el.innerHTML = ''; return; }

    const chip = (text, rgb) =>
      `<span style="display:inline-block; padding:1px 7px; margin:0 4px 3px 0; border-radius:999px;` +
      ` font-size:10.5px; font-weight:700; background:rgba(${rgb},0.14);` +
      ` border:1px solid rgba(${rgb},0.45); color:#e2e8f0;">${text}</span>`;
    const muted = 'color:var(--text-muted);';
    let html = '';

    if (look.chan) {
      const own = idx[look.chan];
      html += own
        ? `<div><span style="${muted}">Markers read by this detector across the four tube panels:</span><br>` +
          own.markers.map(m => chip(m, look.rgb)).join('') + '</div>'
        : `<div style="${muted}">No antibody sits on this channel — SSC is scattered laser light, not fluorescence.</div>`;

      // Only the channels this schematic doesn't already draw are "missing".
      const drawn = SIM_PHYSICS.channels.map(c => c.name);
      const others = Object.keys(idx).filter(c => drawn.indexOf(c) === -1 && idx[c].laser === look.laser);
      if (others.length) {
        html += `<div style="margin-top:3px; ${muted}">Same laser, on detectors left off this simplified bench: ` +
          others.map(c => `<strong style="color:var(--text-secondary);">${c}</strong> — ${idx[c].markers.join(', ')}`).join('; ') +
          '.</div>';
      }
    } else {
      const on = Object.keys(idx).filter(c => idx[c].laser === look.laser);
      html += `<div><span style="${muted}">Conjugates this beam excites, and the markers carrying them:</span></div>` +
        on.map(c =>
          `<div style="margin-top:2px;"><strong style="color:rgb(${look.rgb});">${c}</strong> &nbsp;` +
          idx[c].markers.map(m => chip(m, look.rgb)).join('') + '</div>'
        ).join('');
    }

    el.innerHTML = html;
    el.style.display = 'block';
  }

  selectComponent(spot) {
    this.selectedSpot = spot;
    if (!this.componentPanel) return;
    this.componentPanel.style.display = 'flex';
    this.componentName.textContent = spot.name || spot.id;
    this.componentSub.textContent = spot.sub || '';
    this.componentWhat.textContent = spot.what || '';
    this.componentWhy.textContent = spot.why || '';
    this.renderComponentMarkers(spot);
    if (!this.isRunning) this.drawInstrument();
  }

  clearComponent() {
    this.selectedSpot = null;
    this.hoverSpot = null;
    if (this.componentPanel) this.componentPanel.style.display = 'none';
    if (!this.isRunning) this.drawInstrument();
  }

  /* ---------------- Identify mode ---------------- */
  startQuiz() {
    const pool = this.getHotspots().filter(s => s.quiz);
    if (!pool.length) return;
    this.quiz = { remaining: pool.slice(), asked: 0, correct: 0, current: null, locked: false };
    // Shuffle so the run order changes each time.
    for (let i = this.quiz.remaining.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = this.quiz.remaining[i];
      this.quiz.remaining[i] = this.quiz.remaining[j];
      this.quiz.remaining[j] = t;
    }
    this.clearComponent();
    if (this.quizStartBtn) this.quizStartBtn.textContent = 'End quiz';
    if (this.quizBar) this.quizBar.style.display = 'flex';
    this.nextQuizQuestion();
  }

  endQuiz() {
    const q = this.quiz;
    this.quiz = null;
    if (this.quizStartBtn) this.quizStartBtn.textContent = 'Identify quiz';
    if (this.quizBar) this.quizBar.style.display = 'none';
    if (q && this.componentPanel && q.asked > 0) {
      this.componentPanel.style.display = 'flex';
      this.componentName.textContent = 'Quiz finished';
      this.componentSub.textContent = `${q.correct} of ${q.asked} correct`;
      this.componentWhat.textContent = 'Click any part of the schematic to keep reading about it.';
      this.componentWhy.textContent = '';
    }
    this.hoverSpot = null;
    if (!this.isRunning) this.drawInstrument();
  }

  nextQuizQuestion() {
    const q = this.quiz;
    if (!q) return;
    if (!q.remaining.length) { this.endQuiz(); return; }
    q.current = q.remaining.shift();
    q.asked += 1;
    q.locked = false;
    if (this.quizPrompt) this.quizPrompt.textContent = q.current.quiz;
    if (this.quizFeedback) { this.quizFeedback.textContent = ''; this.quizFeedback.style.color = 'var(--text-muted)'; }
    this.updateQuizScore();
  }

  answerQuiz(spot) {
    const q = this.quiz;
    if (!q || !q.current || q.locked) return;
    const target = q.current;
    const right = spot === target || (target.group && spot.group === target.group);
    q.locked = true;
    if (right) q.correct += 1;

    if (this.quizFeedback) {
      this.quizFeedback.textContent = right
        ? `Correct — ${spot.name}.`
        : `Not quite — that is the ${spot.name}. The answer is highlighted.`;
      this.quizFeedback.style.color = right ? 'var(--accent-green, #4ade80)' : '#f87171';
    }
    this.updateQuizScore();
    // On a grouped answer (any dichroic, say) explain the one they actually clicked.
    this.selectComponent(right ? spot : target);
    this.hoverSpot = null;
    if (!this.isRunning) this.drawInstrument();
    setTimeout(() => { if (this.quiz === q) this.nextQuizQuestion(); }, right ? 2200 : 4200);
  }

  updateQuizScore() {
    if (!this.quizScore || !this.quiz) return;
    this.quizScore.textContent = `${this.quiz.correct} / ${this.quiz.asked}`;
  }

  /* ------------------------------------------------------------------
     Pulse generation.

     The trace is built from the event's own FSC-A / FSC-H, so the
     oscilloscope and the FSC-A vs FSC-H plot always tell the same story:

       Height  = peak detector voltage          -> FSC-H
       Area    = integral of the whole pulse    -> FSC-A
       Width   = time above threshold           -> FSC-W  (~ Area / Height)

     A singlet gives one Gaussian (A/H ~ 1). A doublet is two cells crossing
     the beam back to back: the signals add, so the area doubles while the
     height barely changes and the pulse gets ~2x wider. That is exactly why
     FSC-A vs FSC-H excludes doublets.
     ------------------------------------------------------------------ */
  triggerOscilloscopePulse(cellData) {
    const P = SIM_PHYSICS;

    const fscA = Math.max(1, cellData.FSC_A || 0);
    const fscH = Math.max(1, Math.min(fscA * 1.02, cellData.FSC_H || fscA * 0.96));
    const sscA = Math.max(0, cellData.SSC_A || 0);

    // Time of flight for a single cell: it must traverse the beam waist plus
    // its own diameter before the signal returns to baseline. Peak height
    // reflects one cell's cross-section, so the diameter comes from FSC-H —
    // in a doublet the total area belongs to two cells, not one.
    const diameterUm = P.minCellUm + (fscH / 1000) * (P.maxCellUm - P.minCellUm);
    const transitUs = (P.beamHeightUm + diameterUm) / P.coreVelocityUmPerUs;
    const sigma = transitUs / 2.355; // FWHM of one cell transit

    // How many cells are inside this pulse, and how far apart they sit.
    const ratio = fscA / fscH;
    const nCells = ratio > 1.3 ? 2 : 1;
    let sep = 0;
    if (nCells === 2) {
      // Solve max(g) = n / ratio for the separation of two summed Gaussians.
      const overlap = Math.min(0.98, Math.max(0.05, (nCells / ratio) - 1));
      sep = sigma * Math.sqrt(-2 * Math.log(overlap));
    }

    // Amplitude of the companion traces, scaled off the same pulse shape.
    const heightFactor = fscH / fscA; // H:A of this event
    const shape = { sigma: sigma, sep: sep, n: nCells };

    const fluors = this.getActiveFluorChannels(cellData);

    this.oscPulse = {
      shape: shape,
      transitUs: transitUs,
      diameterUm: diameterUm,
      traces: [
        { key: 'FSC', label: 'FSC', amp: fscH, color: '#00e5ff', primary: true },
        { key: 'SSC', label: 'SSC', amp: sscA * heightFactor, color: '#ff007f' }
      ],
      fscA: fscA,
      fscH: fscH,
      color: this.getCellColor(cellData),
      type: cellData.type,
      isDoublet: nCells > 1,
      subThreshold: fscH < P.thresholdChannel
    };
    fluors.forEach(fl => {
      this.oscPulse.traces.push({
        key: fl.attr, label: fl.attr, amp: fl.value * heightFactor, color: fl.color
      });
    });

    // Phosphor persistence: keep a few previous traces fading behind this one.
    if (this.oscGhosts.length > 3) this.oscGhosts.shift();
    this.oscGhosts.push({ shape: shape, traces: this.oscPulse.traces, age: 0 });

    this.oscSweep = 0;

    // ---- readout ----
    const widthUs = this.measurePulseWidth(shape, fscH);
    this.pulseHeightText.innerText = `${Math.round(fscH)} ch`;
    this.pulseAreaText.innerText = `${Math.round(fscA)} ch`;
    this.pulseWidthText.innerText = `${widthUs.toFixed(2)} µs`;
    if (this.pulseRatioText) {
      this.pulseRatioText.innerText = ratio.toFixed(2);
      this.pulseRatioText.style.color = ratio > 1.3 ? 'var(--accent-orange)' : 'var(--accent-green)';
    }

    const displayType = this.friendlyCellName(cellData.type);
    let verdict = displayType;
    let note = '';
    if (this.oscPulse.subThreshold) {
      verdict = 'Below threshold — not recorded';
      note = `Peak ${Math.round(fscH)} ch is under the ${P.thresholdChannel} ch FSC threshold, so the electronics never open a data window. This is how debris is kept out of the file.`;
    } else if (nCells > 1) {
      note = `Two cells crossed the beam together. Area roughly doubled but height did not, so A ÷ H rose to ${ratio.toFixed(2)} and the event falls below the FSC-A vs FSC-H diagonal.`;
    } else {
      note = `One cell, ${diameterUm.toFixed(1)} µm across, crossing the ${P.beamHeightUm} µm beam waist at ${P.coreVelocityMps.toFixed(1)} m/s — ${transitUs.toFixed(2)} µs at half height. Width is the time above threshold. Area ÷ height ≈ 1, so the event sits on the singlet diagonal.`;
    }

    this.pulseTypeText.innerText = verdict;
    this.pulseTypeText.style.color = this.oscPulse.subThreshold ? '#f87171' : this.oscPulse.color;
    if (this.pulseNoteText) this.pulseNoteText.innerText = note;
  }

  // Normalised pulse shape, peak 1.0, t in µs relative to the pulse centre.
  pulseShapeAt(shape, t) {
    const s = shape.sigma;
    let v = 0;
    for (let i = 0; i < shape.n; i++) {
      const centre = (i - (shape.n - 1) / 2) * shape.sep;
      const d = t - centre;
      v += Math.exp(-(d * d) / (2 * s * s));
    }
    return v / this.pulseShapePeak(shape);
  }

  pulseShapePeak(shape) {
    if (shape.n === 1) return 1;
    if (shape._peak !== undefined) return shape._peak; // evaluated per sample, so cache it
    let peak = 0;
    for (let i = 0; i < shape.n; i++) {
      const centre = (i - (shape.n - 1) / 2) * shape.sep;
      let v = 0;
      for (let j = 0; j < shape.n; j++) {
        const cj = (j - (shape.n - 1) / 2) * shape.sep;
        const d = centre - cj;
        v += Math.exp(-(d * d) / (2 * shape.sigma * shape.sigma));
      }
      if (v > peak) peak = v;
    }
    shape._peak = peak;
    return peak;
  }

  // Time the pulse spends above the trigger threshold, in µs.
  measurePulseWidth(shape, amp) {
    const P = SIM_PHYSICS;
    if (amp === undefined) amp = this.oscPulse ? this.oscPulse.fscH : 1000;
    const frac = P.thresholdChannel / Math.max(1, amp);
    if (frac >= 1) return 0;
    const step = 0.02;
    const limit = P.scopeWindowUs * 0.75; // scan past the window so W never clips
    let first = null, last = null;
    for (let t = -limit; t <= limit; t += step) {
      if (this.pulseShapeAt(shape, t) >= frac) {
        if (first === null) first = t;
        last = t;
      }
    }
    return (first === null) ? 0 : (last - first);
  }

  // The fluorescence parameters of the plot currently in focus, so the trace
  // on the scope and the dot on the plot are visibly the same measurement.
  getActiveFluorChannels(cellData) {
    const plots = SIM_TUBES[this.activeTube].plots;
    const config = plots[this.activePlotIdx];
    if (!config) return [];
    const palette = ['#fbbf24', '#c084fc'];
    const out = [];
    [config.xAttr, config.yAttr].forEach(attr => {
      if (!attr) return;
      if (attr.indexOf('FSC') === 0 || attr.indexOf('SSC') === 0 || attr === 'Time') return;
      const v = cellData[attr];
      if (typeof v !== 'number') return;
      out.push({ attr: attr, value: v, color: palette[out.length] || '#fbbf24' });
    });
    return out;
  }

  friendlyCellName(type) {
    const map = {
      CD4_TCell: 'CD4 T-lymphocyte', CD8_TCell: 'CD8 T-lymphocyte', gd_TCell: 'γδ T-lymphocyte',
      BCell: 'B-lymphocyte', NKCell: 'NK cell', Monocyte: 'Monocyte', Granulocyte: 'Granulocyte',
      NormalProgenitor: 'HSC progenitor', AML_Blast: 'Myeloid blast',
      Doublets: 'Doublet (2 cells)', Debris: 'Debris'
    };
    return map[type] || type;
  }

  /* ------------------------------------------------------------------
     Oscilloscope: the raw detector voltage against time, with the three
     derived parameters (Height, Area, Width) marked on the trace itself.
     ------------------------------------------------------------------ */
  drawOscilloscope() {
    const ctx = this.oscilloscopeCtx;
    const size = this.fitCanvas(this.oscilloscopeCanvas, ctx);
    if (!size) return;
    const w = size.w, h = size.h;
    const P = SIM_PHYSICS;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#010409';
    ctx.fillRect(0, 0, w, h);

    // ---- plot frame ----
    const pad = { l: 40, r: 12, t: 24, b: 26 };
    const px = pad.l, py = pad.t;
    const pw = Math.max(40, w - pad.l - pad.r);
    const ph = Math.max(30, h - pad.t - pad.b);

    const tToX = (t) => px + ((t + P.scopeWindowUs / 2) / P.scopeWindowUs) * pw;
    const vToY = (v) => py + ph - (Math.max(0, Math.min(1050, v)) / 1050) * ph;

    // graticule
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.10)';
    ctx.lineWidth = 1;
    ctx.font = '8px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let t = -P.scopeWindowUs / 2; t <= P.scopeWindowUs / 2 + 0.001; t += P.scopeDivUs) {
      const x = Math.round(tToX(t)) + 0.5;
      ctx.beginPath(); ctx.moveTo(x, py); ctx.lineTo(x, py + ph); ctx.stroke();
      ctx.fillStyle = 'rgba(148, 163, 184, 0.55)';
      ctx.fillText(t.toFixed(0), x, py + ph + 4);
    }
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let v = 0; v <= 1000; v += 250) {
      const y = Math.round(vToY(v)) + 0.5;
      ctx.beginPath(); ctx.moveTo(px, y); ctx.lineTo(px + pw, y); ctx.stroke();
      ctx.fillStyle = 'rgba(148, 163, 184, 0.55)';
      ctx.fillText(String(v), px - 5, y);
    }

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
    ctx.strokeRect(px + 0.5, py + 0.5, pw, ph);

    // axis captions
    ctx.fillStyle = 'rgba(148, 163, 184, 0.75)';
    ctx.font = '8px ui-sans-serif, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Time (µs)', px + pw / 2, h - 1);
    ctx.save();
    ctx.translate(9, py + ph / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textBaseline = 'middle';
    ctx.fillText('Detector voltage (channels)', 0, 0);
    ctx.restore();

    // ---- trigger threshold ----
    const thrY = vToY(P.thresholdChannel);
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.75)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(px, thrY); ctx.lineTo(px + pw, thrY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(251, 191, 36, 0.9)';
    ctx.font = '8px ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`FSC threshold ${P.thresholdChannel} ch`, px + 4, thrY - 2);

    if (!this.oscPulse) {
      // resting baselines + electronic noise
      ctx.lineWidth = 1.4;
      const rest = [['#00e5ff', 0], ['#ff007f', 2]];
      rest.forEach(([col, off]) => {
        ctx.strokeStyle = col;
        ctx.beginPath();
        for (let x = 0; x <= pw; x += 2) {
          const y = vToY(4) + off + Math.sin(x * 0.7) * 0.5;
          if (x === 0) ctx.moveTo(px + x, y); else ctx.lineTo(px + x, y);
        }
        ctx.stroke();
      });
      ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
      ctx.font = '9px ui-sans-serif, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Waiting for a trigger — baseline only', px + pw / 2, py + ph * 0.45);
      return;
    }

    const pulse = this.oscPulse;

    // advance the sweep
    this.oscSweep = Math.min(1, this.oscSweep + 0.09);
    const sweepX = px + this.oscSweep * pw;

    // ---- phosphor ghosts of previous events ----
    this.oscGhosts.forEach((g, i) => {
      const alpha = 0.05 + 0.05 * (i / Math.max(1, this.oscGhosts.length - 1));
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 1;
      g.traces.forEach(tr => {
        if (tr.amp < 1) return;
        ctx.strokeStyle = tr.color;
        ctx.beginPath();
        for (let x = 0; x <= pw; x += 3) {
          const t = -P.scopeWindowUs / 2 + (x / pw) * P.scopeWindowUs;
          const y = vToY(tr.amp * this.pulseShapeAt(g.shape, t));
          if (x === 0) ctx.moveTo(px + x, y); else ctx.lineTo(px + x, y);
        }
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
    });

    // ---- area shading under the FSC trace ----
    const fscTrace = pulse.traces[0];
    ctx.fillStyle = 'rgba(0, 229, 255, 0.13)';
    ctx.beginPath();
    ctx.moveTo(px, vToY(0));
    for (let x = 0; x <= sweepX - px; x += 1) {
      const t = -P.scopeWindowUs / 2 + (x / pw) * P.scopeWindowUs;
      ctx.lineTo(px + x, vToY(fscTrace.amp * this.pulseShapeAt(pulse.shape, t)));
    }
    ctx.lineTo(sweepX, vToY(0));
    ctx.closePath();
    ctx.fill();

    // ---- analogue traces ----
    pulse.traces.forEach(tr => {
      if (tr.amp < 1) return;
      ctx.strokeStyle = tr.color;
      ctx.shadowColor = tr.color;
      ctx.shadowBlur = 5;
      ctx.lineWidth = tr.primary ? 1.8 : 1.4;
      ctx.beginPath();
      for (let x = 0; x <= sweepX - px; x += 1) {
        const t = -P.scopeWindowUs / 2 + (x / pw) * P.scopeWindowUs;
        const y = vToY(tr.amp * this.pulseShapeAt(pulse.shape, t));
        if (x === 0) ctx.moveTo(px + x, y); else ctx.lineTo(px + x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    });

    // ---- what the ADC actually stores: one sample every 100 ns ----
    // Drawn over the analogue trace as a sample-and-hold staircase.
    const sampleUs = 1 / P.adcMHz;
    ctx.strokeStyle = 'rgba(224, 242, 254, 0.75)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    let started = false;
    for (let t = -P.scopeWindowUs / 2; t <= P.scopeWindowUs / 2; t += sampleUs) {
      const x = tToX(t);
      if (x > sweepX) break;
      const y = vToY(fscTrace.amp * this.pulseShapeAt(pulse.shape, t));
      if (!started) { ctx.moveTo(x, y); started = true; }
      else { ctx.lineTo(x, y); }
      ctx.lineTo(Math.min(sweepX, tToX(t + sampleUs)), y);
    }
    if (started) ctx.stroke();

    // sweep head
    if (this.oscSweep < 1) {
      ctx.strokeStyle = 'rgba(226, 232, 240, 0.55)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(sweepX, py); ctx.lineTo(sweepX, py + ph); ctx.stroke();
    }

    // ---- H / A / W annotations, once the sweep has passed the pulse ----
    if (this.oscSweep >= 1) {
      const peakY = vToY(fscTrace.amp);
      // Measured once per event, not once per frame — the scan is not cheap.
      if (pulse.widthUs === undefined) {
        pulse.widthUs = this.measurePulseWidth(pulse.shape, pulse.fscH);
      }
      const widthUs = Math.min(P.scopeWindowUs * 0.96, pulse.widthUs);
      const x1 = tToX(-widthUs / 2), x2 = tToX(widthUs / 2);

      // Height
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = 'rgba(226, 232, 240, 0.55)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(px, peakY); ctx.lineTo(px + pw, peakY); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 9px ui-sans-serif, system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`FSC H = ${Math.round(pulse.fscH)}`, px + pw - 4, peakY - 2);

      // Width bar at threshold
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(x1, thrY - 5); ctx.lineTo(x1, thrY + 5);
      ctx.moveTo(x2, thrY - 5); ctx.lineTo(x2, thrY + 5);
      ctx.moveTo(x1, thrY); ctx.lineTo(x2, thrY);
      ctx.stroke();
      ctx.fillStyle = '#fbbf24';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(`W = ${widthUs.toFixed(2)} µs`, (x1 + x2) / 2, thrY + 7);

      // Area
      ctx.fillStyle = 'rgba(125, 211, 252, 0.95)';
      ctx.textBaseline = 'middle';
      ctx.fillText(`FSC A = ${Math.round(pulse.fscA)}`, tToX(0), vToY(fscTrace.amp * 0.32));

      if (pulse.isDoublet) {
        ctx.fillStyle = '#f87171';
        ctx.font = 'bold 9px ui-sans-serif, system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('DOUBLET — area doubled, height unchanged', px + 4, py + 3);
      } else if (pulse.subThreshold) {
        ctx.fillStyle = '#f87171';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('SUB-THRESHOLD — event rejected', px + 4, py + 3);
      }
    }

    // ---- channel legend ----
    let lx = px;
    ctx.font = '9px ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    pulse.traces.forEach(tr => {
      if (tr.amp < 1) return;
      ctx.fillStyle = tr.color;
      ctx.fillRect(lx, py - 14, 10, 2.5);
      ctx.fillText(tr.label, lx + 14, py - 13);
      lx += 22 + ctx.measureText(tr.label).width;
    });
    ctx.fillStyle = 'rgba(224, 242, 254, 0.75)';
    ctx.fillRect(lx, py - 14, 10, 2.5);
    ctx.fillStyle = 'rgba(148, 163, 184, 0.85)';
    ctx.fillText(`ADC ${P.adcMHz} MHz`, lx + 14, py - 13);
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
    if (originCase.startsWith('aml_m')) {
      selectCaseValue = originCase;
    } else if (originCase.toLowerCase().includes('aml') || originCase === 'aml') {
      selectCaseValue = 'aml';
    } else if (originCase.toLowerCase().includes('compare') || originCase === 'compare') {
      selectCaseValue = 'normal';
    }
  }
  flowCytometerSim.caseSelect.value = selectCaseValue;
  flowCytometerSim.activeCase = selectCaseValue;
  
  flowCytometerSim.resetSimulation();
}
