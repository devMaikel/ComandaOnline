import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "../../context/AuthContext";
import LoginScreen from "./login";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isAuthenticated } = useAuth();

  if (isAuthenticated)
    return (
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarStyle: Platform.select({
            ios: {
              position: "absolute",
            },
            default: {},
          }),
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="house" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="commands"
          options={{
            title: "Comandas",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="event-note" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="tables"
          options={{
            title: "Mesas",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="table-restaurant" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="menu"
          options={{
            title: "Menu",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="menu-book" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="login"
          options={{
            title: "Minha Conta",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="account-circle" color={color} />
            ),
          }}
        />
      </Tabs>
    );
  return <LoginScreen />;
}

