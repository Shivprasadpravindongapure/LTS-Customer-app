import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { createAccount } from "../../store/slices/authSlice";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/AuthNavigator";

type Props = NativeStackScreenProps<AuthStackParamList, "CreateAccount">;

export default function CreateAccountScreen({ route }: Props) {
  const { mobile } = route.params;
  const [name, setName] = useState("");
  const dispatch = useAppDispatch();
  const { status } = useAppSelector((s) => s.auth);

  async function handleCreate() {
    await dispatch(createAccount({ mobile, name }));
    // RootNavigator watches `user` in the store and will swap to
    // Onboarding (category/location selection) automatically.
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>What's your business owner name?</Text>
      <Text style={styles.helper}>This is how you'll appear inside the CRM — not your public listing name.</Text>

      <TextInput
        style={styles.input}
        placeholder="Full name"
        value={name}
        onChangeText={setName}
        autoFocus
      />

      <TouchableOpacity
        style={[styles.button, name.trim().length < 2 && styles.buttonDisabled]}
        disabled={name.trim().length < 2 || status === "loading"}
        onPress={handleCreate}
      >
        <Text style={styles.buttonText}>Create account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center", backgroundColor: "#fff" },
  heading: { fontSize: 20, fontWeight: "700", color: "#0f1729" },
  helper: { fontSize: 14, color: "#5b6b8c", marginTop: 8, marginBottom: 24 },
  input: { borderWidth: 1, borderColor: "#d8dee9", borderRadius: 12, paddingVertical: 14, paddingHorizontal: 14, fontSize: 16 },
  button: { backgroundColor: "#2952e3", borderRadius: 12, paddingVertical: 15, marginTop: 20, alignItems: "center" },
  buttonDisabled: { backgroundColor: "#aab8de" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
