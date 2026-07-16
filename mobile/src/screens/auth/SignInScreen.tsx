import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { requestOtp } from "../../store/slices/authSlice";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/AuthNavigator";

type Props = NativeStackScreenProps<AuthStackParamList, "SignIn">;

export default function SignInScreen({ navigation }: Props) {
  const [mobile, setMobile] = useState("");
  const dispatch = useAppDispatch();
  const { status, error } = useAppSelector((s) => s.auth);

  const canSubmit = /^[0-9]{10}$/.test(mobile);

  async function handleContinue() {
    const result = await dispatch(requestOtp(mobile));
    if (requestOtp.fulfilled.match(result)) {
      navigation.navigate("OtpVerify", { mobile, devOtp: result.payload.devOtp });
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.container}>
      <Text style={styles.heading}>Sign in with your mobile number</Text>
      <Text style={styles.helper}>We'll text you a one-time code to verify it's you.</Text>

      <View style={styles.inputRow}>
        <Text style={styles.prefix}>+91</Text>
        <TextInput
          style={styles.input}
          placeholder="10-digit mobile number"
          keyboardType="number-pad"
          maxLength={10}
          value={mobile}
          onChangeText={setMobile}
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.button, !canSubmit && styles.buttonDisabled]}
        disabled={!canSubmit || status === "loading"}
        onPress={handleContinue}
      >
        <Text style={styles.buttonText}>{status === "loading" ? "Sending..." : "Continue"}</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center", backgroundColor: "#fff" },
  heading: { fontSize: 22, fontWeight: "700", color: "#0f1729" },
  helper: { fontSize: 14, color: "#5b6b8c", marginTop: 8, marginBottom: 24 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d8dee9",
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  prefix: { fontSize: 16, color: "#0f1729", marginRight: 8, fontWeight: "600" },
  input: { flex: 1, paddingVertical: 14, fontSize: 16 },
  button: { backgroundColor: "#2952e3", borderRadius: 12, paddingVertical: 15, marginTop: 20, alignItems: "center" },
  buttonDisabled: { backgroundColor: "#aab8de" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  error: { color: "#d92d20", marginTop: 12 },
});
