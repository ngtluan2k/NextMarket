import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_BE_BASE_URL;
;

export const API_ENDPOINTS = {
  products: `${API_BASE_URL}/products`,
  orders: `${API_BASE_URL}/orders`,
  cart: `${API_BASE_URL}/cart`,
  users: `${API_BASE_URL}/users`,
  auth: `${API_BASE_URL}/auth`,
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
