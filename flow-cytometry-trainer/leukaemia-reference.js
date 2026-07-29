/**
 * leukaemia-reference.js
 * Interactive Leukaemia Predictor & Decision Flowchart.
 *
 * Base dataset: Slides 13 & 14 of Immunophenotyping.pptx (FAB-based teaching scheme).
 * Corrected and extended against:
 *   - WHO Classification of Haematolymphoid Tumours, 5th ed. (2022)
 *   - BSH/BCSH: Johansson et al., Br J Haematol 2014 (multicolour flow cytometry guideline)
 *   - Local SOP_Immunophenotypic_Interpretation_Guide.md
 *   - wbc_morphology_training_plan (Bain 5e; Hoffbrand 7e; Rodak 5e; Postgraduate Haematology)
 *
 * NOTE ON NOMENCLATURE: the FAB M0-M7 scheme is retained here because it is what the
 * teaching slides use. It is superseded in current practice by the WHO 5th edition
 * ("AML with defining genetic abnormalities" / "AML defined by differentiation").
 * Each AML entry carries a `whoNote` giving the current equivalent.
 *
 * Marker value vocabulary:
 *   "+"        consistently positive
 *   "+/-"      usually positive, may be negative
 *   "-/+"      usually negative/dim, may be positive
 *   "-"        consistently negative
 *   "clonal"   monoclonal restriction - positive for kappa OR lambda, negative for the other
 *   "aberrant" not normally present; when seen it is an aberrancy supporting clonality
 */

(function() {
  // 1. Dataset - Slide 13 & Slide 14 criteria, fact-checked and extended
  const LEUKAEMIAS = [
    {
      id: "pre-b-all",
      name: "Pre B-ALL",
      fullName: "B-Lymphoblastic Leukaemia/Lymphoma",
      category: "acute",
      lineage: "B-cell",
      description: "Clonal expansion of immature B-cell precursors (lymphoblasts). Immature markers (CD34, TdT) with pan-B markers and NO surface light chain restriction - the key separator from Burkitt's. CD10 is positive in 'common' B-ALL but negative in pro-B / KMT2A-rearranged disease. CD45 is characteristically dim-to-negative.",
      morphology: "Lymphoblasts in bone marrow or peripheral blood; scant agranular cytoplasm, never Auer rods.",
      genetics: "t(9;22) BCR::ABL1, KMT2A rearrangement, ETV6::RUNX1, hyperdiploidy, TCF3::PBX1.",
      keyTest: "Cytoplasmic CD79a and/or cytoplasmic CD22 establish B lineage; TdT/CD34 establish precursor stage; surface kappa/lambda must be ABSENT.",
      markers: {
        CD34: "+", TDT: "+", CD19: "+", CD10: "+", cCD79a: "+",
        CD22: "-/+", CD20: "+/-", CD79b: "+/-", CD45: "-/+",
        Kappa: "-", Lambda: "-", MPO: "-", cCD3: "-", sCD3: "-",
        CD13: "aberrant", CD33: "aberrant", CD117: "aberrant"
      }
    },
    {
      id: "t-all",
      name: "T-ALL",
      fullName: "T-Lymphoblastic Leukaemia/Lymphoma",
      category: "acute",
      lineage: "T-cell",
      description: "Arises from immature T-cell precursors. Often high WBC with a mediastinal mass in young males. Cytoplasmic CD3 is the lineage-defining marker; surface CD3 is usually absent. CD7 is the most consistently expressed T antigen but is not lineage-specific on its own.",
      morphology: "Lymphoblasts, often with convoluted nuclei.",
      genetics: "TAL1, LMO1/2, TLX1/TLX3 rearrangements; NOTCH1 mutation. Early T-precursor (ETP) subtype has a distinct CD1a-/CD8-/CD5 dim, stem/myeloid-marker-positive profile.",
      keyTest: "Cytoplasmic CD3 (cCD3) is the defining lineage marker. TdT positive; CD1a marks the cortical stage.",
      markers: {
        CD34: "+/-", TDT: "+", CD7: "+", cCD3: "+", sCD3: "-/+",
        CD2: "+/-", CD5: "+/-", CD4: "+/-", CD8: "+/-", CD45: "+/-",
        CD19: "-", cCD79a: "-", MPO: "-",
        CD117: "aberrant", CD13: "aberrant", CD33: "aberrant"
      }
    },
    {
      id: "burkitts",
      name: "Burkitt's Lymphoma",
      fullName: "Burkitt Lymphoma / Leukaemia",
      category: "acute", // Grouped in the Acute Leukaemia section on Slide 13
      lineage: "B-cell",
      description: "Highly aggressive MATURE B-cell neoplasm. Unlike Pre B-ALL it is CD34-negative and TdT-negative and expresses clonal surface immunoglobulin (usually IgM). It is a germinal-centre tumour and is therefore CD10 POSITIVE together with BCL6, and BCL2 negative, with a Ki-67 approaching 100%.",
      morphology: "Medium-sized cells with deeply basophilic cytoplasm and lipid vacuoles. 'Starry-sky' pattern on biopsy.",
      genetics: "t(8;14) IGH::MYC (or variant t(2;8), t(8;22)).",
      keyTest: "CD34-/TdT- plus surface light chain restriction separates it from B-ALL; near-100% Ki-67 and BCL2 negativity support it.",
      correction: "Slide 13 lists CD10 as negative. Burkitt lymphoma is characteristically CD10 POSITIVE (germinal-centre origin); CD10-negative cases are the rare exception. Corrected here.",
      markers: {
        CD34: "-", TDT: "-", CD19: "+", CD20: "+", CD22: "+", cCD79a: "+", CD79b: "+",
        CD10: "+", CD5: "-", CD23: "-", CD45: "+",
        Kappa: "clonal", Lambda: "clonal"
      }
    },
    {
      id: "m0",
      name: "AML-M0",
      fullName: "AML with minimal differentiation",
      category: "acute",
      lineage: "Myeloid",
      description: "Myeloblastic leukaemia with no morphological or cytochemical evidence of myeloid differentiation. Cytochemical MPO is negative (<3% of blasts); lineage is assigned by flow cytometry, where cytoplasmic MPO may still be detectable. Morphologically indistinguishable from ALL - flow is mandatory.",
      morphology: "Undifferentiated agranular blasts, no Auer rods.",
      genetics: "Complex/adverse cytogenetics; RUNX1 and FLT3-ITD mutations common.",
      whoNote: "WHO 5th ed: 'AML with minimal differentiation' under AML defined by differentiation.",
      keyTest: "Cytochemical MPO/SBB <3% positive, with CD13/CD33/CD117 expression and no lymphoid lineage marker.",
      correction: "Slide 13 label 'AML with no minimal maturation' is garbled. The correct FAB M0 designation is 'AML with MINIMAL DIFFERENTIATION'.",
      markers: {
        CD34: "+", CD117: "+", HLA_DR: "+", MPO: "-", CD13: "+",
        CD33: "+/-", CD18: "+/-", CD11b: "-/+", CD45: "+/-",
        CD2: "aberrant", CD7: "aberrant", CD56: "aberrant", CD19: "aberrant"
      }
    },
    {
      id: "m1",
      name: "AML-M1",
      fullName: "AML without maturation",
      category: "acute",
      lineage: "Myeloid",
      description: "Blasts show cytochemical evidence of myeloid differentiation (MPO/SBB positive in >=3% of blasts) but essentially no maturation beyond the blast stage - maturing granulocytic cells are <10% of marrow non-erythroid cells.",
      morphology: "Myeloblasts, occasional primary granules, Auer rods uncommon but may be present.",
      genetics: "No single defining lesion; FLT3-ITD and NPM1 mutations are frequent.",
      whoNote: "WHO 5th ed: 'AML without maturation'.",
      keyTest: "MPO/SBB positive in >=3% of blasts distinguishes M1 from M0.",
      correction: "Slide 13 label 'AML with minimal maturation' conflates M0 and M1. FAB M1 is 'AML WITHOUT maturation'.",
      markers: {
        CD34: "+", CD117: "+", HLA_DR: "+", MPO: "+", CD13: "+",
        CD33: "+/-", CD18: "+/-", CD11b: "-/+", CD15: "-/+", CD45: "+/-",
        CD2: "aberrant", CD7: "aberrant", CD56: "aberrant", CD19: "aberrant"
      }
    },
    {
      id: "m2",
      name: "AML-M2",
      fullName: "AML with maturation",
      category: "acute",
      lineage: "Myeloid",
      description: "Myeloblastic leukaemia with maturation - maturing granulocytic cells exceed 10% of marrow non-erythroid cells, and the monocytic component is <20%. Frequently associated with t(8;21). Aberrant CD19 (and CD56) on blasts is strongly associated with t(8;21) and is a useful MRD handle.",
      morphology: "Myeloblasts, promyelocytes and maturing granulocytes. Auer rods common. Dysplastic 'salmon-pink' granules in t(8;21).",
      genetics: "t(8;21)(q22;q22) RUNX1::RUNX1T1.",
      whoNote: "WHO 5th ed: cases with t(8;21) are classified as 'AML with RUNX1::RUNX1T1 fusion' (blast threshold waived); the remainder as 'AML with maturation'.",
      keyTest: "Cytogenetics/FISH for RUNX1::RUNX1T1. Aberrant CD19+CD56 on myeloid blasts is a strong pointer.",
      markers: {
        CD34: "+", CD117: "+", HLA_DR: "+", MPO: "+", CD13: "+", CD33: "+",
        CD18: "+", CD11b: "+", CD15: "+", CD45: "+/-",
        CD2: "aberrant", CD7: "aberrant", CD56: "aberrant", CD19: "aberrant"
      }
    },
    {
      id: "m3",
      name: "AML-M3 (APL)",
      fullName: "Acute Promyelocytic Leukaemia",
      category: "acute",
      lineage: "Myeloid",
      description: "Driven by PML::RARA. A haematological EMERGENCY because of severe DIC. The classic flow signature is the 'triple negative' CD34-/HLA-DR-/CD11b- profile on a homogeneous population with very bright side scatter, bright CD33 and very strong MPO. CD117 is positive in roughly half of cases, so a positive CD117 does NOT exclude APL.",
      morphology: "Hypergranular abnormal promyelocytes; 'faggot cells' with bundles of Auer rods. Microgranular (M3v) variant has bilobed/butterfly nuclei and high WBC, mimicking monocytic leukaemia.",
      genetics: "t(15;17)(q24;q21) PML::RARA (shown as CGN PMLRARA on Slide 13).",
      whoNote: "WHO 5th ed: 'Acute promyelocytic leukaemia with PML::RARA' - blast threshold waived.",
      keyTest: "Urgent PML::RARA by FISH/RT-PCR. HLA-DR negativity plus bright MPO and high SSC is the rapid flow screen; CD14/CD64 negativity separates M3v from M4/M5.",
      correction: "Slide 13 lists CD117 as negative. CD117 is positive in ~50-75% of APL and is part of the standard rapid-screening panel; changed to variable (+/-).",
      markers: {
        CD34: "-", HLA_DR: "-", CD18: "-", CD11b: "-",
        CD117: "+/-", CD15: "-/+", CD33: "+", CD13: "+", MPO: "+", CD64: "+/-",
        CD45: "+/-", CD14: "-",
        CD2: "aberrant", CD7: "aberrant", CD56: "aberrant", CD19: "aberrant"
      }
    },
    {
      id: "m4",
      name: "AML-M4",
      fullName: "Acute Myelomonocytic Leukaemia",
      category: "acute",
      lineage: "Myeloid",
      description: "Leukaemia with BOTH granulocytic and monocytic differentiation. FAB requires >=20% of marrow non-erythroid cells to be monocytic AND >=20% granulocytic, on a background of >=20% blasts (WHO) / >=30% of NEC (FAB). Flow shows two distinct blast populations. The M4Eo variant with abnormal marrow eosinophils carries inv(16)/t(16;16).",
      morphology: "Myeloblasts, monoblasts and promonocytes together. In M4Eo, marrow eosinophils have large purple-violet granules.",
      genetics: "inv(16)(p13.1q22) or t(16;16) CBFB::MYH11 (specifically the M4Eo variant).",
      whoNote: "WHO 5th ed: inv(16)/t(16;16) cases are 'AML with CBFB::MYH11 fusion' (blast threshold waived); others fall under 'AML, myelomonocytic'.",
      keyTest: "Non-specific esterase (NSE, listed as 'NSA' on Slide 13) positive in the monocytic component and fluoride-inhibited; CD14/CD64 co-expression on flow.",
      markers: {
        CD34: "+", CD117: "+/-", HLA_DR: "+", CD13: "+", CD33: "+", CD11b: "+", CD18: "+",
        MPO: "+", NSE: "+", CD64: "+", CD14: "+/-", CD36: "+", CD45: "+",
        CD2: "aberrant", CD7: "aberrant", CD56: "aberrant", CD19: "aberrant"
      }
    },
    {
      id: "m5",
      name: "AML-M5",
      fullName: "Acute Monoblastic/Monocytic Leukaemia",
      category: "acute",
      lineage: "Myeloid",
      description: "Monocytic component is >=80% of marrow non-erythroid cells. CD34 and CD117 are frequently NEGATIVE (a common trap - absence of CD34 does not exclude AML), while HLA-DR, CD33, CD64 and CD11b are bright and CD14 appears with maturation (M5b). MPO is weak or negative.",
      morphology: "M5a: large monoblasts, abundant basophilic cytoplasm, round nuclei with prominent nucleoli. M5b: folded/creased promonocyte nuclei. Promonocytes count as blast equivalents.",
      genetics: "KMT2A (MLL) rearrangement, especially t(9;11)(p21.3;q23.3) KMT2A::MLLT3.",
      whoNote: "WHO 5th ed: KMT2A-rearranged cases are 'AML with KMT2A rearrangement'; others are 'AML, monocytic' / 'AML, myelomonocytic'.",
      keyTest: "Strong NSE with fluoride inhibition; CD64 bright with CD14 and CD36; lysozyme raised in serum/urine.",
      correction: "Slide 13 listed CD34 as positive, which contradicts its own description text. CD34 is usually NEGATIVE in M5; changed to -/+.",
      markers: {
        CD34: "-/+", CD117: "-", HLA_DR: "+", CD33: "+", CD13: "+", CD11b: "+", CD18: "+",
        MPO: "-/+", NSE: "+", CD64: "+", CD14: "+/-", CD36: "+", CD11c: "+", CD45: "+",
        CD2: "aberrant", CD7: "aberrant", CD56: "aberrant", CD19: "aberrant"
      }
    },
    {
      id: "m6",
      name: "AML-M6",
      fullName: "Acute Erythroid Leukaemia",
      category: "acute",
      lineage: "Erythroid",
      description: "Neoplastic proliferation of erythroid precursors. FAB M6 required >=50% erythroid precursors in marrow plus >=30% blasts of non-erythroid cells. Erythroid precursors are CD71 bright and CD36 positive, acquire Glycophorin A (CD235a) with maturation, and are characteristically HLA-DR and CD34 NEGATIVE. Note CD36 is not erythroid-specific (monocytes and platelets also express it).",
      morphology: "Multinucleated, megaloblastoid and dysplastic erythroblasts with vacuolation; PAS block positivity.",
      genetics: "Very high prevalence of biallelic TP53 alteration; complex karyotype.",
      whoNote: "WHO 5th ed replaced FAB M6 with 'Acute erythroid leukaemia' defined by erythroid maturation arrest (>=30% proerythroblasts, usually >=80% erythroid marrow cellularity) - this diagnosis supersedes AML-MR.",
      keyTest: "CD235a (Glycophorin A) and CD71 identify the erythroid population; TP53 sequencing for prognosis.",
      markers: {
        GLY_A: "+", CD71: "+", CD36: "+", CD117: "+/-", CD34: "-", HLA_DR: "-",
        CD13: "-/+", CD33: "-/+", MPO: "-", CD45: "-/+"
      }
    },
    {
      id: "m7",
      name: "AML-M7",
      fullName: "Acute Megakaryoblastic Leukaemia",
      category: "acute",
      lineage: "Megakaryocytic",
      description: "Leukaemia of megakaryocytic lineage. Marrow fibrosis/osteosclerosis often makes aspirates a 'dry tap', so flow on peripheral blood is important. Defined by platelet glycoproteins CD41 (GPIIb), CD61 (GPIIIa) and CD42b (GPIb). PITFALL: adherent platelets can coat other blasts and give false CD41/CD61 positivity - cytoplasmic CD41/CD61 is more reliable than surface staining.",
      morphology: "Megakaryoblasts with cytoplasmic projections/blebs; may resemble L2 lymphoblasts. MPO and SBB negative.",
      genetics: "t(1;22)(p13.3;q13.1) RBM15::MRTFA in infants; GATA1 mutation in Down syndrome-associated disease.",
      whoNote: "WHO 5th ed: 'AML, megakaryoblastic'; Down-syndrome cases sit under 'Myeloid leukaemia associated with Down syndrome'.",
      keyTest: "CD41/CD61 (ideally cytoplasmic) plus CD42b; MPO/SBB negative excludes granulocytic lineage.",
      markers: {
        CD41: "+", CD61: "+", CD36: "+", CD34: "-/+", CD117: "-/+", HLA_DR: "-/+",
        CD13: "-/+", CD33: "+/-", MPO: "-", CD45: "-/+", CD7: "aberrant"
      }
    },
    {
      id: "b-cll",
      name: "B-CLL",
      fullName: "B-Chronic Lymphocytic Leukaemia / SLL",
      category: "chronic",
      lineage: "B-cell",
      description: "Indolent mature B-cell leukaemia co-expressing CD5 and CD23. The hallmark is WEAK expression: dim CD20, dim/absent CD22 and CD79b, FMC7 negative, and DIM but genuinely restricted surface kappa or lambda. CD200 is bright positive - the single most useful discriminator from mantle cell lymphoma.",
      morphology: "Small mature lymphocytes with clumped 'soccer-ball' chromatin. Smudge cells (Gumprecht shadows) on the film.",
      genetics: "del(13q14) (good risk), trisomy 12, del(11q) ATM, del(17p)/TP53 (adverse). IGHV mutational status is prognostic.",
      keyTest: "Matutes/RMH score (CD5+, CD23+, FMC7-, CD22/CD79b weak, sIg weak) - 4-5/5 supports CLL. CD200 bright positive vs negative in MCL.",
      correction: "Slide 14 shows kappa and lambda as flatly negative. Surface light chain in CLL is DIM but present and clonally restricted; recorded here as weak/clonal rather than absent.",
      markers: {
        CD19: "+", CD5: "+", CD23: "+", CD10: "-", CD20: "-/+", CD22: "-/+", FMC7: "-",
        CD79b: "-/+", CD200: "+", CD103: "-", CD11c: "-/+", CD45: "+",
        Kappa: "clonal", Lambda: "clonal"
      }
    },
    {
      id: "mcl",
      name: "Mantle Cell Lymphoma (MCL)",
      fullName: "Mantle Cell Lymphoma",
      category: "chronic",
      lineage: "B-cell",
      description: "Aggressive mature B-cell lymphoma. CD5 POSITIVE but CD23 NEGATIVE - the mirror image of CLL. Unlike CLL, expression is STRONG: bright CD20, bright CD22, FMC7 positive and strong surface light chain. CD200 is negative. Defined by cyclin D1 overexpression.",
      morphology: "Small to medium lymphocytes with irregular, indented ('cleaved') nuclei.",
      genetics: "t(11;14)(q13;q32) CCND1::IGH.",
      keyTest: "Cyclin D1 immunohistochemistry or CCND1::IGH FISH. SOX11 positive in cyclin D1-negative variants.",
      markers: {
        CD19: "+", CD5: "+", CD23: "-", CD10: "-", CD20: "+", CD22: "+", FMC7: "+", CD79b: "+",
        CD200: "-", CD103: "-", CD45: "+",
        Kappa: "clonal", Lambda: "clonal"
      }
    },
    {
      id: "b-pll",
      name: "B-PLL",
      fullName: "B-Prolymphocytic Leukaemia",
      category: "chronic",
      lineage: "B-cell",
      description: "Rare aggressive leukaemia with >55% circulating prolymphocytes, marked splenomegaly and very high WBC. Strong pan-B expression with bright surface light chain. CD5 is positive in only about a third of cases, so a CD5-negative result does not exclude it.",
      morphology: "Medium-sized prolymphocytes with a round nucleus, moderately condensed chromatin and a single prominent central nucleolus.",
      genetics: "MYC rearrangement and TP53 abnormalities are frequent.",
      whoNote: "IMPORTANT: WHO 5th ed (2022) DELETED B-PLL as an entity. Such cases are now reclassified as splenic B-cell lymphoma/leukaemia with prominent nucleoli (SBLPN), or as the prolymphocytic progression of CLL or MCL. Retained here because the teaching slide uses it.",
      keyTest: "Must exclude MCL (cyclin D1/t(11;14)) and CLL in prolymphocytoid transformation before considering this label.",
      correction: "Slide 14 lists CD5 as positive. Only ~20-30% of B-PLL are CD5 positive; recorded here as variable.",
      markers: {
        CD19: "+", CD5: "+/-", CD23: "-", CD10: "-", CD20: "+", CD22: "+", FMC7: "+/-", CD79b: "+",
        CD200: "-/+", CD103: "-", CD45: "+",
        Kappa: "clonal", Lambda: "clonal"
      }
    },
    {
      id: "b-lpd",
      name: "B-LPD",
      fullName: "Mature B-Cell Lymphoproliferative Disorder (NOS)",
      category: "chronic",
      lineage: "B-cell",
      description: "Holding category for clonal mature B-cell disorders that are CD5 NEGATIVE and CD10 NEGATIVE - most commonly marginal zone lymphoma / splenic marginal zone lymphoma (SMZL, formerly SLVL) and lymphoplasmacytic lymphoma. Diagnosis needs morphology, histology and molecular work, not flow alone.",
      morphology: "Variable mature lymphocytes; SMZL classically shows short polar villous projections at one or both poles (contrast with the circumferential 'hairs' of HCL).",
      genetics: "SMZL: del(7q), NOTCH2. Lymphoplasmacytic lymphoma: MYD88 L265P with an IgM paraprotein.",
      keyTest: "CD103/CD25/CD11c/CD123 to exclude hairy cell leukaemia; CD43 and MYD88 L265P assist subclassification.",
      markers: {
        CD19: "+", CD5: "-", CD23: "-", CD10: "-", CD20: "+", CD22: "+", FMC7: "+/-", CD79b: "+",
        CD103: "-", CD25: "-/+", CD11c: "-/+", CD123: "-", CD200: "-/+", CD45: "+",
        Kappa: "clonal", Lambda: "clonal"
      }
    },
    {
      id: "hcl",
      name: "Hairy Cell Leukaemia",
      fullName: "Hairy Cell Leukaemia",
      category: "chronic",
      lineage: "B-cell",
      description: "Indolent mature B-cell leukaemia presenting with splenomegaly, monocytopenia and pancytopenia. Everything is BRIGHT: CD20, CD22, CD11c and CD103, plus CD25 and CD123. FMC7 is POSITIVE and CD200 is bright. Diagnosis conventionally requires at least two of CD103, CD123, CD25 and CD11c.",
      morphology: "Lymphocytes with abundant pale cytoplasm and fine CIRCUMFERENTIAL hair-like projections. TRAP positive; 'dry tap' marrow from reticulin fibrosis.",
      genetics: "BRAF V600E (present in essentially all classic HCL; absent in the variant form).",
      keyTest: "CD103 + CD123 + CD25 + CD11c scoring panel; BRAF V600E confirms. HCL-variant is CD25- and CD123-, with CD11c positive.",
      correction: "Slide 14 lists FMC7 as negative. Hairy cell leukaemia is characteristically FMC7 POSITIVE (and CD200 bright); corrected here. CD11c, CD103 and CD123 were also missing from the slide profile and have been added.",
      markers: {
        CD19: "+", CD5: "-", CD23: "-", CD10: "-", CD20: "+", CD22: "+", FMC7: "+", CD79b: "+",
        CD25: "+", CD11c: "+", CD103: "+", CD123: "+", CD200: "+", CD45: "+",
        Kappa: "clonal", Lambda: "clonal"
      }
    },
    {
      id: "fl",
      name: "Follicular Lymphoma",
      fullName: "Follicular Lymphoma",
      category: "chronic",
      lineage: "B-cell",
      description: "Mature germinal-centre B-cell neoplasm. CD10 POSITIVE with CD5 negative, BCL2 aberrantly positive (normal germinal centres are BCL2 negative), BCL6 positive.",
      morphology: "Nodular/follicular architecture on biopsy; centrocytes with cleaved nuclei plus centroblasts. Circulating cells are small and deeply cleaved ('buttock cells').",
      genetics: "t(14;18)(q32;q21) IGH::BCL2.",
      keyTest: "PITFALL - FL and Pre B-ALL are both CD19+CD10+. FL is TdT NEGATIVE with surface light chain restriction; B-ALL is TdT POSITIVE with no surface light chain.",
      markers: {
        CD19: "+", CD5: "-", CD23: "-/+", CD10: "+", CD20: "+", CD22: "+", FMC7: "+", CD79b: "+",
        TDT: "-", CD34: "-", CD103: "-", CD200: "-/+", CD45: "+",
        Kappa: "clonal", Lambda: "clonal"
      }
    },
    {
      id: "t-lpd",
      name: "T-LPD",
      fullName: "Mature T-Cell Lymphoproliferative Disorder (cytotoxic)",
      category: "chronic",
      lineage: "T-cell",
      description: "Clonal mature T-cell disorders with a cytotoxic (CD8+) phenotype. There is no light chain equivalent for T cells, so clonality is inferred from ABERRANT LOSS of pan-T antigens (CD5, CD7, CD2, CD3), a skewed CD4:CD8 ratio, restricted TCR V-beta usage, or TCR gene rearrangement studies.",
      morphology: "Atypical mature T-lymphocytes.",
      genetics: "Variable; STAT3 mutations in the T-LGL subset.",
      keyTest: "TCR gene rearrangement (PCR) or TCR V-beta repertoire flow analysis to confirm clonality.",
      markers: {
        sCD3: "+", CD8: "+", CD4: "-", CD7: "-/+", CD5: "+/-", CD2: "+/-", CD45: "+",
        CD19: "-", CD34: "-", TDT: "-"
      }
    },
    {
      id: "atll",
      name: "Adult T-Cell Leukaemia",
      fullName: "Adult T-Cell Leukaemia/Lymphoma (ATLL)",
      category: "chronic",
      lineage: "T-cell",
      description: "Aggressive mature T-cell leukaemia caused by HTLV-1. CD4 positive with BRIGHT CD25 (the key discriminator from Sezary syndrome) and characteristic LOSS of CD7. Hypercalcaemia and lytic bone lesions are typical. CD25 positivity underpins anti-CD25 therapy.",
      morphology: "Pleomorphic lymphocytes with markedly indented, multilobated nuclei - 'flower cells' / 'clover-leaf cells'.",
      genetics: "Clonally integrated HTLV-1 provirus; CCR4 and TP53 abnormalities.",
      keyTest: "HTLV-1 serology plus clonal proviral integration. CD25 bright separates ATLL from Sezary syndrome.",
      correction: "Slide 14 lists CD7 as positive. Loss of CD7 is a characteristic aberrancy in ATLL; recorded here as usually negative.",
      markers: {
        sCD3: "+", CD7: "-/+", CD5: "+", CD2: "+", CD4: "+", CD8: "-", CD25: "+",
        CD26: "-", CD45: "+", CD34: "-", TDT: "-"
      }
    },
    {
      id: "sezary",
      name: "Sezary Syndrome",
      fullName: "Sezary Syndrome",
      category: "chronic",
      lineage: "T-cell",
      description: "Leukaemic variant of cutaneous T-cell lymphoma - the triad of erythroderma, generalised lymphadenopathy and clonal circulating CD4+ cells with cerebriform nuclei. The characteristic aberrancy is LOSS of CD7 and CD26. CD25 is negative, which is what separates it from ATLL on the slide's decision path.",
      morphology: "Atypical lymphocytes with deeply folded, grooved, cerebriform nuclei ('Sezary cells'). Diagnosis needs a Sezary count >=1.0 x 10^9/L or an expanded clone.",
      genetics: "Complex karyotype; no single defining lesion.",
      keyTest: "CD4:CD8 ratio >10, CD4+CD7- >40% or CD4+CD26- >30% of lymphocytes, with a matching TCR clone in skin and blood.",
      correction: "Slide 14 lists CD7 as positive. Sezary cells characteristically LOSE CD7 (and CD26) - this loss is a formal ISCL/EORTC diagnostic criterion. Corrected here, with CD26 added.",
      markers: {
        sCD3: "+", CD7: "-/+", CD5: "+", CD2: "+", CD4: "+", CD8: "-", CD25: "-",
        CD26: "-", CD45: "+", CD34: "-", TDT: "-"
      }
    },
    {
      id: "lgl",
      name: "LGL Leukaemia",
      fullName: "T-Cell Large Granular Lymphocytic Leukaemia",
      category: "chronic",
      lineage: "T-cell", // A separate NK-cell (CD3-) form exists; Slide 14 groups this under T-lymphoid
      description: "Indolent clonal expansion of mature cytotoxic T cells, strongly associated with neutropenia, anaemia (including pure red cell aplasia) and rheumatoid arthritis (Felty-like). The classic phenotype is CD3+ CD8+ CD57+ CD16+ with DIM or absent CD5 and CD7. A separate CD3-negative chronic NK-LGL form exists.",
      morphology: "Large lymphocytes with abundant pale cytoplasm and coarse azurophilic granules; persistent LGL count typically >2 x 10^9/L for >6 months.",
      genetics: "STAT3 (and less often STAT5B) mutations in a large proportion of cases.",
      keyTest: "TCR gene rearrangement or restricted TCR V-beta by flow to prove clonality; STAT3 mutation supports it. A reactive LGL expansion is polyclonal.",
      correction: "Slide 14 gives only 'Variable' for this entity, which left it with no usable phenotype. The accepted core profile has been added.",
      markers: {
        sCD3: "+", CD8: "+", CD4: "-", CD2: "+", CD5: "-/+", CD7: "-/+",
        CD57: "+", CD16: "+", CD56: "-/+", CD45: "+", CD19: "-", CD34: "-", TDT: "-"
      }
    },
    {
      id: "plasma-cell",
      name: "Plasma Cell Leukaemia",
      fullName: "Plasma Cell Leukaemia (PCL)",
      category: "plasma-cell",
      lineage: "Plasma",
      description: "Aggressive plasma cell neoplasm with clonal plasma cells circulating in peripheral blood (>=5% of leucocytes under the current WHO 5th ed / IMWG threshold). Plasma cells are identified by CD38 bright and CD138. The neoplastic population is CD19 NEGATIVE and CD45 dim/negative, in contrast to normal plasma cells which are CD19 positive - this is the basis of MRD detection. Clonality is proven with CYTOPLASMIC kappa/lambda, not surface.",
      morphology: "Plasmacytoid cells with eccentric nuclei, perinuclear hof and deeply basophilic cytoplasm; often plasmablastic.",
      genetics: "t(11;14) CCND1::IGH is over-represented in PCL; del(17p)/TP53 and t(4;14) confer adverse risk.",
      keyTest: "CD38/CD138 gating with CYTOPLASMIC light chain restriction. CD19-/CD45dim/CD56 pattern separates neoplastic from normal plasma cells. Note CD56 is usually POSITIVE in myeloma but frequently NEGATIVE in PCL.",
      correction: "Slide 14 lists CD19 as positive ('aberrantly positive'). This is inverted - normal plasma cells are CD19 POSITIVE, and it is LOSS of CD19 that marks the neoplastic clone. Corrected to negative.",
      markers: {
        CD138: "+", CD38: "+", CD19: "-", CD45: "-/+", CD20: "-/+", CD56: "-/+",
        CD117: "-/+", CD200: "+/-", CD10: "-",
        Kappa: "clonal", Lambda: "clonal"
      }
    },

    // ---- Chronic MYELOID neoplasms (absent from Slides 13/14; added for completeness) ----
    {
      id: "cml",
      name: "CML",
      fullName: "Chronic Myeloid Leukaemia, BCR::ABL1-positive",
      category: "chronic-myeloid",
      lineage: "Myeloid",
      description: "Clonal myeloproliferative neoplasm of the granulocytic series defined by the Philadelphia chromosome. Flow cytometry is NOT the diagnostic test - the diagnosis is molecular. What flow shows in chronic phase is a complete, essentially normal granulocytic maturation sequence with only a small CD34+/CD117+ blast compartment (<5%) and expanded basophils. Flow becomes important for blast phase, where it assigns myeloid versus lymphoid lineage to the blasts (about 30% of blast crises are LYMPHOID, typically B-lineage TdT+/CD19+).",
      morphology: "Marked leucocytosis, usually >100 x 10^9/L. Complete granulocytic spectrum with the characteristic MYELOCYTE-NEUTROPHIL BULGE. Absolute basophilia in ~100% of cases and eosinophilia in >90% - basophilia is the single most useful film clue. Blasts <10% in chronic phase.",
      genetics: "t(9;22)(q34.1;q11.2) - BCR::ABL1 fusion, p210 transcript (e13a2/e14a2) in chronic phase.",
      whoNote: "WHO 5th ed (2022) recognises only CHRONIC PHASE and BLAST PHASE - the accelerated phase has been removed. Blast phase = >=20% blasts in blood/marrow, extramedullary blast proliferation, or any increase in lymphoblasts. High-risk features in chronic phase (basophils >=20%, additional cytogenetic abnormalities, TKI resistance mutations) are used for risk stratification instead.",
      keyTest: "RT-qPCR and/or FISH for BCR::ABL1 (positive in >95% by karyotype, remainder cryptic). Leucocyte alkaline phosphatase (LAP/NAP) score is LOW in CML and HIGH in a leukaemoid reaction.",
      markers: {
        CD13: "+", CD33: "+", CD11b: "+", CD15: "+", CD16: "+/-", MPO: "+",
        CD34: "-/+", CD117: "-/+", HLA_DR: "-/+", CD14: "-", CD64: "-/+",
        CD19: "-", sCD3: "-", CD45: "+"
      }
    },
    {
      id: "cmml",
      name: "CMML",
      fullName: "Chronic Myelomonocytic Leukaemia",
      category: "chronic-myeloid",
      lineage: "Myeloid",
      description: "MDS/MPN overlap neoplasm with both dysplastic and proliferative features. Flow has a genuine, validated diagnostic role here: MONOCYTE SUBSET PARTITIONING. In CMML the classical monocyte fraction (MO1, CD14++ CD16-) rises to >=94% of total monocytes, which separates CMML from reactive monocytosis with roughly 90% sensitivity and specificity. Aberrant CD56 on monocytes and reduced CD14/HLA-DR also support clonality.",
      morphology: "Persistent monocytosis with variably immature/dysplastic monocytes. Promonocytes count as BLAST EQUIVALENTS. Dysgranulopoiesis: hypogranular neutrophils and acquired pseudo-Pelger-Huet forms.",
      genetics: "TET2 (~60%), SRSF2 (~50%), ASXL1 (~40%); RAS pathway mutations associate with the proliferative (MP-CMML) subtype.",
      whoNote: "WHO 5th ed requires monocytes >=0.5 x 10^9/L AND >=10% of WBC (the older threshold was 1.0 x 10^9/L), with blasts plus promonocytes <20%. Split into MD-CMML (WBC <13 x 10^9/L) and MP-CMML (WBC >=13 x 10^9/L), and graded CMML-1 / CMML-2. The old CMML-0 category has been deleted.",
      keyTest: "Monocyte subset repartitioning by flow (classical CD14++CD16- >=94%); NGS panel (TET2/SRSF2/ASXL1); BCR::ABL1 must be negative.",
      markers: {
        CD13: "+", CD33: "+", CD14: "+", CD64: "+", CD11b: "+", CD11c: "+", CD36: "+",
        HLA_DR: "+", CD4: "+", CD16: "-/+", CD34: "-/+", CD117: "-/+", MPO: "+/-",
        CD45: "+", CD19: "-", sCD3: "-", CD56: "aberrant"
      }
    },
    {
      id: "mds-mpn-n",
      name: "MDS/MPN-N & CNL",
      fullName: "MDS/MPN with Neutrophilia (formerly atypical CML) and Chronic Neutrophilic Leukaemia",
      category: "chronic-myeloid",
      lineage: "Myeloid",
      description: "Two rare Ph-NEGATIVE neutrophilic proliferations that mimic CML. MDS/MPN with neutrophilia (formerly atypical CML) shows marked leucocytosis with >=10% immature granulocytes AND prominent granulocytic DYSPLASIA, with basophils <2% and monocytes <10%. Chronic neutrophilic leukaemia (CNL) shows extreme MATURE neutrophilia (>=80% segmented neutrophils and bands) with NO dysplasia. Flow is supportive only: it demonstrates abnormal granulocyte maturation and aberrant loss of CD10 or CD16 on neutrophils in the dysplastic entity.",
      morphology: "MDS/MPN-N: hypogranular neutrophils, pseudo-Pelger-Huet and bizarre ring nuclei. CNL: a monotonous population of mature, often toxically granulated neutrophils without dysplasia.",
      genetics: "MDS/MPN-N: SETBP1 and ETNK1, with SRSF2/ASXL1. CNL: CSF3R T618I.",
      whoNote: "WHO 5th ed renamed atypical CML to 'MDS/MPN with neutrophilia'. Both entities require BCR::ABL1 to be absent, and PDGFRA/PDGFRB/FGFR1/JAK2 tyrosine-kinase fusions to be excluded.",
      keyTest: "Exclude BCR::ABL1 first. CSF3R T618I confirms CNL and predicts ruxolitinib response; SETBP1/ETNK1 support MDS/MPN-N. Basophilia would point back towards CML.",
      markers: {
        CD13: "+", CD33: "+", CD11b: "+", CD15: "+", CD16: "+/-", MPO: "+",
        CD34: "-", CD117: "-/+", HLA_DR: "-", CD14: "-", CD45: "+",
        CD19: "-", sCD3: "-", CD56: "aberrant"
      }
    },
    {
      id: "mds",
      name: "MDS",
      fullName: "Myelodysplastic Neoplasms",
      category: "chronic-myeloid",
      lineage: "Myeloid",
      description: "Clonal stem cell neoplasms with cytopenias, ineffective haematopoiesis, dysplasia in one or more myeloid lineages and <20% blasts. Flow cytometry is an adjunct, not a stand-alone diagnostic: the Ogata score (CD34+ myeloblast %, B-progenitors as a fraction of CD34+ cells, the CD45 lymphocyte-to-myeloblast ratio, and the granulocyte-to-lymphocyte side scatter ratio) plus aberrant CD5/CD7/CD56 on blasts and abnormal CD11b/CD13/CD16 maturation patterns.",
      morphology: "Dysgranulopoiesis (pseudo-Pelger-Huet, hypogranularity, ring nuclei), dyserythropoiesis (macro-ovalocytes, basophilic stippling), dysmegakaryopoiesis (giant hypogranular platelets, micromegakaryocytes).",
      genetics: "SF3B1, TP53 (biallelic), ASXL1, RUNX1, SRSF2; del(5q), -7/del(7q), +8, del(20q).",
      whoNote: "WHO 5th ed renamed 'myelodysplastic syndromes' to 'myelodysplastic NEOPLASMS' and reorganised them into genetically defined (MDS-5q, MDS-SF3B1, MDS-biTP53) and morphologically defined (MDS-LB, MDS-h, MDS-IB1, MDS-IB2, MDS-f) groups.",
      keyTest: "Marrow aspirate and trephine with Perls stain for ring sideroblasts, cytogenetics, and an NGS panel. Flow (Ogata / ELN iMDS-Flow) supports but does not establish the diagnosis.",
      markers: {
        CD34: "+/-", CD117: "+/-", CD13: "+", CD33: "+", HLA_DR: "+", MPO: "+/-",
        CD11b: "-/+", CD15: "-/+", CD16: "-/+", CD45: "+", CD10: "-/+",
        CD7: "aberrant", CD56: "aberrant", CD5: "aberrant"
      }
    },
    {
      id: "mpn-ph-neg",
      name: "MPN (Ph-negative)",
      fullName: "Ph-negative Myeloproliferative Neoplasms: PV, ET, PMF",
      category: "chronic-myeloid",
      lineage: "Myeloid",
      description: "Polycythaemia vera, essential thrombocythaemia and primary myelofibrosis - clonal proliferations of one or more mature myeloid lineages WITHOUT dysplasia or a blast excess. Included here as the main differential for a BCR::ABL1-negative myeloid proliferation. Flow cytometry has NO diagnostic role: these are diagnosed on FBC, marrow trephine histology and driver mutation testing. Flow is used only to check that the blast compartment is not expanded.",
      morphology: "PV: erythrocytosis. ET: marked thrombocytosis with giant/bizarre platelets. PMF: leucoerythroblastic film with teardrop poikilocytes (dacrocytes), NRBCs and immature granulocytes.",
      genetics: "JAK2 V617F (>95% of PV; ~55% of ET/PMF), JAK2 exon 12 (PV), CALR exon 9 (~25-30% of ET/PMF), MPL W515 (~5%). 'Triple-negative' cases occur.",
      whoNote: "WHO 5th ed retains PV, ET and PMF (prefibrotic and overt) as distinct MPNs; marrow trephine morphology is required to separate ET from prefibrotic PMF.",
      keyTest: "JAK2 V617F first, then CALR and MPL; marrow trephine with reticulin grading. Erythropoietin level (subnormal in PV).",
      markers: {
        CD13: "+", CD33: "+", CD11b: "+", CD15: "+", MPO: "+",
        CD34: "-", CD117: "-/+", HLA_DR: "-/+", CD14: "-", CD45: "+",
        CD19: "-", sCD3: "-", CD41: "-/+", CD61: "-/+"
      }
    }
  ];

  // Organised Marker Groups for UI Accordion
  const MARKER_GROUPS = [
    {
      name: "Stem Cell & Blast Markers",
      id: "group-stem",
      markers: [
        { id: "CD34", label: "CD34" },
        { id: "CD117", label: "CD117" },
        { id: "TDT", label: "TdT" },
        { id: "HLA_DR", label: "HLA-DR" },
        { id: "MPO", label: "MPO" },
        { id: "CD45", label: "CD45" }
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
        { id: "CD200", label: "CD200" },
        { id: "CD11c", label: "CD11c" },
        { id: "CD103", label: "CD103" },
        { id: "CD123", label: "CD123" },
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
        { id: "CD56", label: "CD56" },
        { id: "CD57", label: "CD57" },
        { id: "CD16", label: "CD16" },
        { id: "CD26", label: "CD26" }
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
        { id: "CD36", label: "CD36" },
        { id: "CD25", label: "CD25" },
        { id: "NSE", label: "NSE" },
        { id: "GLY_A", label: "GLY-A (CD235a)" },
        { id: "CD71", label: "CD71" },
        { id: "CD41", label: "CD41" },
        { id: "CD61", label: "CD61" },
        { id: "CD138", label: "CD138" },
        { id: "CD38", label: "CD38" }
      ]
    }
  ];

  // Flowchart Decision Tree data.
  // Node labels may contain "\n" - the first line renders as the node name, subsequent
  // lines render smaller and muted as the discriminating criterion.
  const ACUTE_TREE = {
    viewBox: '0 0 400 215',
    caption: 'FAB M0-M7 retained to match the teaching slides. See each entry for the WHO 5th ed (2022) equivalent.',
    nodes: [
      { id: 'blasts', label: 'Blast Cells\n>=20% (WHO) in BM or PB', x: 130, y: 4, w: 140, h: 30, type: 'root' },
      { id: 'lymphoid', label: 'Lymphoid Blasts\ncCD3+ or cCD79a+ / TdT+', x: 10, y: 58, w: 150, h: 30, type: 'branch' },
      { id: 'myeloid', label: 'Myeloid Blasts\nMPO / CD13 / CD33 / CD117', x: 242, y: 58, w: 152, h: 30, type: 'branch' },

      // Lymphoid: precursor vs mature-aggressive (Burkitt is a MATURE B-cell neoplasm)
      { id: 'precursor-lymph', label: 'Precursor\nTdT+ CD34+ sIg-', x: 5, y: 112, w: 82, h: 30, type: 'branch' },
      { id: 'mature-b-agg', label: 'Mature B\nTdT- CD34- sIg+', x: 99, y: 112, w: 82, h: 30, type: 'branch' },
      { id: 'pre-b-all', label: 'Pre B-ALL', x: 0, y: 168, w: 62, h: 22, type: 'disease' },
      { id: 't-all', label: 'T-ALL', x: 66, y: 168, w: 46, h: 22, type: 'disease' },
      { id: 'burkitts', label: "Burkitt's", x: 116, y: 168, w: 62, h: 22, type: 'disease' },

      // Myeloid FAB subtypes
      { id: 'm0', label: 'M0', x: 200, y: 112, w: 42, h: 22, type: 'disease' },
      { id: 'm1', label: 'M1', x: 246, y: 112, w: 42, h: 22, type: 'disease' },
      { id: 'm2', label: 'M2', x: 292, y: 112, w: 42, h: 22, type: 'disease' },
      { id: 'm3', label: 'M3 APL', x: 338, y: 112, w: 58, h: 22, type: 'disease' },
      { id: 'm4', label: 'M4', x: 200, y: 168, w: 42, h: 22, type: 'disease' },
      { id: 'm5', label: 'M5', x: 246, y: 168, w: 42, h: 22, type: 'disease' },
      { id: 'm6', label: 'M6', x: 292, y: 168, w: 42, h: 22, type: 'disease' },
      { id: 'm7', label: 'M7', x: 338, y: 168, w: 42, h: 22, type: 'disease' }
    ],
    links: [
      { from: 'blasts', to: 'lymphoid' },
      { from: 'blasts', to: 'myeloid' },
      { from: 'lymphoid', to: 'precursor-lymph' },
      { from: 'lymphoid', to: 'mature-b-agg' },
      { from: 'precursor-lymph', to: 'pre-b-all' },
      { from: 'precursor-lymph', to: 't-all' },
      { from: 'mature-b-agg', to: 'burkitts' },
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

  const CHRONIC_LYMPHOID_TREE = {
    viewBox: '0 0 440 290',
    caption: 'Mature lymphoid neoplasms. B-cell clonality is proven by light chain restriction; T-cell clonality by aberrant pan-T antigen loss or TCR studies.',
    nodes: [
      { id: 'lymphocytes', label: 'Mature Lymphoid Neoplasm\nno TdT / no CD34', x: 130, y: 4, w: 180, h: 30, type: 'root' },
      { id: 'b-lymphoid', label: 'B-Lymphoid\nCD19+ kappa/lambda restricted', x: 8, y: 58, w: 165, h: 30, type: 'branch' },
      { id: 't-lymphoid', label: 'T-Lymphoid\nsCD3+ pan-T antigen loss', x: 268, y: 58, w: 165, h: 30, type: 'branch' },
      { id: 'plasma-cell', label: 'Plasma Cell Leukaemia\nCD38+ CD138+ CD19-', x: 171, y: 112, w: 110, h: 30, type: 'disease' },

      // B-cell sub-branches
      { id: 'b-cd5-pos', label: 'CD5 POSITIVE', x: 2, y: 112, w: 80, h: 24, type: 'branch' },
      { id: 'b-cd5-neg', label: 'CD5 NEGATIVE', x: 88, y: 112, w: 80, h: 24, type: 'branch' },

      // CD5+ B-cell diseases
      { id: 'b-cll', label: 'B-CLL\nCD23+ FMC7- CD200+', x: 0, y: 156, w: 84, h: 30, type: 'disease' },
      { id: 'mcl', label: 'MCL\nCD23- FMC7+ CD200-', x: 0, y: 196, w: 84, h: 30, type: 'disease' },
      { id: 'b-pll', label: 'B-PLL\n>55% prolymphocytes', x: 0, y: 236, w: 84, h: 30, type: 'disease' },

      // CD5- B-cell diseases
      { id: 'b-lpd', label: 'B-LPD / MZL\nCD10- CD103-', x: 88, y: 156, w: 84, h: 30, type: 'disease' },
      { id: 'hcl', label: 'HCL\nCD103+ CD25+ CD11c+', x: 88, y: 196, w: 84, h: 30, type: 'disease' },
      { id: 'fl', label: 'Follicular\nCD10+ TdT-', x: 88, y: 236, w: 84, h: 30, type: 'disease' },

      // T-cell sub-branches
      { id: 't-cd8', label: 'CD8+ cytotoxic', x: 284, y: 112, w: 72, h: 24, type: 'branch' },
      { id: 't-cd4', label: 'CD4+ helper', x: 362, y: 112, w: 74, h: 24, type: 'branch' },

      // T-cell diseases
      { id: 't-lpd', label: 'T-LPD\nCD8+ cytotoxic clone', x: 282, y: 156, w: 76, h: 30, type: 'disease' },
      { id: 'lgl', label: 'T-LGL\nCD57+ CD16+', x: 282, y: 196, w: 76, h: 30, type: 'disease' },
      { id: 'atll', label: 'ATLL\nCD25+ HTLV-1+', x: 362, y: 156, w: 76, h: 30, type: 'disease' },
      { id: 'sezary', label: 'Sezary\nCD25- CD7- CD26-', x: 362, y: 196, w: 76, h: 30, type: 'disease' }
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

      { from: 't-lymphoid', to: 't-cd8' },
      { from: 't-lymphoid', to: 't-cd4' },

      { from: 't-cd8', to: 't-lpd' },
      { from: 't-cd8', to: 'lgl' },

      { from: 't-cd4', to: 'atll' },
      { from: 't-cd4', to: 'sezary' }
    ]
  };

  // Chronic MYELOID arm - missing entirely from Slides 13/14.
  // These are diagnosed molecularly/morphologically; flow is supportive rather than definitive
  // (the exception being monocyte subset partitioning in CMML).
  const CHRONIC_MYELOID_TREE = {
    viewBox: '0 0 400 312',
    caption: 'Mature myeloid proliferation with <20% blasts. BCR::ABL1 is the first branch point - test it before anything else.',
    nodes: [
      { id: 'myeloid-prolif', label: 'Mature Myeloid Proliferation\nblasts <20%, no lymphoid clone', x: 105, y: 4, w: 190, h: 32, type: 'root' },
      { id: 'bcr-pos', label: 'BCR::ABL1\nPOSITIVE', x: 22, y: 60, w: 120, h: 32, type: 'branch' },
      { id: 'bcr-neg', label: 'BCR::ABL1\nNEGATIVE', x: 256, y: 60, w: 120, h: 32, type: 'branch' },

      { id: 'cml', label: 'CML\nbasophilia + myelocyte bulge', x: 10, y: 116, w: 145, h: 30, type: 'disease' },
      { id: 'cml-bp', label: 'Blast Phase\n>=20% blasts -> use Acute tree', x: 10, y: 168, w: 145, h: 30, type: 'branch' },

      { id: 'cmml', label: 'CMML\nmonocytes >=0.5 x10^9/L, >=10%', x: 243, y: 112, w: 148, h: 30, type: 'disease' },
      { id: 'mds-mpn-n', label: 'MDS/MPN-N & CNL\nneutrophilia, Ph-negative', x: 243, y: 158, w: 148, h: 30, type: 'disease' },
      { id: 'mds', label: 'MDS\ncytopenias + dysplasia', x: 243, y: 204, w: 148, h: 30, type: 'disease' },
      { id: 'mpn-ph-neg', label: 'MPN: PV / ET / PMF\nJAK2 / CALR / MPL', x: 243, y: 250, w: 148, h: 30, type: 'disease' }
    ],
    links: [
      { from: 'myeloid-prolif', to: 'bcr-pos' },
      { from: 'myeloid-prolif', to: 'bcr-neg' },
      { from: 'bcr-pos', to: 'cml' },
      { from: 'cml', to: 'cml-bp' },
      { from: 'bcr-neg', to: 'cmml' },
      { from: 'bcr-neg', to: 'mds-mpn-n' },
      { from: 'bcr-neg', to: 'mds' },
      { from: 'bcr-neg', to: 'mpn-ph-neg' }
    ]
  };

  const TREES = {
    'acute': ACUTE_TREE,
    'chronic': CHRONIC_LYMPHOID_TREE,
    'chronic-myeloid': CHRONIC_MYELOID_TREE
  };

  // Explanatory text for non-disease (root/branch) nodes
  const NODE_EXPLANATIONS = {
    'blasts': "Immature blast cells. WHO 5th ed requires >=20% blasts in blood or marrow for acute leukaemia, EXCEPT for genetically defined AML entities (PML::RARA, RUNX1::RUNX1T1, CBFB::MYH11, NPM1, KMT2A-r and others), where the threshold is waived. Blasts are typically CD34 and/or CD117 positive with dim CD45 and low side scatter.",
    'lymphoid': "Lymphoblasts. Lineage is assigned by CYTOPLASMIC markers: cCD3 for T lineage, cCD79a (and/or cCD22) for B lineage. TdT is positive. MPO is negative - if MPO is positive, the case is myeloid or mixed-phenotype.",
    'myeloid': "Myeloblasts. Express CD13, CD33, CD117 and HLA-DR, with MPO by cytochemistry or flow. Note that HLA-DR is absent in APL (M3) and CD34/CD117 are often absent in monocytic AML (M5) - their absence does NOT exclude AML.",
    'precursor-lymph': "Precursor (lymphoblastic) stage: TdT positive, CD34 usually positive, and NO surface immunoglobulin light chain. This is what separates Pre B-ALL from Burkitt lymphoma.",
    'mature-b-agg': "Mature but aggressive B-cell neoplasm presenting like an acute leukaemia. TdT and CD34 are NEGATIVE and surface kappa or lambda is restricted. Burkitt lymphoma sits here - it is grouped with the acute leukaemias on the teaching slide because of its clinical behaviour, not because it is a lymphoblastic tumour.",
    'lymphocytes': "Mature (peripheral) lymphoid neoplasms - no TdT, no CD34. Includes CLL, MCL, B-PLL, HCL, FL, marginal zone disorders, T-LPD, T-LGL, ATLL, Sezary syndrome and plasma cell leukaemia.",
    'b-lymphoid': "Mature B-cell neoplasm. CD19 positive with SURFACE kappa or lambda restriction (a kappa:lambda ratio outside roughly 0.3-3.0 suggests clonality). Plasma cell neoplasms are the exception - they need CYTOPLASMIC light chain.",
    't-lymphoid': "Mature T-cell neoplasm. sCD3 positive. There is no light chain equivalent, so clonality relies on aberrant loss of pan-T antigens (CD2, CD5, CD7, CD3), a markedly skewed CD4:CD8 ratio, restricted TCR V-beta usage, or TCR gene rearrangement.",
    'b-cd5-pos': "CD5-positive mature B-cell disorders: B-CLL, mantle cell lymphoma and a minority of B-PLL. Split them on CD23, FMC7, CD200 and surface Ig intensity.",
    'b-cd5-neg': "CD5-negative mature B-cell disorders: marginal zone / lymphoplasmacytic (B-LPD), hairy cell leukaemia and follicular lymphoma. CD10 separates FL; CD103/CD25/CD11c/CD123 separate HCL.",
    't-cd8': "CD8-positive cytotoxic T-cell disorders - T-LPD and T-cell large granular lymphocytic leukaemia.",
    't-cd4': "CD4-positive helper T-cell disorders - ATLL (CD25 bright, HTLV-1 positive) and Sezary syndrome (CD25 negative, with CD7 and CD26 loss).",
    'myeloid-prolif': "A mature myeloid proliferation with <20% blasts: myeloproliferative neoplasms, MDS/MPN overlap disorders and MDS. Flow cytometry does NOT make these diagnoses - FBC, film, marrow trephine and molecular testing do. Always exclude a reactive cause (leukaemoid reaction, infection, G-CSF) first; the LAP/NAP score is HIGH in a reactive leukaemoid reaction and LOW in CML.",
    'bcr-pos': "BCR::ABL1 detected by RT-qPCR, FISH or karyotype (t(9;22), the Philadelphia chromosome). This defines CML and must be excluded before any of the Ph-negative diagnoses can be made.",
    'bcr-neg': "No BCR::ABL1. Now separate on the dominant cell line: monocytosis (CMML), neutrophilia (MDS/MPN with neutrophilia or CNL), cytopenias with dysplasia (MDS), or erythrocytosis / thrombocytosis / fibrosis (PV, ET, PMF). Myeloid-lymphoid neoplasms with PDGFRA, PDGFRB, FGFR1 or JAK2 tyrosine kinase fusions must also be excluded.",
    'cml-bp': "CML blast phase - WHO 5th ed defines it as >=20% blasts in blood or marrow, an extramedullary blast proliferation, or ANY increase in lymphoblasts. Roughly two thirds of blast crises are myeloid and one third lymphoid (usually B-lineage, TdT+/CD19+), so immunophenotyping the blasts is essential because it changes treatment. Use the Acute tree to phenotype them. Note the accelerated phase was REMOVED in WHO 5th ed."
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
  let treeButtons = [], svgElement, flowchartCaption;
  let detailDrawer, drawerTitle, drawerBody, drawerCloseBtn;

  function getCurrentTree() {
    return TREES[currentFlowchart] || ACUTE_TREE;
  }

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
    treeButtons = Array.from(document.querySelectorAll('.tree-toggle-group [data-tree]'));
    svgElement = document.getElementById('flowchart-svg');
    flowchartCaption = document.getElementById('flowchart-caption');

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
    treeButtons.forEach(btn => {
      btn.addEventListener('click', () => switchFlowchart(btn.getAttribute('data-tree')));
    });

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
    if (!TREES[type]) return;
    currentFlowchart = type;

    treeButtons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tree') === type);
    });

    const tree = TREES[type];
    svgElement.setAttribute('viewBox', tree.viewBox);
    // Height derives from the viewBox so every tree keeps a 400-unit-wide aspect ratio
    svgElement.setAttribute('height', String(parseFloat(tree.viewBox.split(/\s+/)[3])));

    if (flowchartCaption) flowchartCaption.textContent = tree.caption || '';

    closeDetailDrawer();
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
  //
  // A marker that a reference profile does not mention is NOT evidence against that profile -
  // the profile is simply silent on it. Such markers are excluded from the score and reported
  // separately as "unreferenced", so that a sparsely characterised entity is not wrongly ruled
  // out, and a profile that happens to list few markers is not flattered by a false 100%.
  const POSITIVE_VALS = ['+', '++', '+++'];
  const VARIABLE_VALS = ['+/-', '-/+', '+ or -', 'clonal'];

  function getMatchScore(disease, activeSelections) {
    let score = 0;
    let scoredCount = 0;   // selected markers that this profile actually specifies
    let unreferenced = 0;  // selected markers this profile says nothing about
    let isCompatible = true;

    const selectedKeys = Object.keys(activeSelections).filter(k => activeSelections[k] !== 'neutral');
    if (selectedKeys.length === 0) {
      return { score: 100, confidence: 100, isCompatible: true, totalSelected: 0, scoredCount: 0, unreferenced: 0, matchedCount: 0 };
    }

    for (const marker of selectedKeys) {
      const userVal = activeSelections[marker];
      const expectedVal = disease.markers[marker];

      if (expectedVal === undefined) {
        unreferenced++;
        continue; // silent, not contradictory
      }

      scoredCount++;

      if (userVal === 'pos') {
        if (POSITIVE_VALS.indexOf(expectedVal) !== -1) {
          score += 1.0;
        } else if (VARIABLE_VALS.indexOf(expectedVal) !== -1) {
          score += 0.7; // variable / clonally restricted - compatible either way
        } else if (expectedVal === 'aberrant') {
          score += 0.5; // aberrant positivity is compatible but not prototypical
        } else if (expectedVal === '-') {
          isCompatible = false; // a strictly negative antigen is expressed = mismatch
        }
      } else if (userVal === 'neg') {
        if (expectedVal === '-') {
          score += 1.0;
        } else if (expectedVal === 'aberrant') {
          score += 1.0; // aberrant markers are absent in the great majority of cases
        } else if (VARIABLE_VALS.indexOf(expectedVal) !== -1) {
          score += 0.7;
        } else if (POSITIVE_VALS.indexOf(expectedVal) !== -1) {
          isCompatible = false; // a prototypical antigen is absent = mismatch
        }
      }
    }

    // Accuracy: of the markers this profile DOES specify, how many did the user match?
    const finalPercent = scoredCount > 0 ? Math.round((score / scoredCount) * 100) : 0;
    // Confidence: accuracy weighted by how much of the user's selection the profile covers.
    // Without this, an entity that references 1 of 6 selected markers and matches it would
    // sit alongside one that references and matches all 6.
    const coverage = scoredCount / selectedKeys.length;
    const confidence = Math.round(finalPercent * coverage);

    return {
      score: isCompatible ? finalPercent : 0,
      confidence: isCompatible ? confidence : 0,
      isCompatible: isCompatible,
      totalSelected: selectedKeys.length,
      scoredCount: scoredCount,
      unreferenced: unreferenced,
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
        disease: disease,
        score: matchDetails.score,
        confidence: matchDetails.confidence,
        isCompatible: matchDetails.isCompatible,
        totalSelected: matchDetails.totalSelected,
        scoredCount: matchDetails.scoredCount,
        unreferenced: matchDetails.unreferenced,
        matchedCount: matchDetails.matchedCount
      };
    });

    // Filter compatible, sort by confidence descending
    const compatible = scoredList.filter(item => item.isCompatible);
    const incompatible = scoredList.filter(item => !item.isCompatible);

    // Rank on confidence (accuracy x coverage) so a 100% built on 2 referenced markers
    // does not outrank a 100% built on 8. Ties break on accuracy, then name for stability.
    compatible.sort((a, b) => {
      if (b.confidence !== a.confidence) return b.confidence - a.confidence;
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
      if (item.confidence === 100) matchClass = 'match-perfect';
      if (item.totalSelected === 0 || item.scoredCount === 0) matchClass = 'match-neutral';

      card.className = `prediction-card ${matchClass}`;
      
      const headerRow = document.createElement('div');
      headerRow.className = 'pred-card-header';
      headerRow.style.display = 'flex';
      headerRow.style.justifyContent = 'space-between';
      headerRow.style.alignItems = 'center';
      
      // Score badge color
      const hasEvidence = item.totalSelected > 0 && item.scoredCount > 0;
      let badgeStyle = `background-color: rgba(148, 163, 184, 0.1); color: var(--text-secondary);`;
      if (hasEvidence && item.confidence === 100) {
        badgeStyle = `background-color: rgba(0, 229, 255, 0.1); color: var(--accent-cyan); border: 1.5px solid rgba(0, 229, 255, 0.2);`;
      } else if (hasEvidence) {
        badgeStyle = `background-color: rgba(255, 152, 0, 0.1); color: var(--accent-orange); border: 1.5px solid rgba(255, 152, 0, 0.2);`;
      }

      let badgeText = 'Reference';
      if (item.totalSelected > 0) {
        badgeText = hasEvidence ? `${item.score}%` : 'No data';
      }

      headerRow.innerHTML = `
        <div style="display: flex; flex-direction: column;">
          <span style="font-weight: 700; font-size: 13px; color: var(--text-primary);">${d.name}</span>
          <span style="font-size: 10px; color: var(--text-muted);">${d.fullName}</span>
        </div>
        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 2px;">
          <span class="score-badge" style="font-size: 11px; font-weight: 700; padding: 2px 6px; border-radius: 4px; ${badgeStyle}">
            ${badgeText}
          </span>
          ${item.totalSelected > 0 ? `
          <span style="font-size: 8.5px; color: var(--text-muted); white-space: nowrap;" title="Markers this reference profile actually specifies, out of those you selected">
            ${item.scoredCount}/${item.totalSelected} referenced
          </span>` : ''}
        </div>
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
        
        let display = val.toUpperCase();

        if (val === 'clonal') {
          // Monoclonal restriction: positive for one light chain, negative for the other
          labelClass = 'marker-label-clonal';
          valStyle = 'color: var(--accent-purple, #a78bfa); font-weight: 700; font-size: 8.5px;';
          display = 'CLONAL';
        } else if (val === 'aberrant') {
          // Highlight aberrant markers in red (red on the slide)
          labelClass = 'marker-label-aberrant';
          valStyle = 'color: var(--accent-red); font-weight: 700; font-size: 8.5px;';
          display = 'ABERRANT';
        } else if (val.indexOf('+') !== -1) {
          valStyle = 'color: var(--accent-cyan); font-weight: 700;';
        } else if (val === '-') {
          valStyle = 'color: var(--accent-orange);';
        }

        const formattedLabel = k.replace('_', '-');

        markerListHTML += `
          <div class="drawer-marker-box ${labelClass}" style="display: flex; flex-direction: column; align-items: center; background: rgba(0,0,0,0.15); border-radius: 4px; padding: 4px; border: 1px solid var(--border-color);">
            <span style="font-size: 9px; font-weight: 600;">${formattedLabel}</span>
            <span style="font-size: 10px; ${valStyle}">${display}</span>
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

        ${disease.keyTest ? `
        <div>
          <h5 style="font-size: 10px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 4px;">Confirmatory / Key Test</h5>
          <p style="font-size: 11px; color: var(--text-secondary); line-height: 1.4;">${disease.keyTest}</p>
        </div>` : ''}

        ${disease.whoNote ? `
        <div style="border-left: 2px solid var(--accent-cyan); padding-left: 8px;">
          <h5 style="font-size: 10px; text-transform: uppercase; color: var(--accent-cyan); margin-bottom: 4px;">WHO 5th Edition (2022)</h5>
          <p style="font-size: 11px; color: var(--text-secondary); line-height: 1.4;">${disease.whoNote}</p>
        </div>` : ''}

        ${disease.correction ? `
        <div style="border-left: 2px solid var(--accent-red); padding-left: 8px;">
          <h5 style="font-size: 10px; text-transform: uppercase; color: var(--accent-red); margin-bottom: 4px;">Correction to Teaching Slide</h5>
          <p style="font-size: 11px; color: var(--text-secondary); line-height: 1.4;">${disease.correction}</p>
        </div>` : ''}

        <div>
          <h5 style="font-size: 10px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px;">Expected Immunophenotype</h5>
          ${markerListHTML}
          <p style="font-size: 9px; color: var(--text-muted); margin-top: 6px; line-height: 1.4;">
            +/- usually positive &middot; -/+ usually negative or dim &middot;
            CLONAL restricted to kappa <em>or</em> lambda &middot; ABERRANT not normally present, supports clonality
          </p>
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

    // Apply only what the profile explicitly states. Markers the profile is silent on stay
    // neutral - asserting them as negative would be putting words in the reference's mouth.
    MARKER_GROUPS.forEach(group => {
      group.markers.forEach(m => {
        const val = disease.markers[m.id];
        let state = 'neutral';
        if (val === '-' || val === '-/+') {
          // "-/+" is usually negative or dim, so the prototypical case is negative
          state = 'neg';
        } else if (POSITIVE_VALS.indexOf(val) !== -1 || val === '+/-') {
          state = 'pos';
        }
        // 'aberrant' and 'clonal' are deliberately left neutral: neither presence nor
        // absence is the prototypical finding.
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
    // Routes through switchFlowchart so the viewBox, caption and button states are
    // set from the tree definition rather than duplicated here.
    switchFlowchart(currentFlowchart);
  }

  function getChildrenIds(nodeId, tree) {
    return tree.links.filter(l => l.from === nodeId).map(l => l.to);
  }

  function getNodeState(nodeId, scoreList) {
    // If it's a disease node
    const scoreData = scoreList.find(s => s.disease.id === nodeId);
    if (scoreData) {
      if (scoreData.totalSelected === 0) return 'neutral';
      if (scoreData.confidence === 100) return 'active';
      if (scoreData.score > 0) return 'partial';
      return 'dimmed';
    }

    // Otherwise, check children (branch or root node)
    const children = getChildrenIds(nodeId, getCurrentTree());
    
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

    const tree = getCurrentTree();

    // Scored List cache
    const scoreList = LEUKAEMIAS.map(disease => {
      const matchDetails = getMatchScore(disease, selectedMarkers);
      return {
        disease: disease,
        score: matchDetails.score,
        confidence: matchDetails.confidence,
        isCompatible: matchDetails.isCompatible,
        // A profile that references none of the selected markers has no opinion,
        // so treat it as unselected rather than dimming it out of the tree.
        totalSelected: matchDetails.scoredCount === 0 ? 0 : matchDetails.totalSelected
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
          return;
        }

        const expl = NODE_EXPLANATIONS[node.id];
        if (expl) {
          const headline = node.label.split('\n')[0];
          drawerTitle.innerHTML = `<span style="font-weight:800; font-size:12px; color:var(--text-primary);">${headline} &mdash; decision point</span>`;
          drawerBody.innerHTML = `<p style="font-size:11px; color:var(--text-secondary); line-height:1.5;">${expl}</p>`;
          detailDrawer.classList.add('open');
        }
      });

      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', node.x);
      rect.setAttribute('y', node.y);
      rect.setAttribute('width', node.w);
      rect.setAttribute('height', node.h);
      rect.setAttribute('rx', 4);
      rect.setAttribute('ry', 4);
      g.appendChild(rect);

      // Labels may be multi-line: line 1 is the entity name, later lines are the
      // discriminating criterion and render smaller/muted.
      const lines = node.label.split('\n');
      const lineHeight = 9;
      const blockHeight = lines.length * lineHeight;
      const firstBaseline = node.y + node.h / 2 - blockHeight / 2 + lineHeight - 1.5;

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', node.x + node.w / 2);
      text.setAttribute('y', firstBaseline);
      text.setAttribute('text-anchor', 'middle');

      lines.forEach((line, i) => {
        const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
        tspan.setAttribute('x', node.x + node.w / 2);
        if (i > 0) tspan.setAttribute('dy', lineHeight);
        if (i > 0) tspan.setAttribute('class', 'flow-node-sub');
        tspan.textContent = line;
        text.appendChild(tspan);
      });

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
