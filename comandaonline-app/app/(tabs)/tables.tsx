import { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Pressable,
} from "react-native";
import { getTables, createTable, deleteTable, Table } from "@/services/tables";
import { Bar, getMyBar } from "@/services/bar";
import { useGeneralContext } from "@/context/GeneralContext";

export default function TablesScreen() {
  const [tables, setTables] = useState<Table[]>([]);
  const [bar, setBar] = useState<Bar | null>(null);
  const [newTableNumber, setNewTableNumber] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const { userToken, refresh } = useGeneralContext();

  useEffect(() => {
    loadBarAndTables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadBarAndTables = async () => {
    try {
      setLoading(true);
      if (userToken) {
        const barData = await getMyBar(userToken);
        if (barData) {
          setBar(barData);
          const tablesData = await getTables(barData.id);
          setTables(tablesData);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar mesas:", error);
      Alert.alert("Erro", "Não foi possível carregar as mesas");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTable = async () => {
    if (!newTableNumber || !bar) return;
    try {
      setLoading(true);
      const tableNumber = parseInt(newTableNumber);
      if (isNaN(tableNumber)) {
        Alert.alert("Erro", "Número da mesa deve ser um valor numérico");
        return;
      }

      const newTable = await createTable(bar.id, tableNumber);
      setTables([...tables, newTable]);
      setNewTableNumber("");
      setModalVisible(false);
      Alert.alert("Sucesso", "Mesa adicionada com sucesso");
    } catch (error) {
      console.error("Erro ao adicionar mesa:", error);
      Alert.alert(
        "Erro",
        error instanceof Error
          ? error.message
          : "Não foi possível adicionar a mesa"
      );
    } finally {
      refresh();
      setLoading(false);
    }
  };

  const handleDeleteTable = async (tableId: string) => {
    Alert.alert(
      "Confirmar exclusão",
      "Tem certeza que deseja excluir esta mesa?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          onPress: async () => {
            try {
              setLoading(true);
              await deleteTable(tableId);
              setTables(tables.filter((table) => table.id !== tableId));
              Alert.alert("Sucesso", "Mesa excluída com sucesso");
            } catch (error: any) {
              console.error("Erro ao excluir mesa:", error);
              if (error.message) {
                Alert.alert("Erro", error?.message);
              } else {
                Alert.alert("Erro", "Não foi possível excluir a mesa");
              }
            } finally {
              refresh();
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: "#f5f5f5" }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          paddingVertical: 12,
          paddingHorizontal: 16,
          backgroundColor: "#c8b080",
          borderRadius: 10,
          elevation: 3,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          marginTop: 16,
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
            Gerenciamento de mesas
          </Text>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: "white",
            }}
          >
            {bar?.name || "Carregando..."}
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
              {tables.length}
            </Text>
          </View>
          <Text
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.8)",
              marginTop: 4,
            }}
          >
            Mesas
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={{
          backgroundColor: "#28a745",
          padding: 15,
          borderRadius: 8,
          marginBottom: 20,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "white", fontWeight: "bold" }}>
          Adicionar Mesa
        </Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <View
            style={{
              width: "80%",
              backgroundColor: "white",
              borderRadius: 10,
              padding: 20,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                marginBottom: 15,
                textAlign: "center",
              }}
            >
              Nova Mesa
            </Text>

            <Text style={{ marginBottom: 5 }}>Número da Mesa:</Text>
            <TextInput
              value={newTableNumber}
              onChangeText={setNewTableNumber}
              keyboardType="numeric"
              maxLength={3}
              style={{
                borderWidth: 1,
                borderColor: "#ddd",
                padding: 10,
                marginBottom: 15,
                borderRadius: 5,
                color: "#000000",
                backgroundColor: "#fff",
              }}
              placeholder="Digite o número da mesa"
            />

            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Pressable
                style={{
                  borderRadius: 5,
                  padding: 10,
                  width: "48%",
                  alignItems: "center",
                  backgroundColor: "#6c757d",
                }}
                onPress={() => {
                  setNewTableNumber("");
                  setModalVisible(false);
                }}
              >
                <Text style={{ color: "white", fontWeight: "bold" }}>
                  Cancelar
                </Text>
              </Pressable>
              <Pressable
                style={{
                  borderRadius: 5,
                  padding: 10,
                  width: "48%",
                  alignItems: "center",
                  backgroundColor: !newTableNumber ? "#cccccc" : "#28a745",
                  opacity: !newTableNumber ? 0.5 : 1,
                }}
                onPress={handleAddTable}
                disabled={!newTableNumber || loading}
              >
                <Text style={{ color: "white", fontWeight: "bold" }}>
                  {loading ? "Adicionando..." : "Adicionar"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {loading && !tables.length ? (
        <Text style={{ textAlign: "center", marginTop: 20 }}>
          Carregando mesas...
        </Text>
      ) : tables.length > 0 ? (
        <FlatList
          data={tables}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View
              style={{
                backgroundColor: "white",
                padding: 15,
                marginBottom: 10,
                borderRadius: 8,
                elevation: 2,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "600" }}>
                Mesa {item.number}
              </Text>
              <TouchableOpacity
                onPress={() => handleDeleteTable(item.id)}
                style={{
                  backgroundColor: "#dc3545",
                  padding: 8,
                  borderRadius: 5,
                }}
              >
                <Text style={{ color: "white" }}>Excluir</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      ) : (
        <Text style={{ textAlign: "center", marginTop: 20, color: "#6c757d" }}>
          Nenhuma mesa cadastrada
        </Text>
      )}
    </View>
  );
}
