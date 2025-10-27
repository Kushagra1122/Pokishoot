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
    <div className="bg-gray-900 border-4 border-yellow-400 px-6 py-4" style={{ fontFamily: 'monospace', boxShadow: '0 8px 0 #92400e' }}>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center" style={{
          clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
          boxShadow: '0 4px 0 #d97706'
        }}>
          <Clock className="w-6 h-6 text-black" strokeWidth={3} />
        </div>
        <div>
          <div className="text-xs text-yellow-400 font-black uppercase">TIME LEFT</div>
          <div className={`text-3xl font-black tracking-wider ${getTimeColor()}`} style={{ fontFamily: 'monospace' }}>
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timer;