

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  responsavel: string;
  local: string;
  instagram?: string;
  userId: string;
}

export interface Artist {
  id: string;
  name: string;
  genre: string;
  performanceDetails: string;
  instagram?: string;
  phone?: string;
  email?: string;
  userId: string;
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
  userId: string;
  hasSound?: boolean;
}

export type PaymentMethod = 'Dinheiro' | 'PIX' | 'Cartão de Crédito' | 'Cartão de Débito';

export type PurchaseStatus = 'Pago' | 'Não Pago';

export interface Purchase {
  id: string;
  description: string;
  recipient?: string;
  artistId?: string;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  installments?: number;
  userId: string;
  details?: string;
  status: PurchaseStatus;
}
