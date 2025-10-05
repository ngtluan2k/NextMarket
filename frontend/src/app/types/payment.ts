export type PaymentMethodType = string;

export type SavedCard = {
  id: string | number;
  brand: string;
  last4: string;
  exp: string;
};

export type PaymentMethodResponse = {
  id: number;
  uuid: string;
  name: string;
  type: string;
  config: Record<string, any>;
  enabled: boolean;
  createdAt: string;
};
