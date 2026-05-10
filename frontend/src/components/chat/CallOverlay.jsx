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
    localStream,
    isMuted,
    isCameraOff,
    toggleMic,
    toggleCamera
  } = useCall();

  const [callTime, setCallTime] = React.useState(0);
  const remoteVideoRef = useRef();
  const localVideoRef = useRef();

  // Timer logic
  React.useEffect(() => {
    let interval;
    if (callStatus === 'active') {
      interval = setInterval(() => {
        setCallTime(prev => prev + 1);
      }, 1000);
    } else {
      setCallTime(0);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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
      {/* ─── INCOMING / CALLING VIEW ─── */}
      {(callStatus === 'calling' || callStatus === 'incoming') && (
        <div className="incoming-card">
          <div className="incoming-avatar-wrap">
            <Avatar 
              size="xl" 
              name={callStatus === 'calling' ? remoteUser?.name : incomingCall?.name} 
              src={callStatus === 'calling' ? remoteUser?.avatar : null}
            />
          </div>
          <h2 className="incoming-name">
            {callStatus === 'calling' ? remoteUser?.name : incomingCall?.name}
          </h2>
          <p className="incoming-type">
            {callStatus === 'calling' ? 'Outgoing Call' : `Incoming ${callType} Call`}
          </p>

          <div className="flex gap-8 mt-4">
            {callStatus === 'incoming' ? (
              <>
                <button className="control-action-btn accept-btn-premium" onClick={acceptCall}>
                  <Phone size={28} />
                </button>
                <button className="control-action-btn reject-btn-premium" onClick={rejectCall}>
                  <PhoneOff size={28} />
                </button>
              </>
            ) : (
              <button className="control-action-btn reject-btn-premium" onClick={endCall}>
                <PhoneOff size={28} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─── ACTIVE CALL VIEW ─── */}
      {callStatus === 'active' && (
        <div className="w-full h-full relative">
          {callType === 'video' ? (
            <div className="active-video-container">
              <video ref={remoteVideoRef} autoPlay playsInline className="main-video" />
              {!isCameraOff && <video ref={localVideoRef} autoPlay playsInline muted className="local-video-pip" />}
            </div>
          ) : (
            <div className="audio-call-wrap">
              <div className="incoming-avatar-wrap">
                <Avatar size="xl" name={remoteUser?.name || incomingCall?.name} />
              </div>
              <h2 className="incoming-name" style={{ color: '#fff' }}>{remoteUser?.name || incomingCall?.name}</h2>
              <p className="timer" style={{ marginTop: '10px' }}>{formatTime(callTime)}</p>
            </div>
          )}

          {/* Top Info Bar */}
          <div className="call-info-overlay">
            <Avatar size="sm" name={remoteUser?.name || incomingCall?.name} />
            <span style={{ fontWeight: 600 }}>{remoteUser?.name || incomingCall?.name}</span>
            <div className="timer">{formatTime(callTime)}</div>
          </div>

          {/* Floating Controls */}
          <div className="controls-bar">
            <button 
              className={`control-action-btn ${isMuted ? 'active-red' : ''}`} 
              onClick={toggleMic}
            >
              {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
            </button>
            
            {callType === 'video' && (
              <button 
                className={`control-action-btn ${isCameraOff ? 'active-red' : ''}`} 
                onClick={toggleCamera}
              >
                {isCameraOff ? <VideoOff size={22} /> : <Video size={22} />}
              </button>
            )}

            <button className="control-action-btn danger" onClick={endCall}>
              <PhoneOff size={24} />
            </button>
          </div>
        </div>
      )}
      
      {/* Fallback audio element */}
      <audio ref={remoteVideoRef} autoPlay style={{ display: 'none' }} />
    </div>
  );
};

export default CallOverlay;
