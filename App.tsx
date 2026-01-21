
import React, { useState, useEffect, useCallback } from 'react';
import { GameStatus } from './types.ts';
import GameCanvas from './components/GameCanvas.tsx';

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.START);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('flappy-spaceship-highscore');
    if (saved) {
      setHighScore(parseInt(saved, 10));
    }
  }, []);

  const handleGameOver = useCallback((finalScore: number) => {
    setScore(finalScore);
    setStatus(GameStatus.GAME_OVER);
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem('flappy-spaceship-highscore', finalScore.toString());
    }
  }, [highScore]);

  const startGame = () => {
    setScore(0);
    setStatus(GameStatus.PLAYING);
  };

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden flex items-center justify-center">
      <GameCanvas 
        status={status} 
        onGameOver={handleGameOver} 
        onScoreUpdate={setScore}
      />

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between py-10">
        {status === GameStatus.PLAYING && (
          <div className="text-6xl font-black text-white drop-shadow-[0_0_10px_rgba(59,130,246,0.8)] select-none italic tracking-tighter">
            {score}
          </div>
        )}

        {status === GameStatus.START && (
          <div className="flex flex-col items-center justify-center h-full pointer-events-auto bg-black/40 backdrop-blur-sm w-full transition-opacity duration-500 px-4 text-center">
            <div className="mb-2 text-blue-400 text-sm tracking-[0.3em] uppercase animate-pulse">System Online</div>
            <h1 className="text-6xl md:text-8xl font-black text-white mb-4 uppercase tracking-tighter italic leading-none">
              GALACTIC<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">DASH</span>
            </h1>
            <p className="text-blue-200/60 mb-10 text-lg font-medium max-w-xs">Avoid cosmic pillars. Tap to engage vertical thrusters.</p>
            <button 
              onClick={startGame}
              className="group relative px-16 py-5 bg-blue-600 text-white font-bold text-2xl uppercase italic tracking-widest overflow-hidden transition-all hover:bg-blue-500 active:scale-95"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
              Launch
            </button>
            <div className="mt-12 text-blue-400/40 text-xs tracking-widest uppercase">
              Sector Best: {highScore}
            </div>
          </div>
        )}

        {status === GameStatus.GAME_OVER && (
          <div className="flex flex-col items-center justify-center h-full pointer-events-auto bg-black/80 backdrop-blur-md w-full px-4 text-center animate-in fade-in zoom-in duration-300">
            <h2 className="text-5xl md:text-7xl font-black text-red-500 mb-6 italic tracking-tighter">HULL BREACHED</h2>
            <div className="grid grid-cols-2 gap-8 mb-12">
              <div className="flex flex-col items-center border-r border-white/10 pr-8">
                <span className="text-gray-500 text-xs tracking-widest uppercase mb-1">Distance</span>
                <span className="text-4xl font-bold text-white">{score}</span>
              </div>
              <div className="flex flex-col items-center pl-4">
                <span className="text-gray-500 text-xs tracking-widest uppercase mb-1">Max Record</span>
                <span className="text-4xl font-bold text-blue-400">{highScore}</span>
              </div>
            </div>
            <button 
              onClick={startGame}
              className="px-16 py-5 bg-white text-black font-bold text-2xl uppercase italic tracking-widest transition-all hover:bg-gray-200 active:scale-95"
            >
              Re-Engage
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default App;
