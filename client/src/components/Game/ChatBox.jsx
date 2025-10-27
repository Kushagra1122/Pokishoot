// ChatBox.jsx (Enhanced)
import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, Users } from 'lucide-react';

const ChatBox = ({ messages, setMessages, socket, user, gameCode }) => {
  const [newMessage, setNewMessage] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(true);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;

    const messageData = {
      playerId: user.id,
      playerName: user.name,
      text: newMessage.trim(),
      gameCode,
      timestamp: Date.now(),
      type: 'player'
    };

    socket.emit('sendGameMessage', messageData);
    setNewMessage('');
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`bg-gray-900 border-4 border-yellow-400 flex flex-col transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-80'
    }`} style={{ fontFamily: 'monospace', boxShadow: '0 8px 0 #92400e' }}>
      
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-800 transition-colors duration-300 bg-gray-950"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-yellow-400" strokeWidth={3} />
            <h2 className="font-black text-white text-lg uppercase">Chat</h2>
          </div>
        )}
        <div className={`w-10 h-10 bg-yellow-400 border-2 border-yellow-600 flex items-center justify-center ${
          isCollapsed ? 'rotate-180' : ''
        }`} style={{ clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)' }}>
          <span className="text-black text-lg font-black">▲</span>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-2 p-4 max-h-80 bg-gray-950">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" strokeWidth={3} />
                <p className="text-gray-400 text-sm font-black uppercase" style={{ fontFamily: 'monospace' }}>NO MESSAGES</p>
                <p className="text-gray-500 text-xs mt-1 font-black" style={{ fontFamily: 'monospace' }}>START CHATTING!</p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`p-3 border-2 ${
                    msg.type === 'system'
                      ? 'border-purple-400 bg-purple-500/10'
                      : msg.self
                      ? 'border-emerald-400 bg-emerald-500/10 ml-4'
                      : 'border-blue-400 bg-blue-500/10 mr-4'
                  }`}
                >
                  {msg.type !== 'system' && (
                    <div className={`flex items-center justify-between mb-2 ${msg.self ? 'flex-row-reverse' : ''}`}>
                      <span className={`text-xs font-black uppercase ${
                        msg.self ? 'text-emerald-400' : 'text-blue-400'
                      }`} style={{ fontFamily: 'monospace' }}>
                        {msg.self ? 'YOU' : msg.playerName?.toUpperCase()}
                      </span>
                      <span className="text-gray-500 text-xs font-black" style={{ fontFamily: 'monospace' }}>{formatMessageTime(msg.timestamp)}</span>
                    </div>
                  )}
                  <div className={`text-sm font-bold ${
                    msg.type === 'system' 
                      ? 'text-purple-300 italic text-center' 
                      : msg.self 
                      ? 'text-emerald-300' 
                      : 'text-blue-300'
                  }`} style={{ fontFamily: 'monospace' }}>
                    {msg.text}
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="p-4 border-t-4 border-gray-700 bg-gray-900">
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 px-3 py-2 text-sm text-white bg-gray-950 border-2 border-gray-700 focus:outline-none focus:border-yellow-400 placeholder-gray-500 transition-all duration-300"
                style={{ fontFamily: 'monospace', fontWeight: 'bold' }}
                placeholder="TYPE MESSAGE..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                maxLength={500}
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="p-2 bg-yellow-400 border-2 border-yellow-600 hover:bg-yellow-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ boxShadow: '0 4px 0 #d97706' }}
              >
                <Send className="w-4 h-4 text-black" strokeWidth={3} />
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default ChatBox;