import React, { useEffect, useState, useCallback } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { useAppDispatch, useAppSelector } from "../hooks/redux";
import { bootstrapAuth } from "../store/slices/authSlice";
import { businessApi } from "../api/endpoints";
import SplashScreen from "../screens/auth/SplashScreen";
import AuthNavigator from "./AuthNavigator";
import OnboardingScreen from "../screens/onboarding/OnboardingScreen";
import MainTabNavigator from "./MainTabNavigator";

export default function RootNavigator() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [hasBusiness, setHasBusiness] = useState<boolean | null>(null);
  const [checkingBusiness, setCheckingBusiness] = useState(false);

  useEffect(() => {
    dispatch(bootstrapAuth()).finally(() => setBootstrapping(false));
  }, [dispatch]);

  const checkBusiness = useCallback(async () => {
    if (!user) return;
    setCheckingBusiness(true);
    try {
      await businessApi.getMine();
      setHasBusiness(true);
    } catch {
      setHasBusiness(false);
    } finally {
      setCheckingBusiness(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) checkBusiness();
  }, [user, checkBusiness]);

  if (bootstrapping) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      {!user ? (
        <AuthNavigator />
      ) : checkingBusiness || hasBusiness === null ? (
        <SplashScreen />
      ) : hasBusiness ? (
        <MainTabNavigator />
      ) : (
        <OnboardingScreen />
      )}
    </NavigationContainer>
  );
}
