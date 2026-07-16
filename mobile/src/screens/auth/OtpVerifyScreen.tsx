import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { verifyOtp } from "../../store/slices/authSlice";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/AuthNavigator";

type Props = NativeStackScreenProps<AuthStackParamList, "OtpVerify">;

export default function OtpVerifyScreen({ route, navigation }: Props) {
  const { mobile, devOtp } = route.params;
  const [otp, setOtp] = useState(devOtp ?? "");
  const dispatch = useAppDispatch();
  const { status, error } = useAppSelector((s) => s.auth);

  async function handleVerify() {
    const result = await dispatch(verifyOtp({ mobile, otp }));
    if (verifyOtp.fulfilled.match(result) && result.payload.needsProfile) {
      navigation.navigate("CreateAccount", { mobile });
    }
    // If verified and profile already exists, RootNavigator swaps to the
    // main app automatically because `user` becomes truthy in the store.
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Enter the code sent to +91 {mobile}</Text>
      {devOtp ? (
        <Text style={styles.devHint}>Dev mode: auto-filled with {devOtp} (no real SMS provider wired up yet)</Text>
      ) : null}

      <TextInput
        style={styles.otpInput}
        placeholder="6-digit code"
        keyboardType="number-pad"
        maxLength={6}
        value={otp}
        onChangeText={setOtp}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.button, otp.length < 4 && styles.buttonDisabled]}
        disabled={otp.length < 4 || status === "loading"}
        onPress={handleVerify}
      >
        <Text style={styles.buttonText}>{status === "loading" ? "Verifying..." : "Verify"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center", backgroundColor: "#fff" },
  heading: { fontSize: 20, fontWeight: "700", color: "#0f1729", marginBottom: 8 },
  devHint: { fontSize: 12, color: "#9a6b00", backgroundColor: "#fff6da", padding: 8, borderRadius: 8, marginBottom: 20 },
  otpInput: {
    borderWidth: 1,
    borderColor: "#d8dee9",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    fontSize: 20,
    letterSpacing: 6,
    textAlign: "center",
  },
  button: { backgroundColor: "#2952e3", borderRadius: 12, paddingVertical: 15, marginTop: 20, alignItems: "center" },
  buttonDisabled: { backgroundColor: "#aab8de" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  error: { color: "#d92d20", marginTop: 12 },
});
