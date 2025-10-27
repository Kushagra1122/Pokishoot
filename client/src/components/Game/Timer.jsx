// Timer.jsx (Enhanced)
import React from 'react';
import { Clock } from 'lucide-react';

const Timer = ({ timeLeft }) => {
  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return "--:--";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' + s : s}`;
  };

  const getTimeColor = () => {
    if (timeLeft === null) return 'text-gray-400';
    if (timeLeft <= 30) return 'text-rose-400 animate-pulse';
    if (timeLeft <= 60) return 'text-amber-400';
    return 'text-emerald-400';
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-2xl px-6 py-4 shadow-2xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg">
          <Clock className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="text-sm text-gray-400 font-semibold">TIME REMAINING</div>
          <div className={`text-2xl font-bold font-mono tracking-wider ${getTimeColor()}`}>
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timer;