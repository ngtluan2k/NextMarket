// user.service.ts
export interface UserProfile {
  id: number;
  uuid: string;
  user_id: number;
  full_name: string | null;
  dob: string | null; // Date as string from API
  phone: string | null;
  gender: string | null;
  avatar_url: string | null;
  country: string | null;
  created_at: string;
  user: {
    id: number;
    uuid: string;
    username: string;
    email: string;
    status: string;
    code: string;
    created_at: string;
    updated_at: string;
  };
}

export interface UserProfileResponse {
  status: number;
  message: string;
  data: UserProfile;
}

const API_BASE = 'http://localhost:3000';

/**
 * Get user profile by user ID
 * @param userId - User ID
 * @returns Promise<UserProfile>
 */
export async function getUserProfile(userId: number): Promise<UserProfile> {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('No authentication token found');
  }

  try {
    const response = await fetch(`${API_BASE}/users/${userId}/profile`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: UserProfileResponse = await response.json();

    if (result.status !== 200) {
      throw new Error(result.message || 'Failed to fetch user profile');
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}

/**
 * Update user profile
 * @param userId - User ID
 * @param profileData - Profile data to update
 * @returns Promise<UserProfile>
 */
export async function updateUserProfile(
  userId: number,
  profileData: Partial<UserProfile>
): Promise<UserProfile> {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('No authentication token found');
  }

  try {
    const response = await fetch(`${API_BASE}/users/${userId}/profile`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: UserProfileResponse = await response.json();

    if (result.status !== 200) {
      throw new Error(result.message || 'Failed to update user profile');
    }

    return result.data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

/**
 * Get current user ID from JWT token
 * @returns number | null
 */
export function getCurrentUserId(): number | null {
  const token = localStorage.getItem('token');

  if (!token) {
    return null;
  }

  try {
    // Decode JWT token to get user ID
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub || payload.userId || null;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}
