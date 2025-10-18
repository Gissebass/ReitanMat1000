// Client/MyApp/app/(tabs)/testDisplay.tsx
import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { useSmoothedImageDataUri, DEFAULT_URL } from "../../lib/getLastImage";

export default function TestDisplay() {
  const targetFps = 40;
  const timeoutMs = 600;
  const bufferMs = 80;

  const { dataUri, error } = useSmoothedImageDataUri(DEFAULT_URL, targetFps, timeoutMs, bufferMs);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Live Camera Feed</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {dataUri ? (
        <Image source={{ uri: dataUri }} style={styles.image} resizeMode="contain" />
      ) : (
        <Text>Loading…</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, alignItems: "center" },
  title: { fontSize: 18, fontWeight: "600", marginBottom: 8 },
  image: { width: "100%", height: 320, backgroundColor: "#eee", borderRadius: 8 },
  error: { color: "red", marginTop: 8 },
});
