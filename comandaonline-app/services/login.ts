import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "https://comanda-online-theta.vercel.app/api";

type LoginPayload = {
  email: string;
  password: string;
};

type LoginResponse = {
  token: string;
};

type RegisterResponse = {
  id: string;
  email: string;
  role: "OWNER" | "WAITER"; // Adapte se tiver mais tipos de role
  ownerId: string | null;
  deletedAt: string | null;
};

export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/users/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Erro ao fazer login");
  }

  const data = await response.json();
  return data;
}

export async function registerUser(
  payload: LoginPayload
): Promise<RegisterResponse> {
  const response = await fetch(`${API_URL}/users/register-owner`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Erro ao registrar usuário");
  }

  const data = await response.json();
  return data;
}

export async function saveToken(token: string): Promise<void> {
  try {
    await AsyncStorage.setItem("userToken", token);
  } catch (error) {
    console.error("Erro ao salvar o token:", error);
    throw error;
  }
}

export async function getToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem("userToken");
  } catch (error) {
    console.error("Erro ao recuperar o token:", error);
    return null;
  }
}

export async function removeToken(): Promise<void> {
  try {
    await AsyncStorage.removeItem("userToken");
  } catch (error) {
    console.error("Erro ao remover o token:", error);
  }
}
