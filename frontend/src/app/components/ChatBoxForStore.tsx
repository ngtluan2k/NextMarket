import React, {
  Dispatch,
  SetStateAction,
  useRef,
  useState,
  useEffect,
} from 'react';
import { SenderType, Conversation, Message } from '../types/chat.types';
import { uploadMedia } from '../../service/chat.service';

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
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const selectedConv =
    conversations.find((c) => c.id === selectedConversationId) || null;
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const handleSend = async () => {
    if (!selectedConv) return;

    let mediaUrls: string[] = [];

    // Upload file nếu có
    if (selectedFiles.length > 0) {
      mediaUrls = await uploadMedia(selectedFiles); // gọi API upload mới
      setSelectedFiles([]); // reset file sau khi upload
    }

    // Gửi tin nhắn (text + mediaUrls) qua socket
    if (input.trim() || mediaUrls.length > 0) {
      sendMessage(selectedConv.id, input.trim(), mediaUrls);
      setInput('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const newFiles = Array.from(e.target.files);

    // Cập nhật selectedFiles: giữ file cũ + thêm file mới, tối đa 10
    setSelectedFiles((prev) => {
      const combined = [...prev, ...newFiles].slice(0, 10);
      return combined;
    });

    // Cập nhật previewUrls: giữ preview cũ + thêm preview mới
    const newUrls = newFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...newUrls].slice(0, 10));
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };
  // Auto scroll xuống dưới mỗi khi messages thay đổi
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConv?.messages]);

  // Tự động đánh dấu đã xem tin nhắn mới của user
  useEffect(() => {
    if (!selectedConv) return;
    // Chỉ đánh dấu tin nhắn của user là chưa đọc
    const unreadMessages = selectedConv.messages.filter(
      (m) => m.sender_type === SenderType.USER && !m.is_read
    );
    if (unreadMessages.length > 0) {
      markAsRead(selectedConv.id); // gọi server đánh dấu
      // Cập nhật frontend: set tất cả tin nhắn của user là is_read = true + unreadCount = 0
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
  }, [selectedConv?.messages]);

  return (
    <div className="flex h-full border rounded-lg overflow-hidden shadow-lg bg-white">
      {/* Sidebar */}
      <div className="w-56 bg-white border-r p-2 overflow-y-auto">
        <h2 className="font-semibold mb-2 text-base text-gray-700 pl-1">
          Khách hàng
        </h2>

        {conversations.map((conv) => (
          <div
            key={conv.id}
            className={`flex items-center p-2 rounded-md cursor-pointer mb-1 transition-all duration-150 ${
              selectedConversationId === conv.id
                ? 'bg-blue-100'
                : 'hover:bg-gray-100'
            }`}
            onClick={() => setSelectedConversationId(conv.id)}
          >
            <img
              src={
                getAvatarUrl(conv.user?.profile?.avatar_url) ||
                'https://i.pravatar.cc/40?u=' + conv.user?.id
              }
              alt="avatar"
              className="w-8 h-8 rounded-full mr-2 object-cover"
            />

            <span className="flex-1 truncate text-sm font-medium text-gray-800">
              {conv.user?.profile?.full_name || `Khách ${conv.user?.id}`}
            </span>

            {conv.unreadCount > 0 && (
              <span className="ml-1 min-w-5 text-[10px] text-white bg-red-500 px-1.5 py-0.5 rounded-full font-semibold text-center">
                {conv.unreadCount}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Chat box */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
          {selectedConv ? (
            selectedConv.messages.map((m: Message, index: number) => {
              const isStore = m.sender_type === SenderType.STORE;

              // Kiểm tra tin nhắn này là cuối cùng liên tiếp của người gửi
              const nextMsg = selectedConv.messages[index + 1];
              const isLastMessageOfSender =
                !nextMsg || nextMsg.sender_type !== m.sender_type;

              return (
                <div
                  key={m.id}
                  className={`flex items-end ${
                    isStore ? 'justify-end' : 'justify-start'
                  } relative`} // thêm relative để avatar absolute
                >
                  {/* Avatar người khác cho tin nhắn của user */}
                  {!isStore && (
                    <img
                      src={getAvatarUrl(
                        selectedConv.user?.profile?.avatar_url,
                        selectedConv.user?.id
                      )}
                      alt="avatar"
                      className="w-8 h-8 rounded-full mr-2 object-cover shadow-sm"
                    />
                  )}

                  <div
                    className={`flex flex-col ${
                      isStore ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`inline-block px-4 py-2 rounded-2xl max-w-[100%] break-normal leading-snug ${
                        isStore
                          ? 'bg-blue-500 text-white shadow-md'
                          : 'bg-white text-gray-800 shadow-md border border-gray-200'
                      }`}
                    >
                      {/* Hiển thị media nếu có */}
                      {m.media_url ? (
                        m.media_url.endsWith('.mp4') ||
                        m.media_url.endsWith('.webm') ||
                        m.media_url.endsWith('.ogg') ? (
                          <video
                            src={`${BE_BASE_URL}${m.media_url}`}
                            controls
                            className="max-w-xs rounded"
                          />
                        ) : (
                          <img
                            src={`${BE_BASE_URL}${m.media_url}`}
                            alt="media"
                            className="max-w-xs rounded"
                          />
                        )
                      ) : (
                        m.content
                      )}
                    </div>

                    {/* Chỉ hiển thị trạng thái ở tin nhắn cuối cùng liên tiếp của bản thân */}
                    {isStore &&
                      isLastMessageOfSender &&
                      index === selectedConv.messages.length - 1 && (
                        <span className="text-xs text-gray-500 mt-1 pr-6">
                          {m.is_read ? 'Đã xem' : 'Đã gửi'}
                        </span>
                      )}
                  </div>

                  {/* Avatar nhỏ cuối dòng của bản thân nếu đã xem */}
                  {isStore &&
                    m.is_read &&
                    isLastMessageOfSender &&
                    index === selectedConv.messages.length - 1 && (
                      <img
                        src={getAvatarUrl(
                          selectedConv.user?.profile?.avatar_url,
                          selectedConv.user?.id
                        )}
                        alt="receiver avatar"
                        className="w-4 h-4 rounded-full object-cover shadow-sm absolute -right-0 bottom-0"
                      />
                    )}
                </div>
              );
            })
          ) : (
            <div className="text-gray-500 text-center mt-20 font-medium">
              Chọn khách hàng để bắt đầu trò chuyện
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {selectedConv && (
          <div className="flex flex-col gap-2 border-t bg-white shadow-inner p-2">
            {/* Preview media */}
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
                        onClick={() => removeFile(idx)}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Input + file button + send */}
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1 border border-gray-300 rounded-full px-3 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-shadow"
                placeholder="Nhập tin nhắn..."
              />
              <label className="bg-gray-200 px-3 py-2 rounded-full cursor-pointer hover:bg-gray-300 transition-colors text-sm">
                Chọn file
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
              <button
                onClick={handleSend}
                className="bg-blue-600 text-white px-3 py-1.5 rounded-full hover:bg-blue-700 transition-colors text-sm"
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
