import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { useGeneralContext } from "@/context/GeneralContext";
import { getMyBar } from "@/services/bar";
import { getFullReport } from "@/services/reports";
import { router } from "expo-router";

export default function ReportsScreen() {
  const { userToken, showLoading, hideLoading, refreshNumber } =
    useGeneralContext();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [bar, setBar] = useState<any>(null);
  const [period, setPeriod] = useState<"12hours" | "week" | "month">("12hours");
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    loadBarAndReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userToken, refreshNumber, period]);

  const loadBarAndReport = async () => {
    try {
      showLoading();
      if (userToken) {
        const barData = await getMyBar(userToken);
        if (barData) {
          setBar(barData);
          const reportData = await getFullReport(barData.id, period);
          setReport(reportData);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar relatório:", error);
    } finally {
      hideLoading();
    }
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace(".", ",")}`;
  };

  const PeriodButton = ({
    title,
    value,
  }: {
    title: string;
    value: typeof period;
  }) => (
    <TouchableOpacity
      onPress={() => setPeriod(value)}
      style={{
        padding: 10,
        backgroundColor: period === value ? "#007bff" : "#e9ecef",
        borderRadius: 5,
        marginRight: 10,
      }}
    >
      <Text style={{ color: period === value ? "white" : "#495057" }}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={{ flex: 1, padding: 16, backgroundColor: "#f5f5f5" }}>
      {/* Cabeçalho */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          marginBottom: 16,
          marginTop: 16,
          paddingVertical: 12,
          paddingHorizontal: 16,
          backgroundColor: "#007bff",
          borderRadius: 10,
          elevation: 3,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
        }}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: "700",
            color: "white",
          }}
        >
          Relatórios Completos
        </Text>
      </View>
      <TouchableOpacity
        style={{
          backgroundColor: "#dc3545",
          padding: 16,
          borderRadius: 8,
          alignItems: "center",
          width: "100%",
          marginBottom: 16,
        }}
        onPress={() => router.replace("/(tabs)/login")}
      >
        <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
          Fechar relatório
        </Text>
      </TouchableOpacity>

      {/* Seletor de período */}
      <View style={{ flexDirection: "row", marginBottom: 16 }}>
        <PeriodButton title="Últimas 12h" value="12hours" />
        <PeriodButton title="Última semana" value="week" />
        <PeriodButton title="Último mês" value="month" />
      </View>

      {report ? (
        <>
          {/* Resumo geral */}
          <View
            style={{
              backgroundColor: "white",
              padding: 16,
              borderRadius: 8,
              marginBottom: 16,
              elevation: 2,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 8 }}>
              Resumo Geral
            </Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <Text>Total de Comandas:</Text>
              <Text style={{ fontWeight: "bold" }}>{report.totalCommands}</Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <Text>Itens Vendidos:</Text>
              <Text style={{ fontWeight: "bold" }}>{report.itemsSold}</Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Text>Receita Total:</Text>
              <Text style={{ fontWeight: "bold", color: "#28a745" }}>
                {formatCurrency(report.totalRevenue)}
              </Text>
            </View>
          </View>

          {/* Vendas por produto */}
          <View
            style={{
              backgroundColor: "white",
              padding: 16,
              borderRadius: 8,
              marginBottom: 16,
              elevation: 2,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 8 }}>
              Vendas por Produto
            </Text>
            <FlatList
              scrollEnabled={false}
              data={report.salesByProduct.sort(
                (a: any, b: any) => b.totalRevenue - a.totalRevenue
              )}
              keyExtractor={(item) => item.productId}
              renderItem={({ item }) => (
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    paddingVertical: 8,
                    borderBottomWidth: 1,
                    borderBottomColor: "#f1f1f1",
                  }}
                >
                  <View style={{ flex: 2 }}>
                    <Text style={{ fontWeight: "500" }}>
                      {item.productName}
                    </Text>
                    <Text style={{ fontSize: 12, color: "#6c757d" }}>
                      {item.quantitySold} un.
                    </Text>
                  </View>
                  <Text
                    style={{ flex: 1, textAlign: "right", color: "#28a745" }}
                  >
                    {formatCurrency(item.totalRevenue)}
                  </Text>
                </View>
              )}
            />
          </View>

          {/* Desempenho por garçom */}
          <View
            style={{
              backgroundColor: "white",
              padding: 16,
              borderRadius: 8,
              marginBottom: 16,
              elevation: 2,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 8 }}>
              Desempenho por Garçom
            </Text>
            <FlatList
              scrollEnabled={false}
              data={report.waitersReport.sort(
                (a: any, b: any) => b.totalRevenue - a.totalRevenue
              )}
              keyExtractor={(item) => item.waiterId}
              renderItem={({ item }) => (
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    paddingVertical: 8,
                    borderBottomWidth: 1,
                    borderBottomColor: "#f1f1f1",
                  }}
                >
                  <View style={{ flex: 2 }}>
                    <Text style={{ fontWeight: "500" }}>{item.waiterName}</Text>
                    <Text style={{ fontSize: 12, color: "#6c757d" }}>
                      {item.commandsClosed} comandas
                    </Text>
                  </View>
                  <Text
                    style={{ flex: 1, textAlign: "right", color: "#28a745" }}
                  >
                    {formatCurrency(item.totalRevenue)}
                  </Text>
                </View>
              )}
            />
          </View>
        </>
      ) : (
        <View
          style={{
            backgroundColor: "white",
            padding: 16,
            borderRadius: 8,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#6c757d" }}>Carregando relatórios...</Text>
        </View>
      )}
    </ScrollView>
  );
}
