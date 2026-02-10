import os
from typing import List
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_chroma import Chroma

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
    def process_file(self, file_path: str, original_filename: str):
        """
        Processes a file from disk (PDF/TXT), chunks it, and stores in ChromaDB.
        Designed to run in the background.
        """
        try:
            # Load Document
            if original_filename.endswith(".pdf"):
                loader = PyPDFLoader(file_path)
            else:
                loader = TextLoader(file_path)
            
            documents = loader.load()

            # Add metadata if missing
            for doc in documents:
                doc.metadata["source"] = original_filename

            # Split Text
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=200
            )
            chunks = text_splitter.split_documents(documents)

            # Store in Vector DB
            vector_store.add_documents(chunks)
            print(f"✅ Processed {original_filename}: {len(chunks)} chunks added.")
            return True
        
        except Exception as e:
            print(f"❌ Error processing {original_filename}: {str(e)}")
            return False
        
        finally:
            # Cleanup temp file
            if os.path.exists(file_path):
                os.remove(file_path)

    def search(self, query: str, k: int = 3) -> dict:
        """
        Retrieves relevant context for a query, including source metadata.
        Returns: {"context": str, "sources": List[str]}
        """
        results = vector_store.similarity_search(query, k=k)
        if not results:
            return {"context": "", "sources": []}
        
        context = "\n\n".join([doc.page_content for doc in results])
        sources = list(set([doc.metadata.get("source", "Unknown") for doc in results]))
        
        return {"context": context, "sources": sources}

# Singleton instance
rag_system = RAGSystem()
