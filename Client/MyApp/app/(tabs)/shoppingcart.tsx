import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  SafeAreaView,
} from "react-native";

/**
 * Rema 1000 Shopping Cart - Brand Guidelines Compliant
 * Based on official REMA brand guidelines
 * Colors: #013DA4 (Primary Blue), #DCE9F5 (Light Blue), #A7C5E7 (Medium Blue)
 * Typography: Uniform Rounded Extra Condensed Bold
 */

type Product = {
  barcode: string;
  name: string;
  price: number;
  unit?: string;
  imageUrl?: string;
};

export type CartLine = {
  product: Product;
  qty: number;
};

const MOCK_CATALOG: Record<string, Product> = {
  "7039010021401": {
    barcode: "7039010021401",
    name: "Banan",
    price: 3.9,
    unit: "stk",
    imageUrl:
      "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=640&q=80&auto=format&fit=crop",
  },
  "7310865004703": {
    barcode: "7310865004703",
    name: "Tine Lettmelk 1L",
    price: 20.9,
    unit: "stk",
  },
  "7039010061407": {
    barcode: "7039010061407",
    name: "Spaghetti 500g",
    price: 10.5,
    unit: "stk",
  },
};

async function lookupProduct(barcode: string): Promise<Product | null> {
  if (MOCK_CATALOG[barcode]) return MOCK_CATALOG[barcode];
  return {
    barcode,
    name: `Ukjent vare (${barcode})`,
    price: 0,
    unit: "stk",
  };
}

async function decodeBarcodeFromImage(
  imgElement: HTMLImageElement
): Promise<string | null> {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = imgElement.width;
    canvas.height = imgElement.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(imgElement, 0, 0);
    return null;
  } catch (error) {
    console.warn("Barcode decode error:", error);
    return null;
  }
}

export default function RemaScanToCartScreen() {
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [lastImage, setLastImage] = useState<string | undefined>();
  const [manualBarcode, setManualBarcode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const undoStack = useRef<string[]>([]);
  const imageQueueRef = useRef<HTMLImageElement[]>([]);
  const processingRef = useRef(false);

  const { itemCount, subtotal } = useMemo(() => {
    const lines = Object.values(cart);
    const count = lines.reduce((acc, l) => acc + l.qty, 0);
    const sum = lines.reduce((acc, l) => acc + l.qty * l.product.price, 0);
    return { itemCount: count, subtotal: round2(sum) };
  }, [cart]);

  const handleScanned = useCallback(
    async (barcode: string, imageUrl?: string) => {
      if (!barcode) return;
      if (imageUrl) setLastImage(imageUrl);

      const product = await lookupProduct(barcode);
      if (!product) {
        Alert.alert("Fant ikke varen", `Strekkode: ${barcode}`);
        return;
      }

      setCart((prev) => {
        const existing = prev[barcode];
        const nextQty = existing ? existing.qty + 1 : 1;
        return {
          ...prev,
          [barcode]: { product, qty: nextQty },
        };
      });

      undoStack.current.push(barcode);
    },
    []
  );

  const processImageFromScanner = useCallback(
    async (imgElement: HTMLImageElement) => {
      if (processingRef.current) {
        imageQueueRef.current.push(imgElement);
        return;
      }

      processingRef.current = true;
      setIsProcessing(true);

      try {
        const barcode = await decodeBarcodeFromImage(imgElement);
        if (barcode) {
          await handleScanned(barcode, imgElement.src);
        }

        if (imageQueueRef.current.length > 0) {
          const nextImg = imageQueueRef.current.shift();
          if (nextImg) {
            setTimeout(() => processImageFromScanner(nextImg), 100);
          }
        }
      } catch (error) {
        console.warn("Image processing error:", error);
      } finally {
        processingRef.current = false;
        setIsProcessing(false);
      }
    },
    [handleScanned]
  );

  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;
    let lastProcessedImage: string = "";

    const startPolling = async () => {
      pollInterval = setInterval(async () => {
        try {
          const imgElement = await getLastImage();

          if (imgElement && imgElement.src !== lastProcessedImage) {
            lastProcessedImage = imgElement.src;
            processImageFromScanner(imgElement);
          }
        } catch (error) {
          console.warn("Failed to get image:", error);
        }
      }, 500);
    };

    startPolling();

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      imageQueueRef.current = [];
      processingRef.current = false;
    };
  }, [processImageFromScanner]);

  const increment = (barcode: string) =>
    setCart((prev) => ({
      ...prev,
      [barcode]: { ...prev[barcode], qty: prev[barcode].qty + 1 },
    }));

  const decrement = (barcode: string) =>
    setCart((prev) => {
      const line = prev[barcode];
      if (!line) return prev;
      const nextQty = Math.max(0, line.qty - 1);
      const clone = { ...prev };
      if (nextQty === 0) delete clone[barcode];
      else clone[barcode] = { ...line, qty: nextQty };
      return clone;
    });

  const removeLine = (barcode: string) =>
    setCart((prev) => {
      const clone = { ...prev };
      delete clone[barcode];
      return clone;
    });

  const clearCart = () => setCart({});

  const undoLast = () => {
    const last = undoStack.current.pop();
    if (!last) return;
    decrement(last);
  };

  const onSubmitManual = () => {
    handleScanned(manualBarcode.trim());
    setManualBarcode("");
  };

  const data = Object.values(cart).sort((a, b) =>
    a.product.name.localeCompare(b.product.name)
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Header itemCount={itemCount} subtotal={subtotal} />

        <ScannerPanel
          lastImage={lastImage}
          isProcessing={isProcessing}
          manualBarcode={manualBarcode}
          onManualChange={setManualBarcode}
          onManualSubmit={onSubmitManual}
        />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>HANDLEKURV</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <PillButton label="Angre siste" onPress={undoLast} />
            <PillButton label="Tøm" onPress={clearCart} />
          </View>
        </View>

        <FlatList
          data={data}
          keyExtractor={(item) => item.product.barcode}
          contentContainerStyle={{ paddingBottom: 32 }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <CartRow
              line={item}
              onInc={() => increment(item.product.barcode)}
              onDec={() => decrement(item.product.barcode)}
              onRemove={() => removeLine(item.product.barcode)}
            />
          )}
          ListEmptyComponent={() => (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>
                Skann en vare for å legge den i handlekurven.
              </Text>
            </View>
          )}
        />

        <CheckoutBar
          subtotal={subtotal}
          onCheckout={() =>
            Alert.alert("Betaling", "Her kobler du på betaling/kasse.")
          }
        />
      </View>
    </SafeAreaView>
  );
}

// -------------------- UI Components --------------------

function Header({
  itemCount,
  subtotal,
}: {
  itemCount: number;
  subtotal: number;
}) {
  return (
    <View style={styles.header}>
      <Image
        style={styles.mainLogo}
        source={require("../../assets/images/logos/REMA1000_horisontal_logo.png")}
      />
      <View style={{ alignItems: "flex-end", flex: 1 }}>
        <Text style={styles.headerMeta}>{itemCount} VARER</Text>
        <Text style={styles.headerTotal}>{formatCurrency(subtotal)}</Text>
      </View>
    </View>
  );
}

interface ScannerPanelProps {
  lastImage?: string;
  isProcessing: boolean;
  manualBarcode: string;
  onManualChange: (s: string) => void;
  onManualSubmit: () => void;
}

function ScannerPanel({
  lastImage,
  isProcessing,
  manualBarcode,
  onManualChange,
  onManualSubmit,
}: ScannerPanelProps) {
  return (
    <View style={styles.scannerWrap}>
      <View style={styles.scannerHeader}>
        <Text style={styles.scannerTitle}>STREKKODESKANNER</Text>
        <Text style={styles.scannerHint}>
          {isProcessing ? "Behandler bilde..." : "Lytter etter strekkoder…"}
        </Text>
      </View>

      <View style={styles.scannerBody}>
        {lastImage ? (
          <Image source={{ uri: lastImage }} style={styles.scanImage} />
        ) : (
          <View style={styles.scanImagePlaceholder}>
            <Text style={styles.scanImagePlaceholderText}>
              Siste bilde vises her
            </Text>
          </View>
        )}

        <View style={styles.manualInputRow}>
          <TextInput
            placeholder="Skriv strekkode"
            value={manualBarcode}
            onChangeText={onManualChange}
            onSubmitEditing={onManualSubmit}
            returnKeyType="send"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />
          <TouchableOpacity
            style={[styles.knapp, styles.knappPrimary, styles.knappL]}
            onPress={onManualSubmit}
          >
            <Text style={styles.knappText}>LEGG TIL</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function CartRow({
  line,
  onInc,
  onDec,
  onRemove,
}: {
  line: CartLine;
  onInc: () => void;
  onDec: () => void;
  onRemove: () => void;
}) {
  const { product, qty } = line;
  const lineTotal = round2(qty * product.price);

  return (
    <View style={styles.row}>
      {product.imageUrl ? (
        <Image source={{ uri: product.imageUrl }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]} />
      )}

      <View style={{ flex: 1 }}>
        <Text style={styles.itemName} numberOfLines={1}>
          {product.name}
        </Text>
        <Text style={styles.itemMeta}>
          {formatCurrency(product.price)}{" "}
          {product.unit ? `• ${product.unit}` : ""}
        </Text>
      </View>

      <View style={styles.qtyWrap}>
        <TouchableOpacity style={[styles.knapp, styles.qtyBtn]} onPress={onDec}>
          <Text style={styles.qtyBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.qtyValue}>{qty}</Text>
        <TouchableOpacity style={[styles.knapp, styles.qtyBtn]} onPress={onInc}>
          <Text style={styles.qtyBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={{ width: 88, alignItems: "flex-end" }}>
        <Text style={styles.lineTotal}>{formatCurrency(lineTotal)}</Text>
        <TouchableOpacity onPress={onRemove}>
          <Text style={styles.removeText}>FJERN</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function CheckoutBar({
  subtotal,
  onCheckout,
}: {
  subtotal: number;
  onCheckout: () => void;
}) {
  return (
    <View style={styles.checkoutBar}>
      <Text style={styles.checkoutSum}>TOTALT: {formatCurrency(subtotal)}</Text>
      <TouchableOpacity
        style={[styles.knapp, styles.knappPrimary, styles.knappXL]}
        onPress={onCheckout}
      >
        <Text style={styles.knappText}>GÅ TIL BETALING</Text>
      </TouchableOpacity>
    </View>
  );
}

function PillButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.knapp, styles.knappSecondary, styles.knappM]}
    >
      <Text style={styles.knappSecondaryText}>{label.toUpperCase()}</Text>
    </TouchableOpacity>
  );
}

// -------------------- Utils & Styles --------------------

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function formatCurrency(n: number) {
  try {
    return new Intl.NumberFormat("nb-NO", {
      style: "currency",
      currency: "NOK",
    }).format(n);
  } catch {
    return `${n.toFixed(2)} kr`;
  }
}

// REMA Brand Colors
const COLORS = {
  primary: "#013DA4", // Primary Blue
  lightBlue: "#DCE9F5", // Light Blue
  mediumBlue: "#A7C5E7", // Medium Blue
  white: "#FFFFFF",
  darkText: "#013DA4",
  lightText: "#555555",
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.lightBlue },
  container: { flex: 1, padding: 16, gap: 12 },

  mainLogo: {
    height: 80,
    width: 200,
    resizeMode: "contain",
    marginRight: 16,
  },

  // Header
  header: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    minHeight: 80,
  },
  brand: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 1,
    color: COLORS.primary,
  },
  headerMeta: {
    fontSize: 12,
    color: COLORS.lightText,
    fontWeight: "600",
  },
  headerTotal: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.primary,
  },

  // Scanner Panel
  scannerWrap: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  scannerHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: COLORS.lightBlue,
  },
  scannerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.primary,
  },
  scannerHint: {
    fontSize: 12,
    color: COLORS.lightText,
    marginTop: 4,
  },
  scannerBody: { padding: 20, gap: 12 },
  scanImage: { width: "100%", height: 160, borderRadius: 12 },
  scanImagePlaceholder: {
    width: "100%",
    height: 160,
    borderRadius: 12,
    backgroundColor: COLORS.lightBlue,
    borderWidth: 2,
    borderColor: COLORS.mediumBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  scanImagePlaceholderText: {
    color: COLORS.lightText,
    fontSize: 12,
  },

  // Input
  manualInputRow: { flexDirection: "row", gap: 12, alignItems: "center" },
  input: {
    flex: 1,
    borderWidth: 2,
    borderColor: COLORS.mediumBlue,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: COLORS.white,
    color: COLORS.primary,
  },

  // Buttons (REMA Brand)
  knapp: {
    borderRadius: 20,
    borderWidth: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  knappPrimary: {
    backgroundColor: COLORS.primary,
  },
  knappSecondary: {
    backgroundColor: COLORS.lightBlue,
    borderWidth: 2,
    borderColor: COLORS.mediumBlue,
  },
  knappText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 16,
  },
  knappSecondaryText: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 14,
  },
  knappXL: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    minHeight: 60,
  },
  knappL: {
    paddingHorizontal: 25,
    paddingVertical: 12,
    minHeight: 50,
  },
  knappM: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    minHeight: 40,
  },

  // Section Header
  sectionHeader: {
    marginTop: 12,
    paddingHorizontal: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.primary,
  },

  // Cart Items
  separator: { height: 1, backgroundColor: COLORS.mediumBlue },
  emptyWrap: { padding: 32, alignItems: "center" },
  emptyText: { color: COLORS.lightText, fontSize: 16 },

  row: {
    backgroundColor: COLORS.white,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  thumb: { width: 48, height: 48, borderRadius: 8, marginRight: 16 },
  thumbPlaceholder: {
    backgroundColor: COLORS.lightBlue,
    borderWidth: 1,
    borderColor: COLORS.mediumBlue,
  },
  itemName: { fontSize: 15, fontWeight: "700", color: COLORS.primary },
  itemMeta: {
    fontSize: 12,
    color: COLORS.lightText,
    marginTop: 2,
    fontWeight: "600",
  },

  // Quantity
  qtyWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 8,
  },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.lightBlue,
    borderWidth: 2,
    borderColor: COLORS.mediumBlue,
  },
  qtyBtnText: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.primary,
  },
  qtyValue: {
    minWidth: 24,
    textAlign: "center",
    fontWeight: "700",
    color: COLORS.primary,
  },

  lineTotal: { fontSize: 16, fontWeight: "700", color: COLORS.primary },
  removeText: {
    fontSize: 11,
    color: COLORS.primary,
    marginTop: 2,
    fontWeight: "700",
  },

  // Checkout Bar
  checkoutBar: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    gap: 12,
  },
  checkoutSum: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.primary,
  },
});
