// src/types.ts
export interface RegisterFormData {
  username?: string;
  full_name?: string;
  dob?: string;
  phone?: string;
  gender?: string;
  email: string;
  password: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}


