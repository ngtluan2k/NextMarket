import React, { useEffect, useRef, useState } from 'react';
import { Conversation, Message } from '../../../types/chat.types';
import { uploadMedia } from '../../../../service/chat.service';

interface GroupChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: number;
  userId?: number;
  startGroupConversation: (groupId: number) => Promise<Conversation>;
  sendMessage: (
    conversationId: number,
    content: string,
    mediaUrls?: string[]
  ) => void;
  selectedConversationId: number | null;
  setSelectedConversationId: (id: number) => void;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  joinConversationRoom: (conversationId: number) => void;
}

export default function GroupChatModal({
  isOpen,
  onClose,
  groupId,
  userId,
  startGroupConversation,
  sendMessage,
  selectedConversationId,
  setSelectedConversationId,
  messages,
  setMessages,
  joinConversationRoom,
}: GroupChatModalProps) {
  const [groupConv, setGroupConv] = useState<Conversation | null>(null);
  const [input, setInput] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  const [membersMap, setMembersMap] = useState<Record<number, string>>({});
  const BE_BASE_URL =
    import.meta.env.VITE_BE_BASE_URL || 'http://localhost:3000';

  // Load hoặc tạo conversation nhóm
  useEffect(() => {
    if (!isOpen || !userId || initialized.current) return;

    const init = async () => {
      const conv = await startGroupConversation(groupId);
      console.log('group conver', conv);
      setGroupConv(conv);
      setSelectedConversationId(conv.id);
      joinConversationRoom(conv.id);
      setMessages(conv.messages || []);

      // Map sender_id -> username
      if (conv.group_order?.members) {
        const map: Record<number, string> = {};
        conv.group_order.members.forEach((m) => {
          if (m.user) map[m.user.id] = m.user.username;
        });
        setMembersMap(map);
      }
      initialized.current = true;
    };

    init();
  }, [isOpen, userId]);

  useEffect(() => {
    if (groupConv) joinConversationRoom(groupConv.id);
  }, [groupConv]);

  // Scroll xuống cuối khi có tin nhắn mới
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  const handleSend = async () => {
    if (!groupConv) return;

    let mediaUrls: string[] = [];
    if (selectedFiles.length > 0) {
      mediaUrls = await uploadMedia(selectedFiles); // trả về array link file
      setSelectedFiles([]);
      setPreviewUrls([]);
    }

    if (input.trim() || mediaUrls.length > 0) {
      sendMessage(groupConv.id, input.trim(), mediaUrls);
      setInput('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files).slice(0, 10);
    setSelectedFiles((prev) => [...prev, ...files].slice(0, 10));
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...urls].slice(0, 10));
  };

  const removePreview = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white w-[700px] max-h-[90vh] rounded-2xl shadow-2xl flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="font-semibold text-xl text-gray-800">
            💬 {groupConv?.group_order?.name || `Nhóm Chat #${groupId}`}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-500 transition text-xl font-bold"
          >
            ✖
          </button>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-5 py-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
        >
          {messages.map((m) => {
            const isMe = m.sender_id === userId;

            // Lấy member dựa vào sender_id
            const member = groupConv?.group_order?.members?.find(
              (mem) => mem.user.id === m.sender_id
            );

            // Avatar
            let avatarUrl = 'https://via.placeholder.com/32'; // default
            const avatarFromProfile = member?.user?.profile?.avatar_url; // <-- sửa đây
            if (avatarFromProfile) {
              avatarUrl = avatarFromProfile.startsWith('http')
                ? avatarFromProfile
                : `${BE_BASE_URL}${avatarFromProfile}`;
            }
            console.log('avatar', avatarFromProfile);

            // Tên người gửi
            const senderName = isMe
              ? 'Bạn'
              : member?.user?.profile?.full_name ||
                member?.user.username ||
                'Người dùng';

            // Media list
            const mediaList: string[] = m.media_url
              ? Array.isArray(m.media_url)
                ? m.media_url
                : [m.media_url]
              : [];

            return (
              <div
  key={m.id}
  className={`flex items-start gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
>
  {/* Avatar chỉ hiện với người khác */}
  {!isMe && (
    <img
      src={
        (() => {
          const member = groupConv?.group_order?.members?.find(
            (mem) => mem.user.id === m.sender_id
          );
          const avatarFromProfile = member?.user?.profile?.avatar_url;
          return avatarFromProfile
            ? avatarFromProfile.startsWith('http')
              ? avatarFromProfile
              : `${BE_BASE_URL}${avatarFromProfile}`
            : 'https://via.placeholder.com/32';
        })()
      }
      alt={m.sender_id.toString()}
          className="w-8 h-8 rounded-full object-cover mt-7" // <-- mt-1 làm avatar xuống 0.25rem

    />
  )}

  <div className="flex flex-col items-start max-w-[75%]">
    {/* Tên người gửi */}
    {!isMe && (
      <span className="text-xs text-gray-500 mb-1">
        {groupConv?.group_order?.members?.find((mem) => mem.user.id === m.sender_id)?.user.username ||
          'Người dùng'}
      </span>
    )}

    {/* Nội dung message */}
    {m.content && (
      <div
        className={`px-4 py-2 rounded-2xl text-sm shadow-sm break-words ${
          isMe ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-200 text-gray-900 rounded-bl-none'
        }`}
      >
        {m.content}
      </div>
    )}

    {/* Media */}
    {m.media_url && (
      <div className="flex flex-wrap gap-2 mt-1">
        {(Array.isArray(m.media_url) ? m.media_url : [m.media_url]).map((url, idx) => {
          const fullUrl = url.startsWith('http') ? url : `${BE_BASE_URL}${url}`;
          const ext = url.split('.').pop()?.toLowerCase();
          if (['png', 'jpg', 'jpeg', 'gif'].includes(ext || '')) {
            return <img key={idx} src={fullUrl} alt="media" className="h-24 w-24 object-cover rounded-lg" />;
          }
          if (['mp4', 'webm', 'ogg'].includes(ext || '')) {
            return <video key={idx} src={fullUrl} controls className="h-32 w-32 rounded-lg object-cover" />;
          }
          return (
            <a key={idx} href={fullUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 underline">
              {url.split('/').pop()}
            </a>
          );
        })}
      </div>
    )}
  </div>
</div>

            );
          })}
        </div>

        {/* Input + File Preview */}
        <div className="flex flex-col p-5 border-t border-gray-200 gap-2">
          {previewUrls.length > 0 && (
            <div className="flex gap-2 mb-2 overflow-x-auto">
              {previewUrls.map((url, idx) => {
                const file = selectedFiles[idx];
                const isVideo = file.type.startsWith('video');

                return (
                  <div key={idx} className="relative">
                    {isVideo ? (
                      <video
                        src={url}
                        className="h-20 w-20 object-cover rounded-lg"
                        controls
                      />
                    ) : (
                      <img
                        src={url}
                        alt="preview"
                        className="h-20 w-20 object-cover rounded-lg"
                      />
                    )}
                    <button
                      onClick={() => removePreview(idx)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex gap-2">
            <input
              className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
              value={input}
              placeholder="Nhập tin nhắn..."
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <label
              htmlFor="fileInput"
              className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-full cursor-pointer"
            >
              📎
            </label>
            <input
              type="file"
              id="fileInput"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              onClick={handleSend}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full shadow-md transition"
            >
              Gửi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
