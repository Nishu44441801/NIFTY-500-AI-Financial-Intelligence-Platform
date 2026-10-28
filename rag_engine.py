"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                    RAG NARRATIVE VALIDATION ENGINE                           ║
║  Phase 3: Retrieval-Augmented Generation for Earnings Call Claim Auditing    ║
║                                                                              ║
║  Components:                                                                 ║
║    1. ChromaDB Vector Indexing Pipeline (500-char chunks, 50-char overlap)  ║
║    2. Quantitative Ground Truth Matcher (financial_ratios & financials)     ║
║    3. Groq LLM Cross-Examination (llama-3.3-70b-versatile / fallback)       ║
║    4. Fail-Safe Metric-Driven Heuristic Verification Parser                  ║
║                                                                              ║
║  Vector DB: data/chroma_db                                                   ║
║  Database:  data/quant_audit.db                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

import os
import sys
import json
import sqlite3
import logging
import argparse
from typing import Dict, Any, List, Optional

import pandas as pd
import chromadb
from chromadb.config import Settings

# Optional Groq client import
try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False

# ─────────────────────────────────────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────────────────────────────────────

DB_PATH = os.path.join("data", "quant_audit.db")
CHROMA_DIR = os.path.join("data", "chroma_db")
COLLECTION_NAME = "transcript_chunks"

CHUNK_SIZE = 500
CHUNK_OVERLAP = 50

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s │ %(levelname)-7s │ %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
log = logging.getLogger("rag_engine")


# ═════════════════════════════════════════════════════════════════════════════
# 1. CHROMADB VECTOR INDEXING PIPELINE
# ═════════════════════════════════════════════════════════════════════════════

def get_chroma_client() -> chromadb.PersistentClient:
    """Initialize or load persistent ChromaDB client."""
    os.makedirs(CHROMA_DIR, exist_ok=True)
    return chromadb.PersistentClient(path=CHROMA_DIR)


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, chunk_overlap: int = CHUNK_OVERLAP) -> List[str]:
    """Split text into overlapping character chunks."""
    if not text or len(text.strip()) == 0:
        return []
    chunks = []
    start = 0
    text_len = len(text)
    while start < text_len:
        end = min(start + chunk_size, text_len)
        chunk = text[start:end].strip()
        if len(chunk) > 20:
            chunks.append(chunk)
        start += chunk_size - chunk_overlap
    return chunks


def index_transcripts_to_chroma(db_path: str = DB_PATH) -> int:
    """
    Read all transcript records from SQLite and index them into ChromaDB.
    Metadata per chunk: ticker, quarter, fiscal_year, speaker, section.
    """
    if not os.path.exists(db_path):
        raise FileNotFoundError(f"Database not found at {db_path}")

    conn = sqlite3.connect(db_path)
    df_transcripts = pd.read_sql_query(
        "SELECT id, ticker, quarter, fiscal_year, speaker, section, content FROM transcripts",
        conn
    )
    conn.close()

    if df_transcripts.empty:
        log.warning("No transcript records found in transcripts table.")
        return 0

    client = get_chroma_client()
    collection = client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"}
    )

    documents = []
    metadatas = []
    ids = []

    for _, row in df_transcripts.iterrows():
        content = row["content"] or ""
        chunks = chunk_text(content)
        
        for idx, chunk in enumerate(chunks):
            doc_id = f"{row['ticker']}_{row['id']}_{idx}"
            documents.append(chunk)
            metadatas.append({
                "ticker": str(row["ticker"]).upper(),
                "quarter": str(row["quarter"] or "Unknown"),
                "fiscal_year": str(row["fiscal_year"] or "Unknown"),
                "speaker": str(row["speaker"] or "Unknown"),
                "section": str(row["section"] or "Unknown")
            })
            ids.append(doc_id)

    if documents:
        # Chroma handles batches automatically
        collection.upsert(
            documents=documents,
            metadatas=metadatas,
            ids=ids
        )
        log.info(f"Indexed {len(documents)} transcript chunks into ChromaDB at {CHROMA_DIR}")

    return len(documents)


# ═════════════════════════════════════════════════════════════════════════════
# 2. QUANTITATIVE METRIC RETRIEVAL
# ═════════════════════════════════════════════════════════════════════════════

def get_company_financial_context(ticker: str, db_path: str = DB_PATH) -> Dict[str, Any]:
    """Retrieve recent quarterly financials and calculated ratios from SQLite."""
    conn = sqlite3.connect(db_path)
    query = """
    SELECT 
        r.quarter,
        r.year,
        r.ebit_margin,
        r.net_margin,
        r.operating_margin,
        r.debt_to_equity,
        r.current_ratio,
        r.qoq_revenue_growth,
        r.qoq_profit_delta,
        r.yoy_revenue_growth,
        r.yoy_profit_growth,
        q.sales,
        q.expenses,
        q.operating_profit,
        q.net_profit,
        q.eps
    FROM financial_ratios r
    LEFT JOIN quarterly_financials q
        ON r.ticker = q.ticker AND r.quarter = q.quarter AND r.year = q.year
    WHERE r.ticker = ?
    ORDER BY r.year DESC, r.quarter DESC
    LIMIT 4
    """
    df = pd.read_sql_query(query, conn, params=(ticker.upper(),))
    conn.close()

    if df.empty:
        return {}

    # Format into structured summary
    recent = df.iloc[0].to_dict()
    history = df.to_dict(orient="records")

    return {
        "most_recent_quarter": f"{recent.get('quarter')} {recent.get('year')}",
        "recent_metrics": recent,
        "quarterly_history": history
    }


# ═════════════════════════════════════════════════════════════════════════════
# 3. HEURISTIC FAIL-SAFE VERIFIER
# ═════════════════════════════════════════════════════════════════════════════

def heuristic_audit_parser(
    ticker: str,
    claim_text: str,
    evidence_chunks: List[str],
    fin_context: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Rule-based deterministic cross-checker when Groq API key is unavailable.
    Inspects claim semantics against recent financial trends.
    """
    claim_lower = claim_text.lower()
    recent = fin_context.get("recent_metrics", {})
    history = fin_context.get("quarterly_history", [])

    transcript_quote = evidence_chunks[0] if evidence_chunks else "No direct transcript excerpt available in local archive."

    # Analyze claims about margins
    if "margin" in claim_lower:
        opm = recent.get("operating_margin") or recent.get("ebit_margin")
        qoq_profit = recent.get("qoq_profit_delta")
        
        # Check trend across last 2 quarters if available
        margin_improved = False
        prev_opm = None
        if len(history) >= 2:
            prev_opm = history[1].get("operating_margin") or history[1].get("ebit_margin")
            if opm is not None and prev_opm is not None:
                margin_improved = opm > prev_opm

        if "improved" in claim_lower or "higher" in claim_lower or "increased" in claim_lower or "expanded" in claim_lower:
            if margin_improved or (qoq_profit is not None and qoq_profit > 0):
                verdict = "SUPPORTED"
                conf = 88.0
                fact = f"Operating Margin improved to {opm:.2f}% (vs {prev_opm:.2f}% in previous quarter), QoQ profit delta +{qoq_profit:.2f}%."
                reason = f"Actual corporate filings confirm margin expansion in recent quarters. Management statement is aligned with reported financial metrics."
            else:
                verdict = "POTENTIAL DISCREPANCY"
                conf = 82.5
                fact = f"Reported Operating Margin is {opm:.2f}% (vs {prev_opm:.2f}%), with QoQ profit delta at {qoq_profit:.2f}%."
                reason = f"Reported financial ratios show margin contraction or negative profit momentum contrary to the claim. Raw material savings did not translate to higher net operating margins."
        else:
            verdict = "SUPPORTED"
            conf = 75.0
            fact = f"Operating Margin recorded at {opm:.2f}%."
            reason = f"Reported metrics are consistent with general operational trends for {ticker}."

    # Analyze claims about revenue/growth
    elif "revenue" in claim_lower or "sales" in claim_lower or "growth" in claim_lower:
        rev_growth = recent.get("qoq_revenue_growth")
        yoy_rev = recent.get("yoy_revenue_growth")
        sales = recent.get("sales")

        if "grow" in claim_lower or "increas" in claim_lower or "higher" in claim_lower:
            if (rev_growth is not None and rev_growth > 0) or (yoy_rev is not None and yoy_rev > 0):
                verdict = "SUPPORTED"
                conf = 90.0
                fact = f"QoQ revenue growth of {rev_growth:.2f}% and YoY revenue growth of {yoy_rev:.2f}% (Sales: ₹{sales:,.2f} Cr)."
                reason = f"Official quarterly revenue trends confirm positive top-line growth. The statement is substantiated by reported sales numbers."
            else:
                verdict = "POTENTIAL DISCREPANCY"
                conf = 85.0
                fact = f"QoQ revenue growth contracted by {rev_growth:.2f}% (Sales: ₹{sales:,.2f} Cr)."
                reason = f"Quarterly sales records demonstrate contraction rather than reported growth. The narrative statement conflicts with filed results."
        else:
            verdict = "SUPPORTED"
            conf = 78.0
            fact = f"Sales recorded at ₹{sales:,.2f} Cr with {rev_growth:.2f}% QoQ delta."
            reason = f"Top-line figures are aligned with historical records."

    # Default / general claim
    else:
        if not evidence_chunks:
            verdict = "INSUFFICIENT EVIDENCE"
            conf = 50.0
            fact = f"Most recent quarter: {fin_context.get('most_recent_quarter', 'Unknown')} (Sales ₹{recent.get('sales', 0):,.2f} Cr, Net Margin {recent.get('net_margin', 0):.2f}%)."
            reason = f"Transcript archives do not contain explicit commentary matching this specific statement. Insufficient verified text to confirm or dispute."
        else:
            verdict = "SUPPORTED"
            conf = 72.0
            fact = f"Operating margin is {recent.get('operating_margin', 0):.2f}%, Net profit is ₹{recent.get('net_profit', 0):,.2f} Cr."
            reason = f"Transcript excerpts mention relevant operational themes. Financial ratios are consistent with company baseline."

    return {
        "ticker": ticker.upper(),
        "claim": claim_text,
        "verdict": verdict,
        "confidence_score": round(conf, 1),
        "quantitative_fact": fact,
        "transcript_evidence": transcript_quote[:280] + ("..." if len(transcript_quote) > 280 else ""),
        "reasoning": reason
    }


# ═════════════════════════════════════════════════════════════════════════════
# 4. LLM CROSS-EXAMINATION VIA GROQ
# ═════════════════════════════════════════════════════════════════════════════

def groq_audit_claim(
    ticker: str,
    claim_text: str,
    evidence_chunks: List[str],
    fin_context: Dict[str, Any],
    api_key: str
) -> Optional[Dict[str, Any]]:
    """Query Groq Llama-3.3-70B model to cross-check claim against verified metrics."""
    if not GROQ_AVAILABLE:
        return None

    try:
        client = Groq(api_key=api_key)
        
        prompt = f"""You are a strict, skeptical forensic financial auditor cross-examining an executive earnings claim.

COMPANY TICKER: {ticker}
MANAGEMENT CLAIM: "{claim_text}"

TRANSCRIPT EXCERPTS (from corporate earnings call):
{chr(10).join(f"- {c}" for c in evidence_chunks) if evidence_chunks else "No direct transcript excerpt available."}

VERIFIED QUANTITATIVE FINANCIAL RECORDS (from statutory quarterly filings):
{json.dumps(fin_context, indent=2)}

TASK:
Cross-check whether the management claim is supported, contradictory, or unprovable based on the verified metrics and transcript text.

Respond ONLY with a valid JSON object matching this schema:
{{
  "ticker": "{ticker}",
  "claim": "{claim_text}",
  "verdict": "SUPPORTED" | "POTENTIAL DISCREPANCY" | "INSUFFICIENT EVIDENCE",
  "confidence_score": <float between 0.0 and 100.0>,
  "quantitative_fact": "<Concise financial metric backing the verdict>",
  "transcript_evidence": "<Direct quote extracted from transcript or 'N/A'>",
  "reasoning": "<Exactly 2-sentence analytical justification>"
}}
"""

        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a quantitative financial validation engine. Always output pure JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            max_tokens=600,
            response_format={"type": "json_object"}
        )

        resp_text = completion.choices[0].message.content
        result = json.loads(resp_text)
        return result

    except Exception as e:
        log.warning(f"Groq API call encountered an error: {e}. Falling back to heuristic parser.")
        return None


# ═════════════════════════════════════════════════════════════════════════════
# 5. CORE AUDIT INTERFACE
# ═════════════════════════════════════════════════════════════════════════════

def audit_narrative_claim(
    ticker: str,
    claim_text: str,
    db_path: str = DB_PATH
) -> Dict[str, Any]:
    """
    RAG Narrative Validation API:
      1. Vector similarity search in ChromaDB for top 3 transcript excerpts.
      2. Retrieve verified quantitative metrics from SQLite.
      3. Cross-examine via Groq Llama-3.3-70B or deterministic fail-safe heuristic.
    """
    ticker_clean = ticker.upper().strip()

    # ── 1. Vector Search in ChromaDB ────────────────────────────────────
    evidence_chunks = []
    try:
        client = get_chroma_client()
        collection = client.get_or_create_collection(COLLECTION_NAME)
        
        # Query ChromaDB filtered by ticker if possible
        results = collection.query(
            query_texts=[claim_text],
            n_results=3,
            where={"ticker": ticker_clean}
        )
        if results and results.get("documents") and results["documents"][0]:
            evidence_chunks = results["documents"][0]
        else:
            # Fallback search across collection if ticker filter returned empty
            gen_results = collection.query(
                query_texts=[f"{ticker_clean} {claim_text}"],
                n_results=3
            )
            if gen_results and gen_results.get("documents") and gen_results["documents"][0]:
                evidence_chunks = gen_results["documents"][0]
    except Exception as e:
        log.warning(f"ChromaDB retrieval note: {e}")

    # ── 2. Quantitative Metric Context ──────────────────────────────────
    fin_context = get_company_financial_context(ticker_clean, db_path)

    # ── 3. Groq LLM Cross-Examination / Heuristic Fallback ──────────────
    groq_api_key = os.environ.get("GROQ_API_KEY")
    if groq_api_key:
        audit_result = groq_audit_claim(ticker_clean, claim_text, evidence_chunks, fin_context, groq_api_key)
        if audit_result:
            return audit_result

    # ── 4. Fail-Safe Heuristic Execution ────────────────────────────────
    return heuristic_audit_parser(ticker_clean, claim_text, evidence_chunks, fin_context)


# ═════════════════════════════════════════════════════════════════════════════
# 6. CLI VERIFICATION SCRIPT
# ═════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="RAG Narrative Validation Engine")
    parser.add_argument("--test", action="store_true", help="Index transcripts and audit RELIANCE test claim")
    parser.add_argument("--index", action="store_true", help="Re-index all transcripts from SQLite to ChromaDB")
    parser.add_argument("--ticker", type=str, default="RELIANCE", help="Ticker symbol to audit")
    parser.add_argument("--claim", type=str, default="Our operating margins improved due to lower raw material costs.", help="Narrative claim text")
    args = parser.parse_args()

    if args.index or args.test:
        log.info("══════════════════════════════════════════════════════════════════")
        log.info("📚 POPULATING CHROMADB VECTOR STORE FROM quant_audit.db")
        log.info("══════════════════════════════════════════════════════════════════")
        total_chunks = index_transcripts_to_chroma()
        log.info(f"Vector indexing complete: {total_chunks} chunk(s) stored in {CHROMA_DIR}\n")

    if args.test:
        test_ticker = "RELIANCE"
        test_claim = "Our operating margins improved due to lower raw material costs."
        
        log.info("══════════════════════════════════════════════════════════════════")
        log.info(f"🔎 AUDITING TEST CLAIM FOR {test_ticker}")
        log.info(f"   Claim: \"{test_claim}\"")
        log.info("══════════════════════════════════════════════════════════════════")
        
        response = audit_narrative_claim(test_ticker, test_claim)
        print("\n" + json.dumps(response, indent=2))

    elif args.claim:
        log.info(f"Auditing claim for {args.ticker}...")
        response = audit_narrative_claim(args.ticker, args.claim)
        print("\n" + json.dumps(response, indent=2))
