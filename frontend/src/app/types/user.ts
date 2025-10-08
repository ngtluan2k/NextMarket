export type UserAddress = {
  id: number;
  recipientName: string;
  phone: string;
  street?: string;
  ward?: string;
  district?: string;
  province?: string;
  country?: string;
  postalCode?: string;
  fullAddress?: string;
  isDefault?: boolean;
  userId?: number;
  tag?: string;
};

export type AddressFormValues = {
  recipientName: string;
  phone: string;
  street: string;
  ward: string;
  district: string;
  province: string;
  country?: string;
  postalCode?: string;
  isDefault?: boolean;
};

// User
export interface User {
  id: number;
  username: string;
  email: string;
  roles: string[];
  permissions: string[];
}

// Context cho user
export type UserContextType = {
  user: User;
  setUser: (u: User) => void;
};

// Dữ liệu của API /me
export type Me = {
  id: number;               // profile ID
  user_id?: number;         // ID thực sự của user (bảng users)
  username?: string;
  email: string;
  full_name?: string;
  roles?: string[];
  permissions?: string[];
  addresses?: UserAddress[];
  user?: {
    id: number;
    username: string;
    email: string;
    // ... các field khác nếu cần
  };
};
