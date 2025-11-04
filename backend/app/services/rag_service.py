import os
from dotenv import load_dotenv
from pypdf import PdfReader
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from pathlib import Path
from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader, TextLoader, JSONLoader

load_dotenv()

VECTOR_DB_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "data", "vector_db")
)
os.makedirs(VECTOR_DB_PATH, exist_ok=True)

EMBEDDING_MODEL = "models/text-embedding-004"
LLM_MODEL = "gemini-2.5-flash"


def initialize_vector_store(file_path: str):
    if not os.getenv("GOOGLE_API_KEY"):
        return "KEY bulunamadı"

    try:
        loader = PyPDFLoader(file_path)
        documents = loader.load()

        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000, chunk_overlap=200
        )
        texts = text_splitter.split_documents(documents)

        # txt
        txt_path = Path(VECTOR_DB_PATH) / "all_texts.txt"
        with open(txt_path, "a", encoding="utf-8") as f:
            f.write(f"\n\n--- {os.path.basename(file_path)} ---\n")
            for i, t in enumerate(texts):
                f.write(f"--- Parça {i+1} ---\n{t.page_content}\n")

        embeddings = GoogleGenerativeAIEmbeddings(
            model=EMBEDDING_MODEL, task_type="RETRIEVAL_DOCUMENT"
        )

        vector_store = FAISS.from_documents(texts, embeddings)

        save_path = os.path.join(VECTOR_DB_PATH, "company_index")
        os.makedirs(save_path, exist_ok=True)
        vector_store.save_local(save_path)

        texts = text_splitter.split_documents(documents)

        
        return f"{len(texts)} parça vektörlere çevrildidi."

    except Exception as e:
        print(f"Hata oluştu: {e}")
        return f"hata oluştu Detay: {e}"


def get_vector_store():
    save_path = os.path.join(VECTOR_DB_PATH, "company_index")
    if not os.path.exists(save_path):
        raise ValueError(f"FAISS index bulunamadı: {save_path}")

    embeddings = GoogleGenerativeAIEmbeddings(
        model=EMBEDDING_MODEL, task_type="RETRIEVAL_DOCUMENT"
    )

    return FAISS.load_local(save_path, embeddings, allow_dangerous_deserialization=True)


def vector_store_onefile(file_path: str):
    if not os.getenv("GOOGLE_API_KEY"):
        return "KEY bulunamadı"
    try:
        last = os.path.splitext(file_path)[1].lower()
        documents = []

        if last == ".pdf":
            loader = PyPDFLoader(file_path)
            documents = loader.load()
        elif last == ".docx":
            loader = Docx2txtLoader(file_path)
            documents = loader.load()
        elif last == ".txt":
            loader = TextLoader(file_path, encoding="utf-8")
            documents = loader.load()
        elif last == ".json":
            loader = JSONLoader(file_path)
            documents = loader.load()
        else:
            return f"Desteklenmeyen dosya türü: {last}"


        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000, chunk_overlap=200
        )
        texts = text_splitter.split_documents(documents)

        txt_path = Path(VECTOR_DB_PATH) / "all_texts.txt"
        os.makedirs(VECTOR_DB_PATH, exist_ok=True)
        with open(txt_path, "a", encoding="utf-8") as f:
            f.write(f"\n\n--- {os.path.basename(file_path)} ---\n")
            for i, t in enumerate(texts):
                f.write(f"--- Parça {i+1} ---\n{t.page_content}\n")

        temp_txt_path = Path(VECTOR_DB_PATH) / "temp.txt"
        with open(temp_txt_path, "w", encoding="utf-8") as f:
            for i, t in enumerate(texts):
                f.write(f"--- Parça {i+1} ---\n{t.page_content}\n")
        
        embeddings = GoogleGenerativeAIEmbeddings(
            model=EMBEDDING_MODEL, task_type="RETRIEVAL_DOCUMENT"
        )

        vector_store = FAISS.from_documents(texts, embeddings)

        save_path = os.path.join(VECTOR_DB_PATH, "company_index")
        os.makedirs(save_path, exist_ok=True)
        vector_store.save_local(save_path)

        return f"{len(texts)} parça işlendi ({last})"

    except Exception as e:
        print(f"Hata oluştu : {e}")
        return f"ERROR:{e}"
