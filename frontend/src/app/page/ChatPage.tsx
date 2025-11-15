import { useEffect, useState, useRef } from 'react';
import { useChat } from '../hooks/useChat';
import { SenderType, MessageType } from '../types/chat.types';
import { BE_BASE_URL } from '../api/api';

export const ChatPage = () => {
  const {
    conversations,
    messages,
    fetchConversations,
    fetchMessages,
    sendMessage,
    initSocket,
    markAsRead,
  } = useChat();

  const [selectedConvId, setSelectedConvId] = useState<number | null>(null);
  const [input, setInput] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const selectedConversation = conversations.find(c => c.id === selectedConvId);

  // init socket & fetch conversations
  useEffect(() => {
    initSocket();
    fetchConversations();
  }, [initSocket, fetchConversations]);

  // fetch messages khi đổi conversation
  useEffect(() => {
  if (selectedConvId) {
    fetchMessages(selectedConvId);
    markAsRead(selectedConvId, SenderType.USER);  // 👈 THÊM DÒNG NÀY
  }
}, [selectedConvId, fetchMessages, markAsRead]);

  // scroll xuống dưới khi có message mới
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!selectedConvId) return;
    if (!input.trim() && selectedFiles.length === 0) return;

    sendMessage(
      selectedConvId,
      SenderType.USER,
      selectedFiles.length === 0
        ? MessageType.TEXT
        : selectedFiles[0].type.startsWith('video')
        ? MessageType.VIDEO
        : MessageType.IMAGE,
      input.trim() || undefined,
      selectedFiles.length > 0 ? selectedFiles : undefined
    );

    setInput('');
    setSelectedFiles([]);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Arial, sans-serif' }}>
      {/* Sidebar */}
      <div style={{
        width: '280px',
        borderRight: '1px solid #ddd',
        backgroundColor: '#fff',
        padding: '15px',
        boxShadow: '2px 0 5px rgba(0,0,0,0.05)',
        overflowY: 'auto',
      }}>
        <h3 style={{ marginBottom: '15px' }}>Conversations</h3>
        {conversations.map(c => (
          <div
            key={c.id}
            style={{
              padding: '10px',
              cursor: 'pointer',
              borderRadius: '8px',
              marginBottom: '8px',
              backgroundColor: c.id === selectedConvId ? '#e6f7ff' : '#fafafa',
              display: 'flex',
              alignItems: 'center',
              transition: '0.2s'
            }}
            onClick={() => setSelectedConvId(c.id)}
          >
            {/* Avatar */}
            <div style={{
              width: '35px',
              height: '35px',
              borderRadius: '50%',
              backgroundColor: '#bbb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 'bold',
              marginRight: '10px',
              overflow: 'hidden'
            }}>
              {c.store?.logo_url ? (
                <img
                  src={`${BE_BASE_URL}${c.store.logo_url}`}
                  alt={c.store.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                c.store?.name?.[0]?.toUpperCase() || 'S'
              )}
            </div>

            <div>
              <div style={{ fontWeight: 500 }}>
                {c.store.name} {c.order ? `(Order #${c.order.id})` : ''}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chat window */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '15px' }}>
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '15px',
          backgroundColor: '#f0f0f0',
          borderRadius: '12px',
          marginBottom: '10px'
        }}>
          {messages.map(m => (
            <div
              key={m.id}
              style={{
                display: 'flex',
                justifyContent: m.sender_type === SenderType.USER ? 'flex-end' : 'flex-start',
                marginBottom: '10px'
              }}
            >
              {/* Bubble */}
              <div style={{
                maxWidth: '70%',
                backgroundColor: m.sender_type === SenderType.USER ? '#a0e0ff' : '#fff',
                color: '#333',
                padding: '10px 15px',
                borderRadius: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                {m.content && <p>{m.content}</p>}
                {m.media_url && m.message_type === MessageType.IMAGE && (
                  <img
                    src={`${BE_BASE_URL}${m.media_url}`}
                    alt="chat-img"
                    style={{ maxWidth: '200px', borderRadius: '12px', marginTop: '5px' }}
                  />
                )}
                {m.media_url && m.message_type === MessageType.VIDEO && (
                  <video
                    src={`${BE_BASE_URL}${m.media_url}`}
                    controls
                    style={{ maxWidth: '200px', borderRadius: '12px', marginTop: '5px' }}
                  />
                )}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input box */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            style={{ flex: 1, padding: '10px 15px', borderRadius: '20px', border: '1px solid #ccc' }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
          />
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={(e) => { if (e.target.files) setSelectedFiles(Array.from(e.target.files)); }}
          />
          <button
            onClick={handleSend}
            style={{ padding: '0 20px', borderRadius: '20px', border: 'none', backgroundColor: '#1890ff', color: '#fff', cursor: 'pointer' }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};
