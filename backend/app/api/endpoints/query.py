from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import JSONResponse
from pathlib import Path
import shutil
from app.services.rag_service import (
    initialize_vector_store,
    get_vector_store,
    LLM_MODEL,
)
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
import os
from pypdf import PdfReader
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re
from app.api.endpoints.upload import upload_document
from io import BytesIO


router = APIRouter(tags=["Soru-Cevap"])

UPLOAD_DIR = Path("uploaded_files")
UPLOAD_DIR.mkdir(exist_ok=True)
VECTOR_DB_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "data", "vector_db")
)
TXT_PATH = Path("data/vector_db/all_texts.txt")

TEMP_TXT = Path("data/vector_db/temp.txt")


def findPart(question: str, txt_path: str, top_k: int = 5):
    with open(txt_path, "r", encoding="utf-8") as f:
        content = f.read()

    chunks = re.split(r"--- Parça \d+ ---", content)
    chunks = [c.strip() for c in chunks if c.strip()]

    vectorizer = TfidfVectorizer().fit(chunks + [question])
    chunk_vectors = vectorizer.transform(chunks)
    question_vector = vectorizer.transform([question])

    similarities = cosine_similarity(question_vector, chunk_vectors).flatten()

    top_indices = similarities.argsort()[-top_k:][::-1]
    relevant_chunks = [chunks[i] for i in top_indices]

    return relevant_chunks


oldQuestionAndAnswer = []

async def CreateResult(relevant_chunks,question,oldQuestionAndAnswer=oldQuestionAndAnswer):
    
    context_text = "\n".join(relevant_chunks)

    prompt = f"""
    Sen, yalnızca sağlanan belgelerden bilgi alarak yanıt veren,
    profesyonel, kibar ve yardımcı bir şirket chatbotusun.

    Kurallar:
    1. Belgelerde yanıt açıkça bulunuyorsa, doğrudan belgelerdeki ifadeleri temel al.
    2. Belgelerde konuya dair ipuçları varsa, bunları birleştirerek mantıklı ve açıklayıcı bir cevap oluştur.
    3. Belgelerde hiçbir bilgi yoksa, konunun belgelerde yer almadığını belirt ama konunun genel bağlamını
       tarafsız bir şekilde kısa bir özetle açıkla.
    4. Eğer soru önceki sorularla bağlantılıysa, önceki soru ve cevapları da dikkate al.
    5. Soru önceki konulardan bağımsızsa, yalnızca mevcut belgeleri değerlendir.
    6. Cevap verirken, hangi belge veya belgelerdeki bilgiye dayandığını belirt.
    7. Gereksiz tekrar veya uzun açıklamalardan kaçın; kısa ve anlaşılır ol.
    8. Eski soruyu (oldQuestion) aklında tut, yeni soru onunla bağlantılı olabilir.
    9. Öznesi olmayan veya bağlamı eksik sorularda, önceki soruyu göz önünde bulundur
        ve mantıklı bir bağlantı kurarak yanıt ver.

    Konteks (Belgeler):
    {context_text}

    Önceki soru: {oldQuestionAndAnswer}
    Yeni soru: {question}

    Cevap:
    """

    chat = ChatGoogleGenerativeAI(model=LLM_MODEL)
    response = await chat.agenerate([[HumanMessage(content=prompt)]])

    oldQuestionAndAnswer = f"Soru: {question}\nCevap: {response}"

    return JSONResponse(
        {"answer": response.generations[0][0].text, "sources": relevant_chunks}
    )


@router.post("/ask")
async def ask_question(question: str = Form(...), txt_file: UploadFile | None = File(None)):
    global oldQuestionAndAnswer

    with open(TXT_PATH, "r", encoding="utf-8") as f:
        content = f.read()
    if txt_file:
        file_path = UPLOAD_DIR / txt_file.filename
        with open(file_path, "wb") as f:
            shutil.copyfileobj(txt_file.file, f)

    try:
        relevant_chunks = findPart(question, TXT_PATH)
    except Exception as e:
        print(f"TXT dosyası okunamadı: ")
        relevant_chunks = []

    return await CreateResult(relevant_chunks,question,oldQuestionAndAnswer)


@router.post("/askWithfile")
async def ask_question_withfile(question: str = Form(...),file: UploadFile | None = File(None)):
    
    global oldQuestionAndAnswer
    
    await upload_document(file)
    
    with open(TEMP_TXT, "r", encoding="utf-8") as f:
        content = f.read()
        
    try:
        relevant_chunks = findPart(question, content)
    except Exception as e:
        print(f"TXT dosyası okunamadı: ")
        relevant_chunks = []

    return await CreateResult(relevant_chunks,question,oldQuestionAndAnswer)


