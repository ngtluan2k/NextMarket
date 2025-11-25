import { MessageOutlined } from "@ant-design/icons";

interface FloatingChatBubbleProps {
  onOpen: () => void;
  unread?: number;
}

export const FloatingChatBubble = ({ onOpen, unread = 0 }: FloatingChatBubbleProps) => {
  return (
    <button
      onClick={onOpen}
      className="fixed bottom-5 right-5 w-14 h-14 rounded-full bg-blue-600 shadow-xl flex items-center justify-center text-white text-2xl hover:bg-blue-700 z-[9999]"
    >
      <MessageOutlined />

      {unread > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
          {unread}
        </span>
      )}
    </button>
  );
};
