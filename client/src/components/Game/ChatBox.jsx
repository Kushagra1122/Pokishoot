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
    <div className={`bg-white/5 backdrop-blur-sm border border-white/20 rounded-2xl flex flex-col shadow-2xl transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-80'
    }`}>
      
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors duration-300 rounded-t-2xl"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-amber-400" />
            <h2 className="font-bold text-white text-lg">Game Chat</h2>
          </div>
        )}
        <div className={`w-8 h-8 bg-amber-400/20 border border-amber-400/30 rounded-lg flex items-center justify-center transition-transform duration-300 ${
          isCollapsed ? 'rotate-180' : ''
        }`}>
          <span className="text-amber-400 text-sm">▲</span>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-3 p-4 max-h-80 scrollbar-thin scrollbar-thumb-amber-400/30 scrollbar-track-transparent">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No messages yet</p>
                <p className="text-gray-500 text-xs mt-1">Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`rounded-xl p-3 transition-all duration-300 ${
                    msg.type === 'system'
                      ? 'bg-purple-500/20 border border-purple-500/30'
                      : msg.self
                      ? 'bg-emerald-500/20 border border-emerald-500/30 ml-4'
                      : 'bg-blue-500/20 border border-blue-500/30 mr-4'
                  }`}
                >
                  {msg.type !== 'system' && (
                    <div className={`flex items-center justify-between mb-2 ${msg.self ? 'flex-row-reverse' : ''}`}>
                      <span className={`text-xs font-semibold ${
                        msg.self ? 'text-emerald-400' : 'text-blue-400'
                      }`}>
                        {msg.self ? 'You' : msg.playerName}
                      </span>
                      <span className="text-gray-400 text-xs">{formatMessageTime(msg.timestamp)}</span>
                    </div>
                  )}
                  <div className={`text-sm ${
                    msg.type === 'system' 
                      ? 'text-purple-300 italic text-center' 
                      : msg.self 
                      ? 'text-emerald-300' 
                      : 'text-blue-300'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="p-4 border-t border-white/10">
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 px-3 py-2 text-sm text-white bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent placeholder-gray-400 transition-all duration-300"
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                maxLength={500}
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="p-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 rounded-xl hover:scale-110 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default ChatBox;