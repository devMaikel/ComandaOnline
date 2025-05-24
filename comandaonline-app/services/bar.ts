import { API_URL } from "@/constants/GeneralConstants";

export interface Bar {
  id: string;
  name: string;
  ownerId: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getMyBar(token: string): Promise<Bar | null> {
  const res = await fetch(`${API_URL}/bars`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    console.error("Erro ao buscar bar:", await res.json());
    return null;
  }

  const bars: Bar[] = await res.json();
  return bars.length > 0 ? bars[0] : null;
}

export async function createBar(
  name: string,
  token: string
): Promise<Bar | null> {
  const res = await fetch(`${API_URL}/bars`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name }),
  });

  if (!res.ok) {
    console.error("Erro ao criar bar:", await res.json());
    return null;
  }

  return await res.json();
}

export async function updateBar(
  id: string,
  name: string,
  token: string
): Promise<Bar | null> {
  const res = await fetch(`${API_URL}/bars`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ id, name }),
  });

  if (!res.ok) {
    console.error("Erro ao atualizar bar:", await res.json());
    return null;
  }

  return await res.json();
}

export async function deleteBar(id: string, token: string): Promise<boolean> {
  const res = await fetch(`${API_URL}/bars`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ id }),
  });

  if (!res.ok) {
    console.error("Erro ao deletar bar:", await res.json());
    return false;
  }

  return true;
}
