import React, { useRef, useEffect } from "react";

const PlayersList = ({ lobby, isOwner, currentUserId }) => {
  const listRef = useRef();

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [lobby.players]);

  return (
    <div className="bg-yellow-400/10 border border-yellow-400 rounded-xl p-4 max-h-64 overflow-y-auto" ref={listRef}>
      <h2 className="text-yellow-200 font-bold mb-3">
        Players ({lobby.players?.length || 0}) {isOwner && "👑"}
      </h2>
      <ul className="space-y-2">
        {lobby.players?.map((p) => (
          <li
            key={p.id}
            className={`flex items-center gap-2 px-2 py-1 rounded ${
              p.id === currentUserId ? "bg-yellow-400/30" : ""
            } text-yellow-50`}
          >
            <span className="w-2 h-2 bg-green-400 rounded-full" />
            {p.name} {p.id === lobby.ownerId && "👑"}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PlayersList;
