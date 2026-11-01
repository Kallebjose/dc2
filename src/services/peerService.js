import { Peer } from 'peerjs';

export const peerConfig = {
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' }
    ]
  },
  debug: 2 // Aumentei o debug para vermos erros no console (F12) se houver
};

export const createPeer = (id = null) => {
  return id ? new Peer(id, peerConfig) : new Peer(peerConfig);
};