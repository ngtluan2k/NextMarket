import { useEffect, useState, useRef } from 'react';
import { useChat } from '../hooks/useChat';
import { SenderType, MessageType } from '../types/chat.types';
import { storeService } from '../../service/store.service';
import { BE_BASE_URL } from '../api/api';
import { FileImageOutlined, SendOutlined } from '@ant-design/icons';

interface ChatPageForStoreProps {
  isModal?: boolean;
}

export const ChatPageForStore = ({ isModal }: ChatPageForStoreProps) => {
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
  const [storeId, setStoreId] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const selectedConversation = conversations.find(
    (c) => c.id === selectedConvId
  );
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  useEffect(() => {
    if (conversations.length > 0 && selectedConvId === null) {
      setSelectedConvId(conversations[0].id);
    }
  }, [conversations, selectedConvId]);

  useEffect(() => {
    (async () => {
      const store = await storeService.getMyStore();
      if (store?.id) setStoreId(Number(store.id));
    })();
  }, []);

  useEffect(() => {
    if (!storeId) return;
    initSocket();
    fetchConversations('store', storeId);
  }, [initSocket, fetchConversations, storeId]);

  useEffect(() => {
    if (selectedConvId) {
      fetchMessages(selectedConvId);
      markAsRead(selectedConvId, SenderType.STORE); // 👈 THÊM DÒNG NÀY
    }
  }, [selectedConvId, fetchMessages, markAsRead]);

  useEffect(() => {
    // tự scroll xuống dưới mỗi khi có message mới
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!selectedConvId) return;

    if (!input.trim() && !selectedFiles) return;

    sendMessage(
      selectedConvId,
      SenderType.STORE,
      selectedFiles.length === 0
        ? MessageType.TEXT
        : selectedFiles[0].type.startsWith('video')
        ? MessageType.VIDEO
        : MessageType.IMAGE,
      input.trim() || undefined,
      selectedFiles.length > 0 ? selectedFiles : undefined
    );

    // reset input và files
    setInput('');
    setSelectedFiles([]);

    // ❌ KHÔNG ĐƯỢC return JSX ở đây
    // return (<div>...</div>)   <-- đây là nguyên nhân TS báo lỗi
  };

  const lastStoreMessageId = [...messages]
    .reverse()
    .find((m) => m.sender_type === SenderType.STORE)?.id;

  return (
    <div
      style={{
        display: 'flex',
        height: isModal ? '400px' : '75vh', // ngắn hơn
        width: isModal ? '100%' : '95vw',
        maxWidth: isModal ? '1000px' : '100%', // rộng hơn
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#f5f5f5',
        boxShadow: '2px 0 5px rgba(0,0,0,0.05)',
        overflowY: 'auto',
      }}
    >
      {/* Sidebar: danh sách conversation */}
      <div
        style={{
          width: '280px',
          borderRight: '1px solid #ddd',
          backgroundColor: '#fff',
          padding: '15px',
          boxShadow: '2px 0 5px rgba(0,0,0,0.05)',
          overflowY: 'auto',
        }}
      >
        <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>EveryChat</h3>
        {conversations.map((c) => (
          <div
            key={c.id}
            style={{
              padding: '10px',
              cursor: 'pointer',
              borderRadius: '8px',
              marginBottom: '8px',
              backgroundColor: c.id === selectedConvId ? '#e6f7ff' : '#fafafa',
              transition: '0.2s',
              display: 'flex',
              alignItems: 'center',
            }}
            onClick={() => {
              console.log('Selected conversation:', c); // log conversation được click
              setSelectedConvId(c.id);
            }}
          >
            {/* Avatar */}
            <div
              style={{
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
                fontSize: '14px',
                overflow: 'hidden',
              }}
            >
              {c.user?.profile?.avatar_url ? (
                <img
                  src={`${BE_BASE_URL}${c.user.profile.avatar_url}`}
                  alt={c.user?.profile?.full_name || c.user?.username}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                c.user?.profile?.full_name?.[0]?.toUpperCase() || 'U'
              )}
            </div>

            <div>
              <div style={{ fontWeight: 500 }}>
                {c.user?.profile?.full_name
                  ? `${c.user.profile.full_name} (${c.user.username})`
                  : c.user.username}
              </div>
              {c.order && (
                <div style={{ fontSize: '12px', color: '#888' }}>
                  Order #{c.order.id}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Chat window */}
      {/* Chat window */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '15px',
        }}
      >
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '15px',
            backgroundColor: '#f0f0f0',
            borderRadius: '12px',
            marginBottom: '10px',
          }}
        >
          {messages.map((m) => {
            const isStore = m.sender_type === SenderType.STORE;
            return (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  justifyContent: isStore ? 'flex-end' : 'flex-start',
                  marginBottom: '10px',
                }}
              >
                {/* Avatar nếu là user */}
                {!isStore && selectedConversation && (
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      overflow: 'hidden',
                      marginRight: 8,
                      flexShrink: 0,
                    }}
                  >
                    {selectedConversation.user.profile.avatar_url ? (
                      <img
                        src={`${BE_BASE_URL}${selectedConversation.user.profile.avatar_url}`}
                        alt="avatar"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          backgroundColor: '#bbb',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: 'bold',
                        }}
                      >
                        {selectedConversation.user.profile.full_name?.[0]?.toUpperCase() ||
                          'U'}
                      </div>
                    )}
                  </div>
                )}

                {/* Container column: bubble + status */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    maxWidth: '75%',
                  }}
                >
                  {/* Bubble */}
                  <div
                    style={{
                      maxWidth: '100%',
                      backgroundColor: isStore ? '#1890ff' : '#fff',
                      color: isStore ? '#fff' : '#333',
                      padding: '10px 15px',
                      borderRadius: '20px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      wordBreak: 'break-word',
                    }}
                  >
                    {m.content && <p style={{ margin: 0 }}>{m.content}</p>}
                    {m.media_url &&
                      (m.message_type === MessageType.IMAGE ? (
                        <img
                          src={`${BE_BASE_URL}${m.media_url}`}
                          alt="chat-img"
                          style={{
                            width: '100%',
                            maxWidth: '250px',
                            borderRadius: '12px',
                            marginTop: 5,
                            display: 'block',
                          }}
                        />
                      ) : m.message_type === MessageType.VIDEO ? (
                        <video
                          src={`${BE_BASE_URL}${m.media_url}`}
                          controls
                          style={{
                            width: '100%',
                            maxWidth: '250px',
                            borderRadius: '12px',
                            marginTop: 5,
                            display: 'block',
                          }}
                        />
                      ) : null)}
                  </div>

                  {/* Status */}
                  {isStore && m.id === lastStoreMessageId && (
                    <div
                      style={{
                        fontSize: 11,
                        marginTop: 4,
                        textAlign: 'right',
                        alignSelf: 'flex-end',
                      }}
                    >
                      {!m.is_read ? (
                        <span style={{ color: '#888' }}>Đã gửi</span>
                      ) : (
                        <img
                          src={
                            selectedConversation?.user?.profile?.avatar_url
                              ? `${BE_BASE_URL}${selectedConversation.user.profile.avatar_url}`
                              : undefined
                          }
                          alt={
                            selectedConversation?.user?.profile?.full_name
                              ? `${selectedConversation.user.profile.full_name}'s avatar`
                              : 'User avatar'
                          }
                          style={{
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            objectFit: 'cover',
                          }}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <div ref={chatEndRef} />
        </div>

        {/* Preview files */}
        {selectedFiles.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: '10px',
              marginBottom: '10px',
              flexWrap: 'wrap',
            }}
          >
            {selectedFiles.map((file, index) => {
              const url = URL.createObjectURL(file); // tạo URL tạm để preview
              const isVideo = file.type.startsWith('video');

              return (
                <div key={index} style={{ position: 'relative' }}>
                  {isVideo ? (
                    <video
                      src={url}
                      controls
                      style={{
                        width: 100,
                        height: 100,
                        borderRadius: 8,
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <img
                      src={url}
                      alt="preview"
                      style={{
                        width: 100,
                        height: 100,
                        borderRadius: 8,
                        objectFit: 'cover',
                      }}
                    />
                  )}

                  {/* nút xóa file */}
                  <button
                    onClick={() => {
                      setSelectedFiles((prev) =>
                        prev.filter((_, i) => i !== index)
                      );
                    }}
                    style={{
                      position: 'absolute',
                      top: -5,
                      right: -5,
                      background: 'red',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: 20,
                      height: 20,
                      cursor: 'pointer',
                    }}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Input box */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 0',
          }}
        >
          {/* Upload icon */}
          <label
            htmlFor="file-upload"
            style={{
              width: '35px',
              height: '35px',
              borderRadius: '50%',
              backgroundColor: '#eee',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '18px',
            }}
            title="Upload image/video"
          >
            <FileImageOutlined />
          </label>
          <input
            id="file-upload"
            type="file"
            multiple
            accept="image/*,video/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const files = e.target.files;
              if (!files) return; // nếu null thì thoát
              setSelectedFiles((prev) => [...prev, ...Array.from(files)]);
            }}
          />

          {/* Text input */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            style={{
              flex: 1,
              padding: '10px 15px',
              borderRadius: '20px',
              border: '1px solid #ccc',
              outline: 'none',
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
          />

          {/* Send icon */}
          <button
            onClick={handleSend}
            style={{
              width: '35px',
              height: '35px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: '#1890ff',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '16px',
            }}
            title="Send"
          >
            <SendOutlined />
          </button>
        </div>
      </div>
    </div>
  );
};
