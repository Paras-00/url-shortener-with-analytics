import React, { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import Chat from './Chat';
import VideoPlayer from './VideoPlayer';
import './SyncRoom.css';

const SOCKET_SERVER = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function SyncRoom() {
    const [socket, setSocket] = useState(null);
    const [roomId, setRoomId] = useState('');
    const [joined, setJoined] = useState(false);
    const [user, setUser] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [roomInput, setRoomInput] = useState('');
    const [userInput, setUserInput] = useState('');
    const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'connected', 'connecting', 'disconnected'

    useEffect(() => {
        console.log('[SyncRoom] Initializing socket connection to:', SOCKET_SERVER);
        setConnectionStatus('connecting');

        const s = io(SOCKET_SERVER, {
            reconnectionAttempts: 5,
            timeout: 10000,
        });

        s.on('connect', () => {
            console.log('[SyncRoom] Socket connected:', s.id);
            setConnectionStatus('connected');
        });

        s.on('connect_error', (err) => {
            console.error('[SyncRoom] Connection error:', err);
            setConnectionStatus('disconnected');
        });

        s.on('disconnect', () => {
            console.log('[SyncRoom] Socket disconnected');
            setConnectionStatus('disconnected');
        });

        setSocket(s);

        return () => {
            console.log('[SyncRoom] Cleaning up socket');
            s.disconnect();
        };
    }, []);

    const joinRoom = useCallback((e) => {
        e.preventDefault();
        if (roomInput && userInput && socket) {
            console.log(`[SyncRoom] Joining room: ${roomInput} as ${userInput}`);
            setRoomId(roomInput);
            setUser(userInput);
            socket.emit('join-room', roomInput);
            setJoined(true);
        }
    }, [roomInput, userInput, socket]);

    const handleLeave = () => {
        setJoined(false);
        setRoomId('');
        setVideoUrl('');
    };

    if (!joined) {
        return (
            <div className="sync-container">
                <div className="sync-setup-card glass">
                    <div className="setup-header">
                        <div className="setup-icon">🌐</div>
                        <h1>SyncRoom</h1>
                        <p>Watch videos together in real-time</p>
                    </div>

                    <form onSubmit={joinRoom} className="setup-form">
                        <div className="input-group">
                            <label>Room Name</label>
                            <input
                                type="text"
                                placeholder="e.g. MovieNight"
                                value={roomInput}
                                onChange={(e) => setRoomInput(e.target.value)}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label>Your Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Alex"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="join-btn"
                            disabled={connectionStatus !== 'connected'}
                        >
                            {connectionStatus === 'connected' ? 'Join Room' : 'Connecting...'}
                        </button>
                    </form>

                    <div className="connection-badge">
                        <span className={`status-dot ${connectionStatus}`}></span>
                        {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="sync-active-container">
            <header className="room-toolbar glass">
                <div className="room-meta">
                    <div className="room-indicator">
                        <span className="live-pulse"></span>
                        <h2>{roomId}</h2>
                    </div>
                    <p className="user-tag">Playing as <strong>{user}</strong></p>
                </div>

                <div className="video-url-wrapper">
                    <div className="url-input-container">
                        <span className="url-icon">🔗</span>
                        <input
                            type="text"
                            placeholder="Paste YouTube or direct video URL (.mp4, .webm...)"
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                            className="premium-url-input"
                        />
                    </div>
                </div>

                <button onClick={handleLeave} className="leave-room-btn">
                    Leave Room
                </button>
            </header>

            <div className="room-layout">
                <div className="video-main">
                    <VideoPlayer socket={socket} roomId={roomId} videoUrl={videoUrl} />
                    {!videoUrl && (
                        <div className="video-empty-state glass">
                            <div className="empty-icon">🎬</div>
                            <h3>No Video Active</h3>
                            <p>Paste a YouTube link or a direct video link in the bar above to start syncing with your friends.</p>
                        </div>
                    )}
                </div>
                <aside className="chat-aside">
                    <Chat socket={socket} roomId={roomId} user={user} />
                </aside>
            </div>
        </div>
    );
}
