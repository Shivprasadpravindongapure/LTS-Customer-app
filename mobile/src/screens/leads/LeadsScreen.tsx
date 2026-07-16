import React, { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Linking, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { io, Socket } from "socket.io-client";
import { enquiryApi, businessApi } from "../../api/endpoints";
import { API_BASE_URL } from "../../api/client";
import { Enquiry, EnquiryStatus } from "../../types";

const STATUS_FLOW: EnquiryStatus[] = ["new", "contacted", "converted", "closed"];
const STATUS_COLORS: Record<EnquiryStatus, string> = {
  new: "#2952e3",
  contacted: "#b45309",
  converted: "#15803d",
  closed: "#6b7280",
};

export default function LeadsScreen() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await enquiryApi.listMine();
      setEnquiries(data.items);
    } catch {
      // likely no business yet — silently show empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Real-time: join this business's socket room so new enquiries push in live.
  useEffect(() => {
    let s: Socket | null = null;
    (async () => {
      try {
        const { data } = await businessApi.getMine();
        s = io(API_BASE_URL, { transports: ["websocket"] });
        s.emit("join-business-room", data.business._id);
        s.on("new-enquiry", () => load()); // simplest correct approach: refetch on event
        setSocket(s);
      } catch {
        // no business yet, nothing to subscribe to
      }
    })();
    return () => {
      s?.disconnect();
    };
  }, [load]);

  async function advanceStatus(enquiry: Enquiry) {
    const currentIdx = STATUS_FLOW.indexOf(enquiry.status);
    const next = STATUS_FLOW[Math.min(currentIdx + 1, STATUS_FLOW.length - 1)];
    if (next === enquiry.status) return;
    try {
      await enquiryApi.updateStatus(enquiry._id, next);
      setEnquiries((prev) => prev.map((e) => (e._id === enquiry._id ? { ...e, status: next } : e)));
    } catch {
      Alert.alert("Error", "Could not update status.");
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
    <FlatList
      contentContainerStyle={{ padding: 16 }}
      data={enquiries}
      keyExtractor={(e) => e._id}
      ListEmptyComponent={<Text style={styles.empty}>No enquiries yet. New leads will show up here in real time.</Text>}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.customerName}>{item.customerName}</Text>
            <View style={[styles.statusPill, { backgroundColor: STATUS_COLORS[item.status] + "22" }]}>
              <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>{item.status}</Text>
            </View>
          </View>
          <Text style={styles.message}>{item.message}</Text>
          <Text style={styles.timestamp}>{new Date(item.createdAt).toLocaleString()}</Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => Linking.openURL(`tel:${item.customerMobile}`)}>
              <Text style={styles.actionText}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => Linking.openURL(`https://wa.me/${item.customerMobile}`)}
            >
              <Text style={styles.actionText}>WhatsApp</Text>
            </TouchableOpacity>
            {item.status !== "closed" && (
              <TouchableOpacity style={[styles.actionBtn, styles.advanceBtn]} onPress={() => advanceStatus(item)}>
                <Text style={[styles.actionText, { color: "#fff" }]}>
                  Move to {STATUS_FLOW[STATUS_FLOW.indexOf(item.status) + 1]}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { textAlign: "center", color: "#5b6b8c", marginTop: 60, paddingHorizontal: 20 },
  card: { backgroundColor: "#f8f9fc", borderRadius: 14, padding: 14, marginBottom: 12 },
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  customerName: { fontSize: 16, fontWeight: "700", color: "#0f1729" },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: "700", textTransform: "capitalize" },
  message: { fontSize: 14, color: "#33415c", marginTop: 8 },
  timestamp: { fontSize: 11, color: "#94a3b8", marginTop: 6 },
  actionsRow: { flexDirection: "row", marginTop: 12, gap: 8 },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: "#e8ecf7" },
  advanceBtn: { backgroundColor: "#2952e3" },
  actionText: { fontSize: 12, fontWeight: "600", color: "#2952e3" },
});
