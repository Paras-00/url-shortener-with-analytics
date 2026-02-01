import React, { useEffect, useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import './VideoPlayer.css';

export default function VideoPlayer({ socket, roomId, videoUrl }) {
    const playerRef = useRef(null);
    const [playing, setPlaying] = useState(false);
    const [error, setError] = useState(null);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        if (!socket) return;

        const handleUpdate = (data) => {
            const { state, timestamp } = data;
            console.log(`[VideoPlayer] Received update: ${state} at ${timestamp}`);

            setIsSyncing(true);

            // Sync timestamp if drift is significant (> 1.5s)
            const currentTime = playerRef.current?.getCurrentTime() || 0;
            if (Math.abs(currentTime - timestamp) > 1.5) {
                playerRef.current?.seekTo(timestamp, 'seconds');
            }

            if (state === 'playing') {
                setPlaying(true);
            } else if (state === 'paused') {
                setPlaying(false);
            }

            // Small delay to prevent feedback loops
            setTimeout(() => setIsSyncing(false), 1000);
        };

        socket.on('video-state-update', handleUpdate);

        // Request initial state from room
        socket.emit('request-room-state', { roomId });

        socket.on('room-state-response', (data) => {
            if (data && data.timestamp) {
                handleUpdate(data);
            }
        });

        return () => {
            socket.off('video-state-update');
            socket.off('room-state-response');
        };
    }, [socket, roomId]);

    const emitState = (state) => {
        if (socket && !isSyncing && playerRef.current) {
            const currentTime = playerRef.current.getCurrentTime();
            console.log(`[VideoPlayer] Emitting: ${state} at ${currentTime}`);
            socket.emit('video-state-change', {
                roomId,
                state,
                timestamp: currentTime,
            });
        }
    };

    const handlePlay = () => {
        if (!isSyncing) {
            setPlaying(true);
            emitState('playing');
        }
    };

    const handlePause = () => {
        if (!isSyncing) {
            setPlaying(false);
            emitState('paused');
        }
    };

    const handleSeek = (seconds) => {
        if (!isSyncing) {
            emitState(playing ? 'playing' : 'paused');
        }
    };

    const handleError = (e) => {
        setError('Failed to load video. Ensure the URL is valid.');
        console.error('ReactPlayer Error:', e);
    };

    useEffect(() => {
        setError(null);
    }, [videoUrl]);

    return (
        <div className="video-player-wrapper">
            {videoUrl && (
                <>
                    <div className="player-container">
                        <ReactPlayer
                            ref={playerRef}
                            url={videoUrl}
                            playing={playing}
                            controls={true}
                            width="100%"
                            height="100%"
                            onPlay={handlePlay}
                            onPause={handlePause}
                            onSeek={handleSeek}
                            onError={handleError}
                            config={{
                                youtube: {
                                    playerVars: { showinfo: 1 }
                                }
                            }}
                        />
                    </div>
                    {error && (
                        <div className="video-error-overlay">
                            <p>{error}</p>
                        </div>
                    )}
                    {isSyncing && (
                        <div className="sync-overlay">
                            <span>Syncing...</span>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
