import { API_URL } from "@/constants/GeneralConstants";
import { getToken } from "./login";

export type CommandItem = {
  id: string;
  commandId: string;
  menuItemId: string;
  quantity: number;
  notes: string | null;
  addedById: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  menuItem?: {
    id: string;
    name: string;
    price: number;
  };
};

export async function addCommandItem(
  commandId: string,
  menuItemId: string,
  quantity: number,
  notes?: string
): Promise<CommandItem> {
  const token = await getToken();
  const response = await fetch(`${API_URL}/command-items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ commandId, menuItemId, quantity, notes }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Erro ao adicionar item à comanda");
  }

  return await response.json();
}

export async function updateCommandItem(
  itemId: string,
  data: { quantity?: number; notes?: string }
): Promise<CommandItem> {
  const token = await getToken();
  const response = await fetch(`${API_URL}/command-items?itemId=${itemId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Erro ao atualizar item da comanda");
  }

  return await response.json();
}

export async function deleteCommandItem(
  itemId: string,
  commandId: string
): Promise<void> {
  const token = await getToken();
  const response = await fetch(`${API_URL}/command-items`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ itemId, commandId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Erro ao remover item da comanda");
  }
}

export async function getCommandItems(
  commandId: string
): Promise<CommandItem[]> {
  const token = await getToken();
  const response = await fetch(
    `${API_URL}/command-items?commandId=${commandId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Erro ao buscar itens da comanda");
  }

  const data = await response.json();
  return data;
}
