import React, { useCallback, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { subscriptionApi } from "../../api/endpoints";
import { PlanTier } from "../../types";

interface PlanInfo {
  plan: PlanTier;
  priceInr: number;
  photoLimit: number | null;
  topPlacement: boolean;
  features: string[];
}

export default function PlansScreen() {
  const [plans, setPlans] = useState<PlanInfo[]>([]);
  const [currentPlan, setCurrentPlan] = useState<PlanTier>("free");
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState<PlanTier | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: plansData }, mineRes] = await Promise.all([
        subscriptionApi.plans(),
        subscriptionApi.mine().catch(() => null),
      ]);
      setPlans(plansData.plans);
      if (mineRes) setCurrentPlan(mineRes.data.currentPlan);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function choosePlan(plan: PlanTier) {
    if (plan === currentPlan) return;
    setCheckingOut(plan);
    try {
      const { data } = await subscriptionApi.checkout(plan);
      setCurrentPlan(plan);
      Alert.alert("Plan updated", data.message);
    } catch (err: any) {
      Alert.alert("Checkout failed", err?.response?.data?.message ?? "Unknown error");
    } finally {
      setCheckingOut(null);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2952e3" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.heading}>Select a plan</Text>
      <Text style={styles.subheading}>Mock payment flow — swap in Razorpay/Stripe for production.</Text>

      {plans.map((p) => {
        const isCurrent = p.plan === currentPlan;
        return (
          <View key={p.plan} style={[styles.card, isCurrent && styles.cardCurrent]}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.planName}>{p.plan.toUpperCase()}</Text>
              <Text style={styles.price}>{p.priceInr === 0 ? "Free" : `₹${p.priceInr}/mo`}</Text>
            </View>
            {p.features.map((f) => (
              <Text key={f} style={styles.feature}>• {f}</Text>
            ))}
            <TouchableOpacity
              style={[styles.selectBtn, isCurrent && styles.selectBtnCurrent]}
              disabled={isCurrent || checkingOut !== null}
              onPress={() => choosePlan(p.plan)}
            >
              <Text style={[styles.selectBtnText, isCurrent && styles.selectBtnTextCurrent]}>
                {isCurrent ? "Current plan" : checkingOut === p.plan ? "Processing..." : "Choose plan"}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  heading: { fontSize: 22, fontWeight: "700", color: "#0f1729" },
  subheading: { fontSize: 13, color: "#94a3b8", marginTop: 4, marginBottom: 20 },
  card: { borderWidth: 1, borderColor: "#eef0f5", borderRadius: 16, padding: 18, marginBottom: 16 },
  cardCurrent: { borderColor: "#2952e3", backgroundColor: "#f5f7ff" },
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  planName: { fontSize: 16, fontWeight: "800", color: "#0f1729" },
  price: { fontSize: 16, fontWeight: "700", color: "#2952e3" },
  feature: { fontSize: 13, color: "#33415c", marginBottom: 4 },
  selectBtn: { backgroundColor: "#2952e3", borderRadius: 10, paddingVertical: 12, alignItems: "center", marginTop: 12 },
  selectBtnCurrent: { backgroundColor: "#e2e8f0" },
  selectBtnText: { color: "#fff", fontWeight: "700" },
  selectBtnTextCurrent: { color: "#64748b" },
});
