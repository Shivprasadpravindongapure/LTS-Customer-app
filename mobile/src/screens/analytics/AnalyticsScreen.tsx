import React, { useCallback, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { businessApi } from "../../api/endpoints";

interface AnalyticsData {
  range: number;
  enquiryCount: number;
  conversionRate: number;
  enquiriesByDay: { date: string; count: number }[];
  profileViews: { note: string; value: number };
}

const RANGES: Array<7 | 30 | 90> = [7, 30, 90];

export default function AnalyticsScreen() {
  const [range, setRange] = useState<7 | 30 | 90>(7);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (r: 7 | 30 | 90) => {
    setLoading(true);
    try {
      const { data: res } = await businessApi.analytics(r);
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(range);
    }, [load, range])
  );

  const maxCount = data ? Math.max(1, ...data.enquiriesByDay.map((d) => d.count)) : 1;

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.heading}>Analytics</Text>

      <View style={styles.rangeRow}>
        {RANGES.map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.rangeBtn, range === r && styles.rangeBtnActive]}
            onPress={() => setRange(r)}
          >
            <Text style={[styles.rangeBtnText, range === r && styles.rangeBtnTextActive]}>{r}d</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2952e3" style={{ marginTop: 40 }} />
      ) : !data ? (
        <Text style={styles.empty}>No data yet — create a business listing to see analytics.</Text>
      ) : (
        <>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{data.enquiryCount}</Text>
              <Text style={styles.statLabel}>Enquiries</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{data.conversionRate}%</Text>
              <Text style={styles.statLabel}>Conversion</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{data.profileViews.value}</Text>
              <Text style={styles.statLabel}>Profile views*</Text>
            </View>
          </View>
          <Text style={styles.footnote}>*Profile-view tracking isn't instrumented in the consumer app yet — shown as 0 until that event log exists.</Text>

          <Text style={styles.sectionLabel}>Enquiries per day</Text>
          <View style={styles.chart}>
            {data.enquiriesByDay.map((d) => (
              <View key={d.date} style={styles.barColumn}>
                <View style={[styles.bar, { height: 8 + (d.count / maxCount) * 90 }]} />
                <Text style={styles.barLabel}>{d.date.slice(5)}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 22, fontWeight: "700", color: "#0f1729", marginBottom: 12 },
  rangeRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  rangeBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: "#f3f5f9" },
  rangeBtnActive: { backgroundColor: "#2952e3" },
  rangeBtnText: { color: "#5b6b8c", fontWeight: "600" },
  rangeBtnTextActive: { color: "#fff" },
  empty: { textAlign: "center", color: "#5b6b8c", marginTop: 40 },
  statsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  statCard: { flex: 1, backgroundColor: "#f8f9fc", borderRadius: 14, padding: 14, marginRight: 8, alignItems: "center" },
  statValue: { fontSize: 22, fontWeight: "800", color: "#0f1729" },
  statLabel: { fontSize: 11, color: "#5b6b8c", marginTop: 4 },
  footnote: { fontSize: 10, color: "#94a3b8", marginBottom: 16 },
  sectionLabel: { fontSize: 14, fontWeight: "700", color: "#0f1729", marginBottom: 12 },
  chart: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", height: 130 },
  barColumn: { alignItems: "center", flex: 1 },
  bar: { width: 10, backgroundColor: "#2952e3", borderRadius: 4 },
  barLabel: { fontSize: 9, color: "#94a3b8", marginTop: 4 },
});
