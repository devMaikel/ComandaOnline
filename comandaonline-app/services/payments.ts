import { API_URL } from "@/constants/GeneralConstants";
import { getToken } from "./login";

export type PaymentType =
  | "CASH"
  | "CREDIT_CARD"
  | "DEBIT_CARD"
  | "PIX"
  | "OTHER";

export type Payment = {
  id: string;
  commandId: string;
  amount: number;
  note: string | null;
  paymentType: PaymentType;
  paidById: string;
  createdAt: string;
  updatedAt: string;
  paidBy?: {
    id: string;
    name: string;
    email: string;
  };
};

export async function addPayment(
  commandId: string,
  amount: number,
  paymentType: PaymentType = "CASH",
  note?: string
): Promise<Payment> {
  const token = await getToken();
  const response = await fetch(`${API_URL}/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ commandId, amount, paymentType, note }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Erro ao registrar pagamento");
  }

  return await response.json();
}

export async function getPayments(commandId: string): Promise<Payment[]> {
  const token = await getToken();
  const response = await fetch(`${API_URL}/payments?commandId=${commandId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Erro ao buscar pagamentos");
  }

  return await response.json();
}
