import { message } from 'antd';

const API_BASE_URL = 'http://localhost:3000';

export interface BudgetStatus {
  program_id: number;
  program_name: string;
  total_budget: number;
  spent: number;
  pending: number;
  available: number;
  percentage_used: number;
  monthly_cap: number | null;
  monthly_spent: number;
  daily_cap: number | null;
  daily_spent: number;
  auto_pause_enabled: boolean;
  status: string;
  paused_reason?: string;
}

export interface BudgetAlert {
  program_id: number;
  program_name: string;
  total_budget: number;
  available: number;
  percentage_remaining: number;
}

// Get budget status for a specific program
export async function getBudgetStatus(programId: number): Promise<BudgetStatus> {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(
      `${API_BASE_URL}/affiliate-programs/${programId}/budget-status`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch budget status');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching budget status:', error);
    message.error('Không thể tải trạng thái ngân sách');
    throw error;
  }
}

// Get programs near budget limit
export async function getBudgetAlerts(): Promise<BudgetAlert[]> {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(
      `${API_BASE_URL}/affiliate-programs/budget/alerts`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch budget alerts');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching budget alerts:', error);
    message.error('Không thể tải cảnh báo ngân sách');
    throw error;
  }
}

// Get all programs with budget info
export async function getAllProgramsBudgetStatus(): Promise<BudgetStatus[]> {
  try {
    const token = localStorage.getItem('token');
    
    // First get all programs
    const programsResponse = await fetch(
      `${API_BASE_URL}/affiliate-programs/manage`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!programsResponse.ok) {
      throw new Error('Failed to fetch programs');
    }

    const programs = await programsResponse.json();

    // Then get budget status for each program
    const budgetStatuses = await Promise.all(
      programs.map((program: any) => getBudgetStatus(program.id))
    );

    return budgetStatuses;
  } catch (error) {
    console.error('Error fetching all programs budget status:', error);
    message.error('Không thể tải trạng thái ngân sách các chương trình');
    throw error;
  }
}
