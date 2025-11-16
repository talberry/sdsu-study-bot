"use client";

import React, { useState, useRef, useEffect } from "react";
import { useCanvasTokenContext } from "./CanvasTokenProvider";
import MessageContent from "./MessageContent";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

interface ToolExecution {
  step: number;
  name: string;
  status: "started" | "completed";
}

export default function ChatInterface() {
  const { token } = useCanvasTokenContext();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I'm your Study Bot assistant. How can I help you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentTools, setCurrentTools] = useState<ToolExecution[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userMessageText = inputValue;
    setInputValue("");
    setIsLoading(true);
    setCurrentTools([]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: userMessageText,
        }),
      });

      if (response.ok && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.type === "tool") {
                  if (data.status === "started") {
                    setCurrentTools((prev) => [
                      ...prev,
                      { step: data.step, name: data.name, status: "started" },
                    ]);
                  } else if (data.status === "completed") {
                    setCurrentTools((prev) =>
                      prev.map((tool) =>
                        tool.step === data.step && tool.name === data.name
                          ? { ...tool, status: "completed" }
                          : tool
                      )
                    );
                  }
                } else if (data.type === "final") {
                  const botMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    text: data.text || "I'm not sure how to respond to that.",
                    sender: "bot",
                    timestamp: new Date(),
                  };
                  setMessages((prev) => [...prev, botMessage]);
                  setCurrentTools([]);
                } else if (data.type === "error") {
                  // Show the actual error message if available, otherwise show generic message
                  const errorText = data.error 
                    ? `Error: ${data.error}` 
                    : "Sorry, I encountered an error. Please try again.";
                  const errorMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    text: errorText,
                    sender: "bot",
                    timestamp: new Date(),
                  };
                  setMessages((prev) => [...prev, errorMessage]);
                  setCurrentTools([]);
                  console.error("Chat error:", data.error, data.details);
                }
              } catch (e) {
                console.error("Error parsing SSE data:", e);
              }
            }
          }
        }
      } else {
        // Fallback response
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: "Sorry, I encountered an error. Please try again.",
          sender: "bot",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I encountered an error. Please try again.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setCurrentTools([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatToolName = (name: string): string => {
    return name
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 chat-scrollbar">
        {!token && (
          <div className="mx-auto mb-2 max-w-md bg-[#141414] border border-[#1f1f1f] p-3 text-center text-gray-400 text-xs font-semibold rounded-lg">
            No Canvas token linked — click {"Link Canvas"} above to add your
            token.
          </div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs lg:max-w-2xl px-4 py-3 rounded-lg ${
                message.sender === "user"
                  ? "bg-[#8b2e2e] text-white border border-[#8b2e2e] shadow-[0_0_20px_rgba(139,46,46,0.5),0_0_40px_rgba(139,46,46,0.3)]"
                  : "bg-[#141414] border border-[#1f1f1f] text-white"
              }`}
            >
              {message.sender === "bot" ? (
                <MessageContent text={message.text} />
              ) : (
                <p className="text-sm whitespace-pre-wrap">{message.text}</p>
              )}
              <span className="text-xs opacity-70 mt-2 block font-semibold">
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        ))}
        {isLoading && currentTools.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-[#141414] border border-[#1f1f1f] text-white px-4 py-3 rounded-lg max-w-md">
              <div className="text-xs font-semibold text-gray-400 mb-2">
                🔧 Running Tools
              </div>
              <div className="space-y-2">
                {currentTools.map((tool, index) => (
                  <div
                    key={`${tool.step}-${tool.name}-${index}`}
                    className="flex items-center space-x-2"
                  >
                    {tool.status === "started" ? (
                      <div className="w-4 h-4 border-2 border-[#8b2e2e] border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                    <span className="text-sm">{formatToolName(tool.name)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {isLoading && currentTools.length === 0 && (
          <div className="flex justify-start">
            <div className="bg-[#141414] border border-[#1f1f1f] text-white px-4 py-3 rounded-lg">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-[#8b2e2e] rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-[#8b2e2e] rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-[#8b2e2e] rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-[#1f1f1f] p-3 bg-black flex-shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter your question"
            disabled={isLoading}
            className="flex-1 px-3 py-4 text-base bg-[#1f1f1f] border border-[#1f1f1f] text-white placeholder-gray-500 focus:outline-none focus:border-[#8b2e2e] disabled:opacity-50 rounded-lg"
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim()}
            className="px-4 py-2 text-sm bg-[#8b2e2e] hover:shadow-[0_0_20px_rgba(139,46,46,0.5),0_0_40px_rgba(139,46,46,0.3)] border border-[#8b2e2e] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-all duration-300 rounded-lg"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
