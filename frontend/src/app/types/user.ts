
export type UserAddress = {
  id: number;
  fullAddress: string;
  name?: string;
  phone?: string;
  tag?: string;
  userId?: number;
};

export type AddressFormValues = {
  fullName: string;
  company?: string;
  phone: string;
  provinceCode?: number; province?: string;
  districtCode?: number;  district?: string;
  wardCode?: number;      ward?: string;
  addressLine: string;
  note?: string;
  kind: "home" | "company";
  isDefault?: boolean;
};


export interface User {
  id: number;
  username: string;
  email: string;
  roles: string[];
  permissions: string[];
}


export type UserContextType = {
  user: User;
  setUser: (u: User) => void;
};

export type Me = {
  id: number;
  email: string;
  full_name?: string;
  roles?: string[];
  permissions?: string[];
};

