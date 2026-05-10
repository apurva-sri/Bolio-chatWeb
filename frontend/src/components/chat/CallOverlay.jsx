import React, { useEffect, useRef } from 'react';
import { useCall } from '../../context/CallContext';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import Avatar from '../ui/Avatar';

const CallOverlay = () => {
  const { 
    callStatus, 
    callType, 
    incomingCall, 
    remoteUser, 
    acceptCall, 
    rejectCall, 
    endCall, 
    remoteStream, 
    localStream 
  } = useCall();

  const remoteVideoRef = useRef();
  const localVideoRef = useRef();

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callStatus]);

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callStatus]);

  if (callStatus === 'idle') return null;

  return (
    <div className="call-overlay">
      <div className="call-card">
        {/* Calling / Incoming View */}
        {(callStatus === 'calling' || callStatus === 'incoming') && (
          <>
            <div className={`call-avatar-container ${callStatus === 'calling' ? 'pulse-animation' : ''}`}>
               <Avatar 
                size="xl" 
                name={callStatus === 'calling' ? remoteUser?.name : incomingCall?.name} 
                src={callStatus === 'calling' ? remoteUser?.avatar : null}
               />
            </div>
            <h2 className="call-name">
              {callStatus === 'calling' ? remoteUser?.name : incomingCall?.name}
            </h2>
            <p className="call-status">
              {callStatus === 'calling' ? 'Calling...' : `Incoming ${callType} call`}
            </p>

            <div className="call-actions">
              {callStatus === 'incoming' ? (
                <>
                  <button className="call-btn accept" onClick={acceptCall}>
                    <Phone size={24} />
                  </button>
                  <button className="call-btn reject" onClick={rejectCall}>
                    <PhoneOff size={24} />
                  </button>
                </>
              ) : (
                <button className="call-btn reject" onClick={endCall}>
                  <PhoneOff size={24} />
                </button>
              )}
            </div>
          </>
        )}

        {/* Active Call View */}
        {callStatus === 'active' && (
          <div className="active-call-container">
            {callType === 'video' ? (
              <div className="video-grid">
                <video ref={remoteVideoRef} autoPlay playsInline className="remote-video" />
                <video ref={localVideoRef} autoPlay playsInline muted className="local-video-pip" />
              </div>
            ) : (
              <div className="audio-call-ui">
                <Avatar size="xl" name={remoteUser?.name || incomingCall?.name} />
                <h2 className="call-name">{remoteUser?.name || incomingCall?.name}</h2>
                <p className="call-status">On call...</p>
              </div>
            )}

            <div className="call-controls-floating">
              <button className="control-btn"><Mic size={20} /></button>
              {callType === 'video' && <button className="control-btn"><Video size={20} /></button>}
              <button className="call-btn end" onClick={endCall}>
                <PhoneOff size={28} />
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Hidden audio element for audio-only calls to ensure sound output */}
      <audio ref={remoteVideoRef} autoPlay style={{ display: 'none' }} />
    </div>
  );
};

export default CallOverlay;
