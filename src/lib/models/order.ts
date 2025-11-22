
export interface PaymentOrder {
  merchantOid: string;
  email: string;
  userName: string;
  userPhone: string;
  userAddress: string;
  paymentAmount: number; // in kuruş
  totalAmount?: number; // actual amount collected (may differ due to installments)
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  paymentType?: 'card' | 'eft';
  failureReason?: string;
  failureCode?: string;
  testMode: boolean;
  basket: Array<{
    name: string;
    price: string;
    quantity: number;
  }>;
  createdAt: Date;
  paidAt?: Date;
  updatedAt: Date;
}
