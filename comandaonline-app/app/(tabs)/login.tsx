import { router } from "expo-router";
import {
  Button,
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  TouchableOpacity,
  Modal,
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
  } = useGeneralContext();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [waiterEmail, setWaiterEmail] = useState("");
  const [waiterPassword, setWaiterPassword] = useState("");

  const handleWaiterRegister = () => {
    if (!validateCredentials({ email: waiterEmail, password: waiterPassword }))
      return;
    showLoading();
    try {
      registerWaiter({
        email: waiterEmail,
        password: waiterPassword,
        token: userToken,
      });
      setModalVisible(false);
      setWaiterEmail("");
      setWaiterPassword("");
      Alert.alert("Cadastrado com sucesso");
    } catch (error: any) {
      Alert.alert("Erro", error.message);
    } finally {
      hideLoading();
    }
  };

  useEffect(() => {
    getUserData();
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
      login();
      router.replace("/(tabs)/home");
      getUserData();
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
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 16,
        }}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            marginBottom: 24,
            color: "#007bff",
          }}
        >
          Minha Conta
        </Text>
        <Text style={{ fontSize: 16, marginBottom: 32, color: "#007bff" }}>
          Email: {userEmail}
        </Text>

        {userRole === "OWNER" && (
          <TouchableOpacity
            style={{
              backgroundColor: "#007bff",
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 8,
            }}
            onPress={() => setModalVisible(true)}
          >
            <Text style={{ color: "#fff", fontWeight: "bold" }}>
              Cadastrar Garçom
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={handleLogout}
          style={{
            marginTop: 30,
            backgroundColor: "red",
            paddingVertical: 10,
            paddingHorizontal: 20,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
            Logout
          </Text>
        </TouchableOpacity>

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
                width: "80%",
                backgroundColor: "#fff",
                padding: 20,
                borderRadius: 12,
              }}
            >
              <Text
                style={{ fontSize: 18, fontWeight: "bold", marginBottom: 16 }}
              >
                Cadastrar Garçom
              </Text>

              <TextInput
                placeholder="Email do garçom"
                value={waiterEmail}
                onChangeText={setWaiterEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                style={{
                  width: "100%",
                  borderColor: "#ccc",
                  borderWidth: 1,
                  padding: 10,
                  marginBottom: 12,
                  borderRadius: 6,
                }}
              />
              <TextInput
                placeholder="Senha"
                secureTextEntry
                value={waiterPassword}
                onChangeText={setWaiterPassword}
                style={{
                  width: "100%",
                  borderColor: "#ccc",
                  borderWidth: 1,
                  padding: 10,
                  marginBottom: 16,
                  borderRadius: 6,
                }}
              />

              <Button title="Cadastrar" onPress={handleWaiterRegister} />
              <View style={{ height: 10 }} />
              <Button
                title="Cancelar"
                color="gray"
                onPress={() => setModalVisible(false)}
              />
            </View>
          </View>
        </Modal>
      </View>
    );

  if (isRegister)
    return (
      <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            textAlign: "center",
            marginBottom: 20,
            color: "#007AFF",
          }}
        >
          Criar Conta
        </Text>

        <TextInput
          placeholder="E-mail"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={{
            height: 48,
            borderColor: "#ccc",
            borderWidth: 1,
            borderRadius: 6,
            paddingHorizontal: 12,
            marginBottom: 12,
            color: "white",
          }}
        />

        <TextInput
          placeholder="Senha"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={{
            height: 48,
            borderColor: "#ccc",
            borderWidth: 1,
            borderRadius: 6,
            paddingHorizontal: 12,
            marginBottom: 12,
            color: "white",
          }}
        />

        <Button title="Cadastrar" onPress={handleRegister} />

        <Pressable onPress={() => setIsRegister(false)}>
          <Text
            style={{ color: "#007AFF", textAlign: "center", marginTop: 20 }}
          >
            Já tem conta? Entrar
          </Text>
        </Pressable>
      </View>
    );
  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <Text
        style={{
          fontSize: 24,
          fontWeight: "bold",
          textAlign: "center",
          marginBottom: 20,
          color: "#007AFF",
        }}
      >
        Fazer login
      </Text>

      <TextInput
        placeholder="E-mail"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{
          height: 48,
          borderColor: "#ccc",
          borderWidth: 1,
          borderRadius: 6,
          paddingHorizontal: 12,
          marginBottom: 12,
          color: "white",
        }}
      />

      <TextInput
        placeholder="Senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{
          height: 48,
          borderColor: "#ccc",
          borderWidth: 1,
          borderRadius: 6,
          paddingHorizontal: 12,
          marginBottom: 12,
          color: "white",
        }}
      />

      <Button title="Entrar" onPress={handleLogin} />

      <Pressable
        onPress={() => {
          setIsRegister(true);
        }}
      >
        <Text style={{ color: "#007AFF", textAlign: "center", marginTop: 20 }}>
          Não tem conta? Cadastre-se
        </Text>
      </Pressable>
    </View>
  );
}
