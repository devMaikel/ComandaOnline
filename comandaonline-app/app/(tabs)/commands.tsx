import { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  ScrollView,
  Modal,
  Pressable,
} from "react-native";
import {
  Command,
  getOpenCommands,
  closeCommand,
  createCommand,
  getClosedCommands,
} from "@/services/commands";
import {
  CommandItem,
  addCommandItem,
  updateCommandItem,
  deleteCommandItem,
  getCommandItems,
} from "@/services/commandItems";
import { getMenuItems, MenuItem } from "@/services/menuItems";
import { Bar, getMyBar } from "@/services/bar";
import { getTables, Table } from "@/services/tables";
import { useGeneralContext } from "@/context/GeneralContext";
import { addPayment, getPayments, Payment } from "@/services/payments";

export default function CommandsScreen() {
  const [commands, setCommands] = useState<Command[]>([]);
  const [selectedCommand, setSelectedCommand] = useState<Command | null>(null);
  const [commandItems, setCommandItems] = useState<CommandItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [bar, setBar] = useState<Bar | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [newItem, setNewItem] = useState({
    menuItemId: "",
    quantity: "1",
    notes: "",
    price: 0,
  });
  const [editingItem, setEditingItem] = useState<CommandItem | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [minimizedMenu, setMinimizedMenu] = useState<boolean>(true);
  const [newCommandName, setNewCommandName] = useState<string>("");
  const [paymentModalVisible, setPaymentModalVisible] =
    useState<boolean>(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentData, setPaymentData] = useState({
    amount: "",
    paymentType: "CASH" as const,
    note: "",
  });
  const [showPayments, setShowPayments] = useState(false);
  const [showClosedCommands, setShowClosedCommands] = useState(false);
  const { userToken, showLoading, hideLoading, refresh, refreshNumber } =
    useGeneralContext();

  useEffect(() => {
    loadBarAndCommands();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshNumber]);

  useEffect(() => {
    if (selectedCommand) {
      loadCommandDetails(selectedCommand.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCommand, refreshNumber]);

  useEffect(() => {
    if (bar?.id) {
      loadTables(bar.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bar]);

  const handleAddPayment = async () => {
    if (!selectedCommand || !paymentData.amount) return;

    try {
      showLoading();
      setPaymentModalVisible(false);
      const amount = parseFloat(paymentData.amount);
      await addPayment(
        selectedCommand.id,
        amount,
        paymentData.paymentType,
        paymentData.note
      );

      // Atualiza os valores da comanda
      const updatedCommand = {
        ...selectedCommand,
        paidAmount: selectedCommand.paidAmount + amount,
        remainingAmount: selectedCommand.remainingAmount - amount,
      };

      setSelectedCommand(updatedCommand);
      setPaymentData({ amount: "", paymentType: "CASH", note: "" });
      refresh();
      Alert.alert("Sucesso", "Pagamento registrado com sucesso");
    } catch (error) {
      console.error("Erro ao registrar pagamento:", error);
      Alert.alert("Erro", "Não foi possível registrar o pagamento");
    } finally {
      hideLoading();
    }
  };

  const loadPayments = async () => {
    if (!selectedCommand) return;

    try {
      showLoading();
      const paymentsData = await getPayments(selectedCommand.id);
      setPayments(paymentsData);
      setShowPayments(true);
    } catch (error) {
      console.error("Erro ao carregar pagamentos:", error);
      Alert.alert("Erro", "Não foi possível carregar os pagamentos");
    } finally {
      hideLoading();
    }
  };

  const loadBarAndCommands = async () => {
    try {
      showLoading();
      if (userToken) {
        const barData = await getMyBar(userToken);
        if (barData) {
          setBar(barData);
          const commandsData = showClosedCommands
            ? await getClosedCommands(barData.id)
            : await getOpenCommands(barData.id);
          setCommands(commandsData);
          const newSelectedComand =
            commandsData.find((c) => c.id === selectedCommand?.id) || null;
          setSelectedCommand(newSelectedComand);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar estabelecimento e comandas:", error);
      Alert.alert("Erro", "Não foi possível carregar as comandas");
    } finally {
      hideLoading();
    }
  };

  const loadTables = async (barId: string) => {
    try {
      showLoading();
      const tablesData = await getTables(barId);
      setTables(tablesData);
    } catch (error) {
      console.error("Erro ao carregar mesas:", error);
      Alert.alert("Erro", "Não foi possível carregar as mesas");
    } finally {
      hideLoading();
    }
  };

  const loadCommandDetails = async (commandId: string) => {
    try {
      showLoading();
      const items = await getCommandItems(commandId);
      setCommandItems(items);

      if (bar) {
        const menuItemsData = await getMenuItems(bar.id);
        setMenuItems(menuItemsData);
      }
    } catch (error) {
      console.error("Erro ao carregar itens da comanda:", error);
      Alert.alert("Erro", "Não foi possível carregar os itens da comanda");
    } finally {
      hideLoading();
    }
  };

  const handleAddItemToCommand = async () => {
    if (!selectedCommand || !newItem.menuItemId || !newItem.quantity) return;

    try {
      showLoading();
      await addCommandItem(
        selectedCommand.id,
        newItem.menuItemId,
        parseInt(newItem.quantity),
        newItem.notes
      );
      // loadCommandDetails(selectedCommand.id);
      refresh();
      setNewItem({ menuItemId: "", quantity: "1", notes: "", price: 0 });
      Alert.alert("Sucesso", "Item adicionado à comanda");
    } catch (error) {
      console.error("Erro ao adicionar item:", error);
      Alert.alert("Erro", "Não foi possível adicionar o item à comanda");
    } finally {
      hideLoading();
    }
  };

  const handleUpdateCommandItem = async () => {
    if (!editingItem || !newItem.quantity || !selectedCommand) return;

    try {
      showLoading();
      const updatedItem = await updateCommandItem(editingItem.id, {
        quantity: parseInt(newItem.quantity),
        notes: newItem.notes,
      });
      console.log("updatedItem: ", updatedItem);

      refresh();

      setEditingItem(null);
      setNewItem({ menuItemId: "", quantity: "1", notes: "", price: 0 });
      Alert.alert("Sucesso", "Item atualizado com sucesso");
    } catch (error) {
      console.error("Erro ao atualizar item:", error);
      Alert.alert("Erro", "Não foi possível atualizar o item");
    } finally {
      hideLoading();
    }
  };

  const handleDeleteCommandItem = async (itemId: string) => {
    Alert.alert(
      "Confirmar exclusão",
      "Tem certeza que deseja remover este item da comanda?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          onPress: async () => {
            try {
              showLoading();
              if (selectedCommand) {
                await deleteCommandItem(itemId, selectedCommand.id);
                refresh();
                Alert.alert("Sucesso", "Item removido da comanda");
              }
            } catch (error) {
              console.error("Erro ao remover item:", error);
              Alert.alert("Erro", "Não foi possível remover o item");
            } finally {
              hideLoading();
            }
          },
        },
      ]
    );
  };

  const handleCloseCommand = async (commandId: string) => {
    Alert.alert(
      "Fechar comanda",
      "Tem certeza que deseja fechar esta comanda?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Fechar",
          onPress: async () => {
            try {
              showLoading();
              await closeCommand(commandId);
              setCommands(commands.filter((cmd) => cmd.id !== commandId));
              setSelectedCommand(null);
              refresh();
              Alert.alert("Sucesso", "Comanda fechada com sucesso");
            } catch (error) {
              console.error("Erro ao fechar comanda:", error);
              Alert.alert("Erro", "Não foi possível fechar a comanda");
            } finally {
              hideLoading();
            }
          },
        },
      ]
    );
  };

  const handleCreateCommand = async () => {
    if (!selectedTable || !bar) return;
    setModalVisible(false);

    try {
      showLoading();
      const newCmd = await createCommand(selectedTable.id, newCommandName);
      console.log("commands: ", commands);
      console.log("newCmd: ", newCmd);
      setNewCommandName("");
      loadBarAndCommands();
      setSelectedTable(null);
      setModalVisible(false);
      refresh();
      Alert.alert("Sucesso", "Comanda criada com sucesso");
    } catch (error) {
      console.error("Erro ao criar comanda:", error);
      Alert.alert("Erro", `${error}`);
    } finally {
      hideLoading();
    }
  };

  const startEditing = (item: CommandItem) => {
    setMinimizedMenu(true);
    setEditingItem(item);
    setNewItem({
      menuItemId: item.menuItemId,
      quantity: item.quantity.toString(),
      notes: item.notes || "",
      price: 0,
    });
  };

  const cancelEditing = () => {
    setEditingItem(null);
    setNewItem({ menuItemId: "", quantity: "1", notes: "", price: 0 });
  };

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: "#f5f5f5" }}>
      {!selectedCommand ? (
        <>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
              paddingVertical: 12,
              paddingHorizontal: 16,
              backgroundColor: "#fa4069",
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
                Gerenciamento de comandas
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
                <Text
                  style={{ fontSize: 16, fontWeight: "bold", color: "white" }}
                >
                  {commands.length}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.8)",
                  marginTop: 4,
                }}
              >
                Comandas
              </Text>
            </View>
          </View>

          <View style={{ marginBottom: 20 }}>
            <TouchableOpacity
              onPress={() => {
                setShowClosedCommands(!showClosedCommands);
                refresh();
              }}
              style={{
                backgroundColor: showClosedCommands ? "#6c757d" : "#17a2b8",
                padding: 15,
                borderRadius: 8,
                marginBottom: 10,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "white", fontWeight: "bold" }}>
                {showClosedCommands
                  ? "Mostrar Comandas Abertas"
                  : "Mostrar Comandas Fechadas"}
              </Text>
            </TouchableOpacity>

            {!showClosedCommands && (
              <TouchableOpacity
                onPress={() => setModalVisible(true)}
                style={{
                  backgroundColor: "#28a745",
                  padding: 15,
                  borderRadius: 8,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "white", fontWeight: "bold" }}>
                  Nova Comanda
                </Text>
              </TouchableOpacity>
            )}
          </View>

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
                  maxHeight: "70%",
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
                  Selecione a Mesa
                </Text>

                <ScrollView style={{ marginBottom: 15 }}>
                  {tables.map((table) => (
                    <Pressable
                      key={table.id}
                      style={({ pressed }) => ({
                        padding: 15,
                        borderBottomWidth: 1,
                        borderBottomColor: "#eee",
                        backgroundColor:
                          selectedTable?.id === table.id
                            ? "#e0e0e0"
                            : pressed
                            ? "#f0f0f0"
                            : "transparent",
                      })}
                      onPress={() => setSelectedTable(table)}
                    >
                      <Text style={{ fontSize: 16 }}>Mesa {table.number}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
                <TextInput
                  placeholder="Nome da comanda"
                  placeholderTextColor="#666666"
                  value={newCommandName}
                  onChangeText={setNewCommandName}
                  style={{
                    height: 50,
                    borderColor: "#ddd",
                    borderWidth: 1,
                    borderRadius: 8,
                    paddingHorizontal: 16,
                    marginBottom: 16,
                    backgroundColor: "#fff",
                    fontSize: 16,
                    color: "#000000",
                  }}
                />

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <TouchableOpacity
                    style={{
                      borderRadius: 5,
                      padding: 10,
                      width: "48%",
                      alignItems: "center",
                      backgroundColor: "#6c757d",
                    }}
                    onPress={() => {
                      setSelectedTable(null);
                      setModalVisible(false);
                    }}
                  >
                    <Text style={{ color: "white", fontWeight: "bold" }}>
                      Cancelar
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      borderRadius: 5,
                      padding: 10,
                      width: "48%",
                      alignItems: "center",
                      backgroundColor: !selectedTable ? "#cccccc" : "#28a745",
                      opacity: !selectedTable ? 0.5 : 1,
                    }}
                    onPress={handleCreateCommand}
                    disabled={!selectedTable}
                  >
                    <Text style={{ color: "white", fontWeight: "bold" }}>
                      Confirmar
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          <FlatList
            data={commands}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={{
                  backgroundColor: "white",
                  padding: 8,
                  marginBottom: 10,
                  borderRadius: 8,
                  elevation: 2,
                }}
                onPress={() => setSelectedCommand(item)}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: "600" }}>
                      Mesa: {item.table?.number || item.tableId}
                    </Text>
                    <Text style={{ color: "#28a745", marginTop: 0 }}>
                      Total: R$ {item.total.toFixed(2)}
                    </Text>
                    {item.name.length > 0 && (
                      <Text style={{ color: "#28a745", marginTop: 0 }}>
                        {item.name}
                      </Text>
                    )}
                    <Text style={{ color: "#6c757d", marginTop: 0 }}>
                      {item.status === "CLOSED" ? "Fechada" : "Aberta"} em:{" "}
                      {item.status === "CLOSED"
                        ? new Date(item.updatedAt).toLocaleString()
                        : new Date(item.createdAt).toLocaleString()}
                    </Text>
                  </View>
                  {item.status === "OPEN" && item.remainingAmount <= 0 && (
                    <TouchableOpacity
                      onPress={() => handleCloseCommand(item.id)}
                      style={{
                        backgroundColor: "#dc3545",
                        padding: 8,
                        borderRadius: 5,
                        justifyContent: "center",
                      }}
                    >
                      <Text style={{ color: "white" }}>Fechar conta</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            )}
          />
        </>
      ) : (
        <>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 2,
              paddingVertical: 12,
              paddingHorizontal: 16,
              backgroundColor: "#fa4069",
              borderRadius: 10,
              elevation: 3,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              marginTop: 16,
            }}
          >
            <TouchableOpacity
              onPress={() => setSelectedCommand(null)}
              style={{
                marginRight: 12,
                backgroundColor: "#e6e6e6",
                padding: 8,
                borderRadius: 5,
              }}
            >
              <Text>Voltar</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 16,
                  color: "rgba(255,255,255,0.8)",
                  marginBottom: 2,
                }}
              >
                Comanda ativa
              </Text>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  color: "white",
                }}
              >
                Mesa {selectedCommand.table?.number || selectedCommand.tableId}{" "}
                - {selectedCommand.name}
              </Text>
            </View>
          </View>
          <Modal
            animationType="slide"
            transparent={true}
            visible={paymentModalVisible}
            onRequestClose={() => setPaymentModalVisible(false)}
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
                  Registrar Pagamento
                </Text>

                <Text style={{ marginBottom: 5 }}>Valor:</Text>
                <TextInput
                  placeholder="0.00"
                  placeholderTextColor="#666666"
                  value={paymentData.amount}
                  onChangeText={(text) =>
                    setPaymentData({ ...paymentData, amount: text })
                  }
                  keyboardType="numeric"
                  style={{
                    height: 50,
                    borderColor: "#ddd",
                    borderWidth: 1,
                    borderRadius: 8,
                    paddingHorizontal: 16,
                    marginBottom: 16,
                    backgroundColor: "#fff",
                    fontSize: 16,
                    color: "#000000",
                  }}
                />

                <Text style={{ marginBottom: 5 }}>Tipo de Pagamento:</Text>
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    marginBottom: 16,
                  }}
                >
                  {["CASH", "CREDIT_CARD", "DEBIT_CARD", "PIX", "OTHER"].map(
                    (type) => (
                      <TouchableOpacity
                        key={type}
                        style={{
                          padding: 10,
                          borderRadius: 5,
                          backgroundColor:
                            paymentData.paymentType === type
                              ? "#28a745"
                              : "#e0e0e0",
                          marginBottom: 8,
                          width: "48%",
                        }}
                        onPress={() =>
                          setPaymentData({
                            ...paymentData,
                            paymentType: type as any,
                          })
                        }
                      >
                        <Text
                          style={{
                            color:
                              paymentData.paymentType === type
                                ? "white"
                                : "black",
                            textAlign: "center",
                          }}
                        >
                          {type === "CASH" && "Dinheiro"}
                          {type === "CREDIT_CARD" && "Cartão Crédito"}
                          {type === "DEBIT_CARD" && "Cartão Débito"}
                          {type === "PIX" && "PIX"}
                          {type === "OTHER" && "Outro"}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>

                <Text style={{ marginBottom: 5 }}>Observação (opcional):</Text>
                <TextInput
                  placeholder="Ex: Cliente pagou metade"
                  placeholderTextColor="#666666"
                  value={paymentData.note}
                  onChangeText={(text) =>
                    setPaymentData({ ...paymentData, note: text })
                  }
                  style={{
                    height: 50,
                    borderColor: "#ddd",
                    borderWidth: 1,
                    borderRadius: 8,
                    paddingHorizontal: 16,
                    marginBottom: 16,
                    backgroundColor: "#fff",
                    fontSize: 16,
                    color: "#000000",
                  }}
                />

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <TouchableOpacity
                    style={{
                      borderRadius: 5,
                      padding: 10,
                      width: "48%",
                      alignItems: "center",
                      backgroundColor: "#6c757d",
                    }}
                    onPress={() => setPaymentModalVisible(false)}
                  >
                    <Text style={{ color: "white", fontWeight: "bold" }}>
                      Cancelar
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      borderRadius: 5,
                      padding: 10,
                      width: "48%",
                      alignItems: "center",
                      backgroundColor: !paymentData.amount
                        ? "#cccccc"
                        : "#28a745",
                      opacity: !paymentData.amount ? 0.5 : 1,
                    }}
                    onPress={handleAddPayment}
                    disabled={!paymentData.amount}
                  >
                    <Text style={{ color: "white", fontWeight: "bold" }}>
                      Confirmar
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {selectedCommand.status === "OPEN" && (
            <View
              style={{
                marginBottom: 8,
                backgroundColor: "white",
                padding: 15,
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
                <Text
                  style={{ fontSize: 16, fontWeight: "bold", marginBottom: 2 }}
                >
                  {editingItem ? "Editar Item" : "Adicionar Item"}
                </Text>
                <TouchableOpacity
                  style={{
                    alignItems: "center",
                    backgroundColor: minimizedMenu ? "#28a745" : "#dc3545",
                    padding: 8,
                    borderRadius: 5,
                  }}
                  onPress={() => setMinimizedMenu(!minimizedMenu)}
                >
                  <Text>{minimizedMenu ? "Expandir" : "Minimizar"}</Text>
                </TouchableOpacity>
              </View>

              <Text style={{ marginBottom: 0 }}>Item do Menu:</Text>
              <ScrollView
                style={{
                  maxHeight:
                    newItem.menuItemId && !minimizedMenu
                      ? 200
                      : minimizedMenu
                      ? 0
                      : 350,
                  marginBottom: 4,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: "#e0e0e0",
                }}
              >
                {menuItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() =>
                      setNewItem({
                        ...newItem,
                        menuItemId: item.id,
                        price: item.price,
                      })
                    }
                    style={{
                      padding: 12,
                      backgroundColor:
                        newItem.menuItemId === item.id ? "#e3f2fd" : "white",
                      borderBottomWidth: 1,
                      borderBottomColor: "#f5f5f5",
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text style={{ fontWeight: "500" }}>{item.name}</Text>
                      <Text style={{ color: "#28a745" }}>
                        R$ {item.price.toFixed(2)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {((newItem.menuItemId && !minimizedMenu) || editingItem) && (
                <>
                  <Text style={{ marginBottom: 5 }}>Quantidade:</Text>
                  <TextInput
                    value={newItem.quantity}
                    onChangeText={(text) =>
                      setNewItem({ ...newItem, quantity: text })
                    }
                    keyboardType="numeric"
                    style={{
                      borderWidth: 1,
                      borderColor: "#ddd",
                      padding: 10,
                      marginBottom: 4,
                      borderRadius: 5,
                      color: "#000000",
                    }}
                  />

                  <Text style={{ marginBottom: 5 }}>Observações:</Text>
                  <TextInput
                    value={newItem.notes}
                    onChangeText={(text) =>
                      setNewItem({ ...newItem, notes: text })
                    }
                    style={{
                      borderWidth: 1,
                      borderColor: "#ddd",
                      padding: 10,
                      marginBottom: 8,
                      borderRadius: 5,
                      color: "#000000",
                    }}
                  />

                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
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
                          onPress={handleUpdateCommandItem}
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
                    ) : (
                      <>
                        <TouchableOpacity
                          onPress={() =>
                            setNewItem({ ...newItem, menuItemId: "" })
                          }
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
                          onPress={handleAddItemToCommand}
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
                    )}
                  </View>
                </>
              )}
            </View>
          )}

          <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 10 }}>
            Itens da Comanda:
          </Text>
          {commandItems.length > 0 ? (
            <FlatList
              data={commandItems}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View
                  style={{
                    backgroundColor: "white",
                    padding: 10,
                    marginBottom: 4,
                    borderRadius: 8,
                    elevation: 2,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text style={{ fontWeight: "600" }}>
                        {item.menuItem?.name || "Item não encontrado"}
                      </Text>
                      <Text style={{ color: "#6c757d", fontSize: 12 }}>
                        {new Date(item.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </View>
                    <Text style={{ color: "#6c757d" }}>
                      Quantidade: {item.quantity}
                    </Text>
                    {item.notes && (
                      <Text style={{ color: "#6c757d" }}>
                        Obs: {item.notes}
                      </Text>
                    )}
                    <Text style={{ color: "#28a745", marginTop: 5 }}>
                      R$ {(item.menuItem?.price || 0) * item.quantity}
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
                      onPress={() => handleDeleteCommandItem(item.id)}
                      style={{
                        backgroundColor: "#dc3545",
                        padding: 8,
                        borderRadius: 5,
                      }}
                    >
                      <Text style={{ color: "white" }}>Remover</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          ) : (
            <Text style={{ color: "#6c757d", textAlign: "center" }}>
              Nenhum item nesta comanda
            </Text>
          )}
          {minimizedMenu && commandItems.length > 0 && (
            <View
              style={{
                backgroundColor: "white",
                padding: 15,
                borderRadius: 8,
                elevation: 2,
                marginTop: 10,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View>
                <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                  Total da Comanda:{" "}
                  {` R$ ${commandItems
                    .reduce(
                      (total, item) =>
                        total + (item.menuItem?.price || 0) * item.quantity,
                      0
                    )
                    .toFixed(2)}`}
                </Text>
                <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                  Valor pago: {`R$ ${selectedCommand.paidAmount.toFixed(2)}`}
                </Text>
                <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                  Valor pendente:{" "}
                  {`R$ ${selectedCommand.remainingAmount.toFixed(2)}`}
                </Text>
              </View>
              <View style={{ flexDirection: "column", gap: 4 }}>
                {selectedCommand.status === "OPEN" && (
                  <TouchableOpacity
                    onPress={() => setPaymentModalVisible(true)}
                    style={{
                      backgroundColor: "#28a745",
                      padding: 6,
                      borderRadius: 5,
                      marginRight: 10,
                      minWidth: 70,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "white" }}>Pagar</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={loadPayments}
                  style={{
                    backgroundColor: "#17a2b8",
                    padding: 6,
                    borderRadius: 5,
                    marginRight: 10,
                    minWidth: 70,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "white" }}>Ver</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </>
      )}
      {showPayments && (
        <View
          style={{
            backgroundColor: "white",
            padding: 15,
            borderRadius: 8,
            elevation: 2,
            marginTop: 10,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>
              Pagamentos Registrados
            </Text>
            <TouchableOpacity onPress={() => setShowPayments(false)}>
              <Text style={{ color: "#dc3545" }}>Fechar</Text>
            </TouchableOpacity>
          </View>

          {payments.length > 0 ? (
            <FlatList
              data={payments}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View
                  style={{
                    padding: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: "#eee",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={{ fontWeight: "600" }}>
                      R$ {item.amount.toFixed(2)}
                    </Text>
                    <Text style={{ color: "#6c757d" }}>
                      {new Date(item.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                  <Text style={{ color: "#6c757d" }}>
                    {item.paymentType === "CASH" && "Dinheiro"}
                    {item.paymentType === "CREDIT_CARD" && "Cartão Crédito"}
                    {item.paymentType === "DEBIT_CARD" && "Cartão Débito"}
                    {item.paymentType === "PIX" && "PIX"}
                    {item.paymentType === "OTHER" && "Outro"}
                  </Text>
                  {item.note && (
                    <Text style={{ color: "#6c757d", fontStyle: "italic" }}>
                      Obs: {item.note}
                    </Text>
                  )}
                </View>
              )}
            />
          ) : (
            <Text style={{ color: "#6c757d", textAlign: "center" }}>
              Nenhum pagamento registrado
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
