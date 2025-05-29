import { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { useGeneralContext } from "@/context/GeneralContext";
import { getMyBar } from "@/services/bar";
import { getOpenCommands } from "@/services/commands";
import { getMenuItems } from "@/services/menuItems";
import { getTables } from "@/services/tables";
import { router } from "expo-router";
import {
  getLast12HoursRevenue,
  getLast7DaysRevenue,
  getLastMonthRevenue,
  ReportResponse,
} from "@/services/reports";
import {
  getWaitersLastMonthReport,
  WaitersReportResponse,
} from "@/services/waiters";

export default function HomeScreen() {
  const {
    showLoading,
    hideLoading,
    userToken,
    userRole,
    userEmail,
    refreshNumber,
    refresh,
  } = useGeneralContext();
  const [bar, setBar] = useState<any>(null);
  const [openCommands, setOpenCommands] = useState<any[]>([]);
  const [menuItemsCount, setMenuItemsCount] = useState(0);
  const [tablesCount, setTablesCount] = useState(0);
  const [weekRevenue, setWeekRevenue] = useState<ReportResponse | null>(null);
  const [monthRevenue, setMonthRevenue] = useState<ReportResponse | null>(null);
  const [waitersReport, setWaitersReport] =
    useState<WaitersReportResponse | null>(null);
  const [last12HoursRevenue, setLast12HoursRevenue] =
    useState<ReportResponse | null>(null);

  useEffect(() => {
    if (!userToken) {
      refresh();
      router.replace("/login");
    }
    loadHomeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshNumber]);

  const loadHomeData = async () => {
    try {
      showLoading();
      if (userToken) {
        // Carrega dados básicos do bar
        const barData = await getMyBar(userToken);
        if (barData) {
          setBar(barData);

          // Carrega comandas abertas
          const commands = await getOpenCommands(barData.id);
          setOpenCommands(commands);

          // Carrega contagem de itens do menu
          const menuItems = await getMenuItems(barData.id);
          setMenuItemsCount(menuItems.length);

          // Carrega contagem de mesas
          const tables = await getTables(barData.id);
          setTablesCount(tables.length);

          // Carrega relatórios (apenas para owner)
          if (userRole === "OWNER") {
            console.log("carregando relatórios");
            const weekData = await getLast7DaysRevenue(barData.id);
            setWeekRevenue(weekData);

            const monthData = await getLastMonthRevenue(barData.id);
            setMonthRevenue(monthData);

            const waitersData = await getWaitersLastMonthReport(barData.id);
            setWaitersReport(waitersData);

            const last12HoursData = await getLast12HoursRevenue(barData.id);
            setLast12HoursRevenue(last12HoursData);
          }
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados da home:", error);
      Alert.alert("Erro", "Não foi possível carregar os dados iniciais");
    } finally {
      hideLoading();
    }
  };

  const MetricCard = ({ title, value, color = "#fa4069", onPress }: any) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1,
        backgroundColor: color,
        borderRadius: 10,
        padding: 8,
        margin: 8,
        marginBottom: 4,
        marginTop: 0,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        width: "95%",
      }}
    >
      <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 14 }}>
        {title}
      </Text>
      <Text
        style={{
          color: "white",
          fontSize: 24,
          fontWeight: "700",
          marginTop: 4,
        }}
      >
        {value}
      </Text>
    </TouchableOpacity>
  );

  const RevenueMetricCard = ({
    title,
    revenue,
    commandsCount,
    itemsSold,
    color = "#fa4069",
    onPress,
  }: any) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1,
        backgroundColor: color,
        borderRadius: 10,
        padding: 12,
        margin: 8,
        marginTop: 0,
        marginBottom: 4,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        width: "95%",
      }}
    >
      <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 14 }}>
        {title}
      </Text>
      <Text
        style={{
          color: "white",
          fontSize: 24,
          fontWeight: "700",
          marginTop: 4,
        }}
      >
        R$ {revenue}
      </Text>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 8,
        }}
      >
        <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>
          {commandsCount} comandas
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>
          {itemsSold} itens
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Seção de relatórios para o dono
  const RevenueReports = () => {
    if (userRole !== "OWNER") return null;

    return (
      <View style={{ marginTop: 16 }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "bold",
            marginVertical: 4,
            color: "#333",
          }}
        >
          Relatórios de Receita
        </Text>

        <View style={{ flexDirection: "column", flexWrap: "wrap" }}>
          <RevenueMetricCard
            title="Últimas 12 horas"
            revenue={last12HoursRevenue?.totalRevenue.toFixed(2) || "0,00"}
            commandsCount={last12HoursRevenue?.totalCommands || 0}
            itemsSold={last12HoursRevenue?.itemsSold || 0}
            color="#17a2b8"
          />
          <RevenueMetricCard
            title="Últimos 7 dias"
            revenue={weekRevenue?.totalRevenue.toFixed(2) || "0,00"}
            commandsCount={weekRevenue?.totalCommands || 0}
            itemsSold={weekRevenue?.itemsSold || 0}
            color="#6f42c1"
          />
          <RevenueMetricCard
            title="Último mês"
            revenue={monthRevenue?.totalRevenue.toFixed(2) || "0,00"}
            commandsCount={monthRevenue?.totalCommands || 0}
            itemsSold={monthRevenue?.itemsSold || 0}
            color="#c8b080"
          />
        </View>
      </View>
    );
  };

  // Seção de desempenho dos garçons
  const WaitersPerformance = () => {
    if (userRole !== "OWNER" || !waitersReport) return null;

    return (
      <View style={{ marginTop: 16 }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "bold",
            marginVertical: 4,
            color: "#333",
          }}
        >
          Dados dos Garçons Neste Mês
        </Text>

        <FlatList
          scrollEnabled={false}
          data={waitersReport.waiters}
          keyExtractor={(item) => item.waiterId}
          renderItem={({ item }) => (
            <View
              style={{
                backgroundColor: "white",
                padding: 16,
                marginBottom: 8,
                borderRadius: 8,
                elevation: 2,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "600" }}>
                {item.waiterName} / {item.waiterEmail}
              </Text>

              <View style={{ flexDirection: "row", marginTop: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#6c757d" }}>Comandas:</Text>
                  <Text>
                    <Text style={{ fontWeight: "bold" }}>
                      {item.openCommandsCount}
                    </Text>{" "}
                    abertas /{" "}
                    <Text style={{ fontWeight: "bold" }}>
                      {item.closedCommandsCount}
                    </Text>{" "}
                    fechadas
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#6c757d" }}>Vendas:</Text>
                  <Text>
                    <Text style={{ fontWeight: "bold" }}>{item.itemsSold}</Text>{" "}
                    itens /{" "}
                    <Text style={{ fontWeight: "bold", color: "#28a745" }}>
                      R$ {item.totalRevenue.toFixed(2)}
                    </Text>
                  </Text>
                </View>
              </View>
            </View>
          )}
        />
      </View>
    );
  };

  return (
    <ScrollView style={{ flex: 1, padding: 16, backgroundColor: "#f5f5f5" }}>
      {/* Cabeçalho */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
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
        <View>
          <Text
            style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.8)",
              marginBottom: 2,
            }}
          >
            Bem-vindo,{" "}
            {userRole === "OWNER"
              ? "Administrador"
              : userRole === "WAITER"
              ? "Garçom"
              : userRole === "MANAGER"
              ? "Gerente"
              : "Desconhecido"}
          </Text>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: "white",
            }}
          >
            {bar?.name || "Meu Bar"}
          </Text>
        </View>
        <View style={{ alignItems: "center" }}>
          <View
            style={{
              backgroundColor: "rgba(255,255,255,0.2)",
              borderRadius: 20,
              padding: 5,
              minWidth: 40,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "bold", color: "white" }}>
              {userRole === "OWNER"
                ? "Administrador"
                : userRole === "WAITER"
                ? "Garçom"
                : userRole === "MANAGER"
                ? "Gerente"
                : "Desconhecido"}
            </Text>
          </View>
          <Text
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.8)",
              marginTop: 4,
            }}
          >
            {userEmail}
          </Text>
        </View>
      </View>

      {/* Métricas */}
      <View style={{ flexDirection: "column", flexWrap: "wrap" }}>
        <MetricCard
          title="Comandas Abertas no Momento"
          value={openCommands.length}
          color="#fa4069"
          onPress={() => router.push("/(tabs)/commands")}
        />

        {userRole === "OWNER" && (
          <>
            <MetricCard
              title="Itens no Menu"
              value={menuItemsCount}
              color="#6f42c1"
              onPress={() => router.push("/(tabs)/menu")}
            />
            <MetricCard
              title="Mesas Cadastradas"
              value={tablesCount}
              color="#c8b080"
              onPress={() => router.push("/(tabs)/tables")}
            />
          </>
        )}
      </View>

      {/* Relatórios de receita (apenas para dono) */}
      <RevenueReports />

      {/* Desempenho dos garçons (apenas para dono) */}
      <WaitersPerformance />

      {/* Comandas recentes */}
      <Text
        style={{
          fontSize: 18,
          fontWeight: "bold",
          marginVertical: 8,
          color: "#333",
        }}
      >
        {userRole === "OWNER" ? "Comandas Ativas" : "Minhas Comandas"}
      </Text>

      {openCommands.length > 0 ? (
        <FlatList
          scrollEnabled={false}
          data={openCommands}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() =>
                router.push(`/(tabs)/commands?commandId=${item.id}`)
              }
              style={{
                backgroundColor: "white",
                padding: 16,
                marginBottom: 8,
                borderRadius: 8,
                elevation: 2,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <View>
                  <Text style={{ fontSize: 16, fontWeight: "600" }}>
                    Mesa {item.table?.number || item.tableId}
                  </Text>
                  <Text style={{ color: "#6c757d", marginTop: 4 }}>
                    {new Date(item.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
                <View>
                  <Text style={{ color: "#28a745", fontWeight: "bold" }}>
                    R$ {item.total?.toFixed(2) || "0,00"}
                  </Text>
                  <Text
                    style={{
                      color: "#6c757d",
                      textAlign: "right",
                      marginTop: 4,
                    }}
                  >
                    {item.items?.length || 0} itens
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <View
          style={{
            backgroundColor: "white",
            padding: 16,
            borderRadius: 8,
            elevation: 2,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#6c757d" }}>
            Nenhuma comanda aberta no momento
          </Text>
        </View>
      )}

      {/* Espaço extra no final */}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

