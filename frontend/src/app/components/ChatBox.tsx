import React, { useState, useEffect, useRef } from 'react';
import { SenderType, Message, Conversation } from '../types/chat.types';
import { uploadMedia } from '../../service/chat.service';

interface ChatBoxProps {
  userId?: number;
  conversationId?: number;
  storeId?: number;
  conversations: Conversation[];
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  selectedConversationId: number | null;
  setSelectedConversationId: React.Dispatch<
    React.SetStateAction<number | null>
  >;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  sendMessage: (
    conversationId: number,
    content: string,
    mediaUrls?: string[]
  ) => void;
  markAsRead: (conversationId: number) => void;
  senderType: SenderType;
  onClose: () => void;
  onSelectConversation: (convId: number) => void;
}

export const ChatBox = ({
  userId,
  conversationId,
  storeId,
  conversations,
  selectedConversationId,
  setSelectedConversationId,
  messages,
  setMessages,
  sendMessage,
  markAsRead,
  setConversations,
  onSelectConversation,
  onClose,
  senderType,
}: ChatBoxProps) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const BE_BASE_URL =
    import.meta.env.VITE_BE_BASE_URL || 'http://localhost:3000';

  const selectedConversation =
    conversations.find((c) => c.id === selectedConversationId) || null;

  // Auto scroll + mark as read khi mở conversation
  useEffect(() => {
    if (!selectedConversation) return;

    // Scroll xuống cuối
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    // Đánh dấu tin nhắn chưa đọc
    const unreadMessages = (selectedConversation.messages || []).filter(
      (msg) => msg.sender_type !== senderType && !msg.is_read
    );

    if (unreadMessages.length === 0) return;

    markAsRead(selectedConversation.id);

    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === selectedConversation.id) {
          return {
            ...conv,
            messages: (conv.messages || []).map((msg) =>
              msg.sender_type !== senderType && !msg.is_read
                ? { ...msg, is_read: true }
                : msg
            ),
            unreadCount: 0,
          };
        }
        return conv;
      })
    );
  }, [selectedConversationId]);

  const handleClose = () => {
    setSelectedConversationId(null);
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const newFiles = Array.from(e.target.files).slice(0, 10);
    setSelectedFiles((prev) => [...prev, ...newFiles].slice(0, 10));

    const newUrls = newFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...newUrls].slice(0, 10));
  };

  const removePreview = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!selectedConversation) return;

    let mediaUrls: string[] = [];
    if (selectedFiles.length > 0) {
      mediaUrls = await uploadMedia(selectedFiles);
      setSelectedFiles([]);
      setPreviewUrls([]);
    }

    if (input.trim() || mediaUrls.length > 0) {
      sendMessage(selectedConversation.id, input.trim(), mediaUrls);
      setInput('');
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-[450px] h-[500px] bg-white shadow-xl rounded-xl flex z-[9999]">
      {/* Sidebar */}
      <div className="w-36 border-r bg-gray-100 rounded-l-xl overflow-y-auto p-2">
        <h4 className="font-semibold mb-2 text-sm">📨 Chats</h4>
        {conversations.map((c) => (
          <div
            key={c.id}
            onClick={() => onSelectConversation(c.id)}
            className={`p-2 rounded cursor-pointer text-sm mb-1 truncate ${
              selectedConversationId === c.id
                ? 'bg-blue-300'
                : 'hover:bg-gray-300'
            }`}
          >
            {c.store?.name ||
              c.user?.profile?.full_name ||
              `User #${c.user?.id}`}
            {(c.unreadCount || 0) > 0 && (
              <span className="ml-1 bg-red-500 text-white px-1 rounded text-xs">
                {c.unreadCount}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col rounded-r-xl">
        {/* Header */}
        <div className="flex justify-between items-center px-3 py-2 border-b">
          <h3 className="font-semibold text-sm">
            {selectedConversation
              ? selectedConversation.store?.name
                ? `Đang chat với ${selectedConversation.store.name}`
                : selectedConversation.user?.profile?.full_name
                ? `Đang chat với ${selectedConversation.user.profile.full_name}`
                : 'Đang load...'
              : 'Chọn cuộc chat'}
          </h3>
          <button onClick={handleClose} className="text-red-500 font-bold">
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {selectedConversation ? (
            (messages || []).map((m) => (
              <div
                key={m.id}
                className={`flex ${
                  m.sender_type === senderType ? 'justify-end' : 'justify-start'
                }`}
              >
                <span
                  className={`inline-block p-2 rounded-lg max-w-[70%] break-words text-sm ${
                    m.sender_type === senderType
                      ? 'bg-green-100 text-gray-800'
                      : 'bg-slate-200 text-gray-800'
                  }`}
                >
                  {m.content}
                  {m.media_url &&
                    (m.media_url.endsWith('.mp4') ||
                    m.media_url.endsWith('.webm') ||
                    m.media_url.endsWith('.ogg') ? (
                      <video
                        src={`${BE_BASE_URL}${m.media_url}`}
                        controls
                        className="mt-1 max-w-xs rounded"
                      />
                    ) : (
                      <img
                        src={`${BE_BASE_URL}${m.media_url}`}
                        alt="media"
                        className="mt-1 max-w-xs rounded"
                      />
                    ))}
                </span>

                {m.sender_type === senderType && (
                  <span className="text-xs text-gray-400 ml-1 self-end">
                    {m.is_read ? 'Đã xem' : 'Đã gửi'}
                  </span>
                )}
              </div>
            ))
          ) : (
            <div className="text-gray-400 text-sm text-center mt-8">
              👉 Chọn cuộc trò chuyện bên trái
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input + File Preview */}
        {selectedConversation && (
          <div className="flex flex-col p-2 border-t gap-2">
            {/* Previews */}
            {selectedFiles.length > 0 && (
              <div className="flex gap-2 overflow-x-auto">
                {previewUrls.map((url, idx) => {
                  const file = selectedFiles[idx];
                  const isVideo = file.type.startsWith('video');
                  return (
                    <div key={idx} className="relative">
                      {isVideo ? (
                        <video
                          src={url}
                          className="w-20 h-20 rounded object-cover"
                          controls
                        />
                      ) : (
                        <img
                          src={url}
                          className="w-20 h-20 rounded object-cover"
                          alt="preview"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => removePreview(idx)}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1 border rounded-lg px-2 py-1 text-sm"
                placeholder="Nhập tin nhắn..."
              />
              <label className="bg-gray-200 px-2 py-1 rounded cursor-pointer hover:bg-gray-300 text-sm">
                📎
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
              <button
                onClick={handleSend}
                className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 text-sm"
              >
                Gửi
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
