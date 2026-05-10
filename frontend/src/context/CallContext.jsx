import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';

const CallContext = createContext();

export const useCall = () => useContext(CallContext);

export const CallProvider = ({ children }) => {
  const { socket } = useSocket();
  const { user } = useAuth();

  const [callStatus, setCallStatus] = useState('idle'); // idle, calling, incoming, active
  const [callType, setCallType] = useState('audio');
  const [remoteUser, setRemoteUser] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);

  const localStreamRef = useRef();
  const remoteStreamRef = useRef();
  const peerConnectionRef = useRef();

  const iceConfiguration = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  };

  useEffect(() => {
    if (!socket) return;

    socket.on('incoming-call', ({ from, offer, name, callType }) => {
      setIncomingCall({ from, offer, name, callType });
      setCallStatus('incoming');
      setCallType(callType);
    });

    socket.on('call-accepted', async ({ answer }) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        setCallStatus('active');
      }
    });

    socket.on('ice-candidate', async ({ candidate }) => {
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error("Error adding ice candidate", e);
        }
      }
    });

    socket.on('call-rejected', () => {
      resetCallState();
    });

    socket.on('call-ended', () => {
      resetCallState();
    });

    return () => {
      socket.off('incoming-call');
      socket.off('call-accepted');
      socket.off('ice-candidate');
      socket.off('call-rejected');
      socket.off('call-ended');
    };
  }, [socket]);

  const resetCallState = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    setCallStatus('idle');
    setRemoteUser(null);
    setIncomingCall(null);
  };

  const initiateCall = async (targetUser, type = 'audio') => {
    setRemoteUser(targetUser);
    setCallType(type);
    setCallStatus('calling');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video'
      });
      localStreamRef.current = stream;

      const pc = new RTCPeerConnection(iceConfiguration);
      peerConnectionRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        remoteStreamRef.current = event.streams[0];
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', { to: targetUser._id, candidate: event.candidate });
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit('call-user', {
        to: targetUser._id,
        from: user._id,
        offer,
        name: user.name,
        callType: type
      });

    } catch (err) {
      console.error("Failed to initiate call", err);
      resetCallState();
    }
  };

  const acceptCall = async () => {
    if (!incomingCall) return;
    setCallStatus('active');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: incomingCall.callType === 'video'
      });
      localStreamRef.current = stream;

      const pc = new RTCPeerConnection(iceConfiguration);
      peerConnectionRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        remoteStreamRef.current = event.streams[0];
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', { to: incomingCall.from, candidate: event.candidate });
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('answer-call', { to: incomingCall.from, answer });

    } catch (err) {
      console.error("Failed to accept call", err);
      resetCallState();
    }
  };

  const rejectCall = () => {
    if (incomingCall) {
      socket.emit('reject-call', { to: incomingCall.from });
    }
    resetCallState();
  };

  const endCall = () => {
    const targetId = remoteUser?._id || incomingCall?.from;
    if (targetId) {
      socket.emit('end-call', { to: targetId });
    }
    resetCallState();
  };

  return (
    <CallContext.Provider value={{
      callStatus,
      callType,
      remoteUser,
      incomingCall,
      localStream: localStreamRef.current,
      remoteStream: remoteStreamRef.current,
      initiateCall,
      acceptCall,
      rejectCall,
      endCall
    }}>
      {children}
    </CallContext.Provider>
  );
};
