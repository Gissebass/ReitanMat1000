import React, { useEffect, useRef, useState } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { useSmoothedImageDataUri, DEFAULT_URL } from "../../lib/getLastImage";
import { decodeQrFromDataUri } from "../../lib/getLastQr";

export default function TestDisplay() {
  // Keep UI light; image fetch is cheap, decoding is the heavy part.
  const targetFps = 20;
  const timeoutMs = 600;
  const bufferMs = 80;

  const { dataUri, error } = useSmoothedImageDataUri(DEFAULT_URL, targetFps, timeoutMs, bufferMs);

  const [lastQR, setLastQR] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  // Fast scan cadence with strict no-overlap
  const scanEveryMs = 150;
  const lastScanTs = useRef(0);
  const inflight = useRef(false);

  useEffect(() => {
    const now = Date.now();
    if (!dataUri) return;
    if (inflight.current) return;
    if (now - lastScanTs.current < scanEveryMs) return;

    inflight.current = true;
    lastScanTs.current = now;
    setScanning(true);

    // Let the frame paint before decoding (avoids UI stalls)
    setTimeout(() => {
      decodeQrFromDataUri(dataUri)
        .then((text) => {
          if (text) setLastQR(text);
        })
        .catch((e) => {
          // eslint-disable-next-line no-console
          console.warn("decode QR error:", e);
        })
        .finally(() => {
          inflight.current = false;
          setScanning(false);
        });
    }, 0);
  }, [dataUri]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Live Camera Feed (QR)</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {dataUri ? (
        <Image source={{ uri: dataUri }} style={styles.image} resizeMode="contain" />
      ) : (
        <Text>Loading…</Text>
      )}

      <View style={styles.resultRow}>
        <Text style={styles.label}>Last QR:</Text>
        <Text style={styles.value}>
          {lastQR ?? "No QR detected"}
          {scanning ? "  (scanning…)" : ""}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, alignItems: "center" },
  title: { fontSize: 18, fontWeight: "600", marginBottom: 8 },
  image: { width: "100%", height: 320, backgroundColor: "#eee", borderRadius: 8 },
  error: { color: "red", marginTop: 8 },
  resultRow: { marginTop: 12, width: "100%" },
  label: { fontWeight: "600", marginBottom: 4 },
  value: { fontFamily: "System", fontSize: 16 },
});
