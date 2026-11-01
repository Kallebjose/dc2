import { Peer } from 'peerjs';

// Configuração WebRTC forçando STUN público do Google para NAT Traversal
export const peerConfig = {
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ],
    // Force aggressive ICE generation
    iceTransportPolicy: 'all',
  },
  debug: 1
};

export const createPeer = (id = null) => {
  if (id) return new Peer(id, peerConfig);
  return new Peer(peerConfig);
};
