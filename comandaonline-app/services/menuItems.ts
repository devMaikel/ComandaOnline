import { API_URL } from "@/constants/GeneralConstants";
import { getToken } from "./login";

export type MenuItem = {
  id: string;
  name: string;
  price: number;
  barId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export async function createMenuItem(
  name: string,
  price: number,
  barId: string
): Promise<MenuItem> {
  const token = await getToken();
  const response = await fetch(`${API_URL}/menu-items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name, price, barId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Erro ao criar item");
  }
  const data = await response.json();

  return data;
}

export async function getMenuItems(barId: string): Promise<MenuItem[]> {
  const token = await getToken();
  const response = await fetch(`${API_URL}/menu-items?barId=${barId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Erro ao buscar itens");
  }
  const data = await response.json();
  return data;
}

export async function updateMenuItem(
  id: string,
  data: { name?: string; price?: number }
): Promise<MenuItem> {
  const token = await getToken();
  const response = await fetch(`${API_URL}/menu-items`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ id, ...data }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Erro ao atualizar item");
  }

  return await response.json();
}

export async function deleteMenuItem(itemId: string): Promise<void | boolean> {
  const token = await getToken();
  const response = await fetch(`${API_URL}/menu-items?itemId=${itemId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Erro ao deletar item");
  }
  return true;
}
