import { API_URL } from "@/constants/GeneralConstants";
import { getToken } from "./login";

export type ReportResponse = {
  period: string;
  startDate: string;
  endDate: string;
  totalCommands: number;
  totalRevenue: number;
  itemsSold: number;
  commands: {
    id: string;
    total: number;
    updatedAt: string;
    table: { number: number };
  }[];
};

export type SalesByProductReport = {
  productId: string;
  productName: string;
  quantitySold: number;
  totalRevenue: number;
};

export type FullReportResponse = {
  period: string;
  startDate: string;
  endDate: string;
  totalCommands: number;
  totalRevenue: number;
  itemsSold: number;
  salesByProduct: SalesByProductReport[];
  waitersReport: {
    waiterId: string;
    waiterName: string;
    waiterEmail: string;
    totalRevenue: number;
    commandsClosed: number;
  }[];
};

export async function getLast7DaysRevenue(
  barId: string
): Promise<ReportResponse> {
  const token = await getToken();
  const response = await fetch(
    `${API_URL}/commands/reports?barId=${barId}&period=week`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Erro ao buscar relatório da semana");
  }

  return await response.json();
}

export async function getLastMonthRevenue(
  barId: string
): Promise<ReportResponse> {
  const token = await getToken();
  const response = await fetch(
    `${API_URL}/commands/reports?barId=${barId}&period=month`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Erro ao buscar relatório do mês");
  }

  return await response.json();
}

export async function getCustomPeriodRevenue(
  barId: string,
  startDate: string
): Promise<ReportResponse> {
  const token = await getToken();
  const response = await fetch(
    `${API_URL}/commands/reports?barId=${barId}&period=custom&start=${startDate}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Erro ao buscar relatório customizado");
  }

  return await response.json();
}

export async function getLast12HoursRevenue(
  barId: string
): Promise<ReportResponse> {
  const token = await getToken();
  const response = await fetch(
    `${API_URL}/commands/reports?barId=${barId}&period=12hours`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.message || "Erro ao buscar relatório das últimas 12 horas"
    );
  }

  return await response.json();
}

export async function getFullReport(
  barId: string,
  period: "12hours" | "week" | "month"
): Promise<FullReportResponse> {
  const token = await getToken();
  const response = await fetch(
    `${API_URL}/reports/full?barId=${barId}&period=${period}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  console.log(`${API_URL}/reports/full?barId=${barId}&period=${period}`, token);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Erro ao buscar relatório completo");
  }

  const data = await response.json();

  console.log("data full report: ", data);

  return data;
}
