import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
 * Rema 1000 — Scan-to-Cart Screen (React Native, single-file)
 * -----------------------------------------------------------
 * What this does:
 *  - Displays a shopping cart that updates in real-time whenever a new barcode arrives.
 *  - Provides pluggable integration points for your *existing* barcode pipeline (images->decode->barcode value).
 *  - Includes a WebSocket example and a manual test input for development.
 *
 * How to wire your scanner:
 *  - If you already decode barcodes elsewhere (server/edge), push `{ barcode, imageUrl? }` messages
 *    over WebSocket/HTTP/SSE and call `handleScanned(barcode, imageUrl)` here.
 *  - Or expose a native module/event and call `handleScanned` from that callback.
 *
 * Notes:
 *  - Replace `WS_URL` with your real WebSocket endpoint if you want live updates.
 *  - Replace `lookupProduct` with your real product API lookup.
 */

// -------------------- Types --------------------

type Product = {
  barcode: string;
  name: string;
  price: number; // NOK
  unit?: string; // e.g. "stk", "kg"
  imageUrl?: string;
};

export type CartLine = {
  product: Product;
  qty: number;
};

// -------------------- Mock Catalog (replace with your API) --------------------

const MOCK_CATALOG: Record<string, Product> = {
  "7039010021401": {
    barcode: "7039010021401",
    name: "Rema 1000 Banan",
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
    imageUrl:
      "https://images.unsplash.com/photo-1580910051074-3eb694886425?w=640&q=80&auto=format&fit=crop",
  },
  "7039010061407": {
    barcode: "7039010061407",
    name: "Rema 1000 Spaghetti 500g",
    price: 10.5,
    unit: "stk",
    imageUrl:
      "https://images.unsplash.com/photo-1526318472351-c75fcf070305?w=640&q=80&auto=format&fit=crop",
  },
};

async function lookupProduct(barcode: string): Promise<Product | null> {
  // TODO: Call your real product API here. Falling back to mock for demo.
  // e.g. const res = await fetch(`${API}/product?barcode=${barcode}`)
  //      return await res.json()
  if (MOCK_CATALOG[barcode]) return MOCK_CATALOG[barcode];
  // Unknown item fallback (you may choose to reject instead):
  return {
    barcode,
    name: `Ukjent vare (${barcode})`,
    price: 0,
    unit: "stk",
  };
}

// -------------------- Screen --------------------

const WS_URL = ""; // e.g. wss://yourdomain.example/rema1000/barcodes

export default function RemaScanToCartScreen() {
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [lastImage, setLastImage] = useState<string | undefined>();
  const [manualBarcode, setManualBarcode] = useState("");
  const undoStack = useRef<string[]>([]); // stack of barcodes in scan order

  // --- Derived totals
  const { itemCount, subtotal } = useMemo(() => {
    const lines = Object.values(cart);
    const count = lines.reduce((acc, l) => acc + l.qty, 0);
    const sum = lines.reduce((acc, l) => acc + l.qty * l.product.price, 0);
    return { itemCount: count, subtotal: round2(sum) };
  }, [cart]);

  // --- Handle a new scanned barcode coming from *anywhere*
  const handleScanned = useCallback(
    async (barcode: string, imageUrl?: string) => {
      if (!barcode) return;
      // Optional: store latest frame/thumbnail
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

  // --- (Optional) WebSocket hookup for real-time barcode messages
  useEffect(() => {
    if (!WS_URL) return; // skip if not configured
    const ws = new WebSocket(WS_URL);
    ws.onopen = () => console.log("WS connected");
    ws.onerror = (e) => console.warn("WS error", e);
    ws.onclose = () => console.log("WS closed");

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(String(ev.data));
        // Expected shape: { barcode: string, imageUrl?: string }
        if (msg?.barcode) handleScanned(msg.barcode, msg.imageUrl);
      } catch (err) {
        console.warn("Bad WS payload", err);
      }
    };

    return () => ws.close();
  }, [handleScanned]);

  // --- UI helpers
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
          manualBarcode={manualBarcode}
          onManualChange={setManualBarcode}
          onManualSubmit={onSubmitManual}
        />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Handlekurv</Text>
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

        <CheckoutBar subtotal={subtotal} onCheckout={() => Alert.alert("Betaling", "Her kobler du på betaling/kasse.")} />
      </View>
    </SafeAreaView>
  );
}

// -------------------- UI Components --------------------

function Header({ itemCount, subtotal }: { itemCount: number; subtotal: number }) {
  return (
    <View style={styles.header}>
      <Text style={styles.brand}>REMA 1000</Text>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={styles.headerMeta}>{itemCount} varer</Text>
        <Text style={styles.headerTotal}>{formatCurrency(subtotal)}</Text>
      </View>
    </View>
  );
}

function ScannerPanel({
  lastImage,
  manualBarcode,
  onManualChange,
  onManualSubmit,
}: {
  lastImage?: string;
  manualBarcode: string;
  onManualChange: (s: string) => void;
  onManualSubmit: () => void;
}) {
  return (
    <View style={styles.scannerWrap}>
      <View style={styles.scannerHeader}>
        <Text style={styles.scannerTitle}>Strekkodeskanner</Text>
        <Text style={styles.scannerHint}>Lytter etter nye strekkoder…</Text>
      </View>

      <View style={styles.scannerBody}>
        {lastImage ? (
          <Image source={{ uri: lastImage }} style={styles.scanImage} />
        ) : (
          <View style={styles.scanImagePlaceholder}>
            <Text style={styles.scanImagePlaceholderText}>Siste bilde vises her</Text>
          </View>
        )}

        <View style={styles.manualInputRow}>
          <TextInput
            placeholder="Skriv/lim inn strekkode for testing"
            value={manualBarcode}
            onChangeText={onManualChange}
            onSubmitEditing={onManualSubmit}
            returnKeyType="send"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType={Platform.select({ ios: "number-pad", android: "numeric" })}
            style={styles.input}
          />
          <TouchableOpacity style={styles.addBtn} onPress={onManualSubmit}>
            <Text style={styles.addBtnText}>Legg til</Text>
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
          {formatCurrency(product.price)} {product.unit ? `• ${product.unit}` : ""}
        </Text>
      </View>

      <View style={styles.qtyWrap}>
        <TouchableOpacity style={styles.qtyBtn} onPress={onDec}>
          <Text style={styles.qtyBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.qtyValue}>{qty}</Text>
        <TouchableOpacity style={styles.qtyBtn} onPress={onInc}>
          <Text style={styles.qtyBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={{ width: 88, alignItems: "flex-end" }}>
        <Text style={styles.lineTotal}>{formatCurrency(lineTotal)}</Text>
        <TouchableOpacity onPress={onRemove}>
          <Text style={styles.removeText}>Fjern</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function CheckoutBar({ subtotal, onCheckout }: { subtotal: number; onCheckout: () => void }) {
  return (
    <View style={styles.checkoutBar}>
      <Text style={styles.checkoutSum}>Totalt: {formatCurrency(subtotal)}</Text>
      <TouchableOpacity style={styles.checkoutBtn} onPress={onCheckout}>
        <Text style={styles.checkoutBtnText}>Gå til betaling</Text>
      </TouchableOpacity>
    </View>
  );
}

function PillButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.pill}>
      <Text style={styles.pillText}>{label}</Text>
    </TouchableOpacity>
  );
}

// -------------------- Utils & Styles --------------------

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function formatCurrency(n: number) {
  // NOK formatting without dependency
  try {
    return new Intl.NumberFormat("nb-NO", { style: "currency", currency: "NOK" }).format(n);
  } catch {
    return `${n.toFixed(2)} kr`;
  }
}

const colors = {
  remaBlue: "#0032A0",
  remaRed: "#E2231A",
  ink: "#111827",
  inkLight: "#6B7280",
  bg: "#F9FAFB",
  card: "#FFFFFF",
  line: "#E5E7EB",
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, padding: 16, gap: 12 },

  header: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  brand: {
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 2,
    color: colors.remaBlue,
  },
  headerMeta: { fontSize: 13, color: colors.inkLight },
  headerTotal: { fontSize: 18, fontWeight: "700", color: colors.ink },

  scannerWrap: {
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  scannerHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  scannerTitle: { fontSize: 18, fontWeight: "700", color: colors.ink },
  scannerHint: { fontSize: 12, color: colors.inkLight },
  scannerBody: { padding: 16, gap: 12 },
  scanImage: { width: "100%", height: 160, borderRadius: 12 },
  scanImagePlaceholder: {
    width: "100%",
    height: 160,
    borderRadius: 12,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  scanImagePlaceholderText: { color: colors.inkLight, fontSize: 12 },

  manualInputRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.select({ ios: 12, android: 8 }),
    fontSize: 16,
    backgroundColor: "#fff",
  },
  addBtn: {
    backgroundColor: colors.remaBlue,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
  },
  addBtnText: { color: "#fff", fontWeight: "700" },

  sectionHeader: {
    marginTop: 6,
    paddingHorizontal: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.ink },

  separator: { height: 1, backgroundColor: colors.line },
  emptyWrap: { padding: 20, alignItems: "center" },
  emptyText: { color: colors.inkLight },

  row: {
    backgroundColor: colors.card,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  thumb: { width: 48, height: 48, borderRadius: 8, marginRight: 12 },
  thumbPlaceholder: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line },
  itemName: { fontSize: 15, fontWeight: "700", color: colors.ink },
  itemMeta: { fontSize: 12, color: colors.inkLight, marginTop: 2 },

  qtyWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 8,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.line,
  },
  qtyBtnText: { fontSize: 18, fontWeight: "700", color: colors.ink },
  qtyValue: { minWidth: 22, textAlign: "center", fontWeight: "700" },

  lineTotal: { fontSize: 14, fontWeight: "700", color: colors.ink },
  removeText: { fontSize: 12, color: colors.remaRed, marginTop: 2 },

  checkoutBar: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  checkoutSum: { fontSize: 16, fontWeight: "800", color: colors.ink },
  checkoutBtn: { backgroundColor: colors.remaRed, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 },
  checkoutBtnText: { color: "#fff", fontWeight: "800" },
  pill: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  pillText: { fontWeight: "700", color: colors.ink },
});
