import { API_URL } from "@/constants/GeneralConstants";
import { getToken } from "./login";

export type Table = {
  id: string;
  number: number;
  barId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export async function getTables(barId: string): Promise<Table[]> {
  const token = await getToken();
  const response = await fetch(`${API_URL}/tables?barId=${barId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Erro ao buscar mesas");
  }

  return await response.json();
}

export async function createTable(
  barId: string,
  number: number
): Promise<Table> {
  const token = await getToken();
  const response = await fetch(`${API_URL}/tables`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ barId, number }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Erro ao criar mesa");
  }

  return await response.json();
}

export async function deleteTable(tableId: string): Promise<void> {
  const token = await getToken();
  const response = await fetch(`${API_URL}/tables?tableId=${tableId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Erro ao excluir mesa");
  }
}
