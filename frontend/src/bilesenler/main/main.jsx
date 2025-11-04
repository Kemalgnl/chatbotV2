import { memo, useState, useEffect, useRef } from "react";
import "./main.css";
import Sidebar from "../Sidebar/Sidebar";

import { askQuestion, search_articles } from "./api.js";
import { uploadFile } from "./api.js";
import { findPdf } from "./api.js";

import { GrGallery } from "react-icons/gr";
import { FaMicrophone, FaUserCircle, FaRegLightbulb } from "react-icons/fa";
import { IoSend } from "react-icons/io5";
import gemini from "../images/gemini.png";
import { useDropzone } from "react-dropzone";
import { FaMoon } from "react-icons/fa";
import { IoIosSunny } from "react-icons/io";
import { FaTimes } from "react-icons/fa";
import { FaSearch } from "react-icons/fa";

const Main = () => {
  const [question, setQuestion] = useState("");
  const [chatId, setChatId] = useState(1);
  const [messagesMap, setMessagesMap] = useState({ 1: [] });
  const [showResult, setShowResult] = useState(false);
  const resultRef = useRef(null);
  const [file, setFile] = useState(null);
  const [chats, setChats] = useState([]);

  useEffect(() => {
    const storedMessages =
      JSON.parse(localStorage.getItem("messagesMap")) || {};
    const storedChats = JSON.parse(localStorage.getItem("chats")) || [];

    const path = window.location.pathname;
    const match = path.match(/chatno:(\d+)/);
    const chatNoFromUrl = match ? parseInt(match[1], 10) : 1;

    if (storedChats.length === 0) {
      const initialChat = { id: 1, name: "Sohbet 1" };
      setChats([initialChat]);
      localStorage.setItem("chats", JSON.stringify([initialChat]));
    } else {
      setChats(storedChats);
    }

    setMessagesMap({
      ...storedMessages,
      [chatNoFromUrl]: storedMessages[chatNoFromUrl] || [],
    });
    setChatId(chatNoFromUrl);
    setShowResult(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("messagesMap", JSON.stringify(messagesMap));

    if (resultRef.current) {
      resultRef.current.scrollTo({
        top: resultRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messagesMap, chatId]);

  function formatAnswer(str) {
    const jsonString = JSON.stringify(str, null, 2);
    return jsonString
      .replace(/\\n/g, "\n")
      .replace(/\*+/g, "")
      .replace(/ {2,}/g, "")
      .replace(/"+/g, "")
      .replace(/\\+/g, "")
      .replace(/`+/g, '"')
      .trim();
  }
  function loadChatHistory(chatId, setMessagesMap) {
    const chatHistory = JSON.parse(localStorage.getItem("chatHistory")) || [];
    const existingChat = chatHistory.find((chat) => chat.id === chatId);

    if (existingChat) {
      const loadedMessages = [];

      for (let i = 0; i < existingChat.questions.length; i++) {
        loadedMessages.push({
          role: "user",
          content: existingChat.questions[i],
        });
        loadedMessages.push({ role: "bot", content: existingChat.answers[i] });
      }

      setMessagesMap((prev) => ({
        ...prev,
        [chatId]: loadedMessages,
      }));
    } else {
      console.log(` Chat ID ${chatId} için kayıtlı geçmiş bulunamadı.`);
    }
  }

  function startNewChat() {
    const allIds = Object.keys(messagesMap).map(Number);
    const newChatId = allIds.length > 0 ? Math.max(...allIds) + 1 : 1;

    const newChat = { id: newChatId, name: `Sohbet ${newChatId}` };
    const updatedChats = [...chats, newChat];
    setChats(updatedChats);
    localStorage.setItem("chats", JSON.stringify(updatedChats));

    setChatId(newChatId);
    setMessagesMap((prev) => ({ ...prev, [newChatId]: [] }));
    setShowResult(false);
    window.history.pushState({}, "", `/chat/id:1/chatno:${newChatId}`);
  }

  function selectChat(id) {
    setChatId(id);
    setShowResult(true);
    window.history.pushState({}, "", `/chat/id:1/chatno:${id}`);
    loadChatHistory(id, setMessagesMap);

    const storedChats = JSON.parse(localStorage.getItem("chats")) || [];
    if (!storedChats.find((chat) => chat.id === id)) {
      const newChat = { id: id, name: `Sohbet ${id}` };
      const updated = [...storedChats, newChat];
      localStorage.setItem("chats", JSON.stringify(updated));
      setChats(updated);
    } else {
      setChats(storedChats);
    }
  }

  const [pdfsName, setpdfsName] = useState([]);

  async function testQuestion(isClickSearch = false) {
    if (!question) return;
    let data;

    if (file && isClickSearch === false) {
      data = await uploadFile(file, question);
      setIsFileExist(0);
      setFile(null);
    } else if (isClickSearch === true) {
      setpdfsName(await findPdf(question));
      console.log(pdfsName);

      data = await askQuestion(question, null);
      isClickSearch = false;
    } else {
      data = await askQuestion(question, null);
    }

    setMessagesMap((prev) => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), { role: "user", content: question }],
    }));

    try {
      const botMessage = {
        role: "bot",
        content: data?.answer ?? "Bir hata oluştu",
      };
      setMessagesMap((prev) => ({
        ...prev,
        [chatId]: [...(prev[chatId] || []), botMessage],
      }));
      addChatHistory(chatId, question, botMessage.content);
    } catch (error) {
      const botMessage = { role: "bot", content: "Bir hata oluştu" };
      setMessagesMap((prev) => ({
        ...prev,
        [chatId]: [...(prev[chatId] || []), botMessage],
      }));
    }

    setQuestion("");
    setShowResult(true);
  }

  const [isFileExist, setIsFileExist] = useState(0);
  async function SendFile() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".txt,.pdf,.docx,.json";
    input.click();

    input.onchange = (e) => {
      setFile(e.target.files[0]);
    };
    setIsFileExist(1);
  }

  const [isMoon, setIsMicOn] = useState(false);
  async function ChangeLights() {
    setIsMicOn((prev) => !prev);
    const newState = !isMoon;
    setIsMicOn(newState);

    const main = document.querySelector(".main");
    const sidebar = document.querySelector(".sidebar");
    const nav = document.querySelector(".nav");
    const recentTitle = document.querySelector(".recentTitle");
    const recentEntrys = document.querySelectorAll(".recent");
    const bottonItems = document.querySelectorAll(".bottonItem");
    const fileBanner = document.querySelector(".fileBanner");
    const bottom = document.querySelector(".bottom");

    if (main) {
      main.style.backgroundColor = newState ? "#363434ff" : "#f5f5f5";
      main.style.color = newState ? "#ffffff" : "#000000";
      main.style.minHeight = "100vh";
      main.style.transition = "all 0.3s ease";

      sidebar.style.backgroundColor = newState ? "#4d4949ff" : "#f5f5f5";
      sidebar.style.color = newState ? "#ffffff" : "#000000";
      sidebar.style.transition = "all 0.3s ease";

      nav.style.backgroundColor = newState ? "#363434ff" : "#f5f5f5";
      nav.style.color = newState ? "#ffffff" : "#000000";
      nav.style.transition = "all 0.3s ease";

      recentTitle.style.backgroundColor = newState ? "#4d4949ff" : "#f5f5f5";
      recentTitle.style.color = newState ? "#ffffff" : "#000000";
      recentTitle.style.transition = "all 0.3s ease";

      fileBanner.style.backgroundColor = newState ? "#4d4949ff" : "#f5f5f5";
      fileBanner.style.color = newState ? "#ffffff" : "#000000";
      fileBanner.style.transition = "all 0.3s ease";

      bottom.style.backgroundColor = newState ? "#4d4949ff" : "#f5f5f5";
      bottom.style.color = newState ? "#ffffff" : "#000000";
      bottom.style.transition = "all 0.3s ease";

      recentEntrys.forEach((item2) => {
        item2.style.backgroundColor = newState ? "#4d4949ff" : "#f5f5f5";
        item2.style.color = newState ? "#ffffff" : "#000000";
        item2.style.transition = "all 0.3s ease";
      });

      bottonItems.forEach((item) => {
        item.style.backgroundColor = newState ? "#4d4949ff" : "#f5f5f5";
        item.style.color = newState ? "#ffffff" : "#000000";
        item.style.transition = "all 0.3s ease";
      });
    }
  }

  const chatHistory = JSON.parse(localStorage.getItem("chatHistory")) || [];

  function addChatHistory(id, question, answer) {
    const existingChat = chatHistory.find((chat) => chat.id === id);

    if (existingChat) {
      existingChat.questions = [...existingChat.questions, question];
      existingChat.answers = [...existingChat.answers, answer];
    } else {
      chatHistory.push({
        id: id,
        questions: [question],
        answers: [answer],
      });
    }

    localStorage.setItem("chatHistory", JSON.stringify([...chatHistory]));
  }

  const [loading, setLoading] = useState(false);

  const ClickSearch = async () => {
    await setLoading(true);
    try {
      await testQuestion(true);
    } catch (error) {
      console.error("Arama hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  const messages = messagesMap[chatId] || [];

  return (
    <div className="main">
      <Sidebar
        className="sidebar"
        messagesMap={messagesMap}
        chatId={chatId}
        chats={chats}
        startNewChat={startNewChat}
        selectChat={selectChat}
        chatHistory={chatHistory}
        isMoon={isMoon}
      />
      <div className="chatContainer">
        <div className="nav">
          <p>Chatbot</p>

          {isMoon ? (
            <IoIosSunny onClick={ChangeLights} size={30} />
          ) : (
            <FaMoon onClick={ChangeLights} size={25} />
          )}

          <FaUserCircle className="userphoto" />
        </div>
        <div className="mainController">
          {!showResult ? (
            <>
              <div className="open">
                <p>
                  <span>HELLO WORLD</span>
                </p>
                <p>LETS TALK</p>
              </div>
              <div className="cards">
                <div className="card">
                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipisicing elit.
                    Facere a enim at sequi dolorem eos!
                  </p>
                  <FaRegLightbulb className="cardIcon" />
                </div>
                <div className="card">
                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipisicing elit.
                    Facere a enim at sequi dolorem eos!
                  </p>
                  <FaRegLightbulb className="cardIcon" />
                </div>
                <div className="card">
                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipisicing elit.
                    Facere a enim at sequi dolorem eos!
                  </p>
                  <FaRegLightbulb className="cardIcon" />
                </div>
                <div className="card">
                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipisicing elit.
                    Facere a enim at sequi dolorem eos!
                  </p>
                  <FaRegLightbulb className="cardIcon" />
                </div>
              </div>
            </>
          ) : (
            <div className="result" ref={resultRef}>
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={msg.role === "user" ? "resultTitle" : "resultData"}
                >
                  {msg.role === "user" ? (
                    <>
                      <FaUserCircle className="userphoto" />
                      <p>{msg.content}</p>
                    </>
                  ) : (
                    <>
                      <img
                        className="geminiIcon"
                        src={gemini}
                        alt=""
                        width="50"
                      />
                      <pre className="resultDataText">
                        {formatAnswer(msg.content)}
                      </pre>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="chatbase">
            {file && (
              <div
                className={`fileBanner ${isMoon ? "dark" : "light"}`}
                key="singleFile"
              >
                <span className="fileName">{file.name}</span>
                <FaTimes
                  className="removeFile"
                  onClick={() => {
                    setFile(null);
                    setIsFileExist(0);
                  }}
                />
              </div>
            )}
            {pdfsName.length > 0 &&
              pdfsName.map((name, index) => (
                <div
                  className={`fileBanner ${isMoon ? "dark" : "light"}`}
                  key={index}
                >
                  <span className="fileName">{name}</span>
                  <FaTimes
                    className="removeFile"
                    onClick={() =>
                      setpdfsName((prev) => prev.filter((_, i) => i !== index))
                    }
                  />
                </div>
              ))}

            <div className="searchBox">
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                type="text"
                placeholder="write here"
                onKeyDown={(e) => e.key === "Enter" && testQuestion()}
              />
              <div className="searchicons">
                <button
                  className="arastırbtn"
                  onClick={ClickSearch}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Araştırılıyor...
                    </>
                  ) : (
                    <>
                      <FaSearch />
                      Araştır
                    </>
                  )}
                </button>
                <button onClick={SendFile} className="uploadfilebutton">
                  <GrGallery />
                </button>
                <button className="microphonebutton">
                  {" "}
                  <FaMicrophone />
                </button>
                <button onClick={testQuestion} className="sendButton">
                  <IoSend />
                </button>
              </div>
            </div>
            <p className="bottomInfo">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Eveniet,
              hic?
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(Main);
