import os
from typing import List
from fastapi import UploadFile
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

# Configuration
PERSIST_DIRECTORY = "./chroma_db"
EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"

# Initialize Embeddings (runs locally)
embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL_NAME)

# Initialize Vector Store (Persistent)
vector_store = Chroma(
    persist_directory=PERSIST_DIRECTORY,
    embedding_function=embeddings
)

class RAGSystem:
    async def ingest(self, file: UploadFile):
        """
        Processes an uploaded file (PDF/TXT), chunks it, and stores in ChromaDB.
        """
        # Save temp file
        file_path = f"temp_{file.filename}"
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)

        try:
            # Load Document
            if file.filename.endswith(".pdf"):
                loader = PyPDFLoader(file_path)
            else:
                loader = TextLoader(file_path)
            
            documents = loader.load()

            # Split Text
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=200
            )
            chunks = text_splitter.split_documents(documents)

            # Store in Vector DB
            vector_store.add_documents(chunks)
            vector_store.persist() # Verify persistence logic
            
            return {"status": "success", "chunks_added": len(chunks)}
        
        except Exception as e:
            return {"status": "error", "message": str(e)}
        
        finally:
            # Cleanup temp file
            if os.path.exists(file_path):
                os.remove(file_path)

    def search(self, query: str, k: int = 3) -> str:
        """
        Retrieves relevant context for a query.
        """
        results = vector_store.similarity_search(query, k=k)
        if not results:
            return ""
        
        context = "\n\n".join([doc.page_content for doc in results])
        return context

# Singleton instance
rag_system = RAGSystem()
