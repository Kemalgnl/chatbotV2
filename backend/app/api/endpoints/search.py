import os
import requests
import sys
from PyPDF2 import PdfReader
from app.api.endpoints.upload import upload_document
from fastapi import FastAPI
from app.api.endpoints.query import ask_question_withfile
from app.api.endpoints import upload, query
from fastapi import APIRouter, Form
from io import BytesIO
from fastapi import UploadFile
from fastapi.responses import JSONResponse
import shutil
from dotenv import load_dotenv

load_dotenv()

SHOLAR_API_KEY = os.getenv("SHOLAR_API_KEY")

sys.stdout.reconfigure(encoding="utf-8")

KAYIT_KLASORU = os.path.join(os.path.dirname(__file__), "..", "..", "uploaded_files")
kayit_klasoru = os.path.abspath(KAYIT_KLASORU)

BASE_DIR = os.path.dirname(__file__)  
TXT_KLASORU = os.path.join(BASE_DIR, "..", "..", "data", "vector_db")

txt_dosyasi = os.path.join(TXT_KLASORU, "metinler.txt")
emp_txt_path = os.path.join(KAYIT_KLASORU, "temp.txt")
import time

router = APIRouter()

@router.post("/findPdf")
async def semantic_scholarSearch(
    aranan_kelime: str = Form(...),
    count: int = 3,
    limit: int = 10,
    kayit_klasoru: str = kayit_klasoru,
):
    if not os.path.exists(txt_dosyasi):
        with open(txt_dosyasi, "w", encoding="utf-8") as f:
            pass
        
    api_url = "https://api.semanticscholar.org/graph/v1/paper/search"
    parametreler = {
        "query": aranan_kelime,
        "limit": limit,
        "fields": "title,url,openAccessPdf",
    }
    if not os.getenv("SHOLAR_API_KEY"):
        return "SHOLAR_API_KEY bulunamadı"
    
    headers = {"x-api-key": SHOLAR_API_KEY}

    indirilen_pdf_sayisi = 0
    sonuclar = []
    downloadedpdfsName = []
    downloadedpdfsName.append("Test_Dosya_1.pdf")
    downloadedpdfsName.append("Test_Dosya_2.pdf")
    while indirilen_pdf_sayisi < count:
        time.sleep(5)
        yanit = requests.get(api_url, params=parametreler,headers=headers)
        if yanit.status_code != 200:
            print(f"hatası:{yanit.status_code}")
            break

        veriler = yanit.json().get("data", [])
        if not veriler:
            print("makale bulunamadı.")
            break

        for i, makale in enumerate(veriler, start=1):
            pdf_linki = makale.get("openAccessPdf", {}).get("url")
            baslik = makale.get("title", "no title")

            if pdf_linki:
                guvenli_baslik = "".join(
                    c for c in baslik if c.isalnum() or c in (" ", "_")
                ).rstrip()
                dosya_yolu = os.path.join(kayit_klasoru, f"{guvenli_baslik[:50]}.pdf")

                if not pdf_linki or "download" not in pdf_linki.lower():
                    print(f"{i}. '{baslik}' PDF indirilebilir değil, atlandı.")
                    continue

                try:
                    pdf_istek = requests.get(pdf_linki, timeout=15)
                    if pdf_istek.status_code == 200:
                        with open(dosya_yolu, "wb") as dosya:
                            dosya.write(pdf_istek.content)
                        indirilen_pdf_sayisi += 1
                        print(f" {indirilen_pdf_sayisi}. PDF indirildi: {dosya_yolu}")
                        downloadedpdfsName.append(baslik)
                        sonuclar.append(
                            {
                                "baslik": baslik,
                                "url": makale.get("url"),
                                "pdf_linki": pdf_linki,
                            }
                        )
                    if indirilen_pdf_sayisi >= count:
                        break
                except Exception as hata:
                    print(f"pdf indirme hatası ({baslik}): {hata}")
        if indirilen_pdf_sayisi >= count:
            break

        parametreler["limit"] += limit

    await convert_txt()

    with open(txt_dosyasi, "rb") as f:
        file_content = f.read()
        
    upload_file = UploadFile(filename="metinler.txt", file=BytesIO(file_content))
    
    print(f"\n{indirilen_pdf_sayisi} adet PDF indirildi.")
    
    sonuclar = await ask_question_withfile(aranan_kelime, upload_file)
    print(downloadedpdfsName)

    return JSONResponse(content=downloadedpdfsName)
    

async def convert_txt():
    with open(txt_dosyasi, "w", encoding="utf-8") as f:
        f.write("")

    for dosya in os.listdir(KAYIT_KLASORU):
        if not dosya.lower().endswith(".pdf"):
            continue

        pdf_yolu = os.path.join(KAYIT_KLASORU, dosya)
        print(f"PDF okunuyor: {pdf_yolu}")

        try:
            with open(pdf_yolu, "rb") as pdfs:
                reader = PdfReader(pdfs)
                metin = ""
                for sayfa in reader.pages:
                    sayfa_metin = sayfa.extract_text()
                    if sayfa_metin:
                        metin += sayfa_metin + "\n"

            if metin.strip():
                with open(txt_dosyasi, "a", encoding="utf-8") as txt:
                    txt.write(f"\n--- {dosya} ---\n")
                    txt.write(metin)
                    txt.write("\n\n")
                print(f"{dosya} metni başarıyla eklendi.")
            else:
                print(f"boş veya okunamadı.")

        except Exception as e:
            print(f"Hata oluştu: {e}")

    print(f"Tüm PDF'ler işlendi, metinler kaydedildi.")
