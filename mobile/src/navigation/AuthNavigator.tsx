import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SignInScreen from "../screens/auth/SignInScreen";
import OtpVerifyScreen from "../screens/auth/OtpVerifyScreen";
import CreateAccountScreen from "../screens/auth/CreateAccountScreen";

export type AuthStackParamList = {
  SignIn: undefined;
  OtpVerify: { mobile: string; devOtp?: string };
  CreateAccount: { mobile: string };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShadowVisible: false }}>
      <Stack.Screen name="SignIn" component={SignInScreen} options={{ title: "" }} />
      <Stack.Screen name="OtpVerify" component={OtpVerifyScreen} options={{ title: "Verify" }} />
      <Stack.Screen name="CreateAccount" component={CreateAccountScreen} options={{ title: "Create account" }} />
    </Stack.Navigator>
  );
}
