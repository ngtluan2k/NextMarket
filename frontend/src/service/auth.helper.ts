export function decodeJwtToken(token: string): any | null {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
}

export function getCurrentUserId(): number | null {
  const token = localStorage.getItem('token');
  const decoded = decodeJwtToken(token || '');
  console.log(decoded);
  return decoded?.userId || decoded?.sub || null;
}
