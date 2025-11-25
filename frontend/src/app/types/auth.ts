import { Me } from './user';

export type AuthContextType = {
  me: Me | null;
  token: string | null;
  login: (user: Me, token: string) => void;
  logout: () => void;
  loadAddresses: (userId: number, token: string) => Promise<void>;
};
