import axios from 'axios';

export async function affiliateRegister(id: number) {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('not found user access token!');

  try {
    const res = await axios.get(
      `http://localhost:3000/users/${id}/is-affiliate`,
      {
        headers: {
          Authorization: `Bearer ${token}`, 
        },
      }
    );

    console.log('Affiliate status:', res.data);
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('API error:', error.response?.status, error.response?.data);
    } else {
      console.error('Unexpected error:', error);
    }
    throw error;
  }
}
