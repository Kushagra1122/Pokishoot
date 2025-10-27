import React, { useRef, useEffect } from "react";

const PlayersList = ({ lobby, isOwner, currentUserId }) => {
  const listRef = useRef();

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [lobby.players]);

  return (
    <div className="bg-gray-950 border-4 border-yellow-400 p-4 max-h-64 overflow-y-auto" ref={listRef} style={{ fontFamily: 'monospace' }}>
      <ul className="space-y-2">
        {lobby.players?.map((p) => (
          <li
            key={p.id}
            className={`flex items-center gap-2 px-3 py-2 border-2 font-black uppercase ${
              p.id === currentUserId ? "border-yellow-400 bg-yellow-400/20 text-yellow-400" : 
              p.id === lobby.ownerId ? "border-purple-400 bg-purple-400/10 text-purple-400" :
              "border-gray-600 bg-gray-900 text-white"
            }`}
            style={{ fontFamily: 'monospace' }}
          >
            <span className="w-3 h-3 bg-green-400" style={{ 
              clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'
            }} />
            {p.name} {p.id === lobby.ownerId && "👑"}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PlayersList;
