import { API_URL } from "@/constants/GeneralConstants";
import { getToken } from "./login";

export type CommandStatus = "OPEN" | "CLOSED";

export type Command = {
  paidAmount: number;
  remainingAmount: number;
  id: string;
  tableId: string;
  barId: string;
  openedById: string;
  closedById: string | null;
  status: CommandStatus;
  total: number;
  publicHash: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  deletedAt: string | null;
  table?: {
    id: string;
    number: number;
    name: string;
  };
  openedBy?: {
    id: string;
    email: string;
  };
  closedBy?: {
    id: string;
    email: string;
  } | null;
  items?: {
    id: string;
    quantity: number;
    notes: string | null;
    menuItem: {
      id: string;
      name: string;
      price: number;
    };
  }[];
};

export async function createCommand(
  tableId: string,
  name?: string
): Promise<Command> {
  const token = await getToken();
  const response = await fetch(`${API_URL}/commands`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ tableId, name: name || "" }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Erro ao criar comanda");
  }

  return await response.json();
}

export async function getOpenCommands(barId: string): Promise<Command[]> {
  const token = await getToken();
  const response = await fetch(`${API_URL}/commands?barId=${barId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Erro ao buscar comandas abertas");
  }

  return await response.json();
}

export async function closeCommand(commandId: string): Promise<Command> {
  const token = await getToken();
  const response = await fetch(`${API_URL}/commands?commandId=${commandId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Erro ao fechar comanda");
  }

  return await response.json();
}

export async function getCommandDetails(commandId: string): Promise<Command> {
  const token = await getToken();
  const response = await fetch(`${API_URL}/commands/${commandId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Erro ao buscar detalhes da comanda");
  }

  return await response.json();
}
