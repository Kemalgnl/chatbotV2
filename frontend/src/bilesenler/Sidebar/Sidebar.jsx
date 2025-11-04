import { memo, use, useState } from "react";
import "./Sidebar.css";
import { IoMdMenu } from "react-icons/io";
import { RiChatNewLine } from "react-icons/ri";
import { FaMessage } from "react-icons/fa6";
import { FaQuestion } from "react-icons/fa";
import { MdOutlineHistory } from "react-icons/md";
import { IoIosSettings } from "react-icons/io";

const Sidebar = ({
  chats = [],
  chatId,
  startNewChat,
  selectChat,
  chatHistory,
  isMoon,
}) => {
  const parsedChatHistory = Array.isArray(chatHistory) ? chatHistory : JSON.parse(chatHistory || "[]");
  const [CloseSideBar,SetCloseSideBar] = useState(false);
  console.log(CloseSideBar);
  return (
    
    <div className={`sidebar ${CloseSideBar ? "click" : "unclick"}`}>
      <div className="top">
        <IoMdMenu className="menuicon" onClick={()=>SetCloseSideBar(prev=>!prev)} />

        <div onClick={startNewChat} className={`newChat ${CloseSideBar ? "click" : "unclick"}`} >
          <RiChatNewLine className="icon" />
          <p>New Chat</p>
        </div>

        <div className="recent">
          <p className="recentTitle">History</p>
          {chats.length === 0 ? (
            <p className="noHistory">No chats yet</p>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.id}
                className={`recentEntry ${isMoon ? "dark" : "light"} ${chat.id === chatId ? "active" : ""} ${CloseSideBar ? "click" : "unclick"}`}
                onClick={() => selectChat(chat.id)}
              >
                <FaMessage className="icon" />
                  <p>{parsedChatHistory.find(ch => ch.id === chat.id)?.questions[0]}</p>
              </div>
            ))
          )}
        </div>
      </div>
      <div className="bottom">
        <div className={`bottonItem recentEntry ${isMoon ? "dark" : "light"} ${CloseSideBar ? "click" : "unclick"}`}>
          <FaQuestion className=" bottomicon" />
          <p>Help</p>
        </div>
        <div className={`bottonItem recentEntry ${isMoon ? "dark" : "light"} ${CloseSideBar ? "click" : "unclick"}`}>
          <MdOutlineHistory className=" bottomicon" />
          <p>Activity</p>
        </div>
        <div className={`bottonItem recentEntry ${isMoon ? "dark" : "light"} ${CloseSideBar ? "click" : "unclick"}`}>
          <IoIosSettings className=" bottomicon" />
          <p>Settings</p>
        </div>
      </div>
    </div>
  );
};

export default memo(Sidebar);
