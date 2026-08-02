# Immunophenotyping & Flow-Gate Learn Interactive Trainer

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Three.js](https://img.shields.io/badge/Three.js-r128-black.svg)](https://threejs.org/)
[![HTML5 / Canvas](https://img.shields.io/badge/HTML5-Canvas-orange.svg)](https://developer.mozilla.org/)

An open-source interactive clinical reference, 3D cellular explorer, and gating trainer for **Flow Cytometric Immunophenotyping of Haematological Malignancies**. Designed for hematology trainees, pathologists, and laboratory scientists to learn single-cell leukocyte gating, 10-color panel interpretation, and differentiation of acute myeloid leukemia (AML FAB subtypes M0 through M7).

---

## 🎓 How to Learn from the Flow Cytometry Trainer

The application offers 5 primary interactive learning workflows:

### 1. 📊 Interactive Bivariate Gating
- Draw rectangular and polygonal gates on bivariate scatter plots (FSC vs SSC, FSC-A vs FSC-H, CD45 vs SSC, CD34 vs CD117).
- Master sequential gating: **Singlet Gate** (FSC_A vs FSC_H) → **Viable Cells Gate** → **CD45 vs SSC Cell Population Separation**.

### 2. 🧪 10-Color Panel Tube Selection
- Switch between 4 specialized antibody panel tubes using the **Plot Gallery** sidebar tab:
  - **B Cell Tube**: Kappa, Lambda, CD10, CD5, CD200, CD34, CD38, CD20, CD19, CD45
  - **T Cell Tube**: TCRγδ, CD4, CD2, CD56, CD5, CD34, CD7, CD8, CD3, CD45
  - **M1 Myeloid Tube**: CD16, CD7, CD10, CD13, CD64, CD34, CD14, HLA-DR, CD11b, CD45
  - **M2 Myeloid Tube**: CD15, CD123, CD117, CD13, CD33, CD34, CD38, HLA-DR, CD19, CD45

### 3. ⚖️ Normal vs AML Control Comparison ("Compare Normal vs Selected AML")
- Select **Compare Normal vs Selected AML** in the case study header dropdown.
- Inspect dual split-screen plots contrasting normal baseline (Case #1) against FAB AML subtypes (**AML-M0 Minimally Differentiated**, **AML-M1 Without Maturation**, **AML-M2 With Maturation**, **AML-M3 APL Promyelocytic**, **AML-M4 Acute Myelomonocytic**, **AML-M5 Acute Monocytic**, **AML-M6 Acute Erythroid**, **AML-M7 Acute Megakaryoblastic**).

### 4. 🧬 3D Cellular Explorer & Receptor Inspection
- Rotate, zoom, and interact with real-time 3D leukocyte cell models rendered in Three.js.
- Inspect surface receptor expressions (CD4, CD8, CD34, CD117, HLA-DR).

### 5. 🎬 Interactive SVG Gating & Population Shift Simulator
- Click **"🎓 How to Learn (Interactive Guide)"** in the top navigation bar to open the interactive educational guide and live SVG gating simulator sandbox.

---

## 🚀 Getting Started

Simply open `flow-cytometry-trainer/index.html` in any web browser!

```bash
# Clone the open-source repository
git clone https://github.com/MinerJS/Immunophenotyping.git
cd Immunophenotyping/flow-cytometry-trainer

# Open in browser or serve with any static web server
python3 -m http.server 8000
```

Visit [http://localhost:8000/flow-cytometry-trainer/](http://localhost:8000/flow-cytometry-trainer/) in your browser.

---

## 📜 License

Released under the [MIT License](LICENSE).
