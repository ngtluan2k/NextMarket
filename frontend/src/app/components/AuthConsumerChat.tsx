import { useAuth } from "../context/AuthContext";
import ChatWidget from "./ChatWidget";

export const AuthConsumerChat = () => {
  const { me } = useAuth();

  // Nếu chưa login hoặc me không có user_id
  if (!me?.user_id) return null;

  return <ChatWidget key={me.user_id} userId={me.user_id} />;
};
