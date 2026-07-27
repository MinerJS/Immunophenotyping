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
let explorerPlotsVisible = false;
let explorerPlotFscSsc = null;
let explorerPlotCd45Ssc = null;
let explorerPlotLineage = null;
let currentCreatedPoints = null; // Temp storage for newly drawn points
let stepFailures = 0;             // Tracks failures per tutorial step
let activeSelectedGateId = null;  // Tracks currently selected gate on canvas
let caseEvents = [];              // Stored events for the active case to ensure persistence
let normalEvents = [];
let amlEvents = [];
let activeGatesAML = [];
let activeParentIdAML = 'root';
let activePlot = 'normal'; // 'normal' or 'aml'
let isFullscreenActive = false;
let fullscreenTarget = null; // 'both', 'normal', 'aml', or null
let activeAmlCaseId = 'aml';  // Selected AML case id (can be aml or any aml_m0..aml_m7)


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
  aml_m0: {
    title: 'Case #18-M0: AML-M0 (Minimally Differentiated)',
    subtitle: 'Bone Marrow Immunophenotyping',
    vignette: 'This 42-year-old female presents with severe fatigue and pancytopenia. Bone marrow aspirate shows sheets of medium-sized blasts with round-to-oval nuclei and agranular cytoplasm. Cytochemical myeloperoxidase (MPO) staining is negative (<3% positive). Early myeloid lineage is established via flow cytometric expression of CD117 and CD33.',
    diagnosis: 'aml_m0'
  },
  aml_m1: {
    title: 'Case #18-M1: AML-M1 (Without Maturation)',
    subtitle: 'Bone Marrow Immunophenotyping',
    vignette: 'This 29-year-old male presents with fever, bleeding gums, and circulating blasts. Bone marrow aspirate shows >90% blasts with minimal granulocytic maturation. The blasts are cytochemically MPO positive, and flow cytometry demonstrates CD34+, CD117+, CD13+, and CD33+ expression with CD15 negativity.',
    diagnosis: 'aml_m1'
  },
  aml_m2: {
    title: 'Case #18-M2: AML-M2 (With Maturation)',
    subtitle: 'Bone Marrow Immunophenotyping',
    vignette: 'This 48-year-old female presents with bone pain and leukocytosis. Bone marrow aspirate shows primitive myeloblasts alongside maturing myeloid elements (promyelocytes, myelocytes, neutrophils). Cytogenetics reveal a t(8;21)(q22;q22) RUNX1-RUNX1T1 translocation, and flow cytometry shows aberrant CD19 expression on the CD34+ blasts.',
    diagnosis: 'aml_m2'
  },
  aml_m3: {
    title: 'Case #18-M3: AML-M3 (APL - Medical Emergency)',
    subtitle: 'Peripheral Blood & Bone Marrow Immunophenotyping',
    vignette: 'This 35-year-old male presents with extensive bruising, epistaxis, and severe coagulopathy (prolonged PT/APTT, low fibrinogen). Smear reveals promyelocytes with hypergranular cytoplasm and numerous Auer rods ("fagot cells"). Flow cytometry reveals a diagnostic immunophenotype that is characteristically CD34 negative, HLA-DR negative, and strongly/homogeneously CD33 bright. Start ATRA immediately!',
    diagnosis: 'aml_m3'
  },
  aml_m4: {
    title: 'Case #18-M4: AML-M4 (Acute Myelomonocytic)',
    subtitle: 'Bone Marrow Immunophenotyping',
    vignette: 'This 52-year-old male presents with gingival hypertrophy and lymphadenopathy. Bone marrow aspirate contains a mixture of myeloblasts and monoblasts (both lineages representing >20% of nucleated cells). Flow cytometry shows co-existing populations of CD34+/CD117+ myeloblasts and CD14+/CD64+/CD11b+ monocytic cells.',
    diagnosis: 'aml_m4'
  },
  aml_m5: {
    title: 'Case #18-M5: AML-M5 (Acute Monocytic)',
    subtitle: 'Peripheral Blood & Marrow Immunophenotyping',
    vignette: 'This 61-year-old female presents with hyperleukocytosis (WBC >100,000/µL), headache, and confusion due to leukostasis. Bone marrow aspirate shows >80% monoblasts and promonocytes. Flow cytometry shows a prominent CD45-moderate/SSC-intermediate cell gate expressing HLA-DR+++, CD33+++, CD64+, CD11b+, and CD14+/- with negative CD34 and CD117.',
    diagnosis: 'aml_m5'
  },
  aml_m6: {
    title: 'Case #18-M6: AML-M6 (Acute Erythroid)',
    subtitle: 'Bone Marrow Aspirate Immunophenotyping',
    vignette: 'This 68-year-old male with a history of MDS presents with worsening anemia and transfusion dependence. Bone marrow shows erythroid hyperplasia with >50% erythroid precursors showing severe dyserythropoiesis and >20% non-erythroid myeloblasts. Flow cytometry highlights a distinct CD45-negative/very dim, SSC-low, CD71+ erythroid population.',
    diagnosis: 'aml_m6'
  },
  aml_m7: {
    title: 'Case #18-M7: AML-M7 (Acute Megakaryoblastic)',
    subtitle: 'Bone Marrow Aspirate & Core Biopsy',
    vignette: 'This 24-month-old child with Down syndrome presents with organomegaly. Bone marrow aspirate yields a "dry tap" due to extensive reticulin fibrosis. Core biopsy shows sheets of megakaryoblasts, often with cytoplasmic blebs. Flow cytometry demonstrates CD34+, CD117+, HLA-DR negative/dim, and aberrant CD56 expression. Platelet glycoproteins CD41/CD61 are positive on immunohistochemistry.',
    diagnosis: 'aml_m7'
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
  FSC_A: 'Forward Scatter Area (FSC-A): Indicates cell size. When light passes a cell, it diffracts forward. Larger cells produce more forward scatter. Used to distinguish cells from small debris.',
  FSC_H: 'Forward Scatter Height (FSC-H): Used in combination with Forward Scatter Area (FSC-A) to perform doublet exclusion. Single cells fall along a diagonal line, whereas cell clumps or doublets show disproportionately larger Area compared to Height and lie off the diagonal.',
  SSC_A: 'Side Scatter Area (SSC-A): Represents internal complexity, granularity, or nuclear shape of the cell. Cells with high granularity (like mature granulocytes/neutrophils) scatter light at 90-degree angles and show high SSC-A, while lymphocytes have simple internal structures and very low SSC-A.',
  Time: 'Time: Tracks event rate over time during acquisition. A stable run shows a flat distribution. Spikes or gaps indicate fluidic instability, clogs, or speed variations.',
  CD2: 'CD2: Pan-T and NK-cell marker. Expressed on thymocytes, mature T lymphocytes, and natural killer (NK) cells. Also acts as an adhesion molecule.',
  CD3: 'CD3: Pan-T-cell marker. Highly specific marker defining mature T lymphocytes. Co-expresses with TCR (T-cell receptor) to form the TCR-CD3 complex.',
  CD4: 'CD4: Helper T-cell marker. Expressed at high levels on helper T lymphocytes and at lower levels on monocytes/macrophages and dendritic cells.',
  CD5: 'CD5: T-cell marker. Expressed on all T lymphocytes and a small sub-population of mature B-cells (B-1 cells). Aberrantly expressed on clonal B-cells in CLL and Mantle Cell Lymphoma.',
  CD7: 'CD7: Early T-cell and NK-cell marker. Expressed on T-cell precursors, mature T-cells, and NK cells. Often aberrantly expressed on myeloblasts in AML (about 30% of cases), indicating lineage infidelity.',
  CD8: 'CD8: Cytotoxic T-cell marker. Expressed as a heterodimer on cytotoxic T lymphocytes, and also on a subset of NK cells and gamma-delta T cells.',
  CD10: 'CD10 (CALLA): Common Acute Lymphoblastic Leukemia Antigen. Expressed on early B-cell progenitors (hematogones), mature granulocytes, and germinal center B-cells (follicular lymphomas).',
  CD11b: 'CD11b: Myeloid adhesion molecule. Expressed strongly on mature neutrophils, monocytes, and NK cells. Acquired late in granulocyte maturation.',
  CD13: 'CD13: Myeloid marker. Expressed on early myeloid progenitors (myeloblasts), maturing granulocytes, and monocytes. Aberrant loss of CD13 is common in myeloid neoplasms.',
  CD14: 'CD14: Monocyte marker. Strongly expressed on mature monocytes/macrophages. Absent or extremely low on granulocytes and lymphocytes. Useful for gating monocytes.',
  CD15: 'CD15: Granulocytic marker. Strongly expressed on mature and maturing granulocytes, monocytes, and Reed-Sternberg cells. Used to monitor granulocytic differentiation.',
  CD16: 'CD16: FcγRIII receptor. Expressed on mature granulocytes and natural killer (NK) cells. CD16 expression increases during late granulocyte maturation.',
  CD19: 'CD19: Pan-B-cell marker. Expressed throughout B-cell development (from pro-B cells to mature B-cells, but lost on plasma cells). The primary backbone marker for gating B-cells.',
  CD20: 'CD20: B-cell Marker. Expressed on B-cells starting from the pre-B stage up to mature B-cells (lost on plasma cells). Target for monoclonal antibody therapies (e.g. rituximab).',
  CD33: 'CD33: Myeloid marker. Expressed on myeloid progenitors, monocytes (strongly), and maturing granulocytes (moderately). Present on most AML blasts.',
  CD34: 'CD34: Early Hematopoietic Progenitor Marker. Expressed on pluripotent stem cells and early progenitor cells of myeloid and lymphoid lineages. Normally <0.01% in peripheral blood. Marker of immature blasts.',
  CD38: 'CD38: Activation marker. Expressed widely on early progenitors, activated T-cells, and B-cells. Strongly expressed at extremely high levels on plasma cells.',
  CD45: 'CD45: Leukocyte Common Antigen (LCA). Expressed on all white blood cells. Standard backbone marker in flow cytometry. When plotted against SSC-A, it differentiates lymphocytes (bright/low SSC), monocytes (moderate-bright/moderate SSC), granulocytes (moderate/high SSC), and blasts/progenitors (dim/low SSC).',
  CD56: 'CD56: Neural Cell Adhesion Molecule (NCAM). The primary marker for Natural Killer (NK) cells. Also expressed on a subset of T-cells (NK/T cells) and aberrantly on plasma cells in myeloma.',
  CD64: 'CD64: High-affinity FcγRI receptor. Expressed strongly on monocytes and promyelocytes/myeloblasts. Upregulated on mature granulocytes during infection/inflammation.',
  CD117: 'CD117 (c-Kit): Receptor tyrosine kinase. Expressed on early hematopoietic progenitors, mast cells, and progenitors of myeloid lineage. Highly useful for identifying myeloid blasts in AML.',
  CD123: 'CD123 (IL-3Rα): Interleukin-3 receptor alpha chain. Strongly expressed on plasmacytoid dendritic cells and basophils. Also expressed on early myeloid progenitors and AML blasts.',
  CD200: 'CD200: B-cell glycoprotein. Expressed on B-lymphocytes. Highly useful in distinguishing Chronic Lymphocytic Leukemia (typically CD200 positive) from Mantle Cell Lymphoma (typically CD200 negative).',
  Kappa: 'Kappa (κ): Immunoglobulin Light Chain. Normal mature B-cell populations are polyclonal and express a mixture of Kappa and Lambda light chains (normal κ:λ ratio is around 1.4:1). Clonal expansion of either Kappa or Lambda indicates a monoclonal B-cell population (lymphoma).',
  Lambda: 'Lambda (λ): Immunoglobulin Light Chain. Expressed on the surface of mature B-lymphocytes. Evaluated alongside Kappa to detect light chain restriction/clonality.',
  HLA_DR: 'HLA-DR: MHC Class II antigen. Expressed on antigen-presenting cells (monocytes, B-cells, dendritic cells) and early progenitors. Absent on mature granulocytes.',
  TCR_gd: 'TCRγδ: Gamma-delta T-Cell Receptor. Expressed on a minor subset of mature T-lymphocytes (typically CD4- and CD8-, or CD8+ dim) that home to mucosal interfaces.'
};

// Tube Descriptions for current view adaptation
const TUBE_DESCRIPTIONS = {
  B: 'B Cell Tube: Used primarily to identify B-cell lineage cells (CD19+, CD20+) and evaluate B-lymphocyte clonality by assessing the ratio of Kappa to Lambda light chains. Helps screen for B-cell chronic lymphoproliferative disorders like CLL (CD5+, CD200+) or Mantle Cell Lymphoma (CD5+, CD200-).',
  T: 'T Cell Tube: Designed to identify and characterize T-lymphocyte (CD3+, CD2+, CD5+, CD7+, CD4+, CD8+, TCRγδ) and NK-cell (CD56+, CD16+, CD8+, CD2+, CD7+) populations. Useful for evaluating T-cell and NK-cell lymphoma, T-cell sub-populations (CD4/CD8 ratio), and lineage-specific gating.',
  M1: 'Myeloid M1 Tube: Focuses on the assessment of myeloid progenitors, granulocytic maturation, and monocytic populations. Key markers include CD11b, CD13, CD14, CD16, CD64, CD34, CD45, HLA-DR, and CD7, useful in diagnosing Acute Myeloid Leukemia (AML) and myelodysplastic syndromes.',
  M2: 'Myeloid M2 Tube: Designed to complement the Myeloid M1 tube, assessing myeloid and monocytic differentiation pathways. Includes markers CD117, CD123, CD13, CD33, CD34, CD38, CD15, HLA-DR, CD19, CD45. Highly useful for classifying AML sub-populations and checking for aberrant CD19 expression on myeloblasts.'
};

// Study Glossary Database
const STUDY_GLOSSARY = {
  // 1. Flow Cytometry & General terms
  'Flow Cytometry': 'A technology that measures physical and chemical characteristics of cells or particles as they flow in a single-file fluid stream through a beam of light (usually a laser). Measured parameters include cell size, internal complexity, and fluorescence intensity.',
  'Immunophenotyping': 'The analysis of heterogeneous populations of cells for the presence and level of specific cell-surface and intracellular proteins (antigens/markers) using monoclonal antibodies conjugated to fluorochromes.',
  'Gating': 'The process of selecting a specific subset of events (cells) on a flow cytometry plot by drawing a boundary (gate) around them. Allows sequential analysis of target cell populations.',
  'Back-gating': 'A validation technique where a gated cell population (e.g. CD45 dim blasts) is projected back onto previously drawn plots (e.g. FSC vs SSC) to verify its scatter properties and check for contamination from other cell types.',
  'Fluorochrome': 'A fluorescent chemical compound that can re-emit light upon light excitation. Conjugated to antibodies to label specific proteins on or inside cells for detection.',
  'Singlets': 'Single, isolated cell events. Flow cytometry requires single-cell analysis. Singlet gating excludes doublets or cell aggregates.',
  'Doublet': 'Two cells stuck together that pass through the laser beam simultaneously. Doublets distort fluorescence and scatter measurements and must be excluded using FSC-A vs FSC-H gating.',
  'Debris': 'Non-cellular particles, cell fragments, or platelets. Characterized by extremely low forward scatter (FSC) and side scatter (SSC) characteristics; gated out during analysis.',
  'Forward Scatter (FSC)': 'Light diffracted by a cell along the path of the laser beam. The intensity of forward scatter is proportional to the size of the cell.',
  'Side Scatter (SSC)': 'Light scattered by a cell at a 90-degree angle from the laser beam path. Proportional to the cell\'s internal complexity, granularity, and nuclear shape.',
  'Lineage Fidelity': 'When leukemic cells express only markers specific to their cell lineage (e.g. B-lymphoblasts expressing B-cell markers only).',
  'Lineage Infidelity (Aberrancy)': 'The expression of markers from an unrelated lineage on leukemic cells (e.g., myeloblasts expressing T-cell marker CD7, or B-cell marker CD19). Crucial for identifying clonal populations.',
  'Clonality / Light Chain Restriction': 'Normal mature B-cell populations are polyclonal, expressing a mixture of Kappa and Lambda light chains (normal ratio ~1.4:1). A population expressing exclusively one light chain indicates a clonal expansion (monoclonal), characteristic of B-cell lymphoma.',

  // 2. ClearLLab 10C Panels / Tubes
  'B Cell Tube': 'A screening tube in the ClearLLab 10C panel designed to evaluate B-cell development, mature B-cell populations, and detect light chain restriction (Kappa/Lambda) to identify clonal B-cell neoplasms (e.g. CLL, Mantle Cell Lymphoma).',
  'T Cell Tube': 'A screening tube in the ClearLLab 10C panel designed to evaluate T-lymphocyte subsets (CD3, CD4, CD8, CD2, CD5, CD7, TCRγδ) and NK cells (CD56, CD16). Used to diagnose T-cell and NK-cell lymphomas.',
  'Myeloid M1 Tube': 'A ClearLLab panel tube focusing on maturing granulocytic, monocytic, and myeloid progenitor populations. Features markers CD11b, CD13, CD14, CD16, CD34, CD45, CD64, HLA-DR, and CD7.',
  'Myeloid M2 Tube': 'A complementary ClearLLab panel tube assessing early myeloid lineage antigens, myeloblasts, and monocytes. Features markers CD117, CD123, CD13, CD33, CD34, CD38, CD15, HLA-DR, CD19, and CD45.',

  // 3. Physical Parameters
  'FSC_A': 'Forward Scatter Area: Represents cell size. Larger cells yield higher FSC-A. Gated to separate cell events from small cellular debris.',
  'FSC_H': 'Forward Scatter Height: Combined with Forward Scatter Area (FSC-A) to perform doublet exclusion, as cell doublets show disproportionate area-to-height ratio.',
  'SSC_A': 'Side Scatter Area: Represents internal complexity and granularity. Granulocytes (high granularity) show high SSC-A; lymphocytes (low granularity) show low SSC-A.',
  'Time': 'Time Parameter: Monitors stability of fluidics during acquisition. Instabilities, clogs, or bubbles appear as gaps or spikes in event rate over time.',

  // 4. Leukemias and Lymphomas
  'Leukemia': 'A group of hematological cancers that usually begin in the bone marrow and result in high numbers of abnormal white blood cells (blasts or mature clonal cells). Divided into acute (rapidly progressive, blast-dominated) and chronic (slower, mature-cell-dominated) forms.',
  'Acute Myeloid Leukemia (AML)': 'A cancer of the myeloid line of blood cells, characterized by the rapid growth of abnormal myeloblasts that accumulate in the bone marrow and interfere with normal blood cell production.',
  'Acute B-Lymphoblastic Leukemia (Pre-B ALL)': 'A cancer of immature B-cell precursors (B-lymphoblasts). Highly positive for CD34, TdT, CD19, CD10, and cytCD79a.',
  'Acute T-Lymphoblastic Leukemia (T-ALL)': 'An aggressive cancer of immature T-cell precursors (T-lymphoblasts), often presenting with mediastinal masses. Characterized by cytoplasmic CD3 and CD7 expression.',
  'Chronic Lymphocytic Leukemia (CLL)': 'A mature B-cell neoplasm characterized by clonal accumulation of small, mature-appearing lymphocytes. Typically co-expresses CD5, CD19, CD20 (dim), CD23, and CD200.',
  'Mantle Cell Lymphoma (MCL)': 'A mature B-cell neoplasm characterized by t(11;14) translocation (cyclin D1 overexpression). CD5 positive but CD200 negative, which distinguishes it from CLL.',
  'Burkitt Lymphoma': 'A highly aggressive mature B-cell lymphoma characterized by t(8;14) MYC translocation. Lymphocytes express germinal center markers (CD10+) and monoclonal surface Ig, but are negative for immature markers (CD34-, TdT-).',
  'Auer Rods': 'Clumped needles of azurophilic granular material found in the cytoplasm of myeloblasts in AML, confirming myeloid origin under a microscope.',
  'Blast': 'An immature precursor cell (e.g. myeloblast, lymphoblast) that does not function properly. In acute leukemia, blasts are >=20% in bone marrow or blood.',

  // 5. CD Markers and Antigenic Indicators
  'CD2': 'CD2: Pan-T and NK-cell marker. Involved in T-cell activation and adhesion.',
  'CD3': 'CD3: Pan-T-cell backbone marker. Part of the T-cell receptor (TCR) complex, specific for mature T-lymphocytes.',
  'CD4': 'CD4: Marker for helper T-lymphocytes, and also expressed on monocytes/macrophages.',
  'CD5': 'CD5: T-cell marker. Also aberrantly expressed on B-cells in CLL and Mantle Cell Lymphoma.',
  'CD7': 'CD7: Early T-cell and NK-cell marker. Commonly aberrantly expressed on myeloblasts in AML.',
  'CD8': 'CD8: Marker for cytotoxic T-lymphocytes and NK-cell sub-populations.',
  'CD10': 'CD10 (CALLA): Common ALL Antigen. Expressed on B-cell progenitors, germinal center B-cells, and granulocytes.',
  'CD11b': 'CD11b: Myeloid marker. Expressed on mature granulocytes, monocytes, and NK cells.',
  'CD13': 'CD13: Myeloid lineage marker, expressed on myeloblasts, maturing granulocytes, and monocytes.',
  'CD14': 'CD14: High-affinity LPS receptor. Specific marker for mature monocytes.',
  'CD15': 'CD15: Granulocytic marker, acquired during maturing granulocytic stages.',
  'CD16': 'CD16: Fc receptor expressed strongly on mature granulocytes and NK-cells.',
  'CD19': 'CD19: Pan-B-cell backbone marker, expressed from earliest B-precursors until plasma cells.',
  'CD20': 'CD20: Mature B-cell marker, expressed on mature B-cells (lost on plasma cells).',
  'CD33': 'CD33: Pan-myeloid marker, strongly expressed on monocytes and myeloid progenitors.',
  'CD34': 'CD34: Early hematopoietic stem cell/progenitor marker. Positive in acute leukemia blasts; absent on mature cells.',
  'CD38': 'CD38: Activation marker. Expressed at high intensity on plasma cells and variably on progenitors.',
  'CD45': 'CD45: Leukocyte Common Antigen (LCA). Expressed on all white blood cells; standard gating marker.',
  'CD56': 'CD56 (NCAM): Primary marker for Natural Killer (NK) cells.',
  'CD64': 'CD64: High-affinity IgG receptor. Specific marker for monocytes and promyelocytes.',
  'CD117': 'CD117 (c-Kit): Stem cell factor receptor. Myeloid progenitor marker, crucial for AML diagnosis.',
  'CD123': 'CD123 (IL-3Rα): Expressed on early progenitors, basophils, plasmacytoid dendritic cells, and AML blasts.',
  'CD200': 'CD200: B-cell marker. Co-expressed in CLL (CD200+) but absent in MCL (CD200-).',
  'Kappa': 'Kappa (κ): Immunoglobulin light chain. Expressed on a subset of mature B-cells.',
  'Lambda': 'Lambda (λ): Immunoglobulin light chain. Expressed on a subset of mature B-cells.',
  'HLA_DR': 'HLA-DR: MHC Class II molecule, expressed on antigen-presenting cells (monocytes, B-cells) and early progenitors.',
  'TCR_gd': 'TCRγδ: Alternative T-cell receptor expressed on a minor subset of mature T-lymphocytes.'
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
    const val = e.target.value;
    loadCase(val);
    if (val === 'compare' && activeSidebarTab === 'simulator') {
      switchSidebarTab('gallery');
    }
  });
  
  document.getElementById('x-axis-select').addEventListener('change', (e) => {
    flowPlot.setAxes(e.target.value, flowPlot.yAxis);
    if (currentCase === 'compare' && flowPlotAML) {
      flowPlotAML.setAxes(e.target.value, flowPlotAML.yAxis);
    }
    buildGlossary();
  });
  
  document.getElementById('y-axis-select').addEventListener('change', (e) => {
    flowPlot.setAxes(flowPlot.xAxis, e.target.value);
    if (currentCase === 'compare' && flowPlotAML) {
      flowPlotAML.setAxes(flowPlotAML.xAxis, e.target.value);
    }
    buildGlossary();
  });
  
  document.getElementById('scale-select').addEventListener('change', (e) => {
    flowPlot.scaleType = e.target.value;
    flowPlot.draw();
    if (currentCase === 'compare' && flowPlotAML) {
      flowPlotAML.scaleType = e.target.value;
      flowPlotAML.draw();
    }
  });

  document.getElementById('glossary-filter-select').addEventListener('change', () => {
    buildGlossary();
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

  document.getElementById('tool-auto-btn').addEventListener('click', () => {
    toggleTool('auto');
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

  // 3D Explorer Zoom Buttons
  document.getElementById('zoom-in-btn').addEventListener('click', () => {
    zoomFactor = Math.min(2.5, zoomFactor + 0.15);
    updateZoomUI();
  });
  document.getElementById('zoom-out-btn').addEventListener('click', () => {
    zoomFactor = Math.max(0.4, zoomFactor - 0.15);
    updateZoomUI();
  });
  document.getElementById('zoom-reset-btn').addEventListener('click', () => {
    zoomFactor = 1.0;
    updateZoomUI();
  });

  // Custom events from FlowPlot
  document.addEventListener('flow-zoom-changed', (e) => {
    const { zoomX, zoomY } = e.detail;
    syncPlotsZoom(zoomX, zoomY);
  });

  document.addEventListener('flow-cell-clicked', (e) => {
    const { cell } = e.detail;
    let originCase = "Normal Case #1";
    if (currentCase === 'aml' || currentCase.startsWith('aml_m')) {
      originCase = CASES_INFO[currentCase] ? CASES_INFO[currentCase].title : "AML Patient Case";
    } else if (currentCase === 'compare') {
      if (flowPlotAML && flowPlotAML.hoveredCell === cell) {
        originCase = CASES_INFO[activeAmlCaseId] ? CASES_INFO[activeAmlCaseId].title : "AML Patient Case";
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

  // Floating Gating Tools Toolbar draggable and positioning
  const gatingToolbar = document.getElementById('floating-gating-toolbar');
  const gatingToolbarDragHandle = document.getElementById('gating-toolbar-drag-handle');
  if (gatingToolbar) {
    makeElementDraggable(gatingToolbar, gatingToolbarDragHandle);
    
    // Position toolbar on load and window resize
    setTimeout(positionGatingToolbar, 100);
    window.addEventListener('resize', () => {
      if (isFullscreenActive) {
        resizeCanvasForFullscreen();
      }
      positionGatingToolbar();
    });

    // Global and individual expand/fullscreen buttons
    const globalFullscreenBtn = document.getElementById('toggle-fullscreen-btn');
    if (globalFullscreenBtn) {
      globalFullscreenBtn.addEventListener('click', () => toggleFullscreen('both'));
    }
    const normalExpandBtn = document.getElementById('expand-btn-normal');
    if (normalExpandBtn) {
      normalExpandBtn.addEventListener('click', () => toggleFullscreen('normal'));
    }
    const amlExpandBtn = document.getElementById('expand-btn-aml');
    if (amlExpandBtn) {
      amlExpandBtn.addEventListener('click', () => toggleFullscreen('aml'));
    }
  }

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
      positionGatingToolbar();
      setTimeout(positionGatingToolbar, 310);
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

  document.addEventListener('flow-auto-gate-clicked', (e) => {
    const cand = e.detail;
    showGateModal({
      type: cand.type,
      xAttr: cand.xAttr,
      yAttr: cand.yAttr,
      points: cand.points,
      suggestedName: cand.name,
      desc: cand.desc,
      isAuto: true
    });
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
  buildOverallGlossary();

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
  if (isFullscreenActive) {
    exitFullscreen();
  }
  currentCase = caseId;
  if (caseId !== 'normal' && caseId !== 'compare') {
    activeAmlCaseId = caseId;
  }
  
  const plotsLayout = document.getElementById('plots-layout');
  const plotCardAml = document.getElementById('plot-card-aml');
  const plotTitleNormal = document.getElementById('plot-title-normal');
  
  if (caseId === 'compare') {
    // Show compare layout
    plotsLayout.style.flexDirection = 'row';
    plotCardAml.style.display = 'flex';
    plotTitleNormal.style.display = 'block';
    
    // Show compare target indicator
    const indicatorSeparator = document.querySelector('.floating-gating-toolbar .indicator-separator');
    const activeIndicator = document.getElementById('toolbar-active-indicator');
    if (indicatorSeparator) indicatorSeparator.style.display = 'block';
    if (activeIndicator) activeIndicator.style.display = 'block';
    
    showToast('Comparison Mode: You can draw different gates on each plot independently.');
    
    // Load both datasets
    normalEvents = FlowData.generateNormalCase();
    if (activeAmlCaseId === 'aml') {
      amlEvents = FlowData.generateAMLCase();
    } else {
      amlEvents = FlowData.generateAMLSubtypeCase(activeAmlCaseId);
    }
    caseEvents = normalEvents; // Fallback
    
    const info = CASES_INFO['compare'];
    document.getElementById('case-title').innerText = info.title;
    document.getElementById('case-subtitle').innerText = info.subtitle;
    document.getElementById('case-vignette').innerText = info.vignette;
    
    const amlInfo = CASES_INFO[activeAmlCaseId] || CASES_INFO['aml'];
    document.getElementById('plot-title-aml').innerText = amlInfo.title;
    
    // Clean gates and pre-populate standard gates for both independently
    activeGates = [];
    activeParentId = 'root';
    activeGatesAML = [];
    activeParentIdAML = 'root';
    
    // Create default root gates for Normal and AML (clean slate)
    activeGates = [
      { id: 'root', name: 'All Events', parent: null, xAttr: 'Time', yAttr: 'CD45', type: 'rect', points: [{x:0,y:0},{x:1000,y:1000}], color: '#94a3b8' }
    ];
    activeGatesAML = [
      { id: 'root', name: 'All Events', parent: null, xAttr: 'Time', yAttr: 'CD45', type: 'rect', points: [{x:0,y:0},{x:1000,y:1000}], color: '#94a3b8' }
    ];
    
    
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
    
    // Hide compare target indicator
    const indicatorSeparator = document.querySelector('.floating-gating-toolbar .indicator-separator');
    const activeIndicator = document.getElementById('toolbar-active-indicator');
    if (indicatorSeparator) indicatorSeparator.style.display = 'none';
    if (activeIndicator) activeIndicator.style.display = 'none';
    
    const info = CASES_INFO[caseId];
    document.getElementById('case-title').innerText = info.title;
    document.getElementById('case-subtitle').innerText = info.subtitle;
    document.getElementById('case-vignette').innerText = info.vignette;
    
    if (caseId === 'normal') {
      caseEvents = FlowData.generateNormalCase();
    } else if (caseId === 'aml') {
      caseEvents = FlowData.generateAMLCase();
    } else {
      caseEvents = FlowData.generateAMLSubtypeCase(caseId);
    }
    
    activeGates = [];
    activeParentId = 'root';
    createDefaultGates(caseId);
    
    const tutorialBox = document.getElementById('tutorial-container');
    const toggleSandboxBtn = document.getElementById('toggle-sandbox-btn');
    
    if (caseId.startsWith('aml_m')) {
      sandboxMode = true;
      tutorialBox.style.display = 'none';
      if (toggleSandboxBtn) {
        toggleSandboxBtn.style.display = 'none';
      }
      showToast(`Exploring ${info.title} in Sandbox Mode.`);
    } else {
      if (toggleSandboxBtn) {
        toggleSandboxBtn.style.display = 'inline-block';
      }
      if (toggleSandboxBtn) {
        if (sandboxMode) {
          toggleSandboxBtn.innerText = 'Exit Sandbox';
          toggleSandboxBtn.style.backgroundColor = 'var(--border-active)';
          toggleSandboxBtn.style.color = 'var(--bg-main)';
        } else {
          toggleSandboxBtn.innerText = 'Sandbox Mode';
          toggleSandboxBtn.style.backgroundColor = 'transparent';
          toggleSandboxBtn.style.color = 'var(--text-secondary)';
        }
      }
      
      if (!sandboxMode) {
        tutorialBox.style.display = 'flex';
      } else {
        tutorialBox.style.display = 'none';
      }
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
    TUTORIAL_STEPS = (caseId === 'aml' || caseId.startsWith('aml_m')) ? AML_TUTORIAL_STEPS : NORMAL_TUTORIAL_STEPS;
    currentTutorialStep = 0;
    if (!caseId.startsWith('aml_m')) {
      loadTutorialStep();
    }
  }
  
  syncWorkspace();
  
  // Reposition floating toolbar on layout structure changes
  setTimeout(positionGatingToolbar, 100);
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
    if (currentCase === 'compare' && flowPlotAML) {
      flowPlotAML.xAxis = selectedX;
      flowPlotAML.yAxis = selectedY;
    }
  }
  buildGlossary();
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
// Dynamic Suggestions Generator based on active cells captured
function getSuggestionsForGate(gate) {
  const currentPlot = (currentCase === 'compare' && activePlot === 'aml') ? flowPlotAML : flowPlot;
  if (!currentPlot) return { suggestions: [], description: 'Draw a gate to isolate a subset of cells for analysis.', count: 0, pct: '0' };
  
  const parentEvents = currentPlot.filteredEvents || [];
  const insideEvents = parentEvents.filter(e => currentPlot.isPointInGate(e, gate));
  
  const totalInside = insideEvents.length;
  const counts = {};
  insideEvents.forEach(e => {
    counts[e.type] = (counts[e.type] || 0) + 1;
  });
  
  const suggestions = [];
  let description = "Draw a gate to isolate a subset of cells for analysis.";
  
  const addSug = (name, desc) => {
    if (!suggestions.some(s => s.name.toLowerCase() === name.toLowerCase())) {
      suggestions.push({ name, desc });
    }
  };
  
  const axesKey = `${gate.xAttr}_${gate.yAttr}`;
  
  if (axesKey === 'FSC_A_FSC_H') {
    addSug('Singlets', 'Excludes doublets/aggregates by selecting cells with a linear area-to-height ratio.');
    addSug('Cells', 'Leukocyte viable cell cluster.');
    description = 'Excludes doublet cell aggregates or debris, selecting single cell events.';
  } else if (axesKey === 'FSC_A_SSC_A') {
    addSug('Cells', 'Selects viable leukocyte populations while excluding low-FSC cellular debris.');
    addSug('Singlets', 'Single cell events.');
    description = 'Isolates viable leukocyte populations and excludes low-FSC cellular debris.';
  } else if (axesKey === 'CD45_SSC_A') {
    const blastsCount = (counts['AML_Blast'] || 0) + (counts['NormalProgenitor'] || 0) + Object.keys(counts).filter(k => k.startsWith('AML_Blast_')).reduce((sum, k) => sum + counts[k], 0);
    const lymphsCount = (counts['CD4_TCell'] || 0) + (counts['CD8_TCell'] || 0) + (counts['gd_TCell'] || 0) + (counts['BCell'] || 0) + (counts['NKCell'] || 0);
    const monoCount = counts['Monocyte'] || 0;
    const granCount = counts['Granulocyte'] || 0;
    
    if (blastsCount > totalInside * 0.3) {
      addSug('Blasts', 'CD45-dim, SSC-low expanded progenitor population (classic leukemic blasts).');
      addSug('CD45dim', 'Dim CD45 positive blast/progenitor cells.');
    }
    if (lymphsCount > totalInside * 0.3) {
      addSug('Lymphocytes', 'CD45-bright, SSC-low population comprising T, B, and NK cells.');
    }
    if (monoCount > totalInside * 0.3) {
      addSug('Monocytes', 'CD45-bright, SSC-intermediate population expressing CD14/CD64.');
    }
    if (granCount > totalInside * 0.3) {
      addSug('Granulocytes', 'CD45-dim/moderate, SSC-high granulocytic myeloid subset.');
    }
    
    addSug('Lymphocytes', 'CD45-bright, SSC-low population comprising T, B, and NK cells.');
    addSug('Blasts', 'CD45-dim, SSC-low expanded progenitor population.');
    addSug('Monocytes', 'CD45-bright, SSC-intermediate population.');
    addSug('Granulocytes', 'CD45-dim/moderate, SSC-high granulocytic myeloid subset.');
    description = 'Leukocyte differential gating using CD45 expression and Side Scatter.';
  } else {
    const markers = [gate.xAttr, gate.yAttr];
    if (markers.includes('CD3')) {
      addSug('CD3+ T Cells', 'Pan-T cell population expressing CD3.');
    }
    if (markers.includes('CD4') && markers.includes('CD3')) {
      addSug('CD4+ Helper T Cells', 'CD4+ helper T-cells (CD3+ CD4+ CD8-).');
    }
    if (markers.includes('CD8') && markers.includes('CD3')) {
      addSug('CD8+ Cytotoxic T Cells', 'CD8+ cytotoxic T-cells (CD3+ CD8+ CD4-).');
    }
    if (markers.includes('CD19')) {
      addSug('B Cells', 'CD19+ B-lymphocyte lineage.');
    }
    if (markers.includes('CD20') && markers.includes('CD19')) {
      addSug('Mature B Cells', 'CD19+ CD20+ mature B cells.');
    }
    if (markers.includes('CD34') && markers.includes('CD117')) {
      addSug('CD34+ CD117+ Blasts', 'Myeloblasts co-expressing early progenitor CD34 and myeloid precursor CD117.');
    }
    if (markers.includes('CD33') && markers.includes('CD13')) {
      const hasSubtypeBlasts = Object.keys(counts).some(k => k === 'AML_Blast' || k.startsWith('AML_Blast_'));
      const totalBlasts = (counts['AML_Blast'] || 0) + Object.keys(counts).filter(k => k.startsWith('AML_Blast_')).reduce((sum, k) => sum + counts[k], 0);
      if (hasSubtypeBlasts && (totalBlasts > totalInside * 0.4)) {
        addSug('Aberrant Blasts', 'Myeloid blasts showing CD33 expression with aberrant loss of CD13.');
      } else {
        addSug('Normal Myeloid Progenitors', 'Normal myeloid progenitor subset co-expressing CD33 and CD13.');
      }
    }
    if (markers.includes('CD34') && markers.includes('CD7')) {
      addSug('Aberrant CD7+ Blasts', 'Early CD34+ blasts aberrantly expressing T-cell marker CD7.');
    }
    if (markers.includes('Kappa') || markers.includes('Lambda')) {
      addSug('Kappa B Cells', 'B-lymphocytes expressing Kappa light chains.');
      addSug('Lambda B Cells', 'B-lymphocytes expressing Lambda light chains.');
    }
    
    const cleanMarker = m => m.replace('_A', '').replace('_H', '');
    const labelX = cleanMarker(gate.xAttr);
    const labelY = cleanMarker(gate.yAttr);
    addSug(`${labelX}+ Cells`, `Population expressing positive levels of ${labelX}.`);
    addSug(`${labelY}+ Cells`, `Population expressing positive levels of ${labelY}.`);
    addSug(`${labelX}+ ${labelY}+ Cells`, `Double-positive population co-expressing ${labelX} and ${labelY}.`);
  }
  
  if (description === "Draw a gate to isolate a subset of cells for analysis." && suggestions.length > 0) {
    description = suggestions[0].desc;
  }
  
  const pct = parentEvents.length > 0 ? (totalInside / parentEvents.length * 100).toFixed(1) : '0';
  return { suggestions, description, count: totalInside, pct };
}

// Gate Naming Modal Control
function showGateModal(gateDetails) {
  currentCreatedPoints = gateDetails;
  
  const nameInput = document.getElementById('gate-name-input');
  const list = document.getElementById('gate-suggestions-list');
  const descPreview = document.getElementById('gate-desc-preview');
  const statsPreview = document.getElementById('gate-capture-stats');
  
  // Dynamic suggestions & stats evaluation
  const res = getSuggestionsForGate(gateDetails);
  
  // Set stats text
  statsPreview.innerText = `${res.count.toLocaleString()} cells (${res.pct}% of parent)`;
  
  // Suggest a default name
  let defaultValue = '';
  if (gateDetails.suggestedName) {
    defaultValue = gateDetails.suggestedName;
  } else if (!sandboxMode && TUTORIAL_STEPS[currentTutorialStep]) {
    defaultValue = TUTORIAL_STEPS[currentTutorialStep].gateName;
  } else if (res.suggestions.length > 0) {
    defaultValue = res.suggestions[0].name;
  }
  nameInput.value = defaultValue;
  
  // Render badge list
  list.innerHTML = '';
  res.suggestions.forEach(sug => {
    const badge = document.createElement('button');
    badge.className = 'gate-suggestion-badge';
    badge.innerText = sug.name;
    
    if (sug.name.toLowerCase() === defaultValue.toLowerCase()) {
      badge.classList.add('active');
      descPreview.innerText = sug.desc;
    }
    
    badge.addEventListener('click', (e) => {
      e.preventDefault();
      nameInput.value = sug.name;
      descPreview.innerText = sug.desc;
      document.querySelectorAll('.gate-suggestion-badge').forEach(b => b.classList.remove('active'));
      badge.classList.add('active');
    });
    list.appendChild(badge);
  });
  
  if (!descPreview.innerText || descPreview.innerText === '-') {
    descPreview.innerText = res.description;
  }
  
  // Highlighting active badge while typing custom names
  nameInput.oninput = () => {
    const val = nameInput.value.trim().toLowerCase();
    document.querySelectorAll('.gate-suggestion-badge').forEach(b => {
      if (b.innerText.toLowerCase() === val) {
        b.classList.add('active');
        const match = res.suggestions.find(s => s.name.toLowerCase() === val);
        if (match) descPreview.innerText = match.desc;
      } else {
        b.classList.remove('active');
      }
    });
  };
  
  document.getElementById('gate-name-modal-overlay').style.display = 'flex';
  nameInput.focus();
}

function hideGateModal() {
  document.getElementById('gate-name-modal-overlay').style.display = 'none';
  
  const currentPlot = (currentCase === 'compare' && activePlot === 'aml') ? flowPlotAML : flowPlot;
  const wasAuto = currentPlot && currentPlot.activeTool === 'auto';
  
  currentCreatedPoints = null;
  
  if (!wasAuto) {
    toggleTool(null);
  } else if (currentPlot) {
    currentPlot.draw();
  }
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
  if (!container) return;
  container.innerHTML = '';
  
  const filterSelect = document.getElementById('glossary-filter-select');
  const mode = filterSelect ? filterSelect.value : 'adaptive';
  
  if (mode === 'adaptive') {
    // Current Tube
    const tubeConfig = TUBE_CONFIGS[currentTube];
    const tubeDesc = TUBE_DESCRIPTIONS[currentTube] || 'No description available for this tube.';
    
    const tubeCard = document.createElement('div');
    tubeCard.className = 'glossary-tube-card glossary-fade-in';
    tubeCard.innerHTML = `
      <div class="glossary-tube-title">${tubeConfig.name}</div>
      <div class="glossary-tube-desc">${tubeDesc}</div>
    `;
    container.appendChild(tubeCard);
    
    // Active Axes
    const xAxisVal = flowPlot ? flowPlot.xAxis : tubeConfig.defaultX;
    const yAxisVal = flowPlot ? flowPlot.yAxis : tubeConfig.defaultY;
    
    const activeSectionTitle = document.createElement('div');
    activeSectionTitle.className = 'glossary-section-title glossary-fade-in';
    activeSectionTitle.textContent = 'Active Plot Parameters';
    container.appendChild(activeSectionTitle);
    
    // X Axis Item
    if (xAxisVal && MARKER_GLOSSARY[xAxisVal]) {
      const xItem = document.createElement('div');
      xItem.className = 'glossary-active-marker x-axis glossary-fade-in';
      xItem.innerHTML = `
        <div class="marker-name">${xAxisVal}<span class="axis-badge x-badge">X-Axis</span></div>
        <div style="color: var(--text-secondary); margin-top: 2px; line-height: 1.3;">${MARKER_GLOSSARY[xAxisVal]}</div>
      `;
      container.appendChild(xItem);
    }
    
    // Y Axis Item
    if (yAxisVal && MARKER_GLOSSARY[yAxisVal]) {
      const yItem = document.createElement('div');
      yItem.className = 'glossary-active-marker y-axis glossary-fade-in';
      yItem.innerHTML = `
        <div class="marker-name">${yAxisVal}<span class="axis-badge y-badge">Y-Axis</span></div>
        <div style="color: var(--text-secondary); margin-top: 2px; line-height: 1.3;">${MARKER_GLOSSARY[yAxisVal]}</div>
      `;
      container.appendChild(yItem);
    }
    
    // Other Markers in this Tube
    const otherMarkers = tubeConfig.markers.filter(m => m !== xAxisVal && m !== yAxisVal);
    if (otherMarkers.length > 0) {
      const otherSectionTitle = document.createElement('div');
      otherSectionTitle.className = 'glossary-section-title glossary-fade-in';
      otherSectionTitle.textContent = `Other markers in ${tubeConfig.name}`;
      container.appendChild(otherSectionTitle);
      
      otherMarkers.forEach(m => {
        if (MARKER_GLOSSARY[m]) {
          const item = document.createElement('div');
          item.className = 'marker-item glossary-fade-in';
          item.innerHTML = `
            <div class="marker-name" style="color: var(--text-primary); font-size: 11.5px;">${m}</div>
            <div style="color: var(--text-secondary); margin-top: 2px; line-height: 1.3;">${MARKER_GLOSSARY[m]}</div>
          `;
          container.appendChild(item);
        }
      });
    }
    
  } else {
    // Show All Mode
    
    // 1. ClearLLab 10C Tubes
    const tubesTitle = document.createElement('div');
    tubesTitle.className = 'glossary-section-title glossary-fade-in';
    tubesTitle.textContent = 'ClearLLab 10C Tubes';
    container.appendChild(tubesTitle);
    
    for (const [key, tubeConfig] of Object.entries(TUBE_CONFIGS)) {
      const tubeCard = document.createElement('div');
      tubeCard.className = 'glossary-tube-card glossary-fade-in';
      const isActive = currentTube === key;
      tubeCard.innerHTML = `
        <div class="glossary-tube-title">${tubeConfig.name} ${isActive ? '<span class="axis-badge x-badge" style="margin-left:6px;">Viewing</span>' : ''}</div>
        <div class="glossary-tube-desc">${TUBE_DESCRIPTIONS[key]}</div>
      `;
      container.appendChild(tubeCard);
    }
    
    // 2. Physical / Scatter Parameters
    const scatterTitle = document.createElement('div');
    scatterTitle.className = 'glossary-section-title glossary-fade-in';
    scatterTitle.textContent = 'Scatter & Time Parameters';
    container.appendChild(scatterTitle);
    
    const physicalKeys = ['FSC_A', 'FSC_H', 'SSC_A', 'Time'];
    physicalKeys.forEach(key => {
      if (MARKER_GLOSSARY[key]) {
        const item = document.createElement('div');
        item.className = 'marker-item glossary-fade-in';
        item.innerHTML = `
          <div class="marker-name">${key}</div>
          <div style="color: var(--text-secondary); margin-top: 2px; line-height: 1.3;">${MARKER_GLOSSARY[key]}</div>
        `;
        container.appendChild(item);
      }
    });
    
    // 3. Immunological Markers
    const immunTitle = document.createElement('div');
    immunTitle.className = 'glossary-section-title glossary-fade-in';
    immunTitle.textContent = 'Immunological Markers (CD & Light Chains)';
    container.appendChild(immunTitle);
    
    const markerKeys = Object.keys(MARKER_GLOSSARY)
      .filter(k => !physicalKeys.includes(k))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
      
    markerKeys.forEach(key => {
      const item = document.createElement('div');
      item.className = 'marker-item glossary-fade-in';
      item.innerHTML = `
        <div class="marker-name">${key}</div>
        <div style="color: var(--text-secondary); margin-top: 2px; line-height: 1.3;">${MARKER_GLOSSARY[key]}</div>
      `;
      container.appendChild(item);
    });
  }
}

// Overall Reference Glossary Builder (Fullscreen View)
function buildOverallGlossary() {
  const grid = document.getElementById('fullscreen-glossary-grid');
  if (!grid) return;
  grid.innerHTML = '';
  
  // Read search input value
  const searchInput = document.getElementById('fullscreen-glossary-search');
  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
  
  // Read active filter category tab
  const activeTab = document.querySelector('#fullscreen-glossary-filters .glossary-filter-tab.active');
  const categoryFilter = activeTab ? activeTab.getAttribute('data-filter') : 'all';
  
  // Define comprehensive dataset from all sources
  const dataset = [
    // 1. Gating & Flow Cytometry Basics (general)
    {
      category: 'general',
      term: 'Flow Cytometry',
      desc: 'A biophysical technology that collects, amplifies, and digitizes light scatter and fluorescence emissions from cells passing in a single-file fluid stream through a laser beam to analyze cellular characteristics.',
      details: 'Key parameters collected: Forward Scatter (FSC) representing cell size, Side Scatter (SSC) representing granularity, and fluorescence emissions representing specific antigen expression levels.'
    },
    {
      category: 'general',
      term: 'Immunophenotyping',
      desc: 'The analysis of heterogeneous cell populations to identify specific cell-surface and intracellular proteins (antigens) using fluorochrome-conjugated monoclonal antibodies.',
      details: 'Essential clinical tool for determining lineage (myeloid, B-cell, T-cell, etc.) and maturity of hematological neoplasms.'
    },
    {
      category: 'general',
      term: 'Gating',
      desc: 'The process of selecting a specific subset of events (cells) on a flow cytometry plot by drawing a boundary (gate) around them. Allows sequential analysis of target cell populations.',
      details: 'Used hierarchically to isolate cells, leukocytes, and eventually blasts or specific lineages from mature components.'
    },
    {
      category: 'general',
      term: 'Back-gating',
      desc: 'A validation technique where a gated cell population (e.g., CD45 dim blasts) is projected back onto previously drawn plots (e.g., FSC vs. SSC) to verify its scatter properties and check for contamination.',
      details: 'Ensures the gated population matches the expected physical morphology and does not overlap with mature cells.'
    },
    {
      category: 'general',
      term: 'Compensation',
      desc: 'The mathematical correction of fluorescence spillover, compensating for instances where one fluorochrome\'s emission wavelength overlaps into the detector channel of another.',
      details: 'Crucial in multicolor panels. Generate compensation matrices using single-stained capture beads or cell controls representing the brightest signals.'
    },
    {
      category: 'general',
      term: 'Fluorochrome',
      desc: 'A fluorescent chemical compound that can re-emit light upon laser excitation. Conjugated to monoclonal antibodies to label target cellular antigens.',
      details: 'Conjugations are selected by matching bright dyes (PE, APC) with dim antigens, and dimmer dyes (FITC, PacBlue) with bright antigens.'
    },
    {
      category: 'general',
      term: 'Fluorescence Minus One (FMO)',
      desc: 'A panel validation control containing all antibody conjugates except one. Used to identify the threshold of positive expression for dim or continuously expressed markers.',
      details: 'Mandatory in suspected APML (M3) panels to accurately resolve CD34 and HLA-DR gating boundaries.'
    },
    {
      category: 'general',
      term: 'Doublets / Aggregates',
      desc: 'Events where two or more cells pass through the interrogation point simultaneously, leading to false-positive scatter and fluorescence signals.',
      details: 'Excluded via singlet gating on FSC-A (Area) vs. FSC-H (Height) plots, where single cells line up strictly along the diagonal.'
    },
    {
      category: 'general',
      term: 'Debris / Dead Cells',
      desc: 'Non-viable cellular material, cell fragments, or platelets showing extremely low Forward Scatter (FSC) characteristics.',
      details: 'Gated out on FSC vs. SSC plots to prevent background staining and false gating of target leukocytes.'
    },
    {
      category: 'general',
      term: 'Lineage Fidelity',
      desc: 'The normal pattern where maturing cells express only those markers specific to their physiological cell lineage (e.g., lymphoblasts expressing only lymphoid markers).',
      details: 'Used to establish normal hematopoiesis. Deviations indicate myeloid or lymphoid neoplasms.'
    },
    {
      category: 'general',
      term: 'Lineage Infidelity (Aberrancy)',
      desc: 'The atypical expression of markers from an unrelated lineage on clonal cells (e.g., CD7 or CD19 on myeloid blasts, or CD117 on T-ALL cells).',
      details: 'Crucial for defining leukemia-associated immunophenotypes (LAIP) and tracking minimal residual disease (MRD).'
    },
    {
      category: 'general',
      term: 'Clonality / Light Chain Restriction',
      desc: 'The restriction of immunoglobulin expression in B-cells to either Kappa (κ) or Lambda (λ) light chains, indicating monoclonal B-cell origin.',
      details: 'Polyclonal B-cell populations show a normal κ:λ ratio of ~1.4:1. Restricted clonal expansions are characteristic of mature B-cell lymphomas.'
    },
    {
      category: 'general',
      term: 'Color Precedence Gating',
      desc: 'A visualization technique where gating software applies colors to cell events based on a predefined hierarchy, helping analyze overlapping populations.',
      details: 'Enables identification of blasts (purple), lymphocytes (red), monocytes (green), and granulocytes (blue) within mixed populations.'
    },

    // 2. ClearLLab Tubes (tubes)
    {
      category: 'tubes',
      term: 'B Cell Tube',
      desc: 'A screening tube in the ClearLLab 10C panel designed to evaluate B-cell development, mature B-cell populations, and detect B-lymphocyte clonality.',
      details: 'Markers: CD19, CD20, Kappa, Lambda, CD10, CD5, CD200, CD34, CD38. Differentiates CLL (CD5+ CD200+) from Mantle Cell Lymphoma (CD5+ CD200-).'
    },
    {
      category: 'tubes',
      term: 'T Cell Tube',
      desc: 'A screening tube in the ClearLLab 10C panel designed to evaluate T-lymphocyte subsets (CD3, CD4, CD8, CD2, CD5, CD7, TCRγδ) and NK cells (CD56, CD16).',
      details: 'Useful for diagnosing T-cell and NK-cell lymphomas, evaluating T-cell sub-populations (CD4/CD8 ratio), and lineage-specific gating.'
    },
    {
      category: 'tubes',
      term: 'Myeloid M1 Tube',
      desc: 'A ClearLLab panel tube focusing on maturing granulocytic, monocytic, and myeloid progenitor populations.',
      details: 'Markers: CD11b, CD13, CD14, CD16, CD34, CD45, CD64, HLA-DR, and CD7. Used to detect granulocytic anomalies and myeloid blasts.'
    },
    {
      category: 'tubes',
      term: 'Myeloid M2 Tube',
      desc: 'A complementary ClearLLab panel tube assessing early myeloid lineage antigens, myeloblasts, and monocytes.',
      details: 'Markers: CD117, CD123, CD13, CD33, CD34, CD38, CD15, HLA-DR, CD19, and CD45. Highly useful for classifying AML sub-populations and aberrancies.'
    },

    // 3. Scatter Parameters (scatter)
    {
      category: 'scatter',
      term: 'FSC-A (Forward Scatter Area)',
      desc: 'Light diffracted by a cell along the path of the laser beam. Proportional to the cell\'s size.',
      details: 'Used as the primary threshold parameter to separate single cells from cellular debris and platelets.'
    },
    {
      category: 'scatter',
      term: 'FSC-H (Forward Scatter Height)',
      desc: 'The peak height of the forward scatter voltage pulse.',
      details: 'Plotted against FSC-A (Area) to detect doublets, aggregates, and clumps of cells.'
    },
    {
      category: 'scatter',
      term: 'SSC-A (Side Scatter Area)',
      desc: 'Light scattered by a cell at a 90-degree angle from the laser beam. Proportional to internal complexity, granularity, and nuclear shape.',
      details: 'Differentiates lymphocytes (low SSC), monocytes (moderate SSC), and granulocytes (high SSC) in CD45 vs. SSC gating.'
    },
    {
      category: 'scatter',
      term: 'Time Parameter',
      desc: 'Tracks event rate over time during sample acquisition.',
      details: 'A flat line indicates stable fluidics. Interruptions, spikes, or gaps indicate pressure anomalies or clogs.'
    },

    // 4. Leukemias (leukaemia)
    {
      category: 'leukaemia',
      term: 'Acute Myeloid Leukemia (AML)',
      desc: 'A cancer of the myeloid blood cell line characterized by rapid growth of abnormal myeloblasts (>=20% in blood or marrow).',
      details: 'Presents with bone marrow failure symptoms. Flow cytometry is essential for lineage confirmation (MPO+, CD117+, CD33+, CD13+).'
    },
    {
      category: 'leukaemia',
      term: 'AML-M0 (Minimal Differentiation)',
      desc: 'FAB classification of myeloid leukemia with no morphological or cytochemical differentiation.',
      details: 'Blasts are cytochemically MPO-negative, but express myeloid lineage markers (CD117, CD33, CD13) and stem markers (CD34, HLA-DR).'
    },
    {
      category: 'leukaemia',
      term: 'AML-M1 (Without Maturation)',
      desc: 'FAB subtype showing early myeloblastic differentiation but no granulocytic maturation (CD15 negative).',
      details: 'Blasts are positive for CD34, CD117, HLA-DR, MPO (intracellular), CD33, and CD13.'
    },
    {
      category: 'leukaemia',
      term: 'AML-M2 (With Maturation)',
      desc: 'FAB subtype characterized by the presence of myeloblasts co-existing with maturing granulocytes (CD15+, CD11b+).',
      details: 'Frequently associated with the t(8;21) translocation. Blasts commonly express aberrant CD19.'
    },
    {
      category: 'leukaemia',
      term: 'AML-M3 (APL - Acute Promyelocytic Leukemia)',
      desc: 'A medical emergency characterized by t(15;17) PML-RARA fusion. Associated with severe DIC risk.',
      details: 'Flow signature is characteristically CD34 negative, HLA-DR negative, CD11b negative, MPO strongly positive, and CD33 homogeneously bright.'
    },
    {
      category: 'leukaemia',
      term: 'AML-M4 (Acute Myelomonocytic Leukemia)',
      desc: 'FAB subtype featuring a mixture of myeloblasts (CD34+) and monoblasts/monocytic cells (CD14+, CD64+, HLA-DR+++).',
      details: 'Often associated with inv(16) or t(16;16) abnormalities. CD11b and CD14 are acquired on mature monocytes.'
    },
    {
      category: 'leukaemia',
      term: 'AML-M5 (Acute Monocytic Leukemia)',
      desc: 'FAB subtype where monoblasts and promonocytes predominate, showing high side scatter and strong monocyte antigens.',
      details: 'Signature: CD33+++, HLA-DR+++, CD14+, CD64+, CD11b+, CD34+/- (often negative on mature monoblasts), MPO weak/absent.'
    },
    {
      category: 'leukaemia',
      term: 'AML-M6 (Acute Erythroid Leukemia)',
      desc: 'Rare FAB subtype characterized by erythroid progenitor proliferation.',
      details: 'Blasts are positive for Glycophorin A and CD71 (transferrin receptor), and negative for standard myeloid markers.'
    },
    {
      category: 'leukaemia',
      term: 'AML-M7 (Acute Megakaryoblastic Leukemia)',
      desc: 'FAB subtype defined by megakaryoblast proliferation.',
      details: 'Blasts express CD41 (GP IIb/IIIa) and CD61 (GP IIIa). Often associated with bone marrow fibrosis.'
    },
    {
      category: 'leukaemia',
      term: 'Acute B-Lymphoblastic Leukemia (Pre-B ALL)',
      desc: 'A clonal cancer of immature B-cell precursors (lymphoblasts).',
      details: 'Highly positive for CD34, TdT, CD19, CD10, and cytoplasmic CD79a. Negative for mature surface light chains.'
    },
    {
      category: 'leukaemia',
      term: 'Acute T-Lymphoblastic Leukemia (T-ALL)',
      desc: 'An aggressive precursor T-cell cancer, often presenting with high WBC count and a mediastinal mass.',
      details: 'Blasts express TdT, cytoplasmic CD3, CD7, and show variable co-expression of CD2, CD5, CD4, CD8, and CD1a.'
    },
    {
      category: 'leukaemia',
      term: 'Burkitt Lymphoma / Leukemia',
      desc: 'An aggressive mature B-cell neoplasm characterized by t(8;14) MYC translocation.',
      details: 'Signature: CD19+, CD20+, CD10+, CD34- (negative), TdT- (negative), and monoclonal surface light chain restriction.'
    },
    {
      category: 'leukaemia',
      term: 'Chronic Lymphocytic Leukemia (CLL)',
      desc: 'A mature B-cell leukemia defined by the accumulation of CD5+ CD19+ mature B-lymphocytes.',
      details: 'Co-expresses CD5, CD19, CD23, CD200, and dim CD20. Positive for light chain restriction (usually dim Kappa or Lambda).'
    },
    {
      category: 'leukaemia',
      term: 'Mantle Cell Lymphoma (MCL)',
      desc: 'A mature CD5+ CD19+ B-cell lymphoma characterized by t(11;14) yielding cyclin D1 overexpression.',
      details: 'Differentiated from CLL by being CD200 negative, CD23 negative/dim, and CD20 bright.'
    },
    {
      category: 'leukaemia',
      term: 'Blasts',
      desc: 'Immature hematopoietic precursor cells. In healthy marrow, blasts are <2-5%. In acute leukemia, blasts exceed 20%.',
      details: 'Characterized by dim CD45 and low side scatter. Best resolved using CD34, CD117, or TdT.'
    },
    {
      category: 'leukaemia',
      term: 'Auer Rods',
      desc: 'Needle-like cytoplasmic inclusions of fused primary granules found in myeloblasts.',
      details: 'Confirms myeloid lineage morphologically. Characteristically associated with AML (M1-M4) and strongly MPO positive.'
    },

    // 5. CD Markers (markers)
    {
      category: 'markers',
      term: 'CD2',
      desc: 'Pan-T and NK-cell marker. Adhesion molecule involved in antigen-presenting cell interaction.',
      details: 'Expressed on mature T-cells and NK-cells. Aberrantly expressed in monocytic AML (M4/M5) and APML (M3).'
    },
    {
      category: 'markers',
      term: 'CD3',
      desc: 'Pan-T-cell lineage marker. Forms the T-cell receptor (TCR) complex.',
      details: 'Specific for T-lymphocytes. Cytoplasmic CD3 is the first marker of T-cell commitment; surface CD3 marks maturity.'
    },
    {
      category: 'markers',
      term: 'CD4',
      desc: 'MHC Class II co-receptor. Helper T-cell marker.',
      details: 'Expressed on helper T lymphocytes, monocytes, macrophages, and plasmacytoid dendritic cells.'
    },
    {
      category: 'markers',
      term: 'CD5',
      desc: 'T-cell marker. Modulator of TCR/BCR signaling.',
      details: 'Expressed on all T-cells. Aberrantly co-expressed on B-cells in CLL and Mantle Cell Lymphoma.'
    },
    {
      category: 'markers',
      term: 'CD7',
      desc: 'Early T-cell and NK-cell marker. Expressed on T-cell precursors, mature T-cells, and NK cells.',
      details: 'Often aberrantly expressed on myeloblasts in AML (M0/M1/M2), indicating lineage infidelity.'
    },
    {
      category: 'markers',
      term: 'CD8',
      desc: 'MHC Class I co-receptor. Cytotoxic T-cell marker.',
      details: 'Expressed on cytotoxic T lymphocytes, NK cells, and subsets of gamma-delta T-cells.'
    },
    {
      category: 'markers',
      term: 'CD10',
      desc: 'Common ALL Antigen (CALLA). Neutral endopeptidase.',
      details: 'Expressed on early B-cell progenitors (hematogones), germinal center B-cells, follicular lymphomas, and granulocytes.'
    },
    {
      category: 'markers',
      term: 'CD11b',
      desc: 'Myeloid adhesion molecule. Integrin alpha M subunit.',
      details: 'Strongly expressed on neutrophils and monocytes. Acquired late in granulocyte maturation (promyelocyte to granulocyte).'
    },
    {
      category: 'markers',
      term: 'CD13',
      desc: 'Myeloid marker. Aminopeptidase N.',
      details: 'Expressed on myeloid progenitors, maturing granulocytes, and monocytes. Often dim/absent in abnormal myeloid blasts.'
    },
    {
      category: 'markers',
      term: 'CD14',
      desc: 'LPS receptor. Monocytic backbone marker.',
      details: 'Strongly expressed on mature monocytes. Absent on granulocytes and early blasts.'
    },
    {
      category: 'markers',
      term: 'CD15',
      desc: 'Granulocytic adhesion molecule (Lewis X antigen).',
      details: 'Strongly acquired during granulocytic maturation. Expressed on myelocytes, metamyelocytes, and granulocytes.'
    },
    {
      category: 'markers',
      term: 'CD16',
      desc: 'FcγRIII receptor. Low-affinity IgG receptor.',
      details: 'Expressed on mature granulocytes and NK-cells. CD16 levels drop in myelodysplastic syndromes (granulocyte dysplasia).'
    },
    {
      category: 'markers',
      term: 'CD19',
      desc: 'Pan-B-cell marker. Modulates B-cell receptor signaling.',
      details: 'Expressed throughout B-cell development. Lost on plasma cells. Aberrantly expressed in t(8;21) AML (FAB M2).'
    },
    {
      category: 'markers',
      term: 'CD20',
      desc: 'Mature B-cell marker. Calcium channel.',
      details: 'Expressed on B-cells from pre-B stage to mature B-cells (lost on plasma cells). Primary target for rituximab therapy.'
    },
    {
      category: 'markers',
      term: 'CD33',
      desc: 'Pan-myeloid marker. Sialic acid-binding lectin.',
      details: 'Strong on monocytes, moderate on maturing granulocytes and myeloblasts. Target for antibody-drug conjugates.'
    },
    {
      category: 'markers',
      term: 'CD34',
      desc: 'Early hematopoietic stem/progenitor cell marker.',
      details: 'Marks immature blasts in AML and ALL. Absent in APML (M3), mature leukemias, and mature monocytes.'
    },
    {
      category: 'markers',
      term: 'CD38',
      desc: 'Activation glycoprotein. NAD+ glycohydrolase.',
      details: 'Expressed widely on progenitors and activated cells. Extremely bright on plasma cells (myeloma marker).'
    },
    {
      category: 'markers',
      term: 'CD45',
      desc: 'Leukocyte Common Antigen (LCA). Protein tyrosine phosphatase.',
      details: 'Expressed on all WBCs. Plotted against SSC to differentiate lymphs (bright), monocytes (mod), and blasts (dim).'
    },
    {
      category: 'markers',
      term: 'CD56',
      desc: 'NCAM (Neural Cell Adhesion Molecule). Primary marker for NK cells.',
      details: 'Expressed on NK cells. Aberrantly expressed in AML and plasma cell myeloma (indicates adverse prognosis).'
    },
    {
      category: 'markers',
      term: 'CD64',
      desc: 'High-affinity IgG receptor.',
      details: 'Strongly expressed on monocytes and promyelocytes. Upregulated on granulocytes during systemic infection.'
    },
    {
      category: 'markers',
      term: 'CD117 (c-kit)',
      desc: 'Stem cell factor receptor. Receptor tyrosine kinase.',
      details: 'Expressed on early myeloid progenitors. Marker of myeloid blast commitment in AML. Absent on lymphoid blasts.'
    },
    {
      category: 'markers',
      term: 'CD123',
      desc: 'IL-3 Receptor alpha chain.',
      details: 'Expressed on plasmacytoid DCs, basophils, early myeloid progenitors, and aberrantly high on AML blasts.'
    },
    {
      category: 'markers',
      term: 'CD200',
      desc: 'OX-2 membrane glycoprotein. Immuno-regulatory marker.',
      details: 'Expressed on mature B-cells. Strongly positive in CLL but negative in Mantle Cell Lymphoma.'
    },
    {
      category: 'markers',
      term: 'Kappa (κ) Light Chain',
      desc: 'Immunoglobulin light chain component expressed on B-cell surface receptors.',
      details: 'Assessed alongside Lambda light chain. Normal B-cell pools show polyclonal κ and λ expression.'
    },
    {
      category: 'markers',
      term: 'Lambda (λ) Light Chain',
      desc: 'Immunoglobulin light chain component expressed on B-cell surface receptors.',
      details: 'Assessed alongside Kappa light chain to detect light chain restriction (monoclonality).'
    },
    {
      category: 'markers',
      term: 'HLA-DR',
      desc: 'MHC Class II antigen. Antigen presentation molecule.',
      details: 'Expressed on APCs, B-cells, and early progenitors. Characteristically negative in APML (AML-M3).'
    },
    {
      category: 'markers',
      term: 'TCRγδ',
      desc: 'Alternative T-cell receptor (gamma-delta heterodimer).',
      details: 'Expressed on a minor subset of mature T-lymphocytes, typically CD4- and CD8-.'
    },
    {
      category: 'markers',
      term: 'TdT',
      desc: 'Terminal Deoxynucleotidyl Transferase. Template-independent DNA polymerase.',
      details: 'Nuclear marker positive in lymphoblasts (ALL) and hematogones. Negative in mature B/T neoplasms and AML.'
    },

    // 6. Clinical SOPs (protocols)
    {
      category: 'protocols',
      term: 'Surface Membrane Staining (SLW)',
      desc: 'Standard staining protocol for surface markers (e.g. CD45, CD34, CD19) based on EuroFlow guidelines.',
      details: '1. Add surface antibodies to cell suspension. 2. Incubate 15 min at RT in the dark. 3. Lyse RBCs with FACS Lysing Solution. 4. Wash cell pellet with PBS-BSA buffer. 5. Resuspend for acquisition.'
    },
    {
      category: 'protocols',
      term: 'Combined Surface & Intracellular',
      desc: 'EuroFlow standardized protocol using Fix & Perm reagents to capture intracellular targets like myeloperoxidase (MPO) or cytoplasmic CD3/CD79a.',
      details: '1. Stain cell surface antigens and wash. 2. Resuspend pellet in Reagent A (Fixative), incubate 15 min. 3. Wash. 4. Resuspend pellet in Reagent B (Permeabilizer) + intracellular antibodies, incubate 15 min. 5. Wash and resuspend.'
    },
    {
      category: 'protocols',
      term: 'Nuclear TdT Staining Protocol',
      desc: 'SOP to stain nuclear Terminal Deoxynucleotidyl Transferase (TdT) in lymphoblast workups.',
      details: 'Stained as a surface wash protocol using FACS Lysing Solution and TdT antibody directly, avoiding Fix&Perm reagents to preserve forward/side scatter properties of delicate lymphoid blasts.'
    },
    {
      category: 'protocols',
      term: 'Sample Washing & Reconstitution SOP',
      desc: 'Standard washing protocol to remove soluble background proteins from peripheral blood and bone marrow prior to surface staining.',
      details: '1. Dispense 0.5 mL BM or 1.0 mL PB into a 75x12mm tube. 2. Top up with PBS pH 7.0. 3. Centrifuge at 3000 rpm for 3 mins. 4. Aspirate supernatant. 5. Repeat wash 3 times (total 4 washes). Note: CSF/fluids washed only once. 6. Reconstitute in 1.5 mL 22% BSA (BM), 1.0 mL 22% BSA (PB), or 200 µL PBS (CSF/fluids).<br><a href="file:///Users/jermin/Library/Mobile Documents/com~apple~CloudDocs/Education/CPD/Immunophenotyping/SOP_Sample_Preparation_and_Flow_Analysis.md" target="_blank" style="color:var(--accent-cyan); text-decoration:underline; font-weight:600; display:inline-block; margin-top:6px;">Open Full Sample Prep SOP (FFC-004)</a>'
    },
    {
      category: 'protocols',
      term: 'Hypercellular Sample Dilution SOP',
      desc: 'Calibration procedure for high white-cell-count samples to maintain an optimal acquisition rate of 500-1500 events/second.',
      details: '1. Run 100 µL washed/diluted sample on Navios (stop at 50,000 events) and measure acquisition time. 2. Calculate Rate = 50,000 / Acquisition Time. 3. If Rate > 1500, calculate Dilution Factor = Rate / 1000. (e.g., rate of 5000/sec = 1-in-5 dilution; dilute 500 µL washed sample with 2.0 mL BSA before staining).<br><a href="file:///Users/jermin/Library/Mobile Documents/com~apple~CloudDocs/Education/CPD/Immunophenotyping/SOP_Sample_Preparation_and_Flow_Analysis.md" target="_blank" style="color:var(--accent-cyan); text-decoration:underline; font-weight:600; display:inline-block; margin-top:6px;">Open Full Sample Prep SOP (FFC-004)</a>'
    },
    {
      category: 'protocols',
      term: 'APL (AML-M3) Medical Emergency SOP',
      desc: 'Maturation block at the promyelocyte stage presenting with severe DIC and clotting risk. Requires immediate ATRA treatment.',
      details: '1. Morphology: bi-lobed nuclei, heavy granules, Auer rod bundles ("fagot cells"). 2. Flow markers: characteristically HLA-DR negative, CD18 negative, CD11b negative. CD34 and CD117 are weak or negative. Variant M3 often aberrantly expresses CD2. 3. Confirm via t(15;17) FISH. **Do not delay ATRA therapy for flow confirmation.**<br><a href="file:///Users/jermin/Library/Mobile Documents/com~apple~CloudDocs/Education/CPD/Immunophenotyping/SOP_Immunophenotypic_Interpretation_Guide.md" target="_blank" style="color:var(--accent-cyan); text-decoration:underline; font-weight:600; display:inline-block; margin-top:6px;">Open Full Interpretation SOP (FFC-MP2-9)</a>'
    },
    {
      category: 'protocols',
      term: 'Myeloperoxidase (MPO) Verification SOP',
      desc: 'Dual-modality assessment of myeloperoxidase using cytochemistry slide staining and intracellular flow cytometry.',
      details: '1. Slide Cytochemistry: Stains brown, requires >=3% positive blasts under oil immersion. distorts morphology. 2. Flow MPO: Required if slide MPO is negative but myeloid lineage is suspected (e.g. primitive AML-M0). Flow MPO is reported quantitatively as a percentage of positive cells.<br><a href="file:///Users/jermin/Library/Mobile Documents/com~apple~CloudDocs/Education/CPD/Immunophenotyping/SOP_Immunophenotypic_Interpretation_Guide.md" target="_blank" style="color:var(--accent-cyan); text-decoration:underline; font-weight:600; display:inline-block; margin-top:6px;">Open Full Interpretation SOP (FFC-MP2-9)</a>'
    },
    {
      category: 'protocols',
      term: 'Dual Esterase Classification SOP',
      desc: 'Slide staining using Chloroacetate (Pink = myeloid) and Alpha-Napthyl (Black = monocytic) to differentiate AML subtypes.',
      details: 'Based on Alpha-Napthyl monocytic staining: 1. <20% monocytic cells = AML-M2 (with maturation). 2. 20-80% monocytic cells = AML-M4 (acute myelomonocytic). 3. >80% monocytic cells = AML-M5 (acute monocytic). CD14 is not reliable on monocytic blasts due to antigen shedding.<br><a href="file:///Users/jermin/Library/Mobile Documents/com~apple~CloudDocs/Education/CPD/Immunophenotyping/SOP_Immunophenotypic_Interpretation_Guide.md" target="_blank" style="color:var(--accent-cyan); text-decoration:underline; font-weight:600; display:inline-block; margin-top:6px;">Open Full Interpretation SOP (FFC-MP2-9)</a>'
    },
    {
      category: 'protocols',
      term: 'MDS Transformation Gating SOP',
      desc: 'Flow cytometric tracking of myelodysplastic syndrome (MDS) transforming into acute myeloid leukaemia.',
      details: 'MDS subtypes (RA, RARS, RAEB1, RAEB2, RAEB-T, CMML) are graded by marrow morphology, not flow. However, flow is used to track transformation. Aberrant expression of CD7 and CD56 on myeloblasts indicates poor prognosis. CD56 positivity on <5% blasts is a strong predictor of future transformation.<br><a href="file:///Users/jermin/Library/Mobile Documents/com~apple~CloudDocs/Education/CPD/Immunophenotyping/SOP_Immunophenotypic_Interpretation_Guide.md" target="_blank" style="color:var(--accent-cyan); text-decoration:underline; font-weight:600; display:inline-block; margin-top:6px;">Open Full Interpretation SOP (FFC-MP2-9)</a>'
    },
    {
      category: 'protocols',
      term: 'B-CLL vs Mantle Cell Lymphoma (MCL) SOP',
      desc: 'Immunophenotypic differentiation of clonal mature CD5+ B-lymphocytes.',
      details: '1. B-CLL: CD19+, CD5+, CD23+, FMC7- negative, CD20/CD22 weak, surface Kappa/Lambda negative or weak (intracellular restriction). Smudge cells common. 2. MCL: CD19+, CD5+, CD23- negative, FMC7+ positive, CD20/CD22 bright, and surface Kappa/Lambda strongly restricted. Histology confirms Cyclin D-1 positive.<br><a href="file:///Users/jermin/Library/Mobile Documents/com~apple~CloudDocs/Education/CPD/Immunophenotyping/SOP_Immunophenotypic_Interpretation_Guide.md" target="_blank" style="color:var(--accent-cyan); text-decoration:underline; font-weight:600; display:inline-block; margin-top:6px;">Open Full Interpretation SOP (FFC-MP2-9)</a>'
    },
    {
      category: 'protocols',
      term: 'B-PLL Diagnostic Criteria SOP',
      desc: 'Gating and threshold criteria for B-Prolymphocytic Leukaemia.',
      details: '1. Clinical: Extreme lymphocytosis (WBC > 100 x 10^9/L). 2. Morphology: Mature prolymphocytes with prominent nucleoli must be >55% of blood lymphocytes. 3. Phenotype: CD19+, CD5+, CD23+, CD20/CD22 strong, and surface light chains strongly restricted (similar to MCL, but distinguished by prolymphocyte count and WBC).<br><a href="file:///Users/jermin/Library/Mobile Documents/com~apple~CloudDocs/Education/CPD/Immunophenotyping/SOP_Immunophenotypic_Interpretation_Guide.md" target="_blank" style="color:var(--accent-cyan); text-decoration:underline; font-weight:600; display:inline-block; margin-top:6px;">Open Full Interpretation SOP (FFC-MP2-9)</a>'
    },
    {
      category: 'protocols',
      term: 'Hairy Cell Leukaemia (HCL) vs SLVL SOP',
      desc: 'Differentiating CD103+ mature splenic B-cell lymphomas.',
      details: '1. HCL: Pancytopenia, dry marrow tap, hairy cytoplasmic projections. Phenotype: CD19+, CD20+, CD22+, CD103+, and CD25+ positive (indicates cell activation). 2. SLVL: Bipolar collect of cytoplasm ("flying saucer"). Phenotype: CD19+, CD20+, CD22+, CD103+, CD25- negative, and CD43+ positive.<br><a href="file:///Users/jermin/Library/Mobile Documents/com~apple~CloudDocs/Education/CPD/Immunophenotyping/SOP_Immunophenotypic_Interpretation_Guide.md" target="_blank" style="color:var(--accent-cyan); text-decoration:underline; font-weight:600; display:inline-block; margin-top:6px;">Open Full Interpretation SOP (FFC-MP2-9)</a>'
    },
    {
      category: 'protocols',
      term: 'Urgent Out-of-Hours (OOH) SLA Rota',
      desc: 'SOP governing weekend and holiday call-out procedures for the SIHMDS flow lab.',
      details: '1. Rota covers Saturdays, Sundays, and Bank Holidays (9am-3pm). 2. Limited to bone marrow samples from new, undiagnosed acute leukaemias (no chronic, MRD, or fluids). 3. Process all 5 acute tubes. 4. Track and dispatch cytogenetics (Level 6) and molecular (Level 5, urgent yellow sticker).<br><a href="file:///Users/jermin/Library/Mobile Documents/com~apple~CloudDocs/Education/CPD/Immunophenotyping/SOP_Sample_Preparation_and_Flow_Analysis.md" target="_blank" style="color:var(--accent-cyan); text-decoration:underline; font-weight:600; display:inline-block; margin-top:6px;">Open Full Sample Prep SOP (FFC-004)</a>'
    },
    {
      category: 'protocols',
      term: 'Navios Operational Gating & Safety warnings',
      desc: 'Critical controls for running tubes on the Beckman Coulter Navios cytometer.',
      details: '1. Gating: Exclude doublets via FSC-Peak vs FSC-Integral singlet gate. Plot CD45 vs SS on single cells to isolate blasts (dim CD45, low/mid SS). 2. Non-specific binding: Check CD19 vs CD3 (EVMO gate) for dual-positives. 3. Safety: If **Drip Level Warning** sounds, stop analysis immediately to avoid aborting the tube.<br><a href="file:///Users/jermin/Library/Mobile Documents/com~apple~CloudDocs/Education/CPD/Immunophenotyping/SOP_Sample_Preparation_and_Flow_Analysis.md" target="_blank" style="color:var(--accent-cyan); text-decoration:underline; font-weight:600; display:inline-block; margin-top:6px;">Open Full Sample Prep SOP (FFC-004)</a>'
    }
  ];
  
  // Filter dataset by search input query
  let filtered = dataset;
  if (query) {
    filtered = filtered.filter(item => 
      item.term.toLowerCase().includes(query) || 
      item.desc.toLowerCase().includes(query) ||
      (item.details && item.details.toLowerCase().includes(query))
    );
  }
  
  // Filter dataset by active category
  if (categoryFilter !== 'all') {
    filtered = filtered.filter(item => item.category === categoryFilter);
  }
  
  // Update counter label
  const countLabel = document.getElementById('overall-glossary-count');
  if (countLabel) {
    countLabel.textContent = `Showing ${filtered.length} of ${dataset.length} terms`;
  }
  
  // Sort alphabetically by term
  filtered.sort((a, b) => a.term.localeCompare(b.term, undefined, { numeric: true, sensitivity: 'base' }));
  
  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="glossary-fade-in" style="grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; color: var(--text-muted); text-align: center; gap: 8px;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <div style="font-size: 13.5px; font-weight: 600; color: var(--text-secondary);">No matching terms found</div>
        <div style="font-size: 11.5px;">Try refining your query or selecting a different category.</div>
      </div>
    `;
    return;
  }
  
  // Render cards
  filtered.forEach(item => {
    const card = document.createElement('div');
    card.className = 'glossary-card glossary-fade-in';
    
    // Get category meta details
    const meta = getCategoryMeta(item.category);
    
    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 8px;">
        <h3 style="margin: 0; font-size: 14.5px; font-weight: 700; color: ${meta.color};">${item.term}</h3>
        <span style="font-size: 8.5px; font-weight: 800; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; background: ${meta.bg}; color: ${meta.color}; border: 1.2px solid ${meta.border}; letter-spacing: 0.3px; white-space: nowrap;">
          ${meta.label}
        </span>
      </div>
      <p style="margin: 0; font-size: 12px; line-height: 1.45; color: var(--text-primary); font-weight: 400; flex: 1;">
        ${item.desc}
      </p>
      ${item.details ? `
        <div style="margin-top: 6px; border-top: 1px dashed rgba(255, 255, 255, 0.05); padding-top: 6px; font-size: 11px; line-height: 1.4; color: var(--text-secondary); font-weight: 400;">
          ${item.details}
        </div>
      ` : ''}
    `;
    
    grid.appendChild(card);
  });
}

// Category Meta Helper for Card Styling
function getCategoryMeta(cat) {
  switch(cat) {
    case 'general': return { label: 'Gating & Basics', color: 'var(--accent-blue)', bg: 'rgba(33, 150, 243, 0.12)', border: 'rgba(33, 150, 243, 0.2)' };
    case 'tubes': return { label: 'ClearLLab Tubes', color: 'var(--accent-green)', bg: 'rgba(76, 175, 80, 0.12)', border: 'rgba(76, 175, 80, 0.2)' };
    case 'scatter': return { label: 'Scatter Params', color: 'var(--accent-orange)', bg: 'rgba(255, 152, 0, 0.12)', border: 'rgba(255, 152, 0, 0.2)' };
    case 'leukaemia': return { label: 'Leukemias', color: 'var(--accent-red)', bg: 'rgba(255, 42, 42, 0.12)', border: 'rgba(255, 42, 42, 0.2)' };
    case 'markers': return { label: 'CD Markers', color: 'var(--accent-cyan)', bg: 'rgba(0, 229, 255, 0.12)', border: 'rgba(0, 229, 255, 0.2)' };
    case 'protocols': return { label: 'SOP Protocols', color: 'var(--accent-purple)', bg: 'rgba(224, 64, 251, 0.12)', border: 'rgba(224, 64, 251, 0.2)' };
    default: return { label: 'Reference', color: 'var(--text-secondary)', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)' };
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
let leukaemiaViewMode = localStorage.getItem('flow-leukaemia-view-mode') || 'fullpage';

function updateLeukaemiaLayout() {
  const workspace = document.querySelector('.workspace');
  if (!workspace) return;
  
  if (sidebarExpanded && activeSidebarTab === 'leukaemia' && leukaemiaViewMode === 'fullpage') {
    workspace.classList.add('leukaemia-fullpage-active');
  } else {
    workspace.classList.remove('leukaemia-fullpage-active');
  }
  
  // Update the button UI inside leukaemia header
  const layoutBtn = document.getElementById('leukaemia-layout-btn');
  if (layoutBtn) {
    const isFullPage = workspace.classList.contains('leukaemia-fullpage-active');
    const span = layoutBtn.querySelector('span');
    const svg = layoutBtn.querySelector('svg');
    
    if (isFullPage) {
      if (span) span.textContent = 'Dock to Sidebar';
      if (svg) {
        svg.innerHTML = '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line>';
      }
      layoutBtn.title = 'Dock Leukaemia Reference to Left Sidebar';
    } else {
      if (span) span.textContent = 'Expand to Full Page';
      if (svg) {
        svg.innerHTML = '<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>';
      }
      layoutBtn.title = 'Expand Leukaemia Reference to Full Page';
    }
  }
}

function toggleLeukaemiaViewMode() {
  leukaemiaViewMode = (leukaemiaViewMode === 'fullpage') ? 'sidebar' : 'fullpage';
  localStorage.setItem('flow-leukaemia-view-mode', leukaemiaViewMode);
  
  if (leukaemiaViewMode === 'sidebar') {
    // If switching to sidebar mode, make sure the sidebar is open
    sidebarExpanded = true;
    const sidebar = document.getElementById('left-sidebar');
    if (sidebar) sidebar.classList.remove('collapsed');
    const resizer = document.getElementById('sidebar-resizer');
    if (resizer) resizer.style.display = 'block';
  }
  
  updateLeukaemiaLayout();
  updateTabButtons();
  
  if (typeof positionGatingToolbar === 'function') {
    positionGatingToolbar();
  }
}

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
  const closeSimBtn = document.getElementById('close-sidebar-btn-simulator');
  if (closeSimBtn) closeSimBtn.addEventListener('click', () => toggleSidebar(false));
  const closeLeukaemiaBtn = document.getElementById('close-sidebar-btn-leukaemia');
  if (closeLeukaemiaBtn) closeLeukaemiaBtn.addEventListener('click', () => toggleSidebar(false));
  const closeOverallGlossaryBtn = document.getElementById('close-sidebar-btn-overall-glossary');
  if (closeOverallGlossaryBtn) closeOverallGlossaryBtn.addEventListener('click', () => toggleSidebar(false));
  const closeFullscreenGlossaryBtn = document.getElementById('close-fullscreen-glossary');
  if (closeFullscreenGlossaryBtn) {
    closeFullscreenGlossaryBtn.addEventListener('click', () => {
      switchSidebarTab('gallery');
    });
  }

  // Fullscreen Glossary Search
  const fullscreenSearch = document.getElementById('fullscreen-glossary-search');
  if (fullscreenSearch) {
    fullscreenSearch.addEventListener('input', () => {
      buildOverallGlossary();
    });
  }

  // Fullscreen Glossary Filter Tabs
  const filterTabs = document.querySelectorAll('#fullscreen-glossary-filters .glossary-filter-tab');
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      const filterVal = tab.getAttribute('data-filter');
      
      // Sync sidebar buttons
      const sidebarBtns = document.querySelectorAll('.sidebar-glossary-nav-btn');
      sidebarBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-target') === filterVal) {
          btn.classList.add('active');
        }
      });
      
      buildOverallGlossary();
    });
  });

  // Sidebar Glossary Navigation Buttons
  const sidebarNavBtns = document.querySelectorAll('.sidebar-glossary-nav-btn');
  sidebarNavBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sidebarNavBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const targetVal = btn.getAttribute('data-target');
      
      // Sync fullscreen filter tabs
      const fullTabs = document.querySelectorAll('#fullscreen-glossary-filters .glossary-filter-tab');
      fullTabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-filter') === targetVal) {
          tab.classList.add('active');
        }
      });
      
      buildOverallGlossary();
    });
  });
  
  // Layout toggle button in leukaemia header
  const leukaemiaLayoutBtn = document.getElementById('leukaemia-layout-btn');
  if (leukaemiaLayoutBtn) {
    leukaemiaLayoutBtn.addEventListener('click', toggleLeukaemiaViewMode);
  }
  
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
  updateLeukaemiaLayout();
  
  // Toggle main views for Simulator on load
  const simView = document.getElementById('cytometer-simulator-view');
  const plotContainer = document.querySelector('.plot-container');
  const rightPanel = document.getElementById('right-panel');
  const toggleRightBtn = document.getElementById('toggle-right-panel-btn');
  
  if (activeSidebarTab === 'simulator') {
    if (plotContainer) plotContainer.style.display = 'none';
    if (rightPanel) rightPanel.style.display = 'none';
    if (toggleRightBtn) toggleRightBtn.style.display = 'none';
    if (typeof openFlowSimulatorPage === 'function') {
      openFlowSimulatorPage(currentCase);
    }
  } else {
    if (simView) simView.style.display = 'none';
    if (plotContainer) plotContainer.style.display = '';
    if (rightPanel) rightPanel.style.display = '';
    if (toggleRightBtn) toggleRightBtn.style.display = '';
  }
}

function switchSidebarTab(tabId) {
  const sidebar = document.getElementById('left-sidebar');
  const resizer = document.getElementById('sidebar-resizer');
  
  const isCollapsed = !sidebarExpanded || (sidebar && sidebar.classList.contains('collapsed'));
  
  // Clicking the active tab collapses it, EXCEPT for overall-glossary which is always fullscreen/collapsed
  if (activeSidebarTab === tabId && tabId !== 'overall-glossary') {
    if (!isCollapsed) {
      toggleSidebar(false);
      return;
    }
  }
  
  activeSidebarTab = tabId;
  localStorage.setItem('flow-sidebar-active-tab', tabId);
  
  // Toggle active content divs
  document.querySelectorAll('.sidebar-tab-content').forEach(el => {
    el.classList.remove('active');
  });
  const activeContent = document.getElementById(`sidebar-tab-${tabId}`);
  if (activeContent) activeContent.classList.add('active');
  
  // Toggle main views for Simulator vs Glossary vs Plots
  const simView = document.getElementById('cytometer-simulator-view');
  const glossaryView = document.getElementById('overall-glossary-view');
  const plotContainer = document.querySelector('.plot-container');
  const rightPanel = document.getElementById('right-panel');
  const toggleRightBtn = document.getElementById('toggle-right-panel-btn');
  
  if (tabId === 'overall-glossary') {
    // For overall glossary, collapse the left sidebar panel completely
    if (sidebar) sidebar.classList.add('collapsed');
    if (resizer) resizer.style.display = 'none';
    sidebarExpanded = false;
    
    if (simView) simView.style.display = 'none';
    if (plotContainer) plotContainer.style.display = 'none';
    if (rightPanel) rightPanel.style.display = 'none';
    if (toggleRightBtn) toggleRightBtn.style.display = 'none';
    if (glossaryView) glossaryView.style.display = 'flex';
    
    // Stop simulation when switching away
    if (typeof flowCytometerSim !== 'undefined' && flowCytometerSim) {
      flowCytometerSim.stopSimulation();
    }
    
    buildOverallGlossary();
  } else {
    // Switch to target tab and ensure sidebar is expanded
    sidebarExpanded = true;
    localStorage.setItem('flow-sidebar-expanded', 'true');
    if (sidebar) sidebar.classList.remove('collapsed');
    if (resizer) resizer.style.display = 'block';
    
    if (tabId === 'simulator') {
      if (plotContainer) plotContainer.style.display = 'none';
      if (rightPanel) rightPanel.style.display = 'none';
      if (toggleRightBtn) toggleRightBtn.style.display = 'none';
      if (glossaryView) glossaryView.style.display = 'none';
      
      // Open simulator page
      if (typeof openFlowSimulatorPage === 'function') {
        openFlowSimulatorPage(currentCase);
      }
    } else {
      if (simView) simView.style.display = 'none';
      if (glossaryView) glossaryView.style.display = 'none';
      if (plotContainer) plotContainer.style.display = '';
      if (rightPanel) rightPanel.style.display = '';
      if (toggleRightBtn) toggleRightBtn.style.display = '';
      
      // Stop simulation when switching away
      if (typeof flowCytometerSim !== 'undefined' && flowCytometerSim) {
        flowCytometerSim.stopSimulation();
      }
    }
  }
  
  updateTabButtons();
  updateLeukaemiaLayout();
  
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
  
  if (activeSidebarTab === 'overall-glossary') {
    switchSidebarTab('gallery');
    return;
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
  updateLeukaemiaLayout();
  positionGatingToolbar();
  setTimeout(positionGatingToolbar, 310);
}

function updateTabButtons() {
  document.querySelectorAll('.vertical-tab-btn').forEach(btn => {
    btn.classList.remove('active');
    const tab = btn.getAttribute('data-tab');
    if ((sidebarExpanded || tab === 'overall-glossary') && tab === activeSidebarTab) {
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
    
    // Update gating toolbar position dynamically
    positionGatingToolbar();
  }
  
  function stopDrag(e) {
    document.documentElement.removeEventListener('mousemove', doDrag);
    document.documentElement.removeEventListener('mouseup', stopDrag);
    resizer.classList.remove('resizing');
    positionGatingToolbar();
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
    positionGatingToolbar();
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
  if (currentCase === 'compare' && flowPlotAML) {
    flowPlotAML.xAxis = figConfig.x;
    flowPlotAML.yAxis = figConfig.y;
  }
  
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
  buildGlossary();
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
    elmnt.classList.add('dragging');
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
    elmnt.dataset.dragged = "true";
  }

  function closeDragElement() {
    elmnt.classList.remove('dragging');
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
  
  // Update toolbar active target text & color
  const activeText = document.getElementById('toolbar-active-text');
  if (activeText) {
    if (plotId === 'normal') {
      activeText.textContent = 'Normal';
      activeText.style.color = 'var(--border-active)'; // cyan
    } else {
      activeText.textContent = 'AML';
      activeText.style.color = 'var(--accent-orange)'; // orange
    }
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

// data.js labels AML events with FAB subtypes (AML_Blast_M0 … AML_Blast_M7).
// Without entries for those, the explorer fell through to the Debris record and
// showed every subtype blast as "Non-Cellular Debris". Phenotypes below follow
// the subtype table in leukaemia-reference.js.
(() => {
  const m = (label, expression, color, info) => ({ label, expression, color, info });
  const CD45_BLAST = m('CD45 (Leukocyte Common Antigen)', 'Dim', '#f8fafc',
    'Dim expression places these cells in the "blast gate" on a CD45 vs SSC plot.');

  const subtypes = {
    AML_Blast_M0: {
      name: 'AML-M0 Myeloblast',
      lineage: 'AML with Minimal Differentiation',
      desc: 'Undifferentiated myeloblasts showing no morphological myeloid maturation and cytochemically negative myeloperoxidase. Diagnosis rests on flow cytometry demonstrating myeloid antigens, frequently with aberrant lymphoid marker expression.',
      markers: {
        CD45: CD45_BLAST,
        CD34: m('CD34 Sialomucin', 'Bright', '#ff9800', 'Stem/progenitor glycoprotein, consistently expressed in M0.'),
        CD117: m('CD117 (c-kit Receptor)', 'Bright', '#ff2a2a', 'Stem cell factor receptor confirming myeloid precursor origin.'),
        CD13: m('CD13 (Aminopeptidase N)', 'Bright', '#2196f3', 'Pan-myeloid metalloprotease, positive despite the absence of maturation.'),
        CD33: m('CD33 (Siglec-3)', 'Moderate', '#00e5ff', 'Variable (+/-) in M0.'),
        HLA_DR: m('HLA-DR (MHC Class II)', 'Bright', '#4caf50', 'Expressed on undifferentiated myeloblasts.'),
        CD7: m('CD7 Glycoprotein', 'Dim', '#2196f3', 'Aberrant lymphoid antigen commonly co-expressed in M0.')
      }
    },
    AML_Blast_M1: {
      name: 'AML-M1 Myeloblast',
      lineage: 'AML without Maturation',
      desc: 'Myeloblasts with minimal maturation. Distinguished from M0 by myeloperoxidase positivity on flow cytometry or cytochemistry, while remaining CD34+, CD117+ and HLA-DR+.',
      markers: {
        CD45: CD45_BLAST,
        CD34: m('CD34 Sialomucin', 'Bright', '#ff9800', 'Progenitor marker retained in M1.'),
        CD117: m('CD117 (c-kit Receptor)', 'Bright', '#ff2a2a', 'Myeloid precursor receptor tyrosine kinase.'),
        CD13: m('CD13 (Aminopeptidase N)', 'Bright', '#2196f3', 'Pan-myeloid marker.'),
        CD33: m('CD33 (Siglec-3)', 'Bright', '#00e5ff', 'Myeloid sialic acid-binding lectin.'),
        HLA_DR: m('HLA-DR (MHC Class II)', 'Bright', '#4caf50', 'Positive in M1, in contrast to M3.'),
        CD38: m('CD38 Ectoenzyme', 'Bright', '#e040fb', 'Widely expressed on immature leukaemic blasts.')
      }
    },
    AML_Blast_M2: {
      name: 'AML-M2 Myeloblast',
      lineage: 'AML with Maturation',
      desc: 'Myeloblastic leukaemia showing maturation beyond the promyelocyte stage, frequently carrying t(8;21) RUNX1-RUNX1T1. Auer rods are common and aberrant CD19 or CD56 co-expression is characteristic of the t(8;21) subtype.',
      markers: {
        CD45: CD45_BLAST,
        CD34: m('CD34 Sialomucin', 'Bright', '#ff9800', 'Positive; often co-expressed with maturation markers.'),
        CD117: m('CD117 (c-kit Receptor)', 'Bright', '#ff2a2a', 'Myeloid precursor marker.'),
        CD13: m('CD13 (Aminopeptidase N)', 'Bright', '#2196f3', 'Pan-myeloid metalloprotease.'),
        CD33: m('CD33 (Siglec-3)', 'Bright', '#00e5ff', 'Myeloid lectin.'),
        HLA_DR: m('HLA-DR (MHC Class II)', 'Bright', '#4caf50', 'Typically positive.'),
        CD15: m('CD15 (Lewis X Carbohydrate)', 'Moderate', '#ff9800', 'Reflects granulocytic maturation in this subtype.'),
        CD19: m('CD19 Co-Receptor', 'Dim', '#e040fb', 'Aberrant B-lineage antigen classically associated with t(8;21).')
      }
    },
    AML_Blast_M2_Maturing: {
      name: 'AML-M2 Maturing Myeloid Cell',
      lineage: 'AML with Maturation / Maturing Compartment',
      desc: 'The maturing granulocytic compartment seen alongside blasts in M2. These cells acquire CD15 and CD11b while progressively losing CD34 and CD117, producing the characteristic maturation "tail" on the CD45 vs SSC plot.',
      markers: {
        CD45: m('CD45 (Leukocyte Common Antigen)', 'Moderate', '#f8fafc', 'Brighter than the blast compartment as maturation proceeds.'),
        CD13: m('CD13 (Aminopeptidase N)', 'Bright', '#2196f3', 'Retained through granulocytic maturation.'),
        CD33: m('CD33 (Siglec-3)', 'Moderate', '#00e5ff', 'Downregulated relative to blasts.'),
        CD15: m('CD15 (Lewis X Carbohydrate)', 'Bright', '#ff9800', 'Acquired with granulocytic maturation.'),
        CD11b: m('CD11b (Mac-1)', 'Moderate', '#e040fb', 'Appears at later maturation stages.'),
        CD117: m('CD117 (c-kit Receptor)', 'Dim', '#ff2a2a', 'Progressively lost as cells mature.')
      }
    },
    AML_Blast_M3: {
      name: 'AML-M3 Abnormal Promyelocyte (APL)',
      lineage: 'Acute Promyelocytic Leukaemia',
      desc: 'Hypergranular abnormal promyelocytes carrying t(15;17) PML-RARA. The classic flow signature is CD34-negative and HLA-DR-negative with intense CD33 and CD13, high side scatter from dense granulation, and bundles of Auer rods ("faggot cells"). Presents with severe DIC and is a haematological emergency.',
      markers: {
        CD45: CD45_BLAST,
        CD33: m('CD33 (Siglec-3)', 'Very Bright', '#00e5ff', 'Intensely expressed — a hallmark of APL and the target of gemtuzumab ozogamicin.'),
        CD13: m('CD13 (Aminopeptidase N)', 'Bright', '#2196f3', 'Strongly positive, often with heterogeneous intensity.'),
        CD117: m('CD117 (c-kit Receptor)', 'Moderate', '#ff2a2a', 'Variable in APL, unlike the uniform brightness of other subtypes.'),
        CD64: m('CD64 (FcγRI)', 'Moderate', '#ff9800', 'Frequently expressed on abnormal promyelocytes.'),
        CD56: m('CD56 (NCAM)', 'Dim', '#e040fb', 'Aberrant expression; associated with poorer prognosis in APL.')
      }
    },
    AML_Blast_M4_Blast: {
      name: 'AML-M4 Myeloblast Component',
      lineage: 'Acute Myelomonocytic Leukaemia / Blast Compartment',
      desc: 'The myeloblastic component of acute myelomonocytic leukaemia, which contains both myeloid and monocytic populations. Frequently associated with inv(16) or t(16;16) CBFB-MYH11.',
      markers: {
        CD45: CD45_BLAST,
        CD34: m('CD34 Sialomucin', 'Bright', '#ff9800', 'Positive in the blast compartment.'),
        CD117: m('CD117 (c-kit Receptor)', 'Moderate', '#ff2a2a', 'Variable (+/-) in M4.'),
        CD13: m('CD13 (Aminopeptidase N)', 'Bright', '#2196f3', 'Pan-myeloid marker.'),
        CD33: m('CD33 (Siglec-3)', 'Bright', '#00e5ff', 'Myeloid lectin.'),
        HLA_DR: m('HLA-DR (MHC Class II)', 'Bright', '#4caf50', 'Positive.'),
        CD11b: m('CD11b (Mac-1)', 'Moderate', '#e040fb', 'Bridges toward the monocytic compartment.')
      }
    },
    AML_Blast_M4_Mono: {
      name: 'AML-M4 Monocytic Component',
      lineage: 'Acute Myelomonocytic Leukaemia / Monocytic Compartment',
      desc: 'The monocytic component of M4, comprising monoblasts and promonocytes. Expression of CD14 and CD64 alongside myeloid markers distinguishes it from the blast compartment and gives M4 its two-population appearance.',
      markers: {
        CD45: m('CD45 (Leukocyte Common Antigen)', 'Moderate', '#f8fafc', 'Brighter than the blast compartment.'),
        CD64: m('CD64 (FcγRI)', 'Bright', '#ff9800', 'High-affinity IgG Fc receptor marking monocytic differentiation.'),
        CD14: m('CD14 LPS Receptor', 'Moderate', '#4caf50', 'Acquired with monocytic maturation; often partial in leukaemic cells.'),
        CD33: m('CD33 (Siglec-3)', 'Bright', '#00e5ff', 'Strongly expressed on monocytic cells.'),
        CD13: m('CD13 (Aminopeptidase N)', 'Bright', '#2196f3', 'Pan-myeloid marker.'),
        CD11b: m('CD11b (Mac-1)', 'Bright', '#e040fb', 'Monocytic adhesion integrin.'),
        HLA_DR: m('HLA-DR (MHC Class II)', 'Bright', '#ff2a2a', 'Brightly expressed on monocytic cells.')
      }
    },
    AML_Blast_M5: {
      name: 'AML-M5 Monoblast',
      lineage: 'Acute Monoblastic / Monocytic Leukaemia',
      desc: 'Leukaemia in which over 80% of leukaemic cells are monocytic. Large monoblasts with abundant cytoplasm and folded nuclei. CD34 and CD117 are often negative while HLA-DR and CD33 are extremely bright. Associated with KMT2A (MLL) rearrangement, including t(9;11).',
      markers: {
        CD45: m('CD45 (Leukocyte Common Antigen)', 'Moderate', '#f8fafc', 'Intermediate — monocytic cells sit above the blast gate.'),
        CD33: m('CD33 (Siglec-3)', 'Very Bright', '#00e5ff', 'Extremely bright in monoblastic leukaemia.'),
        CD64: m('CD64 (FcγRI)', 'Bright', '#ff9800', 'Marks monocytic commitment.'),
        CD14: m('CD14 LPS Receptor', 'Moderate', '#4caf50', 'Often partial or dim on immature monoblasts.'),
        CD13: m('CD13 (Aminopeptidase N)', 'Bright', '#2196f3', 'Pan-myeloid marker.'),
        CD11b: m('CD11b (Mac-1)', 'Bright', '#e040fb', 'Monocytic adhesion integrin.'),
        HLA_DR: m('HLA-DR (MHC Class II)', 'Very Bright', '#ff2a2a', 'Characteristically very bright in M5.')
      }
    },
    AML_Blast_M6_Blast: {
      name: 'AML-M6 Myeloblast Component',
      lineage: 'Acute Erythroid Leukaemia / Blast Compartment',
      desc: 'The myeloblast population accompanying the expanded erythroid compartment in acute erythroid leukaemia.',
      markers: {
        CD45: CD45_BLAST,
        CD34: m('CD34 Sialomucin', 'Bright', '#ff9800', 'Progenitor marker on the myeloblast component.'),
        CD117: m('CD117 (c-kit Receptor)', 'Bright', '#ff2a2a', 'Expressed on both myeloid and early erythroid precursors.'),
        CD13: m('CD13 (Aminopeptidase N)', 'Bright', '#2196f3', 'Pan-myeloid marker.'),
        CD33: m('CD33 (Siglec-3)', 'Bright', '#00e5ff', 'Myeloid lectin.'),
        HLA_DR: m('HLA-DR (MHC Class II)', 'Bright', '#4caf50', 'Positive on the myeloblast component.')
      }
    },
    AML_Blast_M6_Erythroid: {
      name: 'AML-M6 Erythroid Precursor',
      lineage: 'Acute Erythroid Leukaemia / Erythroid Compartment',
      desc: 'Dysplastic, often multinucleated erythroid precursors making up more than 50% of marrow nucleated cells. They are characteristically CD45-negative to very dim with low forward scatter, and express CD71 brightly with Glycophorin A appearing at more mature stages.',
      markers: {
        CD45: m('CD45 (Leukocyte Common Antigen)', 'Extremely Dim', '#f8fafc', 'Negative to very dim — erythroid precursors fall below the leukocyte gate.'),
        CD117: m('CD117 (c-kit Receptor)', 'Moderate', '#ff2a2a', 'Expressed on early erythroid precursors, lost with maturation.'),
        CD38: m('CD38 Ectoenzyme', 'Bright', '#e040fb', 'Broadly expressed across erythroid maturation.')
      }
    },
    AML_Blast_M7: {
      name: 'AML-M7 Megakaryoblast',
      lineage: 'Acute Megakaryoblastic Leukaemia',
      desc: 'Leukaemia of megakaryocytic lineage, associated with marrow fibrosis and osteosclerosis — which frequently causes a dry tap on aspiration and makes flow cytometry on peripheral blood especially valuable. Megakaryoblasts show cytoplasmic projections and blebs, and express the platelet glycoproteins CD41 and CD61.',
      markers: {
        CD45: CD45_BLAST,
        CD41: m('CD41 (Glycoprotein IIb)', 'Bright', '#ff9800', 'Platelet glycoprotein IIb; with CD61 forms the fibrinogen receptor and defines megakaryocytic lineage.'),
        CD61: m('CD61 (Glycoprotein IIIa)', 'Bright', '#e040fb', 'Platelet glycoprotein IIIa. Beware surface platelet adherence causing false positivity.'),
        CD117: m('CD117 (c-kit Receptor)', 'Moderate', '#ff2a2a', 'Frequently expressed on megakaryoblasts.'),
        CD33: m('CD33 (Siglec-3)', 'Moderate', '#00e5ff', 'Variable myeloid antigen expression.'),
        CD34: m('CD34 Sialomucin', 'Dim', '#2196f3', 'Variable; may be negative in M7.')
      }
    }
  };

  Object.assign(CELL_DETAILS, subtypes);
})();

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
  CD15: { antibody: "Anti-CD15 Monoclonal", fluorochrome: "FITC (Fluorescein)", laser: "blue", laserName: "Blue Laser (488nm)", emissionColor: "#22c55e", emissionWavelength: "525 nm" },
  CD41: { antibody: "Anti-CD41 Monoclonal", fluorochrome: "PE (Phycoerythrin)", laser: "blue", laserName: "Blue Laser (488nm)", emissionColor: "#f59e0b", emissionWavelength: "578 nm" },
  CD61: { antibody: "Anti-CD61 Monoclonal", fluorochrome: "PC5.5 (PE-Cy5.5)", laser: "blue", laserName: "Blue Laser (488nm)", emissionColor: "#a21caf", emissionWavelength: "695 nm" },
};

// Simulator State
let isConjugationActive = false;
let activeLasers = { violet: false, blue: false, red: false };
let isFluidicsActive = false;
let isInjecting = false;
let injectionProgress = 0;
let currentInterrogatedCellType = 'CD4_TCell';

const FlowSoundSynth = {
  ctx: null,
  isMuted: true,
  
  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch(e) {
      console.warn("Web Audio API not supported", e);
    }
  },
  
  playCellBeep(cellType) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    
    const now = this.ctx.currentTime;
    
    let freqStart = 440;
    let freqEnd = 440;
    let duration = 0.08;
    let noiseFactor = 0;
    
    if (cellType === 'CD4_TCell' || cellType === 'CD8_TCell' || cellType === 'gd_TCell' || cellType === 'BCell' || cellType === 'NKCell') {
      // Lymphocytes: clear medium/high pitch
      freqStart = cellType === 'CD4_TCell' ? 660 : (cellType === 'CD8_TCell' ? 580 : 520);
      freqEnd = freqStart;
      duration = 0.06;
    } else if (cellType === 'Monocyte') {
      // Monocytes: larger, lower tone
      freqStart = 330;
      freqEnd = 300;
      duration = 0.12;
    } else if (cellType === 'Granulocyte') {
      // Granulocytes: lower complex tone with noise
      freqStart = 220;
      freqEnd = 180;
      duration = 0.15;
      noiseFactor = 0.35;
    } else if (cellType === 'NormalProgenitor') {
      // Progenitor: high frequency sweep
      freqStart = 880;
      freqEnd = 1200;
      duration = 0.08;
    } else if (cellType === 'AML_Blast' || (typeof cellType === 'string' && cellType.startsWith('AML_Blast_'))) {
      // Leukemic Blast: rising frequency sweep
      freqStart = 380;
      freqEnd = 980;
      duration = 0.22;
    } else if (cellType === 'Debris') {
      // Debris: short click
      freqStart = 1500;
      freqEnd = 2200;
      duration = 0.015;
    } else if (cellType === 'Doublets') {
      // Doublet: double beep
      this.playBeepTone(400, 400, 0.04, 0, now);
      this.playBeepTone(440, 440, 0.04, 0, now + 0.06);
      return;
    }
    
    this.playBeepTone(freqStart, freqEnd, duration, noiseFactor, now);
  },
  
  playBeepTone(freqStart, freqEnd, duration, noiseFactor, startTime) {
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freqStart, startTime);
    if (freqEnd !== freqStart) {
      osc.frequency.exponentialRampToValueAtTime(freqEnd, startTime + duration);
    }
    
    gainNode.gain.setValueAtTime(0.12, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    
    if (noiseFactor > 0) {
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(noiseFactor * 0.06, startTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      noise.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      
      noise.start(startTime);
      noise.stop(startTime + duration);
    }
    
    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);
    
    osc.start(startTime);
    osc.stop(startTime + duration);
  }
};

// ==========================================================================
// 3D Cell Explorer View Navigation & Rendering
// ==========================================================================

let threeJSData = null;
let canvas3DData = null;
let zoomFactor = 1.0;

function updateZoomUI() {
  const resetBtn = document.getElementById('zoom-reset-btn');
  if (resetBtn) {
    resetBtn.innerText = `${Math.round(zoomFactor * 100)}%`;
  }
}

function openCell3DExplorer(cell, originCase) {
  // Hide main UI
  document.querySelector('header').style.display = 'none';
  document.querySelector('.workspace').style.display = 'none';
  
  // Show Explorer View
  const explorerView = document.getElementById('cell-explorer-view');
  explorerView.style.display = 'flex';
  
  // Set case indicator
  document.getElementById('explorer-case-indicator').innerText = originCase;
  
  // Lazily initialize explorer plots if needed
  if (!explorerPlotFscSsc) {
    explorerPlotFscSsc = new FlowPlot('explorer-canvas-fsc-ssc');
    explorerPlotFscSsc.canvas.style.pointerEvents = 'none';
    explorerPlotFscSsc.activeTool = null;
  }
  if (!explorerPlotCd45Ssc) {
    explorerPlotCd45Ssc = new FlowPlot('explorer-canvas-cd45-ssc');
    explorerPlotCd45Ssc.canvas.style.pointerEvents = 'none';
    explorerPlotCd45Ssc.activeTool = null;
  }
  if (!explorerPlotLineage) {
    explorerPlotLineage = new FlowPlot('explorer-canvas-lineage');
    explorerPlotLineage.canvas.style.pointerEvents = 'none';
    explorerPlotLineage.activeTool = null;
  }

  // Load correct events list (Normal vs AML)
  const isAml = originCase.includes('AML') || (typeof currentCase !== 'undefined' && currentCase === 'aml');
  const events = isAml ? (amlEvents.length ? amlEvents : FlowData.generateAMLCase()) : (normalEvents.length ? normalEvents : FlowData.generateNormalCase());
  
  explorerPlotFscSsc.setData(events, events, []);
  explorerPlotCd45Ssc.setData(events, events, []);
  explorerPlotLineage.setData(events, events, []);
  
  // Set plot configurations
  explorerPlotFscSsc.xAxis = 'FSC_A';
  explorerPlotFscSsc.yAxis = 'SSC_A';
  
  explorerPlotCd45Ssc.xAxis = 'CD45';
  explorerPlotCd45Ssc.yAxis = 'SSC_A';
  
  // Dynamic Lineage plot markers based on cell type
  let lineX = 'CD3';
  let lineY = 'CD19';
  if (cell.type === 'CD4_TCell' || cell.type === 'CD8_TCell' || cell.type === 'gd_TCell') {
    lineX = 'CD3';
    lineY = cell.type === 'CD8_TCell' ? 'CD8' : 'CD4';
  } else if (cell.type === 'BCell') {
    lineX = 'CD3';
    lineY = 'CD19';
  } else if (cell.type === 'Monocyte') {
    lineX = 'CD45';
    lineY = 'CD14';
  } else if (cell.type === 'AML_Blast' || (typeof cell.type === 'string' && cell.type.startsWith('AML_Blast_'))) {
    if (cell.type === 'AML_Blast_M5' || cell.type === 'AML_Blast_M4_Mono') {
      lineX = 'CD64';
      lineY = 'CD14';
    } else {
      lineX = 'CD34';
      lineY = 'CD117';
    }
  } else if (cell.type === 'NormalProgenitor') {
    lineX = 'CD45';
    lineY = 'CD34';
  }
  
  explorerPlotLineage.xAxis = lineX;
  explorerPlotLineage.yAxis = lineY;
  
  // Set titles and highlights
  const lineageTitle = document.getElementById('lineage-graph-title');
  if (lineageTitle) {
    lineageTitle.innerText = `${lineX} vs ${lineY} (Lineage)`;
  }
  
  explorerPlotFscSsc.highlightedCellType = cell.type;
  explorerPlotCd45Ssc.highlightedCellType = cell.type;
  explorerPlotLineage.highlightedCellType = cell.type;
  
  // Render initial plots state
  explorerPlotFscSsc.draw();
  explorerPlotCd45Ssc.draw();
  explorerPlotLineage.draw();
  
  // Initialize the 3D rendering
  init3DCellExplorer(cell.type);
}

function init3DCellExplorer(cellType) {
  const container = document.getElementById('explorer-3d-container');
  const loader = document.getElementById('explorer-loading');
  const legend = document.getElementById('explorer-3d-legend');
  const details = CELL_DETAILS[cellType] || CELL_DETAILS.Debris;

  disposeExplorerRenderers();

  // Reset simulator state and zoom when entering new cell
  currentInterrogatedCellType = cellType;
  resetSimulatorStates();
  zoomFactor = 1.0;
  updateZoomUI();

  // Populate text
  document.getElementById('explorer-cell-name').innerText = details.name;
  document.getElementById('explorer-cell-lineage').innerText = details.lineage;
  document.getElementById('explorer-cell-desc').innerText = details.desc;

  // Surface the morphology the 3D model is actually depicting, so the nuclear
  // shape and granule load on screen can be tied back to what it means.
  const morphEl = document.getElementById('explorer-cell-morph');
  if (morphEl) {
    const note = cellMorphologyProfile(cellType).morphNote;
    morphEl.innerText = note ? `Morphology: ${note}` : '';
    morphEl.style.display = note ? 'block' : 'none';
  }
  
  // Clear container (except loader and simulator panels)
  const existingCanvas = container.querySelector(':scope > canvas');
  if (existingCanvas && existingCanvas.parentNode === container) {
    container.removeChild(existingCanvas);
  }
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
      // Dim first: applying focus resets every marker's glow to its resting
      // value, which would wipe out the highlight if it ran second.
      explorerHoverFocus = key;
      refreshExplorerFocus();
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

      // Fall back to whatever the lasers alone justify — which is usually
      // "nothing dimmed", but keeps the laser spotlight if one is latched on.
      explorerHoverFocus = null;
      refreshExplorerFocus();
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
        initThreeJSRenderer(container, details, cellType);
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
  hideExplorerPlotsPanel();
  disposeExplorerRenderers();
}

// Tears down whichever renderer is live. Called both on exit and before
// building a new cell, so a second cell never leaves the first one's
// animation loop running in the background.
function disposeExplorerRenderers() {
  // Stale focus would otherwise dim the next cell the moment it is built.
  explorerHoverFocus = null;

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
  if (threeJSData && threeJSData.markerInstances && threeJSData.markerInstances[key]) {
    const entry = threeJSData.markerInstances[key];
    entry.bodyMaterials.forEach(mat => {
      // Restore from each part's own resting glow — the stalk, anchor and head
      // are lit differently, so a single hard-coded restore value dims them.
      mat.emissiveIntensity = highlight ? 0.8 : captureFocusBase(mat).emissiveIntensity;
    });
    writeMarkerBodyMatrices(entry, highlight ? 1.5 : 1);
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

// ==========================================================================
// Focus mode — spotlight one CD (hover) or a laser's whole conjugate set
// (laser click) by fading the cell body and every off-target receptor.
// ==========================================================================

// How far a dimmed material falls back. Structure keeps a faint ghost so the
// receptor still reads as sitting on a cell rather than floating in space.
const FOCUS_DIM = { color: 0.20, opacity: 0.20, emissive: 0.10, fresnel: 0.10 };

let explorerHoverFocus = null;   // marker key currently under the cursor

// Resting values, snapshotted the first time a material is touched. Called
// eagerly at build time so a dimmed value can never be mistaken for the base.
function captureFocusBase(mat) {
  if (!mat.userData.focusBase) {
    mat.userData.focusBase = {
      color: mat.color ? mat.color.clone() : null,
      opacity: mat.opacity,
      emissiveIntensity: mat.emissiveIntensity,
      fresnel: (mat.uniforms && mat.uniforms.uIntensity) ? mat.uniforms.uIntensity.value : null
    };
  }
  return mat.userData.focusBase;
}

// Dimming scales colour, opacity and glow rather than toggling `transparent` —
// flipping that flag makes three.js rebuild the shader program, which stutters
// on every hover.
function setMaterialFocusDim(mat, dimmed) {
  const base = captureFocusBase(mat);
  if (base.fresnel !== null) {
    mat.uniforms.uIntensity.value = base.fresnel * (dimmed ? FOCUS_DIM.fresnel : 1);
    return;
  }
  if (base.color) mat.color.copy(base.color).multiplyScalar(dimmed ? FOCUS_DIM.color : 1);
  if (mat.transparent) mat.opacity = base.opacity * (dimmed ? FOCUS_DIM.opacity : 1);
  if (base.emissiveIntensity !== undefined) {
    mat.emissiveIntensity = base.emissiveIntensity * (dimmed ? FOCUS_DIM.emissive : 1);
  }
  // The animation loop rewrites fluorochrome glow every frame, so it reads this
  // back — otherwise an excited dye would flare straight through the dim.
  mat.userData.focusMul = dimmed ? FOCUS_DIM.emissive : 1;
}

// `keys` = marker keys to keep lit, or null/empty to restore the whole cell.
function applyExplorerFocus(keys) {
  const focus = (keys && keys.length) ? new Set(keys) : null;

  if (threeJSData && threeJSData.focusMaterials) {
    const reg = threeJSData.focusMaterials;
    reg.structure.forEach(mat => setMaterialFocusDim(mat, !!focus));
    Object.entries(reg.perMarker).forEach(([key, mats]) => {
      const dim = !!focus && !focus.has(key);
      mats.forEach(mat => setMaterialFocusDim(mat, dim));
    });
  }

  if (canvas3DData) canvas3DData.focusKeys = focus;
}

// Decides what should be lit right now. The marker under the cursor wins;
// failing that, every CD whose fluorochrome an active laser excites.
function refreshExplorerFocus() {
  if (explorerHoverFocus) {
    applyExplorerFocus([explorerHoverFocus]);
    return;
  }

  const lit = Object.keys(activeLasers).filter(k => activeLasers[k]);
  if (!isConjugationActive || !lit.length) {
    applyExplorerFocus(null);
    return;
  }

  const source = (threeJSData && threeJSData.markerInstances) ||
                 (canvas3DData && canvas3DData.markers) || {};
  const keys = Object.keys(source).filter(key => {
    const ab = MARKER_FLUOROCHROMES[key];
    return ab && lit.indexOf(ab.laser) !== -1;
  });
  applyExplorerFocus(keys);
}

// ==========================================================================
// 3D Visual Helpers — organic geometry, glow textures, cell morphology
// ==========================================================================

// Cheap deterministic pseudo-noise. Continuous in all three axes, so any two
// vertices sharing a position get an identical displacement (no seams/cracks).
function organicNoise3(x, y, z) {
  return (
    Math.sin(x * 2.1 + y * 1.3) * Math.sin(y * 1.7 + z * 2.3) * Math.sin(z * 1.9 + x * 1.1) * 0.62 +
    Math.sin(x * 4.3 - z * 3.1) * Math.sin(y * 3.7 + x * 2.9) * 0.28
  );
}

// Scratch objects for instance-matrix maths. The receptor loops run every
// frame while a laser is firing, so nothing in here may allocate.
const _instBase = typeof THREE !== 'undefined' ? new THREE.Matrix4() : null;
const _instScaled = typeof THREE !== 'undefined' ? new THREE.Matrix4() : null;
const _instVec = typeof THREE !== 'undefined' ? new THREE.Vector3() : null;

// Rewrites the anchor/stalk/head instance matrices for one CD marker. Used by
// the hover highlight, which grows the receptor about its own base — the same
// effect the old per-child `scale.set(1.5)` produced.
function writeMarkerBodyMatrices(entry, scaleMul) {
  entry.bodyParts.forEach(inst => {
    entry.placements.forEach((p, idx) => {
      const sc = p.scale * scaleMul;
      _instBase.compose(p.position, p.quaternion, _instVec.set(sc, sc, sc));
      inst.setMatrixAt(idx, _instBase);
    });
    inst.instanceMatrix.needsUpdate = true;
  });
}

// Fluorochrome spheres breathe individually when their laser is on, so each
// instance gets its own scale baked into its matrix.
function writeFluorochromeMatrices(entry, baseScale, time) {
  if (!entry.fluoro) return;
  const list = entry.fluoroPlacements;
  const locals = entry.fluoroLocals;
  const perReceptor = entry.placements.length;
  for (let idx = 0; idx < list.length; idx++) {
    const p = list[idx];
    // Phase by receptor index so the shimmer travels over the surface rather
    // than every sphere pulsing in lockstep.
    const pulse = time === null ? 0 : 0.5 + 0.5 * Math.sin(time * 6 + (idx % perReceptor) * 0.2);
    const sc = p.scale * baseScale * (1 + 0.32 * pulse);
    _instBase.compose(p.position, p.quaternion, _instVec.set(sc, sc, sc));
    _instScaled.multiplyMatrices(_instBase, locals[idx]);
    entry.fluoro.setMatrixAt(idx, _instScaled);
  }
  entry.fluoro.instanceMatrix.needsUpdate = true;
}

// Radius of the displaced surface along a (normalised) direction — lets us sit
// receptors flush on the bumpy membrane instead of on a perfect sphere.
function organicSurfaceRadius(dir, R, amp, freq, seed) {
  const n = organicNoise3(dir.x * freq + seed, dir.y * freq + seed * 1.7, dir.z * freq + seed * 2.3);
  return R * (1 + amp * n);
}

function applyOrganicDisplacement(geometry, amp, freq, seed) {
  const pos = geometry.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const len = v.length();
    if (len < 1e-6) continue;
    v.multiplyScalar(1 / len);
    const n = organicNoise3(v.x * freq + seed, v.y * freq + seed * 1.7, v.z * freq + seed * 2.3);
    v.multiplyScalar(len * (1 + amp * n));
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  pos.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

// Presses a smooth concavity into one side of a sphere — the monocyte's
// reniform (kidney-shaped) nucleus.
function applyIndentation(geometry, dir, depth, width) {
  const pos = geometry.attributes.position;
  const v = new THREE.Vector3();
  const d = dir.clone().normalize();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const len = v.length();
    if (len < 1e-6) continue;
    const t = Math.max(0, v.dot(d) / len);
    const f = 1 - depth * Math.pow(t, width);
    pos.setXYZ(i, v.x * f, v.y * f, v.z * f);
  }
  pos.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

function makeRadialGlowTexture() {
  const size = 128;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0.0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.18, 'rgba(255,255,255,0.75)');
  grad.addColorStop(0.45, 'rgba(255,255,255,0.22)');
  grad.addColorStop(1.0, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}

// Vertical soft bands used (additively) to make the sample core look like it is
// actually flowing rather than sitting still.
function makeStreamTexture() {
  const c = document.createElement('canvas');
  c.width = 8;
  c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#000000';
  g.fillRect(0, 0, 8, 256);
  for (let y = 0; y < 256; y++) {
    const band = Math.pow(0.5 + 0.5 * Math.sin((y / 256) * Math.PI * 8), 2.2);
    const v = 0.18 + 0.82 * band;
    g.fillStyle = `rgb(${Math.round(90 * v)},${Math.round(210 * v)},${Math.round(255 * v)})`;
    g.fillRect(0, y, 8, 1);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  return t;
}

function makeLabelSprite(text, color, scale) {
  const fs = 40;
  const font = `700 ${fs}px "Segoe UI", system-ui, -apple-system, sans-serif`;
  const measure = document.createElement('canvas').getContext('2d');
  measure.font = font;
  const w = Math.ceil(measure.measureText(text).width) + 24;
  const h = fs + 20;

  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  g.font = font;
  g.textBaseline = 'middle';
  g.shadowColor = 'rgba(0,0,0,0.9)';
  g.shadowBlur = 8;
  g.fillStyle = color;
  g.fillText(text, 12, h / 2);

  const tex = new THREE.CanvasTexture(c);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: tex, transparent: true, depthTest: false, depthWrite: false, opacity: 0.85
  }));
  const s = scale || 0.0075;
  sprite.scale.set(w * s, h * s, 1);
  sprite.renderOrder = 60;
  sprite.userData.texture = tex;
  return sprite;
}

// View-dependent rim light. This is what turns a flat sphere into something
// that reads as a translucent, volumetric cell.
function makeFresnelMaterial(colorHex, power, intensity, side) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(colorHex) },
      uPower: { value: power },
      uIntensity: { value: intensity }
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vView = -mv.xyz;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uPower;
      uniform float uIntensity;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        float f = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), uPower);
        gl_FragColor = vec4(uColor * f * uIntensity, f * uIntensity);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: side || THREE.FrontSide
  });
}

// --------------------------------------------------------------------------
// Cell morphology. Nuclear shape, N:C ratio, granule load and size are the
// features a morphologist actually reads down a microscope, and they map
// directly onto FSC (size) and SSC (granularity) on the scatter plot.
// --------------------------------------------------------------------------
function cellMorphologyProfile(cellType) {
  const sizeMult = cellTypeSizeMultiplier(cellType);
  const granMult = cellTypeGranularityMultiplier(cellType);

  const p = {
    radius: 1.6 + 3.2 * sizeMult,
    membraneAmp: 0.055,
    membraneFreq: 2.4,
    cytoColor: 0x38bdf8,
    rimColor: 0x67e8f9,
    nucleus: { shape: 'round', ratio: 0.62, color: 0x6d28d9, lobes: 1, nucleoli: 0 },
    granules: { count: Math.round(18 + granMult * 90), size: 0.042 + granMult * 0.032, color: 0xa78bfa, accent: 0xf9a8d4 },
    auerRods: 0,
    blebs: 0,
    bodies: [{ offset: new THREE.Vector3(0, 0, 0), scale: 1 }],
    morphNote: ''
  };

  switch (cellType) {
    case 'CD4_TCell':
    case 'CD8_TCell':
    case 'gd_TCell':
      p.nucleus = { shape: 'round', ratio: 0.82, color: 0x4c1d95, lobes: 1, nucleoli: 0 };
      p.granules = { count: 6, size: 0.05, color: 0xa78bfa, accent: 0xc4b5fd };
      p.cytoColor = 0x22d3ee;
      p.morphNote = 'Scant cytoplasm, high N:C ratio, dense clumped chromatin';
      break;
    case 'BCell':
      p.nucleus = { shape: 'round', ratio: 0.80, color: 0x4c1d95, lobes: 1, nucleoli: 0 };
      p.granules = { count: 5, size: 0.05, color: 0xa78bfa, accent: 0xc4b5fd };
      p.cytoColor = 0x38bdf8;
      p.morphNote = 'Small agranular lymphocyte with a thin rim of cytoplasm';
      break;
    case 'NKCell':
      p.nucleus = { shape: 'kidney', ratio: 0.74, color: 0x4c1d95, lobes: 1, nucleoli: 0 };
      p.granules = { count: 16, size: 0.105, color: 0xc084fc, accent: 0xf0abfc };
      p.cytoColor = 0x2dd4bf;
      p.morphNote = 'Large granular lymphocyte — prominent azurophilic granules';
      break;
    case 'Monocyte':
      p.nucleus = { shape: 'kidney', ratio: 0.64, color: 0x5b5fd6, lobes: 1, nucleoli: 0 };
      p.granules = { count: 52, size: 0.046, color: 0xc084fc, accent: 0xa5b4fc };
      p.cytoColor = 0x60a5fa;
      p.membraneAmp = 0.09;
      p.blebs = 3;
      p.morphNote = 'Reniform (kidney-shaped) nucleus, abundant grey-blue cytoplasm';
      break;
    case 'Granulocyte':
      p.nucleus = { shape: 'lobed', ratio: 0.34, color: 0x5b21b6, lobes: 3, nucleoli: 0 };
      p.granules = { count: 165, size: 0.066, color: 0xfda4af, accent: 0xc084fc };
      p.cytoColor = 0x7dd3fc;
      p.morphNote = 'Trilobed nucleus, cytoplasm packed with granules — very high SSC';
      break;
    case 'NormalProgenitor':
      p.nucleus = { shape: 'round', ratio: 0.80, color: 0x6127c9, lobes: 1, nucleoli: 1 };
      p.granules = { count: 10, size: 0.05, color: 0xa78bfa, accent: 0xc4b5fd };
      p.cytoColor = 0x38bdf8;
      p.morphNote = 'High N:C ratio, fine open chromatin, single nucleolus';
      break;
    case 'AML_Blast':
    case 'AML_Blast_M0':
    case 'AML_Blast_M1':
    case 'AML_Blast_M4_Blast':
    case 'AML_Blast_M6_Blast':
      p.nucleus = { shape: 'round', ratio: 0.80, color: 0x6127c9, lobes: 1, nucleoli: 2 };
      p.granules = { count: 9, size: 0.05, color: 0xa78bfa, accent: 0xc4b5fd };
      p.cytoColor = 0x818cf8;
      p.membraneAmp = 0.085;
      p.morphNote = 'Agranular blast — high N:C ratio, fine chromatin, prominent nucleoli';
      break;
    case 'AML_Blast_M2':
    case 'AML_Blast_M2_Maturing':
      p.nucleus = { shape: 'round', ratio: 0.74, color: 0x6127c9, lobes: 1, nucleoli: 2 };
      p.granules = { count: 46, size: 0.056, color: 0xc084fc, accent: 0xf9a8d4 };
      p.auerRods = 1;
      p.cytoColor = 0x818cf8;
      p.morphNote = 'Myeloblast with granules and a single Auer rod';
      break;
    case 'AML_Blast_M3':
      p.nucleus = { shape: 'bilobed', ratio: 0.42, color: 0x6d28d9, lobes: 2, nucleoli: 0 };
      p.granules = { count: 175, size: 0.062, color: 0xf472b6, accent: 0xc084fc };
      p.auerRods = 6;
      p.cytoColor = 0xa78bfa;
      p.morphNote = 'Hypergranular promyelocyte, bilobed nucleus, Auer rod bundles (faggot cell)';
      break;
    case 'AML_Blast_M4_Mono':
    case 'AML_Blast_M5':
      p.nucleus = { shape: 'folded', ratio: 0.66, color: 0x5b5fd6, lobes: 1, nucleoli: 1 };
      p.granules = { count: 30, size: 0.046, color: 0xc084fc, accent: 0xa5b4fc };
      p.cytoColor = 0x60a5fa;
      p.membraneAmp = 0.10;
      p.morphNote = 'Monoblastic — folded/convoluted nucleus, abundant cytoplasm';
      break;
    case 'AML_Blast_M6_Erythroid':
      p.nucleus = { shape: 'round', ratio: 0.76, color: 0x312e81, lobes: 1, nucleoli: 1 };
      p.granules = { count: 4, size: 0.042, color: 0xa78bfa, accent: 0xc4b5fd };
      p.cytoColor = 0xf87171;
      p.morphNote = 'Erythroid precursor — small, round dense nucleus, agranular';
      break;
    case 'AML_Blast_M7':
      p.nucleus = { shape: 'round', ratio: 0.70, color: 0x6127c9, lobes: 1, nucleoli: 1 };
      p.granules = { count: 18, size: 0.046, color: 0xa78bfa, accent: 0xc4b5fd };
      p.blebs = 6;
      p.membraneAmp = 0.13;
      p.cytoColor = 0x93c5fd;
      p.morphNote = 'Megakaryoblast — characteristic cytoplasmic blebs and protrusions';
      break;
    case 'Debris':
      p.nucleus = { shape: 'none', ratio: 0, color: 0x000000, lobes: 0, nucleoli: 0 };
      p.granules = { count: 8, size: 0.058, color: 0x64748b, accent: 0x94a3b8 };
      p.membraneAmp = 0.34;
      p.membraneFreq = 3.6;
      p.cytoColor = 0x64748b;
      p.rimColor = 0x94a3b8;
      p.morphNote = 'Anucleate fragment — irregular outline, very low FSC';
      break;
    case 'Doublets':
      p.nucleus = { shape: 'round', ratio: 0.70, color: 0x5b21b6, lobes: 1, nucleoli: 0 };
      p.granules = { count: 26, size: 0.052, color: 0xa78bfa, accent: 0xc4b5fd };
      p.bodies = [
        { offset: new THREE.Vector3(-0.66, -0.10, 0), scale: 0.86 },
        { offset: new THREE.Vector3(0.62, 0.16, 0.08), scale: 0.80 }
      ];
      p.morphNote = 'Two cells traversing the beam together — a coincidence artefact';
      break;
  }

  return p;
}

// --------------------------------------------------------------------------
// Flow cell geometry. Wide sheath chamber -> taper -> narrow quartz cuvette
// where the beams cross -> waste. Everything else (particles, core stream,
// cell path) is derived from this one profile so it all stays consistent.
// --------------------------------------------------------------------------
const FLOW = {
  yTop: 8.6,
  ySit: 5.6,
  yTaperTop: 4.6,
  yCuvetteTop: 2.9,
  yCuvetteBot: -3.4,
  yBot: -7.8,
  rWide: 3.0,
  rCuvette: 1.45,
  rWaste: 2.0,
  laserY: { violet: 2.2, blue: 0, red: -2.2 },
  laserProgress: { violet: 0.31, blue: 0.50, red: 0.68 }
};

function chamberRadiusAt(y) {
  if (y >= FLOW.yTaperTop) return FLOW.rWide;
  if (y >= FLOW.yCuvetteTop) {
    const t = (FLOW.yTaperTop - y) / (FLOW.yTaperTop - FLOW.yCuvetteTop);
    const s = t * t * (3 - 2 * t);
    return FLOW.rWide + (FLOW.rCuvette - FLOW.rWide) * s;
  }
  if (y >= FLOW.yCuvetteBot) return FLOW.rCuvette;
  const t = Math.min(1, (FLOW.yCuvetteBot - y) / (FLOW.yCuvetteBot - FLOW.yBot));
  const s = t * t * (3 - 2 * t);
  return FLOW.rCuvette + (FLOW.rWaste - FLOW.rCuvette) * s;
}

// Cell height as a function of injection progress. Keyframed so the cell sits
// exactly on each beam at the progress values the pulse maths already uses,
// and so the segment speeds increase monotonically — the stream accelerates as
// the chamber narrows, which is the point of hydrodynamic focusing.
const CELL_PATH_KEYS = [
  { p: 0.00, y: FLOW.ySit - 0.2 },
  { p: FLOW.laserProgress.violet, y: FLOW.laserY.violet },
  { p: FLOW.laserProgress.blue, y: FLOW.laserY.blue },
  { p: FLOW.laserProgress.red, y: FLOW.laserY.red },
  { p: 1.00, y: FLOW.yBot + 1.1 }
];

function cellPathY(p) {
  const k = CELL_PATH_KEYS;
  if (p <= k[0].p) return k[0].y;
  for (let i = 1; i < k.length; i++) {
    if (p <= k[i].p) {
      const t = (p - k[i - 1].p) / (k[i].p - k[i - 1].p);
      return k[i - 1].y + (k[i].y - k[i - 1].y) * t;
    }
  }
  return k[k.length - 1].y;
}

function initThreeJSRenderer(container, details, cellType) {
  const width = container.clientWidth;
  const height = container.clientHeight;
  const profile = cellMorphologyProfile(cellType);
  const disposables = [];

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x020617, 0.014);

  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 400);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setSize(width, height);
  // The scene is heavy on additive/transparent shells, so it is fill-rate
  // bound. A full 2x device ratio quadruples the fragments for very little
  // visible gain once MSAA is on; 1.5x looks the same and costs ~45% less.
  // `qualityScale` is dropped further by the frame-time watchdog below.
  const MAX_DPR = Math.min(window.devicePixelRatio || 1, 1.5);
  let qualityScale = 1;
  renderer.setPixelRatio(MAX_DPR);
  // three r128 has no automatic colour management, so leaving the output in
  // linear encoding is what keeps the authored CD marker hexes matching the
  // legend swatches. sRGB output here would gamma-brighten everything to pastel.
  renderer.toneMapping = THREE.NoToneMapping;
  container.appendChild(renderer.domElement);

  const glowTex = makeRadialGlowTexture();
  const streamTex = makeStreamTexture();
  disposables.push(glowTex, streamTex);

  // ---- Lighting: key / fill / rim, so the cell reads as a solid volume -----
  scene.add(new THREE.AmbientLight(0x93c5fd, 0.22));
  scene.add(new THREE.HemisphereLight(0x60a5fa, 0x020617, 0.35));

  const keyLight = new THREE.DirectionalLight(0xffffff, 0.95);
  keyLight.position.set(6, 8, 9);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.35);
  fillLight.position.set(-8, -3, 5);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xa855f7, 0.7);
  rimLight.position.set(-4, 3, -10);
  scene.add(rimLight);

  const bounceLight = new THREE.PointLight(0x22d3ee, 0.35, 30);
  bounceLight.position.set(0, -6, 4);
  scene.add(bounceLight);

  // =========================================================================
  // The cell
  // =========================================================================
  const cellGroup = new THREE.Group();
  scene.add(cellGroup);

  const R = profile.radius;
  const membraneMeshes = [];
  const granuleGroups = [];

  profile.bodies.forEach((body, bodyIndex) => {
    const bodyGroup = new THREE.Group();
    bodyGroup.position.copy(body.offset.clone().multiplyScalar(R));
    bodyGroup.scale.setScalar(body.scale);
    cellGroup.add(bodyGroup);

    const seed = bodyIndex * 7.31;
    const amp = profile.membraneAmp;
    const freq = profile.membraneFreq;

    // Cytoplasm — a translucent filled volume so the cell has interior.
    const cytoGeom = applyOrganicDisplacement(new THREE.SphereGeometry(R * 0.985, 40, 28), amp, freq, seed);
    const cytoMat = new THREE.MeshStandardMaterial({
      color: profile.cytoColor,
      roughness: 0.6,
      metalness: 0.0,
      transparent: true,
      opacity: 0.10,
      depthWrite: false,
      side: THREE.BackSide
    });
    const cytoMesh = new THREE.Mesh(cytoGeom, cytoMat);
    cytoMesh.renderOrder = 4;
    bodyGroup.add(cytoMesh);

    // Lipid bilayer — glossy shell picking up the key light. Kept thin so the
    // nucleus and granules stay readable through it.
    const memGeom = applyOrganicDisplacement(new THREE.SphereGeometry(R, 48, 32), amp, freq, seed);
    const memMat = new THREE.MeshPhongMaterial({
      color: profile.cytoColor,
      emissive: profile.cytoColor,
      emissiveIntensity: 0.04,
      specular: 0xdbeafe,
      shininess: 90,
      transparent: true,
      opacity: 0.13,
      depthWrite: false,
      side: THREE.FrontSide
    });
    const memMesh = new THREE.Mesh(memGeom, memMat);
    memMesh.renderOrder = 5;
    bodyGroup.add(memMesh);
    membraneMeshes.push(memMesh);

    // Fresnel rim — the edge glow that sells the volume.
    const rimGeom = applyOrganicDisplacement(new THREE.SphereGeometry(R * 1.004, 48, 32), amp, freq, seed);
    const rimMat = makeFresnelMaterial(profile.rimColor, 3.2, 0.62, THREE.FrontSide);
    const rimMesh = new THREE.Mesh(rimGeom, rimMat);
    rimMesh.renderOrder = 6;
    bodyGroup.add(rimMesh);

    // Outer halo, drawn from the inside so it hugs the silhouette.
    const haloGeom = new THREE.SphereGeometry(R * 1.13, 24, 16);
    const haloMat = makeFresnelMaterial(profile.rimColor, 4.2, 0.24, THREE.BackSide);
    const haloMesh = new THREE.Mesh(haloGeom, haloMat);
    haloMesh.renderOrder = 3;
    bodyGroup.add(haloMesh);

    // Faint geodesic overlay — keeps the original schematic feel and makes
    // rotation legible.
    const wireGeom = applyOrganicDisplacement(new THREE.IcosahedronGeometry(R * 1.008, 2), amp, freq, seed);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x93c5fd, wireframe: true, transparent: true, opacity: 0.055, depthWrite: false
    });
    const wireMesh = new THREE.Mesh(wireGeom, wireMat);
    wireMesh.renderOrder = 7;
    bodyGroup.add(wireMesh);

    // ---- Nucleus -----------------------------------------------------------
    const nuc = profile.nucleus;
    const nucGroup = new THREE.Group();
    nucGroup.renderOrder = 1;
    bodyGroup.add(nucGroup);

    const nucMat = new THREE.MeshStandardMaterial({
      color: nuc.color,
      roughness: 0.85,
      metalness: 0.0,
      emissive: nuc.color,
      emissiveIntensity: 0.045
    });
    // A tight rim on the nuclear envelope separates it from the cytoplasm.
    const nucRimMat = makeFresnelMaterial(0xc4b5fd, 3.0, 0.5, THREE.FrontSide);

    const addLobe = (radius, position, kind) => {
      let g = new THREE.SphereGeometry(radius, 32, 22);
      if (kind === 'kidney') {
        applyIndentation(g, new THREE.Vector3(0.85, -0.3, 0.4), 0.52, 2.2);
        applyOrganicDisplacement(g, 0.05, 3.0, 1.3);
      } else if (kind === 'folded') {
        applyOrganicDisplacement(g, 0.19, 3.6, 2.9);
      } else {
        applyOrganicDisplacement(g, 0.07, 2.8, 0.7);
      }
      const m = new THREE.Mesh(g, nucMat);
      m.position.copy(position);
      nucGroup.add(m);

      const cm = new THREE.Mesh(g, nucRimMat);
      cm.position.copy(position);
      cm.scale.setScalar(1.015);
      cm.renderOrder = 2;
      nucGroup.add(cm);
      return m;
    };

    if (nuc.shape === 'lobed') {
      // Segmented neutrophil nucleus: lobes on an arc, joined by chromatin filaments.
      const lobeR = R * nuc.ratio;
      const centres = [];
      for (let i = 0; i < nuc.lobes; i++) {
        const a = (i / Math.max(1, nuc.lobes - 1)) * Math.PI * 1.15 - Math.PI * 0.575;
        const pos = new THREE.Vector3(Math.cos(a) * R * 0.40, Math.sin(a) * R * 0.34, Math.sin(a * 1.7) * R * 0.16);
        centres.push(pos);
        addLobe(lobeR * (0.88 + 0.12 * Math.sin(i * 2.1)), pos, 'round');
      }
      for (let i = 1; i < centres.length; i++) {
        const a = centres[i - 1];
        const b = centres[i];
        const len = a.distanceTo(b);
        const fil = new THREE.Mesh(new THREE.CylinderGeometry(lobeR * 0.20, lobeR * 0.20, len, 8), nucMat);
        fil.position.copy(a.clone().add(b).multiplyScalar(0.5));
        fil.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
        nucGroup.add(fil);
      }
    } else if (nuc.shape === 'bilobed') {
      const lobeR = R * nuc.ratio;
      const a = new THREE.Vector3(-R * 0.26, R * 0.16, 0);
      const b = new THREE.Vector3(R * 0.26, -R * 0.16, R * 0.06);
      addLobe(lobeR, a, 'round');
      addLobe(lobeR * 0.92, b, 'round');
      const len = a.distanceTo(b);
      const fil = new THREE.Mesh(new THREE.CylinderGeometry(lobeR * 0.30, lobeR * 0.30, len, 8), nucMat);
      fil.position.copy(a.clone().add(b).multiplyScalar(0.5));
      fil.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
      nucGroup.add(fil);
    } else if (nuc.shape !== 'none') {
      addLobe(R * nuc.ratio, new THREE.Vector3(0, 0, 0), nuc.shape);
    }

    // Nucleoli — the hallmark of an immature blast.
    if (nuc.nucleoli > 0) {
      const noMat = new THREE.MeshStandardMaterial({
        color: 0xc7d2fe, roughness: 0.4, emissive: 0x818cf8, emissiveIntensity: 0.55
      });
      for (let i = 0; i < nuc.nucleoli; i++) {
        const a = (i / nuc.nucleoli) * Math.PI * 2 + 0.6;
        const nm = new THREE.Mesh(new THREE.SphereGeometry(R * nuc.ratio * 0.28, 16, 12), noMat);
        nm.position.set(Math.cos(a) * R * nuc.ratio * 0.45, Math.sin(a) * R * nuc.ratio * 0.35, R * nuc.ratio * 0.25);
        nucGroup.add(nm);
      }
    }

    // ---- Granules — this is the SSC signal made visible ---------------------
    const nucR = nuc.shape === 'none' ? 0 : R * nuc.ratio * (nuc.shape === 'lobed' || nuc.shape === 'bilobed' ? 1.55 : 1.0);
    const gCount = profile.granules.count;
    const granuleGroup = new THREE.Group();
    granuleGroup.renderOrder = 2;
    bodyGroup.add(granuleGroup);
    granuleGroups.push(granuleGroup);

    if (gCount > 0) {
      const shells = [
        { mat: new THREE.MeshStandardMaterial({ color: profile.granules.color, roughness: 0.32, metalness: 0.2, emissive: profile.granules.color, emissiveIntensity: 0.16 }), n: Math.ceil(gCount * 0.6) },
        { mat: new THREE.MeshStandardMaterial({ color: profile.granules.accent, roughness: 0.38, metalness: 0.15, emissive: profile.granules.accent, emissiveIntensity: 0.11 }), n: Math.floor(gCount * 0.4) }
      ];
      const gGeom = new THREE.IcosahedronGeometry(1, 1);
      const dummy = new THREE.Object3D();
      let gi = 0;
      shells.forEach(shell => {
        if (shell.n <= 0) return;
        const inst = new THREE.InstancedMesh(gGeom, shell.mat, shell.n);
        for (let i = 0; i < shell.n; i++) {
          // Golden-angle direction + banded radius keeps them in the cytoplasm
          // shell between nucleus and membrane rather than clumping.
          const t = (gi + 0.5) / gCount;
          const yy = 1 - t * 2;
          const rr = Math.sqrt(Math.max(0, 1 - yy * yy));
          const th = 2.399963 * gi + bodyIndex * 1.7;
          const dir = new THREE.Vector3(Math.cos(th) * rr, yy, Math.sin(th) * rr);
          const jitter = 0.5 + 0.5 * Math.sin(gi * 12.9898) * Math.cos(gi * 78.233);
          const lo = Math.max(nucR * 1.12, R * 0.18);
          const hi = R * 0.88;
          const rad = lo >= hi ? R * 0.6 : lo + (hi - lo) * (0.15 + 0.85 * jitter);
          dummy.position.copy(dir.multiplyScalar(rad));
          dummy.rotation.set(gi * 1.3, gi * 2.1, gi * 0.7);
          const s = profile.granules.size * R * (0.75 + 0.5 * jitter);
          dummy.scale.setScalar(s);
          dummy.updateMatrix();
          inst.setMatrixAt(i, dummy.matrix);
          gi++;
        }
        inst.instanceMatrix.needsUpdate = true;
        granuleGroup.add(inst);
      });
    }

    // ---- Auer rods (M2 single rod, M3 faggot bundle) -----------------------
    if (profile.auerRods > 0) {
      const auerMat = new THREE.MeshStandardMaterial({
        color: 0xfb7185, roughness: 0.25, metalness: 0.3, emissive: 0xf43f5e, emissiveIntensity: 0.5
      });
      const auerGeom = new THREE.CylinderGeometry(R * 0.035, R * 0.02, R * 0.62, 6);
      for (let i = 0; i < profile.auerRods; i++) {
        const rod = new THREE.Mesh(auerGeom, auerMat);
        const a = i * 0.55 + 1.2;
        rod.position.set(Math.cos(a) * R * 0.52, R * (0.34 - i * 0.09), Math.sin(a) * R * 0.42);
        rod.rotation.set(0.9 + i * 0.12, a, 0.5 - i * 0.08);
        granuleGroup.add(rod);
      }
    }

    // ---- Cytoplasmic blebs (megakaryoblast / monocyte pseudopods) ----------
    if (profile.blebs > 0) {
      const blebMat = memMat.clone();
      blebMat.opacity = 0.3;
      for (let i = 0; i < profile.blebs; i++) {
        const a = i * 2.399963;
        const yy = 1 - ((i + 0.5) / profile.blebs) * 2;
        const rr = Math.sqrt(Math.max(0, 1 - yy * yy));
        const dir = new THREE.Vector3(Math.cos(a) * rr, yy, Math.sin(a) * rr);
        const bs = R * (0.20 + 0.12 * ((i % 3) / 2));
        const bleb = new THREE.Mesh(new THREE.SphereGeometry(bs, 20, 16), blebMat);
        bleb.position.copy(dir.multiplyScalar(organicSurfaceRadius(dir, R, amp, freq, seed) * 0.94));
        bleb.renderOrder = 5;
        bodyGroup.add(bleb);
      }
    }
  });

  // =========================================================================
  // CD markers / receptors, anchored to the displaced membrane
  // =========================================================================
  // Every CD marker becomes a handful of InstancedMeshes rather than ~100
  // cloned Groups. A blast carries ~110 receptors; as individual meshes that
  // was ~900 scene nodes and ~450 draw calls a frame, which is what made the
  // explorer stutter. Instanced, the same picture costs ~40 draw calls.
  const markerInstances = {};   // key -> { body:[InstancedMesh], antibody:[...], fluoro, base matrices }
  const antibodyMeshes = {};    // key -> [InstancedMesh] toggled by the conjugation switch
  const markersList = Object.entries(details.markers);

  const expressionCount = (expr) => {
    if (expr === 'Very Bright') return 24;
    if (expr === 'Bright') return 16;
    if (expr === 'Moderate') return 10;
    if (expr === 'Dim') return 4;
    return 8;
  };

  // Interleave the markers so each CD is spread over the whole surface instead
  // of forming a band.
  const counts = {};
  let totalReceptors = 0;
  markersList.forEach(([key, marker]) => {
    counts[key] = expressionCount(marker.expression);
    totalReceptors += counts[key];
    antibodyMeshes[key] = [];
  });

  const slots = [];
  const maxCount = Math.max(0, ...Object.values(counts));
  for (let round = 0; round < maxCount; round++) {
    markersList.forEach(([key]) => {
      if (counts[key] > round) slots.push(key);
    });
  }

  const bodyCentres = profile.bodies.map(b => ({
    offset: b.offset.clone().multiplyScalar(R),
    scale: b.scale
  }));

  // Where every receptor of a given CD sits on the membrane. Worked out once,
  // then baked into instance matrices.
  const placements = {};
  markersList.forEach(([key]) => { placements[key] = []; });

  const UP = new THREE.Vector3(0, 1, 0);
  slots.forEach((key, i) => {
    const yy = totalReceptors > 1 ? 1 - (i / (totalReceptors - 1)) * 2 : 0;
    const rr = Math.sqrt(Math.max(0, 1 - yy * yy));
    const th = 2.399963 * i;
    const dir = new THREE.Vector3(Math.cos(th) * rr, yy, Math.sin(th) * rr).normalize();

    const body = bodyCentres[i % bodyCentres.length];
    const bodySeed = (i % bodyCentres.length) * 7.31;
    const surfaceR = organicSurfaceRadius(dir, R, profile.membraneAmp, profile.membraneFreq, bodySeed);

    placements[key].push({
      position: dir.clone().multiplyScalar(surfaceR * 0.96 * body.scale).add(body.offset),
      quaternion: new THREE.Quaternion().setFromUnitVectors(UP, dir),
      scale: body.scale,
      phase: i * 0.7
    });
  });

  // Local offsets of each antibody part inside a receptor's own frame. The
  // geometries already carry their own translation, so these are just the
  // transforms the old Mesh/Group nodes used to apply on top.
  const AB_ROOT = new THREE.Matrix4().makeTranslation(0, 0.66, 0);
  const abPartMatrix = (m) => new THREE.Matrix4().multiplyMatrices(AB_ROOT, m);

  // `locals` is either one matrix applied to every instance, or one per
  // instance (the antibody arms and fluorochromes come in mirrored pairs).
  const makeInstanced = (geom, mat, list, locals) => {
    const inst = new THREE.InstancedMesh(geom, mat, list.length);
    inst.renderOrder = 2;
    // Receptors ride the cell, so per-instance culling would be wrong anyway;
    // skipping it also removes ~100 bounding-sphere tests per frame.
    inst.frustumCulled = false;

    const m = new THREE.Matrix4();
    const base = new THREE.Matrix4();
    const s = new THREE.Vector3();
    list.forEach((p, idx) => {
      base.compose(p.position, p.quaternion, s.set(p.scale, p.scale, p.scale));
      const local = Array.isArray(locals) ? locals[idx] : locals;
      inst.setMatrixAt(idx, local ? m.multiplyMatrices(base, local) : base);
    });
    inst.instanceMatrix.needsUpdate = true;

    cellGroup.add(inst);
    return inst;
  };

  markersList.forEach(([key, marker]) => {
    const list = placements[key];
    if (!list.length) return;

    const anchorGeom = new THREE.SphereGeometry(0.15, 8, 5);
    anchorGeom.scale(1, 0.42, 1);
    const anchorMat = new THREE.MeshStandardMaterial({
      color: marker.color, roughness: 0.55, metalness: 0.2, emissive: marker.color, emissiveIntensity: 0.1
    });

    const stalkGeom = new THREE.CylinderGeometry(0.032, 0.055, 0.62, 7, 1, true);
    stalkGeom.translate(0, 0.31, 0);
    const stalkMat = new THREE.MeshStandardMaterial({
      color: marker.color, roughness: 0.42, metalness: 0.15, emissive: marker.color, emissiveIntensity: 0.1
    });

    const headGeom = new THREE.SphereGeometry(0.118, 12, 8);
    headGeom.translate(0, 0.665, 0);
    const headMat = new THREE.MeshStandardMaterial({
      color: marker.color, roughness: 0.18, metalness: 0.3, emissive: marker.color, emissiveIntensity: 0.32
    });

    const bodyParts = [
      makeInstanced(anchorGeom, anchorMat, list, null),
      makeInstanced(stalkGeom, stalkMat, list, null),
      makeInstanced(headGeom, headMat, list, null)
    ];

    const entry = { placements: list, bodyParts, bodyMaterials: [anchorMat, stalkMat, headMat], fluoro: null, fluoroLocals: null };

    const abData = MARKER_FLUOROCHROMES[key];
    if (abData) {
      const abMat = new THREE.MeshStandardMaterial({
        color: 0xcbd5e1, roughness: 0.3, metalness: 0.45, transparent: true, opacity: 0.9
      });

      const stemGeom = new THREE.CylinderGeometry(0.024, 0.024, 0.26, 6, 1, true);
      stemGeom.translate(0, 0.13, 0);
      const stem = makeInstanced(stemGeom, abMat, list, abPartMatrix(new THREE.Matrix4()));
      stem.visible = isConjugationActive;
      antibodyMeshes[key].push(stem);

      // Mirrored parts get one InstancedMesh holding both copies: the whole
      // receptor list is repeated once per copy, each with its own local
      // offset.
      const mirrored = (offsets) => {
        const outList = [];
        const outLocals = [];
        offsets.forEach(local => {
          list.forEach(p => { outList.push(p); outLocals.push(local); });
        });
        return { list: outList, locals: outLocals };
      };

      const armGeom = new THREE.CylinderGeometry(0.018, 0.018, 0.22, 6, 1, true);
      armGeom.translate(0, 0.11, 0);
      const armParts = mirrored([1, -1].map(sign => abPartMatrix(
        new THREE.Matrix4()
          .makeTranslation(0, 0.26, 0)
          .multiply(new THREE.Matrix4().makeRotationZ(sign * Math.PI / 4))
      )));
      const arms = makeInstanced(armGeom, abMat, armParts.list, armParts.locals);
      arms.visible = isConjugationActive;
      antibodyMeshes[key].push(arms);

      // Fluorochromes: two per receptor. Their matrices are rewritten each
      // frame while the matching laser is firing, so keep the placements.
      const fMat = new THREE.MeshStandardMaterial({
        color: abData.emissionColor,
        emissive: abData.emissionColor,
        emissiveIntensity: 0.35,
        roughness: 0.15,
        metalness: 0.1
      });
      const fGeom = new THREE.SphereGeometry(0.085, 10, 8);
      const fParts = mirrored([-0.155, 0.155].map(
        x => abPartMatrix(new THREE.Matrix4().makeTranslation(x, 0.40, 0))
      ));
      const fluoro = makeInstanced(fGeom, fMat, fParts.list, fParts.locals);
      fluoro.visible = isConjugationActive;
      antibodyMeshes[key].push(fluoro);

      entry.fluoro = fluoro;
      entry.fluoroPlacements = fParts.list;
      entry.fluoroLocals = fParts.locals;
      entry.fluoroMaterial = fMat;
      entry.antibodyMaterial = abMat;
      writeFluorochromeMatrices(entry, 1, null);
      entry.fluoroResting = true;
    }

    markerInstances[key] = entry;
  });

  // Focus-mode registry: which materials belong to which CD, and which belong
  // to the cell itself. Hovering a marker — or firing a laser — fades the whole
  // cell and every off-target receptor so the CD under discussion is the only
  // thing still lit.
  const focusMaterials = { perMarker: {}, structure: [] };
  const ownedByMarker = new Set();
  Object.entries(markerInstances).forEach(([key, entry]) => {
    const mats = entry.bodyMaterials.slice();
    if (entry.antibodyMaterial) mats.push(entry.antibodyMaterial);
    if (entry.fluoroMaterial) mats.push(entry.fluoroMaterial);
    focusMaterials.perMarker[key] = mats;
    mats.forEach(m => ownedByMarker.add(m));
  });
  // Everything else under cellGroup is structure: cytoplasm, bilayer, rim,
  // halo, wireframe, nucleus, nucleoli, granules, Auer rods, blebs.
  cellGroup.traverse(obj => {
    if (!obj.material) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    mats.forEach(m => {
      if (!ownedByMarker.has(m) && focusMaterials.structure.indexOf(m) === -1) {
        focusMaterials.structure.push(m);
      }
    });
  });
  // Snapshot resting colour/opacity/glow now, while nothing is dimmed — the
  // hover highlight restores from the same snapshot.
  focusMaterials.structure.forEach(captureFocusBase);
  Object.values(focusMaterials.perMarker).forEach(mats => mats.forEach(captureFocusBase));

  // =========================================================================
  // Fluidics: sample injection, sheath chamber, quartz cuvette, waste
  // =========================================================================
  const fluidicsGroup = new THREE.Group();
  fluidicsGroup.visible = isFluidicsActive;
  scene.add(fluidicsGroup);

  // -- Sample injection tube (the "nozzle") ---------------------------------
  const nozzleMesh = new THREE.Group();
  nozzleMesh.visible = isFluidicsActive;
  scene.add(nozzleMesh);

  const steelMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.28 });
  const sitBody = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 2.6, 20), steelMat);
  sitBody.position.y = FLOW.ySit + 1.9;
  nozzleMesh.add(sitBody);

  const sitTip = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.22, 0.9, 20), steelMat);
  sitTip.position.y = FLOW.ySit + 0.15;
  nozzleMesh.add(sitTip);

  const sitCollar = new THREE.Mesh(new THREE.TorusGeometry(0.30, 0.06, 10, 24), steelMat);
  sitCollar.rotation.x = Math.PI / 2;
  sitCollar.position.y = FLOW.ySit + 0.65;
  nozzleMesh.add(sitCollar);

  const sitLabel = makeLabelSprite('Sample injection tube', '#e2e8f0', 0.0032);
  sitLabel.position.set(2.6, FLOW.ySit + 2.5, 0);
  nozzleMesh.add(sitLabel);

  // -- Flow chamber: tapering sheath body + square quartz cuvette -----------
  const glassMesh = new THREE.Group();
  glassMesh.visible = isFluidicsActive;
  scene.add(glassMesh);

  const profilePoints = [];
  const steps = 72;
  for (let i = 0; i <= steps; i++) {
    const y = FLOW.yBot + (FLOW.yTop - FLOW.yBot) * (i / steps);
    profilePoints.push(new THREE.Vector2(chamberRadiusAt(y), y));
  }

  const chamberGeom = new THREE.LatheGeometry(profilePoints, 48);
  const chamberMat = new THREE.MeshPhongMaterial({
    color: 0x7dd3fc,
    transparent: true,
    opacity: 0.075,
    side: THREE.DoubleSide,
    depthWrite: false,
    shininess: 90,
    specular: 0x93c5fd
  });
  const chamberMesh = new THREE.Mesh(chamberGeom, chamberMat);
  chamberMesh.renderOrder = 20;
  glassMesh.add(chamberMesh);

  const chamberRim = new THREE.Mesh(chamberGeom, makeFresnelMaterial(0x38bdf8, 2.2, 0.5, THREE.DoubleSide));
  chamberRim.renderOrder = 21;
  glassMesh.add(chamberRim);

  // Profile ribs, so the taper is legible from any angle.
  const ribMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.28 });
  for (let a = 0; a < 8; a++) {
    const ang = (a / 8) * Math.PI * 2;
    const pts = profilePoints.map(p => new THREE.Vector3(Math.cos(ang) * p.x, p.y, Math.sin(ang) * p.x));
    glassMesh.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), ribMat));
  }

  // The interrogation point on a real instrument is a square quartz flow cell.
  const cuvetteH = FLOW.yCuvetteTop - FLOW.yCuvetteBot;
  const cuvetteGeom = new THREE.BoxGeometry(3.05, cuvetteH, 3.05);
  const cuvetteMesh = new THREE.Mesh(cuvetteGeom, new THREE.MeshPhongMaterial({
    color: 0xbae6fd, transparent: true, opacity: 0.07, side: THREE.DoubleSide,
    depthWrite: false, shininess: 100, specular: 0xffffff
  }));
  cuvetteMesh.position.y = (FLOW.yCuvetteTop + FLOW.yCuvetteBot) / 2;
  cuvetteMesh.renderOrder = 22;
  glassMesh.add(cuvetteMesh);

  const cuvetteEdges = new THREE.LineSegments(
    new THREE.EdgesGeometry(cuvetteGeom),
    new THREE.LineBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.5 })
  );
  cuvetteEdges.position.copy(cuvetteMesh.position);
  glassMesh.add(cuvetteEdges);

  const cuvetteLabel = makeLabelSprite('Quartz flow cell', '#67e8f9', 0.0032);
  cuvetteLabel.position.set(-2.5, FLOW.yCuvetteTop + 0.3, 1.4);
  glassMesh.add(cuvetteLabel);

  const focusLabel = makeLabelSprite('Hydrodynamic focusing', '#7dd3fc', 0.0032);
  focusLabel.position.set(3.0, FLOW.yTaperTop - 0.5, 0);
  glassMesh.add(focusLabel);

  // -- Sheath fluid particles ----------------------------------------------
  const linesGroup = new THREE.Group();
  linesGroup.visible = isFluidicsActive;
  scene.add(linesGroup);

  const SHEATH_N = 520;
  const sheathPositions = new Float32Array(SHEATH_N * 3);
  const sheathState = [];
  for (let i = 0; i < SHEATH_N; i++) {
    sheathState.push({
      angle: Math.random() * Math.PI * 2,
      rFrac: 0.28 + Math.random() * 0.70,
      y: FLOW.yBot + Math.random() * (FLOW.yTop - FLOW.yBot),
      speed: 0.055 + Math.random() * 0.035,
      spin: (Math.random() < 0.5 ? -1 : 1) * (0.006 + Math.random() * 0.012)
    });
  }
  const sheathGeom = new THREE.BufferGeometry();
  sheathGeom.setAttribute('position', new THREE.BufferAttribute(sheathPositions, 3));
  const sheathMat = new THREE.PointsMaterial({
    size: 0.19,
    map: glowTex,
    color: 0x7dd3fc,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true
  });
  const sheathPoints = new THREE.Points(sheathGeom, sheathMat);
  sheathPoints.renderOrder = 18;
  linesGroup.add(sheathPoints);

  const sheathLabel = makeLabelSprite('Sheath fluid', '#38bdf8', 0.0032);
  sheathLabel.position.set(-3.1, FLOW.yTaperTop + 1.6, 0);
  linesGroup.add(sheathLabel);

  // Sheath inlets feeding the chamber from the sides.
  [-1, 1].forEach(sign => {
    const inlet = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 2.2, 12), steelMat);
    inlet.position.set(sign * 2.6, FLOW.yTop - 1.0, 0);
    inlet.rotation.z = sign * Math.PI / 3.2;
    linesGroup.add(inlet);
  });

  // -- Sample core stream (narrows through the taper) -----------------------
  const corePoints = [];
  for (let i = 0; i <= steps; i++) {
    const y = FLOW.ySit - 0.1 + (FLOW.yBot - FLOW.ySit + 0.1) * (i / steps);
    corePoints.push(new THREE.Vector2(Math.max(0.35, chamberRadiusAt(y) * 0.62), y));
  }
  corePoints.reverse();
  const coreGeom = new THREE.LatheGeometry(corePoints, 32);
  const coreMat = new THREE.MeshBasicMaterial({
    map: streamTex,
    color: 0x22d3ee,
    transparent: true,
    opacity: 0.42,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  streamTex.repeat.set(1, 4);
  const coreMesh = new THREE.Mesh(coreGeom, coreMat);
  coreMesh.renderOrder = 19;
  linesGroup.add(coreMesh);

  const coreLabel = makeLabelSprite('Sample core stream', '#22d3ee', 0.0032);
  coreLabel.position.set(2.4, 3.9, 0);
  linesGroup.add(coreLabel);

  // =========================================================================
  // Optics: laser sources, beams, detectors
  // =========================================================================
  const laserBeams = {};
  const laserGlows = {};
  const laserConfig = {
    violet: { color: 0xa855f7, y: FLOW.laserY.violet, label: '405 nm violet' },
    blue: { color: 0x3b82f6, y: FLOW.laserY.blue, label: '488 nm blue' },
    red: { color: 0xef4444, y: FLOW.laserY.red, label: '633 nm red' }
  };

  Object.entries(laserConfig).forEach(([laserKey, config]) => {
    const beamGeom = new THREE.CylinderGeometry(0.15, 0.15, 24, 14, 1, true);
    beamGeom.rotateZ(Math.PI / 2);
    const beamMat = new THREE.MeshBasicMaterial({
      color: config.color,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const beam = new THREE.Mesh(beamGeom, beamMat);
    // Real interrogation beams are focused to a flat ellipse: wide across the
    // stream, thin along the direction of flow.
    beam.scale.set(1, 0.30, 1.7);
    beam.position.set(-2, config.y, 0);
    beam.renderOrder = 24;
    scene.add(beam);
    laserBeams[laserKey] = beam;

    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex, color: config.color, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false
    }));
    glow.scale.set(2.0, 1.0, 1);
    glow.position.set(0, config.y, 0);
    glow.renderOrder = 30;
    scene.add(glow);
    laserGlows[laserKey] = glow;

    // Source housing + focusing lens.
    const housing = new THREE.Group();
    housing.position.set(-9.4, config.y, 0);
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.7, 0.7), new THREE.MeshStandardMaterial({
      color: 0x1e293b, metalness: 0.7, roughness: 0.4
    }));
    housing.add(body);
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.22, 20), new THREE.MeshStandardMaterial({
      color: config.color, emissive: config.color, emissiveIntensity: 0.7, roughness: 0.15, metalness: 0.3
    }));
    lens.rotation.z = Math.PI / 2;
    lens.position.x = 0.95;
    housing.add(lens);
    const lbl = makeLabelSprite(config.label, '#' + new THREE.Color(config.color).getHexString(), 0.0030);
    lbl.position.set(-0.1, 0.72, 0);
    housing.add(lbl);
    housing.visible = isFluidicsActive;
    fluidicsGroup.add(housing);
  });

  const detectorMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.65, roughness: 0.45 });

  // Forward scatter sits in line with the beam behind an obscuration bar.
  const fscDetector = new THREE.Group();
  fscDetector.position.set(8.8, 0, 0);
  const fscBody = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.1, 2.1), detectorMat);
  fscDetector.add(fscBody);
  const fscFace = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8), new THREE.MeshBasicMaterial({
    color: 0x0ea5e9, transparent: true, opacity: 0.25, side: THREE.DoubleSide
  }));
  fscFace.rotation.y = -Math.PI / 2;
  fscFace.position.x = -0.47;
  fscDetector.add(fscFace);
  const fscLabel = makeLabelSprite('FSC detector (size)', '#7dd3fc', 0.0032);
  fscLabel.position.set(0, 1.6, 0);
  fscDetector.add(fscLabel);
  fluidicsGroup.add(fscDetector);

  const obscurationBar = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.5, 2.2), new THREE.MeshStandardMaterial({
    color: 0x0f172a, metalness: 0.4, roughness: 0.7
  }));
  obscurationBar.position.set(6.4, 0, 0);
  fluidicsGroup.add(obscurationBar);
  const obscurationLabel = makeLabelSprite('Obscuration bar', '#94a3b8', 0.0028);
  obscurationLabel.position.set(6.4, 0.85, 0);
  fluidicsGroup.add(obscurationLabel);

  // Side scatter and fluorescence are collected at 90 degrees to the beam.
  const sscDetector = new THREE.Group();
  sscDetector.position.set(0, 0, -8.4);
  const sscBody = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.1, 0.9), detectorMat);
  sscDetector.add(sscBody);
  const sscFace = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.9), new THREE.MeshBasicMaterial({
    color: 0x22d3ee, transparent: true, opacity: 0.25, side: THREE.DoubleSide
  }));
  sscFace.position.z = 0.47;
  sscDetector.add(sscFace);
  const sscLabel = makeLabelSprite('SSC + fluorescence (90°)', '#22d3ee', 0.0032);
  sscLabel.position.set(0, 1.6, 0);
  sscDetector.add(sscLabel);
  fluidicsGroup.add(sscDetector);

  // =========================================================================
  // Scatter + fluorescence emission from the interrogated cell
  // =========================================================================
  const scatterGroup = new THREE.Group();
  scatterGroup.visible = false;
  scene.add(scatterGroup);

  // FSC: a narrow forward cone continuing along the beam axis.
  const fscConeGeom = new THREE.ConeGeometry(1, 8, 26, 1, true);
  fscConeGeom.rotateZ(-Math.PI / 2);
  fscConeGeom.translate(4, 0, 0);
  const fscConeMat = new THREE.MeshBasicMaterial({
    color: 0xbae6fd, transparent: true, opacity: 0, blending: THREE.AdditiveBlending,
    depthWrite: false, side: THREE.DoubleSide
  });
  const fscLine = new THREE.Mesh(fscConeGeom, fscConeMat);
  scatterGroup.add(fscLine);

  // SSC: a radial starburst, biased toward the 90-degree collection optics.
  const sscLine = new THREE.Group();
  const sscRayMat = new THREE.MeshBasicMaterial({
    color: 0xe0f2fe, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false
  });
  const sscRayGeom = new THREE.CylinderGeometry(0.012, 0.055, 3.0, 5);
  sscRayGeom.translate(0, 2.4, 0);
  for (let i = 0; i < 26; i++) {
    const ray = new THREE.Mesh(sscRayGeom, sscRayMat);
    const t = (i + 0.5) / 26;
    const yy = 1 - t * 2;
    const rr = Math.sqrt(Math.max(0, 1 - yy * yy));
    const th = 2.399963 * i;
    const dir = new THREE.Vector3(Math.cos(th) * rr * 0.85, yy * 0.55, -(Math.abs(Math.sin(th) * rr) + 0.35)).normalize();
    ray.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    sscLine.add(ray);
  }
  scatterGroup.add(sscLine);

  const sscGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex, color: 0xffffff, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false
  }));
  sscGlow.scale.set(3.2, 3.2, 1);
  scatterGroup.add(sscGlow);

  // Fluorescence emission travelling to the 90-degree detector.
  const emissionBeamMat = new THREE.MeshBasicMaterial({
    color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending,
    depthWrite: false, side: THREE.DoubleSide
  });
  const emissionBeamGeom = new THREE.CylinderGeometry(0.9, 0.05, 8.0, 18, 1, true);
  emissionBeamGeom.rotateX(-Math.PI / 2);
  emissionBeamGeom.translate(0, 0, -4.0);
  const emissionBeam = new THREE.Mesh(emissionBeamGeom, emissionBeamMat);
  scatterGroup.add(emissionBeam);

  const cellFlash = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex, color: 0xffffff, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false
  }));
  cellFlash.scale.set(4.0, 4.0, 1);
  scene.add(cellFlash);

  let hasBeepedViolet = false;
  let hasBeepedBlue = false;
  let hasBeepedRed = false;

  // =========================================================================
  // Interaction — drag orbits the camera, wheel zooms
  // =========================================================================
  let isDragging = false;
  let prevMousePos = { x: 0, y: 0 };
  let autoRotate = true;
  let autoRotateTimer = null;
  let camYaw = 0.62;
  let camPitch = 0.14;

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
    camYaw -= deltaX * 0.007;
    camPitch = THREE.MathUtils.clamp(camPitch + deltaY * 0.005, -1.15, 1.15);
    prevMousePos = { x: e.clientX, y: e.clientY };
  };

  const onMouseUp = () => {
    isDragging = false;
    autoRotateTimer = setTimeout(() => { autoRotate = true; }, 3000);
  };

  const onWheel = (e) => {
    e.preventDefault();
    zoomFactor -= e.deltaY * 0.002;
    zoomFactor = Math.max(0.4, Math.min(2.5, zoomFactor));
    updateZoomUI();
  };

  renderer.domElement.addEventListener('mousedown', onMouseDown);
  renderer.domElement.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
  renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

  const camTarget = new THREE.Vector3(0, 0, 0);
  camera.position.set(0, 2, 14);

  threeJSData = {
    renderer,
    scene,
    camera,
    cellGroup,
    markerInstances,
    antibodyMeshes,
    focusMaterials,
    laserBeams,
    nozzleMesh,
    glassMesh,
    linesGroup,
    fscLine,
    sscLine,
    profile,
    animationFrameId: null,
    autoRotate: () => autoRotate,
    cleanup: () => {
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('wheel', onWheel);
      if (autoRotateTimer) clearTimeout(autoRotateTimer);
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      scene.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach(m => {
            if (m.map && m.map.dispose) m.map.dispose();
            m.dispose();
          });
        }
      });
      disposables.forEach(d => d && d.dispose && d.dispose());
      renderer.dispose();
    }
  };

  const sizeF = cellTypeSizeMultiplier(cellType);
  const granF = cellTypeGranularityMultiplier(cellType);
  // Keep every cell comfortably in frame regardless of its modelled radius.
  const frameScale = 3.15 / R;

  let viewOffsetActive = null;
  let viewOffsetPanel = null;
  const applyViewOffset = () => {
    if (!viewOffsetPanel) viewOffsetPanel = document.getElementById('simulator-panel');
    const panelShown = viewOffsetPanel && viewOffsetPanel.style.display !== 'none';
    const shift = (isFluidicsActive && panelShown) ? 0.15 : 0;
    if (shift === viewOffsetActive) return;
    viewOffsetActive = shift;
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (shift === 0) camera.clearViewOffset();
    else camera.setViewOffset(w, h, w * shift, 0, w, h);
  };

  // Reused every frame so the loop allocates nothing.
  const desiredCamPos = new THREE.Vector3();
  const targetScaleVec = new THREE.Vector3();

  // Frame-time watchdog. If the machine cannot hold ~50fps we render at a
  // lower internal resolution rather than letting the whole simulation crawl.
  let slowFrames = 0;
  let fastFrames = 0;
  const adaptQuality = (frameMs) => {
    if (frameMs > 22 && qualityScale > 0.65) {
      slowFrames++; fastFrames = 0;
      if (slowFrames > 45) {
        slowFrames = 0;
        qualityScale = Math.max(0.65, qualityScale - 0.175);
        renderer.setPixelRatio(MAX_DPR * qualityScale);
      }
    } else if (frameMs < 15 && qualityScale < 1) {
      fastFrames++; slowFrames = 0;
      if (fastFrames > 240) {
        fastFrames = 0;
        qualityScale = Math.min(1, qualityScale + 0.175);
        renderer.setPixelRatio(MAX_DPR * qualityScale);
      }
    } else {
      slowFrames = 0; fastFrames = 0;
    }
  };

  let prevFrameTime = performance.now();

  const animate = () => {
    threeJSData.animationFrameId = requestAnimationFrame(animate);

    // A background tab still gets the odd rAF on some browsers; skip the work.
    if (document.hidden) return;

    const nowMs = performance.now();
    const frameMs = nowMs - prevFrameTime;
    prevFrameTime = nowMs;
    adaptQuality(frameMs);
    // Every increment below is authored per 60Hz frame. Scaling by `step`
    // keeps the animation running at the same wall-clock speed on a slow
    // machine instead of turning into slow motion. Clamped so a tab-switch
    // stall cannot teleport the cell down the flow cell.
    const step = Math.min(3, Math.max(0.2, frameMs / 16.667));

    const time = nowMs * 0.001;

    // ---- Camera ------------------------------------------------------------
    camTarget.y += ((isFluidicsActive ? -0.2 : 0) - camTarget.y) * Math.min(1, 0.08 * step);
    const dist = (isFluidicsActive ? 26.5 : 13.5) / zoomFactor;
    const cp = Math.cos(camPitch);
    desiredCamPos.set(
      camTarget.x + dist * cp * Math.sin(camYaw),
      camTarget.y + dist * Math.sin(camPitch),
      camTarget.z + dist * cp * Math.cos(camYaw)
    );
    camera.position.lerp(desiredCamPos, Math.min(1, 0.09 * step));
    camera.lookAt(camTarget);

    // The simulator panel floats over the right of the canvas, so bias the
    // frustum to keep the whole optical bench in the clear area beside it.
    applyViewOffset();

    // ---- Fluidics visibility -----------------------------------------------
    nozzleMesh.visible = isFluidicsActive;
    glassMesh.visible = isFluidicsActive;
    linesGroup.visible = isFluidicsActive;
    fluidicsGroup.visible = isFluidicsActive;

    // ---- Sheath fluid: converges and accelerates through the taper ---------
    if (isFluidicsActive) {
      const pos = sheathGeom.attributes.position;
      for (let i = 0; i < SHEATH_N; i++) {
        const s = sheathState[i];
        const r = chamberRadiusAt(s.y);
        // Mass continuity: as the bore narrows the fluid speeds up and the
        // swirl tightens.
        const accel = Math.min(4.2, Math.pow(FLOW.rWide / r, 1.35));
        s.y -= s.speed * accel * step;
        s.angle += s.spin * accel * step;
        if (s.y < FLOW.yBot) {
          s.y = FLOW.yTop;
          s.angle = Math.random() * Math.PI * 2;
          s.rFrac = 0.28 + Math.random() * 0.70;
        }
        const rr = chamberRadiusAt(s.y) * s.rFrac;
        pos.setXYZ(i, Math.cos(s.angle) * rr, s.y, Math.sin(s.angle) * rr);
      }
      pos.needsUpdate = true;
      streamTex.offset.y = (streamTex.offset.y + 0.028 * step) % 1;
      coreMat.opacity = 0.30 + 0.10 * Math.sin(time * 3);
    }

    // ---- Cell transport ----------------------------------------------------
    let scatterEnvelope = 0;
    let firingLaser = null;

    if (isFluidicsActive && isInjecting) {
      const p = injectionProgress;
      cellGroup.position.y = cellPathY(p);

      // Hydrodynamic focusing: the cell enters off-axis, spirals inward and is
      // centred well before it reaches the first beam.
      const focus = Math.max(0, 1 - p / 0.26);
      const focusEase = focus * focus;
      const spiral = p * 26;
      cellGroup.position.x = Math.cos(spiral) * 1.35 * focusEase;
      cellGroup.position.z = Math.sin(spiral) * 1.35 * focusEase;

      // Cells tumble in the wide chamber and are aligned by the time they are
      // interrogated — which is exactly why focusing improves CV.
      cellGroup.rotation.y += (0.004 + 0.055 * focusEase) * step;
      cellGroup.rotation.x += 0.035 * focusEase * step;
      cellGroup.rotation.z = cellGroup.rotation.z * Math.pow(1 - 0.06, step);

      const conjugate = { violet: 0, blue: 0, red: 0 };
      if (isConjugationActive) {
        markersList.forEach(([key, m]) => {
          const abData = MARKER_FLUOROCHROMES[key];
          if (!abData) return;
          const exprVal = m.expression === 'Very Bright' ? 1.0
            : (m.expression === 'Bright' ? 0.8 : (m.expression === 'Moderate' ? 0.5 : 0.2));
          conjugate[abData.laser] = Math.max(conjugate[abData.laser], exprVal);
        });
      }

      const envelope = (centre) => Math.exp(-Math.pow((p - centre) / 0.04, 2));
      const eV = envelope(FLOW.laserProgress.violet);
      const eB = envelope(FLOW.laserProgress.blue);
      const eR = envelope(FLOW.laserProgress.red);

      const vPulse = activeLasers.violet ? (0.15 * sizeF + conjugate.violet * 0.75) * eV : 0;
      const bPulse = activeLasers.blue ? (0.15 * sizeF + conjugate.blue * 0.75) * eB : 0;
      const rPulse = activeLasers.red ? (0.15 * sizeF + conjugate.red * 0.75) * eR : 0;

      const totalPulse = Math.min(1.0, vPulse + bPulse + rPulse);
      updateOscilloscope(totalPulse);

      // Scatter happens whenever a beam illuminates the cell, whether or not
      // any antibody is bound — fluorescence needs the conjugate.
      const envelopes = [
        { key: 'violet', e: activeLasers.violet ? eV : 0 },
        { key: 'blue', e: activeLasers.blue ? eB : 0 },
        { key: 'red', e: activeLasers.red ? eR : 0 }
      ];
      envelopes.forEach(x => {
        if (x.e > scatterEnvelope) {
          scatterEnvelope = x.e;
          firingLaser = x.key;
        }
      });

      // ---- Scatter + emission visuals -------------------------------------
      scatterGroup.visible = scatterEnvelope > 0.01;
      scatterGroup.position.set(cellGroup.position.x, cellGroup.position.y, cellGroup.position.z);

      if (scatterGroup.visible) {
        const beamColour = laserConfig[firingLaser || 'blue'].color;
        fscConeMat.color.set(beamColour);
        sscRayMat.color.set(beamColour);
        sscGlow.material.color.set(beamColour);

        const fscMag = scatterEnvelope * (0.28 + sizeF);
        fscConeMat.opacity = Math.min(0.42, fscMag * 0.5);
        const coneWidth = 0.35 + sizeF * 0.9;
        fscLine.scale.set(1, coneWidth, coneWidth);

        const sscMag = scatterEnvelope * (0.10 + granF * 1.05);
        sscRayMat.opacity = Math.min(0.5, sscMag * 0.45);
        const rayScale = 0.45 + granF * 1.25;
        sscLine.scale.setScalar(rayScale * (0.85 + 0.15 * Math.sin(time * 22)));
        sscGlow.material.opacity = Math.min(0.38, sscMag * 0.32);
        sscGlow.scale.setScalar(1.5 + granF * 2.2);

        const emissionColour = (() => {
          if (!isConjugationActive || !firingLaser) return null;
          let best = null;
          let bestVal = 0;
          markersList.forEach(([key, m]) => {
            const abData = MARKER_FLUOROCHROMES[key];
            if (!abData || abData.laser !== firingLaser) return;
            const exprVal = m.expression === 'Very Bright' ? 1.0
              : (m.expression === 'Bright' ? 0.8 : (m.expression === 'Moderate' ? 0.5 : 0.2));
            if (exprVal > bestVal) { bestVal = exprVal; best = abData.emissionColor; }
          });
          return best ? { colour: best, strength: bestVal } : null;
        })();

        if (emissionColour) {
          emissionBeamMat.color.set(emissionColour.colour);
          emissionBeamMat.opacity = Math.min(0.34, scatterEnvelope * emissionColour.strength * 0.38);
          cellFlash.material.color.set(emissionColour.colour);
        } else {
          emissionBeamMat.opacity = 0;
          cellFlash.material.color.set(laserConfig[firingLaser || 'blue'].color);
        }

        cellFlash.position.copy(cellGroup.position);
        cellFlash.material.opacity = Math.min(0.26, scatterEnvelope * 0.22);
        cellFlash.scale.setScalar(1.3 + sizeF * 1.2);
      } else {
        cellFlash.material.opacity = 0;
        emissionBeamMat.opacity = 0;
      }

      // ---- Audio -----------------------------------------------------------
      if (p >= FLOW.laserProgress.violet && p < FLOW.laserProgress.violet + 0.04 && !hasBeepedViolet) {
        hasBeepedViolet = true;
        if (activeLasers.violet) FlowSoundSynth.playCellBeep(cellType);
      }
      if (p >= FLOW.laserProgress.blue && p < FLOW.laserProgress.blue + 0.04 && !hasBeepedBlue) {
        hasBeepedBlue = true;
        if (activeLasers.blue) FlowSoundSynth.playCellBeep(cellType);
      }
      if (p >= FLOW.laserProgress.red && p < FLOW.laserProgress.red + 0.04 && !hasBeepedRed) {
        hasBeepedRed = true;
        if (activeLasers.red) FlowSoundSynth.playCellBeep(cellType);
      }

      injectionProgress += 0.0065 * step;
      if (injectionProgress >= 1.0) {
        isInjecting = false;
        injectionProgress = 0;
        hasBeepedViolet = false;
        hasBeepedBlue = false;
        hasBeepedRed = false;
        scatterGroup.visible = false;
        cellFlash.material.opacity = 0;
        drawOscilloscopeCompleted();
        plotInterrogatedCellEvent();
      }
    } else {
      scatterGroup.visible = false;
      cellFlash.material.opacity = 0;
      if (isFluidicsActive) {
        cellGroup.position.set(0, FLOW.ySit - 0.35, 0);
        cellGroup.rotation.y += 0.006 * step;
        cellGroup.rotation.x += 0.003 * step;
      } else {
        cellGroup.position.set(0, 0, 0);
        if (autoRotate) {
          cellGroup.rotation.y += 0.0035 * step;
          cellGroup.rotation.x += 0.0009 * step;
        }
      }
    }

    // ---- Cell scale and membrane life --------------------------------------
    const breathe = 1 + 0.014 * Math.sin(time * 1.9);
    const modeScale = isFluidicsActive ? 0.27 : 1.0;
    const target = frameScale * modeScale * breathe;
    cellGroup.scale.lerp(targetScaleVec.set(target, target, target), Math.min(1, 0.12 * step));

    membraneMeshes.forEach((m, i) => {
      m.scale.set(
        1 + 0.013 * Math.sin(time * 1.6 + i),
        1 + 0.013 * Math.sin(time * 1.9 + 2.1 + i),
        1 + 0.013 * Math.sin(time * 1.3 + 4.2 + i)
      );
    });

    // Cytoplasmic streaming.
    granuleGroups.forEach(g => {
      g.rotation.y += 0.0013 * step;
      g.rotation.x += 0.0007 * step;
    });

    // ---- Laser beams --------------------------------------------------------
    Object.entries(laserBeams).forEach(([laserKey, beam]) => {
      const on = isFluidicsActive && activeLasers[laserKey];
      const targetOpacity = on ? 0.16 + 0.035 * Math.sin(time * 11) : 0;
      beam.material.opacity += (targetOpacity - beam.material.opacity) * Math.min(1, 0.15 * step);
      beam.visible = beam.material.opacity > 0.002;

      const glow = laserGlows[laserKey];
      const hit = (firingLaser === laserKey) ? scatterEnvelope : 0;
      const glowTarget = on ? 0.14 + 0.26 * hit : 0;
      glow.material.opacity += (glowTarget - glow.material.opacity) * Math.min(1, 0.2 * step);
      glow.visible = glow.material.opacity > 0.002;
      glow.scale.set(1.25 + hit * 1.0, 0.5 + hit * 0.55, 1);
    });

    // ---- Fluorochrome excitation -------------------------------------------
    markersList.forEach(([key]) => {
      const abData = MARKER_FLUOROCHROMES[key];
      const entry = markerInstances[key];
      if (!abData || !entry || !entry.fluoro) return;
      const isExcited = isConjugationActive && activeLasers[abData.laser];
      // Focus mode scales the glow so an off-target dye stays faded even while
      // its laser is firing.
      const focusMul = entry.fluoroMaterial.userData.focusMul || 1;
      if (isExcited) {
        entry.fluoroMaterial.emissiveIntensity = (0.7 + 1.1 * (0.5 + 0.5 * Math.sin(time * 6))) * focusMul;
        writeFluorochromeMatrices(entry, 1, time);
        entry.fluoroResting = false;
      } else if (!entry.fluoroResting) {
        // Only rewrite the matrices on the transition back to resting, not on
        // every idle frame.
        entry.fluoroMaterial.emissiveIntensity = 0.35 * focusMul;
        writeFluorochromeMatrices(entry, 1, null);
        entry.fluoroResting = true;
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
    viewOffsetActive = null; // force the frustum bias to be recomputed at the new size
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
  
  const onWheel = (e) => {
    e.preventDefault();
    zoomFactor -= e.deltaY * 0.002;
    zoomFactor = Math.max(0.4, Math.min(2.5, zoomFactor));
    updateZoomUI();
  };

  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  
  canvas3DData = {
    canvas,
    cleanup: () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('wheel', onWheel);
      if (autoRotateTimer) clearTimeout(autoRotateTimer);
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    },
    markers,
    highlightedKey: null,
    // Set of CD keys to keep lit, or null for "show everything".
    focusKeys: null
  };
  
  const distance = 400;
  const centerX = width / 2;
  const centerY = height / 2;
  
  let cellYOffset = 0;
  let hasBeepedViolet = false;
  let hasBeepedBlue = false;
  let hasBeepedRed = false;
  
  function project(x, y, z) {
    const scale = (isFluidicsActive ? 0.45 : 1.0) * zoomFactor;
    x *= scale;
    y *= scale;
    z *= scale;
    
    const x1 = x * Math.cos(ry) - z * Math.sin(ry);
    const z1 = x * Math.sin(ry) + z * Math.cos(ry);
    
    const y2 = y * Math.cos(rx) - z1 * Math.sin(rx);
    const z2 = y * Math.sin(rx) + z1 * Math.cos(rx);
    
    const finalY = y2 - cellYOffset;
    
    let finalX = x1;
    if (isFluidicsActive && isInjecting) {
      const focusFactor = Math.max(0, 1 - (injectionProgress * 2));
      finalX += 25 * focusFactor;
    }
    
    const perspective = distance / (z2 + distance);
    const sx = centerX + finalX * perspective;
    const sy = centerY + finalY * perspective;
    
    return { sx, sy, sz: z2 };
  }
  
  let frameId;
  function draw() {
    if (!canvas3DData) return;
    
    ctx.clearRect(0, 0, width, height);
    
    if (isFluidicsActive) {
      if (isInjecting) {
        cellYOffset = 170 - 340 * injectionProgress;
      } else {
        cellYOffset = 170;
      }
    } else {
      cellYOffset = 0;
    }
    
    if (isFluidicsActive && isInjecting) {
      const cellType = currentInterrogatedCellType;
      const details = CELL_DETAILS[cellType] || CELL_DETAILS.Debris;
      const size = cellTypeSizeMultiplier(cellType);
      
      let hasVioletConjugate = 0;
      let hasBlueConjugate = 0;
      let hasRedConjugate = 0;
      
      if (isConjugationActive) {
        Object.entries(details.markers).forEach(([key, m]) => {
          const abData = MARKER_FLUOROCHROMES[key];
          if (abData) {
            const exprVal = m.expression === 'Very Bright' ? 1.0 : (m.expression === 'Bright' ? 0.8 : (m.expression === 'Moderate' ? 0.5 : 0.2));
            if (abData.laser === 'violet') hasVioletConjugate = Math.max(hasVioletConjugate, exprVal);
            if (abData.laser === 'blue') hasBlueConjugate = Math.max(hasBlueConjugate, exprVal);
            if (abData.laser === 'red') hasRedConjugate = Math.max(hasRedConjugate, exprVal);
          }
        });
      }
      
      const vPulse = activeLasers.violet ? (0.15 * size + (hasVioletConjugate * 0.75)) * Math.exp(-Math.pow((injectionProgress - 0.31)/0.04, 2)) : 0;
      const bPulse = activeLasers.blue ? (0.15 * size + (hasBlueConjugate * 0.75)) * Math.exp(-Math.pow((injectionProgress - 0.50)/0.04, 2)) : 0;
      const rPulse = activeLasers.red ? (0.15 * size + (hasRedConjugate * 0.75)) * Math.exp(-Math.pow((injectionProgress - 0.68)/0.04, 2)) : 0;
      
      const totalPulse = Math.min(1.0, vPulse + bPulse + rPulse);
      updateOscilloscope(totalPulse);
      
      if (totalPulse > 0.08) {
        ctx.strokeStyle = 'rgba(255, 255, 255, ' + (totalPulse * 0.7) + ')';
        ctx.lineWidth = 1.5;
        const cellPt = project(0, 0, 0);
        
        ctx.beginPath();
        ctx.moveTo(cellPt.sx, cellPt.sy);
        ctx.lineTo(width, cellPt.sy);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(cellPt.sx, cellPt.sy);
        ctx.lineTo(cellPt.sx, 0);
        ctx.stroke();
      }
      
      if (injectionProgress >= 0.31 && injectionProgress < 0.35 && !hasBeepedViolet) {
        hasBeepedViolet = true;
        if (activeLasers.violet) FlowSoundSynth.playCellBeep(cellType);
      }
      if (injectionProgress >= 0.50 && injectionProgress < 0.54 && !hasBeepedBlue) {
        hasBeepedBlue = true;
        if (activeLasers.blue) FlowSoundSynth.playCellBeep(cellType);
      }
      if (injectionProgress >= 0.68 && injectionProgress < 0.72 && !hasBeepedRed) {
        hasBeepedRed = true;
        if (activeLasers.red) FlowSoundSynth.playCellBeep(cellType);
      }
      
      injectionProgress += 0.0065;
      if (injectionProgress >= 1.0) {
        isInjecting = false;
        injectionProgress = 0;
        hasBeepedViolet = false;
        hasBeepedBlue = false;
        hasBeepedRed = false;
        drawOscilloscopeCompleted();
        plotInterrogatedCellEvent();
      }
    }
    
    if (isFluidicsActive) {
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.07)';
      ctx.lineWidth = 1.5;
      const t = Date.now() * 0.01;
      for (let offset = -40; offset <= 40; offset += 20) {
        ctx.beginPath();
        const yPos = (t * 8) % height;
        ctx.moveTo(centerX + offset, 0);
        ctx.lineTo(centerX + offset, height);
        ctx.stroke();
      }
      
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(centerX - 60, 0);
      ctx.lineTo(centerX - 60, height);
      ctx.moveTo(centerX + 60, 0);
      ctx.lineTo(centerX + 60, height);
      ctx.stroke();
      
      ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
      ctx.beginPath();
      ctx.moveTo(centerX - 12, 0);
      ctx.lineTo(centerX - 35, 45);
      ctx.lineTo(centerX + 35, 45);
      ctx.lineTo(centerX + 12, 0);
      ctx.fill();
    }
    
    if (autoRotate && (!isFluidicsActive || !isInjecting)) {
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
    
    // Focus mode: fade the cell shell and nucleus so the marker(s) in focus
    // stand alone. Restored just after the nucleus is drawn.
    const focusKeys = canvas3DData.focusKeys;
    if (focusKeys) ctx.globalAlpha = 0.22;

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
    const scaleFactor = (isFluidicsActive ? 0.45 : 1.0) * zoomFactor;
    const coreRadius = radius * 0.45 * (distance / (corePt.sz + distance)) * scaleFactor;
    ctx.arc(corePt.sx, corePt.sy, coreRadius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    ctx.globalAlpha = 1;

    // Draw CD Markers
    const allMarkers = [];
    Object.entries(markers).forEach(([key, list]) => {
      const isHighlighted = (canvas3DData.highlightedKey === key);
      const isDimmed = !!focusKeys && !focusKeys.has(key);
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
          isDimmed,
          nx: m.nx,
          ny: m.ny,
          nz: m.nz
        });
      });
    });
    
    // Sort back-to-front
    allMarkers.sort((a, b) => b.sz - a.sz);
    
    allMarkers.forEach(m => {
      ctx.globalAlpha = m.isDimmed ? 0.15 : 1;

      ctx.strokeStyle = m.color;
      ctx.lineWidth = m.isHighlighted ? 3.5 : 1.5;
      ctx.beginPath();
      ctx.moveTo(m.basePt.sx, m.basePt.sy);
      ctx.lineTo(m.tipPt.sx, m.tipPt.sy);
      ctx.stroke();
      
      ctx.fillStyle = m.color;
      ctx.beginPath();
      const headRadius = (m.isHighlighted ? 6.5 : 4) * scaleFactor;
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
            const sx = m.tipPt.sx + ux * 8 * scaleFactor;
            const sy = m.tipPt.sy + uy * 8 * scaleFactor;
            
            // Left arm
            const lx = sx + ux * 6 * scaleFactor + px * 5 * scaleFactor;
            const ly = sy + uy * 6 * scaleFactor + py * 5 * scaleFactor;
            
            // Right arm
            const rx = sx + ux * 6 * scaleFactor - px * 5 * scaleFactor;
            const ry = sy + uy * 6 * scaleFactor - py * 5 * scaleFactor;
            
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
            const basePulse = isExcited ? 3 + 1.2 * Math.sin(Date.now() * 0.01) : 2;
            const pulseRadius = basePulse * scaleFactor;
            
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

    ctx.globalAlpha = 1;

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
  
  isFluidicsActive = false;
  isInjecting = false;
  injectionProgress = 0;
  
  const conjugationToggle = document.getElementById('sim-conjugation-toggle');
  if (conjugationToggle) conjugationToggle.checked = false;
  
  const fluidicsToggle = document.getElementById('sim-fluidics-toggle');
  if (fluidicsToggle) fluidicsToggle.checked = false;
  
  const fluidicsControlsContainer = document.getElementById('fluidics-controls-container');
  if (fluidicsControlsContainer) fluidicsControlsContainer.style.display = 'none';
  
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

  explorerHoverFocus = null;
  refreshExplorerFocus();

  const card = document.getElementById('explorer-conjugate-card');
  if (card) card.style.display = 'none';
  
  // Reset panel show/hide states
  const simulatorPanel = document.getElementById('simulator-panel');
  if (simulatorPanel) simulatorPanel.style.display = 'flex';
  const showSimulatorBtn = document.getElementById('show-simulator-btn');
  if (showSimulatorBtn) showSimulatorBtn.style.display = 'none';
  
  drawOscilloscopeReady();
}

function initSimulatorEvents() {
  const conjugationToggle = document.getElementById('sim-conjugation-toggle');
  const laserVioletBtn = document.getElementById('laser-violet-btn');
  const laserBlueBtn = document.getElementById('laser-blue-btn');
  const laserRedBtn = document.getElementById('laser-red-btn');
  const laserControlsContainer = document.getElementById('laser-controls-container');
  
  const fluidicsToggle = document.getElementById('sim-fluidics-toggle');
  const fluidicsControlsContainer = document.getElementById('fluidics-controls-container');
  const injectBtn = document.getElementById('sim-inject-btn');
  const volumeBtn = document.getElementById('sim-volume-btn');
  
  // Plots Panel Toggle Events
  const plotsToggleBtn = document.getElementById('explorer-plots-toggle-btn');
  const closePlotsPanelBtn = document.getElementById('close-plots-panel-btn');
  
  if (plotsToggleBtn) {
    plotsToggleBtn.addEventListener('click', toggleExplorerPlotsPanel);
  }
  if (closePlotsPanelBtn) {
    closePlotsPanelBtn.addEventListener('click', hideExplorerPlotsPanel);
  }
  
  // Panel show/hide controls
  const simulatorPanel = document.getElementById('simulator-panel');
  const hideSimulatorBtn = document.getElementById('hide-simulator-btn');
  const showSimulatorBtn = document.getElementById('show-simulator-btn');
  
  if (hideSimulatorBtn && simulatorPanel && showSimulatorBtn) {
    hideSimulatorBtn.addEventListener('click', () => {
      simulatorPanel.style.display = 'none';
      showSimulatorBtn.style.display = 'flex';
    });
    
    showSimulatorBtn.addEventListener('click', () => {
      simulatorPanel.style.display = 'flex';
      showSimulatorBtn.style.display = 'none';
    });
  }
  
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

      refreshExplorerFocus();
    });
  }
  
  const setupLaserToggle = (btn, colorKey) => {
    if (btn) {
      btn.addEventListener('click', () => {
        activeLasers[colorKey] = !activeLasers[colorKey];
        btn.classList.toggle('active', activeLasers[colorKey]);
        // Spotlight the conjugates this laser actually excites.
        refreshExplorerFocus();
      });
    }
  };
  
  setupLaserToggle(laserVioletBtn, 'violet');
  setupLaserToggle(laserBlueBtn, 'blue');
  setupLaserToggle(laserRedBtn, 'red');

  // Fluidics Interrogation Events
  if (fluidicsToggle) {
    fluidicsToggle.addEventListener('change', (e) => {
      isFluidicsActive = e.target.checked;
      isInjecting = false;
      injectionProgress = 0;
      
      if (fluidicsControlsContainer) {
        fluidicsControlsContainer.style.display = isFluidicsActive ? 'flex' : 'none';
      }
      
      drawOscilloscopeReady();
      
      // Sync ThreeJS model positions and visibility
      if (threeJSData) {
        if (threeJSData.nozzleMesh) threeJSData.nozzleMesh.visible = isFluidicsActive;
        if (threeJSData.glassMesh) threeJSData.glassMesh.visible = isFluidicsActive;
        if (threeJSData.linesGroup) threeJSData.linesGroup.visible = isFluidicsActive;
        
        if (isFluidicsActive) {
          threeJSData.cellGroup.position.set(0, 5.2, 0); // Position below nozzle mouth
        } else {
          threeJSData.cellGroup.position.set(0, 0, 0); // Center position
        }
      }
    });
  }

  if (injectBtn) {
    injectBtn.addEventListener('click', () => {
      if (isInjecting) return; // Prevent double injection
      
      // Initialize synth context on user interaction
      FlowSoundSynth.init();
      
      isInjecting = true;
      injectionProgress = 0;
      oscilloscopePoints = [];
      
      // Open graphs panel automatically when injection starts
      showExplorerPlotsPanel();
    });
  }

  if (volumeBtn) {
    // Sync initial class
    volumeBtn.classList.toggle('active', !FlowSoundSynth.isMuted);
    volumeBtn.addEventListener('click', () => {
      FlowSoundSynth.isMuted = !FlowSoundSynth.isMuted;
      volumeBtn.classList.toggle('active', !FlowSoundSynth.isMuted);
      
      // Initialize if unmuting
      if (!FlowSoundSynth.isMuted) {
        FlowSoundSynth.init();
        if (FlowSoundSynth.ctx && FlowSoundSynth.ctx.state === 'suspended') {
          FlowSoundSynth.ctx.resume();
        }
      }
    });
  }
}

let oscilloscopePoints = [];

function cellTypeSizeMultiplier(cellType) {
  switch (cellType) {
    case 'Monocyte': return 0.8;
    case 'Granulocyte': return 0.7;
    case 'AML_Blast':
    case 'AML_Blast_M0':
    case 'AML_Blast_M1':
    case 'AML_Blast_M2':
    case 'AML_Blast_M4_Blast':
    case 'AML_Blast_M6_Blast': return 0.65;
    case 'AML_Blast_M2_Maturing': return 0.7;
    case 'AML_Blast_M3': return 0.75;
    case 'AML_Blast_M4_Mono': return 0.8;
    case 'AML_Blast_M5': return 0.85;
    case 'AML_Blast_M6_Erythroid': return 0.35;
    case 'AML_Blast_M7': return 0.7;
    case 'CD4_TCell':
    case 'CD8_TCell':
    case 'gd_TCell':
    case 'BCell':
    case 'NKCell': return 0.45;
    case 'NormalProgenitor': return 0.5;
    case 'Doublets': return 0.9;
    case 'Debris': return 0.15;
    default: return 0.5;
  }
}

function cellTypeGranularityMultiplier(cellType) {
  switch (cellType) {
    case 'Granulocyte': return 0.9;
    case 'Monocyte': return 0.5;
    case 'AML_Blast':
    case 'AML_Blast_M0':
    case 'AML_Blast_M1':
    case 'AML_Blast_M2':
    case 'AML_Blast_M4_Blast':
    case 'AML_Blast_M6_Blast': return 0.45;
    case 'AML_Blast_M2_Maturing': return 0.6;
    case 'AML_Blast_M3': return 0.85;
    case 'AML_Blast_M4_Mono':
    case 'AML_Blast_M5': return 0.5;
    case 'AML_Blast_M6_Erythroid': return 0.15;
    case 'AML_Blast_M7': return 0.4;
    case 'Doublets': return 0.6;
    case 'NormalProgenitor': return 0.3;
    case 'CD4_TCell':
    case 'CD8_TCell':
    case 'gd_TCell':
    case 'BCell':
    case 'NKCell': return 0.2;
    case 'Debris': return 0.1;
    default: return 0.3;
  }
}

// The scope is redrawn on every frame of an injection, so the canvas lookup
// and its 2D context are cached rather than re-fetched 60 times a second.
let _scopeCanvas = null;
let _scopeCtx = null;
function oscilloscopeCtx() {
  const canvas = document.getElementById('oscilloscope-canvas');
  if (!canvas) return null;
  if (canvas !== _scopeCanvas) {
    _scopeCanvas = canvas;
    _scopeCtx = canvas.getContext('2d');
  }
  return _scopeCtx;
}

function updateOscilloscope(pulseValue) {
  const ctx = oscilloscopeCtx();
  if (!ctx) return;
  const canvas = _scopeCanvas;
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  // Grid — one path for all the verticals and one for all the horizontals
  // instead of a stroke() per line.
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.05)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x < w; x += 30) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
  }
  for (let y = 0; y < h; y += 20) {
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
  }
  ctx.stroke();

  // Append pulse value
  oscilloscopePoints.push(pulseValue);
  if (oscilloscopePoints.length > w) {
    oscilloscopePoints.shift();
  }
  
  // Neon green glow pulse line
  ctx.strokeStyle = '#00e5ff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  
  for (let i = 0; i < oscilloscopePoints.length; i++) {
    const x = i;
    const y = h - 10 - (oscilloscopePoints[i] * (h - 20));
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.font = '8px monospace';
  ctx.fillText(`PULSE: ${(pulseValue * 10).toFixed(2)} V`, 8, 12);
}

function drawOscilloscopeReady() {
  const canvas = document.getElementById('oscilloscope-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  
  ctx.clearRect(0, 0, w, h);
  
  // Grid
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.05)';
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
  
  // Flat line
  ctx.strokeStyle = '#00e5ff';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, h - 10);
  ctx.lineTo(w, h - 10);
  ctx.stroke();
  
  ctx.fillStyle = '#00e5ff';
  ctx.font = '9px monospace';
  ctx.fillText("READY - PRESS INJECT", 8, 14);
}

function drawOscilloscopeCompleted() {
  const canvas = document.getElementById('oscilloscope-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  
  ctx.fillStyle = '#00e5ff';
  ctx.font = '9px monospace';
  ctx.fillText("ACQUISITION COMPLETE", 8, 26);
}

function plotInterrogatedCellEvent() {
  const details = CELL_DETAILS[currentInterrogatedCellType] || CELL_DETAILS.Debris;
  
  if (typeof flowPlot !== 'undefined' && flowPlot) {
    flowPlot.addInterrogatedPoint(currentInterrogatedCellType);
  }
  if (typeof flowPlotAML !== 'undefined' && flowPlotAML) {
    flowPlotAML.addInterrogatedPoint(currentInterrogatedCellType);
  }
  
  // Add interrogated point flash to 3D explorer plots
  if (explorerPlotFscSsc) explorerPlotFscSsc.addInterrogatedPoint(currentInterrogatedCellType);
  if (explorerPlotCd45Ssc) explorerPlotCd45Ssc.addInterrogatedPoint(currentInterrogatedCellType);
  if (explorerPlotLineage) explorerPlotLineage.addInterrogatedPoint(currentInterrogatedCellType);
  
  const toast = document.createElement('div');
  toast.style.position = 'absolute';
  toast.style.bottom = '85px';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%)';
  toast.style.background = 'rgba(2, 6, 23, 0.9)';
  toast.style.border = '1px solid #00e5ff';
  toast.style.color = '#00e5ff';
  toast.style.padding = '8px 16px';
  toast.style.borderRadius = '20px';
  toast.style.fontWeight = '600';
  toast.style.fontSize = '11px';
  toast.style.boxShadow = '0 0 10px rgba(0, 229, 255, 0.3)';
  toast.style.zIndex = '100';
  toast.style.pointerEvents = 'none';
  toast.innerText = `Event plotted: ${details.name} (FSC, SSC, and fluorescence recorded)`;
  
  const container = document.getElementById('explorer-3d-container');
  if (container) {
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.transition = 'opacity 0.4s ease';
      toast.style.opacity = '0';
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 400);
    }, 2500);
  }
}

// Dynamically center/position the floating gating tools toolbar
function positionGatingToolbar() {
  const toolbar = document.getElementById('floating-gating-toolbar');
  const container = document.querySelector('.plot-container');
  if (!toolbar || !container) return;
  
  // If user has manually dragged the toolbar, do not auto-reposition it
  if (toolbar.dataset.dragged === 'true') return;
  
  const rect = container.getBoundingClientRect();
  const toolbarRect = toolbar.getBoundingClientRect();
  
  // Center horizontally inside plot-container, place 24px above bottom
  const targetLeft = rect.left + (rect.width - toolbarRect.width) / 2;
  const targetTop = rect.bottom - toolbarRect.height - 24;
  
  toolbar.style.left = `${targetLeft}px`;
  toolbar.style.top = `${targetTop}px`;
  toolbar.style.bottom = 'auto';
  toolbar.style.right = 'auto';
}

// Toggle Fullscreen modes ('both', 'normal', 'aml')
function toggleFullscreen(target) {
  const body = document.body;
  const globalBtn = document.getElementById('toggle-fullscreen-btn');
  const normalBtn = document.getElementById('expand-btn-normal');
  const amlBtn = document.getElementById('expand-btn-aml');
  const cardNormal = document.getElementById('plot-card-normal');
  const cardAML = document.getElementById('plot-card-aml');
  
  // If clicking what is already active, exit fullscreen
  if (isFullscreenActive && fullscreenTarget === target) {
    exitFullscreen();
    return;
  }
  
  // If target is 'both' but we are not in comparison mode, treat it as 'normal'
  if (target === 'both' && currentCase !== 'compare') {
    target = 'normal';
    if (isFullscreenActive && fullscreenTarget === target) {
      exitFullscreen();
      return;
    }
  }
  
  isFullscreenActive = true;
  fullscreenTarget = target;
  
  body.classList.add('fullscreen-mode');
  
  // Reset all active classes on buttons
  if (globalBtn) globalBtn.classList.remove('active');
  if (normalBtn) normalBtn.classList.remove('active');
  if (amlBtn) amlBtn.classList.remove('active');
  
  // Update icons and active button states
  if (target === 'both') {
    if (globalBtn) {
      globalBtn.classList.add('active');
      globalBtn.innerHTML = `<svg class="icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14h6v6m10-6h-6v6M4 10h6V4m10 6h-6V4"/></svg>`;
    }
    // Show both cards
    if (cardNormal) cardNormal.style.display = 'flex';
    if (cardAML) cardAML.style.display = 'flex';
  } else if (target === 'normal') {
    if (normalBtn) normalBtn.classList.add('active');
    // Hide AML card, show Normal card
    if (cardNormal) cardNormal.style.display = 'flex';
    if (cardAML) cardAML.style.display = 'none';
  } else if (target === 'aml') {
    if (amlBtn) amlBtn.classList.add('active');
    // Hide Normal card, show AML card
    if (cardNormal) cardNormal.style.display = 'none';
    if (cardAML) cardAML.style.display = 'flex';
  }
  
  // Recalculate canvas sizes and redraw plots
  resizeCanvasForFullscreen();
  
  // Reposition floating gating toolbar since plot area changed
  setTimeout(positionGatingToolbar, 100);
}

function exitFullscreen() {
  const body = document.body;
  const globalBtn = document.getElementById('toggle-fullscreen-btn');
  const normalBtn = document.getElementById('expand-btn-normal');
  const amlBtn = document.getElementById('expand-btn-aml');
  const cardNormal = document.getElementById('plot-card-normal');
  const cardAML = document.getElementById('plot-card-aml');
  
  isFullscreenActive = false;
  fullscreenTarget = null;
  
  body.classList.remove('fullscreen-mode');
  
  if (globalBtn) {
    globalBtn.classList.remove('active');
    globalBtn.innerHTML = `<svg class="icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>`;
  }
  if (normalBtn) normalBtn.classList.remove('active');
  if (amlBtn) amlBtn.classList.remove('active');
  
  // Restore cards to default based on current case
  if (cardNormal) cardNormal.style.display = 'flex';
  if (cardAML) {
    cardAML.style.display = (currentCase === 'compare') ? 'flex' : 'none';
  }
  
  // Restore default size (460x460)
  if (flowPlot) flowPlot.resize(460, 460);
  if (flowPlotAML) flowPlotAML.resize(460, 460);
  
  // Reposition floating gating toolbar
  setTimeout(positionGatingToolbar, 100);
}

function resizeCanvasForFullscreen() {
  if (!isFullscreenActive) return;
  
  const w = window.innerWidth;
  const h = window.innerHeight;
  
  // Sizing math:
  // Available height: viewport height minus tabs (50px), margins/paddings (50px), controls (100px)
  const availableHeight = h - 200;
  
  if (fullscreenTarget === 'both') {
    // Both graphs side-by-side:
    // Available width: (viewport width minus gap and padding (140px)) divided by 2
    const availableWidth = (w - 140) / 2;
    const size = Math.floor(Math.max(300, Math.min(availableWidth, availableHeight)));
    
    if (flowPlot) flowPlot.resize(size, size);
    if (flowPlotAML) flowPlotAML.resize(size, size);
  } else {
    // Single graph fullscreen:
    const availableWidth = w - 80;
    const size = Math.floor(Math.max(300, Math.min(availableWidth, availableHeight)));
    
    if (fullscreenTarget === 'normal' && flowPlot) {
      flowPlot.resize(size, size);
    } else if (fullscreenTarget === 'aml' && flowPlotAML) {
      flowPlotAML.resize(size, size);
    }
  }
}

function showExplorerPlotsPanel() {
  const panel = document.getElementById('explorer-plots-panel');
  const legend = document.getElementById('explorer-3d-legend');
  const zoomControls = document.getElementById('explorer-zoom-controls');
  
  if (panel) {
    panel.classList.add('visible');
    explorerPlotsVisible = true;
    
    // Shift legend and zoom controls up
    if (legend) legend.style.bottom = '320px';
    if (zoomControls) zoomControls.style.bottom = '320px';
    
    // Start animation loop for pulsing reticle
    animateExplorerPlots();
  }
}

function hideExplorerPlotsPanel() {
  const panel = document.getElementById('explorer-plots-panel');
  const legend = document.getElementById('explorer-3d-legend');
  const zoomControls = document.getElementById('explorer-zoom-controls');
  
  if (panel) {
    panel.classList.remove('visible');
    explorerPlotsVisible = false;
    
    // Restore legend and zoom controls
    if (legend) legend.style.bottom = '24px';
    if (zoomControls) zoomControls.style.bottom = '24px';
  }
}

function toggleExplorerPlotsPanel() {
  if (explorerPlotsVisible) {
    hideExplorerPlotsPanel();
  } else {
    showExplorerPlotsPanel();
  }
}

// The only thing that genuinely animates in these three panels is the pulsing
// target ring, so they are redrawn at ~24fps rather than competing with the 3D
// loop for every frame. The cell cloud underneath comes from a cached bitmap.
let explorerPlotsLastDraw = 0;
const EXPLORER_PLOTS_INTERVAL = 1000 / 24;

function animateExplorerPlots() {
  if (!explorerPlotsVisible) return;
  requestAnimationFrame(animateExplorerPlots);
  if (document.hidden) return;

  const now = performance.now();
  if (now - explorerPlotsLastDraw < EXPLORER_PLOTS_INTERVAL) return;
  explorerPlotsLastDraw = now;

  if (explorerPlotFscSsc) explorerPlotFscSsc.draw();
  if (explorerPlotCd45Ssc) explorerPlotCd45Ssc.draw();
  if (explorerPlotLineage) explorerPlotLineage.draw();
}




