import axios from 'axios';
import {
  AffiliateProgram,
  CreateAffiliateProgramDto,
} from '../../app/types/affiliate';
import { API_BASE_URL } from '../../app/api/api';
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found!');
  }
  return { Authorization: `Bearer ${token}` };
};

const handleApiError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    console.error('API error:', error.response?.status, error.response?.data);
  } else {
    console.error('Unexpected error:', error);
  }
  throw error;
};

export async function isAffiliateUser(userId: number) {
  try {
    const res = await axios.get(
      `${API_BASE_URL}/users/${userId}/is-affiliate`,
      {
        headers: getAuthHeaders(),
      }
    );
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
}

export async function getAllAffiliatePrograms() {
  try {
    const res = await axios.get(`${API_BASE_URL}/affiliate-programs/manage/with-counts`, {
      headers: getAuthHeaders(),
    });
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
}

export async function getAllAffiliateProgramsBasic() {
  try {
    const res = await axios.get(`${API_BASE_URL}/affiliate-programs/manage`, {
      headers: getAuthHeaders(),
    });
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
}

export async function updateAffiliateProgram(
  programId: number,
  programData: Partial<AffiliateProgram>
) {
  try {
    const res = await axios.patch(
      `${API_BASE_URL}/affiliate-programs/${programId}`,
      programData,
      { headers: getAuthHeaders() }
    );
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
}

export async function createAffiliateProgram(
  programData: CreateAffiliateProgramDto
) {
  try {
    const res = await axios.post(
      `${API_BASE_URL}/affiliate-programs/`,
      programData,
      {
        headers: getAuthHeaders(),
      }
    );
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
}

export async function deleteAffiliateProgram(programId: number) {
  try {
    const res = await axios.post(
      `${API_BASE_URL}/affiliate-programs/delete/${programId}`,
      {},
      {
        headers: getAuthHeaders(),
      }
    );
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
}

export async function reopenAffiliateProgram(programId: number) {
  try {
    const res = await axios.post(
      `${API_BASE_URL}/affiliate-programs/reopen/${programId}`,
      {},
      {
        headers: getAuthHeaders(),
      }
    );
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
}

export async function getAffiliateProgramDetail(id: number) {
  try {
    const res = await axios.get(`${API_BASE_URL}/affiliate-programs/${id}`, {
      headers: getAuthHeaders(),
    });
    // console.log(JSON.stringify(res.data, null, 2));
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
}
