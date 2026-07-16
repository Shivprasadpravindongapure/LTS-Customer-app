import React, { useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useAppDispatch } from "../../hooks/redux";
import { bootstrapAuth } from "../../store/slices/authSlice";

export default function SplashScreen() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(bootstrapAuth());
  }, [dispatch]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Local Trade Street</Text>
      <Text style={styles.subtitle}>Business CRM</Text>
      <ActivityIndicator size="large" color="#2952e3" style={{ marginTop: 24 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0f1729" },
  title: { fontSize: 26, fontWeight: "700", color: "#fff" },
  subtitle: { fontSize: 15, color: "#8ea0c9", marginTop: 4 },
});
