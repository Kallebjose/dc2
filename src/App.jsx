import React, { useState, useEffect, useRef } from 'react';
import { createPeer } from './services/peerService';

function App() {
  const [myId, setMyId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [peers, setPeers] = useState([]); 
  const [streams, setStreams] = useState({});
  const [activeStreamId, setActiveStreamId] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState('');

  const peerRef = useRef(null);
  const videoRef = useRef(null);
  const myStreamRef = useRef(null);
  const peersRef = useRef([]);

  const addPeer = (id) => {
    if (!peersRef.current.includes(id)) {
      peersRef.current = [...peersRef.current, id];
      setPeers([...peersRef.current]);
    }
  };

  useEffect(() => {
    const peer = createPeer();
    peerRef.current = peer;

    peer.on('open', (id) => setMyId(id));

    peer.on('connection', (conn) => {
      conn.on('open', () => {
        addPeer(conn.peer);
        if (myStreamRef.current) {
          peer.call(conn.peer, myStreamRef.current);
        }
      });
    });

    peer.on('call', (call) => {
      call.answer();
      call.on('stream', (remoteStream) => {
        setStreams(prev => ({ ...prev, [call.peer]: remoteStream }));
        setActiveStreamId(call.peer);
      });
    });

    peer.on('error', (err) => setError(err.message));

    return () => peer.destroy();
  }, []);

  useEffect(() => {
    if (videoRef.current && activeStreamId && streams[activeStreamId]) {
      videoRef.current.srcObject = streams[activeStreamId];
      videoRef.current.play().catch(e => console.warn("Autoplay bloqueado", e));
    }
  }, [activeStreamId, streams]);

  const connectToRoom = (e) => {
    e.preventDefault();
    if (!targetId.trim()) return;
    
    setError('');
    const conn = peerRef.current.connect(targetId.trim());
    
    conn.on('open', () => {
      addPeer(targetId.trim());
      if (myStreamRef.current) {
        peerRef.current.call(targetId.trim(), myStreamRef.current);
      }
      setTargetId('');
    });

    conn.on('error', () => setError('Falha ao conectar na sala.'));
  };

  const startStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 60, max: 60 }, displaySurface: 'monitor' },
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
      });
      
      myStreamRef.current = stream;
      setIsStreaming(true);

      peersRef.current.forEach(peerId => {
        peerRef.current.call(peerId, stream);
      });

      stream.getVideoTracks()[0].onended = stopStream;
    } catch (err) {
      setError("Permissão de tela negada.");
    }
  };

  const stopStream = () => {
    if (myStreamRef.current) {
      myStreamRef.current.getTracks().forEach(track => track.stop());
      myStreamRef.current = null;
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden">
      
      <div className="w-80 bg-zinc-900 border-r border-zinc-800 flex flex-col p-4 z-10 shadow-xl">
        <h1 className="text-xl font-bold text-indigo-400 mb-6">ZeroDelay Mesh</h1>
        
        {error && <div className="p-2 mb-4 text-sm bg-red-900/30 text-red-400 border border-red-900 rounded">{error}</div>}

        <div className="mb-6 bg-zinc-800 p-3 rounded-lg border border-zinc-700">
          <p className="text-xs text-zinc-400 mb-1">Seu ID (Copie e mande):</p>
          <div className="flex gap-2">
            <input readOnly value={myId || 'Gerando...'} className="w-full bg-zinc-950 text-xs font-mono p-2 rounded text-zinc-300 outline-none" />
            <button onClick={() => navigator.clipboard.writeText(myId)} className="bg-indigo-600 hover:bg-indigo-700 px-3 rounded text-sm transition">Copiar</button>
          </div>
        </div>

        <form onSubmit={connectToRoom} className="mb-8">
          <p className="text-xs text-zinc-400 mb-1">Conectar a um Amigo:</p>
          <input 
            value={targetId} onChange={e => setTargetId(e.target.value)}
            placeholder="Cole o ID aqui..."
            className="w-full bg-zinc-950 border border-zinc-700 p-2 rounded text-sm outline-none focus:border-indigo-500 mb-2"
          />
          <button type="submit" className="w-full bg-zinc-700 hover:bg-zinc-600 py-2 rounded text-sm transition">Entrar na Sala</button>
        </form>

        <div className="flex-1 overflow-y-auto">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Streams Disponíveis</p>
          {Object.keys(streams).length === 0 ? (
            <p className="text-sm text-zinc-600 italic">Ninguém está transmitindo...</p>
          ) : (
            <div className="flex flex-col gap-2">
              {Object.keys(streams).map(peerId => (
                <button 
                  key={peerId}
                  onClick={() => setActiveStreamId(peerId)}
                  className={`text-left p-2 rounded text-sm font-mono truncate transition border ${activeStreamId === peerId ? 'bg-indigo-900/30 border-indigo-500 text-indigo-300' : 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700'}`}
                >
                  📺 {peerId.substring(0,8)}...
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-zinc-800">
          <p className="text-xs text-zinc-500 mb-2">{peers.length} conectados na sessão</p>
          {!isStreaming ? (
            <button onClick={startStream} className="w-full bg-indigo-600 hover:bg-indigo-700 py-3 rounded-lg font-bold shadow-lg shadow-indigo-900/20 transition">Compartilhar Tela</button>
          ) : (
            <button onClick={stopStream} className="w-full bg-red-600 hover:bg-red-700 py-3 rounded-lg font-bold transition">Parar Transmissão</button>
          )}
        </div>
      </div>

      <div className="flex-1 bg-black relative flex items-center justify-center p-4">
        {!activeStreamId ? (
          <div className="text-center text-zinc-600 flex flex-col items-center">
            <span className="text-5xl mb-4">🎮</span>
            <p className="text-lg font-medium">Nenhuma transmissão selecionada</p>
            <p className="text-sm mt-2 max-w-md">Conecte-se a um amigo ou comece a transmitir sua tela. A troca de dados é direta (P2P), garantindo 0 delay.</p>
          </div>
        ) : (
          <div className="w-full h-full border border-zinc-800 rounded-xl overflow-hidden shadow-2xl relative bg-zinc-900">
            <video 
              ref={videoRef}
              autoPlay 
              playsInline
              controls
              disablePictureInPicture
              className="w-full h-full object-contain"
            />
            <div className="absolute top-4 left-4 px-3 py-1 bg-black/80 backdrop-blur border border-white/10 rounded text-xs font-mono text-zinc-300 flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              Assistindo: {activeStreamId.substring(0,8)}...
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

export default App;