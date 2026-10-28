# LIVE DEMO VIDEO SCRIPT & TIMED VOICEOVER GUIDE
## Project: QuantTerminal – NIFTY-500 AI Financial Intelligence & Forensic Narrative Auditor
**Target Video Duration:** 6 to 8 Minutes  
**Tone:** Professional, Confident, Engineering & Quant-focused  

---

### PRE-RECORDING CHECKLIST:
1. Both servers running in background (`uvicorn main:app --port 8000` & `npm run dev` at `http://localhost:5173`).
2. Browser opened at `http://localhost:5173/` in Incognito / New Session (showing the clean Login screen).
3. Audio/Mic test complete.

---

## 🎬 SCENE-BY-SCENE TIMED SCRIPT

### ⏱️ SECTION 1: INTRODUCTION & PROBLEM STATEMENT (0:00 – 1:00)
**Visual on Screen:**  
- Start on the **QuantTerminal Login Portal** (`http://localhost:5173/`).
- Show the clean gold/dark theme, Gateway Ready indicator, and security specs.

**Voiceover Script:**
> *"Hello everyone. Welcome to the demonstration of **QuantTerminal: Institutional Edition** – an AI-powered financial intelligence and forensic narrative audit platform engineered specifically for the NIFTY-500 equity universe.*
>
> *In today's financial markets, equity research analysts and portfolio managers face a critical challenge: companies frequently make ambitious operational claims during quarterly earnings calls, while underlying balance sheet ratios might tell a completely different story. Cross-referencing thousands of pages of statutory filings against management commentary manually is slow, prone to error, and misses emerging insolvency signals.*
>
> *QuantTerminal bridges this gap by unifying **5,460 quarterly financial records**, **dual gradient-boosted distress classifiers (XGBoost and CatBoost)**, **SHAP game-theoretic explainability**, and a **Groq-powered ChromaDB Retrieval-Augmented Generation (RAG) auditor** into a single real-time institutional terminal. Let's dive in."*

---

### ⏱️ SECTION 2: AUTHENTICATION & USER MANAGEMENT (1:00 – 1:45)
**Visual on Screen:**  
- Click on the **"Sign Up"** tab.
- Type in a new username (e.g., `analyst_raj`) and password.
- Click **"Create Account & Login"** or switch back to **"Sign In"** and enter credentials.
- Show smooth transition into the live workspace.

**Voiceover Script:**
> *"We start at our zero-trust Authentication Gateway. The terminal does not expose predefined credentials and enforces role-based access. New users can create an institutional operator profile under the Sign Up tab, which hashes passcodes using SHA-256 and records them into our secure SQLite datastore.*
>
> *Upon submitting our credentials, the FastAPI backend validates the hash, returns a signed JWT bearer token with HS256 encryption, and initializes the secure session. Notice that session persistence is securely isolated to sessionStorage, ensuring every fresh browser session requires explicit re-authentication."*

---

### ⏱️ SECTION 3: MAIN DASHBOARD & REAL-TIME SCREENING (1:45 – 3:30)
**Visual on Screen:**  
- Now inside **Main Dashboard** with `RELIANCE` loaded.
- Point cursor to the **Top Header Bar**: Search input, FY selector (`FY25`), Period selector (`Q4`), Model selector (`XGBoost v2`), and Export button.
- Scroll down to show:
  1. **Row 1:** Corporate Risk Status (`STABLE SOLVENCY`, `0.03% Probability`), Statistical Anomaly Check (`PASSED`, Isolation Forest), and Pipeline Health metrics (ROC-AUC `94.7%`, Precision `0.912`, F1 `0.899`).
  2. **Row 2:** Audited KPIs: Operating EBIT (`₹15,116 Cr`), Net Margin (`8.43%`), Debt-to-Equity (`0.155`), and EPS (`₹8.29`).
  3. **Row 3:** EBIT Margin & Revenue Multi-Year Composed Chart and Multi-Factor Solvency Radar.
  4. **Row 4:** Revenue by Segment bar chart and the Live NIFTY-500 Peer Risk Scan table.
- Demonstrate searching for another company (e.g. type `TCS` or `HDFCBANK`) in the search bar and select it.
- Toggle the quarter selector from `Q4` to `Q3` and show the KPIs updating dynamically.

**Voiceover Script:**
> *"Now inside the workspace, we are greeted by the Main Dashboard. At the very top, our institutional header allows real-time search across all 500 NIFTY equities, backed by a FastAPI cache responding in under 5 milliseconds.*
>
> *Let's look at the telemetry cards in Row 1: First, our **Corporate Risk Status** shows a calculated 0.03% distress probability for Reliance, earning a 'STABLE SOLVENCY' grade. Next, an unsupervised **Isolation Forest** tests 42 financial vectors to flag accounting anomalies. Beside it, our **Supervised Pipeline Health** dashboard reports an outstanding 94.7% ROC-AUC and 0.899 F1-score.*
>
> *Moving to Row 2, the KPI cards reflect the exact audited filings for the selected period—showing Operating EBIT, Net Margin, Debt-to-Equity of 0.155 indicating conservative leverage, and Diluted EPS.*
>
> *Below, our interactive Recharts visualizations display historical trends across 2023 to 2025 alongside a multi-factor Solvency Radar evaluating operating margin, financial coverage, liquidity, and momentum.*
>
> *Watch what happens when I switch the period from Q4 to Q3: our backend immediately queries the specific quarterly filings, re-renders the KPIs, and recalibrates the distress probability."*

---

### ⏱️ SECTION 4: EXPLAINABLE AI (XAI) & MODEL COMPARISON (3:30 – 5:00)
**Visual on Screen:**  
- Click on **"XAI Drivers"** in the left sidebar.
- Show the top cards: Total Threat Vector (`+1.3%`), Mitigating Buffer (`-408.4%`), and Net Attribution Score.
- Point to the side-by-side columns: **Negative Risk Drivers** (Red) vs. **Positive Buffer Drivers** (Green) with SHAP delta values.
- Scroll down to show the **SHAP Waterfall Attribution Breakdown** horizontal bar chart.
- Now go up to the Header and switch the Model dropdown from **"XGBoost v2"** to **"CatBoost"**.
- Show the values updating to CatBoost's probability and TreeExplainer weights.

**Voiceover Script:**
> *"Next, let's navigate to the **XAI Drivers** module in the sidebar. In high-stakes institutional finance, a black-box AI prediction is unacceptable. Analysts must know exactly WHY a model flagged or cleared a company.*
>
> *Here, we implement game-theoretic SHAP TreeExplainer local decomposition. In the left column, our model isolates the negative threat drivers pushing risk upward—such as year-over-year revenue contraction. On the right, it quantifies mitigating buffer factors that pull risk downward—including an exceptionally healthy debt-to-equity ratio and robust interest coverage ratio.*
>
> *Below, our SHAP Waterfall chart visually illustrates the exact additive contribution of each balance-sheet parameter from the base expected value.*
>
> *Furthermore, notice our Model Selector at the top. When we toggle between **XGBoost v2** and **CatBoost**, the system dynamically queries the respective model artifact in our Joblib pipeline, recalibrating the probability score and feature weights based on CatBoost's symmetric decision trees."*

---

### ⏱️ SECTION 5: RAG FORENSIC TRANSCRIPT AUDITOR (5:00 – 6:15)
**Visual on Screen:**  
- Click on **"Transcript Auditor"** in the sidebar.
- Show the left pane: **Earnings Call Transcript Log** with timestamped excerpts from CFO Sh V. Srikanth, President Sh B. Srinivasan, and Morgan Stanley analyst Q&A.
- Show the right pane: Claim input containing `"Our operating margins improved due to lower raw material costs."`
- Click the orange **"Cross-Check"** button.
- Show the RAG engine executing: cosine similarity retrieval from ChromaDB, statutory ratio cross-examination, and the final structured verdict with confidence rating and citation excerpts.

**Voiceover Script:**
> *"Now we move to our most innovative component: the **RAG Forensic Transcript Auditor**.*
>
> *On the left, we ingest structured earnings call transcripts split into 500-character vector chunks with 50-character overlaps, tagged with speaker and section metadata. On the right, we have an automated cross-examination interface.*
>
> *Suppose an executive claims during the call: 'Our operating margins improved due to lower raw material costs.' An analyst can type or paste that exact claim and click 'Cross-Check'.*
>
> *Behind the scenes, our ChromaDB vector database performs cosine similarity search to retrieve the top 3 relevant transcript excerpts. Simultaneously, our backend fetches the company's audited EBIT and net margins from SQLite. Both are passed to Groq's high-speed Llama-3-70B model with strict anti-hallucination instructions.*
>
> *In seconds, the system returns a forensic verdict: cross-verifying whether the claimed margin improvement is corroborated by audited statutory filings, citing the exact transcript text and delta percentage."*

---

### ⏱️ SECTION 6: EXECUTIVE PDF EXPORT & CONCLUSION (6:15 – 7:15)
**Visual on Screen:**  
- Go back to the Header and click **"Export Executive PDF"**.
- The browser print preview modal pops up.
- Show the publication-ready white-paper A4 report: Clean company title, Confidential banner, Executive Solvency Verdict card in green/red, Audited KPIs, XAI SHAP table, and Multi-Quarter comparison table.
- Point out the automatically generated file name: `RELIANCE_Financial_Audit_Q4_2025.pdf`.
- Close preview or save, and return to the dashboard.

**Voiceover Script:**
> *"Finally, when research analysts need to share their findings with investment committees, they simply click **'Export Executive PDF'**.*
>
> *Our specialized print CSS automatically strips away the dark terminal chrome and interactive widgets, rendering a clean, publication-grade institutional white paper. It includes the executive solvency verdict, audited quarterly ratios, full SHAP threat breakdown, and a historical filings table.*
>
> *Notice also that the browser automatically formats the saved file name with the company ticker, quarter, and fiscal year—ready for instant compliance archiving.*
>
> *To summarize: QuantTerminal delivers end-to-end financial forensic intelligence—from automated data lake ingestion and dual ML distress modeling to explainable AI and RAG transcript cross-examination.*
>
> *Thank you for watching our demonstration."*

---

### 💡 PRO TIPS FOR RECORDING:
1. **Screen Resolution:** Record at 1920x1080 (1080p) full screen for crisp fonts and charts.
2. **Cursor Motion:** Move the mouse deliberately—don't shake or circle erratically. Point directly to cards as you talk about them.
3. **Pacing:** Speak at a steady, calm, confident pace. You do not need to rush!
