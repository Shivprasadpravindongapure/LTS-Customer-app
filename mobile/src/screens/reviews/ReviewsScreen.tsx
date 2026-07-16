import React, { useCallback, useState } from "react";
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { reviewApi } from "../../api/endpoints";
import { Review } from "../../types";

export default function ReviewsScreen() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [breakdown, setBreakdown] = useState<Record<number, number>>({});
  const [average, setAverage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await reviewApi.listMine();
      setReviews(data.reviews);
      setBreakdown(data.breakdown);
      setAverage(data.average);
    } catch {
      // no business yet
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function submitReply(id: string) {
    const reply = replyDrafts[id]?.trim();
    if (!reply) return;
    try {
      await reviewApi.reply(id, reply);
      setReviews((prev) => prev.map((r) => (r._id === id ? { ...r, ownerReply: reply } : r)));
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message ?? "Could not post reply.");
    }
  }

  function flagReview(id: string) {
    Alert.alert("Report review", "Send this review to the admin queue for moderation?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Report",
        style: "destructive",
        onPress: async () => {
          await reviewApi.flag(id);
          setReviews((prev) => prev.map((r) => (r._id === id ? { ...r, flagged: true } : r)));
        },
      },
    ]);
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
      data={reviews}
      keyExtractor={(r) => r._id}
      ListHeaderComponent={
        <View style={styles.summary}>
          <Text style={styles.avg}>{average.toFixed(1)} ★</Text>
          <View>
            {[5, 4, 3, 2, 1].map((star) => (
              <Text key={star} style={styles.breakdownRow}>
                {star}★ — {breakdown[star] ?? 0}
              </Text>
            ))}
          </View>
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>No reviews yet.</Text>}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.customerName}>{item.customerName}</Text>
            <Text style={styles.stars}>{"★".repeat(item.rating)}{"☆".repeat(5 - item.rating)}</Text>
          </View>
          <Text style={styles.comment}>{item.comment}</Text>

          {item.ownerReply ? (
            <View style={styles.replyBox}>
              <Text style={styles.replyLabel}>Your reply</Text>
              <Text style={styles.replyText}>{item.ownerReply}</Text>
            </View>
          ) : (
            <View style={styles.replyForm}>
              <TextInput
                style={styles.replyInput}
                placeholder="Write a public reply..."
                value={replyDrafts[item._id] ?? ""}
                onChangeText={(t) => setReplyDrafts((prev) => ({ ...prev, [item._id]: t }))}
              />
              <TouchableOpacity style={styles.replyBtn} onPress={() => submitReply(item._id)}>
                <Text style={styles.replyBtnText}>Post</Text>
              </TouchableOpacity>
            </View>
          )}

          {!item.flagged ? (
            <TouchableOpacity onPress={() => flagReview(item._id)}>
              <Text style={styles.flagText}>Report inappropriate</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.flaggedText}>Reported — pending admin review</Text>
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { textAlign: "center", color: "#5b6b8c", marginTop: 40 },
  summary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8f9fc",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  avg: { fontSize: 32, fontWeight: "800", color: "#0f1729" },
  breakdownRow: { fontSize: 12, color: "#5b6b8c" },
  card: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#eef0f5", borderRadius: 14, padding: 14, marginBottom: 12 },
  headerRow: { flexDirection: "row", justifyContent: "space-between" },
  customerName: { fontWeight: "700", color: "#0f1729" },
  stars: { color: "#f59e0b" },
  comment: { fontSize: 14, color: "#33415c", marginTop: 6 },
  replyBox: { backgroundColor: "#f3f5f9", borderRadius: 10, padding: 10, marginTop: 10 },
  replyLabel: { fontSize: 11, fontWeight: "700", color: "#2952e3" },
  replyText: { fontSize: 13, color: "#33415c", marginTop: 2 },
  replyForm: { flexDirection: "row", marginTop: 10, gap: 8 },
  replyInput: { flex: 1, borderWidth: 1, borderColor: "#d8dee9", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13 },
  replyBtn: { backgroundColor: "#2952e3", borderRadius: 8, paddingHorizontal: 14, justifyContent: "center" },
  replyBtnText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  flagText: { fontSize: 12, color: "#d92d20", marginTop: 10 },
  flaggedText: { fontSize: 12, color: "#94a3b8", marginTop: 10, fontStyle: "italic" },
});
