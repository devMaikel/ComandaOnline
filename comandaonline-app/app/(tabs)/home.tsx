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
import { getOpenCommands, Command } from "@/services/commands";
import { getMenuItems } from "@/services/menuItems";
import { getTables } from "@/services/tables";
import { router } from "expo-router";

export default function HomeScreen() {
  const {
    showLoading,
    hideLoading,
    userToken,
    userRole,
    userEmail,
    refreshNumber,
  } = useGeneralContext();
  const [bar, setBar] = useState<any>(null);
  const [openCommands, setOpenCommands] = useState<Command[]>([]);
  const [menuItemsCount, setMenuItemsCount] = useState(0);
  const [tablesCount, setTablesCount] = useState(0);
  const [todayRevenue, setTodayRevenue] = useState(0);

  useEffect(() => {
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

          // Calcula receita do dia (simplificado - você pode criar um endpoint específico para isso)
          const revenue = commands.reduce(
            (sum, cmd) => sum + (cmd.total || 0),
            0
          );
          setTodayRevenue(revenue);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados da home:", error);
      Alert.alert("Erro", "Não foi possível carregar os dados iniciais");
    } finally {
      hideLoading();
    }
  };

  // Card genérico para métricas
  const MetricCard = ({ title, value, color = "#fa4069", onPress }: any) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1,
        backgroundColor: color,
        borderRadius: 10,
        padding: 16,
        margin: 8,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        width: "98%",
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

  // Seção de ações rápidas
  const QuickActions = () => (
    <View style={{ flexDirection: "row", marginVertical: 16 }}>
      <TouchableOpacity
        onPress={() => router.push("/(tabs)/commands")}
        style={{
          backgroundColor: "#28a745",
          padding: 12,
          borderRadius: 8,
          marginRight: 8,
          flex: 1,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "white", fontWeight: "bold" }}>Comandas</Text>
      </TouchableOpacity>

      {userRole === "OWNER" && (
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/menu")}
          style={{
            backgroundColor: "#6f42c1",
            padding: 12,
            borderRadius: 8,
            marginRight: 8,
            flex: 1,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontWeight: "bold" }}>Cardápio</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        onPress={() => router.push("/(tabs)/tables")}
        style={{
          backgroundColor: "#c8b080",
          padding: 12,
          borderRadius: 8,
          flex: 1,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "white", fontWeight: "bold" }}>Mesas</Text>
      </TouchableOpacity>
    </View>
  );

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
            Bem-vindo, {userRole === "OWNER" ? "Administrador" : "Atendente"}
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
              {userRole === "OWNER" ? "Administrador" : "Atendente"}
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
        {userRole === "WAITER" && <></>}
        <MetricCard
          title="Comandas Abertas"
          value={openCommands.length}
          color="#fa4069"
          onPress={() => router.push("/(tabs)/commands")}
        />

        <MetricCard
          title="Mesas Ativas"
          value={tablesCount}
          color="#c8b080"
          onPress={() => router.push("/(tabs)/tables")}
        />
        {userRole === "OWNER" && (
          <>
            <MetricCard
              title="Receita Hoje"
              value={`R$ ${todayRevenue.toFixed(2)}`}
              color="#28a745"
            />
            <MetricCard
              title="Itens no Menu"
              value={menuItemsCount}
              color="#6f42c1"
              onPress={() => router.push("/(tabs)/menu")}
            />
          </>
        )}
      </View>

      {/* Ações Rápidas */}
      <QuickActions />

      {/* Comandas recentes (destaque para garçons) */}
      <Text
        style={{
          fontSize: 18,
          fontWeight: "bold",
          marginVertical: 8,
          color: "#333",
        }}
      >
        {userRole === "OWNER" ? "Visão Geral" : "Minhas Comandas"}
      </Text>

      {openCommands.length > 0 ? (
        <FlatList
          scrollEnabled={false}
          data={
            userRole === "OWNER"
              ? openCommands
              : openCommands.filter((cmd) => cmd.openedById === userToken)
          }
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
                    R$ {item.total.toFixed(2)}
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
            {userRole === "OWNER"
              ? "Nenhuma comanda aberta no momento"
              : "Você não tem comandas abertas"}
          </Text>
        </View>
      )}

      {/* Espaço extra no final */}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

