import React, { useState } from "react";
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  Text,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Fonts } from "@/constants/theme";

type TabType = "oktober" | "year" | "total" | "history";

type ReceiptItem = {
  id: string;
  name: string;
  qty: number;
  price: number;
  total: number;
  timestamp: Date;
};

type Receipt = {
  receiptId: string;
  items: ReceiptItem[];
  subtotal: number;
  timestamp: Date;
};

const MONTHS = [
  "Januar",
  "Februar",
  "Mars",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Desember",
];

// Global state to share receipt data between screens
let globalReceipts: Receipt[] = [];

export function addReceipt(items: ReceiptItem[], subtotal: number) {
  const receipt: Receipt = {
    receiptId: `receipt-${Date.now()}-${Math.random()}`,
    items,
    subtotal,
    timestamp: new Date(),
  };
  globalReceipts = [...globalReceipts, receipt];
}

export function getReceipts() {
  return globalReceipts;
}

export function clearReceipts() {
  globalReceipts = [];
}

// Barcode Component
function BarcodeDisplay() {
  return (
    <View style={styles.barcodeContainer}>
      <View style={styles.barcode}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((bar) => (
          <View
            key={bar}
            style={[
              styles.barcodeLine,
              {
                width: Math.random() * 4 + 2,
                marginHorizontal: 2,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

export default function HandleturScreen() {
  const colorScheme = useColorScheme();
  const [activeTab, setActiveTab] = useState<TabType>("oktober");
  const [selectedMonth, setSelectedMonth] = useState("Oktober");
  const [receipts, setReceipts] = useState<Receipt[]>([]);

  // Listen for receipt updates
  React.useEffect(() => {
    const interval = setInterval(() => {
      const allReceipts = getReceipts();
      setReceipts(allReceipts);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const isDark = colorScheme === "dark";
  const backgroundColor = "#E8F1F8";
  const cardBackground = "#FFFFFF";
  const tabContainerBg = "#DCE9F5";
  const activeTabBg = "#FFFFFF";
  const inactiveTabBg = "transparent";
  const titleColor = "#003380";
  const textColor = "#013DA4";
  const subtleTextColor = "#555555";
  const activeTabTextColor = "#013DA4";
  const inactiveTabTextColor = "#013DA4";

  const totalSaved = receipts.reduce(
    (sum, receipt) => sum + receipt.subtotal,
    0
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={{ alignItems: "flex-start", marginLeft: 15 }}>
          <Text
            style={[
              styles.headerTitle,
              {
                color: titleColor,
                fontFamily: Fonts.rounded,
                transform: [{ scaleY: 1.15 }, { scaleX: 0.75 }],
              },
            ]}
          >
            HANDLETURER
          </Text>
        </View>

        {/* Tab Navigation */}
        <View
          style={[styles.tabContainer, { backgroundColor: tabContainerBg }]}
        >
          <TouchableOpacity
            style={[
              styles.tab,
              {
                backgroundColor:
                  activeTab === "oktober" ? activeTabBg : inactiveTabBg,
              },
            ]}
            onPress={() => setActiveTab("oktober")}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === "oktober"
                      ? activeTabTextColor
                      : inactiveTabTextColor,
                },
              ]}
            >
              Oktober
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              {
                backgroundColor:
                  activeTab === "year" ? activeTabBg : inactiveTabBg,
              },
            ]}
            onPress={() => setActiveTab("year")}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === "year"
                      ? activeTabTextColor
                      : inactiveTabTextColor,
                },
              ]}
            >
              Hittil i år
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              {
                backgroundColor:
                  activeTab === "total" ? activeTabBg : inactiveTabBg,
              },
            ]}
            onPress={() => setActiveTab("total")}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === "total"
                      ? activeTabTextColor
                      : inactiveTabTextColor,
                },
              ]}
            >
              Totalt
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              {
                backgroundColor:
                  activeTab === "history" ? activeTabBg : inactiveTabBg,
              },
            ]}
            onPress={() => setActiveTab("history")}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === "history"
                      ? activeTabTextColor
                      : inactiveTabTextColor,
                },
              ]}
            >
              Historikk
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Month Selector - Only show for historikk tab */}
      {activeTab === "history" && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.monthScrollView}
          contentContainerStyle={styles.monthScrollContent}
        >
          {MONTHS.map((month) => (
            <TouchableOpacity
              key={month}
              style={styles.monthButton}
              onPress={() => setSelectedMonth(month)}
            >
              <Text
                style={[
                  styles.monthText,
                  {
                    color: selectedMonth === month ? "#555555" : "#999999",
                    fontWeight: selectedMonth === month ? "700" : "400",
                  },
                ]}
              >
                {month}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={[styles.card, { backgroundColor: cardBackground }]}>
          <Text style={[styles.cardLabel, { color: subtleTextColor }]}>
            Spart totalt
          </Text>
          <Text
            style={[
              styles.totalAmount,
              { color: titleColor, fontFamily: Fonts.rounded },
            ]}
          >
            {(totalSaved * 0.1).toFixed(2)} kr
          </Text>

          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <View style={styles.detailLeft}>
                <View
                  style={[styles.iconCircle, { backgroundColor: "#DCE9F5" }]}
                >
                  <Text style={styles.iconText}>%</Text>
                </View>
                <Text style={[styles.detailText, { color: textColor }]}>
                  Priskutt i kassa
                </Text>
              </View>
              <Text style={[styles.detailAmount, { color: textColor }]}>
                0,00 kr
              </Text>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailLeft}>
                <View
                  style={[styles.iconCircle, { backgroundColor: "#DCE9F5" }]}
                >
                  <Text style={styles.iconText}>%</Text>
                </View>
                <Text style={[styles.detailText, { color: textColor }]}>
                  Bonus tjent
                </Text>
              </View>
              <Text style={[styles.detailAmount, { color: textColor }]}>
                0,00 kr
              </Text>
            </View>
          </View>

          <View style={styles.summaryContainer}>
            <Text style={[styles.summaryText, { color: subtleTextColor }]}>
              Du har handlet for totalt
            </Text>
            <Text style={[styles.summaryAmount, { color: textColor }]}>
              {totalSaved.toFixed(2)} kr
            </Text>
          </View>
        </View>

        {/* Receipt History */}
        {receipts.length > 0 && (
          <View>
            {receipts.map((receipt) => (
              <View
                key={receipt.receiptId}
                style={[
                  styles.card,
                  { backgroundColor: cardBackground, marginTop: 12 },
                ]}
              >
                <View style={styles.receiptHeader}>
                  <Text style={[styles.cardLabel, { color: subtleTextColor }]}>
                    Kvittering
                  </Text>
                  <Text
                    style={[styles.receiptDate, { color: subtleTextColor }]}
                  >
                    {receipt.timestamp.toLocaleDateString("nb-NO")}
                  </Text>
                </View>

                {receipt.items.map((item, index) => (
                  <View key={item.id}>
                    <View style={styles.receiptRow}>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[styles.receiptItemName, { color: textColor }]}
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>
                        <Text
                          style={[
                            styles.receiptItemMeta,
                            { color: subtleTextColor },
                          ]}
                        >
                          {item.qty}x {item.price.toFixed(2)} kr
                        </Text>
                      </View>
                      <Text
                        style={[styles.receiptItemTotal, { color: textColor }]}
                      >
                        {item.total.toFixed(2)} kr
                      </Text>
                    </View>
                    {index < receipt.items.length - 1 && (
                      <View
                        style={[
                          styles.separator,
                          { backgroundColor: "#A7C5E7", marginVertical: 8 },
                        ]}
                      />
                    )}
                  </View>
                ))}

                <View
                  style={[styles.receiptTotal, { borderTopColor: "#A7C5E7" }]}
                >
                  <Text
                    style={[
                      styles.receiptTotalLabel,
                      { color: subtleTextColor },
                    ]}
                  >
                    Totalt
                  </Text>
                  <Text
                    style={[styles.receiptTotalAmount, { color: titleColor }]}
                  >
                    {receipt.subtotal.toFixed(2)} kr
                  </Text>
                </View>

                {/* Barcode under receipt */}
                <View style={styles.receiptBarcodeContainer}>
                  <BarcodeDisplay />
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    textAlign: "left",
    marginBottom: 18,
    letterSpacing: 0.5,
    lineHeight: 38,
  },
  tabContainer: {
    flexDirection: "row",
    borderRadius: 20,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 16,
  },
  tabText: {
    fontSize: 13,
    textAlign: "center",
    fontWeight: "700",
  },
  monthScrollView: {
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 0,
    flexGrow: 0,
    maxHeight: 40,
  },
  monthScrollContent: {
    gap: 10,
    paddingRight: 20,
  },
  monthButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  monthText: {
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 15,
    paddingTop: 8,
    paddingBottom: 15,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    marginTop: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: "400",
    marginBottom: 2,
  },
  totalAmount: {
    fontSize: 39,
    fontWeight: "900",
    marginBottom: 20,
  },
  detailsContainer: {
    paddingTop: 14,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  detailLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#A7C5E7",
  },
  iconText: {
    fontSize: 16,
    fontWeight: "600",
  },
  detailText: {
    fontSize: 15,
    fontWeight: "400",
  },
  detailAmount: {
    fontSize: 15,
    fontWeight: "500",
  },
  summaryContainer: {
    marginTop: 18,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: "#A7C5E7",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryText: {
    fontSize: 13,
    fontWeight: "400",
  },
  summaryAmount: {
    fontSize: 15,
    fontWeight: "600",
  },
  separator: {
    height: 1,
  },
  receiptHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  receiptDate: {
    fontSize: 11,
    fontWeight: "400",
  },
  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 4,
  },
  receiptItemName: {
    fontSize: 14,
    fontWeight: "600",
  },
  receiptItemMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  receiptItemTotal: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
  },
  receiptTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 12,
  },
  receiptTotalLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  receiptTotalAmount: {
    fontSize: 16,
    fontWeight: "700",
  },
  barcodeContainer: {
    marginVertical: 16,
  },
  barcode: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  barcodeLine: {
    height: 32,
    backgroundColor: "#013DA4",
  },
  receiptBarcodeContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#A7C5E7",
    alignItems: "center",
  },
});
