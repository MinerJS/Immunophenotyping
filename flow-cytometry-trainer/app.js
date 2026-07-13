/**
 * app.js
 * Flow-Gate Learn main controller.
 * Binds UI, data simulation, plot engine, and tutorial logic.
 */

// Global State
let currentCase = 'normal';
let currentTube = 'B';
let activeParentId = 'root'; // 'root' or a gate.id
let activeGates = [];        // Gates list for the active case
let sandboxMode = false;
let currentTutorialStep = 0;
let flowPlot = null;
let flowPlotAML = null;
let currentCreatedPoints = null; // Temp storage for newly drawn points
let stepFailures = 0;             // Tracks failures per tutorial step
let activeSelectedGateId = null;  // Tracks currently selected gate on canvas
let caseEvents = [];              // Stored events for the active case to ensure persistence
let normalEvents = [];
let amlEvents = [];
let activeGatesAML = [];
let activeParentIdAML = 'root';
let activePlot = 'normal'; // 'normal' or 'aml'


// Casebook Data & Vignettes
const CASES_INFO = {
  normal: {
    title: 'Case #1: Normal Whole Blood',
    subtitle: 'Peripheral Whole Blood Immunophenotyping',
    vignette: 'This 65-year-old male presents with mild thrombocytopenia. A peripheral whole blood sample is submitted for flow cytometric immunophenotyping using ClearLLab 10C Panels. No morphological abnormalities were identified in white blood cells.',
    diagnosis: 'normal'
  },
  aml: {
    title: 'Case #18: Acute Myeloid Leukemia',
    subtitle: 'Bone Marrow Aspirate & Blood Immunophenotyping',
    vignette: 'This 55-year-old male presents with circulating blasts on peripheral blood smear. A bone marrow aspirate sample is submitted for immunophenotyping. Smear shows sheets of primitive cells with high nuclear-to-cytoplasmic ratio and prominent nucleoli.',
    diagnosis: 'aml'
  },
  compare: {
    title: 'Side-by-Side Comparison',
    subtitle: 'Normal (Case #1) vs AML (Case #18)',
    vignette: 'Comparison mode allows you to visually map and contrast cell population distributions between a healthy normal profile (left) and an Acute Myeloid Leukemia (AML) patient profile (right) using identical gating coordinates.',
    diagnosis: 'compare'
  }
};

// ClearLLab 10C Panel Config
const TUBE_CONFIGS = {
  B: {
    name: 'B Cell Tube',
    markers: ['FSC_A', 'SSC_A', 'FSC_H', 'Time', 'CD45', 'CD19', 'CD20', 'Kappa', 'Lambda', 'CD10', 'CD5', 'CD200', 'CD34', 'CD38'],
    defaultX: 'CD45',
    defaultY: 'SSC_A'
  },
  T: {
    name: 'T Cell Tube',
    markers: ['FSC_A', 'SSC_A', 'FSC_H', 'CD45', 'CD3', 'TCR_gd', 'CD4', 'CD2', 'CD56', 'CD5', 'CD34', 'CD7', 'CD8'],
    defaultX: 'CD3',
    defaultY: 'CD4'
  },
  M1: {
    name: 'Myeloid M1 Tube',
    markers: ['FSC_A', 'SSC_A', 'FSC_H', 'CD45', 'CD11b', 'CD16', 'CD7', 'CD10', 'CD13', 'CD64', 'CD34', 'CD14', 'HLA_DR'],
    defaultX: 'CD16',
    defaultY: 'CD13'
  },
  M2: {
    name: 'Myeloid M2 Tube',
    markers: ['FSC_A', 'SSC_A', 'FSC_H', 'CD45', 'CD19', 'CD15', 'CD123', 'CD117', 'CD13', 'CD33', 'CD34', 'CD38', 'HLA_DR'],
    defaultX: 'CD34',
    defaultY: 'CD117'
  }
};

// Marker Glossary Reference
const MARKER_GLOSSARY = {
  CD45: 'Leukocyte Backbone Marker. Expressed on all white blood cells. Helps distinguish lymphocytes (bright), monocytes (moderate-bright), granulocytes (moderate/SSC high), and early progenitors/blasts (dim/low SSC).',
  CD34: 'Early Hematopoietic Progenitor Marker. Expressed on stem cells, early myeloid progenitors (myeloblasts), and lymphoid progenitors. Normally <0.01% in peripheral blood. High in acute leukemia blasts.',
  CD117: 'c-Kit receptor. Expressed on early myeloid progenitors (myeloblasts, promyelocytes) and mast cells. Important marker for identifying AML blasts of myeloid origin.',
  CD33: 'Myeloid Lineage Marker. Expressed strongly on monocytes, moderately on maturing granulocytes, and variably on early myeloid progenitors.',
  CD13: 'Myeloid Antigen. Expressed on maturing granulocytes, monocytes, and progenitors. Aberrant loss of CD13 is common in myeloid neoplasia (e.g. AML blasts showing CD13 negativity).',
  CD7: 'T-Cell & NK-Cell Marker. Aberrantly expressed on myeloblasts in about 30% of AML cases, indicating lineage infidelity.',
  CD19: 'B-Cell Lineage Backbone. Expressed on mature and immature B cells. Used to gate and evaluate B cell neoplasms.',
  CD20: 'Mature B-Cell Marker. Acquired during later stages of B-cell maturation. Absent on early pro-B cells and plasma cells.',
  Kappa: 'Immunoglobulin Light Chain. Normal B cell populations are polyclonal, consisting of a mixture of Kappa and Lambda positive cells. Clonal expansion of one light chain indicates lymphoma.',
  Lambda: 'Immunoglobulin Light Chain. Used in conjunction with Kappa to identify light chain restriction (clonality) in B cell analyses.',
  CD10: 'Common Acute Lymphoblastic Leukemia Antigen (CALLA). Expressed on mature granulocytes, germinal center B cells, and immature B cell progenitors.',
  CD200: 'B-cell marker, useful to distinguish chronic lymphocytic leukemia (CLL, typically CD200+) from mantle cell lymphoma (MCL, typically CD200-).',
  CD3: 'Pan-T-Cell Marker. Highly specific marker defining mature T lymphocytes.',
  CD4: 'Helper T-Cell Marker. Expressed at high levels on helper T lymphocytes and at lower levels on monocytes.',
  CD8: 'Cytotoxic T-Cell Marker. Expressed on cytotoxic T lymphocytes, NK cell subsets, and some gamma-delta T cells.',
  CD56: 'NK-Cell Marker. Expressed on natural killer cells and sub-populations of cytotoxic T cells.',
  HLA_DR: 'MHC Class II Antigen. Expressed on antigen-presenting cells (monocytes, B cells, dendritic cells) and CD34+ progenitors. Absent on mature granulocytes.',
  CD123: 'IL-3 Receptor alpha. Expressed on basophils, plasmacytoid dendritic cells, and myeloid progenitors. Variably expressed on AML blasts.'
};

// Gating color mapping based on precedence
const GATE_COLORS = {
  'Singlets': '#795548', // Brown
  'Cells': '#607d8b',    // Grey
  'CD45+': '#3f51b5',    // Indigo
  'Lymphocytes': '#ff2a2a', // Red
  'Monocytes': '#4caf50',   // Green
  'Granulocytes': '#2196f3', // Blue
  'Blasts / CD45dim': '#e040fb', // Purple
  'CD19+ B Cells': '#ff9800',  // Orange
  'CD3+ T Cells': '#00e5ff'    // Aqua
};

// Casebook Plot Variations Database
const PLOT_VARIATIONS = {
  B: [
    { fig: 'Figure 1', x: 'Time', y: 'CD45', gate: 'root', name: 'Time vs CD45 (Ungated)', desc: 'Evaluates fluidic stability during sample acquisition.' },
    { fig: 'Figure 2', x: 'FSC_A', y: 'FSC_H', gate: 'root', name: 'FSC_A vs FSC_H', desc: 'Excludes cell doublets or aggregates.' },
    { fig: 'Figure 3', x: 'FSC_A', y: 'SSC_A', gate: 'singlets', name: 'SSC_A vs FSC_A', desc: 'Excludes cell debris, selecting viable cells.' },
    { fig: 'Figure 4', x: 'CD45', y: 'SSC_A', gate: 'cells', name: 'CD45 vs SSC_A (Cells)', desc: 'Highlights white blood cell subsets.' },
    { fig: 'Figure 5', x: 'CD45', y: 'SSC_A', gate: 'CD45+', name: 'CD45 vs SSC_A (CD45+)', desc: 'Distinguishes lymphocytes, monocytes, granulocytes, and blasts.' },
    { fig: 'Figure 6', x: 'CD19', y: 'SSC_A', gate: 'cells', name: 'CD19 vs SSC_A', desc: 'Identifies B-cells with low/mod side scatter.' },
    { fig: 'Figure 7', x: 'Kappa', y: 'SSC_A', gate: 'cells', name: 'Kappa vs SSC_A', desc: 'Evaluates Kappa light chain expression on B-cells.' },
    { fig: 'Figure 8', x: 'Lambda', y: 'SSC_A', gate: 'cells', name: 'Lambda vs SSC_A', desc: 'Evaluates Lambda light chain expression on B-cells.' },
    { fig: 'Figure 9', x: 'CD10', y: 'SSC_A', gate: 'cells', name: 'CD10 vs SSC_A', desc: 'CD10 is expressed on granulocytes and B-progenitors.' },
    { fig: 'Figure 10', x: 'CD5', y: 'SSC_A', gate: 'cells', name: 'CD5 vs SSC_A', desc: 'CD5 is expressed on T-cells and a subset of B-cells.' },
    { fig: 'Figure 11', x: 'CD200', y: 'SSC_A', gate: 'cells', name: 'CD200 vs SSC_A', desc: 'Expressed on B-cells, useful for lymphoma screening.' },
    { fig: 'Figure 12', x: 'CD34', y: 'SSC_A', gate: 'cells', name: 'CD34 vs SSC_A', desc: 'Marker of early hematopoietic progenitors.' },
    { fig: 'Figure 13', x: 'CD38', y: 'SSC_A', gate: 'cells', name: 'CD38 vs SSC_A', desc: 'Activation marker, highest on plasma cells.' },
    { fig: 'Figure 14', x: 'CD20', y: 'SSC_A', gate: 'cells', name: 'CD20 vs SSC_A', desc: 'Expressed on mature B-cells.' },
    { fig: 'Figure 15', x: 'Kappa', y: 'Lambda', gate: 'BCell', name: 'Lambda vs Kappa (B-cells)', desc: 'Polyclonal distribution (ratio 1.4:1).' },
    { fig: 'Figure 16', x: 'CD19', y: 'CD20', gate: 'Lymphocytes', name: 'CD19 vs CD20', desc: 'Co-expressed on mature B-cells.' },
    { fig: 'Figure 17', x: 'CD19', y: 'CD10', gate: 'Lymphocytes', name: 'CD19 vs CD10', desc: 'Identifies mature vs immature B-cells.' },
    { fig: 'Figure 18', x: 'CD10', y: 'CD38', gate: 'Lymphocytes', name: 'CD38 vs CD10', desc: 'Differentiates plasma and germinal center B-cells.' },
    { fig: 'Figure 19', x: 'CD10', y: 'CD20', gate: 'Lymphocytes', name: 'CD20 vs CD10', desc: 'Mature B-cells are CD20+ CD10-.' },
    { fig: 'Figure 20', x: 'CD19', y: 'CD5', gate: 'Lymphocytes', name: 'CD19 vs CD5', desc: 'Shows CD5+ T-cells and mature B-cells.' },
    { fig: 'Figure 21', x: 'CD200', y: 'CD20', gate: 'Lymphocytes', name: 'CD20 vs CD200', desc: 'Mature B-cells co-express CD20 and CD200.' },
    { fig: 'Figure 22', x: 'CD200', y: 'CD5', gate: 'Lymphocytes', name: 'CD5 vs CD200', desc: 'Differentiates CLL (CD5+CD200+) from MCL (CD5+CD200-).' }
  ],
  T: [
    { fig: 'Figure 1', x: 'Time', y: 'CD45', gate: 'root', name: 'Time vs CD45 (Ungated)', desc: 'Evaluates fluidic stability.' },
    { fig: 'Figure 2', x: 'FSC_A', y: 'FSC_H', gate: 'root', name: 'FSC_A vs FSC_H', desc: 'Doublet exclusion.' },
    { fig: 'Figure 3', x: 'FSC_A', y: 'SSC_A', gate: 'singlets', name: 'SSC_A vs FSC_A', desc: 'Debris exclusion.' },
    { fig: 'Figure 4', x: 'CD45', y: 'SSC_A', gate: 'cells', name: 'CD45 vs SSC_A (Cells)', desc: 'Highlights leukocyte subsets.' },
    { fig: 'Figure 5', x: 'CD45', y: 'SSC_A', gate: 'CD45+', name: 'CD45 vs SSC_A (CD45+)', desc: 'WBC differential distribution.' },
    { fig: 'Figure 6', x: 'CD3', y: 'SSC_A', gate: 'cells', name: 'CD3 vs SSC_A', desc: 'CD3 is specific for T-lymphocytes.' },
    { fig: 'Figure 7', x: 'TCR_gd', y: 'SSC_A', gate: 'cells', name: 'TCRγδ vs SSC_A', desc: 'Small subset of cytotoxic T-cells.' },
    { fig: 'Figure 8', x: 'CD4', y: 'SSC_A', gate: 'cells', name: 'CD4 vs SSC_A', desc: 'Expressed on helper T-cells and monocytes.' },
    { fig: 'Figure 9', x: 'CD2', y: 'SSC_A', gate: 'cells', name: 'CD2 vs SSC_A', desc: 'Pan-T/NK marker, dim on monocytes.' },
    { fig: 'Figure 10', x: 'CD56', y: 'SSC_A', gate: 'cells', name: 'CD56 vs SSC_A', desc: 'Marker for NK cells and NK/T-cells.' },
    { fig: 'Figure 11', x: 'CD5', y: 'SSC_A', gate: 'cells', name: 'CD5 vs SSC_A', desc: 'Expressed on T-cells and subset of B-cells.' },
    { fig: 'Figure 12', x: 'CD34', y: 'SSC_A', gate: 'cells', name: 'CD34 vs SSC_A', desc: 'Early progenitor marker.' },
    { fig: 'Figure 13', x: 'CD7', y: 'SSC_A', gate: 'cells', name: 'CD7 vs SSC_A', desc: 'T/NK cell marker, early lineage.' },
    { fig: 'Figure 14', x: 'CD8', y: 'SSC_A', gate: 'cells', name: 'CD8 vs SSC_A', desc: 'Expressed on cytotoxic T-cells and NK subsets.' },
    { fig: 'Figure 15', x: 'CD3', y: 'CD56', gate: 'Lymphocytes', name: 'CD3 vs CD56', desc: 'Differentiates T-cells, NK, and NK/T-cells.' },
    { fig: 'Figure 16', x: 'CD3', y: 'CD5', gate: 'Lymphocytes', name: 'CD5 vs CD3', desc: 'Co-expressed on T-cells, absent on NK.' },
    { fig: 'Figure 17', x: 'CD2', y: 'CD7', gate: 'Lymphocytes', name: 'CD7 vs CD2', desc: 'Co-expressed on T-cells and NK cells.' },
    { fig: 'Figure 18', x: 'CD4', y: 'CD8', gate: 'Lymphocytes', name: 'CD8 vs CD4', desc: 'Differentiates helper and cytotoxic T-cells.' },
    { fig: 'Figure 19', x: 'CD3', y: 'CD4', gate: 'Lymphocytes', name: 'CD3 vs CD4', desc: 'Identifies CD4+ T helper cells.' },
    { fig: 'Figure 20', x: 'CD3', y: 'CD8', gate: 'Lymphocytes', name: 'CD3 vs CD8', desc: 'Identifies CD8+ cytotoxic T-cells.' },
    { fig: 'Figure 21', x: 'CD3', y: 'TCR_gd', gate: 'Lymphocytes', name: 'CD3 vs TCRγδ', desc: 'Linear relation (fixed 1:1 heterodimer).' }
  ],
  M1: [
    { fig: 'Figure 1', x: 'Time', y: 'CD45', gate: 'root', name: 'Time vs CD45 (Ungated)', desc: 'Evaluates fluidics.' },
    { fig: 'Figure 2', x: 'FSC_A', y: 'FSC_H', gate: 'root', name: 'FSC_A vs FSC_H', desc: 'Doublet exclusion.' },
    { fig: 'Figure 3', x: 'FSC_A', y: 'SSC_A', gate: 'singlets', name: 'SSC_A vs FSC_A', desc: 'Debris exclusion.' },
    { fig: 'Figure 4', x: 'CD45', y: 'SSC_A', gate: 'cells', name: 'CD45 vs SSC_A (Cells)', desc: 'Highlights subsets.' },
    { fig: 'Figure 5', x: 'CD45', y: 'SSC_A', gate: 'CD45+', name: 'CD45 vs SSC_A (CD45+)', desc: 'Leukocyte differential.' },
    { fig: 'Figure 6', x: 'CD16', y: 'SSC_A', gate: 'cells', name: 'CD16 vs SSC_A', desc: 'Highest on mature granulocytes & NK.' },
    { fig: 'Figure 7', x: 'CD7', y: 'SSC_A', gate: 'cells', name: 'CD7 vs SSC_A', desc: 'Expressed on T/NK, and dim on progenitors.' },
    { fig: 'Figure 8', x: 'CD10', y: 'SSC_A', gate: 'cells', name: 'CD10 vs SSC_A', desc: 'Expressed on granulocytes and B-progenitors.' },
    { fig: 'Figure 9', x: 'CD13', y: 'SSC_A', gate: 'cells', name: 'CD13 vs SSC_A', desc: 'Maturing granulocytes and monocytes.' },
    { fig: 'Figure 10', x: 'CD64', y: 'SSC_A', gate: 'cells', name: 'CD64 vs SSC_A', desc: 'High on monocytes, absent on resting grans.' },
    { fig: 'Figure 11', x: 'CD34', y: 'SSC_A', gate: 'cells', name: 'CD34 vs SSC_A', desc: 'Early progenitor marker.' },
    { fig: 'Figure 12', x: 'CD14', y: 'SSC_A', gate: 'cells', name: 'CD14 vs SSC_A', desc: 'High on monocytes, dim on granulocytes.' },
    { fig: 'Figure 13', x: 'HLA_DR', y: 'SSC_A', gate: 'cells', name: 'HLA-DR vs SSC_A', desc: 'Antigen-presenting cells & progenitors.' },
    { fig: 'Figure 14', x: 'CD11b', y: 'SSC_A', gate: 'cells', name: 'CD11b vs SSC_A', desc: 'Expressed on granulocytes and monocytes.' },
    { fig: 'Figure 15', x: 'CD16', y: 'CD11b', gate: 'cells', name: 'CD11b vs CD16', desc: 'Granulocyte maturation timeline.' },
    { fig: 'Figure 16', x: 'CD13', y: 'CD16', gate: 'cells', name: 'CD16 vs CD13', desc: 'Granulocyte development tracking.' },
    { fig: 'Figure 17', x: 'CD34', y: 'CD13', gate: 'cells', name: 'CD13 vs CD34', desc: 'Progenitor myeloid commitment.' },
    { fig: 'Figure 18', x: 'CD14', y: 'CD64', gate: 'cells', name: 'CD14 vs CD64', desc: 'Monocyte identification.' },
    { fig: 'Figure 19', x: 'CD16', y: 'CD14', gate: 'cells', name: 'CD14 vs CD16', desc: 'Monocyte vs Granulocyte clusters.' },
    { fig: 'Figure 20', x: 'HLA_DR', y: 'CD10', gate: 'cells', name: 'HLA-DR vs CD10', desc: 'Differentiates B-progenitors & grans.' },
    { fig: 'Figure 21', x: 'CD13', y: 'CD7', gate: 'cells', name: 'CD7 vs CD13', desc: 'Normally mutually exclusive (no co-exp).' }
  ],
  M2: [
    { fig: 'Figure 1', x: 'Time', y: 'CD45', gate: 'root', name: 'Time vs CD45 (Ungated)', desc: 'Fluidics stability.' },
    { fig: 'Figure 2', x: 'FSC_A', y: 'FSC_H', gate: 'root', name: 'FSC_A vs FSC_H', desc: 'Doublet exclusion.' },
    { fig: 'Figure 3', x: 'FSC_A', y: 'SSC_A', gate: 'singlets', name: 'SSC_A vs FSC_A', desc: 'Debris exclusion.' },
    { fig: 'Figure 4', x: 'CD45', y: 'SSC_A', gate: 'cells', name: 'CD45 vs SSC_A (Cells)', desc: 'Highlights subsets.' },
    { fig: 'Figure 5', x: 'CD45', y: 'SSC_A', gate: 'CD45+', name: 'CD45 vs SSC_A (CD45+)', desc: 'Leukocyte differential.' },
    { fig: 'Figure 6', x: 'CD15', y: 'SSC_A', gate: 'cells', name: 'CD15 vs SSC_A', desc: 'Expressed strongly on granulocytes.' },
    { fig: 'Figure 7', x: 'CD123', y: 'SSC_A', gate: 'cells', name: 'CD123 vs SSC_A', desc: 'High on basophils and pDCs.' },
    { fig: 'Figure 8', x: 'CD117', y: 'SSC_A', gate: 'cells', name: 'CD117 vs SSC_A', desc: 'c-Kit marker on myeloid blasts/mast cells.' },
    { fig: 'Figure 9', x: 'CD13', y: 'SSC_A', gate: 'cells', name: 'CD13 vs SSC_A', desc: 'Granulocytes, monocytes, progenitors.' },
    { fig: 'Figure 10', x: 'CD33', y: 'SSC_A', gate: 'cells', name: 'CD33 vs SSC_A', desc: 'Myeloid lineage marker.' },
    { fig: 'Figure 11', x: 'CD34', y: 'SSC_A', gate: 'cells', name: 'CD34 vs SSC_A', desc: 'Early progenitor marker.' },
    { fig: 'Figure 12', x: 'CD38', y: 'SSC_A', gate: 'cells', name: 'CD38 vs SSC_A', desc: 'Uniform on early lineage progenitors.' },
    { fig: 'Figure 13', x: 'HLA_DR', y: 'SSC_A', gate: 'cells', name: 'HLA-DR vs SSC_A', desc: 'MHC Class II expression.' },
    { fig: 'Figure 14', x: 'CD19', y: 'SSC_A', gate: 'cells', name: 'CD19 vs SSC_A', desc: 'Expressed on B-cells.' },
    { fig: 'Figure 15', x: 'CD34', y: 'CD117', gate: 'cells', name: 'CD34 vs CD117', desc: 'Crucial for identifying AML myeloid blasts.' },
    { fig: 'Figure 16', x: 'CD13', y: 'CD33', gate: 'cells', name: 'CD33 vs CD13', desc: 'Co-expressed in myeloid lineages.' },
    { fig: 'Figure 17', x: 'CD34', y: 'CD38', gate: 'cells', name: 'CD38 vs CD34', desc: 'Early vs committed progenitors.' },
    { fig: 'Figure 18', x: 'CD34', y: 'HLA_DR', gate: 'cells', name: 'HLA-DR vs CD34', desc: 'Progenitor validation.' },
    { fig: 'Figure 19', x: 'CD19', y: 'CD123', gate: 'cells', name: 'CD19 vs CD123', desc: 'Normal B-cells lack CD123.' },
    { fig: 'Figure 20', x: 'CD19', y: 'CD34', gate: 'cells', name: 'CD19 vs CD34', desc: 'Distinguishes B-lymphoblasts from mature B.' },
    { fig: 'Figure 21', x: 'CD19', y: 'CD38', gate: 'cells', name: 'CD38 vs CD19', desc: 'Mature B-cells have intermediate CD38.' },
    { fig: 'Figure 22', x: 'CD15', y: 'HLA_DR', gate: 'cells', name: 'HLA-DR vs CD15', desc: 'Granulocytes are CD15+ HLA-DR-.' },
    { fig: 'Figure 23', x: 'CD123', y: 'HLA_DR', gate: 'cells', name: 'HLA-DR vs CD123', desc: 'Basophils and pDCs distribution.' },
    { fig: 'Figure 24', x: 'CD19', y: 'CD33', gate: 'cells', name: 'CD19 vs CD33', desc: 'B-cells are CD19+ CD33-.' }
  ]
};

// Tutorial steps for Normal/AML Cases
// Tutorial steps for Normal Case
const NORMAL_TUTORIAL_STEPS = [
  {
    title: 'Fluidics & Doublet Exclusion',
    desc: 'Clinical flow cytometry requires removing cell aggregates (doublets) to ensure single-cell evaluation. Singlet events display a strict linear relationship between Forward Scatter Area (FSC_A) and Height/Peak (FSC_H). In standard flow analysis, all cell events initially share a default grey color. Drawing a gate categorizes and colors those cells (Color Precedence Gating).',
    instruction: 'Set the X-axis to FSC_A and Y-axis to FSC_H. Draw a rectangular or polygonal gate enclosing the linear diagonal population. Name it "Singlets". Gated cells will turn brown.',
    targetX: 'FSC_A',
    targetY: 'FSC_H',
    parentGate: 'root',
    gateName: 'Singlets',
    guidanceGate: {
      type: 'rect',
      xAttr: 'FSC_A',
      yAttr: 'FSC_H',
      points: [{ x: 200, y: 180 }, { x: 900, y: 920 }]
    },
    validate: (gate, events) => {
      // Biological validation: Gate must capture single cells and exclude doublets
      const inside = events.filter(e => flowPlot.isPointInGate(e, gate));
      const singleCells = events.filter(e => e.type !== 'Doublets' && e.type !== 'Debris');
      const doublets = events.filter(e => e.type === 'Doublets');
      
      const insideSingles = inside.filter(e => e.type !== 'Doublets' && e.type !== 'Debris');
      const insideDoublets = inside.filter(e => e.type === 'Doublets');
      
      const singleCapture = singleCells.length > 0 ? insideSingles.length / singleCells.length : 0;
      const doubletContam = doublets.length > 0 ? insideDoublets.length / doublets.length : 0;
      
      // Strict gating: must capture > 70% of single cells, and leak < 20% of doublets
      return singleCapture >= 0.70 && doubletContam <= 0.20;
    }
  },
  {
    title: 'Viability / Cells Gate',
    desc: 'Next, we exclude cell debris and dying/necrotic cells, which exhibit very low Forward Scatter (FSC_A). Viable leukocytes are located in the main high-FSC cluster. Drawing a gate around them designates them as "Cells" and colors them grey.',
    instruction: 'Select the "Singlets" gate in the tree to filter the plot. Set X-axis to FSC_A and Y-axis to SSC_A. Draw a gate around the main viable cell cluster (FSC_A > 250). Name it "Cells".',
    targetX: 'FSC_A',
    targetY: 'SSC_A',
    parentGate: 'Singlets',
    gateName: 'Cells',
    guidanceGate: {
      type: 'rect',
      xAttr: 'FSC_A',
      yAttr: 'SSC_A',
      points: [{ x: 250, y: 50 }, { x: 950, y: 950 }]
    },
    validate: (gate, events) => {
      // Validate that it captures viable cells and excludes debris
      const parentGate = activeGates.find(g => g.id === gate.parent);
      const parentEvents = events.filter(e => flowPlot.isPointInGate(e, parentGate));
      
      const inside = parentEvents.filter(e => flowPlot.isPointInGate(e, gate));
      const leukocytes = parentEvents.filter(e => e.type !== 'Debris' && e.type !== 'Doublets');
      const debris = parentEvents.filter(e => e.type === 'Debris');
      
      const insideLeuko = inside.filter(e => e.type !== 'Debris' && e.type !== 'Doublets');
      const insideDebris = inside.filter(e => e.type === 'Debris');
      
      const leukoCapture = leukocytes.length > 0 ? insideLeuko.length / leukocytes.length : 0;
      const debrisContam = debris.length > 0 ? insideDebris.length / debris.length : 0;
      
      return leukoCapture >= 0.75 && debrisContam <= 0.15;
    }
  },
  {
    title: 'Leukocyte Differential (CD45 vs SSC)',
    desc: 'The backbone of clinical immunophenotyping is the CD45 vs Side Scatter (SSC) plot. This splits white blood cells into Lymphocytes (bright CD45, low SSC), Monocytes (bright CD45, mid SSC), Granulocytes (dim-moderate CD45, high SSC), and Blasts/Progenitors (dim CD45, low SSC). In clinical flow cytometry, identifying these subpopulations and drawing gates (like a Lymphocytes gate) colors those cells red to track them across other tubes and plots.',
    instruction: 'Select the "Cells" gate in the tree. Set X-axis to CD45 and Y-axis to SSC_A. Locate the CD45-bright, low-SSC lymphocyte cluster at the bottom-right. Draw a gate around it and name it "Lymphocytes". The gated cells will turn red!',
    targetX: 'CD45',
    targetY: 'SSC_A',
    parentGate: 'Cells',
    gateName: 'Lymphocytes',
    guidanceGate: {
      type: 'rect',
      xAttr: 'CD45',
      yAttr: 'SSC_A',
      points: [{ x: 700, y: 40 }, { x: 950, y: 240 }]
    },
    validate: (gate, events) => {
      // Target: capture lymphocytes (T, B, NK), exclude monocytes & granulocytes
      const parentGate = activeGates.find(g => g.id === gate.parent);
      const parentEvents = events.filter(e => flowPlot.isPointInGate(e, parentGate));
      const inside = parentEvents.filter(e => flowPlot.isPointInGate(e, gate));
      
      const lymphocytes = parentEvents.filter(e => ['CD4_TCell', 'CD8_TCell', 'gd_TCell', 'BCell', 'NKCell'].includes(e.type));
      const others = parentEvents.filter(e => !['CD4_TCell', 'CD8_TCell', 'gd_TCell', 'BCell', 'NKCell'].includes(e.type));
      
      const insideLy = inside.filter(e => ['CD4_TCell', 'CD8_TCell', 'gd_TCell', 'BCell', 'NKCell'].includes(e.type));
      const insideOthers = inside.filter(e => !['CD4_TCell', 'CD8_TCell', 'gd_TCell', 'BCell', 'NKCell'].includes(e.type));
      
      const lyCapture = lymphocytes.length > 0 ? insideLy.length / lymphocytes.length : 0;
      const othersContam = others.length > 0 ? insideOthers.length / others.length : 0;
      
      return lyCapture >= 0.75 && othersContam <= 0.15;
    }
  },
  {
    title: 'Lineage Characterization (CD3+ T Cells)',
    desc: 'Within the lymphocyte gate, we characterize specific subsets. In the T Cell Tube, CD3 specifically identifies mature T lymphocytes. When you draw a more specific sub-gate (like CD3+ T Cells) inside the Lymphocytes gate, the events inside it turn aqua, demonstrating Color Precedence (child gate colors override parent gate colors).',
    instruction: 'Select the "Lymphocytes" gate in the tree. Switch to T Cell Tube (active tab). Set X-axis to CD3 and Y-axis to CD4. Identify the CD3-positive T cell population on the right. Draw a gate around them and name it "CD3+ T Cells". Gated T cells will turn aqua!',
    targetX: 'CD3',
    targetY: 'CD4',
    parentGate: 'Lymphocytes',
    gateName: 'CD3+ T Cells',
    guidanceGate: {
      type: 'rect',
      xAttr: 'CD3',
      yAttr: 'CD4',
      points: [{ x: 650, y: 40 }, { x: 980, y: 980 }]
    },
    validate: (gate, events) => {
      // Target: capture CD3+ T-cells, exclude B and NK cells (which lack CD3)
      const parentGate = activeGates.find(g => g.id === gate.parent);
      const parentEvents = events.filter(e => flowPlot.isPointInGate(e, parentGate));
      const inside = parentEvents.filter(e => flowPlot.isPointInGate(e, gate));
      
      const tCells = parentEvents.filter(e => ['CD4_TCell', 'CD8_TCell', 'gd_TCell'].includes(e.type));
      const nonTCells = parentEvents.filter(e => !['CD4_TCell', 'CD8_TCell', 'gd_TCell'].includes(e.type));
      
      const insideT = inside.filter(e => ['CD4_TCell', 'CD8_TCell', 'gd_TCell'].includes(e.type));
      const insideNonT = inside.filter(e => !['CD4_TCell', 'CD8_TCell', 'gd_TCell'].includes(e.type));
      
      const tCapture = tCells.length > 0 ? insideT.length / tCells.length : 0;
      const nonTContam = nonTCells.length > 0 ? insideNonT.length / nonTCells.length : 0;
      
      return tCapture >= 0.75 && nonTContam <= 0.15;
    }
  },
  {
    title: 'Diagnosing the Patient Case',
    desc: 'Based on the immunophenotyping, review the markers. In this patient, all gated lineages (lymphocytes, monocytes, granulocytes) appear in normal proportions, and B cells show a balanced Kappa/Lambda polyclonal distribution with no aberrant antigen expression. Notice how all the gates you drew color and trace these specific cell populations across different plots.',
    instruction: 'Finalize your assessment. Is this case Normal or Leukemia?',
    targetX: 'Kappa',
    targetY: 'Lambda',
    parentGate: 'root',
    gateName: 'Diagnostic Review',
    validate: () => {
      return true;
    }
  }
];

// Tutorial steps for AML Case
const AML_TUTORIAL_STEPS = [
  {
    title: 'Fluidics & Doublet Exclusion',
    desc: 'In leukemia patient diagnostics, we must first ensure stable fluidics and exclude doublets. Doublet events display a non-linear relationship between Forward Scatter Area (FSC_A) and Height (FSC_H). Drawing a gate over the linear population defines the single-cell events (Singlets).',
    instruction: 'Set the X-axis to FSC_A and Y-axis to FSC_H. Draw a rectangular or polygonal gate enclosing the linear diagonal population. Name it "Singlets". Gated cells will turn brown.',
    targetX: 'FSC_A',
    targetY: 'FSC_H',
    parentGate: 'root',
    gateName: 'Singlets',
    guidanceGate: {
      type: 'rect',
      xAttr: 'FSC_A',
      yAttr: 'FSC_H',
      points: [{ x: 150, y: 140 }, { x: 920, y: 930 }]
    },
    validate: (gate, events) => {
      const inside = events.filter(e => flowPlot.isPointInGate(e, gate));
      const singleCells = events.filter(e => e.type !== 'Doublets' && e.type !== 'Debris');
      const doublets = events.filter(e => e.type === 'Doublets');
      
      const insideSingles = inside.filter(e => e.type !== 'Doublets' && e.type !== 'Debris');
      const insideDoublets = inside.filter(e => e.type === 'Doublets');
      
      const singleCapture = singleCells.length > 0 ? insideSingles.length / singleCells.length : 0;
      const doubletContam = doublets.length > 0 ? insideDoublets.length / doublets.length : 0;
      
      return singleCapture >= 0.70 && doubletContam <= 0.20;
    }
  },
  {
    title: 'Viability / Cells Gate',
    desc: 'Next, we gate out debris and non-viable cells. Excluding these low-FSC events ensures we only analyze viable leukocytes. The main cluster of cells is designated as the "Cells" gate.',
    instruction: 'Select the "Singlets" gate in the tree. Set X-axis to FSC_A and Y-axis to SSC_A. Draw a gate enclosing the main viable cell cluster (FSC_A > 200). Name it "Cells".',
    targetX: 'FSC_A',
    targetY: 'SSC_A',
    parentGate: 'Singlets',
    gateName: 'Cells',
    guidanceGate: {
      type: 'rect',
      xAttr: 'FSC_A',
      yAttr: 'SSC_A',
      points: [{ x: 200, y: 50 }, { x: 950, y: 950 }]
    },
    validate: (gate, events) => {
      const parentGate = activeGates.find(g => g.id === gate.parent);
      const parentEvents = events.filter(e => flowPlot.isPointInGate(e, parentGate));
      const inside = parentEvents.filter(e => flowPlot.isPointInGate(e, gate));
      const leukocytes = parentEvents.filter(e => e.type !== 'Debris' && e.type !== 'Doublets');
      const debris = parentEvents.filter(e => e.type === 'Debris');
      const insideLeuko = inside.filter(e => e.type !== 'Debris' && e.type !== 'Doublets');
      const insideDebris = inside.filter(e => e.type === 'Debris');
      const leukoCapture = leukocytes.length > 0 ? insideLeuko.length / leukocytes.length : 0;
      const debrisContam = debris.length > 0 ? insideDebris.length / debris.length : 0;
      return leukoCapture >= 0.75 && debrisContam <= 0.15;
    }
  },
  {
    title: 'Leukocyte Differential - Gate Blasts',
    desc: 'The backbone of leukemia screening is the CD45 vs SSC plot. While normal bone marrow contains a small progenitor population in the CD45 dim / SSC low-to-mid region (purple), this AML case shows a massive expansion of blasts, accounting for approximately 65% of the total nucleated events. Draw a gate to isolate them.',
    instruction: 'Select the "Cells" gate in the tree. Set X-axis to CD45 and Y-axis to SSC_A. Locate the large expanded blast population (CD45 dim, SSC low-to-intermediate). Draw a gate around it and name it "Blasts". Gated events will turn purple!',
    targetX: 'CD45',
    targetY: 'SSC_A',
    parentGate: 'Cells',
    gateName: 'Blasts',
    guidanceGate: {
      type: 'rect',
      xAttr: 'CD45',
      yAttr: 'SSC_A',
      points: [{ x: 300, y: 100 }, { x: 550, y: 350 }]
    },
    validate: (gate, events) => {
      const parentGate = activeGates.find(g => g.id === gate.parent);
      const parentEvents = events.filter(e => flowPlot.isPointInGate(e, parentGate));
      const inside = parentEvents.filter(e => flowPlot.isPointInGate(e, gate));
      const blasts = parentEvents.filter(e => e.type === 'AML_Blast');
      const others = parentEvents.filter(e => e.type !== 'AML_Blast' && e.type !== 'Debris' && e.type !== 'Doublets');
      
      const insideBlasts = inside.filter(e => e.type === 'AML_Blast');
      const insideOthers = inside.filter(e => e.type !== 'AML_Blast' && e.type !== 'Debris' && e.type !== 'Doublets');
      
      const blastCapture = blasts.length > 0 ? insideBlasts.length / blasts.length : 0;
      const othersContam = others.length > 0 ? insideOthers.length / others.length : 0;
      
      return blastCapture >= 0.75 && othersContam <= 0.15;
    }
  },
  {
    title: 'Blast Characterization (CD34 vs CD117)',
    desc: 'To confirm the early myeloid progenitor nature of the blasts, we switch to the Myeloid M2 Tube. CD34 is a marker of early hematopoietic progenitors, and CD117 (c-Kit) is a classic myeloid marker. The abnormal blasts co-express intermediate CD34 and CD117, establishing a myeloid precursor lineage.',
    instruction: 'Select the "Blasts" gate in the tree. Switch to the Myeloid M2 Tube (active tab). Set X-axis to CD34 and Y-axis to CD117. Gating the double-positive population in the upper-right confirms myeloid differentiation. Draw a gate around them and name it "CD34+ CD117+ Blasts".',
    targetX: 'CD34',
    targetY: 'CD117',
    parentGate: 'Blasts',
    gateName: 'CD34+ CD117+ Blasts',
    guidanceGate: {
      type: 'rect',
      xAttr: 'CD34',
      yAttr: 'CD117',
      points: [{ x: 600, y: 600 }, { x: 980, y: 980 }]
    },
    validate: (gate, events) => {
      const parentGate = activeGates.find(g => g.id === gate.parent);
      const parentEvents = events.filter(e => flowPlot.isPointInGate(e, parentGate));
      const inside = parentEvents.filter(e => flowPlot.isPointInGate(e, gate));
      const blasts = parentEvents.filter(e => e.type === 'AML_Blast');
      const others = parentEvents.filter(e => e.type !== 'AML_Blast' && e.type !== 'Debris' && e.type !== 'Doublets');
      
      const insideBlasts = inside.filter(e => e.type === 'AML_Blast');
      const insideOthers = inside.filter(e => e.type !== 'AML_Blast' && e.type !== 'Debris' && e.type !== 'Doublets');
      
      const blastCapture = blasts.length > 0 ? insideBlasts.length / blasts.length : 0;
      const othersContam = others.length > 0 ? insideOthers.length / others.length : 0;
      
      return blastCapture >= 0.75 && othersContam <= 0.15;
    }
  },
  {
    title: 'Aberrant Myeloid Maturation (CD33 vs CD13)',
    desc: 'In normal myeloid development, progenitors express CD33 and CD13. However, abnormal blasts frequently show lineage abnormalities. In this patient, the blasts express intermediate-to-bright CD33 but exhibit complete aberrant loss (negativity) of CD13. This phenotype is highly characteristic of acute myeloid leukemia.',
    instruction: 'Select the "Blasts" gate in the tree. Make sure the Myeloid M2 Tube is selected. Set X-axis to CD33 and Y-axis to CD13. Observe the CD33-positive, CD13-negative blast population at the bottom-right. Draw a gate around them and name it "Aberrant Blasts".',
    targetX: 'CD33',
    targetY: 'CD13',
    parentGate: 'Blasts',
    gateName: 'Aberrant Blasts',
    guidanceGate: {
      type: 'rect',
      xAttr: 'CD33',
      yAttr: 'CD13',
      points: [{ x: 600, y: 40 }, { x: 980, y: 250 }]
    },
    validate: (gate, events) => {
      const parentGate = activeGates.find(g => g.id === gate.parent);
      const parentEvents = events.filter(e => flowPlot.isPointInGate(e, parentGate));
      const inside = parentEvents.filter(e => flowPlot.isPointInGate(e, gate));
      const blasts = parentEvents.filter(e => e.type === 'AML_Blast');
      const others = parentEvents.filter(e => e.type !== 'AML_Blast' && e.type !== 'Debris' && e.type !== 'Doublets');
      
      const insideBlasts = inside.filter(e => e.type === 'AML_Blast');
      const insideOthers = inside.filter(e => e.type !== 'AML_Blast' && e.type !== 'Debris' && e.type !== 'Doublets');
      
      const blastCapture = blasts.length > 0 ? insideBlasts.length / blasts.length : 0;
      const othersContam = others.length > 0 ? insideOthers.length / others.length : 0;
      
      return blastCapture >= 0.75 && othersContam <= 0.15;
    }
  },
  {
    title: 'Aberrant Lymphoid Expression (CD34 vs CD7)',
    desc: 'Leukemic blasts often show "lineage infidelity" by aberrantly expressing markers associated with other cell lineages. In this case, the myeloid blasts aberrantly express CD7, a T-cell/NK marker, on their surface. This leukemia-associated immunophenotype (LAIP) is a key diagnostic abnormality and allows for high-sensitivity MRD monitoring.',
    instruction: 'Select the "Blasts" gate in the tree. Switch to the Myeloid M1 Tube. Set X-axis to CD34 and Y-axis to CD7. Observe the double-positive population in the upper-right. Draw a gate around it and name it "Aberrant CD7+ Blasts". Gated cells will turn red!',
    targetX: 'CD34',
    targetY: 'CD7',
    parentGate: 'Blasts',
    gateName: 'Aberrant CD7+ Blasts',
    guidanceGate: {
      type: 'rect',
      xAttr: 'CD34',
      yAttr: 'CD7',
      points: [{ x: 600, y: 600 }, { x: 980, y: 980 }]
    },
    validate: (gate, events) => {
      const parentGate = activeGates.find(g => g.id === gate.parent);
      const parentEvents = events.filter(e => flowPlot.isPointInGate(e, parentGate));
      const inside = parentEvents.filter(e => flowPlot.isPointInGate(e, gate));
      const blasts = parentEvents.filter(e => e.type === 'AML_Blast');
      const others = parentEvents.filter(e => e.type !== 'AML_Blast' && e.type !== 'Debris' && e.type !== 'Doublets');
      
      const insideBlasts = inside.filter(e => e.type === 'AML_Blast');
      const insideOthers = inside.filter(e => e.type !== 'AML_Blast' && e.type !== 'Debris' && e.type !== 'Doublets');
      
      const blastCapture = blasts.length > 0 ? insideBlasts.length / blasts.length : 0;
      const othersContam = others.length > 0 ? insideOthers.length / others.length : 0;
      
      return blastCapture >= 0.75 && othersContam <= 0.15;
    }
  },
  {
    title: 'Diagnosing the Patient Case',
    desc: 'Based on the immunophenotyping, review the markers. In this patient, we have identified a major abnormal population of blasts co-expressing CD34, CD117, CD33, and CD38, but with aberrant loss of CD13 and aberrant gain of CD7, without expression of other mature lymphoid/myeloid antigens. This phenotype is consistent with Acute Myeloid Leukemia (AML).',
    instruction: 'Finalize your assessment. Is this case Normal or Leukemia?',
    targetX: 'CD34',
    targetY: 'CD7',
    parentGate: 'root',
    gateName: 'Diagnostic Review',
    validate: () => {
      return true;
    }
  }
];

let TUTORIAL_STEPS = NORMAL_TUTORIAL_STEPS;

// Initialise Application
document.addEventListener('DOMContentLoaded', () => {
  flowPlot = new FlowPlot('flow-canvas');
  flowPlotAML = new FlowPlot('flow-canvas-aml');
  
  // Load synthetic data
  loadCase('normal');
  
  // Event listeners for controls
  document.getElementById('case-select').addEventListener('change', (e) => {
    loadCase(e.target.value);
  });
  
  document.getElementById('x-axis-select').addEventListener('change', (e) => {
    flowPlot.setAxes(e.target.value, flowPlot.yAxis);
    if (currentCase === 'compare' && flowPlotAML) {
      flowPlotAML.setAxes(e.target.value, flowPlotAML.yAxis);
    }
  });
  
  document.getElementById('y-axis-select').addEventListener('change', (e) => {
    flowPlot.setAxes(flowPlot.xAxis, e.target.value);
    if (currentCase === 'compare' && flowPlotAML) {
      flowPlotAML.setAxes(flowPlotAML.xAxis, e.target.value);
    }
  });
  
  document.getElementById('scale-select').addEventListener('change', (e) => {
    flowPlot.scaleType = e.target.value;
    flowPlot.draw();
    if (currentCase === 'compare' && flowPlotAML) {
      flowPlotAML.scaleType = e.target.value;
      flowPlotAML.draw();
    }
  });

  // Tube selection
  document.getElementById('tube-tabs-container').addEventListener('click', (e) => {
    if (e.target.classList.contains('tube-btn')) {
      document.querySelectorAll('.tube-btn').forEach(btn => btn.classList.remove('active'));
      e.target.classList.add('active');
      currentTube = e.target.getAttribute('data-tube');
      setupAxesDropdowns();
      flowPlot.draw();
      if (currentCase === 'compare' && flowPlotAML) {
        flowPlotAML.draw();
      }
      
      // Automatically expand and highlight the matching gallery section/plot
      highlightActiveGalleryItem();
    }
  });

  // Tool buttons
  document.getElementById('tool-rect-btn').addEventListener('click', () => {
    toggleTool('rect');
  });
  
  document.getElementById('tool-poly-btn').addEventListener('click', () => {
    toggleTool('poly');
  });

  document.getElementById('tool-zoom-btn').addEventListener('click', () => {
    toggleTool('zoom');
  });

  document.getElementById('reset-zoom-btn').addEventListener('click', () => {
    resetPlotsZoom();
  });

  // 3D Explorer Back Button
  document.getElementById('explorer-back-btn').addEventListener('click', () => {
    document.querySelector('header').style.display = 'flex';
    document.querySelector('.workspace').style.display = 'flex';
    document.getElementById('cell-explorer-view').style.display = 'none';
    cleanup3DCellExplorer();
  });

  // Custom events from FlowPlot
  document.addEventListener('flow-zoom-changed', (e) => {
    const { zoomX, zoomY } = e.detail;
    syncPlotsZoom(zoomX, zoomY);
  });

  document.addEventListener('flow-cell-clicked', (e) => {
    const { cell } = e.detail;
    let originCase = "Normal Case #1";
    if (currentCase === 'aml') {
      originCase = "AML Case #18";
    } else if (currentCase === 'compare') {
      if (flowPlotAML && flowPlotAML.hoveredCell === cell) {
        originCase = "AML Case #18";
      } else {
        originCase = "Normal Case #1";
      }
    }
    openCell3DExplorer(cell, originCase);
  });

  document.getElementById('clear-gates-btn').addEventListener('click', () => {
    if (activeSelectedGateId) {
      deleteGateById(activeSelectedGateId);
    } else {
      deleteActiveGate();
    }
  });

  // Modal actions
  document.getElementById('gate-cancel-btn').addEventListener('click', hideGateModal);
  document.getElementById('gate-confirm-btn').addEventListener('click', confirmGateCreation);
  
  // Tutorial actions
  document.getElementById('tutorial-prev-btn').addEventListener('click', prevTutorialStep);
  document.getElementById('tutorial-next-btn').addEventListener('click', nextTutorialStep);
  document.getElementById('tutorial-guide-btn').addEventListener('click', showTutorialGuide);
  
  // Tutorial Floating Box Controls
  const tutorialBox = document.getElementById('tutorial-container');
  const tutorialDragHandle = document.getElementById('tutorial-drag-handle');
  makeElementDraggable(tutorialBox, tutorialDragHandle);

  document.getElementById('tutorial-minimize-btn').addEventListener('click', () => {
    tutorialBox.classList.toggle('minimized');
    const isMinimized = tutorialBox.classList.contains('minimized');
    document.getElementById('tutorial-minimize-btn').innerHTML = isMinimized
      ? `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path></svg>`
      : `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;
  });

  document.getElementById('tutorial-close-btn').addEventListener('click', () => {
    tutorialBox.style.display = 'none';
    if (!sandboxMode) {
      document.getElementById('toggle-tutorial-btn').style.display = 'inline-block';
    }
  });

  document.getElementById('toggle-tutorial-btn').addEventListener('click', () => {
    tutorialBox.style.display = 'flex';
    document.getElementById('toggle-tutorial-btn').style.display = 'none';
  });
  
  // Sandbox mode toggle
  document.getElementById('toggle-sandbox-btn').addEventListener('click', toggleSandbox);

  // Right sidebar toggle
  const rightPanel = document.getElementById('right-panel');
  const toggleRightBtn = document.getElementById('toggle-right-panel-btn');
  let rightPanelExpanded = true;

  if (toggleRightBtn && rightPanel) {
    toggleRightBtn.addEventListener('click', () => {
      rightPanelExpanded = !rightPanelExpanded;
      if (rightPanelExpanded) {
        rightPanel.classList.remove('collapsed');
        toggleRightBtn.classList.add('active');
      } else {
        rightPanel.classList.add('collapsed');
        toggleRightBtn.classList.remove('active');
      }
    });
  }

  // Active plot selectors for comparison mode
  const canvasNormalEl = document.getElementById('flow-canvas');
  const canvasAMLEl = document.getElementById('flow-canvas-aml');

  if (canvasNormalEl) {
    canvasNormalEl.addEventListener('mousedown', () => {
      if (currentCase === 'compare' && activePlot !== 'normal') {
        selectActivePlot('normal');
      }
    });
  }

  if (canvasAMLEl) {
    canvasAMLEl.addEventListener('mousedown', () => {
      if (currentCase === 'compare' && activePlot !== 'aml') {
        selectActivePlot('aml');
      }
    });
  }

  // Custom events from FlowPlot
  document.addEventListener('flow-gate-created', (e) => {
    showGateModal(e.detail);
  });

  document.addEventListener('flow-gate-selected', (e) => {
    setActiveParent(e.detail.gateId);
  });

  document.addEventListener('flow-gate-highlighted', (e) => {
    activeSelectedGateId = e.detail.gateId;
    if (currentCase === 'compare' && flowPlotAML) {
      flowPlotAML.selectedGateId = e.detail.gateId;
      flowPlotAML.draw();
    }
    const deleteBtn = document.getElementById('clear-gates-btn');
    if (activeSelectedGateId) {
      deleteBtn.innerHTML = '<svg class="icon-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg> Delete Selected Gate';
    } else {
      deleteBtn.innerHTML = '<svg class="icon-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg> Delete Active Gate';
    }
  });
  
  document.addEventListener('flow-draw-cancelled', () => {
    document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
  });

  // Keydown listener for Backspace/Delete to clear selected gate
  window.addEventListener('keydown', (e) => {
    if ((e.key === 'Backspace' || e.key === 'Delete') && activeSelectedGateId) {
      if (document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
        deleteGateById(activeSelectedGateId);
      }
    }
  });

  // Build glossary
  buildGlossary();

  // Build and initialize Plot Gallery
  buildGallerySidebar();

  // Initialize Sidebar Panel and Activity Bar Event Listeners
  initSidebar();

  // Highlight active plot card and expand active tube accordion on startup
  highlightActiveGalleryItem();

  // Initialize 3D Explorer Simulator events
  initSimulatorEvents();
});

// Load patient case
// Load patient case
function loadCase(caseId) {
  currentCase = caseId;
  
  const plotsLayout = document.getElementById('plots-layout');
  const plotCardAml = document.getElementById('plot-card-aml');
  const plotTitleNormal = document.getElementById('plot-title-normal');
  
  if (caseId === 'compare') {
    // Show compare layout
    plotsLayout.style.flexDirection = 'row';
    plotCardAml.style.display = 'flex';
    plotTitleNormal.style.display = 'block';
    
    showToast('Comparison Mode: You can draw different gates on each plot independently.');
    
    // Load both datasets
    normalEvents = FlowData.generateNormalCase();
    amlEvents = FlowData.generateAMLCase();
    caseEvents = normalEvents; // Fallback
    
    const info = CASES_INFO['compare'];
    document.getElementById('case-title').innerText = info.title;
    document.getElementById('case-subtitle').innerText = info.subtitle;
    document.getElementById('case-vignette').innerText = info.vignette;
    
    // Clean gates and pre-populate standard gates for both independently
    activeGates = [];
    activeParentId = 'root';
    activeGatesAML = [];
    activeParentIdAML = 'root';
    
    // Create default gates for Normal
    activeGates = [
      { id: 'root', name: 'All Events', parent: null, xAttr: 'Time', yAttr: 'CD45', type: 'rect', points: [{x:0,y:0},{x:1000,y:1000}], color: '#94a3b8' }
    ];
    activeGates.push({
      id: 'singlets',
      name: 'Singlets',
      parent: 'root',
      xAttr: 'FSC_A',
      yAttr: 'FSC_H',
      type: 'rect',
      points: [{x:200, y:200}, {x:800, y:800}],
      color: '#795548'
    });
    activeGates.push({
      id: 'cells',
      name: 'Cells',
      parent: 'singlets',
      xAttr: 'FSC_A',
      yAttr: 'SSC_A',
      type: 'poly',
      points: [{x:250,y:100},{x:850,y:200},{x:850,y:850},{x:450,y:850},{x:250,y:400}],
      color: '#607d8b'
    });
    activeGates.push({
      id: 'lymphocytes',
      name: 'Lymphocytes',
      parent: 'cells',
      xAttr: 'CD45',
      yAttr: 'SSC_A',
      type: 'rect',
      points: [{x:600,y:50},{x:950,y:250}],
      color: '#2196f3'
    });
    activeGates.push({
      id: 'blasts',
      name: 'Blasts / CD45dim',
      parent: 'cells',
      xAttr: 'CD45',
      yAttr: 'SSC_A',
      type: 'rect',
      points: [{x:400,y:50},{x:600,y:250}],
      color: '#9c27b0'
    });
    
    // Create identical initial gates for AML (can be modified separately!)
    activeGatesAML = [
      { id: 'root', name: 'All Events', parent: null, xAttr: 'Time', yAttr: 'CD45', type: 'rect', points: [{x:0,y:0},{x:1000,y:1000}], color: '#94a3b8' }
    ];
    activeGatesAML.push({
      id: 'singlets',
      name: 'Singlets',
      parent: 'root',
      xAttr: 'FSC_A',
      yAttr: 'FSC_H',
      type: 'rect',
      points: [{x:200, y:200}, {x:800, y:800}],
      color: '#795548'
    });
    activeGatesAML.push({
      id: 'cells',
      name: 'Cells',
      parent: 'singlets',
      xAttr: 'FSC_A',
      yAttr: 'SSC_A',
      type: 'poly',
      points: [{x:250,y:100},{x:850,y:200},{x:850,y:850},{x:450,y:850},{x:250,y:400}],
      color: '#607d8b'
    });
    activeGatesAML.push({
      id: 'lymphocytes',
      name: 'Lymphocytes',
      parent: 'cells',
      xAttr: 'CD45',
      yAttr: 'SSC_A',
      type: 'rect',
      points: [{x:600,y:50},{x:950,y:250}],
      color: '#2196f3'
    });
    activeGatesAML.push({
      id: 'blasts',
      name: 'Blasts / CD45dim',
      parent: 'cells',
      xAttr: 'CD45',
      yAttr: 'SSC_A',
      type: 'rect',
      points: [{x:400,y:50},{x:600,y:250}],
      color: '#9c27b0'
    });
    
    // Hide tutorial floating box
    document.getElementById('tutorial-container').style.display = 'none';
    document.getElementById('toggle-tutorial-btn').style.display = 'none';
    
    // Select Normal plot by default
    setTimeout(() => selectActivePlot('normal'), 0);
    
  } else {
    // Single case study layout
    plotsLayout.style.flexDirection = 'column';
    plotCardAml.style.display = 'none';
    plotTitleNormal.style.display = 'none';
    
    const info = CASES_INFO[caseId];
    document.getElementById('case-title').innerText = info.title;
    document.getElementById('case-subtitle').innerText = info.subtitle;
    document.getElementById('case-vignette').innerText = info.vignette;
    
    caseEvents = caseId === 'normal' ? FlowData.generateNormalCase() : FlowData.generateAMLCase();
    
    activeGates = [];
    activeParentId = 'root';
    createDefaultGates(caseId);
    
    const tutorialBox = document.getElementById('tutorial-container');
    if (!sandboxMode) {
      tutorialBox.style.display = 'flex';
      document.getElementById('toggle-tutorial-btn').style.display = 'none';
    } else {
      tutorialBox.style.display = 'none';
      document.getElementById('toggle-tutorial-btn').style.display = 'none';
    }
  }

  // Common init steps
  currentTube = 'B';
  document.querySelectorAll('.tube-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-tube') === 'B') {
      btn.classList.add('active');
    }
  });
  
  setupAxesDropdowns();
  
  // Set case-specific tutorial steps
  if (caseId !== 'compare') {
    TUTORIAL_STEPS = caseId === 'aml' ? AML_TUTORIAL_STEPS : NORMAL_TUTORIAL_STEPS;
    currentTutorialStep = 0;
    loadTutorialStep();
  }
  
  syncWorkspace();
}

function createDefaultGates(caseId) {
  // Add All Events root gate implicitly
  activeGates = [
    { id: 'root', name: 'All Events', parent: null, xAttr: 'Time', yAttr: 'CD45', type: 'rect', points: [{x:0,y:0},{x:1000,y:1000}], color: '#94a3b8' }
  ];
  
  // In Tutorial Mode, we start with a clean slate so the user can build the gating hierarchy step-by-step.
  // We only pre-populate standard gates in Sandbox Mode.
  if (!sandboxMode) {
    return;
  }
  
  // Populate standard gates for B/T cell tubes to help guide staff
  if (caseId === 'normal') {
    // Add default Singlets and Cells gates to save user clicking time
    activeGates.push({
      id: 'singlets',
      name: 'Singlets',
      parent: 'root',
      xAttr: 'FSC_A',
      yAttr: 'FSC_H',
      type: 'rect',
      points: [{x: 200, y: 180}, {x: 900, y: 920}],
      color: '#795548'
    });
    activeGates.push({
      id: 'cells',
      name: 'Cells',
      parent: 'singlets',
      xAttr: 'FSC_A',
      yAttr: 'SSC_A',
      type: 'rect',
      points: [{x: 250, y: 50}, {x: 950, y: 950}],
      color: '#607d8b'
    });
  } else {
    // For AML Case, pre-populate the Singlets and Cells
    activeGates.push({
      id: 'singlets',
      name: 'Singlets',
      parent: 'root',
      xAttr: 'FSC_A',
      yAttr: 'FSC_H',
      type: 'rect',
      points: [{x: 150, y: 140}, {x: 920, y: 930}],
      color: '#795548'
    });
    activeGates.push({
      id: 'cells',
      name: 'Cells',
      parent: 'singlets',
      xAttr: 'FSC_A',
      yAttr: 'SSC_A',
      type: 'rect',
      points: [{x: 200, y: 50}, {x: 950, y: 950}],
      color: '#607d8b'
    });
  }
}

// Set up the X and Y axes dropdown menus based on current Tube config
function setupAxesDropdowns(preserveSelection = true) {
  const config = TUBE_CONFIGS[currentTube];
  const xSelect = document.getElementById('x-axis-select');
  const ySelect = document.getElementById('y-axis-select');
  
  let selectedX = config.defaultX;
  let selectedY = config.defaultY;
  
  if (preserveSelection && flowPlot) {
    if (config.markers.includes(flowPlot.xAxis)) {
      selectedX = flowPlot.xAxis;
    }
    if (config.markers.includes(flowPlot.yAxis)) {
      selectedY = flowPlot.yAxis;
    }
  }
  
  xSelect.innerHTML = '';
  ySelect.innerHTML = '';
  
  config.markers.forEach(m => {
    const optX = document.createElement('option');
    optX.value = m;
    optX.textContent = m;
    if (m === selectedX) optX.selected = true;
    xSelect.appendChild(optX);
    
    const optY = document.createElement('option');
    optY.value = m;
    optY.textContent = m;
    if (m === selectedY) optY.selected = true;
    ySelect.appendChild(optY);
  });
  
  if (flowPlot) {
    flowPlot.xAxis = selectedX;
    flowPlot.yAxis = selectedY;
  }
}

// Dynamic synchronization of the hierarchy tree, stats table, and plot
function syncWorkspace(allEvents) {
  setupAxesDropdowns(true);
  
  if (currentCase === 'compare') {
    // Normal events
    const cachedNormal = {};
    function getNormalFiltered(gateId) {
      if (cachedNormal[gateId]) return cachedNormal[gateId];
      if (gateId === 'root' || !gateId) {
        cachedNormal[gateId] = normalEvents;
        return normalEvents;
      }
      const gate = activeGates.find(g => g.id === gateId);
      if (!gate) return normalEvents;
      const parentEvents = getNormalFiltered(gate.parent);
      const filtered = parentEvents.filter(ev => flowPlot.isPointInGate(ev, gate));
      cachedNormal[gateId] = filtered;
      return filtered;
    }

    // AML events
    const cachedAML = {};
    function getAMLFiltered(gateId) {
      if (cachedAML[gateId]) return cachedAML[gateId];
      if (gateId === 'root' || !gateId) {
        cachedAML[gateId] = amlEvents;
        return amlEvents;
      }
      const gate = activeGatesAML.find(g => g.id === gateId);
      if (!gate) return amlEvents;
      const parentEvents = getAMLFiltered(gate.parent);
      const filtered = parentEvents.filter(ev => flowPlotAML.isPointInGate(ev, gate));
      cachedAML[gateId] = filtered;
      return filtered;
    }

    const activeNormal = getNormalFiltered(activeParentId);
    flowPlot.setData(normalEvents, activeNormal, activeGates);

    const activeAML = getAMLFiltered(activeParentIdAML);
    flowPlotAML.setData(amlEvents, activeAML, activeGatesAML);

    const gatingHeader = document.querySelector('#sidebar-tab-gating h3');
    if (activePlot === 'normal') {
      if (gatingHeader) gatingHeader.innerText = 'Gating Hierarchy (Normal Case)';
      buildGatingTree(getNormalFiltered, activeGates, activeParentId);
      buildStatsTable(getNormalFiltered, activeGates, normalEvents.length);
    } else {
      if (gatingHeader) gatingHeader.innerText = 'Gating Hierarchy (AML Case)';
      buildGatingTree(getAMLFiltered, activeGatesAML, activeParentIdAML);
      buildStatsTable(getAMLFiltered, activeGatesAML, amlEvents.length);
    }

    // Update active gate summary info under the AML canvas
    const amlCount = activeAML.length;
    const amlTotal = amlEvents.length;
    const amlPct = amlTotal > 0 ? ((amlCount / amlTotal) * 100).toFixed(1) : '0.0';
    const activeGateName = activeGatesAML.find(g => g.id === activeParentIdAML)?.name || 'All Events';
    const summaryTextEl = document.getElementById('compare-aml-stats-summary');
    if (summaryTextEl) {
      summaryTextEl.innerText = `Active Gate: ${activeGateName} (${amlCount.toLocaleString()} events, ${amlPct}%)`;
    }

  } else {
    // Single case study mode
    const eventsSource = allEvents || caseEvents;
    const cachedFiltered = {};
    function getFilteredEvents(gateId) {
      if (cachedFiltered[gateId]) return cachedFiltered[gateId];
      if (gateId === 'root' || !gateId) {
        cachedFiltered[gateId] = eventsSource;
        return eventsSource;
      }
      const gate = activeGates.find(g => g.id === gateId);
      if (!gate) return eventsSource;
      const parentEvents = getFilteredEvents(gate.parent);
      const filtered = parentEvents.filter(ev => flowPlot.isPointInGate(ev, gate));
      cachedFiltered[gateId] = filtered;
      return filtered;
    }

    const gatingHeader = document.querySelector('#sidebar-tab-gating h3');
    if (gatingHeader) gatingHeader.innerText = 'Gating Hierarchy';

    buildGatingTree(getFilteredEvents, activeGates, activeParentId);
    buildStatsTable(getFilteredEvents, activeGates, eventsSource.length);

    const activeEvents = getFilteredEvents(activeParentId);
    flowPlot.setData(eventsSource, activeEvents, activeGates);
  }

  highlightActiveGalleryItem();
  updateGalleryThumbnails();
}


// Build Gating Tree representation
function buildGatingTree(filterFn, gatesList = activeGates, currentParentId = activeParentId) {
  const container = document.getElementById('gating-tree-root');
  container.innerHTML = '';
  
  function addNode(gate, depth) {
    const li = document.createElement('li');
    li.setAttribute('data-id', gate.id);
    if (gate.id === currentParentId) li.classList.add('active');
    
    for (let i = 0; i < depth; i++) {
      const indent = document.createElement('span');
      indent.className = 'indent';
      li.appendChild(indent);
    }
    
    const dot = document.createElement('span');
    dot.className = 'color-box';
    dot.style.backgroundColor = gate.color || '#94a3b8';
    li.appendChild(dot);
    
    const label = document.createElement('span');
    const count = filterFn(gate.id).length;
    label.textContent = `${gate.name} (${count.toLocaleString()})`;
    li.appendChild(label);
    
    li.addEventListener('click', (e) => {
      e.stopPropagation();
      setActiveParent(gate.id);
    });
    
    container.appendChild(li);
    
    const children = gatesList.filter(g => g.parent === gate.id);
    children.forEach(c => addNode(c, depth + 1));
  }
  
  const rootGate = gatesList.find(g => g.id === 'root');
  if (rootGate) addNode(rootGate, 0);
}

// Build Stats Table
function buildStatsTable(filterFn, gatesList = activeGates, totalCount = 0) {
  const thead = document.querySelector('.stats-table thead');
  if (thead) {
    thead.innerHTML = `
      <tr>
        <th>Gate</th>
        <th>Count</th>
        <th>% Parent</th>
        <th>% Total</th>
      </tr>
    `;
  }

  const tbody = document.getElementById('stats-table-body');
  tbody.innerHTML = '';
  
  gatesList.forEach(gate => {
    const tr = document.createElement('tr');
    const count = filterFn(gate.id).length;
    const parentCount = gate.parent ? filterFn(gate.parent).length : totalCount;
    const pctParent = parentCount > 0 ? ((count / parentCount) * 100).toFixed(1) : '0.0';
    const pctTotal = totalCount > 0 ? ((count / totalCount) * 100).toFixed(1) : '0.0';
    
    tr.innerHTML = `
      <td><span style="display:inline-block; width:8px; height:8px; border-radius:50%; background-color:${gate.color || '#fff'}; margin-right:6px;"></span>${gate.name}</td>
      <td>${count.toLocaleString()}</td>
      <td>${pctParent}%</td>
      <td>${pctTotal}%</td>
    `;
    tbody.appendChild(tr);
  });
}

function setActiveParent(gateId) {
  if (currentCase === 'compare') {
    if (activePlot === 'normal') {
      activeParentId = gateId;
    } else {
      activeParentIdAML = gateId;
    }
  } else {
    activeParentId = gateId;
    
    if (!sandboxMode) {
      const step = TUTORIAL_STEPS[currentTutorialStep];
      if (step && step.parentGate !== 'root') {
        const selectedGate = activeGates.find(g => g.id === gateId);
        if (selectedGate && selectedGate.name.toLowerCase().includes(step.parentGate.toLowerCase())) {
          // Automatically align axes and tubes for the user when they navigate to the correct parent gate
          flowPlot.xAxis = step.targetX;
          flowPlot.yAxis = step.targetY;
          
          let matchedTube = null;
          for (const [tube, conf] of Object.entries(TUBE_CONFIGS)) {
            if (conf.markers.includes(step.targetX) && conf.markers.includes(step.targetY)) {
              matchedTube = tube;
              break;
            }
          }
          if (matchedTube && matchedTube !== currentTube) {
            currentTube = matchedTube;
            document.querySelectorAll('.tube-btn').forEach(btn => {
              btn.classList.remove('active');
              if (btn.getAttribute('data-tube') === currentTube) {
                btn.classList.add('active');
              }
            });
            setupAxesDropdowns();
          } else {
            const xSel = document.getElementById('x-axis-select');
            const ySel = document.getElementById('y-axis-select');
            if (xSel) xSel.value = step.targetX;
            if (ySel) ySel.value = step.targetY;
          }
        }
      }
    }
  }
  
  syncWorkspace();
}

// Toggle Drawing Tools
function toggleTool(tool) {
  document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
  
  const currentPlot = (currentCase === 'compare' && activePlot === 'aml') ? flowPlotAML : flowPlot;
  if (!currentPlot) return;
  
  const isCurrentlyActive = currentPlot.activeTool === tool;
  
  if (tool === 'zoom') {
    if (isCurrentlyActive) {
      flowPlot.setTool(null);
      if (flowPlotAML) flowPlotAML.setTool(null);
    } else {
      flowPlot.setTool('zoom');
      if (flowPlotAML) flowPlotAML.setTool('zoom');
      const toolBtn = document.getElementById('tool-zoom-btn');
      if (toolBtn) toolBtn.classList.add('active');
    }
  } else {
    if (isCurrentlyActive) {
      currentPlot.setTool(null);
    } else {
      // Disable zoom on other plots when activating gating
      flowPlot.setTool(null);
      if (flowPlotAML) flowPlotAML.setTool(null);
      currentPlot.setTool(tool);
      const toolBtn = document.getElementById(`tool-${tool}-btn`);
      if (toolBtn) toolBtn.classList.add('active');
    }
  }
}

// Delete Active Gate
function deleteActiveGate() {
  const currentParentId = (currentCase === 'compare' && activePlot === 'aml') ? activeParentIdAML : activeParentId;
  if (currentParentId === 'root') {
    alert('Cannot delete the root All Events gate!');
    return;
  }
  
  const currentGatesList = (currentCase === 'compare' && activePlot === 'aml') ? activeGatesAML : activeGates;
  
  // Recursively delete children
  function getChildrenIds(parentId) {
    let ids = [parentId];
    currentGatesList.filter(g => g.parent === parentId).forEach(c => {
      ids = ids.concat(getChildrenIds(c.id));
    });
    return ids;
  }
  
  const toDelete = getChildrenIds(currentParentId);
  const parentOfActive = currentGatesList.find(g => g.id === currentParentId).parent;
  
  if (currentCase === 'compare' && activePlot === 'aml') {
    activeGatesAML = activeGatesAML.filter(g => !toDelete.includes(g.id));
    activeParentIdAML = parentOfActive;
  } else {
    activeGates = activeGates.filter(g => !toDelete.includes(g.id));
    activeParentId = parentOfActive;
  }
  
  syncWorkspace();
}

// Delete Gate by ID (Selected Gate deletion)
function deleteGateById(gateId) {
  if (gateId === 'root') {
    alert('Cannot delete the root All Events gate!');
    return;
  }
  
  const currentGatesList = (currentCase === 'compare' && activePlot === 'aml') ? activeGatesAML : activeGates;
  const gate = currentGatesList.find(g => g.id === gateId);
  if (!gate) return;
  
  if (!confirm(`Are you sure you want to delete gate "${gate.name}" and all of its nested children?`)) {
    return;
  }
  
  // Recursively delete children
  function getChildrenIds(parentId) {
    let ids = [parentId];
    currentGatesList.filter(g => g.parent === parentId).forEach(c => {
      ids = ids.concat(getChildrenIds(c.id));
    });
    return ids;
  }
  
  const toDelete = getChildrenIds(gateId);
  
  const currentParentId = (currentCase === 'compare' && activePlot === 'aml') ? activeParentIdAML : activeParentId;
  let newParentId = currentParentId;
  if (toDelete.includes(currentParentId)) {
    newParentId = gate.parent || 'root';
  }
  
  if (currentCase === 'compare' && activePlot === 'aml') {
    activeGatesAML = activeGatesAML.filter(g => !toDelete.includes(g.id));
    activeParentIdAML = newParentId;
  } else {
    activeGates = activeGates.filter(g => !toDelete.includes(g.id));
    activeParentId = newParentId;
  }
  
  activeSelectedGateId = null;
  if (flowPlot) flowPlot.selectedGateId = null;
  if (flowPlotAML) flowPlotAML.selectedGateId = null;
  
  setActiveParent(newParentId);
  showToast(`Gate "${gate.name}" deleted.`);
}

// Gate Naming Modal Control
function showGateModal(gateDetails) {
  currentCreatedPoints = gateDetails;
  
  // Suggest a name based on active step or standard names
  const nameInput = document.getElementById('gate-name-input');
  
  if (!sandboxMode && TUTORIAL_STEPS[currentTutorialStep]) {
    nameInput.value = TUTORIAL_STEPS[currentTutorialStep].gateName;
  } else {
    nameInput.value = '';
  }
  
  document.getElementById('gate-name-modal-overlay').style.display = 'flex';
  nameInput.focus();
}

function hideGateModal() {
  document.getElementById('gate-name-modal-overlay').style.display = 'none';
  currentCreatedPoints = null;
  toggleTool(null);
}

function confirmGateCreation() {
  const name = document.getElementById('gate-name-input').value.trim();
  if (!name) {
    alert('Please enter a gate name.');
    return;
  }
  
  // Map gate color based on precedence name
  let color = '#ffffff';
  for (const [key, col] of Object.entries(GATE_COLORS)) {
    if (name.toLowerCase().includes(key.toLowerCase())) {
      color = col;
      break;
    }
  }
  if (color === '#ffffff') {
    // Random bright pastel color
    color = `hsl(${Math.random() * 360}, 85%, 65%)`;
  }
  
  const currentParentId = (currentCase === 'compare' && activePlot === 'aml') ? activeParentIdAML : activeParentId;
  const newGate = {
    id: name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now(),
    name: name,
    parent: currentParentId,
    xAttr: currentCreatedPoints.xAttr,
    yAttr: currentCreatedPoints.yAttr,
    type: currentCreatedPoints.type,
    points: currentCreatedPoints.points,
    color: color
  };
  
  if (currentCase === 'compare' && activePlot === 'aml') {
    activeGatesAML.push(newGate);
  } else {
    activeGates.push(newGate);
  }
  
  hideGateModal();
  syncWorkspace();
  showToast(`Gate "${name}" created successfully!`);
}

// Tutorial Workflow
function loadTutorialStep() {
  if (sandboxMode) return;
  
  stepFailures = 0;
  if (flowPlot) flowPlot.guidanceGate = null;
  const guideBtn = document.getElementById('tutorial-guide-btn');
  if (guideBtn) guideBtn.style.display = 'none';
  
  const step = TUTORIAL_STEPS[currentTutorialStep];
  if (!step) return;
  
  document.getElementById('tutorial-step-num').innerText = currentTutorialStep + 1;
  document.getElementById('tutorial-step-total').innerText = TUTORIAL_STEPS.length;
  document.getElementById('tutorial-progress-pct').innerText = `${Math.round((currentTutorialStep / TUTORIAL_STEPS.length) * 100)}%`;
  
  document.getElementById('tutorial-step-desc').innerHTML = `
    <strong>${step.title}</strong><br>
    ${step.desc}
  `;
  
  document.getElementById('tutorial-step-inst').innerText = step.instruction;
  
  // Adjust plot view to standard tutorial starting point ONLY on first step
  if (currentTutorialStep === 0) {
    flowPlot.xAxis = step.targetX;
    flowPlot.yAxis = step.targetY;
    activeParentId = 'root';
  }
  
  syncWorkspace(caseEvents);
}

function verifyStep() {
  const step = TUTORIAL_STEPS[currentTutorialStep];
  
  if (currentTutorialStep === TUTORIAL_STEPS.length - 1) {
    // Diagnostic Review Step
    const diagnose = confirm(`Final Diagnostic Assessment:\nBased on your analysis, does this patient case have an immunophenotypic abnormality?\n\nClick "OK" for Yes (Aberrant/Leukemic Blasts present).\nClick "Cancel" for No (Normal whole blood).`);
    
    if ((diagnose && currentCase === 'aml') || (!diagnose && currentCase === 'normal')) {
      alert(`Correct! Your diagnosis matches the case description. Congratulations, you have successfully completed the training run!`);
      showToast('Training Course Completed! 🎓');
    } else {
      alert(`Incorrect Diagnosis. Review the CD45 vs SSC plot and the lineage tubes. Look for CD34+ CD117+ HLA-DR+ myeloid blasts in the CD45dim region.`);
    }
    return;
  }
  
  // Verify that the user created the target gate as a child of the correct parent
  const createdGate = activeGates.find(g => g.name.toLowerCase().includes(step.gateName.toLowerCase()) && g.parent === activeParentId);
  
  if (!createdGate) {
    alert(`Gating validation failed. Please draw a gate on the plot and name it exactly "${step.gateName}".`);
    return;
  }
  
  // Mathematical validation
  const isValid = step.validate(createdGate, caseEvents);
  if (isValid) {
    showToast(`Step ${currentTutorialStep + 1} Verified!`);
    currentTutorialStep++;
    loadTutorialStep();
  } else {
    stepFailures++;
    if (stepFailures >= 1) {
      document.getElementById('tutorial-guide-btn').style.display = 'inline-block';
    }
    alert(`Gate placement is biologically inaccurate (failed to capture target cell populations or contains too many unwanted events). Try adjusting your gate. If you struggle, click the green "Show Guide" button for guidance.`);
  }
}

function prevTutorialStep() {
  if (currentTutorialStep > 0) {
    currentTutorialStep--;
    loadTutorialStep();
  }
}

function nextTutorialStep() {
  verifyStep();
}

// Sandbox Mode
function toggleSandbox() {
  sandboxMode = !sandboxMode;
  const btn = document.getElementById('toggle-sandbox-btn');
  const tutorialBox = document.getElementById('tutorial-container');
  const toggleTutBtn = document.getElementById('toggle-tutorial-btn');
  
  if (sandboxMode) {
    btn.innerText = 'Exit Sandbox';
    btn.style.backgroundColor = 'var(--border-active)';
    btn.style.color = 'var(--bg-main)';
    tutorialBox.style.display = 'none';
    toggleTutBtn.style.display = 'none';
    showToast('Sandbox mode active - gating unrestricted!');
  } else {
    btn.innerText = 'Sandbox Mode';
    btn.style.backgroundColor = 'transparent';
    btn.style.color = 'var(--text-secondary)';
    tutorialBox.style.display = 'flex';
    toggleTutBtn.style.display = 'none';
    loadTutorialStep();
  }
}

// Toast Notifications
function showToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'success-toast';
  toast.innerText = msg;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 2500);
}

// Marker Glossary Builder
function buildGlossary() {
  const container = document.getElementById('marker-glossary-container');
  container.innerHTML = '';
  
  for (const [key, desc] of Object.entries(MARKER_GLOSSARY)) {
    const item = document.createElement('div');
    item.className = 'marker-item';
    item.innerHTML = `
      <div class="marker-name">${key}</div>
      <div style="color: var(--text-secondary); margin-top: 2px; line-height: 1.3;">${desc}</div>
    `;
    container.appendChild(item);
  }
}

// Show Gating Guide Overlay
function showTutorialGuide() {
  const step = TUTORIAL_STEPS[currentTutorialStep];
  if (step && step.guidanceGate) {
    flowPlot.guidanceGate = step.guidanceGate;
    flowPlot.draw();
    showToast('Guidance overlay activated!');
  }
}

// ==========================================================================
// Plot Gallery Sidebar Implementation
// ==========================================================================

// Build accordion and plot cards dynamically
function buildGallerySidebar() {
  const accordion = document.getElementById('gallery-accordion');
  if (!accordion) return;
  accordion.innerHTML = '';
  
  for (const [tube, plots] of Object.entries(PLOT_VARIATIONS)) {
    const tubeConfig = TUBE_CONFIGS[tube];
    const accordionItem = document.createElement('div');
    accordionItem.className = 'accordion-item';
    accordionItem.setAttribute('data-tube', tube);
    
    // Header
    const header = document.createElement('div');
    header.className = 'accordion-header';
    header.innerHTML = `
      <span>${tubeConfig.name}</span>
      <span class="accordion-arrow">▼</span>
    `;
    
    header.addEventListener('click', () => {
      const isExpanded = accordionItem.classList.contains('expanded');
      // Collapse all accordions
      document.querySelectorAll('.accordion-item').forEach(item => {
        item.classList.remove('expanded');
      });
      
      // Toggle current
      if (!isExpanded) {
        accordionItem.classList.add('expanded');
        // Redraw newly visible thumbnails
        updateGalleryThumbnails();
      }
    });
    
    // Content
    const content = document.createElement('div');
    content.className = 'accordion-content';
    
    plots.forEach((plot, idx) => {
      const galleryItem = document.createElement('div');
      galleryItem.className = 'gallery-item';
      galleryItem.setAttribute('data-tube', tube);
      galleryItem.setAttribute('data-fig-idx', idx);
      
      galleryItem.innerHTML = `
        <canvas class="gallery-thumb-canvas" width="90" height="90"></canvas>
        <div class="gallery-item-info">
          <div class="gallery-item-title">${plot.fig}: ${plot.x} vs ${plot.y}</div>
          <div class="gallery-item-name">${plot.name}</div>
          <div class="gallery-item-desc">${plot.desc}</div>
        </div>
      `;
      
      galleryItem.addEventListener('click', () => {
        selectGalleryPlot(tube, idx);
      });
      
      content.appendChild(galleryItem);
    });
    
    accordionItem.appendChild(header);
    accordionItem.appendChild(content);
    accordion.appendChild(accordionItem);
  }
}

// Collapsible Sidebar Panel Toggle
let activeSidebarTab = 'gallery'; // 'gallery' or 'gating'
let sidebarExpanded = true;

function initSidebar() {
  const sidebar = document.getElementById('left-sidebar');
  const toggleBtn = document.getElementById('toggle-sidebar-btn');
  const closeBtn = document.getElementById('close-sidebar-btn');
  const closeGatingBtn = document.getElementById('close-sidebar-btn-gating');
  const tabBtns = document.querySelectorAll('.vertical-tab-btn');
  
  // Tab Switching
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      switchSidebarTab(tab);
    });
  });
  
  // Header Toggle Button
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      toggleSidebar();
    });
  }
  
  // Inner Close Buttons
  if (closeBtn) closeBtn.addEventListener('click', () => toggleSidebar(false));
  if (closeGatingBtn) closeGatingBtn.addEventListener('click', () => toggleSidebar(false));
  
  // Initialize Resizer
  initSidebarResizer();
  
  // Restore State
  const savedWidth = localStorage.getItem('flow-sidebar-width');
  if (savedWidth && sidebar) {
    sidebar.style.width = savedWidth + 'px';
    sidebar.style.minWidth = savedWidth + 'px';
    sidebar.style.maxWidth = savedWidth + 'px';
  }
  
  const savedActiveTab = localStorage.getItem('flow-sidebar-active-tab') || 'gallery';
  const savedExpanded = localStorage.getItem('flow-sidebar-expanded') !== 'false';
  
  activeSidebarTab = savedActiveTab;
  sidebarExpanded = savedExpanded;
  
  if (sidebarExpanded) {
    if (sidebar) sidebar.classList.remove('collapsed');
    const resizer = document.getElementById('sidebar-resizer');
    if (resizer) resizer.style.display = 'block';
  } else {
    if (sidebar) sidebar.classList.add('collapsed');
    const resizer = document.getElementById('sidebar-resizer');
    if (resizer) resizer.style.display = 'none';
  }
  
  // Toggle active content divs
  document.querySelectorAll('.sidebar-tab-content').forEach(el => {
    el.classList.remove('active');
  });
  const activeContent = document.getElementById(`sidebar-tab-${activeSidebarTab}`);
  if (activeContent) activeContent.classList.add('active');
  
  updateTabButtons();
}

function switchSidebarTab(tabId) {
  const sidebar = document.getElementById('left-sidebar');
  const resizer = document.getElementById('sidebar-resizer');
  
  if (!sidebarExpanded) {
    sidebarExpanded = true;
    if (sidebar) sidebar.classList.remove('collapsed');
    if (resizer) resizer.style.display = 'block';
  } else if (activeSidebarTab === tabId) {
    // Clicking active tab collapses it
    toggleSidebar(false);
    return;
  }
  
  activeSidebarTab = tabId;
  localStorage.setItem('flow-sidebar-expanded', 'true');
  localStorage.setItem('flow-sidebar-active-tab', tabId);
  
  // Toggle active content divs
  document.querySelectorAll('.sidebar-tab-content').forEach(el => {
    el.classList.remove('active');
  });
  const activeContent = document.getElementById(`sidebar-tab-${tabId}`);
  if (activeContent) activeContent.classList.add('active');
  
  updateTabButtons();
  
  if (tabId === 'gallery') {
    highlightActiveGalleryItem();
    setTimeout(updateGalleryThumbnails, 50);
  }
}

function toggleSidebar(show) {
  const sidebar = document.getElementById('left-sidebar');
  const toggleBtn = document.getElementById('toggle-sidebar-btn');
  const resizer = document.getElementById('sidebar-resizer');
  
  if (show === undefined) {
    show = !sidebarExpanded;
  }
  
  sidebarExpanded = show;
  localStorage.setItem('flow-sidebar-expanded', show ? 'true' : 'false');
  
  if (show) {
    if (sidebar) sidebar.classList.remove('collapsed');
    if (toggleBtn) {
      toggleBtn.classList.add('active');
      toggleBtn.style.borderColor = 'var(--border-active)';
      toggleBtn.style.color = 'var(--border-active)';
    }
    if (resizer) resizer.style.display = 'block';
    
    if (activeSidebarTab === 'gallery') {
      highlightActiveGalleryItem();
      setTimeout(updateGalleryThumbnails, 50);
    }
  } else {
    if (sidebar) sidebar.classList.add('collapsed');
    if (toggleBtn) {
      toggleBtn.classList.remove('active');
      toggleBtn.style.borderColor = 'var(--border-color)';
      toggleBtn.style.color = 'var(--text-secondary)';
    }
    if (resizer) resizer.style.display = 'none';
  }
  
  updateTabButtons();
}

function updateTabButtons() {
  document.querySelectorAll('.vertical-tab-btn').forEach(btn => {
    btn.classList.remove('active');
    const tab = btn.getAttribute('data-tab');
    if (sidebarExpanded && tab === activeSidebarTab) {
      btn.classList.add('active');
    }
  });
}

function initSidebarResizer() {
  const resizer = document.getElementById('sidebar-resizer');
  const sidebar = document.getElementById('left-sidebar');
  if (!resizer || !sidebar) return;
  
  let startX, startWidth;
  
  resizer.addEventListener('mousedown', initDrag);
  
  function initDrag(e) {
    e.preventDefault();
    startX = e.clientX;
    startWidth = parseInt(document.defaultView.getComputedStyle(sidebar).width, 10);
    document.documentElement.addEventListener('mousemove', doDrag);
    document.documentElement.addEventListener('mouseup', stopDrag);
    resizer.classList.add('resizing');
  }
  
  function doDrag(e) {
    let width = startWidth + (e.clientX - startX);
    if (width < 280) width = 280;
    if (width > 700) width = 700;
    
    sidebar.style.width = width + 'px';
    sidebar.style.minWidth = width + 'px';
    sidebar.style.maxWidth = width + 'px';
    localStorage.setItem('flow-sidebar-width', width);
    
    // Redraw gallery thumbnails if visible
    if (activeSidebarTab === 'gallery') {
      updateGalleryThumbnails();
    }
  }
  
  function stopDrag(e) {
    document.documentElement.removeEventListener('mousemove', doDrag);
    document.documentElement.removeEventListener('mouseup', stopDrag);
    resizer.classList.remove('resizing');
  }
  
  // Double-click to reset back to default
  resizer.addEventListener('dblclick', () => {
    sidebar.style.width = '380px';
    sidebar.style.minWidth = '380px';
    sidebar.style.maxWidth = '380px';
    localStorage.setItem('flow-sidebar-width', '380');
    if (activeSidebarTab === 'gallery') {
      updateGalleryThumbnails();
    }
  });
}

// Map coordinates onto 90x90 thumbnail resolution
function getThumbPixelCoords(val, axis, scaleType, width, height, padding) {
  let fraction = 0;
  const isFluorophore = !['FSC_A', 'FSC_H', 'SSC_A', 'Time'].includes(axis);
  
  if (scaleType === 'log' && isFluorophore) {
    const adjustedVal = Math.max(1, val);
    const logVal = Math.log10(adjustedVal);
    fraction = logVal / 3; // Max decade is 10^3 (1000)
  } else {
    fraction = val / 1000;
  }
  
  return padding + fraction * (width - 2 * padding);
}

// Redraw thumbnails in the currently expanded accordion
function updateGalleryThumbnails() {
  const sidebar = document.getElementById('left-sidebar');
  if (!sidebar || sidebar.classList.contains('collapsed') || activeSidebarTab !== 'gallery') return;
  
  const expandedItem = document.querySelector('.accordion-item.expanded');
  if (!expandedItem) return;
  
  const tube = expandedItem.getAttribute('data-tube');
  const plots = PLOT_VARIATIONS[tube];
  const items = expandedItem.querySelectorAll('.gallery-item');
  
  const events = caseEvents;
  if (!events || events.length === 0) return;
  
  // Downsample to ~500 points for immediate rendering performance
  const step = Math.max(1, Math.floor(events.length / 500));
  
  items.forEach((item, idx) => {
    const canvas = item.querySelector('.gallery-thumb-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 90, 90);
    
    // Draw background
    ctx.fillStyle = '#0c111d';
    ctx.fillRect(0, 0, 90, 90);
    
    const plotConfig = plots[idx];
    const xAxis = plotConfig.x;
    const yAxis = plotConfig.y;
    
    // Filter events by gating state
    let filteredEvents = events;
    if (plotConfig.gate !== 'root') {
      const actualGate = activeGates.find(g => {
        const name = g.name.toLowerCase();
        if (plotConfig.gate === 'singlets' && name.includes('singlet')) return true;
        if (plotConfig.gate === 'cells' && name.includes('cell') && !name.includes('b cell') && !name.includes('t cell') && !name.includes('nk cell')) return true;
        if (plotConfig.gate === 'Lymphocytes' && name.includes('lymph')) return true;
        if (plotConfig.gate === 'BCell' && (name.includes('b cell') || name.includes('cd19'))) return true;
        return name.includes(plotConfig.gate.toLowerCase());
      });
      
      if (actualGate) {
        filteredEvents = events.filter(e => flowPlot.isPointInGate(e, actualGate));
      } else {
        // Bio-fallback if gate has not been drawn yet
        filteredEvents = events.filter(e => {
          if (plotConfig.gate === 'singlets') {
            return e.type !== 'Doublets';
          }
          if (plotConfig.gate === 'cells') {
            return e.type !== 'Debris' && e.type !== 'Doublets';
          }
          if (plotConfig.gate === 'Lymphocytes') {
            return ['CD4_TCell', 'CD8_TCell', 'gd_TCell', 'BCell', 'NKCell'].includes(e.type);
          }
          if (plotConfig.gate === 'BCell') {
            return e.type === 'BCell';
          }
          return true;
        });
      }
    }
    
    // Draw events, group by color to optimize fillStyle changes
    const colorGroups = {};
    const scaleType = flowPlot ? flowPlot.scaleType : 'log';
    
    for (let i = 0; i < filteredEvents.length; i += step) {
      const cell = filteredEvents[i];
      const cx = cell[xAxis];
      const cy = cell[yAxis];
      
      if (cx === undefined || cy === undefined) continue;
      
      const px = getThumbPixelCoords(cx, xAxis, scaleType, 90, 90, 6);
      const py = 90 - getThumbPixelCoords(cy, yAxis, scaleType, 90, 90, 6);
      
      const col = flowPlot ? flowPlot.getEventColor(cell) : 'rgba(148, 163, 184, 0.4)';
      if (!colorGroups[col]) {
        colorGroups[col] = [];
      }
      colorGroups[col].push({ x: px, y: py });
    }
    
    for (const [color, pts] of Object.entries(colorGroups)) {
      ctx.fillStyle = color;
      const ptsLen = pts.length;
      for (let j = 0; j < ptsLen; j++) {
        ctx.fillRect(pts[j].x - 0.75, pts[j].y - 0.75, 1.5, 1.5);
      }
    }
  });
}

// Select a gallery plot and update the active state
function selectGalleryPlot(tube, figIdx) {
  const figConfig = PLOT_VARIATIONS[tube][figIdx];
  if (!figConfig) return;
  
  // 1. Switch active tube tab if different
  if (currentTube !== tube) {
    currentTube = tube;
    document.querySelectorAll('.tube-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-tube') === currentTube) {
        btn.classList.add('active');
      }
    });
    setupAxesDropdowns(false); // don't preserve selection
  }
  
  // 2. Set main axes
  flowPlot.xAxis = figConfig.x;
  flowPlot.yAxis = figConfig.y;
  
  // Sync dropdown selectors
  const xSel = document.getElementById('x-axis-select');
  const ySel = document.getElementById('y-axis-select');
  if (xSel) xSel.value = figConfig.x;
  if (ySel) ySel.value = figConfig.y;
  
  // 3. Align Gating hierarchy with figure's gate
  let targetGateId = 'root';
  if (figConfig.gate !== 'root') {
    const matchingGate = activeGates.find(g => {
      const name = g.name.toLowerCase();
      if (figConfig.gate === 'singlets' && name.includes('singlet')) return true;
      if (figConfig.gate === 'cells' && name.includes('cell') && !name.includes('b cell') && !name.includes('t cell') && !name.includes('nk cell')) return true;
      if (figConfig.gate === 'Lymphocytes' && name.includes('lymph')) return true;
      if (figConfig.gate === 'BCell' && (name.includes('b cell') || name.includes('cd19'))) return true;
      return name.includes(figConfig.gate.toLowerCase());
    });
    
    if (matchingGate) {
      targetGateId = matchingGate.id;
    } else {
      // Gating node not drawn yet - inform the user
      showToast(`Normal gating: "${figConfig.fig}" filters on "${figConfig.gate}". Draw that gate to filter events!`);
    }
  }
  
  setActiveParent(targetGateId);
  highlightActiveGalleryItem();
}

// Dynamically highlight matching figure item in the gallery sidebar
function highlightActiveGalleryItem() {
  document.querySelectorAll('.gallery-item').forEach(item => {
    item.classList.remove('active');
  });
  
  // Ensure the active tube's accordion section is expanded
  const matchingAccordion = document.querySelector(`.accordion-item[data-tube="${currentTube}"]`);
  if (matchingAccordion && !matchingAccordion.classList.contains('expanded')) {
    // Collapse all
    document.querySelectorAll('.accordion-item').forEach(item => {
      item.classList.remove('expanded');
    });
    // Expand active
    matchingAccordion.classList.add('expanded');
  }
  
  // Find item that matches current tube, X, and Y axes
  const plots = PLOT_VARIATIONS[currentTube];
  if (!plots) return;
  
  const activeFigIdx = plots.findIndex(p => p.x === flowPlot.xAxis && p.y === flowPlot.yAxis);
  if (activeFigIdx !== -1) {
    const matchingItem = document.querySelector(`.gallery-item[data-tube="${currentTube}"][data-fig-idx="${activeFigIdx}"]`);
    if (matchingItem) {
      matchingItem.classList.add('active');
      // Scroll into view gently
      matchingItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
}

// Make floating window draggable helper
function makeElementDraggable(elmnt, dragHandle) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  if (dragHandle) {
    dragHandle.onmousedown = dragMouseDown;
  } else {
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    e = e || window.event;
    // Don't drag if clicking minimize/close or other buttons
    if (e.target.closest('button') || e.target.closest('select') || e.target.closest('input')) return;
    
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    
    let newTop = elmnt.offsetTop - pos2;
    let newLeft = elmnt.offsetLeft - pos1;
    
    // Bounds check to keep it in the window
    const pad = 10;
    if (newTop < pad) newTop = pad;
    if (newTop > window.innerHeight - elmnt.offsetHeight - pad) {
      newTop = window.innerHeight - elmnt.offsetHeight - pad;
    }
    if (newLeft < pad) newLeft = pad;
    if (newLeft > window.innerWidth - elmnt.offsetWidth - pad) {
      newLeft = window.innerWidth - elmnt.offsetWidth - pad;
    }
    
    elmnt.style.top = newTop + "px";
    elmnt.style.left = newLeft + "px";
    elmnt.style.bottom = "auto";
    elmnt.style.right = "auto";
  }

  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

// Select active comparison plot
function selectActivePlot(plotId) {
  if (currentCase !== 'compare') return;
  activePlot = plotId;
  
  const cardNormal = document.getElementById('plot-card-normal');
  const cardAML = document.getElementById('plot-card-aml');
  
  if (plotId === 'normal') {
    if (cardNormal) cardNormal.classList.add('active-compare-plot');
    if (cardAML) cardAML.classList.remove('active-compare-plot');
  } else {
    if (cardAML) cardAML.classList.add('active-compare-plot');
    if (cardNormal) cardNormal.classList.remove('active-compare-plot');
  }
  
  // Sync Gating Tree & Stats Table to selected plot
  syncWorkspace();
}

// ==========================================================================
// Zoom Mappings & Sync Logic
// ==========================================================================

function syncPlotsZoom(zoomX, zoomY) {
  flowPlot.zoomX = [...zoomX];
  flowPlot.zoomY = [...zoomY];
  if (flowPlotAML) {
    flowPlotAML.zoomX = [...zoomX];
    flowPlotAML.zoomY = [...zoomY];
  }
  flowPlot.draw();
  if (flowPlotAML) flowPlotAML.draw();
  
  const resetBtn = document.getElementById('reset-zoom-btn');
  if (resetBtn) resetBtn.style.display = 'inline-block';
}

function resetPlotsZoom() {
  flowPlot.zoomX = [0, 1000];
  flowPlot.zoomY = [0, 1000];
  if (flowPlotAML) {
    flowPlotAML.zoomX = [0, 1000];
    flowPlotAML.zoomY = [0, 1000];
  }
  flowPlot.draw();
  if (flowPlotAML) flowPlotAML.draw();
  
  const resetBtn = document.getElementById('reset-zoom-btn');
  if (resetBtn) resetBtn.style.display = 'none';
}

// ==========================================================================
// CD Markers & Cell Types Reference Database
// ==========================================================================

const CELL_DETAILS = {
  CD4_TCell: {
    name: 'CD4+ Helper T-Cell',
    lineage: 'Lymphoid Lineage / T-Cell',
    desc: 'CD4+ helper T cells are crucial coordinators of adaptive immunity. They secrete cytokines to assist B cells in antibody production and help activate CD8+ cytotoxic T cells. In flow cytometry, they are identified by bright CD45 expression, CD3+, CD5+, CD2+, CD7+, and CD4+ (while being CD8-).',
    markers: {
      CD45: { label: 'CD45 (Leukocyte Common Antigen)', expression: 'Very Bright', color: '#f8fafc', info: 'Highly abundant receptor tyrosine phosphatase present on all white blood cells. Crucial for T-cell receptor signaling activation.' },
      CD3: { label: 'CD3 (T-Cell Receptor Complex)', expression: 'Bright', color: '#00e5ff', info: 'Multi-subunit complex that associates with the T-cell receptor (TCR) to transmit activation signals to the nucleus.' },
      CD4: { label: 'CD4 Co-Receptor', expression: 'Bright', color: '#ff9800', info: 'Monomeric glycoprotein containing 4 Ig-like domains. Binds to MHC Class II molecules on antigen-presenting cells.' },
      CD5: { label: 'CD5 Glycoprotein', expression: 'Bright', color: '#e040fb', info: 'Transmembrane receptor that modulates T-cell receptor signaling strength and serves as a lymphoid marker.' },
      CD2: { label: 'CD2 LFA-2 Receptor', expression: 'Bright', color: '#4caf50', info: 'Adhesion molecule that interacts with CD58 (LFA-3) to facilitate co-stimulatory T-cell interactions.' },
      CD7: { label: 'CD7 Glycoprotein', expression: 'Bright', color: '#2196f3', info: 'Early marker of T-lineage commitment, involved in early T-cell activation.' }
    }
  },
  CD8_TCell: {
    name: 'CD8+ Cytotoxic T-Cell',
    lineage: 'Lymphoid Lineage / T-Cell',
    desc: 'CD8+ cytotoxic T cells are responsible for direct cell-mediated destruction of virus-infected cells and tumor cells. They release perforin and granzymes to induce apoptosis. Identified as CD45+ (bright), CD3+, CD8+, CD5+, CD2+, CD7+, and CD4-.',
    markers: {
      CD45: { label: 'CD45 (Leukocyte Common Antigen)', expression: 'Very Bright', color: '#f8fafc', info: 'Highly abundant receptor tyrosine phosphatase present on all white blood cells.' },
      CD3: { label: 'CD3 (T-Cell Receptor Complex)', expression: 'Bright', color: '#00e5ff', info: 'Transmembrane signal transducer associated with TCR.' },
      CD8: { label: 'CD8 Co-Receptor', expression: 'Bright', color: '#ff2a2a', info: 'Disulfide-linked heterodimeric glycoprotein (alpha and beta chains). Binds to MHC Class I molecules to initiate cytotoxicity.' },
      CD5: { label: 'CD5 Glycoprotein', expression: 'Bright', color: '#e040fb', info: 'Transmembrane receptor modulating T-cell signaling.' },
      CD2: { label: 'CD2 LFA-2 Receptor', expression: 'Bright', color: '#4caf50', info: 'Adhesion glycoprotein enhancing TCR affinity.' },
      CD7: { label: 'CD7 Glycoprotein', expression: 'Bright', color: '#2196f3', info: 'Transmembrane glycoprotein involved in T-cell costimulation.' }
    }
  },
  gd_TCell: {
    name: 'Gamma-Delta T-Cell',
    lineage: 'Lymphoid Lineage / T-Cell',
    desc: 'Gamma-Delta T cells represent a specialized subset of T cells expressing the TCR gamma and delta chains instead of alpha-beta. They bridge innate and adaptive immunity. Identified as CD45+ (bright), CD3+, TCR_gd+, CD5+ (moderate/variable), CD4-, and CD8-.',
    markers: {
      CD45: { label: 'CD45 (Leukocyte Common Antigen)', expression: 'Very Bright', color: '#f8fafc', info: 'Essential tyrosine phosphatase present on all leukocytes.' },
      CD3: { label: 'CD3 (T-Cell Receptor Complex)', expression: 'Bright', color: '#00e5ff', info: 'Signal transducer complex linked to TCR.' },
      TCR_gd: { label: 'TCR Gamma-Delta', expression: 'Bright', color: '#ff9800', info: 'Alternative T-cell receptor complex that recognizes non-peptide antigens directly without MHC presentation.' },
      CD5: { label: 'CD5 Glycoprotein', expression: 'Moderate', color: '#e040fb', info: 'Expressed at lower levels than alpha-beta T-cells.' },
      CD2: { label: 'CD2 LFA-2 Receptor', expression: 'Bright', color: '#4caf50', info: 'Adhesion molecule aiding cellular interactions.' },
      CD7: { label: 'CD7 Glycoprotein', expression: 'Bright', color: '#2196f3', info: 'Pan-T lymphoid glycoprotein.' }
    }
  },
  BCell: {
    name: 'B Lymphocyte',
    lineage: 'Lymphoid Lineage / B-Cell',
    desc: 'B cells are key players in humoral immunity. Upon antigen binding and helper T-cell activation, they differentiate into plasma cells that secrete antibodies. In flow cytometry, they are CD45+ (bright), CD19+, CD20+, CD200+, and negative for T-cell markers.',
    markers: {
      CD45: { label: 'CD45 (Leukocyte Common Antigen)', expression: 'Very Bright', color: '#f8fafc', info: 'Abundant pan-leukocyte phosphatase regulator.' },
      CD19: { label: 'CD19 Co-Receptor', expression: 'Bright', color: '#ff9800', info: 'Transmembrane glycoprotein of the Ig superfamily. Functions as a dominant assembly platform for B-cell signal transduction.' },
      CD20: { label: 'CD20 Calcium Channel', expression: 'Bright', color: '#00e5ff', info: 'Tetraspanin protein that crosses the cell membrane 4 times. Regulates calcium flux and B-cell activation and development.' },
      CD200: { label: 'CD200 Glycoprotein', expression: 'Bright', color: '#e040fb', info: 'Membrane glycoprotein that delivers inhibitory signals to monocytes; helpful in differentiating chronic lymphocytic leukemia.' },
      CD10: { label: 'CD10 (CALLA)', expression: 'Dim to Mod', color: '#4caf50', info: 'Neutral endopeptidase expressed on pre-B cells and follicular center B cells.' }
    }
  },
  NKCell: {
    name: 'Natural Killer Cell',
    lineage: 'Lymphoid Lineage / NK-Cell',
    desc: 'NK cells are cytotoxic lymphocytes of the innate immune system. They patrol the body and destroy virus-infected or malignant cells that lack MHC Class I molecules ("missing self"). Flow signature: CD45+ (bright), CD56+, CD16+, CD2+, CD3-.',
    markers: {
      CD45: { label: 'CD45 (Leukocyte Common Antigen)', expression: 'Very Bright', color: '#f8fafc', info: 'Tyrosine phosphatase regulator present on all leukocytes.' },
      CD56: { label: 'CD56 (NCAM)', expression: 'Bright', color: '#e040fb', info: 'Neural Cell Adhesion Molecule. Serves as a primary identifier for NK cells, facilitating cell-to-cell adhesion.' },
      CD16: { label: 'CD16 (FcγRIII)', expression: 'Bright', color: '#ff2a2a', info: 'Low-affinity Fc receptor for IgG. Mediates antibody-dependent cellular cytotoxicity (ADCC) by binding antibody-coated targets.' },
      CD2: { label: 'CD2 LFA-2 Receptor', expression: 'Bright', color: '#4caf50', info: 'Adhesion molecule involved in NK cell activation.' }
    }
  },
  Monocyte: {
    name: 'Monocyte',
    lineage: 'Myeloid Lineage',
    desc: 'Monocytes are large mononuclear phagocytes. They circulate in the bloodstream before migrating into tissues to differentiate into macrophages or dendritic cells, mediating phagocytosis and antigen presentation. Signature: CD45+ (bright/intermediate), CD14+, CD64+, CD33+, CD13+, HLA-DR+.',
    markers: {
      CD45: { label: 'CD45 (Leukocyte Common Antigen)', expression: 'Bright', color: '#f8fafc', info: 'Expressed slightly less brightly than on lymphocytes.' },
      CD14: { label: 'CD14 LPS Receptor', expression: 'Bright', color: '#4caf50', info: 'GPI-anchored receptor that binds lipopolysaccharide (LPS). Lacks a transmembrane segment and sits anchored to the outer leaflet.' },
      CD64: { label: 'CD64 (FcγRI)', expression: 'Bright', color: '#ff9800', info: 'High-affinity Fc receptor for IgG. Heavily expressed on monocytes and macrophages, mediating phagocytosis.' },
      CD33: { label: 'CD33 (Siglec-3)', expression: 'Bright', color: '#00e5ff', info: 'Myeloid-specific sialic acid-binding lectin. Inhibits immune cell activation; target for AML therapeutics.' },
      CD13: { label: 'CD13 (Aminopeptidase N)', expression: 'Bright', color: '#2196f3', info: 'Zinc-binding metalloprotease expressed on myeloid cells, involved in peptide cleavage and invasion.' },
      CD11b: { label: 'CD11b (Mac-1)', expression: 'Bright', color: '#e040fb', info: 'Integrin alpha subunit that pairs with CD18 to form Mac-1 adhesion receptor, mediating leukocyte migration.' },
      HLA_DR: { label: 'HLA-DR (MHC Class II)', expression: 'Bright', color: '#ff2a2a', info: 'Antigen presentation receptor complex that displays foreign peptide fragments to helper T cells.' }
    }
  },
  Granulocyte: {
    name: 'Neutrophilic Granulocyte',
    lineage: 'Myeloid Lineage',
    desc: 'Neutrophils are the most abundant granulocytes, forming the first line of defense against bacterial infections. They use phagocytosis, degranulation, and neutrophil extracellular traps (NETs). Signature: CD45+ (moderate/dim), high side-scatter (SSC), CD15+, CD16+, CD13+, CD11b+.',
    markers: {
      CD45: { label: 'CD45 (Leukocyte Common Antigen)', expression: 'Dim/Moderate', color: '#f8fafc', info: 'Characteristically lower CD45 intensity than monocytes and lymphocytes.' },
      CD15: { label: 'CD15 (Lewis X Carbohydrate)', expression: 'Bright', color: '#ff9800', info: 'Highly branched carbohydrate adhesion molecule expressed on mature granulocytes. Mediates phagocyte adhesion to endothelium.' },
      CD16: { label: 'CD16 (FcγRIII)', expression: 'Bright', color: '#ff2a2a', info: 'Low-affinity IgG Fc receptor, highly expressed on mature neutrophils.' },
      CD13: { label: 'CD13 (Aminopeptidase N)', expression: 'Bright', color: '#2196f3', info: 'Myeloid metalloprotease enzyme.' },
      CD33: { label: 'CD33 (Siglec-3)', expression: 'Moderate', color: '#00e5ff', info: 'Myeloid-specific sialic acid-binding lectin, lower expression in mature granulocytes.' },
      CD11b: { label: 'CD11b (Mac-1)', expression: 'Bright', color: '#e040fb', info: 'Adhesion integrin essential for extravasation into infection sites.' }
    }
  },
  NormalProgenitor: {
    name: 'Hematopoietic Stem/Progenitor Cell',
    lineage: 'Stem Cell / Progenitor',
    desc: 'Normal progenitor cells (HSPCs) reside in the bone marrow and give rise to all blood cell lineages. They are rare in peripheral blood but represent normal stem cell compartments. Signature: CD45+ (moderate/dim), CD34+, CD117+, CD38+, HLA-DR+.',
    markers: {
      CD45: { label: 'CD45 (Leukocyte Common Antigen)', expression: 'Dim/Moderate', color: '#f8fafc', info: 'Lower CD45 expression typical of immature blast populations.' },
      CD34: { label: 'CD34 Sialomucin', expression: 'Bright', color: '#ff9800', info: 'Long mucin-like transmembrane glycoprotein. Serves as a universal marker for hematopoietic stem/progenitor cells.' },
      CD117: { label: 'CD117 (c-kit Receptor)', expression: 'Bright', color: '#ff2a2a', info: 'Receptor tyrosine kinase for stem cell factor (SCF). Essential for survival, proliferation, and differentiation of stem cells.' },
      CD38: { label: 'CD38 Ectoenzyme', expression: 'Bright', color: '#e040fb', info: 'ADP-ribosyl cyclase ectoenzyme, expressed on early hematopoietic cells and activated cells.' },
      HLA_DR: { label: 'HLA-DR (MHC Class II)', expression: 'Bright', color: '#00e5ff', info: 'Expressed on early progenitors, downregulated in certain lineages during development.' }
    }
  },
  AML_Blast: {
    name: 'AML Leukemic Blast',
    lineage: 'Abnormal Myeloid Blasts (Leukemic)',
    desc: 'Leukemic blasts in Acute Myeloid Leukemia (AML) are abnormal, clonal myeloblasts that fail to mature, accumulating in the marrow and peripheral blood. Signature: CD45+ (characteristically dim blast gate), CD34+, CD117+, CD33+, CD13+, HLA-DR+, with aberrant expression patterns.',
    markers: {
      CD45: { label: 'CD45 (Leukocyte Common Antigen)', expression: 'Dim', color: '#f8fafc', info: 'Dim expression is the hallmark signature used to identify myeloblasts in flow cytometry ("blast gate").' },
      CD34: { label: 'CD34 Sialomucin', expression: 'Bright/Variable', color: '#ff9800', info: 'Stem/progenitor glycoprotein. Often aberrantly high or present in AML blasts.' },
      CD117: { label: 'CD117 (c-kit Receptor)', expression: 'Bright', color: '#ff2a2a', info: 'Stem cell factor receptor. Its presence confirms myeloid precursor origin in AML diagnosis.' },
      CD33: { label: 'CD33 (Siglec-3)', expression: 'Bright', color: '#00e5ff', info: 'Myeloid marker present on leukemia cells. Serves as the primary target for antibody-drug conjugates like Gemtuzumab Ozogamicin.' },
      CD13: { label: 'CD13 (Aminopeptidase N)', expression: 'Bright', color: '#2196f3', info: 'Pan-myeloid metalloprotease marker expressed in acute myeloid leukemia.' },
      CD38: { label: 'CD38 Ectoenzyme', expression: 'Very Bright', color: '#e040fb', info: 'Aberrantly high or dysregulated expression common in leukemic clones.' },
      HLA_DR: { label: 'HLA-DR (MHC Class II)', expression: 'Bright', color: '#4caf50', info: 'Expressed on myeloblasts (except in acute promyelocytic leukemia, APL, which is CD34- and HLA-DR-).' }
    }
  },
  Debris: {
    name: 'Non-Cellular Debris',
    lineage: 'Non-Biological / Artifact',
    desc: 'Debris represents red cell stroma, platelets, cellular fragments, or dye precipitates. They are typically excluded from analysis by size gating (low FSC) and low CD45 staining.',
    markers: {
      CD45: { label: 'CD45', expression: 'Extremely Dim', color: '#f8fafc', info: 'Background autofluorescence or trace binding.' }
    }
  },
  Doublets: {
    name: 'Cell Doublet / Aggregate',
    lineage: 'Coincidence Artifact',
    desc: 'Doublets occur when two cells pass through the laser beam simultaneously. They represent a fluidics artifact and must be gated out using height vs. area scatter plots (FSC-H vs FSC-A) to prevent false double-positive statistics.',
    markers: {
      CD45: { label: 'CD45', expression: 'Variable', color: '#f8fafc', info: 'Reflects the combined staining of the aggregated cells.' }
    }
  }
};

const MARKER_FLUOROCHROMES = {
  CD45: { antibody: "Anti-CD45 Monoclonal", fluorochrome: "KRO (Krome Orange)", laser: "violet", laserName: "Violet Laser (405nm)", emissionColor: "#f97316", emissionWavelength: "545 nm" },
  CD3: { antibody: "Anti-CD3 Monoclonal", fluorochrome: "PB (Pacific Blue)", laser: "violet", laserName: "Violet Laser (405nm)", emissionColor: "#60a5fa", emissionWavelength: "450 nm" },
  CD4: { antibody: "Anti-CD4 Monoclonal", fluorochrome: "PE (Phycoerythrin)", laser: "blue", laserName: "Blue Laser (488nm)", emissionColor: "#f59e0b", emissionWavelength: "578 nm" },
  CD8: { antibody: "Anti-CD8 Monoclonal", fluorochrome: "APC-A750", laser: "red", laserName: "Red Laser (633nm)", emissionColor: "#450a0a", emissionWavelength: "779 nm" },
  CD5: { antibody: "Anti-CD5 Monoclonal", fluorochrome: "PC7 (PE-Cy7)", laser: "blue", laserName: "Blue Laser (488nm)", emissionColor: "#4a044e", emissionWavelength: "778 nm" },
  CD2: { antibody: "Anti-CD2 Monoclonal", fluorochrome: "ECD (PE-Texas Red)", laser: "blue", laserName: "Blue Laser (488nm)", emissionColor: "#f43f5e", emissionWavelength: "615 nm" },
  CD7: { antibody: "Anti-CD7 Monoclonal", fluorochrome: "APC-A700", laser: "red", laserName: "Red Laser (633nm)", emissionColor: "#991b1b", emissionWavelength: "720 nm" },
  TCR_gd: { antibody: "Anti-TCR γδ Monoclonal", fluorochrome: "FITC (Fluorescein)", laser: "blue", laserName: "Blue Laser (488nm)", emissionColor: "#22c55e", emissionWavelength: "525 nm" },
  CD19: { antibody: "Anti-CD19 Monoclonal", fluorochrome: "PB (Pacific Blue)", laser: "violet", laserName: "Violet Laser (405nm)", emissionColor: "#60a5fa", emissionWavelength: "450 nm" },
  CD20: { antibody: "Anti-CD20 Monoclonal", fluorochrome: "APC-A750", laser: "red", laserName: "Red Laser (633nm)", emissionColor: "#450a0a", emissionWavelength: "779 nm" },
  CD200: { antibody: "Anti-CD200 Monoclonal", fluorochrome: "PC7 (PE-Cy7)", laser: "blue", laserName: "Blue Laser (488nm)", emissionColor: "#4a044e", emissionWavelength: "778 nm" },
  CD10: { antibody: "Anti-CD10 Monoclonal", fluorochrome: "ECD (PE-Texas Red)", laser: "blue", laserName: "Blue Laser (488nm)", emissionColor: "#f43f5e", emissionWavelength: "615 nm" },
  CD56: { antibody: "Anti-CD56 Monoclonal", fluorochrome: "PC5.5 (PE-Cy5.5)", laser: "blue", laserName: "Blue Laser (488nm)", emissionColor: "#a21caf", emissionWavelength: "695 nm" },
  CD16: { antibody: "Anti-CD16 Monoclonal", fluorochrome: "FITC (Fluorescein)", laser: "blue", laserName: "Blue Laser (488nm)", emissionColor: "#22c55e", emissionWavelength: "525 nm" },
  CD14: { antibody: "Anti-CD14 Monoclonal", fluorochrome: "APC-A700", laser: "red", laserName: "Red Laser (633nm)", emissionColor: "#991b1b", emissionWavelength: "720 nm" },
  CD64: { antibody: "Anti-CD64 Monoclonal", fluorochrome: "PC7 (PE-Cy7)", laser: "blue", laserName: "Blue Laser (488nm)", emissionColor: "#4a044e", emissionWavelength: "778 nm" },
  CD33: { antibody: "Anti-CD33 Monoclonal", fluorochrome: "PC7 (PE-Cy7)", laser: "blue", laserName: "Blue Laser (488nm)", emissionColor: "#4a044e", emissionWavelength: "778 nm" },
  CD13: { antibody: "Anti-CD13 Monoclonal", fluorochrome: "PC5.5 (PE-Cy5.5)", laser: "blue", laserName: "Blue Laser (488nm)", emissionColor: "#a21caf", emissionWavelength: "695 nm" },
  CD11b: { antibody: "Anti-CD11b Monoclonal", fluorochrome: "PB (Pacific Blue)", laser: "violet", laserName: "Violet Laser (405nm)", emissionColor: "#60a5fa", emissionWavelength: "450 nm" },
  HLA_DR: { antibody: "Anti-HLA-DR Monoclonal", fluorochrome: "APC-A750", laser: "red", laserName: "Red Laser (633nm)", emissionColor: "#450a0a", emissionWavelength: "779 nm" },
  CD34: { antibody: "Anti-CD34 Monoclonal", fluorochrome: "APC (Allophycocyanin)", laser: "red", laserName: "Red Laser (633nm)", emissionColor: "#dc2626", emissionWavelength: "660 nm" },
  CD117: { antibody: "Anti-CD117 Monoclonal", fluorochrome: "ECD (PE-Texas Red)", laser: "blue", laserName: "Blue Laser (488nm)", emissionColor: "#f43f5e", emissionWavelength: "615 nm" },
  CD38: { antibody: "Anti-CD38 Monoclonal", fluorochrome: "APC-A700", laser: "red", laserName: "Red Laser (633nm)", emissionColor: "#991b1b", emissionWavelength: "720 nm" },
};

// Simulator State
let isConjugationActive = false;
let activeLasers = { violet: false, blue: false, red: false };

// ==========================================================================
// 3D Cell Explorer View Navigation & Rendering
// ==========================================================================

let threeJSData = null;
let canvas3DData = null;

function openCell3DExplorer(cell, originCase) {
  // Hide main UI
  document.querySelector('header').style.display = 'none';
  document.querySelector('.workspace').style.display = 'none';
  
  // Show Explorer View
  const explorerView = document.getElementById('cell-explorer-view');
  explorerView.style.display = 'flex';
  
  // Set case indicator
  document.getElementById('explorer-case-indicator').innerText = originCase;
  
  // Initialize the 3D rendering
  init3DCellExplorer(cell.type);
}

function init3DCellExplorer(cellType) {
  const container = document.getElementById('explorer-3d-container');
  const loader = document.getElementById('explorer-loading');
  const legend = document.getElementById('explorer-3d-legend');
  const details = CELL_DETAILS[cellType] || CELL_DETAILS.Debris;
  
  // Reset simulator state when entering new cell
  resetSimulatorStates();

  // Populate text
  document.getElementById('explorer-cell-name').innerText = details.name;
  document.getElementById('explorer-cell-lineage').innerText = details.lineage;
  document.getElementById('explorer-cell-desc').innerText = details.desc;
  
  // Clear container (except loader)
  const existingCanvas = container.querySelector('canvas');
  if (existingCanvas) container.removeChild(existingCanvas);
  loader.style.display = 'flex';
  
  // Populate markers list in sidebar
  const listContainer = document.getElementById('explorer-markers-list');
  listContainer.innerHTML = '';
  
  // Populate 3D legend inside container
  legend.innerHTML = '<h5 style="font-size: 10px; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px; margin-bottom: 4px; font-weight: 700;">CD Legend</h5>';
  
  const markerEntries = Object.entries(details.markers);
  let savedLasers = null;

  markerEntries.forEach(([key, marker]) => {
    // Sidebar list item
    const btn = document.createElement('button');
    btn.className = 'explorer-marker-btn';
    btn.dataset.markerKey = key;
    btn.innerHTML = `
      <div class="dot-and-label">
        <span class="legend-color-dot" style="background-color: ${marker.color}"></span>
        <span>${key}</span>
      </div>
      <span class="expression-level">${marker.expression}</span>
    `;
    
    btn.title = `${marker.label}: ${marker.info}`;
    listContainer.appendChild(btn);
    
    // Add hover event to highlight marker in 3D and show conjugate details
    btn.addEventListener('mouseenter', () => {
      highlight3DMarker(key, true);
      
      const abData = MARKER_FLUOROCHROMES[key];
      if (abData) {
        document.getElementById('conjugate-target').innerText = key;
        document.getElementById('conjugate-antibody').innerText = abData.antibody;
        
        const fSpan = document.getElementById('conjugate-fluorochrome');
        fSpan.innerText = abData.fluorochrome;
        fSpan.style.color = abData.emissionColor;
        
        document.getElementById('conjugate-laser').innerText = abData.laserName;
        document.getElementById('conjugate-emission').innerText = abData.emissionWavelength;
        
        document.getElementById('explorer-conjugate-card').style.display = 'block';
        
        // Auto-excite fluorochrome by temporarily activating the laser (if conjugation is toggled on)
        if (isConjugationActive) {
          savedLasers = { ...activeLasers };
          activeLasers.violet = (abData.laser === 'violet');
          activeLasers.blue = (abData.laser === 'blue');
          activeLasers.red = (abData.laser === 'red');
          
          document.getElementById('laser-violet-btn').classList.toggle('active', activeLasers.violet);
          document.getElementById('laser-blue-btn').classList.toggle('active', activeLasers.blue);
          document.getElementById('laser-red-btn').classList.toggle('active', activeLasers.red);
        }
      }
    });
    btn.addEventListener('mouseleave', () => {
      highlight3DMarker(key, false);
      
      document.getElementById('explorer-conjugate-card').style.display = 'none';
      
      if (savedLasers) {
        activeLasers = { ...savedLasers };
        savedLasers = null;
        
        document.getElementById('laser-violet-btn').classList.toggle('active', activeLasers.violet);
        document.getElementById('laser-blue-btn').classList.toggle('active', activeLasers.blue);
        document.getElementById('laser-red-btn').classList.toggle('active', activeLasers.red);
      }
    });
    
    // Legend overlay item
    const legItem = document.createElement('div');
    legItem.className = 'explorer-legend-item';
    legItem.innerHTML = `
      <span class="legend-color-dot" style="background-color: ${marker.color}"></span>
      <span>${key} (${marker.expression})</span>
    `;
    legend.appendChild(legItem);
  });
  
  // Start the appropriate renderer
  setTimeout(() => {
    loader.style.display = 'none';
    if (typeof THREE !== 'undefined') {
      try {
        initThreeJSRenderer(container, details);
      } catch (err) {
        console.error("ThreeJS failed, falling back to 2D Canvas 3D renderer", err);
        initCanvas3DRenderer(container, details);
      }
    } else {
      initCanvas3DRenderer(container, details);
    }
  }, 150); // Small timeout to allow UI transition
}

function cleanup3DCellExplorer() {
  if (threeJSData) {
    if (threeJSData.cleanup) threeJSData.cleanup();
    if (threeJSData.resizeHandler) window.removeEventListener('resize', threeJSData.resizeHandler);
    if (threeJSData.animationFrameId) cancelAnimationFrame(threeJSData.animationFrameId);
    threeJSData = null;
  }
  
  if (canvas3DData) {
    if (canvas3DData.cleanup) canvas3DData.cleanup();
    if (canvas3DData.resizeHandler) window.removeEventListener('resize', canvas3DData.resizeHandler);
    canvas3DData = null;
  }
}

function highlight3DMarker(key, highlight) {
  // ThreeJS Mode
  if (threeJSData && threeJSData.markerMeshes[key]) {
    threeJSData.markerMeshes[key].forEach(group => {
      group.children.forEach(child => {
        if (child.material) {
          if (highlight) {
            child.scale.set(1.5, 1.5, 1.5);
            if (child.material.emissive) {
              child.material.emissiveIntensity = 0.8;
            }
          } else {
            child.scale.set(1, 1, 1);
            if (child.material.emissive) {
              child.material.emissiveIntensity = 0.1;
            }
          }
        }
      });
    });
    const btn = document.querySelector(`.explorer-marker-btn[data-marker-key="${key}"]`);
    if (btn) {
      if (highlight) btn.classList.add('highlighted');
      else btn.classList.remove('highlighted');
    }
  }
  
  // 2D Canvas Fallback Mode
  if (canvas3DData && canvas3DData.markers[key]) {
    canvas3DData.highlightedKey = highlight ? key : null;
    const btn = document.querySelector(`.explorer-marker-btn[data-marker-key="${key}"]`);
    if (btn) {
      if (highlight) btn.classList.add('highlighted');
      else btn.classList.remove('highlighted');
    }
  }
}

function initThreeJSRenderer(container, details) {
  const width = container.clientWidth;
  const height = container.clientHeight;
  
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.z = 15;
  
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);
  
  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(5, 5, 5);
  scene.add(dirLight);
  const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.4);
  dirLight2.position.set(-5, -5, -5);
  scene.add(dirLight2);
  
  // Cell Group
  const cellGroup = new THREE.Group();
  scene.add(cellGroup);
  
  // Core Cell Body (Wireframe Icosahedron)
  const geometry = new THREE.IcosahedronGeometry(4, 2);
  const material = new THREE.MeshBasicMaterial({
    color: 0x334155,
    wireframe: true,
    transparent: true,
    opacity: 0.35
  });
  const cellMesh = new THREE.Mesh(geometry, material);
  cellGroup.add(cellMesh);
  
  // Nucleus Sphere
  const nucGeom = new THREE.SphereGeometry(1.8, 16, 16);
  const nucMat = new THREE.MeshBasicMaterial({
    color: 0x0f172a,
    wireframe: true,
    transparent: true,
    opacity: 0.2
  });
  const nucleusMesh = new THREE.Mesh(nucGeom, nucMat);
  cellGroup.add(nucleusMesh);
  
  // CD Markers / Receptors
  const markerMeshes = {};
  const antibodyMeshes = {};
  const fluorochromeMeshes = {};
  const markersList = Object.entries(details.markers);
  let totalReceptors = 0;
  
  markersList.forEach(([key, marker]) => {
    let count = 8;
    if (marker.expression === 'Very Bright') count = 24;
    else if (marker.expression === 'Bright') count = 16;
    else if (marker.expression === 'Moderate') count = 10;
    else if (marker.expression === 'Dim') count = 4;
    
    markerMeshes[key] = [];
    antibodyMeshes[key] = [];
    fluorochromeMeshes[key] = [];
    
    // Create receptor geometry (stalk + head)
    const rodGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8);
    rodGeom.translate(0, 0.4, 0); // shift pivot to base
    
    const headGeom = new THREE.SphereGeometry(0.12, 8, 8);
    headGeom.translate(0, 0.8, 0); // put at top of rod
    
    const receptorGeom = new THREE.Group();
    
    const rodMat = new THREE.MeshBasicMaterial({ color: marker.color });
    const rodMesh = new THREE.Mesh(rodGeom, rodMat);
    receptorGeom.add(rodMesh);
    
    const headMat = new THREE.MeshPhongMaterial({ color: marker.color, emissive: marker.color, emissiveIntensity: 0.1 });
    const headMesh = new THREE.Mesh(headGeom, headMat);
    receptorGeom.add(headMesh);

    // Y-shaped antibody group
    const abData = MARKER_FLUOROCHROMES[key];
    let abGroup = null;
    
    if (abData) {
      abGroup = new THREE.Group();
      abGroup.name = "antibodyGroup";
      abGroup.visible = isConjugationActive;
      
      const abMat = new THREE.MeshPhongMaterial({ color: 0x8892b0, transparent: true, opacity: 0.8 });
      
      // Stem
      const stemGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.25, 6);
      stemGeom.translate(0, 0.125, 0);
      const stemMesh = new THREE.Mesh(stemGeom, abMat);
      abGroup.add(stemMesh);
      
      // Left arm
      const lArmGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.2, 6);
      lArmGeom.translate(0, 0.1, 0);
      const lArmMesh = new THREE.Mesh(lArmGeom, abMat);
      lArmMesh.position.set(0, 0.25, 0);
      lArmMesh.rotation.z = Math.PI / 4;
      abGroup.add(lArmMesh);
      
      // Right arm
      const rArmGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.2, 6);
      rArmGeom.translate(0, 0.1, 0);
      const rArmMesh = new THREE.Mesh(rArmGeom, abMat);
      rArmMesh.position.set(0, 0.25, 0);
      rArmMesh.rotation.z = -Math.PI / 4;
      abGroup.add(rArmMesh);
      
      // Fluorochrome spheres
      const fMat = new THREE.MeshPhongMaterial({
        color: abData.emissionColor,
        emissive: abData.emissionColor,
        emissiveIntensity: 0.15,
        transparent: true,
        opacity: 0.95
      });
      const fGeom = new THREE.SphereGeometry(0.065, 8, 8);
      
      const lf = new THREE.Mesh(fGeom, fMat);
      lf.name = "fluorochrome";
      lf.position.set(-0.14, 0.38, 0);
      abGroup.add(lf);
      
      const rf = new THREE.Mesh(fGeom, fMat);
      rf.name = "fluorochrome";
      rf.position.set(0.14, 0.38, 0);
      abGroup.add(rf);
      
      abGroup.position.y = 0.8;
      receptorGeom.add(abGroup);
    }
    
    // Distribute receptors on the sphere using Fibonacci spiral
    for (let i = 0; i < count; i++) {
      const index = totalReceptors + i;
      totalReceptors++;
      
      const phi = Math.acos(-1 + (2 * index) / 150);
      const theta = Math.sqrt(150 * Math.PI) * phi;
      
      const x = 4 * Math.sin(phi) * Math.cos(theta);
      const y = 4 * Math.sin(phi) * Math.sin(theta);
      const z = 4 * Math.cos(phi);
      
      const receptorInstance = receptorGeom.clone();
      receptorInstance.position.set(x, y, z);
      
      const targetVec = new THREE.Vector3(x, y, z).normalize();
      receptorInstance.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), targetVec);
      
      cellGroup.add(receptorInstance);
      markerMeshes[key].push(receptorInstance);

      if (abGroup) {
        const clonedAb = receptorInstance.children.find(c => c.name === "antibodyGroup");
        if (clonedAb) {
          antibodyMeshes[key].push(clonedAb);
          const clonedFluors = clonedAb.children.filter(c => c.name === "fluorochrome");
          fluorochromeMeshes[key].push(...clonedFluors);
        }
      }
    }
  });

  // Simulator Lasers
  const laserBeams = {};
  const laserConfig = {
    violet: { color: 0xa855f7, y: 1.8 },
    blue: { color: 0x3b82f6, y: 0 },
    red: { color: 0xef4444, y: -1.8 }
  };
  
  Object.entries(laserConfig).forEach(([laserKey, config]) => {
    const laserGeom = new THREE.CylinderGeometry(0.18, 0.18, 30, 8);
    laserGeom.rotateZ(Math.PI / 2);
    
    const laserMat = new THREE.MeshBasicMaterial({
      color: config.color,
      transparent: true,
      opacity: 0,
      depthWrite: false
    });
    
    const laserMesh = new THREE.Mesh(laserGeom, laserMat);
    laserMesh.position.set(0, config.y, 0);
    scene.add(laserMesh);
    laserBeams[laserKey] = laserMesh;
  });
  
  // Interaction states
  let isDragging = false;
  let prevMousePos = { x: 0, y: 0 };
  let autoRotate = true;
  let autoRotateTimer = null;
  
  const onMouseDown = (e) => {
    isDragging = true;
    prevMousePos = { x: e.clientX, y: e.clientY };
    autoRotate = false;
    if (autoRotateTimer) clearTimeout(autoRotateTimer);
  };
  
  const onMouseMove = (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - prevMousePos.x;
    const deltaY = e.clientY - prevMousePos.y;
    
    cellGroup.rotation.y += deltaX * 0.007;
    cellGroup.rotation.x += deltaY * 0.007;
    
    prevMousePos = { x: e.clientX, y: e.clientY };
  };
  
  const onMouseUp = () => {
    isDragging = false;
    autoRotateTimer = setTimeout(() => {
      autoRotate = true;
    }, 3000);
  };
  
  renderer.domElement.addEventListener('mousedown', onMouseDown);
  renderer.domElement.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
  
  threeJSData = {
    renderer,
    scene,
    camera,
    cellGroup,
    markerMeshes,
    antibodyMeshes,
    fluorochromeMeshes,
    laserBeams,
    animationFrameId: null,
    autoRotate: () => autoRotate,
    cleanup: () => {
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (autoRotateTimer) clearTimeout(autoRotateTimer);
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      scene.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else obj.material.dispose();
        }
      });
      renderer.dispose();
    }
  };
  
  const animate = () => {
    threeJSData.animationFrameId = requestAnimationFrame(animate);
    
    if (autoRotate) {
      cellGroup.rotation.y += 0.004;
      cellGroup.rotation.x += 0.001;
    }
    
    const time = Date.now() * 0.001;
    const scale = 1 + 0.015 * Math.sin(time * 2);
    cellMesh.scale.set(scale, scale, scale);

    // Update laser beam opacity
    Object.entries(laserBeams).forEach(([laserKey, beam]) => {
      const targetOpacity = activeLasers[laserKey] ? 0.35 + 0.05 * Math.sin(Date.now() * 0.01) : 0;
      beam.material.opacity += (targetOpacity - beam.material.opacity) * 0.15;
    });

    // Animate fluorochrome pulsing when excited
    markersList.forEach(([key, marker]) => {
      const abData = MARKER_FLUOROCHROMES[key];
      if (abData && fluorochromeMeshes[key]) {
        const isExcited = isConjugationActive && activeLasers[abData.laser];
        fluorochromeMeshes[key].forEach((f, idx) => {
          if (isExcited) {
            const offset = idx * 0.2;
            const pulse = 0.5 + 0.5 * Math.sin(time * 6 + offset);
            f.material.emissiveIntensity = 0.6 + 0.8 * pulse;
            const fScale = 1.0 + 0.3 * pulse;
            f.scale.set(fScale, fScale, fScale);
          } else {
            f.material.emissiveIntensity = 0.15;
            f.scale.set(1, 1, 1);
          }
        });
      }
    });
    
    renderer.render(scene, camera);
  };
  
  animate();
  
  const onResize = () => {
    if (!threeJSData) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  window.addEventListener('resize', onResize);
  threeJSData.resizeHandler = onResize;
}

function initCanvas3DRenderer(container, details) {
  const width = container.clientWidth;
  const height = container.clientHeight;
  
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  
  const vertices = [];
  const rings = 8;
  const sectors = 12;
  const radius = 150;
  
  const markers = {};
  let totalReceptors = 0;
  
  Object.entries(details.markers).forEach(([key, marker]) => {
    let count = 8;
    if (marker.expression === 'Very Bright') count = 20;
    else if (marker.expression === 'Bright') count = 14;
    else if (marker.expression === 'Moderate') count = 9;
    else if (marker.expression === 'Dim') count = 4;
    
    markers[key] = [];
    
    for (let i = 0; i < count; i++) {
      const index = totalReceptors + i;
      totalReceptors++;
      
      const phi = Math.acos(-1 + (2 * index) / 120);
      const theta = Math.sqrt(120 * Math.PI) * phi;
      
      const nx = Math.sin(phi) * Math.cos(theta);
      const ny = Math.sin(phi) * Math.sin(theta);
      const nz = Math.cos(phi);
      
      markers[key].push({ nx, ny, nz, color: marker.color });
    }
  });
  
  let rx = 0.2;
  let ry = 0.5;
  let isDragging = false;
  let prevMousePos = { x: 0, y: 0 };
  let autoRotate = true;
  let autoRotateTimer = null;
  
  const onMouseDown = (e) => {
    isDragging = true;
    prevMousePos = { x: e.clientX, y: e.clientY };
    autoRotate = false;
    if (autoRotateTimer) clearTimeout(autoRotateTimer);
  };
  
  const onMouseMove = (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - prevMousePos.x;
    const deltaY = e.clientY - prevMousePos.y;
    
    ry += deltaX * 0.007;
    rx += deltaY * 0.007;
    
    prevMousePos = { x: e.clientX, y: e.clientY };
  };
  
  const onMouseUp = () => {
    isDragging = false;
    autoRotateTimer = setTimeout(() => {
      autoRotate = true;
    }, 3000);
  };
  
  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
  
  canvas3DData = {
    canvas,
    cleanup: () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (autoRotateTimer) clearTimeout(autoRotateTimer);
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    },
    markers,
    highlightedKey: null
  };
  
  const distance = 400;
  const centerX = width / 2;
  const centerY = height / 2;
  
  function project(x, y, z) {
    const x1 = x * Math.cos(ry) - z * Math.sin(ry);
    const z1 = x * Math.sin(ry) + z * Math.cos(ry);
    
    const y2 = y * Math.cos(rx) - z1 * Math.sin(rx);
    const z2 = y * Math.sin(rx) + z1 * Math.cos(rx);
    
    const perspective = distance / (z2 + distance);
    const sx = centerX + x1 * perspective;
    const sy = centerY + y2 * perspective;
    
    return { sx, sy, sz: z2 };
  }
  
  let frameId;
  function draw() {
    if (!canvas3DData) return;
    
    ctx.clearRect(0, 0, width, height);
    
    if (autoRotate) {
      ry += 0.004;
      rx += 0.001;
    }
    
    // Draw active lasers first (background of the cell)
    Object.entries(activeLasers).forEach(([laserKey, active]) => {
      if (!active) return;
      let ly = centerY;
      let laserColor = 'rgba(59, 130, 246, 0.2)';
      if (laserKey === 'violet') { ly = centerY - 60; laserColor = 'rgba(168, 85, 247, 0.2)'; }
      else if (laserKey === 'blue') { ly = centerY; laserColor = 'rgba(59, 130, 246, 0.2)'; }
      else if (laserKey === 'red') { ly = centerY + 60; laserColor = 'rgba(239, 68, 68, 0.2)'; }
      
      const grad = ctx.createLinearGradient(0, ly, width, ly);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(0.5, laserColor);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      
      ctx.fillStyle = grad;
      ctx.fillRect(0, ly - 8, width, 16);
      
      // Draw core bright line in the center of the beam
      ctx.strokeStyle = laserKey === 'violet' ? '#c084fc' : (laserKey === 'blue' ? '#60a5fa' : '#f87171');
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, ly);
      ctx.lineTo(width, ly);
      ctx.stroke();
    });
    
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
    ctx.lineWidth = 1;
    
    // Draw longitudinal lines
    for (let s = 0; s < sectors; s++) {
      ctx.beginPath();
      for (let r = 0; r <= rings; r++) {
        const phi = (r * Math.PI) / rings;
        const theta = (s * 2 * Math.PI) / sectors;
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);
        
        const pt = project(x, y, z);
        if (r === 0) ctx.moveTo(pt.sx, pt.sy);
        else ctx.lineTo(pt.sx, pt.sy);
      }
      ctx.stroke();
    }
    
    // Draw latitudinal lines
    for (let r = 1; r < rings; r++) {
      ctx.beginPath();
      const phi = (r * Math.PI) / rings;
      for (let s = 0; s <= sectors; s++) {
        const theta = (s * 2 * Math.PI) / sectors;
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);
        
        const pt = project(x, y, z);
        if (s === 0) ctx.moveTo(pt.sx, pt.sy);
        else ctx.lineTo(pt.sx, pt.sy);
      }
      ctx.stroke();
    }
    
    // Draw core nucleus
    ctx.fillStyle = 'rgba(11, 19, 41, 0.5)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.beginPath();
    const corePt = project(0, 0, 0);
    const coreRadius = radius * 0.45 * (distance / (0 + distance));
    ctx.arc(corePt.sx, corePt.sy, coreRadius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    
    // Draw CD Markers
    const allMarkers = [];
    Object.entries(markers).forEach(([key, list]) => {
      const isHighlighted = (canvas3DData.highlightedKey === key);
      list.forEach(m => {
        const bx = radius * m.nx;
        const by = radius * m.ny;
        const bz = radius * m.nz;
        
        const length = isHighlighted ? 45 : 30;
        const tx = (radius + length) * m.nx;
        const ty = (radius + length) * m.ny;
        const tz = (radius + length) * m.nz;
        
        const basePt = project(bx, by, bz);
        const tipPt = project(tx, ty, tz);
        
        allMarkers.push({
          key,
          sz: tipPt.sz,
          basePt,
          tipPt,
          color: m.color,
          isHighlighted,
          nx: m.nx,
          ny: m.ny,
          nz: m.nz
        });
      });
    });
    
    // Sort back-to-front
    allMarkers.sort((a, b) => b.sz - a.sz);
    
    allMarkers.forEach(m => {
      ctx.strokeStyle = m.color;
      ctx.lineWidth = m.isHighlighted ? 3.5 : 1.5;
      ctx.beginPath();
      ctx.moveTo(m.basePt.sx, m.basePt.sy);
      ctx.lineTo(m.tipPt.sx, m.tipPt.sy);
      ctx.stroke();
      
      ctx.fillStyle = m.color;
      ctx.beginPath();
      const headRadius = m.isHighlighted ? 6.5 : 4;
      ctx.arc(m.tipPt.sx, m.tipPt.sy, headRadius, 0, 2 * Math.PI);
      ctx.fill();
      
      if (m.isHighlighted) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Draw Antibody Conjugates (Y-shape + Fluorochromes)
      if (isConjugationActive) {
        const abData = MARKER_FLUOROCHROMES[m.key];
        if (abData) {
          const dx = m.tipPt.sx - m.basePt.sx;
          const dy = m.tipPt.sy - m.basePt.sy;
          const len = Math.sqrt(dx*dx + dy*dy);
          
          if (len > 0) {
            const ux = dx / len;
            const uy = dy / len;
            const px = -uy;
            const py = ux;
            
            // Stem end
            const sx = m.tipPt.sx + ux * 8;
            const sy = m.tipPt.sy + uy * 8;
            
            // Left arm
            const lx = sx + ux * 6 + px * 5;
            const ly = sy + uy * 6 + py * 5;
            
            // Right arm
            const rx = sx + ux * 6 - px * 5;
            const ry = sy + uy * 6 - py * 5;
            
            // Draw grey Y body
            ctx.strokeStyle = '#8892b0';
            ctx.lineWidth = m.isHighlighted ? 2.5 : 1.2;
            ctx.beginPath();
            ctx.moveTo(m.tipPt.sx, m.tipPt.sy);
            ctx.lineTo(sx, sy);
            ctx.moveTo(sx, sy);
            ctx.lineTo(lx, ly);
            ctx.moveTo(sx, sy);
            ctx.lineTo(rx, ry);
            ctx.stroke();
            
            // Fluorochrome emission glow & circles
            const isExcited = activeLasers[abData.laser];
            const pulseRadius = isExcited ? 3 + 1.2 * Math.sin(Date.now() * 0.01) : 2;
            
            if (isExcited) {
              ctx.shadowBlur = 8;
              ctx.shadowColor = abData.emissionColor;
            }
            
            ctx.fillStyle = abData.emissionColor;
            ctx.beginPath();
            ctx.arc(lx, ly, pulseRadius, 0, 2 * Math.PI);
            ctx.arc(rx, ry, pulseRadius, 0, 2 * Math.PI);
            ctx.fill();
            
            ctx.shadowBlur = 0; // reset
          }
        }
      }
    });
    
    frameId = requestAnimationFrame(draw);
  }
  
  draw();
  
  const onResize = () => {
    if (!canvas3DData) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    canvas.width = w;
    canvas.height = h;
  };
  window.addEventListener('resize', onResize);
  canvas3DData.resizeHandler = onResize;
  canvas3DData.animationFrameId = frameId;
}

function resetSimulatorStates() {
  isConjugationActive = false;
  activeLasers.violet = false;
  activeLasers.blue = false;
  activeLasers.red = false;
  
  const conjugationToggle = document.getElementById('sim-conjugation-toggle');
  if (conjugationToggle) conjugationToggle.checked = false;
  
  const laserControlsContainer = document.getElementById('laser-controls-container');
  if (laserControlsContainer) {
    laserControlsContainer.style.opacity = '0.5';
    laserControlsContainer.style.pointerEvents = 'none';
  }
  
  const vBtn = document.getElementById('laser-violet-btn');
  const bBtn = document.getElementById('laser-blue-btn');
  const rBtn = document.getElementById('laser-red-btn');
  if (vBtn) vBtn.classList.remove('active');
  if (bBtn) bBtn.classList.remove('active');
  if (rBtn) rBtn.classList.remove('active');
  
  const card = document.getElementById('explorer-conjugate-card');
  if (card) card.style.display = 'none';
}

function initSimulatorEvents() {
  const conjugationToggle = document.getElementById('sim-conjugation-toggle');
  const laserVioletBtn = document.getElementById('laser-violet-btn');
  const laserBlueBtn = document.getElementById('laser-blue-btn');
  const laserRedBtn = document.getElementById('laser-red-btn');
  const laserControlsContainer = document.getElementById('laser-controls-container');
  
  if (conjugationToggle) {
    conjugationToggle.addEventListener('change', (e) => {
      isConjugationActive = e.target.checked;
      
      if (isConjugationActive) {
        if (laserControlsContainer) {
          laserControlsContainer.style.opacity = '1';
          laserControlsContainer.style.pointerEvents = 'auto';
        }
      } else {
        if (laserControlsContainer) {
          laserControlsContainer.style.opacity = '0.5';
          laserControlsContainer.style.pointerEvents = 'none';
        }
        
        activeLasers.violet = false;
        activeLasers.blue = false;
        activeLasers.red = false;
        
        if (laserVioletBtn) laserVioletBtn.classList.remove('active');
        if (laserBlueBtn) laserBlueBtn.classList.remove('active');
        if (laserRedBtn) laserRedBtn.classList.remove('active');
      }
      
      // Update ThreeJS meshes visibility
      if (threeJSData && threeJSData.antibodyMeshes) {
        Object.values(threeJSData.antibodyMeshes).forEach(meshes => {
          meshes.forEach(mesh => {
            mesh.visible = isConjugationActive;
          });
        });
      }
    });
  }
  
  const setupLaserToggle = (btn, colorKey) => {
    if (btn) {
      btn.addEventListener('click', () => {
        activeLasers[colorKey] = !activeLasers[colorKey];
        btn.classList.toggle('active', activeLasers[colorKey]);
      });
    }
  };
  
  setupLaserToggle(laserVioletBtn, 'violet');
  setupLaserToggle(laserBlueBtn, 'blue');
  setupLaserToggle(laserRedBtn, 'red');
}


