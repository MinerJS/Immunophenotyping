/**
 * data.js
 * Synthetic Data Generator for Flow Cytometry Trainer.
 * Modeled on ClearLLab 10C panel characteristics from the Casebooks.
 */

const MARKERS = [
  'FSC_A', 'SSC_A', 'FSC_H', 'Time', 'CD45',
  'CD3', 'CD4', 'CD8', 'CD5', 'CD19', 'CD20',
  'Kappa', 'Lambda', 'CD10', 'CD200', 'CD34',
  'CD38', 'CD117', 'CD123', 'CD13', 'CD33',
  'HLA_DR', 'CD11b', 'CD16', 'CD14', 'CD64',
  'CD56', 'TCR_gd', 'CD2', 'CD7', 'CD15'
];

// Helper to generate normally distributed random numbers (Box-Muller transform)
function gaussianRandom(mean, std) {
  let u = 0, v = 0;
  while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
  while (v === 0) v = Math.random();
  let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  let val = num * std + mean;
  return Math.max(0, Math.min(1000, val));
}

// Generate base cell traits
function createBaseCell() {
  const cell = {};
  MARKERS.forEach(m => {
    cell[m] = gaussianRandom(80, 25); // Baseline background staining / autofluorescence
  });
  cell.Time = 0; // Will be set sequentially
  return cell;
}

/**
 * Generates cell data for Case 1: Normal Peripheral Whole Blood
 * 6,000 events
 */
function generateNormalCase() {
  const events = [];
  const totalEvents = 6000;
  
  for (let i = 0; i < totalEvents; i++) {
    const cell = createBaseCell();
    cell.Time = (i / totalEvents) * 1000 + gaussianRandom(0, 5); // stable fluidics
    
    // Determine cell lineage
    const rand = Math.random();
    
    if (rand < 0.02) {
      // Debris: very low size, low CD45
      cell.FSC_A = gaussianRandom(100, 30);
      cell.SSC_A = gaussianRandom(80, 40);
      cell.FSC_H = cell.FSC_A * gaussianRandom(0.95, 0.05);
      cell.CD45 = gaussianRandom(100, 40);
      cell.type = 'Debris';
    } 
    else if (rand < 0.04) {
      // Doublets / Aggregates: off diagonal
      cell.FSC_A = gaussianRandom(700, 100);
      cell.SSC_A = gaussianRandom(400, 100);
      cell.FSC_H = cell.FSC_A * gaussianRandom(0.55, 0.08); // FSC_H is much lower than FSC_A
      cell.CD45 = gaussianRandom(600, 150);
      cell.type = 'Doublets';
    }
    else if (rand < 0.34) {
      // Lymphocytes (~30% of single cells)
      cell.FSC_A = gaussianRandom(350, 40);
      cell.SSC_A = gaussianRandom(120, 20);
      cell.FSC_H = cell.FSC_A * gaussianRandom(0.98, 0.02);
      cell.CD45 = gaussianRandom(850, 30); // Bright CD45
      
      const subRand = Math.random();
      if (subRand < 0.70) {
        // T Cells (70% of Lymphocytes)
        cell.CD3 = gaussianRandom(880, 30);
        cell.CD5 = gaussianRandom(850, 35);
        cell.CD2 = gaussianRandom(860, 30);
        cell.CD7 = gaussianRandom(870, 30);
        
        const tRand = Math.random();
        if (tRand < 0.65) {
          // CD4 Helper T
          cell.CD4 = gaussianRandom(850, 30);
          cell.CD8 = gaussianRandom(80, 15);
          cell.type = 'CD4_TCell';
        } else if (tRand < 0.90) {
          // CD8 Cytotoxic T
          cell.CD4 = gaussianRandom(80, 15);
          cell.CD8 = gaussianRandom(880, 30);
          cell.type = 'CD8_TCell';
        } else {
          // Double Negative (mostly TCR gamma-delta)
          cell.CD4 = gaussianRandom(80, 15);
          cell.CD8 = gaussianRandom(80, 15);
          cell.TCR_gd = gaussianRandom(850, 40);
          cell.type = 'gd_TCell';
        }
      } 
      else if (subRand < 0.85) {
        // B Cells (15% of Lymphocytes)
        cell.CD19 = gaussianRandom(850, 30);
        cell.CD20 = gaussianRandom(880, 25);
        cell.CD200 = gaussianRandom(750, 40);
        cell.CD10 = gaussianRandom(80, 15); // mature B are CD10-
        cell.CD5 = gaussianRandom(80, 20); // normal B are CD5- (with tiny dim subset)
        
        // Kappa vs Lambda clonal exclusion (1.4:1 ratio)
        if (Math.random() < 0.58) {
          cell.Kappa = gaussianRandom(850, 35);
          cell.Lambda = gaussianRandom(80, 15);
        } else {
          cell.Kappa = gaussianRandom(80, 15);
          cell.Lambda = gaussianRandom(850, 35);
        }
        cell.type = 'BCell';
      } 
      else {
        // NK Cells (15% of Lymphocytes)
        cell.CD56 = gaussianRandom(850, 40);
        cell.CD16 = gaussianRandom(800, 50);
        cell.CD2 = gaussianRandom(780, 45);
        cell.CD7 = gaussianRandom(840, 35);
        cell.CD3 = gaussianRandom(80, 15);
        cell.type = 'NKCell';
      }
    } 
    else if (rand < 0.44) {
      // Monocytes (~10% of cells)
      cell.FSC_A = gaussianRandom(620, 40);
      cell.SSC_A = gaussianRandom(450, 30);
      cell.FSC_H = cell.FSC_A * gaussianRandom(0.97, 0.02);
      cell.CD45 = gaussianRandom(720, 35); // CD45 positive, slightly dimmer than lymphocytes
      cell.CD14 = gaussianRandom(850, 30);
      cell.CD64 = gaussianRandom(880, 25);
      cell.CD33 = gaussianRandom(860, 30);
      cell.CD13 = gaussianRandom(780, 40);
      cell.CD11b = gaussianRandom(840, 30);
      cell.HLA_DR = gaussianRandom(820, 40);
      cell.CD4 = gaussianRandom(450, 40); // CD4 positive at moderate/dim level on monocytes
      cell.CD2 = gaussianRandom(250, 40); // CD2 dim on monocytes
      cell.CD15 = gaussianRandom(350, 50); // CD15 dim on monocytes
      cell.type = 'Monocyte';
    } 
    else {
      // Granulocytes (~55% of cells)
      cell.FSC_A = gaussianRandom(720, 45);
      cell.SSC_A = gaussianRandom(820, 45); // High SSC
      cell.FSC_H = cell.FSC_A * gaussianRandom(0.96, 0.03);
      cell.CD45 = gaussianRandom(580, 40); // CD45 positive but dimmer
      cell.CD16 = gaussianRandom(880, 30);
      cell.CD13 = gaussianRandom(820, 35);
      cell.CD10 = gaussianRandom(780, 40); // Mature granulocytes are CD10+
      cell.CD11b = gaussianRandom(850, 30);
      cell.CD14 = gaussianRandom(250, 40); // CD14 dim
      cell.CD64 = gaussianRandom(150, 30); // resting granulocytes have very low CD64
      cell.CD15 = gaussianRandom(850, 30); // CD15 positive on granulocytes
      cell.type = 'Granulocyte';
    }
    
    // Rare Normal Progenitors (0.01% - added just for realism, e.g. 1-2 cells per sample)
    if (i < 3) {
      cell.FSC_A = gaussianRandom(400, 30);
      cell.SSC_A = gaussianRandom(220, 25);
      cell.CD45 = gaussianRandom(420, 30); // CD45 dim
      cell.CD34 = gaussianRandom(850, 40);
      cell.CD117 = gaussianRandom(780, 50);
      cell.HLA_DR = gaussianRandom(800, 40);
      cell.CD38 = gaussianRandom(750, 40);
      cell.CD13 = gaussianRandom(450, 60);
      cell.CD33 = gaussianRandom(600, 50);
      cell.type = 'NormalProgenitor';
    }

    events.push(cell);
  }
  return events;
}

/**
 * Generates cell data for Case 18: Acute Myeloid Leukemia
 * 6,000 events with 65% leukemia blasts
 */
function generateAMLCase() {
  const events = [];
  const totalEvents = 6000;
  
  for (let i = 0; i < totalEvents; i++) {
    const cell = createBaseCell();
    cell.Time = (i / totalEvents) * 1000 + gaussianRandom(0, 5); // stable fluidics
    
    const rand = Math.random();
    
    if (rand < 0.02) {
      // Debris
      cell.FSC_A = gaussianRandom(100, 30);
      cell.SSC_A = gaussianRandom(80, 40);
      cell.FSC_H = cell.FSC_A * gaussianRandom(0.95, 0.05);
      cell.CD45 = gaussianRandom(100, 40);
      cell.type = 'Debris';
    } 
    else if (rand < 0.04) {
      // Doublets
      cell.FSC_A = gaussianRandom(650, 100);
      cell.SSC_A = gaussianRandom(350, 100);
      cell.FSC_H = cell.FSC_A * gaussianRandom(0.55, 0.08);
      cell.CD45 = gaussianRandom(500, 120);
      cell.type = 'Doublets';
    }
    else if (rand < 0.69) {
      // EXPANDED ABERRANT MYELOBLASTS (~65% of all events in AML bone marrow/blood)
      cell.FSC_A = gaussianRandom(450, 40); // Progenitor size
      cell.SSC_A = gaussianRandom(220, 30); // Low to intermediate Side Scatter
      cell.FSC_H = cell.FSC_A * gaussianRandom(0.98, 0.02);
      cell.CD45 = gaussianRandom(410, 30); // CD45 dim (classic blast gate)
      
      // Progenitor/Blast markers
      cell.CD34 = gaussianRandom(840, 40);  // CD34 positive (stem cells/blasts)
      cell.CD117 = gaussianRandom(780, 45); // CD117 positive (myeloid blasts)
      cell.CD38 = gaussianRandom(760, 40);  // CD38 positive (lineage committed progenitors)
      cell.CD123 = gaussianRandom(560, 50); // CD123 positive (interleukin-3 receptor alpha)
      cell.HLA_DR = gaussianRandom(650, 75); // Variable HLA-DR positive
      
      // Myeloid lineage markers
      cell.CD33 = gaussianRandom(830, 40);  // CD33 positive (myeloid origin)
      cell.CD13 = gaussianRandom(110, 25);  // ABERRANT LOSS of CD13 (normally myeloid blasts are CD13 positive!)
      
      // Aberrant lymphoid marker expression
      cell.CD7 = gaussianRandom(760, 55);   // ABERRANT EXPRESSION of CD7 (normally a T-cell/NK marker)
      
      // Negative for mature lineage markers
      cell.CD3 = gaussianRandom(80, 15);
      cell.CD19 = gaussianRandom(80, 15);
      cell.CD20 = gaussianRandom(80, 15);
      cell.CD14 = gaussianRandom(80, 15);
      cell.CD64 = gaussianRandom(80, 15);
      cell.CD15 = gaussianRandom(80, 15);
      cell.CD11b = gaussianRandom(80, 15);
      cell.CD16 = gaussianRandom(80, 15);
      
      cell.type = 'AML_Blast';
    }
    else if (rand < 0.79) {
      // Residual Lymphocytes (~10% of cells)
      cell.FSC_A = gaussianRandom(350, 40);
      cell.SSC_A = gaussianRandom(120, 20);
      cell.FSC_H = cell.FSC_A * gaussianRandom(0.98, 0.02);
      cell.CD45 = gaussianRandom(850, 30);
      
      const subRand = Math.random();
      if (subRand < 0.70) {
        cell.CD3 = gaussianRandom(880, 30);
        cell.CD5 = gaussianRandom(850, 35);
        cell.CD2 = gaussianRandom(860, 30);
        cell.CD7 = gaussianRandom(870, 30);
        
        if (Math.random() < 0.65) {
          cell.CD4 = gaussianRandom(850, 30);
          cell.CD8 = gaussianRandom(80, 15);
          cell.type = 'CD4_TCell';
        } else {
          cell.CD4 = gaussianRandom(80, 15);
          cell.CD8 = gaussianRandom(880, 30);
          cell.type = 'CD8_TCell';
        }
      } else if (subRand < 0.85) {
        cell.CD19 = gaussianRandom(850, 30);
        cell.CD20 = gaussianRandom(880, 25);
        cell.CD200 = gaussianRandom(750, 40);
        if (Math.random() < 0.58) {
          cell.Kappa = gaussianRandom(850, 35);
          cell.Lambda = gaussianRandom(80, 15);
        } else {
          cell.Kappa = gaussianRandom(80, 15);
          cell.Lambda = gaussianRandom(850, 35);
        }
        cell.type = 'BCell';
      } else {
        cell.CD56 = gaussianRandom(850, 40);
        cell.CD16 = gaussianRandom(800, 50);
        cell.CD2 = gaussianRandom(780, 45);
        cell.CD7 = gaussianRandom(840, 35);
        cell.CD3 = gaussianRandom(80, 15);
        cell.type = 'NKCell';
      }
    } 
    else if (rand < 0.84) {
      // Residual Monocytes (~5% of cells)
      cell.FSC_A = gaussianRandom(620, 40);
      cell.SSC_A = gaussianRandom(450, 30);
      cell.FSC_H = cell.FSC_A * gaussianRandom(0.97, 0.02);
      cell.CD45 = gaussianRandom(720, 35);
      cell.CD14 = gaussianRandom(850, 30);
      cell.CD64 = gaussianRandom(880, 25);
      cell.CD33 = gaussianRandom(860, 30);
      cell.CD13 = gaussianRandom(780, 40);
      cell.CD11b = gaussianRandom(840, 30);
      cell.HLA_DR = gaussianRandom(820, 40);
      cell.CD4 = gaussianRandom(450, 40);
      cell.CD2 = gaussianRandom(250, 40); // CD2 dim on monocytes
      cell.CD15 = gaussianRandom(350, 50); // CD15 dim on monocytes
      cell.type = 'Monocyte';
    } 
    else {
      // Residual Granulocytes (~15% of cells - depressed in leukemia BM)
      cell.FSC_A = gaussianRandom(720, 45);
      cell.SSC_A = gaussianRandom(820, 45);
      cell.FSC_H = cell.FSC_A * gaussianRandom(0.96, 0.03);
      cell.CD45 = gaussianRandom(580, 40);
      cell.CD16 = gaussianRandom(880, 30);
      cell.CD13 = gaussianRandom(820, 35);
      cell.CD10 = gaussianRandom(780, 40);
      cell.CD11b = gaussianRandom(850, 30);
      cell.CD14 = gaussianRandom(250, 40);
      cell.CD64 = gaussianRandom(150, 30);
      cell.CD15 = gaussianRandom(850, 30); // CD15 positive on granulocytes
      cell.type = 'Granulocyte';
    }
    
    events.push(cell);
  }
  return events;
}

/**
 * Generates cell data for specific FAB subtypes of Acute Myeloid Leukemia
 * 6,000 events with 65% leukemia blasts of the specified subtype
 */
function generateAMLSubtypeCase(subtype) {
  const events = [];
  const totalEvents = 6000;
  
  for (let i = 0; i < totalEvents; i++) {
    const cell = createBaseCell();
    cell.Time = (i / totalEvents) * 1000 + gaussianRandom(0, 5); // stable fluidics
    
    const rand = Math.random();
    
    if (rand < 0.02) {
      // Debris
      cell.FSC_A = gaussianRandom(100, 30);
      cell.SSC_A = gaussianRandom(80, 40);
      cell.FSC_H = cell.FSC_A * gaussianRandom(0.95, 0.05);
      cell.CD45 = gaussianRandom(100, 40);
      cell.type = 'Debris';
    } 
    else if (rand < 0.04) {
      // Doublets
      cell.FSC_A = gaussianRandom(650, 100);
      cell.SSC_A = gaussianRandom(350, 100);
      cell.FSC_H = cell.FSC_A * gaussianRandom(0.55, 0.08);
      cell.CD45 = gaussianRandom(500, 120);
      cell.type = 'Doublets';
    }
    else if (rand < 0.69) {
      // AML blasts block - customized per subtype
      cell.FSC_H = cell.FSC_A * gaussianRandom(0.98, 0.02);
      
      // Default mature lineage markers as negative
      cell.CD3 = gaussianRandom(80, 15);
      cell.CD19 = gaussianRandom(80, 15);
      cell.CD20 = gaussianRandom(80, 15);
      cell.CD14 = gaussianRandom(80, 15);
      cell.CD64 = gaussianRandom(80, 15);
      cell.CD15 = gaussianRandom(80, 15);
      cell.CD11b = gaussianRandom(80, 15);
      cell.CD16 = gaussianRandom(80, 15);
      cell.CD4 = gaussianRandom(80, 15);
      cell.CD5 = gaussianRandom(80, 15);
      cell.CD8 = gaussianRandom(80, 15);
      cell.CD56 = gaussianRandom(80, 15);
      cell.CD7 = gaussianRandom(80, 15);
      cell.CD2 = gaussianRandom(80, 15);
      cell.TCR_gd = gaussianRandom(80, 15);
      cell.CD10 = gaussianRandom(80, 15);
      cell.CD200 = gaussianRandom(80, 15);
      cell.Kappa = gaussianRandom(80, 15);
      cell.Lambda = gaussianRandom(80, 15);
      cell.CD123 = gaussianRandom(80, 15);
      
      switch (subtype) {
        case 'aml_m0':
          cell.type = 'AML_Blast_M0';
          cell.FSC_A = gaussianRandom(450, 40);
          cell.SSC_A = gaussianRandom(220, 30);
          cell.CD45 = gaussianRandom(410, 30);
          cell.CD34 = gaussianRandom(840, 40);
          cell.CD117 = gaussianRandom(780, 45);
          cell.HLA_DR = gaussianRandom(750, 45);
          cell.CD38 = gaussianRandom(760, 40);
          cell.CD13 = gaussianRandom(400, 50); // dim CD13
          cell.CD33 = gaussianRandom(450, 60); // dim CD33
          // Aberrant lymphoid
          cell.CD7 = gaussianRandom(700, 60);
          cell.CD56 = gaussianRandom(650, 70);
          break;
          
        case 'aml_m1':
          cell.type = 'AML_Blast_M1';
          cell.FSC_A = gaussianRandom(460, 40);
          cell.SSC_A = gaussianRandom(220, 30);
          cell.CD45 = gaussianRandom(410, 30);
          cell.CD34 = gaussianRandom(840, 40);
          cell.CD117 = gaussianRandom(800, 40);
          cell.HLA_DR = gaussianRandom(780, 40);
          cell.CD38 = gaussianRandom(760, 40);
          cell.CD13 = gaussianRandom(750, 40);
          cell.CD33 = gaussianRandom(830, 40);
          // Aberrant lymphoid
          cell.CD7 = gaussianRandom(650, 80);
          break;
          
        case 'aml_m2':
          // 60% primitive blasts, 40% maturing cells
          if (Math.random() < 0.60) {
            cell.type = 'AML_Blast_M2';
            cell.FSC_A = gaussianRandom(450, 40);
            cell.SSC_A = gaussianRandom(220, 30);
            cell.CD45 = gaussianRandom(410, 30);
            cell.CD34 = gaussianRandom(840, 40);
            cell.CD117 = gaussianRandom(780, 40);
            cell.HLA_DR = gaussianRandom(700, 45);
            cell.CD38 = gaussianRandom(760, 40);
            cell.CD13 = gaussianRandom(650, 50);
            cell.CD33 = gaussianRandom(750, 40);
            // Aberrant CD19 (RUNX1-RUNX1T1 / t(8;21)) and CD56
            cell.CD19 = gaussianRandom(720, 50);
            cell.CD56 = gaussianRandom(600, 60);
          } else {
            cell.type = 'AML_Blast_M2_Maturing';
            cell.FSC_A = gaussianRandom(650, 50);
            cell.SSC_A = gaussianRandom(450, 60);
            cell.CD45 = gaussianRandom(520, 40);
            cell.CD34 = gaussianRandom(80, 15);
            cell.CD117 = gaussianRandom(180, 40);
            cell.HLA_DR = gaussianRandom(120, 30);
            cell.CD38 = gaussianRandom(700, 45);
            cell.CD13 = gaussianRandom(750, 40);
            cell.CD33 = gaussianRandom(700, 45);
            cell.CD15 = gaussianRandom(750, 40);
            cell.CD11b = gaussianRandom(680, 40);
            cell.CD16 = gaussianRandom(450, 80);
          }
          break;
          
        case 'aml_m3':
          cell.type = 'AML_Blast_M3';
          cell.FSC_A = gaussianRandom(680, 45);
          cell.SSC_A = gaussianRandom(680, 60); // High SSC!
          cell.CD45 = gaussianRandom(420, 30);
          cell.CD34 = gaussianRandom(80, 15); // HLA-DR- and CD34- is classic for M3
          cell.CD117 = gaussianRandom(320, 50);
          cell.HLA_DR = gaussianRandom(80, 15);
          cell.CD38 = gaussianRandom(680, 50);
          cell.CD13 = gaussianRandom(650, 45);
          cell.CD33 = gaussianRandom(950, 25); // Extremely bright CD33!
          cell.CD64 = gaussianRandom(720, 40); // CD64+
          cell.CD15 = gaussianRandom(150, 30);
          // Aberrant lymphoid
          cell.CD2 = gaussianRandom(620, 60);
          break;
          
        case 'aml_m4':
          // Mixture of myeloblasts (50%) and monoblasts/monocytic cells (50%)
          if (Math.random() < 0.50) {
            cell.type = 'AML_Blast_M4_Blast';
            cell.FSC_A = gaussianRandom(450, 40);
            cell.SSC_A = gaussianRandom(220, 30);
            cell.CD45 = gaussianRandom(410, 30);
            cell.CD34 = gaussianRandom(840, 40);
            cell.CD117 = gaussianRandom(780, 45);
            cell.HLA_DR = gaussianRandom(700, 45);
            cell.CD38 = gaussianRandom(760, 40);
            cell.CD13 = gaussianRandom(680, 50);
            cell.CD33 = gaussianRandom(750, 45);
          } else {
            cell.type = 'AML_Blast_M4_Mono';
            cell.FSC_A = gaussianRandom(640, 40);
            cell.SSC_A = gaussianRandom(350, 30);
            cell.CD45 = gaussianRandom(650, 35);
            cell.CD34 = gaussianRandom(120, 30);
            cell.CD117 = gaussianRandom(100, 20);
            cell.HLA_DR = gaussianRandom(850, 35);
            cell.CD38 = gaussianRandom(800, 30);
            cell.CD13 = gaussianRandom(720, 40);
            cell.CD33 = gaussianRandom(900, 30);
            cell.CD11b = gaussianRandom(780, 30);
            cell.CD14 = gaussianRandom(750, 50);
            cell.CD64 = gaussianRandom(850, 30);
            cell.CD4 = gaussianRandom(450, 45);
          }
          break;
          
        case 'aml_m5':
          cell.type = 'AML_Blast_M5';
          cell.FSC_A = gaussianRandom(680, 45);
          cell.SSC_A = gaussianRandom(340, 35);
          cell.CD45 = gaussianRandom(580, 40);
          cell.CD34 = gaussianRandom(120, 30);
          cell.CD117 = gaussianRandom(80, 15);
          cell.HLA_DR = gaussianRandom(900, 30);
          cell.CD38 = gaussianRandom(820, 35);
          cell.CD13 = gaussianRandom(600, 50);
          cell.CD33 = gaussianRandom(940, 25);
          cell.CD11b = gaussianRandom(720, 40);
          cell.CD14 = gaussianRandom(300, 200); // variable CD14
          cell.CD64 = gaussianRandom(880, 30);
          cell.CD4 = gaussianRandom(480, 45);
          cell.CD15 = gaussianRandom(450, 80);
          // Aberrant lymphoid
          cell.CD56 = gaussianRandom(720, 60);
          break;
          
        case 'aml_m6':
          // 75% erythroid blasts, 25% co-existing myeloblasts
          if (Math.random() < 0.75) {
            cell.type = 'AML_Blast_M6_Erythroid';
            cell.FSC_A = gaussianRandom(280, 30); // small cells
            cell.SSC_A = gaussianRandom(130, 20); // very low SSC
            cell.CD45 = gaussianRandom(60, 15); // CD45 negative / very dim
            cell.CD34 = gaussianRandom(80, 15);
            cell.CD117 = gaussianRandom(550, 60); // positive on early, negative on others
            cell.HLA_DR = gaussianRandom(80, 15);
            cell.CD38 = gaussianRandom(800, 30);
            cell.CD13 = gaussianRandom(80, 15);
            cell.CD33 = gaussianRandom(80, 15);
          } else {
            cell.type = 'AML_Blast_M6_Blast';
            cell.FSC_A = gaussianRandom(450, 40);
            cell.SSC_A = gaussianRandom(220, 30);
            cell.CD45 = gaussianRandom(410, 30);
            cell.CD34 = gaussianRandom(840, 40);
            cell.CD117 = gaussianRandom(780, 45);
            cell.HLA_DR = gaussianRandom(750, 45);
            cell.CD38 = gaussianRandom(760, 40);
            cell.CD13 = gaussianRandom(650, 50);
            cell.CD33 = gaussianRandom(700, 50);
          }
          break;
          
        case 'aml_m7':
          cell.type = 'AML_Blast_M7';
          cell.FSC_A = gaussianRandom(500, 60);
          cell.SSC_A = gaussianRandom(240, 40);
          cell.CD45 = gaussianRandom(410, 30);
          cell.CD34 = gaussianRandom(550, 80);
          cell.CD117 = gaussianRandom(620, 70);
          cell.HLA_DR = gaussianRandom(120, 30); // negative or dim HLA-DR
          cell.CD38 = gaussianRandom(750, 40);
          cell.CD13 = gaussianRandom(420, 80);
          cell.CD33 = gaussianRandom(480, 80);
          // Aberrant lymphoid
          cell.CD56 = gaussianRandom(740, 60);
          break;
          
        default:
          // fallback to M1/M2 style
          cell.type = 'AML_Blast';
          cell.FSC_A = gaussianRandom(450, 40);
          cell.SSC_A = gaussianRandom(220, 30);
          cell.CD45 = gaussianRandom(410, 30);
          cell.CD34 = gaussianRandom(840, 40);
          cell.CD117 = gaussianRandom(780, 45);
          cell.CD38 = gaussianRandom(760, 40);
          cell.CD123 = gaussianRandom(560, 50);
          cell.HLA_DR = gaussianRandom(650, 75);
          cell.CD33 = gaussianRandom(830, 40);
          cell.CD13 = gaussianRandom(110, 25);
          cell.CD7 = gaussianRandom(760, 55);
          break;
      }
    }
    else if (rand < 0.79) {
      // Residual Lymphocytes (~10% of cells)
      cell.FSC_A = gaussianRandom(350, 40);
      cell.SSC_A = gaussianRandom(120, 20);
      cell.FSC_H = cell.FSC_A * gaussianRandom(0.98, 0.02);
      cell.CD45 = gaussianRandom(850, 30);
      
      const subRand = Math.random();
      if (subRand < 0.70) {
        cell.CD3 = gaussianRandom(880, 30);
        cell.CD5 = gaussianRandom(850, 35);
        cell.CD2 = gaussianRandom(860, 30);
        cell.CD7 = gaussianRandom(870, 30);
        
        if (Math.random() < 0.65) {
          cell.CD4 = gaussianRandom(850, 30);
          cell.CD8 = gaussianRandom(80, 15);
          cell.type = 'CD4_TCell';
        } else {
          cell.CD4 = gaussianRandom(80, 15);
          cell.CD8 = gaussianRandom(880, 30);
          cell.type = 'CD8_TCell';
        }
      } else if (subRand < 0.85) {
        cell.CD19 = gaussianRandom(850, 30);
        cell.CD20 = gaussianRandom(880, 25);
        cell.CD200 = gaussianRandom(750, 40);
        if (Math.random() < 0.58) {
          cell.Kappa = gaussianRandom(850, 35);
          cell.Lambda = gaussianRandom(80, 15);
        } else {
          cell.Kappa = gaussianRandom(80, 15);
          cell.Lambda = gaussianRandom(850, 35);
        }
        cell.type = 'BCell';
      } else {
        cell.CD56 = gaussianRandom(850, 40);
        cell.CD16 = gaussianRandom(800, 50);
        cell.CD2 = gaussianRandom(780, 45);
        cell.CD7 = gaussianRandom(840, 35);
        cell.CD3 = gaussianRandom(80, 15);
        cell.type = 'NKCell';
      }
    } 
    else if (rand < 0.84) {
      // Residual Monocytes (~5% of cells)
      cell.FSC_A = gaussianRandom(620, 40);
      cell.SSC_A = gaussianRandom(450, 30);
      cell.FSC_H = cell.FSC_A * gaussianRandom(0.97, 0.02);
      cell.CD45 = gaussianRandom(720, 35);
      cell.CD14 = gaussianRandom(850, 30);
      cell.CD64 = gaussianRandom(880, 25);
      cell.CD33 = gaussianRandom(860, 30);
      cell.CD13 = gaussianRandom(780, 40);
      cell.CD11b = gaussianRandom(840, 30);
      cell.HLA_DR = gaussianRandom(820, 40);
      cell.CD4 = gaussianRandom(450, 40);
      cell.CD2 = gaussianRandom(250, 40);
      cell.CD15 = gaussianRandom(350, 50);
      cell.type = 'Monocyte';
    } 
    else {
      // Residual Granulocytes (~15% of cells)
      cell.FSC_A = gaussianRandom(720, 45);
      cell.SSC_A = gaussianRandom(820, 45);
      cell.FSC_H = cell.FSC_A * gaussianRandom(0.96, 0.03);
      cell.CD45 = gaussianRandom(580, 40);
      cell.CD16 = gaussianRandom(880, 30);
      cell.CD13 = gaussianRandom(820, 35);
      cell.CD10 = gaussianRandom(780, 40);
      cell.CD11b = gaussianRandom(850, 30);
      cell.CD14 = gaussianRandom(250, 40);
      cell.CD64 = gaussianRandom(150, 30);
      cell.CD15 = gaussianRandom(850, 30);
      cell.type = 'Granulocyte';
    }
    
    events.push(cell);
  }
  return events;
}

// Export module for browser or Node environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MARKERS,
    gaussianRandom,
    generateNormalCase,
    generateAMLCase,
    generateAMLSubtypeCase
  };
} else {
  window.FlowData = {
    MARKERS,
    generateNormalCase,
    generateAMLCase,
    generateAMLSubtypeCase
  };
}
