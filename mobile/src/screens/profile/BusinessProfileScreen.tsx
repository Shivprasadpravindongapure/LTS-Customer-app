import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { businessApi } from "../../api/endpoints";
import { API_BASE_URL } from "../../api/client";
import { Business } from "../../types";

export default function BusinessProfileScreen() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await businessApi.getMine();
      setBusiness(data.business);
      setDescription(data.business.description ?? "");
    } catch (err: any) {
      if (err?.response?.status !== 404) {
        Alert.alert("Error", "Could not load your business profile.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function saveDescription() {
    setSaving(true);
    try {
      const { data } = await businessApi.update({ description });
      setBusiness(data.business);
      setEditing(false);
    } catch {
      Alert.alert("Error", "Could not save changes.");
    } finally {
      setSaving(false);
    }
  }

  async function pickAndUploadPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow photo library access to upload business photos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    const formData = new FormData();
    formData.append("photos", {
      uri: asset.uri,
      name: asset.fileName ?? "photo.jpg",
      type: asset.mimeType ?? "image/jpeg",
    } as any);

    try {
      const { data } = await businessApi.uploadPhotos(formData);
      setBusiness((prev) => (prev ? { ...prev, photos: data.photos } : prev));
    } catch (err: any) {
      Alert.alert("Upload failed", err?.response?.data?.message ?? "Could not upload photo");
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2952e3" />
      </View>
    );
  }

  if (!business) {
    return (
      <View style={styles.center}>
        <Text style={styles.helper}>No listing yet — finish onboarding to create one.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <View style={styles.headerRow}>
        <Text style={styles.name}>{business.name}</Text>
        {business.isVerified ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>✓ Verified</Text>
          </View>
        ) : (
          <View style={[styles.badge, styles.badgePending]}>
            <Text style={styles.badgeText}>Pending review</Text>
          </View>
        )}
      </View>

      <Text style={styles.address}>
        {business.address.line1}, {business.address.city}, {business.address.state}
      </Text>

      <Text style={styles.sectionLabel}>Photos ({business.photos.length})</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
        {business.photos.map((p) => (
          <Image key={p} source={{ uri: `${API_BASE_URL}${p}` }} style={styles.photo} />
        ))}
        <TouchableOpacity style={styles.addPhoto} onPress={pickAndUploadPhoto}>
          <Text style={styles.addPhotoText}>+ Add</Text>
        </TouchableOpacity>
      </ScrollView>

      <Text style={styles.sectionLabel}>Description</Text>
      {editing ? (
        <>
          <TextInput
            style={styles.textArea}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
          <TouchableOpacity style={styles.button} onPress={saveDescription} disabled={saving}>
            <Text style={styles.buttonText}>{saving ? "Saving..." : "Save"}</Text>
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity onPress={() => setEditing(true)}>
          <Text style={styles.description}>{business.description || "Tap to add a description..."}</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.sectionLabel}>Plan</Text>
      <Text style={styles.planText}>{business.plan.toUpperCase()}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  helper: { fontSize: 14, color: "#5b6b8c", textAlign: "center" },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  name: { fontSize: 22, fontWeight: "700", color: "#0f1729", flexShrink: 1 },
  badge: { backgroundColor: "#dcfce7", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgePending: { backgroundColor: "#fef3c7" },
  badgeText: { fontSize: 12, fontWeight: "600", color: "#065f46" },
  address: { fontSize: 14, color: "#5b6b8c", marginTop: 6, marginBottom: 20 },
  sectionLabel: { fontSize: 14, fontWeight: "700", color: "#0f1729", marginTop: 16, marginBottom: 8 },
  photo: { width: 100, height: 100, borderRadius: 10, marginRight: 8, backgroundColor: "#eee" },
  addPhoto: { width: 100, height: 100, borderRadius: 10, backgroundColor: "#f3f5f9", alignItems: "center", justifyContent: "center" },
  addPhotoText: { color: "#2952e3", fontWeight: "600" },
  description: { fontSize: 14, color: "#33415c", lineHeight: 20 },
  textArea: { borderWidth: 1, borderColor: "#d8dee9", borderRadius: 10, padding: 12, fontSize: 14, textAlignVertical: "top" },
  button: { backgroundColor: "#2952e3", borderRadius: 10, paddingVertical: 12, marginTop: 10, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "600" },
  planText: { fontSize: 16, fontWeight: "700", color: "#2952e3" },
});
