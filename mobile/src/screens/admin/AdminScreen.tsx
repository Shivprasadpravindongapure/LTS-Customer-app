import React, { useCallback, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { adminApi } from "../../api/endpoints";

export default function AdminScreen() {
  const [tab, setTab] = useState<"pending" | "flagged" | "stats">("stats");
  const [pending, setPending] = useState<any[]>([]);
  const [flagged, setFlagged] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (showLoader = false) => {
    if (showLoader) {
      setLoading(true);
    }
    try {
      const [{ data: p }, { data: f }, { data: s }] = await Promise.all([
        adminApi.pendingBusinesses(),
        adminApi.flaggedReviews(),
        adminApi.stats(),
      ]);
      setPending(p.businesses);
      setFlagged(f.reviews);
      setStats(s);
    } catch {
      Alert.alert("Error", "Could not load admin data. Are you signed in as an admin?");
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const [{ data: p }, { data: f }, { data: s }] = await Promise.all([
        adminApi.pendingBusinesses(),
        adminApi.flaggedReviews(),
        adminApi.stats(),
      ]);
      setPending(p.businesses);
      setFlagged(f.reviews);
      setStats(s);
    } catch {
      // ignore
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(pending.length === 0 && flagged.length === 0 && stats === null);
    }, [load, pending.length, flagged.length, stats])
  );

  async function approve(id: string) {
    try {
      await adminApi.approveBusiness(id);
      setPending((prev) => prev.filter((b) => b._id !== id));
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message ?? "Could not approve business.");
    }
  }

  async function reject(id: string) {
    try {
      await adminApi.rejectBusiness(id);
      setPending((prev) => prev.filter((b) => b._id !== id));
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message ?? "Could not reject business.");
    }
  }

  async function resolveReview(id: string, action: "dismiss" | "remove") {
    try {
      await adminApi.resolveReview(id, action);
      setFlagged((prev) => prev.filter((r) => r._id !== id));
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message ?? "Could not resolve review.");
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
    <View style={{ flex: 1 }}>
      <View style={styles.tabRow}>
        {(["stats", "pending", "flagged"] as const).map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === "stats" && stats && (
        <ScrollView
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {Object.entries({
            "Total businesses": stats.totalBusinesses,
            Verified: stats.verifiedBusinesses,
            Pending: stats.pendingBusinesses,
            "Total users": stats.totalUsers,
            "Total enquiries": stats.totalEnquiries,
            "Flagged reviews": stats.flaggedReviews,
          }).map(([label, value]) => (
            <View key={label} style={styles.statRow}>
              <Text style={styles.statLabel}>{label}</Text>
              <Text style={styles.statValue}>{value as any}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      {tab === "pending" && (
        <FlatList
          contentContainerStyle={{ padding: 16 }}
          data={pending}
          keyExtractor={(b) => b._id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={<Text style={styles.empty}>No listings awaiting review.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardSub}>
                {item.address?.city}, {item.address?.state}
              </Text>
              <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.approveBtn} onPress={() => approve(item._id)}>
                  <Text style={styles.actionText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.rejectBtn} onPress={() => reject(item._id)}>
                  <Text style={[styles.actionText, { color: "#fff" }]}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {tab === "flagged" && (
        <FlatList
          contentContainerStyle={{ padding: 16 }}
          data={flagged}
          keyExtractor={(r) => r._id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={<Text style={styles.empty}>No flagged reviews.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.customerName} — {item.rating}★</Text>
              <Text style={styles.cardSub}>{item.comment}</Text>
              <Text style={styles.flagReason}>Reason: {item.flagReason}</Text>
              <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.approveBtn} onPress={() => resolveReview(item._id, "dismiss")}>
                  <Text style={styles.actionText}>Dismiss flag</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.rejectBtn} onPress={() => resolveReview(item._id, "remove")}>
                  <Text style={[styles.actionText, { color: "#fff" }]}>Remove review</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  tabRow: { flexDirection: "row", padding: 12, gap: 8 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: "#f3f5f9", alignItems: "center" },
  tabActive: { backgroundColor: "#2952e3" },
  tabText: { color: "#5b6b8c", fontWeight: "600", textTransform: "capitalize" },
  tabTextActive: { color: "#fff" },
  statRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#eef0f5" },
  statLabel: { color: "#33415c" },
  statValue: { fontWeight: "700", color: "#0f1729" },
  empty: { textAlign: "center", color: "#5b6b8c", marginTop: 40 },
  card: { backgroundColor: "#f8f9fc", borderRadius: 14, padding: 14, marginBottom: 12 },
  cardTitle: { fontWeight: "700", color: "#0f1729" },
  cardSub: { fontSize: 13, color: "#5b6b8c", marginTop: 4 },
  flagReason: { fontSize: 12, color: "#d92d20", marginTop: 6 },
  actionsRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  approveBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: "#dcfce7" },
  rejectBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: "#d92d20" },
  actionText: { fontSize: 12, fontWeight: "700", color: "#065f46" },
});
