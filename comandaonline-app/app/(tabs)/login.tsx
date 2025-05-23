import { router } from "expo-router";
import { Button, View, Text, TextInput, Pressable, Alert } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";
import {
  loginUser,
  registerUser,
  removeToken,
  saveToken,
} from "@/services/login";
import { useGeneralContext } from "@/context/GeneralContext";

export default function LoginScreen() {
  const { login, isAuthenticated, logout } = useAuth();
  const { showLoading, hideLoading } = useGeneralContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);

  const validateCredentials = () => {
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
    if (!validateCredentials()) return;
    showLoading();
    try {
      const { token } = await loginUser({ email, password });
      await saveToken(token);
      login();
      router.replace("/(tabs)/home");
    } catch (error: any) {
      Alert.alert("Erro", error.message);
    } finally {
      hideLoading();
    }
  };

  const handleLogout = () => {
    removeToken();
    logout();
  };

  const handleRegister = async () => {
    if (!validateCredentials()) return;
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
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 20, fontWeight: "bold", color: "red" }}>
          Logout
        </Text>
        <Button title="Logout" onPress={handleLogout} />
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
