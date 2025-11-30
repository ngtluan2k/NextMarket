import React, { useState, useEffect, useRef } from 'react';
import { SenderType, Message, Conversation } from '../types/chat.types';
import { uploadMedia } from '../../service/chat.service';
import {
  MessageOutlined,
  CloseOutlined,
  PaperClipOutlined,
  SendOutlined,
  ArrowLeftOutlined,
  SmileOutlined,
} from '@ant-design/icons';
import { Input, Button, Tooltip, Badge, Popover } from 'antd';

import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

const { TextArea } = Input;

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
  if (senderType === SenderType.STORE) {
    return null;
  }
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const BE_BASE_URL =
    import.meta.env.VITE_BE_BASE_URL || 'http://localhost:3000';

  const selectedConversation =
    conversations.find((c) => c.id === selectedConversationId) || null;

  useEffect(() => {
    if (!selectedConversation) return;

    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, selectedConversationId]);

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

  const handleEmojiSelect = (emoji: any) => {
    setInput((prev) => prev + (emoji.native || ''));
  };

  return (
    <div
      className="
        fixed z-40
        bottom-2 right-2
        sm:bottom-4 sm:right-4
        w-[96vw] sm:w-[420px] md:w-[450px]
        h-[60vh] sm:h-[500px]
        bg-white shadow-xl rounded-xl flex
      "
    >
      {/* Sidebar */}
      <div className="w-28 sm:w-36 border-r bg-gray-100 rounded-l-xl overflow-y-auto p-2">
        <h4 className="font-semibold mb-2 text-xs sm:text-sm flex items-center gap-1">
          <MessageOutlined className="text-gray-700" />
          <span>Chats</span>
        </h4>
        {conversations.map((c) => {
          const unread = c.unreadCount || 0;
          return (
            <div
              key={c.id}
              onClick={() => onSelectConversation(c.id)}
              className={`p-2 rounded cursor-pointer text-xs sm:text-sm mb-1 truncate flex items-center justify-between ${
                selectedConversationId === c.id
                  ? 'bg-blue-200'
                  : 'hover:bg-gray-200'
              }`}
            >
              <span className="truncate">
                {c.store?.name ||
                  c.user?.profile?.full_name ||
                  `User #${c.user?.id}`}
              </span>
              {unread > 0 && (
                <Badge
                  count={unread}
                  size="small"
                  className="ml-1"
                  style={{ backgroundColor: '#f5222d' }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col rounded-r-xl">
        {/* Header */}
        <div className="flex justify-between items-center px-3 py-2 border-b">
          <h3 className="font-semibold text-xs sm:text-sm">
            {selectedConversation
              ? selectedConversation.store?.name
                ? `Đang chat với ${selectedConversation.store.name}`
                : selectedConversation.user?.profile?.full_name
                ? `Đang chat với ${selectedConversation.user.profile.full_name}`
                : 'Đang load...'
              : 'Chọn cuộc chat'}
          </h3>
          <Button
            type="text"
            size="small"
            onClick={handleClose}
            icon={<CloseOutlined />}
            className="text-red-500"
          />
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-slate-50">
          {selectedConversation ? (
            (messages || []).map((m) => (
              <div
                key={m.id}
                className={`flex ${
                  m.sender_type === senderType ? 'justify-end' : 'justify-start'
                }`}
              >
                <div className="flex flex-col max-w-[75%]">
                  <span
                    className={`inline-block px-3 py-2 rounded-2xl break-words text-sm shadow-sm ${
                      m.sender_type === senderType
                        ? 'bg-blue-500 text-white rounded-br-sm'
                        : 'bg-white text-gray-800 rounded-bl-sm'
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
                          className="mt-1 max-w-xs rounded-lg"
                        />
                      ) : (
                        <img
                          src={`${BE_BASE_URL}${m.media_url}`}
                          alt="media"
                          className="mt-1 max-w-xs rounded-lg"
                        />
                      ))}
                  </span>

                  {m.sender_type === senderType && (
                    <span className="text-[10px] text-gray-400 mt-1 self-end">
                      {m.is_read ? 'Đã xem' : 'Đã gửi'}
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-gray-400 text-xs sm:text-sm text-center mt-9 flex flex-col items-center gap-1">
              <ArrowLeftOutlined />
              <span>Chọn cuộc trò chuyện bên trái</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input + File Preview */}
        {selectedConversation && (
          <div className="flex flex-col p-2 border-t gap-2 bg-white">
            {selectedFiles.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
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

            <div className="flex items-center gap-2">
              {/* Emoji picker */}
              <Popover
                content={
                  <div className="max-h-80 overflow-y-auto">
                    <Picker
                      data={data}
                      onEmojiSelect={handleEmojiSelect}
                      theme="light"
                    />
                  </div>
                }
                trigger="click"
                placement="topLeft"
                open={showEmojiPicker}
                onOpenChange={setShowEmojiPicker}
                overlayStyle={{ zIndex: 99999 }}
              >
                <Tooltip title="Thêm emoji">
                  <Button
                    type="text"
                    icon={<SmileOutlined />}
                    className="flex-shrink-0"
                  />
                </Tooltip>
              </Popover>

              <TextArea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onPressEnter={(e) => {
                  if (!e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                autoSize={{ minRows: 1, maxRows: 4 }}
                placeholder="Nhập tin nhắn..."
                className="text-sm flex-1"
              />

              <label className="flex-shrink-0 bg-gray-100 px-2 py-1 rounded-lg cursor-pointer hover:bg-gray-200 text-sm flex items-center justify-center border border-dashed border-gray-300">
                <PaperClipOutlined />
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>

              <Tooltip title="Gửi">
                <Button
                  type="primary"
                  shape="circle"
                  icon={<SendOutlined />}
                  onClick={handleSend}
                  className="flex-shrink-0"
                />
              </Tooltip>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
