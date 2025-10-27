import React, { useState, useRef, useEffect } from "react";

const ChatBox = ({ messages, setMessage }) => {
  const [input, setInput] = useState("");
  const chatRef = useRef();

  const handleSend = () => {
    if (!input.trim()) return;
    setMessage(input);
    setInput("");
  };

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  return (
    <div className="bg-yellow-400/10 border border-yellow-400 rounded-xl p-4 flex flex-col">
      <h2 className="text-yellow-200 font-bold mb-3">Chat</h2>
      <div className="flex-1 h-32 overflow-y-auto bg-yellow-400/5 rounded-lg p-3 mb-3" ref={chatRef}>
        {messages.map((msg, i) => (
          <div key={i} className="text-yellow-50 text-sm mb-1">
            {msg}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type message..."
          className="flex-1 px-3 py-2 rounded-lg bg-yellow-400/20 border border-yellow-400 text-blue-200 font-bold"
        />
        <button
          onClick={handleSend}
          className="px-4 py-2 bg-yellow-400 text-blue-900 font-bold rounded-lg hover:bg-yellow-300 transition"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatBox;
