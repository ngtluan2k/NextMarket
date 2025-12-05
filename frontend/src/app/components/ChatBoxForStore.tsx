import React, {
  Dispatch,
  SetStateAction,
  useRef,
  useState,
  useEffect,
} from 'react';
import { SenderType, Conversation, Message } from '../types/chat.types';
import { uploadMedia } from '../../service/chat.service';
import {
  Send,
  Paperclip,
  X,
  MessageCircle,
  Check,
  CheckCheck,
  Smile,
} from 'lucide-react';

import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

interface StoreChatProps {
  storeId: number;
  conversations: Conversation[];
  setConversations: Dispatch<SetStateAction<Conversation[]>>;
  selectedConversationId: number | null;
  setSelectedConversationId: Dispatch<SetStateAction<number | null>>;
  markAsRead: (conversationId: number) => void;
  sendMessage: (
    conversationId: number,
    content?: string,
    mediaUrls?: string[]
  ) => void;
}

export const StoreChat = ({
  storeId,
  conversations,
  setConversations,
  selectedConversationId,
  setSelectedConversationId,
  markAsRead,
  sendMessage,
}: StoreChatProps) => {
  const BE_BASE_URL =
    import.meta.env.VITE_BE_BASE_URL || 'http://localhost:3000';

  const getAvatarUrl = (url?: string, fallbackId?: number) =>
    url ? `${BE_BASE_URL}${url}` : `https://i.pravatar.cc/40?u=${fallbackId}`;

  const [input, setInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const selectedConv =
    conversations.find((c) => c.id === selectedConversationId) || null;
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const handleSend = async () => {
    if (!selectedConv) return;

    let mediaUrls: string[] = [];

    if (selectedFiles.length > 0) {
      mediaUrls = await uploadMedia(selectedFiles);
      setSelectedFiles([]);
      setPreviewUrls([]);
    }

    if (input.trim() || mediaUrls.length > 0) {
      sendMessage(selectedConv.id, input.trim(), mediaUrls);
      setInput('');
      setShowEmojiPicker(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const newFiles = Array.from(e.target.files);

    setSelectedFiles((prev) => {
      const combined = [...prev, ...newFiles].slice(0, 10);
      return combined;
    });

    const newUrls = newFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...newUrls].slice(0, 10));
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConv?.messages]);

  useEffect(() => {
    if (!selectedConv) return;

    const unreadMessages = selectedConv.messages.filter(
      (m) => m.sender_type === SenderType.USER && !m.is_read
    );

    if (unreadMessages.length > 0) {
      markAsRead(selectedConv.id);
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id === selectedConv.id) {
            return {
              ...conv,
              messages: conv.messages.map((m) =>
                m.sender_type === SenderType.USER ? { ...m, is_read: true } : m
              ),
              unreadCount: 0,
            };
          }
          return conv;
        })
      );
    }
  }, [selectedConv, markAsRead, setConversations]);

  return (
    <div className="flex h-full rounded-2xl overflow-hidden shadow-2xl bg-white border border-gray-100">
      {/* Sidebar */}
      <div className="w-72 bg-gradient-to-b from-slate-50 to-white border-r border-gray-100 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-bold text-lg text-gray-800 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Tin nhắn
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {conversations.length} cuộc hội thoại
          </p>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.map((conv) => {
            const lastMessage = conv.messages[conv.messages.length - 1];

            return (
              <div
                key={conv.id}
                className={`flex items-center p-3 rounded-xl cursor-pointer transition-all duration-200 group ${
                  selectedConversationId === conv.id
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25 scale-[1.02]'
                    : 'hover:bg-gray-100 text-gray-800'
                }`}
                onClick={() => setSelectedConversationId(conv.id)}
              >
                <div className="relative">
                  <img
                    src={
                      getAvatarUrl(
                        conv.user?.profile?.avatar_url,
                        conv.user?.id
                      ) || '/placeholder.svg'
                    }
                    alt="avatar"
                    className="w-11 h-11 rounded-full object-cover ring-2 ring-white shadow-md"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
                </div>

                <div className="ml-3 flex-1 min-w-0">
                  <span
                    className={`block truncate text-sm font-semibold ${
                      selectedConversationId === conv.id
                        ? 'text-white'
                        : 'text-gray-800'
                    }`}
                  >
                    {conv.user?.profile?.full_name || `Khách ${conv.user?.id}`}
                  </span>

                  {lastMessage && (
                    <span
                      className={`block truncate text-xs mt-0.5 ${
                        selectedConversationId === conv.id
                          ? 'text-blue-100'
                          : 'text-gray-500'
                      }`}
                    >
                      {lastMessage.sender_type === SenderType.STORE
                        ? 'Bạn: '
                        : ''}
                      {lastMessage.media_url
                        ? '📷 Hình ảnh'
                        : lastMessage.content}
                    </span>
                  )}
                </div>

                {conv.unreadCount > 0 && (
                  <span className="ml-2 min-w-[22px] h-[22px] text-[11px] text-white bg-red-500 px-1.5 rounded-full font-bold flex items-center justify-center shadow-lg shadow-red-500/30">
                    {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat box */}
      <div className="flex-1 flex flex-col bg-gradient-to-b from-gray-50 to-white">
        {selectedConv ? (
          <>
            {/* Chat Header */}
            <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center gap-3 shadow-sm">
              <div className="relative">
                <img
                  src={
                    getAvatarUrl(
                      selectedConv.user?.profile?.avatar_url,
                      selectedConv.user?.id
                    ) || '/placeholder.svg'
                  }
                  alt="avatar"
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">
                  {selectedConv.user?.profile?.full_name ||
                    `Khách ${selectedConv.user?.id}`}
                </h3>
                <p
                  className={`text-xs font-medium ${
                    selectedConv.user?.status === 'active'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {selectedConv.user?.status === 'active'
                    ? 'Đang hoạt động'
                    : 'Ngừng hoạt động'}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {selectedConv.messages.map((m: Message, index: number) => {
                const isStore = m.sender_type === SenderType.STORE;
                const nextMsg = selectedConv.messages[index + 1];
                const isLastMessageOfSender =
                  !nextMsg || nextMsg.sender_type !== m.sender_type;
                const isLastMessage =
                  index === selectedConv.messages.length - 1;

                return (
                  <div
                    key={m.id}
                    className={`flex items-end gap-2 ${
                      isStore ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {/* Avatar for user messages */}
                    {!isStore && isLastMessageOfSender && (
                      <img
                        src={
                          getAvatarUrl(
                            selectedConv.user?.profile?.avatar_url,
                            selectedConv.user?.id
                          ) || '/placeholder.svg'
                        }
                        alt="avatar"
                        className="w-8 h-8 rounded-full object-cover shadow-md flex-shrink-0"
                      />
                    )}
                    {!isStore && !isLastMessageOfSender && (
                      <div className="w-8 flex-shrink-0" />
                    )}

                    <div
                      className={`flex flex-col ${
                        isStore ? 'items-end' : 'items-start'
                      } max-w-[70%]`}
                    >
                      <div
                        className={`inline-block px-4 py-2.5 rounded-2xl break-words leading-relaxed ${
                          isStore
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md shadow-lg shadow-blue-500/20'
                            : 'bg-white text-gray-800 rounded-bl-md shadow-md border border-gray-100'
                        }`}
                      >
                        {m.media_url ? (
                          m.media_url.endsWith('.mp4') ||
                          m.media_url.endsWith('.webm') ||
                          m.media_url.endsWith('.ogg') ? (
                            <video
                              src={`${BE_BASE_URL}${m.media_url}`}
                              controls
                              className="max-w-xs rounded-lg"
                            />
                          ) : (
                            <img
                              src={`${BE_BASE_URL}${m.media_url}`}
                              alt="media"
                              className="max-w-xs rounded-lg"
                            />
                          )
                        ) : (
                          <span className="text-[15px]">{m.content}</span>
                        )}
                      </div>

                      {/* Read status */}
                      {isStore && isLastMessageOfSender && isLastMessage && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                          {m.is_read ? (
                            <>
                              <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                              <span>Đã xem</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Đã gửi</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Small avatar when seen */}
                    {isStore &&
                      m.is_read &&
                      isLastMessageOfSender &&
                      isLastMessage && (
                        <img
                          src={
                            getAvatarUrl(
                              selectedConv.user?.profile?.avatar_url,
                              selectedConv.user?.id
                            ) || '/placeholder.svg'
                          }
                          alt="seen by"
                          className="w-4 h-4 rounded-full object-cover shadow-sm flex-shrink-0"
                        />
                      )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100">
              {/* File Preview */}
              {selectedFiles.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-3 mb-3 border-b border-gray-100">
                  {previewUrls.map((url, idx) => {
                    const file = selectedFiles[idx];
                    const isVideo = file?.type.startsWith('video');
                    return (
                      <div key={idx} className="relative group flex-shrink-0">
                        {isVideo ? (
                          <video
                            src={url}
                            className="w-16 h-16 rounded-xl object-cover ring-2 ring-gray-100"
                          />
                        ) : (
                          <img
                            src={url || '/placeholder.svg'}
                            className="w-16 h-16 rounded-xl object-cover ring-2 ring-gray-100"
                            alt="preview"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Input Row */}
              <div className="flex items-center gap-2 relative">
                <label className="p-2.5 rounded-full hover:bg-gray-100 cursor-pointer transition-colors text-gray-500 hover:text-blue-500">
                  <Paperclip className="w-5 h-5" />
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>

                {/* Emoji button + Picker */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker((p) => !p)}
                    className="p-2.5 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-yellow-500"
                  >
                    <Smile className="w-5 h-5" />
                  </button>

                  {showEmojiPicker && (
                    <div className="absolute bottom-12 left-0 z-50">
                      <Picker
                        data={data}
                        theme="light"
                        emojiSize={22}
                        previewPosition="none"
                        skinTonePosition="none"
                        onEmojiSelect={(emoji: any) => {
                          setInput((prev) => prev + (emoji.native || ''));
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    className="w-full bg-gray-100 rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder:text-gray-400"
                    placeholder="Nhập tin nhắn..."
                  />
                </div>

                <button
                  onClick={handleSend}
                  className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none transition-all"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <MessageCircle className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-lg font-medium text-gray-500">
              Chọn cuộc hội thoại
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Chọn khách hàng để bắt đầu trò chuyện
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
