import React, { useState, useMemo, useEffect } from "react";
import { FloatingChatBubble } from "./FloatingChatBubble";
import { ChatBox } from "./ChatBox";
import { useChatSocket } from "../hooks/useChatSocket";
import { SenderType } from "../types/chat.types";

export default function ChatWidget({ userId }: { userId: number }) {
  const [open, setOpen] = useState(false);

  const {
    conversations,
    setConversations,
    selectedConversationId,
    setSelectedConversationId,
    messages,
    setMessages,
    sendMessage,
    markAsRead,
  } = useChatSocket(userId, SenderType.USER);

useEffect(() => {
  setConversations([]);
  setSelectedConversationId(null);
}, [userId]);
  
  

  // Tổng tin nhắn chưa đọc
  const totalUnread = useMemo(() => {
    return conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  }, [conversations]);

  const handleOpen = () => setOpen(true);

  // Chọn conversation, reset chỉ conversation được chọn
  const handleSelectConversation = (convId: number) => {
    setSelectedConversationId(convId);

    // Reset unread count cho conversation đó
    setConversations(prev =>
      prev.map(c =>
        c.id === convId ? { ...c, unreadCount: 0 } : c
      )
    );

    // Gửi markAsRead lên server nếu cần
    markAsRead(convId);
  };

  

  return (
    <>
      {!open && (
        <FloatingChatBubble key={userId} onOpen={handleOpen} unread={totalUnread} />
      )}
      {open && (
        <ChatBox
          userId={userId}
          senderType={SenderType.USER}
          onClose={() => setOpen(false)}
          conversations={conversations}
          setConversations={setConversations}
          selectedConversationId={selectedConversationId}
          setSelectedConversationId={setSelectedConversationId}
          messages={messages}
          setMessages={setMessages}
          sendMessage={sendMessage}
          markAsRead={markAsRead}
          onSelectConversation={handleSelectConversation}
        />
      )}
    </>
  );
}
