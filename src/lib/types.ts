export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  eventHistory: string[];
}

export interface Artist {
  id: string;
  name: string;
  genre: string;
  profilePictureUrl: string;
  profilePictureHint: string;
  performanceDetails: string;
}

export type EventStatus = 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
export type PaymentStatus = 'Unpaid' | 'Paid';

export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  clientId: string;
  artistIds: string[];
  payment: number;
  status: EventStatus;
  paymentStatus: PaymentStatus;
}

export interface FinancialTransaction {
  id: string;
  type: 'Income' | 'Expense';
  description: string;
  amount: number;
  date: string;
  eventId?: string;
}
