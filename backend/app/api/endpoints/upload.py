from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
import shutil
import os
from pathlib import Path
from app.services.rag_service import initialize_vector_store
from app.services.rag_service import vector_store_onefile


router = APIRouter(tags=["Yükleme"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploaded_files")
os.makedirs(UPLOAD_DIR, exist_ok=True) 
FILES = [".txt", ".pdf", ".docx", ".json"]

async def upload_document(file: UploadFile = File(...)):
    filename = file.filename

    if not filename or not any(filename.lower().endswith(ext) for ext in FILES):
        raise HTTPException(status_code=400, detail="Sadece geçerli PDF dosyaları yüklenebilir.")
    
    file_location = Path(UPLOAD_DIR) / file.filename
    try:
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        rag_result = vector_store_onefile(str(file_location))
        print("KONTROL upload1.PY")
        if "ERROR" in rag_result:
            os.remove(file_location) 
            raise HTTPException(status_code=500, detail=f"RAG işleme hatası: ")
        print("KONTROL upload2.PY")


    except Exception as e:
        #print(f"Sunucu İç Hatası (Upload): {e}")
        raise HTTPException(status_code=500, detail="Belge yüklenirken veya işlenirken beklenmedik bir hata oluştu.")
    