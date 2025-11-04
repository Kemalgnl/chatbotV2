export async function askQuestion(question, file = null) {
  try {
    const formData = new FormData();
    formData.append("question", question);
    if (file) {
      formData.append("file", file);
    }
/*
    const response = await fetch("http://127.0.0.1:8000/ask", {
      method: "POST",
      body: formData,
    });

    */
    const response = await fetch("https://chatbotprojesi-9.onrender.com/ask", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Sunucu hatası!");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("İstek hatası:", error);
    return { answer: "Bir hata oluştu, lütfen tekrar deneyin.", sources: [] };
  }
}

export async function uploadFile(file, question) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("question", question);

  try {
    const response = await fetch("https://chatbotprojesi-9.onrender.com/askWithfile", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Dosya yüklenemedi:", error);
  }
}

export async function search_articles(query, limit) {
  try {
    arama = AramaSistemi((kayit_klasoru = "indirilen_makaleler"));
    sonuclar = arama.makaleleri_ara(query, limit);
    return { durum: "başarılı", veri: sonuclar };
  } catch (error) {
    console.error("durum", "hata", "mesaj", str(error));
  }
}

export async function findPdf(question) {
  const formData = new FormData();
  formData.append("aranan_kelime", question);
  try {
    const response = await fetch("https://chatbotprojesi-9.onrender.com/findPdf", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Dosya yüklenemedi:", error);
  }
}
