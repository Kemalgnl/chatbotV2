from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean
from database import Base

class Kullanici(Base):
    __tablename__ = "Kullanıcılar"
    kullanici_id = Column(Integer, primary_key=True, index=True)
    kullanici_adi = Column(String(255), nullable=False)
    kullanici_email = Column(String(255), nullable=False, unique=True)
    kullanici_sifre = Column(String(255), nullable=False)

class Sohbet(Base):
    __tablename__ = "Sohbetler"
    sohbet_id = Column(Integer, primary_key=True, index=True)
    sohbet_kullanici_id = Column(Integer, ForeignKey("Kullanıcılar.kullanici_id"))
    sohbet_adi = Column(String(255))

