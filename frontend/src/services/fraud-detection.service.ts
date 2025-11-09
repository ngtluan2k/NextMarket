import { message } from 'antd';

const API_BASE_URL = 'http://localhost:3000';

export interface FraudLog {
  id: number;
  fraud_type: string;
  affiliate_user_id?: number;
  order_id?: number;
  details: any;
  ip_address?: string;
  detected_at: string;
  is_reviewed: boolean;
  admin_action?: 'IGNORE' | 'BAN_USER' | 'SUSPEND_AFFILIATE';
  admin_notes?: string;
  reviewed_by?: number;
  reviewed_at?: string;
}

export interface FraudLogsResponse {
  logs: FraudLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FraudStats {
  totalFraudAttempts: number;
  byType: {
    [key: string]: number;
  };
  recentAttempts: number;
  reviewedCount: number;
  pendingReviewCount: number;
}

// Get fraud logs with pagination
export async function getFraudLogs(
  page: number = 1,
  limit: number = 20
): Promise<FraudLogsResponse> {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(
      `${API_BASE_URL}/affiliate-fraud/logs?page=${page}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch fraud logs');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching fraud logs:', error);
    message.error('Không thể tải danh sách gian lận');
    throw error;
  }
}

// Review fraud log
export async function reviewFraudLog(
  logId: number,
  action: 'IGNORE' | 'BAN_USER' | 'SUSPEND_AFFILIATE',
  notes?: string
): Promise<FraudLog> {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(
      `${API_BASE_URL}/affiliate-fraud/review/${logId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action, notes }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to review fraud log');
    }

    message.success('Đã xử lý gian lận thành công');
    return await response.json();
  } catch (error) {
    console.error('Error reviewing fraud log:', error);
    message.error('Không thể xử lý gian lận');
    throw error;
  }
}

// Get fraud statistics
export async function getFraudStats(): Promise<FraudStats> {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/affiliate-fraud/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      // If stats endpoint doesn't exist, return mock data
      const logsResponse = await getFraudLogs(1, 1000);
      return calculateStatsFromLogs(logsResponse.logs);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching fraud stats:', error);
    // Return calculated stats from logs as fallback
    try {
      const logsResponse = await getFraudLogs(1, 1000);
      return calculateStatsFromLogs(logsResponse.logs);
    } catch {
      return {
        totalFraudAttempts: 0,
        byType: {},
        recentAttempts: 0,
        reviewedCount: 0,
        pendingReviewCount: 0,
      };
    }
  }
}

// Helper function to calculate stats from logs
function calculateStatsFromLogs(logs: FraudLog[]): FraudStats {
  const byType: { [key: string]: number } = {};
  let reviewedCount = 0;
  let pendingReviewCount = 0;
  let recentAttempts = 0;

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  logs.forEach((log) => {
    // Count by type
    byType[log.fraud_type] = (byType[log.fraud_type] || 0) + 1;

    // Count reviewed
    if (log.is_reviewed) {
      reviewedCount++;
    } else {
      pendingReviewCount++;
    }

    // Count recent (last 24h)
    if (new Date(log.detected_at) > oneDayAgo) {
      recentAttempts++;
    }
  });

  return {
    totalFraudAttempts: logs.length,
    byType,
    recentAttempts,
    reviewedCount,
    pendingReviewCount,
  };
}
