/**
 * leukaemia-reference.js
 * Interactive Leukaemia Predictor & Decision Flowchart.
 * Compiles immunophenotyping diagnostic criteria from Slides 13 & 14 of Immunophenotyping.pptx.
 */

(function() {
  // 1. Dataset representing Slide 13 & Slide 14 criteria
  const LEUKAEMIAS = [
    {
      id: "pre-b-all",
      name: "Pre B-ALL",
      fullName: "Acute B-Lymphoblastic Leukaemia",
      category: "acute",
      lineage: "B-cell",
      description: "Characterized by clonal expansion of immature B-cell precursors (lymphoblasts). Highly positive for immature markers (CD34, TDT) and pan-B markers.",
      morphology: "Lymphoblasts in bone marrow or peripheral blood.",
      genetics: "Variable karyotypes, hyperdiploidy, t(9;22) BCR-ABL1, etc.",
      markers: {
        CD34: "+", TDT: "+", CD19: "+", CD10: "+", cCD79a: "+",
        CD22: "-/+", CD20: "+/-", CD79b: "+/-", Kappa: "-", Lambda: "-",
        CD13: "aberrant", CD33: "aberrant" // Myeloid aberrancies (red on slide)
      }
    },
    {
      id: "t-all",
      name: "T-ALL",
      fullName: "Acute T-Lymphoblastic Leukaemia",
      category: "acute",
      lineage: "T-cell",
      description: "Arises from immature T-cell precursors. Typically presents with a high WBC count and mediastinal mass. Characterized by cytoplasmic CD3 and CD7 expression.",
      morphology: "Lymphoblasts, often with convoluted nuclei.",
      genetics: "TAL1, LMO1/2, TLX1/3 translocations.",
      markers: {
        CD34: "+", TDT: "+", CD7: "+", cCD3: "+", sCD3: "-",
        CD2: "+/-", CD5: "+/-", CD4: "+/-", CD8: "+/-",
        CD117: "aberrant" // Myeloid aberrancy (red on slide)
      }
    },
    {
      id: "burkitts",
      name: "Burkitt's Lymphoma",
      fullName: "Burkitt's Lymphoma / Leukemia",
      category: "acute", // Grouped in Acute Leukemia section in slide 13
      lineage: "B-cell",
      description: "A highly aggressive B-cell neoplasm. Unlike lymphoblastic leukemia (Pre B-ALL), it is negative for immature markers (CD34-, TDT-) and expresses clonal surface immunoglobulin.",
      morphology: "Medium-sized cells with basophilic cytoplasm and lipid vacuoles. 'Starry-sky' pattern in biopsy.",
      genetics: "t(8;14) MYC translocation.",
      markers: {
        CD34: "-", TDT: "-", CD19: "+", CD20: "+", CD22: "+", cCD79a: "+", CD79b: "+",
        CD10: "-", // Slide 13 lists CD10- (contrary to typical CD10+)
        Kappa: "+/-", Lambda: "+/-" // Monoclonal expression (either Kappa+ or Lambda+)
      }
    },
    {
      id: "m0",
      name: "AML-M0",
      fullName: "AML with no minimal maturation",
      category: "acute",
      lineage: "Myeloid",
      description: "Myeloblastic leukemia showing no myeloid differentiation. Blasts are positive for CD34 and early myeloid markers but MPO cytochemically negative.",
      morphology: "Undifferentiated blasts.",
      genetics: "Complex cytogenetics, often adverse.",
      markers: {
        CD34: "+", CD117: "+", HLA_DR: "+", MPO: "-", CD13: "+",
        CD33: "+/-", CD18: "+/-", CD11b: "+/-",
        CD2: "aberrant", CD7: "aberrant", CD56: "aberrant", CD19: "aberrant" // Aberrant lymphoid markers (red on slide)
      }
    },
    {
      id: "m1",
      name: "AML-M1",
      fullName: "AML with minimal maturation",
      category: "acute",
      lineage: "Myeloid",
      description: "Myeloblastic leukemia with minimal maturation. Similar to M0 but MPO positive by flow cytometry or cytochemistry.",
      morphology: "Myeloblasts, rarely Auer rods.",
      markers: {
        CD34: "+", CD117: "+", HLA_DR: "+", MPO: "+", CD13: "+",
        CD33: "+/-", CD18: "+/-", CD11b: "+/-",
        CD2: "aberrant", CD7: "aberrant", CD56: "aberrant", CD19: "aberrant"
      }
    },
    {
      id: "m2",
      name: "AML-M2",
      fullName: "AML with maturation",
      category: "acute",
      lineage: "Myeloid",
      description: "Myeloblastic leukemia with maturation. Frequently associated with t(8;21) translocation. Blasts show maturation beyond promyelocyte stage.",
      morphology: "Myeloblasts, promyelocytes, and maturing granulocytes. Auer rods are common.",
      genetics: "t(8;21) RUNX1-RUNX1T1.",
      markers: {
        CD34: "+", CD117: "+", HLA_DR: "+", MPO: "+", CD13: "+", CD33: "+", CD18: "+", CD11b: "+",
        CD2: "aberrant", CD7: "aberrant", CD56: "aberrant", CD19: "aberrant"
      }
    },
    {
      id: "m3",
      name: "AML-M3 (APL)",
      fullName: "Acute Promyelocytic Leukaemia",
      category: "acute",
      lineage: "Myeloid",
      description: "Characterized by t(15;17) PML-RARA translocation. Presents with severe disseminated intravascular coagulation (DIC). Blasts are classically HLA-DR negative and CD34 negative, with intense CD33.",
      morphology: "Hypergranular abnormal promyelocytes. 'Fagot cells' containing bundles of Auer rods.",
      genetics: "t(15;17) PML-RARA (CGN PMLRARA on Slide 13).",
      markers: {
        CD34: "-", CD117: "-", HLA_DR: "-", CD18: "-", CD11b: "-",
        CD33: "+", CD13: "+", MPO: "+", // MPO and CD33 are strongly positive (+++)
        CD2: "aberrant", CD7: "aberrant", CD56: "aberrant", CD19: "aberrant"
      }
    },
    {
      id: "m4",
      name: "AML-M4",
      fullName: "Acute Myelomonocytic Leukaemia",
      category: "acute",
      lineage: "Myeloid",
      description: "Leukemia with both myeloid and monocytic differentiation. Marrow contains >20% myeloblasts and >20% monocytic precursors.",
      morphology: "Myeloblasts, monoblasts, and promonocytes.",
      genetics: "inv(16) or t(16;16) CBFB-MYH11.",
      markers: {
        CD34: "+", CD117: "+/-", HLA_DR: "+", CD13: "+", CD33: "+", CD11b: "+", CD18: "+", MPO: "+",
        NSE: "+", // Labeled 'NSA+' on Slide 13
        CD2: "aberrant", CD7: "aberrant", CD56: "aberrant", CD19: "aberrant"
      }
    },
    {
      id: "m5",
      name: "AML-M5",
      fullName: "Acute Monoblastic/Monocytic Leukaemia",
      category: "acute",
      lineage: "Myeloid",
      description: "Leukemia where >80% of leukemic cells are monocytic (monoblasts/promonocytes). CD34 and CD117 are often negative, HLA-DR and CD33 are extremely bright.",
      morphology: "Large monoblasts with abundant cytoplasm, folded nuclei.",
      genetics: "KMT2A (MLL) translocations, t(9;11).",
      markers: {
        CD34: "+", CD117: "-", HLA_DR: "+", CD33: "+", CD13: "+", CD11b: "+", CD18: "+",
        MPO: "+/-", // Weak expression
        NSE: "+", // Strongly positive (NSE+++)
        CD2: "aberrant", CD7: "aberrant", CD56: "aberrant", CD19: "aberrant"
      }
    },
    {
      id: "m6",
      name: "AML-M6",
      fullName: "Acute Erythroid Leukaemia",
      category: "acute",
      lineage: "Erythroid",
      description: "Aggressive leukemia featuring >50% erythroid precursors in the marrow. Expresses Glycophorin A (GLY-A) at mature stages.",
      morphology: "Multinucleated, dysplastic erythroblasts.",
      markers: {
        GLY_A: "+"
      }
    },
    {
      id: "m7",
      name: "AML-M7",
      fullName: "Acute Megakaryoblastic Leukaemia",
      category: "acute",
      lineage: "Megakaryocytic",
      description: "Leukemia of megakaryocytic lineage. Associated with osteosclerosis and marrow fibrosis. Expresses platelet glycoprotein CD41/CD61.",
      morphology: "Megakaryoblasts, often with cytoplasmic projections/blebs.",
      markers: {
        CD41: "+"
      }
    },
    {
      id: "b-cll",
      name: "B-CLL",
      fullName: "B-Chronic Lymphocytic Leukaemia",
      category: "chronic",
      lineage: "B-cell",
      description: "Indolent mature B-cell leukemia. Co-expresses CD5 and CD23. Classically features dim CD20 and CD22, and is FMC7 negative.",
      morphology: "Small, mature lymphocytes with clumped chromatin. Smudge cells ('Gumprecht shadows') on blood film.",
      markers: {
        CD19: "+", CD5: "+", CD23: "+", CD10: "-", CD20: "-/+", CD22: "-", FMC7: "-",
        CD79b: "-/+", Kappa: "-", Lambda: "-" // Low or negative clonal light chains
      }
    },
    {
      id: "mcl",
      name: "Mantle Cell Lymphoma (MCL)",
      fullName: "Mantle Cell Lymphoma",
      category: "chronic",
      lineage: "B-cell",
      description: "Aggressive mature B-cell lymphoma. Expresses CD5 but is CD23 negative. Characterized by CCND1 translocation (Cyclin D1 expression) and bright CD20.",
      morphology: "Small to medium lymphocytes with indented nuclei.",
      genetics: "t(11;14) CCND1-IGH.",
      markers: {
        CD19: "+", CD5: "+", CD23: "-", CD10: "-", CD20: "+", CD22: "+", FMC7: "+/-", CD79b: "+",
        Kappa: "+/-", Lambda: "+/-" // Monoclonal light chain restriction (K+ or L+)
      }
    },
    {
      id: "b-pll",
      name: "B-PLL",
      fullName: "B-Prolymphocytic Leukaemia",
      category: "chronic",
      lineage: "B-cell",
      description: "Rare, aggressive leukemia with >55% circulating prolymphocytes. CD5 positive (often strongly) and CD23 negative, with very strong B-cell markers.",
      morphology: "Medium-sized prolymphocytes with a round nucleus and central prominent nucleolus.",
      markers: {
        CD19: "+", CD5: "+", CD23: "-", CD10: "-", CD20: "+", CD22: "+", FMC7: "+/-", CD79b: "+",
        Kappa: "+/-", Lambda: "+/-" // Monoclonal light chain restriction (K++ or L++)
      }
    },
    {
      id: "b-lpd",
      name: "B-LPD",
      fullName: "B-Cell Lymphoproliferative Disorder (NOS)",
      category: "chronic",
      lineage: "B-cell",
      description: "A general diagnostic category for mature B-cell lymphoproliferative disorders that do not express CD5 or CD10 (CD5- negative, CD10- negative).",
      morphology: "Variable mature lymphocytes.",
      markers: {
        CD19: "+", CD5: "-", CD23: "-", CD10: "-", CD20: "+", CD22: "+", FMC7: "+/-", CD79b: "+",
        Kappa: "+/-", Lambda: "+/-"
      }
    },
    {
      id: "hcl",
      name: "Hairy Cell Leukaemia",
      fullName: "Hairy Cell Leukaemia",
      category: "chronic",
      lineage: "B-cell",
      description: "Indolent leukemia of mature B-cells. Classic profile includes splenomegaly, cytopenias, and strong expression of CD25, CD11c, and CD103. Labeled CD25+ on Slide 14.",
      morphology: "Lymphocytes with circumferential fine hair-like cytoplasmic projections.",
      genetics: "BRAF V600E mutation.",
      markers: {
        CD19: "+", CD5: "-", CD23: "-", CD10: "-", CD20: "+", CD22: "+", FMC7: "-", CD79b: "+",
        CD25: "+", Kappa: "+/-", Lambda: "+/-"
      }
    },
    {
      id: "fl",
      name: "Follicular Lymphoma",
      fullName: "Follicular Lymphoma",
      category: "chronic",
      lineage: "B-cell",
      description: "Common mature B-cell neoplasm arising from germinal center B-cells. Characterized by CD10 expression and CD5 negativity.",
      morphology: "Follicular nodular structures; centrocytes and centroblasts.",
      genetics: "t(14;18) IGH-BCL2.",
      markers: {
        CD19: "+", CD5: "-", CD23: "-", CD10: "+", CD20: "+", CD22: "+", FMC7: "+", CD79b: "+",
        Kappa: "+/-", Lambda: "+/-"
      }
    },
    {
      id: "t-lpd",
      name: "T-LPD",
      fullName: "T-Cell Lymphoproliferative Disorder",
      category: "chronic",
      lineage: "T-cell",
      description: "Mature T-cell lymphoproliferative disorders. Classically features mature T-cell markers and a cytotoxic (CD8+) phenotype.",
      morphology: "Atypical mature T-lymphocytes.",
      markers: {
        CD3: "+", CD8: "+", CD4: "-", CD7: "-/+", CD5: "+/-", CD2: "+/-"
      }
    },
    {
      id: "atll",
      name: "Adult T-Cell Leukaemia",
      fullName: "Adult T-Cell Leukaemia/Lymphoma",
      category: "chronic",
      lineage: "T-cell",
      description: "Aggressive mature T-cell leukemia linked to HTLV-1 infection. Characterized by CD4+ cells co-expressing CD25 and loss of CD7.",
      morphology: "Circulating pleomorphic lymphocytes with highly indented nuclei ('flower cells').",
      markers: {
        CD3: "+", CD7: "+", CD5: "+", CD2: "+", CD4: "+", CD8: "-", CD25: "+"
      }
    },
    {
      id: "sezary",
      name: "Sezary Syndrome",
      fullName: "Sezary Syndrome",
      category: "chronic",
      lineage: "T-cell",
      description: "Leukemic phase of Mycosis Fungoides. Triad of erythroderma, lymphadenopathy, and circulating CD4+ lymphocytes with cerebriform nuclei. Labeled CD7+ and CD25- on Slide 14.",
      morphology: "Circulating atypical lymphocytes with folded, cerebriform nuclei ('Sezary cells').",
      markers: {
        CD3: "+", CD7: "+", CD5: "+", CD2: "+", CD4: "+", CD8: "-", CD25: "-"
      }
    },
    {
      id: "lgl",
      name: "LGL Leukaemia",
      fullName: "Large Granular Lymphocytic Leukaemia",
      category: "chronic",
      lineage: "T-cell", // Can also be NK-cell, but categorized under T-lymphoid in Slide 14
      description: "Indolent leukemia of mature cytotoxic lymphocytes. Strongly associated with neutropenia, anemia, and rheumatoid arthritis.",
      morphology: "Circulating lymphocytes with abundant cytoplasm and prominent azurophilic granules.",
      markers: {
        // Slide 14 lists 'Variable'
      }
    },
    {
      id: "plasma-cell",
      name: "Plasma Cell Leukaemia",
      fullName: "Plasma Cell Leukaemia",
      category: "plasma-cell",
      lineage: "Plasma",
      description: "Highly aggressive neoplasm of plasma cells, characterized by circulating clonal plasma cells. Classically CD38+ and CD138+ positive.",
      morphology: "Plasmacytoid cells with eccentric nuclei and a perinuclear halo.",
      markers: {
        CD19: "+", CD138: "+", CD38: "+" // CD19 is aberrantly positive on these cells according to Slide 14
      }
    }
  ];

  // Organised Marker Groups for UI Accordion
  const MARKER_GROUPS = [
    {
      name: "Stem Cell & Myeloid Blasts",
      id: "group-stem",
      markers: [
        { id: "CD34", label: "CD34" },
        { id: "CD117", label: "CD117" },
        { id: "TDT", label: "TdT" },
        { id: "HLA_DR", label: "HLA-DR" },
        { id: "MPO", label: "MPO" }
      ]
    },
    {
      name: "B-Cell Lineage",
      id: "group-bcell",
      markers: [
        { id: "CD19", label: "CD19" },
        { id: "CD20", label: "CD20" },
        { id: "CD22", label: "CD22" },
        { id: "cCD79a", label: "cCD79a" },
        { id: "CD79b", label: "CD79b" },
        { id: "CD10", label: "CD10" },
        { id: "CD5", label: "CD5" },
        { id: "CD23", label: "CD23" },
        { id: "FMC7", label: "FMC7" },
        { id: "Kappa", label: "Kappa (κ)" },
        { id: "Lambda", label: "Lambda (λ)" }
      ]
    },
    {
      name: "T-Cell & NK Lineage",
      id: "group-tcell",
      markers: [
        { id: "cCD3", label: "cCD3" },
        { id: "sCD3", label: "sCD3" },
        { id: "CD2", label: "CD2" },
        { id: "CD7", label: "CD7" },
        { id: "CD4", label: "CD4" },
        { id: "CD8", label: "CD8" },
        { id: "CD56", label: "CD56" }
      ]
    },
    {
      name: "Myelomonocytic & Others",
      id: "group-myeloid",
      markers: [
        { id: "CD13", label: "CD13" },
        { id: "CD33", label: "CD33" },
        { id: "CD11b", label: "CD11b" },
        { id: "CD18", label: "CD18" },
        { id: "CD14", label: "CD14" },
        { id: "CD15", label: "CD15" },
        { id: "CD64", label: "CD64" },
        { id: "CD25", label: "CD25" },
        { id: "NSE", label: "NSE" },
        { id: "GLY_A", label: "GLY-A (Glycophorin)" },
        { id: "CD41", label: "CD41" },
        { id: "CD138", label: "CD138" },
        { id: "CD38", label: "CD38" }
      ]
    }
  ];

  // Flowchart Decision Tree data (Coordinates designed for width 400 SVG)
  const ACUTE_TREE = {
    nodes: [
      { id: 'blasts', label: 'Blast Cells (BM)', x: 145, y: 10, w: 110, h: 26, type: 'root' },
      { id: 'lymphoid', label: 'Lymphoid Blasts', x: 50, y: 70, w: 105, h: 26, type: 'branch' },
      { id: 'myeloid', label: 'Myeloid Blasts', x: 245, y: 70, w: 105, h: 26, type: 'branch' },
      { id: 'pre-b-all', label: 'Pre B-ALL', x: 5, y: 135, w: 65, h: 24, type: 'disease' },
      { id: 't-all', label: 'T-ALL', x: 80, y: 135, w: 50, h: 24, type: 'disease' },
      { id: 'burkitts', label: 'Burkitt\'s', x: 140, y: 135, w: 65, h: 24, type: 'disease' },
      { id: 'm0', label: 'M0', x: 220, y: 135, w: 35, h: 24, type: 'disease' },
      { id: 'm1', label: 'M1', x: 260, y: 135, w: 35, h: 24, type: 'disease' },
      { id: 'm2', label: 'M2', x: 300, y: 135, w: 35, h: 24, type: 'disease' },
      { id: 'm3', label: 'M3 (APL)', x: 340, y: 135, w: 55, h: 24, type: 'disease' },
      { id: 'm4', label: 'M4', x: 220, y: 195, w: 35, h: 24, type: 'disease' },
      { id: 'm5', label: 'M5', x: 265, y: 195, w: 35, h: 24, type: 'disease' },
      { id: 'm6', label: 'M6', x: 310, y: 195, w: 35, h: 24, type: 'disease' },
      { id: 'm7', label: 'M7', x: 355, y: 195, w: 40, h: 24, type: 'disease' }
    ],
    links: [
      { from: 'blasts', to: 'lymphoid' },
      { from: 'blasts', to: 'myeloid' },
      { from: 'lymphoid', to: 'pre-b-all' },
      { from: 'lymphoid', to: 't-all' },
      { from: 'lymphoid', to: 'burkitts' },
      { from: 'myeloid', to: 'm0' },
      { from: 'myeloid', to: 'm1' },
      { from: 'myeloid', to: 'm2' },
      { from: 'myeloid', to: 'm3' },
      { from: 'myeloid', to: 'm4' },
      { from: 'myeloid', to: 'm5' },
      { from: 'myeloid', to: 'm6' },
      { from: 'myeloid', to: 'm7' }
    ]
  };

  const CHRONIC_TREE = {
    nodes: [
      { id: 'lymphocytes', label: 'Lymphocyte Neoplasm', x: 125, y: 10, w: 150, h: 26, type: 'root' },
      { id: 'b-lymphoid', label: 'B-Lymphoid (CD19+)', x: 35, y: 70, w: 120, h: 26, type: 'branch' },
      { id: 't-lymphoid', label: 'T-Lymphoid (CD3+)', x: 245, y: 70, w: 120, h: 26, type: 'branch' },
      { id: 'plasma-cell', label: 'Plasma Cell Leukaemia', x: 130, y: 135, w: 140, h: 24, type: 'disease' },
      
      // B-cell sub-branches
      { id: 'b-cd5-pos', label: 'CD5+ B-cells', x: 10, y: 135, w: 80, h: 24, type: 'branch' },
      { id: 'b-cd5-neg', label: 'CD5- B-cells', x: 95, y: 135, w: 80, h: 24, type: 'branch' },
      
      // CD5+ B-cells diseases
      { id: 'b-cll', label: 'B-CLL', x: 5, y: 195, w: 45, h: 24, type: 'disease' },
      { id: 'mcl', label: 'MCL', x: 55, y: 195, w: 35, h: 24, type: 'disease' },
      { id: 'b-pll', label: 'B-PLL', x: 25, y: 250, w: 45, h: 24, type: 'disease' },
      
      // CD5- B-cells diseases
      { id: 'b-lpd', label: 'B-LPD', x: 95, y: 195, w: 45, h: 24, type: 'disease' },
      { id: 'hcl', label: 'HCL', x: 95, y: 250, w: 45, h: 24, type: 'disease' },
      { id: 'fl', label: 'FL', x: 95, y: 305, w: 45, h: 24, type: 'disease' },
      
      // T-cell sub-branches
      { id: 't-cd4-neg', label: 'CD8+ T-cells', x: 245, y: 135, w: 80, h: 24, type: 'branch' },
      { id: 't-cd4-pos', label: 'CD4+ T-cells', x: 330, y: 135, w: 65, h: 24, type: 'branch' },
      
      // T-cells diseases
      { id: 't-lpd', label: 'T-LPD', x: 245, y: 195, w: 45, h: 24, type: 'disease' },
      { id: 'lgl', label: 'LGL', x: 245, y: 250, w: 45, h: 24, type: 'disease' },
      { id: 'atll', label: 'ATLL', x: 300, y: 195, w: 40, h: 24, type: 'disease' },
      { id: 'sezary', label: 'SEZARY', x: 345, y: 195, w: 50, h: 24, type: 'disease' }
    ],
    links: [
      { from: 'lymphocytes', to: 'b-lymphoid' },
      { from: 'lymphocytes', to: 't-lymphoid' },
      { from: 'lymphocytes', to: 'plasma-cell' },
      
      { from: 'b-lymphoid', to: 'b-cd5-pos' },
      { from: 'b-lymphoid', to: 'b-cd5-neg' },
      
      { from: 'b-cd5-pos', to: 'b-cll' },
      { from: 'b-cd5-pos', to: 'mcl' },
      { from: 'b-cd5-pos', to: 'b-pll' },
      
      { from: 'b-cd5-neg', to: 'b-lpd' },
      { from: 'b-cd5-neg', to: 'hcl' },
      { from: 'b-cd5-neg', to: 'fl' },
      
      { from: 't-lymphoid', to: 't-cd4-neg' },
      { from: 't-lymphoid', to: 't-cd4-pos' },
      
      { from: 't-cd4-neg', to: 't-lpd' },
      { from: 't-cd4-neg', to: 'lgl' },
      
      { from: 't-cd4-pos', to: 'atll' },
      { from: 't-cd4-pos', to: 'sezary' }
    ]
  };

  // State Management
  const selectedMarkers = {}; // CD34: 'pos' | 'neg' | 'neutral'
  let activeSubtab = 'predictor'; // 'predictor' | 'flowchart'
  let currentFlowchart = 'acute'; // 'acute' | 'chronic'

  // Initialize selectedMarkers state
  MARKER_GROUPS.forEach(g => {
    g.markers.forEach(m => {
      selectedMarkers[m.id] = 'neutral';
    });
  });

  // DOM elements cache
  let predictorTabBtn, flowchartTabBtn;
  let predictorPane, flowchartPane;
  let accordionContainer, predictionsContainer;
  let resetBtn, closeSidebarBtn;
  let treeBtnAcute, treeBtnChronic, svgElement;
  let detailDrawer, drawerTitle, drawerBody, drawerCloseBtn;

  // Initialize logic on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    cacheElements();
    setupEventListeners();
    renderMarkerAccordions();
    updatePredictions();
    initFlowchart();
  });

  function cacheElements() {
    predictorTabBtn = document.querySelector('.leukaemia-subtab-btn[data-subtab="predictor"]');
    flowchartTabBtn = document.querySelector('.leukaemia-subtab-btn[data-subtab="flowchart"]');
    predictorPane = document.getElementById('leukaemia-pane-predictor');
    flowchartPane = document.getElementById('leukaemia-pane-flowchart');
    accordionContainer = document.getElementById('marker-groups-accordion');
    predictionsContainer = document.getElementById('predictions-list');
    resetBtn = document.getElementById('reset-markers-btn');
    closeSidebarBtn = document.getElementById('close-sidebar-btn-leukaemia');
    treeBtnAcute = document.getElementById('tree-btn-acute');
    treeBtnChronic = document.getElementById('tree-btn-chronic');
    svgElement = document.getElementById('flowchart-svg');

    // Detail Drawer
    detailDrawer = document.getElementById('leukaemia-detail-drawer');
    drawerTitle = document.getElementById('drawer-title');
    drawerBody = document.getElementById('drawer-body');
    drawerCloseBtn = document.getElementById('close-drawer-btn');
  }

  function setupEventListeners() {
    // Left sidebar close integration
    if (closeSidebarBtn) {
      closeSidebarBtn.addEventListener('click', () => {
        if (typeof toggleSidebar === 'function') {
          toggleSidebar(false);
        }
      });
    }

    // Sub-tab switches
    if (predictorTabBtn && flowchartTabBtn) {
      predictorTabBtn.addEventListener('click', () => switchPane('predictor'));
      flowchartTabBtn.addEventListener('click', () => switchPane('flowchart'));
    }

    // Reset button
    if (resetBtn) {
      resetBtn.addEventListener('click', resetAllMarkers);
    }

    // Flowchart tree switch buttons
    if (treeBtnAcute && treeBtnChronic) {
      treeBtnAcute.addEventListener('click', () => switchFlowchart('acute'));
      treeBtnChronic.addEventListener('click', () => switchFlowchart('chronic'));
    }

    // Detail drawer close
    if (drawerCloseBtn) {
      drawerCloseBtn.addEventListener('click', closeDetailDrawer);
    }
  }

  function switchPane(paneId) {
    activeSubtab = paneId;
    if (paneId === 'predictor') {
      predictorTabBtn.classList.add('active');
      flowchartTabBtn.classList.remove('active');
      predictorPane.classList.add('active');
      flowchartPane.classList.remove('active');
    } else {
      flowchartTabBtn.classList.add('active');
      predictorTabBtn.classList.remove('active');
      flowchartPane.classList.add('active');
      predictorPane.classList.remove('active');
      drawFlowchart();
    }
    closeDetailDrawer();
  }

  function switchFlowchart(type) {
    currentFlowchart = type;
    if (type === 'acute') {
      treeBtnAcute.classList.add('active');
      treeBtnChronic.classList.remove('active');
      svgElement.setAttribute('viewBox', '0 0 400 300');
      svgElement.setAttribute('height', '300');
    } else {
      treeBtnChronic.classList.add('active');
      treeBtnAcute.classList.remove('active');
      svgElement.setAttribute('viewBox', '0 0 400 350');
      svgElement.setAttribute('height', '350');
    }
    drawFlowchart();
  }

  function resetAllMarkers() {
    Object.keys(selectedMarkers).forEach(k => {
      selectedMarkers[k] = 'neutral';
    });
    
    // Reset toggle button highlights in UI
    document.querySelectorAll('.marker-state-btn').forEach(btn => {
      if (btn.getAttribute('data-val') === 'neutral') {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    updatePredictions();
    drawFlowchart();
    closeDetailDrawer();
  }

  // 2. Predictor Score Algorithm
  function getMatchScore(disease, activeSelections) {
    let score = 0;
    let totalSelected = 0;
    let isCompatible = true;
    
    const selectedKeys = Object.keys(activeSelections).filter(k => activeSelections[k] !== 'neutral');
    if (selectedKeys.length === 0) {
      return { score: 100, isCompatible: true, totalSelected: 0, matchedCount: 0 };
    }
    
    for (const marker of selectedKeys) {
      const userVal = activeSelections[marker];
      const expectedVal = disease.markers[marker] || '-'; // default unspecified is negative
      
      if (userVal === 'pos') {
        totalSelected++;
        if (expectedVal === '+' || expectedVal === '++' || expectedVal === '+++') {
          score += 1.0;
        } else if (expectedVal === '+/-' || expectedVal === '-/+' || expectedVal === '+ or -') {
          score += 0.7; // Partial/variable match
        } else if (expectedVal === 'aberrant') {
          score += 0.5; // Aberrantly positive is compatible but scored lower than prototypical
        } else if (expectedVal === '-') {
          isCompatible = false; // Strictly negative antigen expressed = mismatch
        }
      } else if (userVal === 'neg') {
        totalSelected++;
        if (expectedVal === '-') {
          score += 1.0;
        } else if (expectedVal === 'aberrant') {
          score += 1.0; // Aberrant is typically negative
        } else if (expectedVal === '+/-' || expectedVal === '-/+' || expectedVal === '+ or -') {
          score += 0.7; // Variable negative
        } else if (expectedVal === '+' || expectedVal === '++' || expectedVal === '+++') {
          isCompatible = false; // Prototypical antigen absent = mismatch
        }
      }
    }
    
    const finalPercent = totalSelected > 0 ? Math.round((score / totalSelected) * 100) : 100;
    
    return {
      score: isCompatible ? finalPercent : 0,
      isCompatible: isCompatible && (totalSelected === 0 || score > 0),
      totalSelected: totalSelected,
      matchedCount: Math.round(score)
    };
  }

  // 3. UI Renders
  function renderMarkerAccordions() {
    if (!accordionContainer) return;
    accordionContainer.innerHTML = '';

    MARKER_GROUPS.forEach((group, idx) => {
      const isExpanded = idx === 0; // Expand first group by default
      
      const item = document.createElement('div');
      item.className = `accordion-item ${isExpanded ? 'expanded' : ''}`;
      
      const header = document.createElement('div');
      header.className = 'accordion-header';
      header.innerHTML = `
        <span>${group.name}</span>
        <svg class="accordion-arrow" width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 1l4 4 4-4"/></svg>
      `;
      
      const content = document.createElement('div');
      content.className = 'accordion-content';
      
      // Build rows for each marker in the group
      group.markers.forEach(m => {
        const row = document.createElement('div');
        row.className = 'marker-row';
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'center';
        row.style.padding = '6px 12px';
        row.style.borderBottom = '1px solid rgba(255,255,255,0.03)';

        row.innerHTML = `
          <span class="marker-label" style="font-size: 12px; font-weight: 500; color: var(--text-primary);">${m.label}</span>
          <div class="marker-toggle-group" style="display: flex; gap: 2px; background: rgba(0,0,0,0.2); border-radius: 4px; padding: 2px;">
            <button class="marker-state-btn btn-neg" data-marker="${m.id}" data-val="neg" title="Negative expression">-</button>
            <button class="marker-state-btn btn-neutral active" data-marker="${m.id}" data-val="neutral" title="Unspecified state">?</button>
            <button class="marker-state-btn btn-pos" data-marker="${m.id}" data-val="pos" title="Positive expression">+</button>
          </div>
        `;
        content.appendChild(row);
      });

      item.appendChild(header);
      item.appendChild(content);
      accordionContainer.appendChild(item);

      // Event listener for expanding/collapsing accordion
      header.addEventListener('click', () => {
        const expanded = item.classList.toggle('expanded');
      });
    });

    // Setup marker toggle buttons click listeners
    document.querySelectorAll('.marker-state-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const marker = btn.getAttribute('data-marker');
        const val = btn.getAttribute('data-val');
        
        // Remove active class from sibling buttons in this group
        const group = btn.parentElement;
        group.querySelectorAll('.marker-state-btn').forEach(b => b.classList.remove('active'));
        
        // Activate current button
        btn.classList.add('active');
        
        // Update model state
        selectedMarkers[marker] = val;
        
        // Update list and flowchart highlights in real-time
        updatePredictions();
        drawFlowchart();
      });
    });
  }

  function updatePredictions() {
    if (!predictionsContainer) return;
    predictionsContainer.innerHTML = '';

    // Calculate score for each leukaemia in database
    const scoredList = LEUKAEMIAS.map(disease => {
      const matchDetails = getMatchScore(disease, selectedMarkers);
      return {
        disease,
        score: matchDetails.score,
        isCompatible: matchDetails.isCompatible,
        totalSelected: matchDetails.totalSelected,
        matchedCount: matchDetails.matchedCount
      };
    });

    // Filter compatible, sort by score descending
    const compatible = scoredList.filter(item => item.isCompatible);
    const incompatible = scoredList.filter(item => !item.isCompatible);
    
    // Sort compatible by score, then by name
    compatible.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.disease.name.localeCompare(b.disease.name);
    });

    // Render matches
    if (compatible.length === 0) {
      predictionsContainer.innerHTML = `
        <div style="text-align: center; padding: 20px; color: var(--text-muted); font-size: 11px;">
          No matching diagnostic profiles. Reset markers to clear conflicts.
        </div>
      `;
      return;
    }

    // Render compatible list
    compatible.forEach(item => {
      const d = item.disease;
      const card = document.createElement('div');
      
      // Determine glow state based on score
      let matchClass = 'match-partial';
      if (item.score === 100) matchClass = 'match-perfect';
      if (item.totalSelected === 0) matchClass = 'match-neutral';

      card.className = `prediction-card ${matchClass}`;
      
      const headerRow = document.createElement('div');
      headerRow.className = 'pred-card-header';
      headerRow.style.display = 'flex';
      headerRow.style.justifyContent = 'space-between';
      headerRow.style.alignItems = 'center';
      
      // Score badge color
      let badgeStyle = `background-color: rgba(148, 163, 184, 0.1); color: var(--text-secondary);`;
      if (item.score === 100) {
        badgeStyle = `background-color: rgba(0, 229, 255, 0.1); color: var(--accent-cyan); border: 1.5px solid rgba(0, 229, 255, 0.2);`;
      } else if (item.score > 0) {
        badgeStyle = `background-color: rgba(255, 152, 0, 0.1); color: var(--accent-orange); border: 1.5px solid rgba(255, 152, 0, 0.2);`;
      }

      headerRow.innerHTML = `
        <div style="display: flex; flex-direction: column;">
          <span style="font-weight: 700; font-size: 13px; color: var(--text-primary);">${d.name}</span>
          <span style="font-size: 10px; color: var(--text-muted);">${d.fullName}</span>
        </div>
        <span class="score-badge" style="font-size: 11px; font-weight: 700; padding: 2px 6px; border-radius: 4px; ${badgeStyle}">
          ${item.totalSelected > 0 ? `${item.score}%` : 'Reference'}
        </span>
      `;
      
      card.appendChild(headerRow);

      // Brief summary details
      const detailRow = document.createElement('div');
      detailRow.style.display = 'flex';
      detailRow.style.gap = '6px';
      detailRow.style.marginTop = '6px';
      detailRow.style.fontSize = '9px';
      
      let lineageColor = 'var(--text-muted)';
      if (d.lineage === 'B-cell') lineageColor = 'var(--accent-blue)';
      if (d.lineage === 'T-cell') lineageColor = 'var(--border-active)';
      if (d.lineage === 'Myeloid') lineageColor = 'var(--accent-purple)';
      if (d.lineage === 'Plasma') lineageColor = 'var(--accent-red)';

      detailRow.innerHTML = `
        <span style="color: ${lineageColor}; font-weight: 600; text-transform: uppercase;">${d.lineage}</span>
        <span style="color: var(--text-muted);">|</span>
        <span style="color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px;">
          ${d.morphology || 'Morphology variable'}
        </span>
      `;
      card.appendChild(detailRow);

      card.addEventListener('click', () => {
        openDetailDrawer(d);
      });

      predictionsContainer.appendChild(card);
    });

    // Render incompatible items collapsed
    if (incompatible.length > 0 && Object.keys(selectedMarkers).filter(k => selectedMarkers[k] !== 'neutral').length > 0) {
      const header = document.createElement('div');
      header.style.padding = '8px 12px';
      header.style.fontSize = '10px';
      header.style.textTransform = 'uppercase';
      header.style.fontWeight = '700';
      header.style.color = 'var(--text-muted)';
      header.style.borderTop = '1px solid var(--border-color)';
      header.style.marginTop = '10px';
      header.textContent = `Incompatible Profiles (${incompatible.length})`;
      predictionsContainer.appendChild(header);

      const grid = document.createElement('div');
      grid.style.display = 'flex';
      grid.style.flexWrap = 'wrap';
      grid.style.gap = '4px';
      grid.style.padding = '4px 12px 12px 12px';

      incompatible.forEach(item => {
        const badge = document.createElement('span');
        badge.style.fontSize = '9px';
        badge.style.padding = '2px 6px';
        badge.style.borderRadius = '3px';
        badge.style.background = 'rgba(255,255,255,0.02)';
        badge.style.border = '1px solid rgba(255,255,255,0.05)';
        badge.style.color = 'rgba(255,255,255,0.2)';
        badge.style.cursor = 'pointer';
        badge.textContent = item.disease.name;
        
        badge.addEventListener('click', () => {
          openDetailDrawer(item.disease);
        });
        
        grid.appendChild(badge);
      });
      
      predictionsContainer.appendChild(grid);
    }
  }

  // 4. Detail Drawer
  function openDetailDrawer(disease) {
    if (!detailDrawer || !drawerTitle || !drawerBody) return;

    drawerTitle.innerHTML = `
      <div style="display: flex; flex-direction: column;">
        <span style="font-weight: 800; font-size: 14px; color: var(--text-primary);">${disease.name}</span>
        <span style="font-size: 10px; color: var(--text-secondary);">${disease.fullName}</span>
      </div>
    `;

    // Format Expected Markers list
    let markerListHTML = '';
    
    // Sort keys alphabetically
    const keys = Object.keys(disease.markers).sort();
    
    if (keys.length === 0) {
      markerListHTML = `<div style="color: var(--text-secondary); font-style: italic; font-size: 11px;">Variable/Not specified</div>`;
    } else {
      markerListHTML = `<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;">`;
      keys.forEach(k => {
        const val = disease.markers[k];
        let labelClass = 'marker-label-normal';
        let valStyle = 'color: var(--text-secondary);';
        
        if (val.includes('+')) {
          valStyle = 'color: var(--accent-cyan); font-weight: 700;';
        } else if (val === '-') {
          valStyle = 'color: var(--accent-orange);';
        }
        
        // Highlight aberrant markers in Red (red on slide)
        if (val === 'aberrant') {
          labelClass = 'marker-label-aberrant';
          valStyle = 'color: var(--accent-red); font-weight: 700; font-size: 9px;';
        }
        
        const formattedLabel = k.replace('_', '-');

        markerListHTML += `
          <div class="drawer-marker-box ${labelClass}" style="display: flex; flex-direction: column; align-items: center; background: rgba(0,0,0,0.15); border-radius: 4px; padding: 4px; border: 1px solid var(--border-color);">
            <span style="font-size: 9px; font-weight: 600;">${formattedLabel}</span>
            <span style="font-size: 10px; ${valStyle}">${val.toUpperCase()}</span>
          </div>
        `;
      });
      markerListHTML += '</div>';
    }

    drawerBody.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 12px; max-height: 250px; overflow-y: auto; padding-right: 4px;">
        <div>
          <h5 style="font-size: 10px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 4px;">Description</h5>
          <p style="font-size: 11px; color: var(--text-secondary); line-height: 1.4;">${disease.description}</p>
        </div>
        
        <div>
          <h5 style="font-size: 10px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 4px;">Morphology / Notes</h5>
          <p style="font-size: 11px; color: var(--text-secondary); font-style: italic; line-height: 1.4;">${disease.morphology || 'Variable cell morphology.'}</p>
        </div>

        ${disease.genetics ? `
        <div>
          <h5 style="font-size: 10px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 4px;">Genetics</h5>
          <p style="font-size: 11px; color: var(--accent-orange); font-weight: 600; line-height: 1.4;">${disease.genetics}</p>
        </div>` : ''}

        <div>
          <h5 style="font-size: 10px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px;">Expected Immunophenotype</h5>
          ${markerListHTML}
        </div>
        
        <button id="apply-profile-btn" class="btn-primary" style="margin-top: 10px; padding: 6px 12px; font-size: 11px; width: 100%;">
          Apply Prototypical Profile to Predictor
        </button>
      </div>
    `;

    // Slide up the drawer
    detailDrawer.classList.add('open');

    // Attach click listener for applying profile
    const applyBtn = document.getElementById('apply-profile-btn');
    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        applyProfileToPredictor(disease);
      });
    }
  }

  function closeDetailDrawer() {
    if (detailDrawer) {
      detailDrawer.classList.remove('open');
    }
  }

  function applyProfileToPredictor(disease) {
    // Reset all markers first
    Object.keys(selectedMarkers).forEach(k => {
      selectedMarkers[k] = 'neutral';
    });

    // Apply positive and negative markers
    MARKER_GROUPS.forEach(group => {
      group.markers.forEach(m => {
        const val = disease.markers[m.id];
        let state = 'neutral';
        if (val) {
          if (val.includes('+')) {
            state = 'pos';
          } else if (val === '-') {
            state = 'neg';
          }
        } else {
          // Unspecified in profile is assumed negative
          state = 'neg';
        }
        selectedMarkers[m.id] = state;
        
        // Update toggle button highlights in UI
        const btnGroup = document.querySelector(`.marker-state-btn[data-marker="${m.id}"][data-val="${state}"]`);
        if (btnGroup) {
          btnGroup.parentElement.querySelectorAll('.marker-state-btn').forEach(b => b.classList.remove('active'));
          btnGroup.classList.add('active');
        }
      });
    });

    updatePredictions();
    drawFlowchart();
  }

  // 5. SVG Decision Tree rendering
  function initFlowchart() {
    drawFlowchart();
  }

  function getChildrenIds(nodeId, tree) {
    return tree.links.filter(l => l.from === nodeId).map(l => l.to);
  }

  function getNodeState(nodeId, scoreList) {
    // If it's a disease node
    const scoreData = scoreList.find(s => s.disease.id === nodeId);
    if (scoreData) {
      if (scoreData.totalSelected === 0) return 'neutral';
      if (scoreData.score === 100) return 'active';
      if (scoreData.score > 0) return 'partial';
      return 'dimmed';
    }

    // Otherwise, check children (branch or root node)
    const tree = currentFlowchart === 'acute' ? ACUTE_TREE : CHRONIC_TREE;
    const children = getChildrenIds(nodeId, tree);
    
    if (children.length === 0) return 'neutral';

    let hasActiveChild = false;
    let hasPartialChild = false;
    let allDimmed = true;
    let anyNeutral = false;

    for (const childId of children) {
      const childState = getNodeState(childId, scoreList);
      if (childState === 'active') {
        hasActiveChild = true;
        allDimmed = false;
      } else if (childState === 'partial') {
        hasPartialChild = true;
        allDimmed = false;
      } else if (childState === 'neutral') {
        anyNeutral = true;
        allDimmed = false;
      }
    }

    if (hasActiveChild) return 'active';
    if (hasPartialChild) return 'partial';
    if (allDimmed) return 'dimmed';
    return 'neutral';
  }

  function drawFlowchart() {
    if (!svgElement) return;
    svgElement.innerHTML = '';

    const tree = currentFlowchart === 'acute' ? ACUTE_TREE : CHRONIC_TREE;
    
    // Scored List cache
    const scoreList = LEUKAEMIAS.map(disease => {
      const matchDetails = getMatchScore(disease, selectedMarkers);
      return {
        disease,
        score: matchDetails.score,
        isCompatible: matchDetails.isCompatible,
        totalSelected: matchDetails.totalSelected
      };
    });

    // 1. Draw connecting paths
    tree.links.forEach(link => {
      const parent = tree.nodes.find(n => n.id === link.from);
      const child = tree.nodes.find(n => n.id === link.to);
      if (!parent || !child) return;

      const pX = parent.x + parent.w / 2;
      const pY = parent.y + parent.h;
      const cX = child.x + child.w / 2;
      const cY = child.y;

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M ${pX} ${pY} L ${cX} ${cY}`);
      path.setAttribute('class', 'flow-link');
      
      // Determine path state
      const parentState = getNodeState(parent.id, scoreList);
      const childState = getNodeState(child.id, scoreList);
      
      let linkState = 'neutral';
      if (parentState === 'active' && childState === 'active') {
        linkState = 'active';
      } else if (parentState === 'dimmed' || childState === 'dimmed') {
        linkState = 'dimmed';
      } else if (parentState === 'partial' || childState === 'partial') {
        linkState = 'partial';
      }
      
      path.setAttribute('class', `flow-link ${linkState}`);
      svgElement.appendChild(path);
    });

    // 2. Draw nodes
    tree.nodes.forEach(node => {
      const state = getNodeState(node.id, scoreList);
      
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', `flow-node ${state} ${node.type}`);
      g.style.cursor = 'pointer';

      g.addEventListener('click', () => {
        const disObj = LEUKAEMIAS.find(d => d.id === node.id);
        if (disObj) {
          openDetailDrawer(disObj);
        } else {
          let expl = "";
          if (node.id === 'blasts') expl = "Immature blast cells. Defined by CD34, TdT, or CD117 positive markers.";
          if (node.id === 'lymphoid') expl = "Precursors of B or T lymphocytes. TdT and CD34 positive; MPO negative.";
          if (node.id === 'myeloid') expl = "Myelocytic cells. Expresses CD117, CD13, CD33, HLA-DR and MPO.";
          if (node.id === 'lymphocytes') expl = "Mature-appearing lymphoid cells (CLL, Mantle, PLL, FL, Sezary, ATLL, LGL).";
          if (node.id === 'b-lymphoid') expl = "Mature B-cell neoplasm. CD19+ positive, with restricted monoclonal light chains.";
          if (node.id === 't-lymphoid') expl = "Mature T-cell neoplasm. CD3+ positive.";
          if (node.id === 'b-cd5-pos') expl = "Mature CD5 positive B-cells (B-CLL, Mantle Cell Lymphoma, B-PLL).";
          if (node.id === 'b-cd5-neg') expl = "Mature CD5 negative B-cells (B-LPD, Hairy Cell Leukemia, Follicular Lymphoma).";
          if (node.id === 't-cd4-neg') expl = "Mature T-cells expressing CD8 cytotoxic lineage (T-LPD, LGL).";
          if (node.id === 't-cd4-pos') expl = "Mature T-cells expressing CD4 helper lineage (ATLL, Sezary Syndrome).";

          if (expl) {
            drawerTitle.innerHTML = `<span style="font-weight:800; font-size:12px; color:var(--text-primary);">${node.label} Node</span>`;
            drawerBody.innerHTML = `<p style="font-size:11px; color:var(--text-secondary); line-height:1.4;">${expl}</p>`;
            detailDrawer.classList.add('open');
          }
        }
      });

      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', node.x);
      rect.setAttribute('y', node.y);
      rect.setAttribute('width', node.w);
      rect.setAttribute('height', node.h);
      rect.setAttribute('rx', 4);
      rect.setAttribute('ry', 4);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', node.x + node.w / 2);
      text.setAttribute('y', node.y + node.h / 2 + 3.5);
      text.setAttribute('text-anchor', 'middle');
      text.textContent = node.label;

      g.appendChild(rect);
      g.appendChild(text);
      svgElement.appendChild(g);
    });
  }

  // Export module globally to allow inspection if needed
  window.LeukaemiaPredictor = {
    selectedMarkers,
    LEUKAEMIAS,
    getMatchScore,
    applyProfileToPredictor,
    resetAllMarkers
  };

})();
