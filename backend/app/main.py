from fastapi import FastAPI
from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile
from app.api.endpoints import upload, query,search
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import httpx
from contextlib import asynccontextmanager

#backend .\venv\Scripts\Activate  python -m uvicorn app.main:app --reload
#frontend npm start
load_dotenv()

app = FastAPI(
    title="RAG Chatbot Backend",
    description="FastAPI sunucusunun temel yapısı."
)
origins = [
    "https://68f8d9880b0df950cbb1e182--bespoke-pavlova-a1e252.netlify.app",
    "https://bespoke-pavlova-a1e252.netlify.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",     
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(upload.router)
app.include_router(query.router)
app.include_router(search.router)  
# http://localhost:8080/
@app.get("/")
def read_root():
    return {"message": "FastAPI Backend Sunucusu başarıyla çalışıyor."}
@app.post("/postOneTry")
def postOneTry():
    return {"message":"postOneTry çalıştı"}

@app.post("/upload/document")
def uploaddocument(file: UploadFile = File(...)):
    '''
    print(
        "message:"+ "uploaddocument çalıştı \n"+
        "filename:"+ file.filename +"\n"+
        "content_type:"+ file.content_type
    );
    '''
    return {
        "message": "uploaddocument çalıştı ",
        "filename ": file.filename ,
        "content_type ": file.content_type
        };
   
    
async def restart_server():
    url = "https://chatbotprojesi-9.onrender.com/" 
    while True:
        try:
            async with httpx.AsyncClient() as istemci:
                await istemci.get(url)
                print("Ping gönderildi!")
        except Exception as hata:
            print("Ping başarısız:", hata)
        await asyncio.sleep(50) 

@app.on_event("startup")
async def uygulama_baslangici():
    asyncio.create_task(restart_server())
    print("Uygulama başlatıldı, ping döngüsü çalışıyor...")



