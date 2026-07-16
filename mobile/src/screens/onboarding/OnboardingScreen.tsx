import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { categoryApi, businessApi } from "../../api/endpoints";
import { Category } from "../../types";
import { useAppDispatch } from "../../hooks/redux";
import { bootstrapAuth } from "../../store/slices/authSlice";

export default function OnboardingScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [businessName, setBusinessName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [line1, setLine1] = useState("");

  const dispatch = useAppDispatch();

  useEffect(() => {
    categoryApi
      .list()
      .then(({ data }) => setCategories(data.categories))
      .catch(() => Alert.alert("Error", "Could not load categories. Is the backend running and seeded?"))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreateListing() {
    if (!selected || !businessName || !city || !state || !line1) {
      Alert.alert("Missing info", "Please fill in category, business name, and address.");
      return;
    }
    setSubmitting(true);
    try {
      await businessApi.create({
        name: businessName,
        category: selected,
        description: "",
        address: { line1, city, state, country: "India" },
      });
      // Refresh `me` so RootNavigator picks up that onboarding is done
      // (in a fuller build we'd track this on the User/Business directly;
      // here we just re-bootstrap and let the main tabs mount).
      await dispatch(bootstrapAuth());
    } catch (err: any) {
      Alert.alert("Couldn't create listing", err?.response?.data?.message ?? "Unknown error");
    } finally {
      setSubmitting(false);
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
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.heading}>Set up your business listing</Text>
          <Text style={styles.helper}>Pick a category, then tell us the basics. You can add photos and hours next.</Text>

          <TextInput style={styles.input} placeholder="Business name" value={businessName} onChangeText={setBusinessName} />
          <TextInput style={styles.input} placeholder="Address line" value={line1} onChangeText={setLine1} />
          <TextInput style={styles.input} placeholder="City" value={city} onChangeText={setCity} />
          <TextInput style={styles.input} placeholder="State" value={state} onChangeText={setState} />

          <Text style={styles.sectionLabel}>Category</Text>
        </View>
      }
      data={categories}
      keyExtractor={(c) => c._id}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.categoryRow, selected === item._id && styles.categoryRowSelected]}
          onPress={() => setSelected(item._id)}
        >
          <Text style={[styles.categoryText, selected === item._id && styles.categoryTextSelected]}>{item.name}</Text>
        </TouchableOpacity>
      )}
      ListFooterComponent={
        <TouchableOpacity
          style={[styles.button, submitting && styles.buttonDisabled]}
          disabled={submitting}
          onPress={handleCreateListing}
        >
          <Text style={styles.buttonText}>{submitting ? "Creating..." : "Create listing"}</Text>
        </TouchableOpacity>
      }
      contentContainerStyle={{ padding: 24 }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { marginBottom: 12 },
  heading: { fontSize: 20, fontWeight: "700", color: "#0f1729" },
  helper: { fontSize: 14, color: "#5b6b8c", marginTop: 6, marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#d8dee9",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    marginBottom: 10,
  },
  sectionLabel: { fontSize: 14, fontWeight: "600", color: "#0f1729", marginTop: 8, marginBottom: 8 },
  categoryRow: { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, backgroundColor: "#f3f5f9", marginBottom: 8 },
  categoryRowSelected: { backgroundColor: "#2952e3" },
  categoryText: { fontSize: 15, color: "#0f1729" },
  categoryTextSelected: { color: "#fff", fontWeight: "600" },
  button: { backgroundColor: "#2952e3", borderRadius: 12, paddingVertical: 15, marginTop: 20, alignItems: "center" },
  buttonDisabled: { backgroundColor: "#aab8de" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
