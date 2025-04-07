import { useState, useEffect } from 'react';
import Message from './Message';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

const ChatWindow = () => {
  const [messages, setMessages] = useState(['Hello', 'Welcome to Discord Clone']);
  const [input, setInput] = useState('');

  useEffect(() => {
    socket.on('receiveMessage', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    return () => {
      socket.off('receiveMessage');
    };
  }, []);

  const sendMessage = () => {
    if (input.trim()) {
      socket.emit('sendMessage', input);
      setInput('');
    }
  };

  return (
    <div className="flex-1 bg-gray-800 p-4 overflow-auto">
      {messages.map((msg, i) => (
        <Message key={i} text={msg} />
      ))}
      <div className="flex mt-4">
        <input
          type="text"
          className="flex-1 p-2 bg-gray-700 rounded-l"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
        />
        <button
          className="p-2 bg-blue-500 rounded-r"
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;
