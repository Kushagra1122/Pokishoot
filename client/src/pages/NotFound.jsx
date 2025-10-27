// NotFound.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Map } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-blue-900 relative overflow-hidden flex items-center justify-center p-6">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-32 h-32 bg-amber-400 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-32 right-20 w-24 h-24 bg-blue-400 rounded-full blur-2xl animate-pulse delay-75"></div>
        <div className="absolute top-1/2 left-1/3 w-20 h-20 bg-rose-400 rounded-full blur-2xl animate-pulse delay-150"></div>
      </div>

      <div className="relative z-10 text-center max-w-2xl">
        {/* Icon */}
        <div className="w-32 h-32 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl mx-auto mb-8 flex items-center justify-center shadow-2xl">
          <Map className="w-16 h-16 text-white" />
        </div>

        {/* Title */}
        <h1 className="text-6xl md:text-8xl font-black text-white mb-4">
          <span className="bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent">404</span>
        </h1>
        
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
          Page Not Found
        </h2>
        
        <p className="text-gray-300 text-lg mb-8 max-w-md mx-auto leading-relaxed">
          The path you're looking for seems to have wandered off into the tall grass. 
          Let's get you back to safety!
        </p>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="group flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 font-bold rounded-2xl hover:scale-105 transform transition-all duration-300 shadow-2xl"
          >
            <Home className="w-5 h-5" />
            Return to Base
            <div className="absolute inset-0 rounded-2xl border-2 border-white/20 group-hover:border-white/40 transition-colors duration-300"></div>
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="group flex items-center justify-center gap-3 px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-bold rounded-2xl hover:bg-white/20 hover:scale-105 transform transition-all duration-300 shadow-2xl"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Safety
            <div className="absolute inset-0 rounded-2xl border-2 border-white/20 group-hover:border-white/40 transition-colors duration-300"></div>
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-12 p-6 bg-white/5 backdrop-blur-sm border border-white/20 rounded-2xl max-w-md mx-auto">
          <p className="text-gray-400 text-sm">
            If you believe this is an error, please check the URL or contact support.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;