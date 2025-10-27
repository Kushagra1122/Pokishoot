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
    <div className="bg-gray-950 border-4 border-yellow-400 p-4 flex flex-col" style={{ fontFamily: 'monospace' }}>
      <div className="flex-1 h-32 overflow-y-auto bg-gray-900 p-3 mb-3 border-2 border-gray-700">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm font-black uppercase">NO MESSAGES</p>
            <p className="text-gray-500 text-xs mt-1 font-black">START CHATTING!</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className="text-yellow-400 text-sm mb-1 font-black uppercase" style={{ fontFamily: 'monospace' }}>
              {msg}
            </div>
          ))
        )}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="TYPE MESSAGE..."
          className="flex-1 px-3 py-2 bg-gray-900 border-2 border-gray-700 text-yellow-400 placeholder-yellow-400/50 font-black uppercase focus:outline-none focus:border-yellow-400"
          style={{ fontFamily: 'monospace' }}
        />
        <button
          onClick={handleSend}
          className="px-4 py-2 bg-yellow-400 text-black font-black border-2 border-yellow-600 hover:bg-yellow-300 transition uppercase"
          style={{ fontFamily: 'monospace', boxShadow: '0 4px 0 #d97706' }}
        >
          SEND
        </button>
      </div>
    </div>
  );
};

export default ChatBox;
