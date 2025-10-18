import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";

interface ScannedData {
  value: string;
  type: string;
  timestamp: string;
  source?: string;
}

interface HistoryItem {
  id: number;
  value: string;
  type: string;
  time: string;
}

interface BarcodeScannedEvent {
  data: string;
  type: string;
}

const REMA_COLORS = {
  primary: "#013DA4",
  secondary: "#FFFFFF",
  accent: "#A7C5E7",
  lightBg: "#DCE9F5",
  text: "#555555",
  success: "#B2D1BD",
  warning: "#F4C6CB",
};

export default function BarcodeScannerApp(): React.ReactElement {
  const [permission, requestPermission] = useCameraPermissions();
  const [activeTab, setActiveTab] = useState<"scanner" | "history">("scanner");
  const [scannedData, setScannedData] = useState<ScannedData | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    if (permission === null) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const handleBarcodeScanned = ({ data, type }: BarcodeScannedEvent): void => {
    setScannedData({
      value: data,
      type: type || "QR Code",
      timestamp: new Date().toLocaleTimeString(),
    });
    addToHistory(data, type);
  };

  const addToHistory = (value: string, type: string): void => {
    setHistory((prev) => [
      {
        id: Date.now(),
        value,
        type: type || "QR Code",
        time: new Date().toLocaleTimeString(),
      },
      ...prev.slice(0, 9),
    ]);
  };

  const handleImagePicker = async (): Promise<void> => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      if (!result.canceled) {
        setIsProcessing(true);
        const uri = result.assets[0].uri;

        // Simulate barcode extraction (in production, use ML Kit or similar)
        setTimeout(() => {
          const simulatedBarcode = `BC-${Math.random()
            .toString(36)
            .substr(2, 9)
            .toUpperCase()}`;
          setScannedData({
            value: simulatedBarcode,
            type: "Barcode (from image)",
            timestamp: new Date().toLocaleTimeString(),
            source: "image",
          });
          addToHistory(simulatedBarcode, "Barcode (image)");
          setIsProcessing(false);
        }, 1500);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const copyToClipboard = async (): Promise<void> => {
    if (scannedData) {
      // In a real app, use: import Clipboard from '@react-native-clipboard/clipboard';
      Alert.alert("Copied", `"${scannedData.value}" copied to clipboard`);
    }
  };

  const clearHistory = (): void => {
    Alert.alert("Clear History", "Remove all scanned items?", [
      { text: "Cancel" },
      {
        text: "Clear",
        onPress: () => setHistory([]),
        style: "destructive",
      },
    ]);
  };

  if (permission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={REMA_COLORS.primary} />
          <Text style={styles.loadingText}>Requesting permissions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.heading}>Camera Permission Required</Text>
          <Text style={styles.bodyText}>
            We need camera access to scan barcodes and QR codes.
          </Text>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={requestPermission}
          >
            <Text style={styles.buttonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>REMA SCANNER</Text>
        <Text style={styles.headerSubtitle}>QR & Barcode Reader</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNav}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "scanner" && styles.tabActive]}
          onPress={() => setActiveTab("scanner")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "scanner" && styles.tabTextActive,
            ]}
          >
            Scanner
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "history" && styles.tabActive]}
          onPress={() => setActiveTab("history")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "history" && styles.tabTextActive,
            ]}
          >
            History ({history.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Scanner Tab */}
      {activeTab === "scanner" && (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Camera View */}
          <View style={styles.cameraContainer}>
            <CameraView
              style={styles.camera}
              onBarcodeScanned={handleBarcodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ["qr", "ean13", "ean8", "code128"],
              }}
            />
            <View style={styles.scanOverlay}>
              <View style={styles.cornerTL} />
              <View style={styles.cornerTR} />
              <View style={styles.cornerBL} />
              <View style={styles.cornerBR} />
            </View>
          </View>

          {/* Scanned Result */}
          {scannedData && (
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultType}>{scannedData.type}</Text>
                <Text style={styles.resultTime}>{scannedData.timestamp}</Text>
              </View>
              <View style={styles.resultValue}>
                <Text style={styles.resultValueText} selectable>
                  {scannedData.value}
                </Text>
              </View>
              <View style={styles.resultActions}>
                <TouchableOpacity
                  style={[styles.button, styles.primaryButton]}
                  onPress={copyToClipboard}
                >
                  <Text style={styles.buttonText}>Copy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.secondaryButton]}
                  onPress={() => setScannedData(null)}
                >
                  <Text style={styles.buttonTextSecondary}>Clear</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Image Upload */}
          <View style={styles.uploadSection}>
            <Text style={styles.sectionTitle}>Or Upload Image</Text>
            <TouchableOpacity
              style={[styles.button, styles.accentButton]}
              onPress={handleImagePicker}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color={REMA_COLORS.primary} />
              ) : (
                <Text style={styles.buttonTextAccent}>Pick Image</Text>
              )}
            </TouchableOpacity>
            <Text style={styles.helperText}>
              Select an image containing a barcode to extract
            </Text>
          </View>
        </ScrollView>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <View style={styles.content}>
          {history.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No scans yet</Text>
              <Text style={styles.helperText}>
                Scan a QR code or barcode to get started
              </Text>
            </View>
          ) : (
            <>
              <ScrollView showsVerticalScrollIndicator={false}>
                {history.map((item) => (
                  <View key={item.id} style={styles.historyItem}>
                    <View style={styles.historyItemContent}>
                      <Text style={styles.historyItemType}>{item.type}</Text>
                      <Text style={styles.historyItemValue} numberOfLines={2}>
                        {item.value}
                      </Text>
                      <Text style={styles.historyItemTime}>{item.time}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
              <TouchableOpacity
                style={[styles.button, styles.warningButton]}
                onPress={clearHistory}
              >
                <Text style={styles.buttonText}>Clear All</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    backgroundColor: REMA_COLORS.primary,
    padding: 20,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: REMA_COLORS.secondary,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 14,
    color: REMA_COLORS.accent,
    marginTop: 4,
  },
  tabNav: {
    flexDirection: "row",
    backgroundColor: REMA_COLORS.lightBg,
    borderBottomWidth: 2,
    borderBottomColor: REMA_COLORS.accent,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: REMA_COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: REMA_COLORS.text,
  },
  tabTextActive: {
    color: REMA_COLORS.primary,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  cameraContainer: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  cornerTL: {
    position: "absolute",
    top: 40,
    left: 40,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: "#4CAF50",
  },
  cornerTR: {
    position: "absolute",
    top: 40,
    right: 40,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: "#4CAF50",
  },
  cornerBL: {
    position: "absolute",
    bottom: 40,
    left: 40,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: "#4CAF50",
  },
  cornerBR: {
    position: "absolute",
    bottom: 40,
    right: 40,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: "#4CAF50",
  },
  resultCard: {
    backgroundColor: REMA_COLORS.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: REMA_COLORS.primary,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  resultType: {
    fontSize: 14,
    fontWeight: "bold",
    color: REMA_COLORS.primary,
    textTransform: "uppercase",
  },
  resultTime: {
    fontSize: 12,
    color: REMA_COLORS.text,
  },
  resultValue: {
    backgroundColor: REMA_COLORS.lightBg,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: REMA_COLORS.accent,
  },
  resultValueText: {
    fontSize: 16,
    color: REMA_COLORS.primary,
    fontWeight: "600",
    flexWrap: "wrap",
  },
  resultActions: {
    flexDirection: "row",
    gap: 10,
  },
  uploadSection: {
    backgroundColor: REMA_COLORS.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: REMA_COLORS.primary,
    marginBottom: 12,
    textTransform: "uppercase",
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    backgroundColor: REMA_COLORS.primary,
    flex: 1,
  },
  secondaryButton: {
    backgroundColor: REMA_COLORS.secondary,
    borderWidth: 2,
    borderColor: REMA_COLORS.primary,
    flex: 1,
  },
  accentButton: {
    backgroundColor: REMA_COLORS.accent,
  },
  warningButton: {
    backgroundColor: REMA_COLORS.warning,
  },
  buttonText: {
    color: REMA_COLORS.secondary,
    fontSize: 14,
    fontWeight: "700",
  },
  buttonTextSecondary: {
    color: REMA_COLORS.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  buttonTextAccent: {
    color: REMA_COLORS.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  helperText: {
    fontSize: 12,
    color: REMA_COLORS.text,
    marginTop: 8,
    textAlign: "center",
  },
  historyItem: {
    backgroundColor: REMA_COLORS.secondary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: REMA_COLORS.accent,
  },
  historyItemContent: {
    gap: 4,
  },
  historyItemType: {
    fontSize: 12,
    fontWeight: "bold",
    color: REMA_COLORS.primary,
    textTransform: "uppercase",
  },
  historyItemValue: {
    fontSize: 14,
    color: REMA_COLORS.text,
    fontWeight: "500",
  },
  historyItemTime: {
    fontSize: 11,
    color: REMA_COLORS.text,
    opacity: 0.7,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: REMA_COLORS.primary,
    marginBottom: 8,
  },
  loadingText: {
    fontSize: 16,
    color: REMA_COLORS.primary,
    marginTop: 12,
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    color: REMA_COLORS.primary,
    marginBottom: 12,
    textAlign: "center",
  },
  bodyText: {
    fontSize: 16,
    color: REMA_COLORS.text,
    marginBottom: 20,
    textAlign: "center",
  },
});
