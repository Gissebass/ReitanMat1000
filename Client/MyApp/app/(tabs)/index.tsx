import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { ShoppingCart, ChevronRight, Search } from "lucide-react-native";

const COLORS = {
  primary: "#013DA4",
  lightBlue: "#DCE9F5",
  mediumBlue: "#A7C5E7",
  white: "#FFFFFF",
  darkText: "#013DA4",
  lightText: "#555555",
  border: "#E5E7EB",
};

export default function RemaHomeScreen() {
  const router = useRouter();
  const [cartCount, setCartCount] = useState(0);

  const promotions = [
    {
      id: 1,
      title: "TIEN 25% BONUS PÅ ALLE",
      subtitle: "Bonusoppdrag på R-nyheter",
      gradient: true,
    },
    {
      id: 2,
      title: "25% BONUS PÅ 8 FRUKT- OG GRØNTVARER",
      subtitle: "Gjelder til og med søndag 19. oktober",
      hasTag: true,
    },
  ];

  const categories = [
    { id: 1, name: "Frukt & Grønt", icon: "🍎" },
    { id: 2, name: "Kjøtt", icon: "🥩" },
    { id: 3, name: "Melk & Ost", icon: "🧀" },
    { id: 4, name: "Brød", icon: "🍞" },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          style={styles.headerTitle}
          source={require("../../assets/images/logos/REMA1000_horisontal_logo.png")}
        />
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.searchButton}>
            <Search color={COLORS.primary} size={20} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => router.push("/shoppingcart")}
          >
            <ShoppingCart color={COLORS.primary} size={20} />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Barcode Scanner Section */}
        <View style={styles.scannerSection}>
          <View style={styles.scannerBox}>
            <Text style={styles.scannerLabel}>STREKKODEN DIN</Text>
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
            <Text style={styles.scannerHint}>Klikk for mer informasjon</Text>
          </View>
        </View>

        {/* Bonus Account Section */}
        <View style={styles.bonusSection}>
          <TouchableOpacity style={styles.bonusCard}>
            <View style={styles.bonusLeft}>
              <View style={styles.bonusIcon}>
                <Text style={styles.star}>★</Text>
              </View>
              <View>
                <Text style={styles.bonusTitle}>0 kr på din bonuskonto</Text>
                <Text style={styles.bonusSubtitle}>Bruk bonusen din</Text>
              </View>
            </View>
            <ChevronRight color={COLORS.primary} size={20} />
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <View style={styles.categoriesSection}>
          <View style={styles.categoryGrid}>
            {categories.map((cat) => (
              <TouchableOpacity key={cat.id} style={styles.categoryCard}>
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text style={styles.categoryName}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Promotions */}
        <View style={styles.promotionsSection}>
          <Text style={styles.sectionTitle}>
            REMA 1000 ER MESTVINNENDE I PRISTESTER
          </Text>
          {promotions.map((promo) => (
            <TouchableOpacity key={promo.id} style={styles.promotionCard}>
              <View style={styles.promotionContent}>
                <Text style={styles.promotionTitle}>{promo.title}</Text>
                <Text style={styles.promotionSubtitle}>{promo.subtitle}</Text>
              </View>
              <ChevronRight color={COLORS.primary} size={24} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Featured Products */}
        <View style={styles.featuredSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>UTVALGTE VARER</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>Se alle →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.productCard}>
            <View style={styles.productImage} />
            <View style={styles.productInfo}>
              <Text style={styles.productName}>FILTERM KJELDSBERG</Text>
              <Text style={styles.productDesc}>KJELDSBERG, 250 G</Text>
              <View style={styles.priceContainer}>
                <Text style={styles.productPrice}>34.90</Text>
                <Text style={styles.priceUnit}>kr</Text>
              </View>
            </View>
          </View>

          <View style={styles.productCard}>
            <View style={styles.productImage} />
            <View style={styles.productInfo}>
              <Text style={styles.productName}>LAKS LENKE U/SKINN</Text>
              <Text style={styles.productDesc}>FISKERIET, 500 G</Text>
              <View style={styles.priceContainer}>
                <Text style={styles.productPrice}>79.00</Text>
                <Text style={styles.priceUnit}>kr</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Features */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>NYHET! ALLERGENSKANNER</Text>
          <TouchableOpacity style={styles.featureCard}>
            <View style={styles.featureBg} />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>ALLERGENSKANNER</Text>
              <Text style={styles.featureDesc}>Er du allergisk mot noe?</Text>
              <TouchableOpacity style={styles.featureButton}>
                <Text style={styles.featureButtonText}>ÅPNE →</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>

        {/* Recipes */}
        <View style={styles.recipeSection}>
          <Text style={styles.sectionTitle}>UKEMENY PÅ 1-2-3</Text>
          <TouchableOpacity style={styles.recipeCard}>
            <View style={styles.recipeBg} />
            <View style={styles.recipeContent}>
              <Text style={styles.recipeTitle}>UKEMENY</Text>
              <Text style={styles.recipeDesc}>
                Ukens inspirerende oppskrifter
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  // Header
  header: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    height: 80,
    width: 200,
    resizeMode: "contain",
    marginRight: 16,
  },
  headerRight: {
    flexDirection: "row",
    gap: 8,
  },
  searchButton: {
    padding: 8,
  },
  cartButton: {
    padding: 8,
    position: "relative",
  },
  cartBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#DC2626",
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  cartBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "700",
  },

  // Scanner Section
  scannerSection: {
    padding: 16,
  },
  scannerBox: {
    backgroundColor: COLORS.lightBlue,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
  },
  scannerLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 12,
    textTransform: "uppercase",
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
    backgroundColor: COLORS.primary,
  },
  scannerHint: {
    fontSize: 12,
    color: COLORS.lightText,
  },

  // Bonus Section
  bonusSection: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  bonusCard: {
    backgroundColor: COLORS.lightBlue,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bonusLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  bonusIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FBBF24",
    justifyContent: "center",
    alignItems: "center",
  },
  star: {
    fontSize: 20,
    fontWeight: "bold",
  },
  bonusTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
  },
  bonusSubtitle: {
    fontSize: 11,
    color: COLORS.lightText,
    marginTop: 2,
  },

  // Categories
  categoriesSection: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  categoryCard: {
    width: "48%",
    backgroundColor: COLORS.lightBlue,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
    textAlign: "center",
  },

  // Promotions
  promotionsSection: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.primary,
    marginBottom: 12,
    textTransform: "uppercase",
  },
  promotionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: COLORS.mediumBlue,
  },
  promotionContent: {
    flex: 1,
  },
  promotionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 4,
  },
  promotionSubtitle: {
    fontSize: 11,
    color: COLORS.lightText,
  },

  // Featured Section
  featuredSection: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primary,
  },
  productCard: {
    backgroundColor: COLORS.lightBlue,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    gap: 12,
  },
  productImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: COLORS.mediumBlue,
  },
  productInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  productName: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },
  productDesc: {
    fontSize: 10,
    color: COLORS.lightText,
    marginVertical: 2,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.primary,
  },
  priceUnit: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.primary,
  },

  // Features
  featuresSection: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  featureCard: {
    backgroundColor: COLORS.mediumBlue,
    borderRadius: 16,
    overflow: "hidden",
    minHeight: 100,
  },
  featureBg: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.primary,
    opacity: 0.1,
  },
  featureContent: {
    padding: 16,
    zIndex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.primary,
  },
  featureDesc: {
    fontSize: 12,
    color: COLORS.primary,
    marginVertical: 6,
  },
  featureButton: {
    marginTop: 8,
    paddingVertical: 6,
  },
  featureButtonText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primary,
  },

  // Recipe
  recipeSection: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  recipeCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 16,
    minHeight: 80,
    justifyContent: "center",
  },
  recipeBg: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  recipeContent: {
    zIndex: 1,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.white,
  },
  recipeDesc: {
    fontSize: 12,
    color: COLORS.lightBlue,
    marginTop: 4,
  },

  spacer: {
    height: 20,
  },
});
