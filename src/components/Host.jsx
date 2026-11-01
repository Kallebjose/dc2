import React, { useState, useEffect, useRef } from 'react';
import { createPeer } from '../services/peerService';

export default function Host({ onExit }) {
  const [peerId, setPeerId] = useState('');
  const [connections, setConnections] = useState([]);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState('');
  
  const peerRef = useRef(null);
  const videoRef = useRef(null);
  const connectionsRef = useRef([]); 

  useEffect(() => {
    const peer = createPeer();
    peerRef.current = peer;

    peer.on('open', (id) => setPeerId(id));

    peer.on('call', (call) => {
      if (stream) {
        // Envia a stream com latência zero para quem ligar
        call.answer(stream);
        addConnection(call.peer);
        call.on('close', () => removeConnection(call.peer));
      } else {
        console.warn('Chamada recebida, mas a stream não está pronta.');
      }
    });

    peer.on('error', (err) => setError(err.message));

    return () => {
      peer.destroy();
      stopStream();
    };
  }, [stream]);

  const addConnection = (id) => {
    if (!connectionsRef.current.includes(id)) {
      const updated = [...connectionsRef.current, id];
      connectionsRef.current = updated;
      setConnections(updated);
    }
  };

  const removeConnection = (id) => {
    const updated = connectionsRef.current.filter(cId => cId !== id);
    connectionsRef.current = updated;
    setConnections(updated);
  };

  const startScreenShare = async () => {
    try {
      // Configuração extrema para fluidez de jogo (60fps lock, desativar processamento de áudio)
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate: { ideal: 60, max: 60 },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          displaySurface: 'monitor'
        },
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      mediaStream.getVideoTracks()[0].onended = stopStream;
    } catch (err) {
      console.error("Erro na captura de tela", err);
      setError("Permissão negada ou falha ao capturar tela.");
    }
  };

  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      if (videoRef.current) videoRef.current.srcObject = null;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white">
      <header className="flex items-center justify-between p-4 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-4">
          <button onClick={onExit} className="text-zinc-400 hover:text-white px-3 py-1 bg-zinc-800 rounded">Voltar</button>
          <h1 className="text-xl font-bold">Host Room</h1>
        </div>
        
        {peerId && (
          <div className="flex items-center gap-2 bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-700">
            <span className="text-zinc-400 text-sm">Room ID:</span>
            <span className="font-mono text-indigo-400 font-semibold">{peerId}</span>
            <button 
              onClick={() => navigator.clipboard.writeText(peerId)} 
              className="ml-2 text-xs bg-indigo-600 hover:bg-indigo-700 px-2 py-1 rounded transition-colors"
            >Copiar</button>
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 relative">
        {error && <div className="absolute top-4 bg-red-500/20 text-red-400 border border-red-500/50 px-4 py-2 rounded-md">{error}</div>}
        
        {!stream ? (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 mb-6 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 shadow-xl">
              <span className="text-3xl">💻</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">Pronto para stremar?</h2>
            <p className="text-zinc-400 mb-8 max-w-sm text-center">Inicie o compartilhamento. O tráfego vai direto de você para os viewers (Zero Delay Mesh).</p>
            <button 
              onClick={startScreenShare}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-lg shadow-indigo-600/20 transition-all"
            >
              Compartilhar Tela (60FPS)
            </button>
          </div>
        ) : (
          <div className="w-full h-full max-w-6xl flex flex-col">
            <div className="flex-1 bg-black rounded-lg overflow-hidden border border-zinc-800 relative shadow-2xl">
              {/* VIDEO TAG: Muted para evitar feedback loop. disablePictureInPicture evita buffer OS-level */}
              <video 
                ref={videoRef}
                autoPlay 
                playsInline 
                muted
                disablePictureInPicture
                className="w-full h-full object-contain"
              />
              
              <div className="absolute bottom-4 right-4 flex gap-2">
                <div className="px-3 py-1.5 bg-black/80 backdrop-blur-md rounded border border-white/10 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-xs font-medium text-zinc-200">LIVE</span>
                </div>
                <div className="px-3 py-1.5 bg-black/80 backdrop-blur-md rounded border border-white/10 flex items-center gap-2">
                  <span className="text-xs font-medium text-zinc-200">{connections.length} Viewers</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex justify-between items-center bg-zinc-900 p-4 rounded-lg border border-zinc-800">
               <div>
                 <h3 className="text-sm font-semibold text-zinc-300">Conexões P2P Ativas:</h3>
                 <p className="text-xs text-zinc-500">
                    {connections.length > 0 ? connections.map(id => id.substring(0,6)+'...').join(', ') : 'Aguardando viewers...'}
                 </p>
               </div>
               <button 
                  onClick={stopStream}
                  className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-500 border border-red-600/50 rounded-lg transition-colors text-sm font-medium"
                >
                  Encerrar Transmissão
               </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
