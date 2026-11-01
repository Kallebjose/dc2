import React, { useState } from 'react';
import Host from './components/Host';
import Viewer from './components/Viewer';

function App() {
  const [role, setRole] = useState(null);

  if (role === 'host') return <Host onExit={() => setRole(null)} />;
  if (role === 'viewer') return <Viewer onExit={() => setRole(null)} />;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-zinc-200">
      <div className="max-w-md w-full p-8 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl">
        <h1 className="text-3xl font-bold text-center mb-2 text-white tracking-tight">ZeroDelay Stream</h1>
        <p className="text-zinc-400 text-sm text-center mb-8">WebRTC P2P Ultra-Low Latency</p>
        
        <div className="flex flex-col gap-4">
          <button 
            onClick={() => setRole('host')}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            Transmitir Tela (Host)
          </button>
          
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-zinc-800"></div>
            <span className="flex-shrink-0 mx-4 text-zinc-500 text-sm">ou</span>
            <div className="flex-grow border-t border-zinc-800"></div>
          </div>

          <button 
            onClick={() => setRole('viewer')}
            className="w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-medium rounded-lg transition-colors focus:ring-2 focus:ring-zinc-500 focus:outline-none"
          >
            Assistir Transmissão (Viewer)
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
