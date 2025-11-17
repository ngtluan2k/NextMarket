export enum OrderStatuses {
  waiting_group = -1,
  pending = 0,
  confirmed = 1,
  processing = 2,
  shipped = 3,
  delivered = 4,
  completed = 5,
  cancelled = 6,
  returned = 7,
}
export interface OrderFilters {
  status?: number;
  paymentStatus?: number;
  fromDate?: Date | string;
  toDate?: Date | string;
  search?: string;
  page?: number;
  limit?: number;
}
