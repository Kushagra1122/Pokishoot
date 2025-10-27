import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Map } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center p-6" style={{
      backgroundImage: `linear-gradient(#0a0a0a 1px, transparent 1px),
                        linear-gradient(90deg, #0a0a0a 1px, transparent 1px)`,
      backgroundSize: '32px 32px',
      backgroundColor: '#000'
    }}>
      {/* Subtle Animated Background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-32 h-32 bg-red-500" style={{
          clipPath: 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)',
          filter: 'blur(20px)'
        }}></div>
        <div className="absolute bottom-32 right-20 w-24 h-24 bg-blue-400" style={{
          clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
          filter: 'blur(20px)'
        }}></div>
      </div>

      <div className="relative z-10 text-center max-w-2xl">
        {/* Icon */}
        <div className="w-32 h-32 bg-red-600 mx-auto mb-8 flex items-center justify-center" style={{
          clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
          boxShadow: '0 8px 0 #991b1b'
        }}>
          <Map className="w-16 h-16 text-black" strokeWidth={3} />
        </div>

        {/* Title */}
        <h1 className="text-8xl md:text-9xl font-black mb-4" style={{
          fontFamily: 'monospace',
          color: '#f87171',
          textShadow: '4px 4px 0 #dc2626, 6px 6px 0 #000'
        }}>
          404
        </h1>
        
        <h2 className="text-3xl md:text-4xl font-black text-white mb-6" style={{ fontFamily: 'monospace' }}>
          PAGE NOT FOUND
        </h2>
        
        <p className="text-red-400 text-xl mb-8 max-w-md mx-auto" style={{ fontFamily: 'monospace' }}>
          &gt; ERROR_PATH_NOT_FOUND.EXE
        </p>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="group flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-black border-4 border-amber-700 hover:scale-105 transition-all transform"
            style={{ fontFamily: 'monospace', boxShadow: '0 8px 0 #92400e' }}
          >
            <Home className="w-5 h-5" strokeWidth={3} />
            HOME →
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="group flex items-center justify-center gap-3 px-8 py-4 bg-gray-900 border-4 border-gray-700 text-white font-black hover:border-yellow-400 hover:scale-105 transition-all transform"
            style={{ fontFamily: 'monospace' }}
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={3} />
            ← BACK
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;