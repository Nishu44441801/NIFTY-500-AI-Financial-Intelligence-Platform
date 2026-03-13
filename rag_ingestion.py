import os
import glob
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_text_splitters import RecursiveCharacterTextSplitter

def build_vector_database():
    print("🧠 Initializing RAG Text Ingestion Pipeline...")
    
    transcript_dir = "data/transcripts"
    db_dir = "data/chroma_db"
    
    # 1. Verify Directory Exists
    if not os.path.exists(transcript_dir):
        os.makedirs(transcript_dir)
        print(f"❌ Error: The directory '{transcript_dir}' was missing. I just created it.")
        print("📥 Download 3-5 real company Earnings Call PDFs, put them in that folder, and run this again.")
        return

    # 2. Find the PDFs
    pdf_files = glob.glob(f"{transcript_dir}/*.pdf")
    if not pdf_files:
        print(f"❌ Error: No PDFs found in {transcript_dir}.")
        return
        
    print(f"📄 Found {len(pdf_files)} financial transcripts. Extracting text...")

    # 3. Load and Extract Text
    documents = []
    for pdf_path in pdf_files:
        loader = PyPDFLoader(pdf_path)
        documents.extend(loader.load())
        
    # 4. Chunking (Splitting text so the AI doesn't get overwhelmed)
    # We split into 1000-character chunks with a 200-character overlap to preserve context
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = text_splitter.split_documents(documents)
    print(f"✂️ Sliced documents into {len(chunks)} mathematical text chunks.")

    # 5. Embedding (Converting English to Math)
    # Using 'all-MiniLM-L6-v2', a fast, local HuggingFace model. No OpenAI API keys required.
    print("🧬 Downloading local embedding model... (This may take a minute the first time)")
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

    # 6. Build and Save the Vector Database (ChromaDB)
    print("🗄️ Building ChromaDB Vector Database...")
    vector_db = Chroma.from_documents(
        documents=chunks, 
        embedding=embeddings, 
        persist_directory=db_dir
    )
    vector_db.persist()
    
    print(f"✨ Success! Vector database built and saved to {db_dir}.")

if __name__ == "__main__":
    build_vector_database()