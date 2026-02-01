import React, { useState, useEffect, useRef } from 'react';
import './Chat.css';

export default function Chat({ socket, roomId, user }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (!socket) return;

        const handleMessage = (data) => {
            console.log('[Chat] Received message:', data);
            setMessages((prev) => [...prev, data]);
        };

        const handleUserJoined = (data) => {
            setMessages((prev) => [...prev, {
                system: true,
                message: `User ${data.userId.substring(0, 5)} joined the room`,
            }]);
        };

        socket.on('receive-message', handleMessage);
        socket.on('user-joined', handleUserJoined);

        return () => {
            socket.off('receive-message');
            socket.off('user-joined');
        };
    }, [socket]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (input.trim() && socket) {
            console.log('[Chat] Sending message:', input);
            socket.emit('send-message', {
                roomId,
                message: input.trim(),
                user,
            });
            setInput('');
        }
    };

    return (
        <div className="chat-premium glass">
            <div className="chat-header">
                <div className="chat-status">
                    <span className="online-dot"></span>
                    <h3>Live Discussion</h3>
                </div>
            </div>

            <div className="chat-body">
                {messages.length === 0 && (
                    <div className="chat-empty">
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                )}
                {messages.map((msg, idx) => (
                    msg.system ? (
                        <div key={idx} className="system-msg">
                            <span>{msg.message}</span>
                        </div>
                    ) : (
                        <div key={idx} className={`chat-bubble ${msg.user === user ? 'mine' : 'theirs'}`}>
                            <div className="bubble-content">
                                {msg.user !== user && <span className="sender">{msg.user}</span>}
                                <p className="text">{msg.message}</p>
                                <span className="time">
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    )
                ))}
                <div ref={messagesEndRef} />
            </div>

            <form className="chat-footer" onSubmit={sendMessage}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Say something..."
                    className="premium-chat-input"
                />
                <button type="submit" className="chat-send-btn" disabled={!input.trim()}>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                </button>
            </form>
        </div>
    );
}
