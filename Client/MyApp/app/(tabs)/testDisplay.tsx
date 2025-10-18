import React, { useEffect, useRef, useState } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { useSmoothedImageDataUri, DEFAULT_URL } from "../../lib/getLastImage";
import { decodeQrFromDataUri } from "../../lib/getLastQr";

export default function TestDisplay() {
  // Live view settings
  const targetFps = 25;   // display cadence
  const timeoutMs = 800;  // per fetch timeout
  const bufferMs = 100;   // jitter buffer for smoothness

  const { dataUri, error } = useSmoothedImageDataUri(
    DEFAULT_URL,
    targetFps,
    timeoutMs,
    bufferMs
  );

  // QR result state
  const [lastQR, setLastQR] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  // Throttle scanning so we don't scan every single frame
  const scanEveryMs = 200;
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

    decodeQrFromDataUri(dataUri)
      .then((text) => {
        if (text) setLastQR(text);
        // else keep previous result (comment next line if you prefer clearing)
        // else setLastQR(null);
      })
      .finally(() => {
        inflight.current = false;
        setScanning(false);
      });
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
