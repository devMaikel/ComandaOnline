import { API_URL } from "@/constants/GeneralConstants";
import { getToken } from "./login";

export type WaiterReport = {
  waiterId: string;
  waiterName: string; // Novo campo
  waiterEmail: string;
  openCommandsCount: number;
  closedCommandsCount: number;
  itemsSold: number;
  totalRevenue: number;
};

export type WaitersReportResponse = {
  period: string;
  startDate: string;
  endDate: string;
  waiters: WaiterReport[];
};

export async function getWaitersLast7DaysReport(
  barId: string
): Promise<WaitersReportResponse> {
  const token = await getToken();
  const response = await fetch(
    `${API_URL}/waiters/reports?barId=${barId}&period=week`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Erro ao buscar relatório dos garçons");
  }

  return await response.json();
}

export async function getWaitersLastMonthReport(
  barId: string
): Promise<WaitersReportResponse> {
  const token = await getToken();
  const response = await fetch(
    `${API_URL}/waiters/reports?barId=${barId}&period=month`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  console.log(`${API_URL}/waiters/reports?barId=${barId}&period=month`, token);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Erro ao buscar relatório dos garçons");
  }

  const data = await response.json();

  console.log(data);

  return data;
}

export async function getWaitersCustomPeriodReport(
  barId: string,
  startDate: string,
  endDate: string
): Promise<WaitersReportResponse> {
  const token = await getToken();
  const response = await fetch(
    `${API_URL}/waiters/reports?barId=${barId}&period=custom&start=${startDate}&end=${endDate}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Erro ao buscar relatório dos garçons");
  }

  return await response.json();
}
