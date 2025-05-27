import { router } from "expo-router";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import {
  checkToken,
  getToken,
  loginUser,
  registerUser,
  registerWaiter,
  removeToken,
  saveToken,
} from "@/services/login";
import { useGeneralContext } from "@/context/GeneralContext";
import { createBar } from "@/services/bar";
// import { LinearGradient } from "expo-linear-gradient";

export default function LoginScreen() {
  const { login, isAuthenticated, logout } = useAuth();
  const {
    showLoading,
    hideLoading,
    setUserToken,
    setUserEmail,
    userEmail,
    userToken,
    setUserRole,
    userRole,
    refresh,
  } = useGeneralContext();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [waiterEmail, setWaiterEmail] = useState("");
  const [waiterPassword, setWaiterPassword] = useState("");
  const [waiterName, setWaiterName] = useState("");
  const [barModalVisible, setBarModalVisible] = useState(false);
  const [barName, setBarName] = useState("");

  const handleWaiterRegister = () => {
    if (!validateCredentials({ email: waiterEmail, password: waiterPassword }))
      return;
    showLoading();
    try {
      registerWaiter({
        email: waiterEmail,
        password: waiterPassword,
        name: waiterName,
        token: userToken,
      });
      setModalVisible(false);
      setWaiterEmail("");
      setWaiterPassword("");
      setWaiterName("");
      Alert.alert("Cadastrado com sucesso");
    } catch (error: any) {
      Alert.alert("Erro", error.message);
    } finally {
      hideLoading();
    }
  };

  const handleCreateBar = async () => {
    if (!barName.trim()) {
      Alert.alert("Erro", "Digite o nome do estabelecimento");
      return;
    }

    showLoading();
    try {
      const newBar = await createBar(barName, userToken);
      if (newBar) {
        Alert.alert(
          "Sucesso",
          `Estabelecimento "${newBar.name}" criado com sucesso!`
        );
        refresh();
      } else {
        Alert.alert("Erro", "Você já possui um estabelecimento cadastrado");
      }
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Falha ao criar estabelecimento");
    } finally {
      setBarModalVisible(false);
      setBarName("");
      hideLoading();
    }
  };

  useEffect(() => {
    showLoading();
    getUserData();
    hideLoading();
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validateCredentials = ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => {
    if (!email || !password) {
      Alert.alert("Erro", "Preencha e-mail e senha");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      Alert.alert("Erro", "E-mail inválido");
      return false;
    }

    if (password.length < 6) {
      Alert.alert("Erro", "A senha deve ter no mínimo 6 caracteres");
      return false;
    }

    return true;
  };

  const handleLogin = async () => {
    if (!validateCredentials({ email, password })) return;
    showLoading();
    try {
      const { token } = await loginUser({ email, password });
      setUserToken(token);
      await saveToken(token);
      await getUserData();
      login();
      refresh();
      router.replace("/(tabs)/home");
    } catch (error: any) {
      Alert.alert("Erro", error.message);
    } finally {
      hideLoading();
    }
  };

  const getUserData = async () => {
    const token = await getToken();
    try {
      if (token) {
        const { user } = await checkToken({ token });
        setUserEmail(user.email);
        setUserRole(user.role);
        setUserToken(token);
        login();
      } else {
        logout();
      }
    } catch {
      console.error("Erro ao obter dados do usuário");
    }
  };

  const handleLogout = () => {
    removeToken();
    logout();
    setUserToken("");
    setUserRole("");
  };

  const handleRegister = async () => {
    if (!validateCredentials({ email, password })) return;
    showLoading();
    try {
      const userData = await registerUser({ email, password });
      Alert.alert(
        `Usuário ${userData.email} cadastrado com sucesso.`,
        " Faça o login com seu e-mail e senha."
      );
      setIsRegister(false);
      setEmail(userData.email);
    } catch (error: any) {
      Alert.alert("Erro", error.message);
    } finally {
      hideLoading();
    }
  };

  if (isAuthenticated)
    return (
      <View style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          }}
        >
          <Text
            style={{
              fontSize: 28,
              fontWeight: "bold",
              color: "#007bff",
              textAlign: "center",
              marginBottom: 24,
            }}
          >
            Minha Conta
          </Text>

          <View
            style={{
              backgroundColor: "#fff",
              width: "100%",
              padding: 20,
              borderRadius: 12,
              marginBottom: 32,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Text style={{ fontSize: 14, color: "#666", marginBottom: 4 }}>
              Email:
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: "#333",
                marginBottom: 16,
                fontWeight: "500",
              }}
            >
              {userEmail}
            </Text>

            <Text style={{ fontSize: 14, color: "#666", marginBottom: 4 }}>
              Função:
            </Text>
            <Text style={{ fontSize: 16, color: "#333", fontWeight: "500" }}>
              {userRole === "OWNER" ? "Proprietário" : "Garçom"}
            </Text>
          </View>

          {userRole === "OWNER" && (
            <>
              <TouchableOpacity
                style={{
                  backgroundColor: "#007bff",
                  padding: 16,
                  borderRadius: 8,
                  alignItems: "center",
                  width: "100%",
                  marginBottom: 16,
                }}
                onPress={() => setBarModalVisible(true)}
              >
                <Text
                  style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}
                >
                  Cadastrar Estabelecimento
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  backgroundColor: "#28a745",
                  padding: 16,
                  borderRadius: 8,
                  alignItems: "center",
                  width: "100%",
                  marginBottom: 16,
                }}
                onPress={() => setModalVisible(true)}
              >
                <Text
                  style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}
                >
                  Cadastrar Garçom
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  backgroundColor: "#28a745",
                  padding: 16,
                  borderRadius: 8,
                  alignItems: "center",
                  width: "100%",
                  marginBottom: 16,
                }}
                onPress={() => router.replace("/reports")}
              >
                <Text
                  style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}
                >
                  Relatórios de Vendas
                </Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            onPress={handleLogout}
            style={{
              backgroundColor: "#dc3545",
              padding: 16,
              borderRadius: 8,
              alignItems: "center",
              width: "100%",
              marginTop: 24,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
              Sair
            </Text>
          </TouchableOpacity>

          <Modal
            visible={barModalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setBarModalVisible(false)}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(0,0,0,0.5)",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: "90%",
                  backgroundColor: "#fff",
                  padding: 24,
                  borderRadius: 12,
                }}
              >
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "bold",
                    marginBottom: 24,
                    textAlign: "center",
                  }}
                >
                  Cadastrar Estabelecimento
                </Text>

                <TextInput
                  placeholder="Nome do estabelecimento"
                  placeholderTextColor="#999"
                  value={barName}
                  onChangeText={setBarName}
                  style={{
                    height: 50,
                    borderColor: "#ddd",
                    borderWidth: 1,
                    borderRadius: 8,
                    paddingHorizontal: 16,
                    marginBottom: 16,
                    backgroundColor: "#fff",
                    fontSize: 16,
                  }}
                />

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginTop: 16,
                  }}
                >
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      padding: 12,
                      borderRadius: 6,
                      alignItems: "center",
                      backgroundColor: "#6c757d",
                      marginRight: 8,
                    }}
                    onPress={() => setBarModalVisible(false)}
                  >
                    <Text style={{ color: "#fff", fontWeight: "bold" }}>
                      Cancelar
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{
                      flex: 1,
                      padding: 12,
                      borderRadius: 6,
                      alignItems: "center",
                      backgroundColor: "#007bff",
                      marginLeft: 8,
                    }}
                    onPress={handleCreateBar}
                  >
                    <Text style={{ color: "#fff", fontWeight: "bold" }}>
                      Cadastrar
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          <Modal
            visible={modalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setModalVisible(false)}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(0,0,0,0.5)",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: "90%",
                  backgroundColor: "#fff",
                  padding: 24,
                  borderRadius: 12,
                }}
              >
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "bold",
                    marginBottom: 24,
                    textAlign: "center",
                  }}
                >
                  Cadastrar Garçom
                </Text>

                <TextInput
                  placeholder="Email do garçom"
                  placeholderTextColor="#999"
                  value={waiterEmail}
                  onChangeText={setWaiterEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={{
                    height: 50,
                    borderColor: "#ddd",
                    borderWidth: 1,
                    borderRadius: 8,
                    paddingHorizontal: 16,
                    marginBottom: 16,
                    backgroundColor: "#fff",
                    fontSize: 16,
                  }}
                />

                <TextInput
                  placeholder="Nome / Apelido"
                  placeholderTextColor="#999"
                  value={waiterName}
                  onChangeText={setWaiterName}
                  style={{
                    height: 50,
                    borderColor: "#ddd",
                    borderWidth: 1,
                    borderRadius: 8,
                    paddingHorizontal: 16,
                    marginBottom: 16,
                    backgroundColor: "#fff",
                    fontSize: 16,
                  }}
                />

                <TextInput
                  placeholder="Senha"
                  placeholderTextColor="#999"
                  secureTextEntry
                  value={waiterPassword}
                  onChangeText={setWaiterPassword}
                  style={{
                    height: 50,
                    borderColor: "#ddd",
                    borderWidth: 1,
                    borderRadius: 8,
                    paddingHorizontal: 16,
                    marginBottom: 16,
                    backgroundColor: "#fff",
                    fontSize: 16,
                  }}
                />

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginTop: 16,
                  }}
                >
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      padding: 12,
                      borderRadius: 6,
                      alignItems: "center",
                      backgroundColor: "#6c757d",
                      marginRight: 8,
                    }}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={{ color: "#fff", fontWeight: "bold" }}>
                      Cancelar
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{
                      flex: 1,
                      padding: 12,
                      borderRadius: 6,
                      alignItems: "center",
                      backgroundColor: "#28a745",
                      marginLeft: 8,
                    }}
                    onPress={handleWaiterRegister}
                  >
                    <Text style={{ color: "#fff", fontWeight: "bold" }}>
                      Cadastrar
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      </View>
    );

  if (isRegister)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#f5f5f5",
          justifyContent: "center",
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1, justifyContent: "center" }}
        >
          <View
            style={{
              padding: 24,
              borderRadius: 12,
              marginHorizontal: 24,
              backgroundColor: "#fff",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Text
              style={{
                fontSize: 28,
                fontWeight: "bold",
                color: "#007bff",
                textAlign: "center",
                marginBottom: 24,
              }}
            >
              Criar Conta
            </Text>

            <TextInput
              placeholder="E-mail"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={{
                height: 50,
                borderColor: "#ddd",
                borderWidth: 1,
                borderRadius: 8,
                paddingHorizontal: 16,
                marginBottom: 16,
                backgroundColor: "#fff",
                fontSize: 16,
              }}
            />

            <TextInput
              placeholder="Senha"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={{
                height: 50,
                borderColor: "#ddd",
                borderWidth: 1,
                borderRadius: 8,
                paddingHorizontal: 16,
                marginBottom: 16,
                backgroundColor: "#fff",
                fontSize: 16,
              }}
            />

            <TouchableOpacity
              style={{
                backgroundColor: "#007bff",
                padding: 16,
                borderRadius: 8,
                alignItems: "center",
                marginBottom: 16,
              }}
              onPress={handleRegister}
            >
              <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
                Cadastrar
              </Text>
            </TouchableOpacity>

            <Pressable onPress={() => setIsRegister(false)}>
              <Text
                style={{
                  color: "#007bff",
                  textAlign: "center",
                  marginTop: 16,
                  fontSize: 16,
                  fontWeight: "500",
                }}
              >
                Já tem conta? Entrar
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    );

  return (
    <View
      style={{ flex: 1, backgroundColor: "#f5f5f5", justifyContent: "center" }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, justifyContent: "center" }}
      >
        <View
          style={{
            padding: 24,
            borderRadius: 12,
            marginHorizontal: 24,
            backgroundColor: "#fff",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <Text
            style={{
              fontSize: 28,
              fontWeight: "bold",
              color: "#007bff",
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            Bem-vindo
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: "#666",
              textAlign: "center",
              marginBottom: 32,
            }}
          >
            Faça login para continuar
          </Text>

          <TextInput
            placeholder="E-mail"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={{
              height: 50,
              borderColor: "#ddd",
              borderWidth: 1,
              borderRadius: 8,
              paddingHorizontal: 16,
              marginBottom: 16,
              backgroundColor: "#fff",
              fontSize: 16,
            }}
          />

          <TextInput
            placeholder="Senha"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={{
              height: 50,
              borderColor: "#ddd",
              borderWidth: 1,
              borderRadius: 8,
              paddingHorizontal: 16,
              marginBottom: 16,
              backgroundColor: "#fff",
              fontSize: 16,
            }}
          />

          <TouchableOpacity
            style={{
              backgroundColor: "#007bff",
              padding: 16,
              borderRadius: 8,
              alignItems: "center",
              marginBottom: 16,
            }}
            onPress={handleLogin}
          >
            <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
              Entrar
            </Text>
          </TouchableOpacity>

          <Pressable onPress={() => setIsRegister(true)}>
            <Text
              style={{
                color: "#007bff",
                textAlign: "center",
                marginTop: 16,
                fontSize: 16,
                fontWeight: "500",
              }}
            >
              Não tem conta? Cadastre-se
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
