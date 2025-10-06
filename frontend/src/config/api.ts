import axios from 'axios';

export const API_BASE_URL = 'http://localhost:3000';

export const API_ENDPOINTS = {
  products: `${API_BASE_URL}/products`,
  orders: `${API_BASE_URL}/orders`,
  cart: `${API_BASE_URL}/cart`,
  users: `${API_BASE_URL}/users`,
  auth: `${API_BASE_URL}/auth`,
};

export const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});
