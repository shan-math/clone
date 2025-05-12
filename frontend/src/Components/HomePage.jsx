import React, { useEffect, useRef, useState } from "react";
import "./HomePage.css";
import { useNavigate } from "react-router-dom";
import Profile from "./Profile/Profile";
import { useCallback } from 'react';
import CreateGroup from "./Group/CreateGroup";
import { useDispatch, useSelector } from "react-redux";
import { currentUser, logoutAction, searchUser } from "../Redux/Auth/Action";
import { createChat, getUsersChat } from "../Redux/Chat/Action";
import { createMessage, getAllMessages } from "../Redux/Message/Action";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import ProfileSection from "./HomeComponents/ProfileSection";
import SearchBar from "./HomeComponents/SearchBar";
import ChatList from "./HomeComponents/ChatList";
import MessageCard from "./MessageCard/MessageCard";
import { AiOutlineSearch } from "react-icons/ai";
import { BsEmojiSmile, BsMicFill, BsThreeDotsVertical } from "react-icons/bs";
import { ImAttachment } from "react-icons/im";

function HomePage() {
  const [querys, setQuerys] = useState("");
  const [currentChat, setCurrentChat] = useState(null);
  const [content, setContent] = useState("");
  const [isProfile, setIsProfile] = useState(false);
  const navigate = useNavigate();
  const [isGroup, setIsGroup] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const dispatch = useDispatch();
  const { auth, chat, message } = useSelector((store) => store);
  const token = localStorage.getItem("token");
  const [stompClient, setStompClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [lastMessages, setLastMessages] = useState({});
  const messageContainerRef = useRef(null);

  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages]);

 const connect = useCallback(() => {
  const socket = new SockJS("http://localhost:8080/ws");
  const client = new Client({
    webSocketFactory: () => socket,
    connectHeaders: {
      Authorization: `Bearer ${token}`,
      "X-XSRF-TOKEN": getCookie("XSRF-TOKEN"),
    },
    onConnect: () => {
      setIsConnected(true);
      setStompClient(client);
    },
    onStompError: (frame) => {
      console.error("Broker error: ", frame.headers["message"]);
    },
  });

  client.activate();
},[token]);



  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop().split(";").shift();
    }
  }


  const onMessageReceive = (payload) => {
    const receivedMessage = JSON.parse(payload.body);
    setMessages((prevMessages) => {
      if (!prevMessages.find((msg) => msg.id === receivedMessage.id)) {
        return [...prevMessages, receivedMessage];
      }
      return prevMessages;
    });
  };

  useEffect(() => {
    connect();
  }, [connect, dispatch, token]);

  useEffect(() => {
  if (isConnected && stompClient && currentChat?.id) {
    const destination = currentChat.isGroupChat
      ? `/group/${currentChat.id}`
      : `/user/${currentChat.id}`;

    const subscription = stompClient.subscribe(destination, onMessageReceive);

    return () => {
      subscription.unsubscribe();
    };
  }
}, [isConnected, stompClient, currentChat,connect]);


  useEffect(() => {
    if (message.newMessage && stompClient) {
      stompClient.send("/app/message", {}, JSON.stringify(message.newMessage));
      setMessages((prevMessages) => [...prevMessages, message.newMessage]);
    }
  }, [message.newMessage, stompClient]);

  useEffect(() => {
    if (message.messages) {
      setMessages(message.messages);
    }
  }, [message.messages,connect]);

  useEffect(() => {
    if (currentChat?.id) {
      dispatch(getAllMessages({ chatId: currentChat.id, token }));
    }
  }, [currentChat, message.newMessage,connect, dispatch, token]);

  useEffect(() => {
    dispatch(getUsersChat({ token }));
  }, [chat.createdChat, chat.createdGroup,connect, dispatch, token]);

  const handleClick = (e) => {
    setAnchorEl(e.currentTarget);
  };

const sendMessage = async ({ text, media }) => {
  if (!stompClient || !isConnected) {
    console.error("Socket not connected. Message not sent.");
    return;
  }

  const message = {
    userId: auth.reqUser?.id,
    chatId: currentChat?.id,
    content: text,
    mediaUrl: media || null,
  };

  stompClient.send("/app/message", {}, JSON.stringify(message));
};




  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleClickOnChatCard = (userId) => {
    dispatch(createChat({ token, data: { userId } }));
  };

  const handleSearch = (keyword) => {
    dispatch(searchUser({ keyword, token }));
  };

  const handleCreateNewMessage = () => {
    dispatch(createMessage({ token, data: { chatId: currentChat.id, content } }));
    setContent("");
  };

  useEffect(() => {
    dispatch(currentUser(token));
  }, [token, dispatch]);

  const handleCurrentChat = (item) => {
    setCurrentChat(item);
  };

  useEffect(() => {
    const prevLastMessages = { ...lastMessages };
    if (message.messages && message.messages.length > 0) {
      message.messages.forEach((msg) => {
        prevLastMessages[msg.chat.id] = msg;
      });
      setLastMessages(prevLastMessages);
    }
  }, [message.messages,lastMessages]);

  const handleNavigate = () => {
    setIsProfile(true);
  };

  const handleCloseOpenProfile = () => {
    setIsProfile(false);
  };
const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  const token = localStorage.getItem("token"); // get the JWT

  try {
    const response = await fetch("http://localhost:8080/api/messages/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`, // ✅ include JWT here
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Upload failed with status " + response.status);
    }

    const mediaUrl = await response.text();
    console.log("Upload response:", mediaUrl);

    sendMessage({ text: "hi", media: mediaUrl });
  } catch (error) {
    console.error("Media upload failed:", error.message);
  }
};

  const handleCreateGroup = () => {
    setIsGroup(true);
  };

  const handleLogout = () => {
    dispatch(logoutAction());
    navigate("/signin");
  };

  useEffect(() => {
    if (!auth.reqUser) {
      navigate("/signin");
    }
  }, [auth.reqUser,navigate]);

  return (

    <div className="relative">
    <div className="w-[100vw] py-14 bg-[#00a884]">
      <div className="flex bg-[#f0f2f5] h-[90vh] absolute top-[5vh] left-[2vw] w-[96vw]">
        <div className="left w-[30%] h-full bg-[#e8e9ec]">
          {isProfile && (
            <div className="w-full h-full">
              <Profile handleCloseOpenProfile={handleCloseOpenProfile} />
            </div>
          )}
          {isGroup && <CreateGroup setIsGroup={setIsGroup} />}
          {!isProfile && !isGroup && (
            <div className="w-full">
              <ProfileSection
                auth={auth}
                isProfile={isProfile}
                isGroup={isGroup}
                handleNavigate={handleNavigate}
                handleClick={handleClick}
                handleCreateGroup={handleCreateGroup}
                handleLogout={handleLogout}
                handleClose={handleClose}
                open={open}
                anchorEl={anchorEl}
              />
              <SearchBar
                querys={querys}
                setQuerys={setQuerys}
                handleSearch={handleSearch}
              />
              <ChatList
                querys={querys}
                auth={auth}
                chat={chat}
                lastMessages={lastMessages}
                handleClickOnChatCard={handleClickOnChatCard}
                handleCurrentChat={handleCurrentChat}
              />
            </div>
          )}
        </div>
         {/* Default WhatsApp Page */}
         {!currentChat?.id && (
            <div className="w-[70%] flex flex-col items-center justify-center h-full">
              <div className="max-w-[70%] text-center">
                <img
                  className="ml-11 lg:w-[75%] "
                  src="https://cdn.pixabay.com/photo/2015/08/03/13/58/whatsapp-873316_640.png"
                  alt="whatsapp-icon"
                />
                <h1 className="text-4xl text-gray-600">WhatsApp Web</h1>
                <p className="my-9">
                  Send and receive messages with WhatsApp and save time.
                </p>
              </div>
            </div>
          )}

          {/* Message Section */}
          {currentChat?.id && (
            <div className="w-[70%] relative  bg-blue-200">
              <div className="header absolute top-0 w-full bg-[#f0f2f5]">
                <div className="flex justify-between">
                  <div className="py-3 space-x-4 flex items-center px-3">
                    <img
                      className="w-10 h-10 rounded-full"
                      src={
                        currentChat.group
                          ? currentChat.chat_image ||
                            "https://media.istockphoto.com/id/521977679/photo/silhouette-of-adult-woman.webp?b=1&s=170667a&w=0&k=20&c=wpJ0QJYXdbLx24H5LK08xSgiQ3zNkCAD2W3F74qlUL0="
                          : auth.reqUser?.id !== currentChat.users[0]?.id
                          ? currentChat.users[0]?.profile ||
                            "https://media.istockphoto.com/id/521977679/photo/silhouette-of-adult-woman.webp?b=1&s=170667a&w=0&k=20&c=wpJ0QJYXdbLx24H5LK08xSgiQ3zNkCAD2W3F74qlUL0="
                          : currentChat.users[1]?.profile ||
                            "https://media.istockphoto.com/id/521977679/photo/silhouette-of-adult-woman.webp?b=1&s=170667a&w=0&k=20&c=wpJ0QJYXdbLx24H5LK08xSgiQ3zNkCAD2W3F74qlUL0="
                      }
                      alt="profile"
                    />
                    {!currentChat?.users ? (
  <p>Loading chat...</p>
) : (
  <p>
    {currentChat.group
      ? currentChat.chatName
      : auth.reqUser?.id !== currentChat.users?.[0]?.id
      ? currentChat.users?.[0]?.name
      : currentChat.users?.[1]?.name}
  </p>
)}

                  </div>
                  <div className="flex py-3 space-x-4 items-center px-3">
                    <AiOutlineSearch />
                    <BsThreeDotsVertical />
                  </div>
                </div>
              </div>

              {/* Message Section */}
              <div className="px-10 h-[85vh] overflow-y-scroll pb-10" ref={messageContainerRef}>
                <div className="space-y-1 w-full flex flex-col justify-center items-end  mt-20 py-2">
                  {messages?.length > 0 &&
  messages?.map((item, i) => (
    <MessageCard
      key={i}
      isReqUserMessage={item?.user?.id !== auth?.reqUser?.id}
      content={item.content}
      mediaUrl={item.mediaUrl}
      timestamp={item.timestamp}
      profilePic={item?.user?.profile || "https://media.istockphoto.com/…"}
    />
  ))}

                </div>
              </div>

              {/* Footer Section */}
              <div className="footer bg-[#f0f2f5] absolute bottom-0 w-full py-3 text-2xl">
                <div className="flex justify-between items-center px-5 relative">
                  <BsEmojiSmile className="cursor-pointer" />
                  <ImAttachment />

                  <input
                    className="py-2 outline-none border-none bg-white pl-4 rounded-md w-[85%]"
                    type="text"
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Type message"
                    value={content}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleCreateNewMessage();
                        setContent("");
                      }
                    }}
                  />
                  <input type="file" onChange={handleFileUpload} />

                  <BsMicFill />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
        
export default HomePage;