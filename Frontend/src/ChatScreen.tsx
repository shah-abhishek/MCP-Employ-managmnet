import React, { useState } from 'react';

const MCP_API = 'http://localhost:3002/chat';

export default function ChatScreen() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch(MCP_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          conversation: newMessages.filter(m => m.role !== 'system')
        })
      });
      const data = await res.json();
      setMessages([...newMessages, { role: 'assistant', content: data.response }]);
      // TODO: Save conversation to backend (MongoDB)
    } catch (err) {
      setMessages([...newMessages, { role: 'assistant', content: 'Error connecting to MCP server.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') sendMessage();
  };

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #eee', padding: 24 }}>
      <h2 style={{ textAlign: 'center' }}>💬 Chat with MCP Server</h2>
      <div style={{ minHeight: 300, marginBottom: 16, padding: 8, background: '#f9f9f9', borderRadius: 4, overflowY: 'auto', maxHeight: 400 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ textAlign: msg.role === 'user' ? 'right' : 'left', margin: '8px 0' }}>
            <span style={{ display: 'inline-block', background: msg.role === 'user' ? '#2563eb' : '#eee', color: msg.role === 'user' ? '#fff' : '#222', borderRadius: 12, padding: '8px 16px', maxWidth: '80%' }}>
              {msg.content}
            </span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          style={{ flex: 1, padding: 10, borderRadius: 4, border: '1px solid #ddd' }}
          disabled={loading}
        />
        <button onClick={sendMessage} disabled={loading || !input.trim()} style={{ padding: '10px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 600 }}>
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
