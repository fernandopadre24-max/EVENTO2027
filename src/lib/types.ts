
export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface Artist {
  id: string;
  name: string;
  genre: string;
  profilePictureUrl: string;
  profilePictureHint: string;
  performanceDetails: string;
}

export type EventStatus = 'Pendente' | 'Confirmado' | 'Concluído' | 'Cancelado';
export type PaymentStatus = 'Não Pago' | 'Pago';

export interface Event {
  id: string;
  date: string;
  time: string;
  local: string;
  clientId: string;
  artistIds: string[];
  payment: number;
  status: EventStatus;
  paymentStatus: PaymentStatus;
}

export interface FinancialTransaction {
  id: string;
  type: 'Receita' | 'Despesa';
  description: string;
  amount: number;
  date: string;
  eventId?: string;
}
