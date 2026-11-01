import React, { useState, useEffect, useRef } from 'react';
import { createPeer } from '../services/peerService';

export default function Viewer({ onExit }) {
  const [roomId, setRoomId] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  
  const peerRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    return () => {
      if (peerRef.current) peerRef.current.destroy();
    };
  }, []);

  const joinRoom = (e) => {
    e.preventDefault();
    if (!roomId.trim()) return;

    setStatus('connecting');
    setError('');

    const peer = createPeer();
    peerRef.current = peer;

    peer.on('open', () => {
      // Liga para o host sem enviar mídia (viewer only)
      const call = peer.call(roomId.trim(), null);
      
      call.on('stream', (remoteStream) => {
        setStatus('connected');
        if (videoRef.current) {
          videoRef.current.srcObject = remoteStream;
          videoRef.current.play().catch(err => {
             console.warn("Autoplay bloqueado pelo navegador", err);
          });
        }
      });

      call.on('close', () => {
        setStatus('idle');
        setError('O Host encerrou a transmissão.');
        if (videoRef.current) videoRef.current.srcObject = null;
      });

      call.on('error', (err) => {
        setStatus('error');
        setError(err.message);
      });
    });

    peer.on('error', (err) => {
      console.error(err);
      setStatus('error');
      setError(err.message === 'peer-unavailable' ? 'Sala não encontrada. Verifique o ID.' : err.message);
    });
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white">
      <header className="flex items-center justify-between p-4 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-4">
          <button onClick={onExit} className="text-zinc-400 hover:text-white px-3 py-1 bg-zinc-800 rounded">Voltar</button>
          <h1 className="text-xl font-bold">Viewer</h1>
        </div>
        
        {status === 'connected' && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-green-900/50 bg-green-900/20 text-green-400 text-sm">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            Conectado P2P
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 relative">
        {status !== 'connected' ? (
          <div className="w-full max-w-md p-8 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl">
            <h2 className="text-2xl font-bold text-center mb-6">Entrar na Sala</h2>
            
            {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded">{error}</div>}
            
            <form onSubmit={joinRoom} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Room ID</label>
                <input 
                  type="text" 
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="Cole o ID do Host aqui..."
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder-zinc-600 outline-none transition-all font-mono"
                  required
                />
              </div>
              <button 
                type="submit"
                disabled={status === 'connecting'}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
              >
                {status === 'connecting' ? 'Conectando (Negociando ICE)...' : 'Assistir Stream'}
              </button>
            </form>
          </div>
        ) : (
          <div className="w-full h-full max-w-6xl bg-black rounded-lg overflow-hidden border border-zinc-800 shadow-2xl relative">
            {/* ZERO DELAY Config 
                autoPlay e playsInline garantem render imediato.
                Não usar controles nativos complexos previne delay de UI.
            */}
            <video 
              ref={videoRef}
              autoPlay 
              playsInline
              controls
              className="w-full h-full object-contain bg-black"
            />
          </div>
        )}
      </main>
    </div>
  );
}
