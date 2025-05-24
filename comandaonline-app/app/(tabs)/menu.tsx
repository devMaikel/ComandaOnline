import { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
} from "react-native";
import { Bar, getMyBar } from "@/services/bar";
import {
  createMenuItem,
  deleteMenuItem,
  getMenuItems,
  MenuItem,
  updateMenuItem,
} from "@/services/menuItems";
import { getToken } from "@/services/login";
import { useGeneralContext } from "@/context/GeneralContext";

export default function MenuScreen() {
  const [bars, setBars] = useState<Bar[]>([]);
  const [selectedBar, setSelectedBar] = useState<Bar | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [addingItem, setAddingItem] = useState(false);
  const { showLoading, hideLoading } = useGeneralContext();

  useEffect(() => {
    loadBars();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedBar) {
      loadMenuItems(selectedBar.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBar]);

  const loadBars = async () => {
    showLoading();
    try {
      const token = await getToken();
      if (token) {
        const bar = await getMyBar(token);
        if (bar) {
          setBars([bar]);
          setSelectedBar(bar);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar bares:", error);
      Alert.alert("Erro", "Não foi possível carregar os bares");
    } finally {
      hideLoading();
    }
  };

  const loadMenuItems = async (barId: string) => {
    showLoading();
    try {
      const items = await getMenuItems(barId);
      setMenuItems(items);
    } catch (error) {
      console.error("Erro ao carregar itens:", error);
      Alert.alert("Erro", "Não foi possível carregar os itens do menu");
    } finally {
      hideLoading();
    }
  };

  const handleAddItem = async () => {
    if (!selectedBar || !newItemName || !newItemPrice) return;
    showLoading();
    try {
      const price = parseFloat(newItemPrice);
      const newItem = await createMenuItem(newItemName, price, selectedBar.id);
      setMenuItems([...menuItems, newItem]);
      setNewItemName("");
      setNewItemPrice("");
      Alert.alert("Item adicionado com sucesso");
    } catch (error) {
      console.error("Erro ao criar item:", error);
      Alert.alert("Erro", "Não foi possível adicionar o item");
    } finally {
      hideLoading();
    }
  };

  const handleUpdateItem = async () => {
    if (!editingItem || !newItemName || !newItemPrice) return;
    showLoading();
    try {
      const price = parseFloat(newItemPrice);
      const updatedItem = await updateMenuItem(editingItem.id, {
        name: newItemName,
        price,
      });

      setMenuItems(
        menuItems.map((item) =>
          item.id === updatedItem.id ? updatedItem : item
        )
      );

      setEditingItem(null);
      setNewItemName("");
      setNewItemPrice("");
      Alert.alert("Item atualizado com sucesso");
    } catch (error) {
      console.error("Erro ao atualizar item:", error);
      Alert.alert("Erro", "Não foi possível atualizar o item");
    } finally {
      hideLoading();
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    Alert.alert(
      "Confirmar exclusão",
      "Tem certeza que deseja excluir este item?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          onPress: async () => {
            try {
              showLoading();
              await deleteMenuItem(itemId);
              setMenuItems(menuItems.filter((item) => item.id !== itemId));
              Alert.alert("Item excluido com sucesso");
            } catch (error) {
              console.error("Erro ao excluir item:", error);
              Alert.alert("Erro", "Não foi possível excluir o item");
            } finally {
              hideLoading();
            }
          },
        },
      ]
    );
  };

  const startEditing = (item: MenuItem) => {
    setEditingItem(item);
    setNewItemName(item.name);
    setNewItemPrice(item.price.toString());
  };

  const cancelEditing = () => {
    setEditingItem(null);
    setNewItemName("");
    setNewItemPrice("");
  };

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: "#f5f5f5" }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
          paddingVertical: 12,
          paddingHorizontal: 16,
          backgroundColor: "#6f42c1",
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
            Cardápio do Bar
          </Text>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: "white",
            }}
          >
            {selectedBar?.name || "Selecione um bar"}
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
              {menuItems.length}
            </Text>
          </View>
          <Text
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.8)",
              marginTop: 4,
            }}
          >
            Itens
          </Text>
        </View>
      </View>

      <View style={{ marginBottom: 8 }}>
        <Text
          style={{
            fontSize: 14,
            color: "#333",
            marginBottom: 4,
          }}
        >
          Selecione o Bar:
        </Text>
        {bars.length > 0 ? (
          <FlatList
            horizontal
            data={bars}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  marginRight: 10,
                  backgroundColor:
                    selectedBar?.id === item.id ? "#5a3d9e" : "#e0e0e0",
                  borderRadius: 20,
                }}
                onPress={() => setSelectedBar(item)}
              >
                <Text
                  style={{
                    color: selectedBar?.id === item.id ? "white" : "#333",
                  }}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
        ) : (
          <Text style={{ color: "#666" }}>Nenhum bar cadastrado</Text>
        )}
      </View>

      <View
        style={{
          marginBottom: 20,
          backgroundColor: "white",
          padding: 15,
          borderRadius: 8,
          elevation: 2,
        }}
      >
        {/* <Text
          style={{
            fontSize: 18,
            fontWeight: "bold",
            marginBottom: 15,
            color: "#333",
          }}
        >
          {editingItem ? "Editar Item" : "Adicionar Novo Item"}
        </Text> */}

        {(addingItem || editingItem) && (
          <>
            <TextInput
              placeholder="Nome do item"
              value={newItemName}
              onChangeText={setNewItemName}
              style={{
                borderWidth: 1,
                borderColor: "#ddd",
                padding: 10,
                marginBottom: 10,
                borderRadius: 5,
              }}
            />

            <TextInput
              placeholder="Preço"
              value={newItemPrice}
              onChangeText={setNewItemPrice}
              keyboardType="numeric"
              style={{
                borderWidth: 1,
                borderColor: "#ddd",
                padding: 10,
                marginBottom: 15,
                borderRadius: 5,
              }}
            />
          </>
        )}

        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          {editingItem ? (
            <>
              <TouchableOpacity
                onPress={cancelEditing}
                style={{
                  backgroundColor: "#6c757d",
                  padding: 10,
                  borderRadius: 5,
                  width: "48%",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "white" }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleUpdateItem}
                style={{
                  backgroundColor: "#28a745",
                  padding: 10,
                  borderRadius: 5,
                  width: "48%",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "white" }}>Salvar</Text>
              </TouchableOpacity>
            </>
          ) : addingItem ? (
            <>
              <TouchableOpacity
                onPress={() => setAddingItem(false)}
                style={{
                  backgroundColor: "#6c757d",
                  padding: 10,
                  borderRadius: 5,
                  width: "48%",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "white" }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddItem}
                style={{
                  backgroundColor: "#28a745",
                  padding: 10,
                  borderRadius: 5,
                  width: "48%",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "white" }}>Adicionar Item</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              onPress={() => setAddingItem(true)}
              style={{
                backgroundColor: "#28a745",
                padding: 10,
                borderRadius: 5,
                width: "100%",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "white" }}>Adicionar Novo Item</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {selectedBar && (
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "bold",
              marginBottom: 10,
              color: "#333",
            }}
          >
            Itens do Menu:
          </Text>

          {menuItems.length > 0 ? (
            <FlatList
              data={menuItems}
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
                  <View>
                    <Text
                      style={{ fontSize: 16, fontWeight: "600", color: "#333" }}
                    >
                      {item.name}
                    </Text>
                    <Text style={{ color: "#28a745", marginTop: 5 }}>
                      R$ {item.price.toFixed(2)}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row" }}>
                    <TouchableOpacity
                      onPress={() => startEditing(item)}
                      style={{
                        backgroundColor: "#ffc107",
                        padding: 8,
                        borderRadius: 5,
                        marginRight: 10,
                      }}
                    >
                      <Text style={{ color: "white" }}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteItem(item.id)}
                      style={{
                        backgroundColor: "#dc3545",
                        padding: 8,
                        borderRadius: 5,
                      }}
                    >
                      <Text style={{ color: "white" }}>Excluir</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          ) : (
            <Text style={{ color: "#666", textAlign: "center", marginTop: 20 }}>
              Nenhum item cadastrado neste bar
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
