import api from './api';
import { Invoice, InvoiceGenerateResponse } from '../types/invoice';

export const generateInvoice = async (userId: number): Promise<InvoiceGenerateResponse> => {
  const response = await api.post<InvoiceGenerateResponse>(`/invoices/generate/${userId}`);
  return response.data;
};

export const getInvoices = async (): Promise<Invoice[]> => {
  const response = await api.get<Invoice[]>('/invoices');
  return response.data;
};

export const getInvoice = async (id: number): Promise<Invoice> => {
  const response = await api.get<Invoice>(`/invoices/${id}`);
  return response.data;
};

export const downloadInvoicePdf = async (id: number, invoiceNumber: string): Promise<void> => {
  const response = await api.get(`/invoices/download/${id}`, {
    responseType: 'blob',
  });
  
  // Create PDF download link in browser
  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${invoiceNumber.replace('/', '_')}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const markInvoiceAsPaid = async (id: number, isPaid: boolean): Promise<Invoice> => {
  const response = await api.put<Invoice>(`/invoices/${id}/pay`, { is_paid: isPaid });
  return response.data;
};
