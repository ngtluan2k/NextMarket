import { BE_BASE_URL } from "../app/api/api";

// user-helper.service.ts
export type User = {
  id: number;
  uuid: string;
  user_id: number;
  full_name: string;
  dob: string;
  phone: string;
  gender: string;
  avatar_url: string | null;
  country: string;
  created_at: string;
  user: {
    id: number;
    uuid: string;
    username: string;
    email: string;
    status: string;
    code: string;
    created_at: string;
    updated_at: string | null;
    is_affiliate: boolean;
  };
};

export type AdminCheckResult = {
  userId: number;
  email: string;
  roles: string[];
  permissions: string[];
};

function authHeaders() {
  const token = localStorage.getItem('token') || '';
  return {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : '',
  } as Record<string, string>;
}

/**
 * Tìm user theo email và trả về user_id
 * @param email - Email của user cần tìm
 * @returns Promise<number> - User ID
 */
export async function findUserIdByEmail(email: string): Promise<number> {
  console.log(`🔍 Searching for user with email: ${email}`);
  
  if (!email || !email.trim()) {
    throw new Error('Email không được để trống');
  }

  try {
    // Gọi API tìm user theo email
    const res = await fetch(`${BE_BASE_URL}/users/search?email=${encodeURIComponent(email.trim())}`, { 
      headers: authHeaders() 
    });
    
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error(`Không tìm thấy user với email: ${email}`);
      }
      throw new Error(`Lỗi tìm kiếm user (${res.status})`);
    }
    
    const response = await res.json();
    console.log(`✅ Found user response:`, response);
    console.log(`🔍 Response structure:`, {
      hasData: !!response.data,
      hasId: !!response.id,
      dataKeys: response.data ? Object.keys(response.data) : 'no data',
      responseKeys: Object.keys(response)
    });
    
    // Xử lý cả hai cấu trúc response có thể có
    let userId: number;
    if (response.data && response.data.id) {
      // Cấu trúc: { data: { id: number, user: {...} } }
      userId = response.data.id;
    } else if (response.id) {
      // Cấu trúc: { id: number, ... }
      userId = response.id;
    } else if (response.data && typeof response.data === 'number') {
      // Cấu trúc: { data: number }
      userId = response.data;
    } else {
      console.error('❌ Unexpected response structure:', response);
      throw new Error('Không tìm thấy user ID trong response');
    }
    
    console.log(`✅ Found user ID:`, userId);
    return userId;
  } catch (error: any) {
    console.error(`❌ Error finding user by email:`, error);
    throw error;
  }
}

/**
 * Tìm user theo email và trả về thông tin đầy đủ
 * @param email - Email của user cần tìm
 * @returns Promise<User> - Thông tin user
 */
export async function findUserByEmail(email: string): Promise<User> {
  console.log(`🔍 Searching for user with email: ${email}`);
  
  if (!email || !email.trim()) {
    throw new Error('Email không được để trống');
  }

  try {
    const res = await fetch(`${BE_BASE_URL}/users/search?email=${encodeURIComponent(email.trim())}`, { 
      headers: authHeaders() 
    });
    
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error(`Không tìm thấy user với email: ${email}`);
      }
      throw new Error(`Lỗi tìm kiếm user (${res.status})`);
    }
    
    const response = await res.json();
    console.log(`✅ Found user response:`, response);
    
    // Xử lý cả hai cấu trúc response có thể có
    let user: User;
    if (response.data) {
      // Cấu trúc: { data: User }
      user = response.data;
    } else {
      // Cấu trúc: User trực tiếp
      user = response;
    }
    
    return user;
  } catch (error: any) {
    console.error(`❌ Error finding user by email:`, error);
    throw error;
  }
}

/**
 * Lấy thông tin chi tiết user theo ID
 * @param userId - ID của user
 * @returns Promise<User> - Thông tin chi tiết user
 */
export async function getUserById(userId: number): Promise<User> {
  console.log(`🔍 Getting user details for ID: ${userId}`);
  
  if (!userId) {
    throw new Error('User ID không được để trống');
  }

  try {
    const res = await fetch(`${BE_BASE_URL}/users/${userId}/profile`, { 
      headers: authHeaders() 
    });
    
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error(`Không tìm thấy user với ID: ${userId}`);
      }
      throw new Error(`Lỗi lấy thông tin user (${res.status})`);
    }
    
    const response = await res.json();
    console.log(`✅ Got user details:`, response);
    
    // Extract user data from response
    const user: User = response.data;
    return user;
  } catch (error: any) {
    console.error(`❌ Error getting user by ID:`, error);
    throw error;
  }
}

export async function checkIsAdmin(): Promise<AdminCheckResult> {
  try {
    const res = await fetch(`${BE_BASE_URL}/users/check-admin`, {
      method: 'GET',
      headers: authHeaders(),
    });

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('Bạn không có quyền admin hoặc chưa đăng nhập');
      }
      throw new Error(`Lỗi kiểm tra quyền admin (${res.status})`);
    }

    const response = await res.json();
    console.log('✅ Admin check response:', response);

    if (!response.data) {
      throw new Error('Không nhận được dữ liệu admin');
    }

    return response.data as AdminCheckResult;
  } catch (error: any) {
    console.error('❌ Error checking admin:', error);
    throw error;
  }
}


