
import React, { createContext, useContext, useState } from "react";
import { useUser } from "../Users/useContext";
import { Alert } from "react-native";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { token } = useUser();
  const [chatMessages, setChatMessages] = useState([]);

  const sendMessage = async (messageText) => {
    if (!messageText.trim()) return;

    if (!token) {
      Alert.alert("Authentication Error", "No token found. Please log in again.");
      return;
    }
    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
    };
    setChatMessages((prev) => [...prev, userMessage]);

    try {
      const res = await fetch("https://thisprojectbackend1-1.onrender.com/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: messageText }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || "Chat failed");
      }

      const botMessage = {
        id: Date.now().toString() + "_bot",
        role: "model",
        content: data.response
      };

      setChatMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error("❌ Chat error:", err.message);
      Alert.alert("Chat Error", err.message);
    }
  };

  return (
    <ChatContext.Provider value={{ chatMessages, sendMessage }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);

