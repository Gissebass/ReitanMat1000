// Place this file at: @/components/ui/RemaBrandHeader.tsx

import React from "react";
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  Text,
} from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";

interface RemaBrandHeaderProps {
  showCart?: boolean;
  showSearch?: boolean;
  cartCount?: number;
  onCartPress?: () => void;
  onSearchPress?: () => void;
  rightContent?: React.ReactNode;
  containerStyle?: ViewStyle;
}

const COLORS = {
  primary: "#013DA4",
  lightBlue: "#DCE9F5",
  mediumBlue: "#A7C5E7",
  white: "#FFFFFF",
  darkText: "#013DA4",
  lightText: "#555555",
  border: "#E5E7EB",
};

export function RemaBrandHeader({
  showCart = true,
  cartCount = 0,
  onCartPress,
  rightContent,
  containerStyle,
}: RemaBrandHeaderProps) {
  return (
    <View style={[styles.header, containerStyle]}>
      {/* Logo - Fixed position and size */}
      <Image
        source={require("@/assets/images/logos/REMA1000_horisontal_logo.png")}
        style={styles.logo}
      />

      {/* Right content container */}
      {rightContent ? (
        rightContent
      ) : (
        <View style={styles.headerRight}>
          {showCart && (
            <TouchableOpacity style={styles.iconButton} onPress={onCartPress}>
              <IconSymbol name="cart.fill" size={20} color={COLORS.primary} />
              {cartCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.lightBlue,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    minHeight: 80,
  },

  logo: {
    height: 56,
    width: 140,
    resizeMode: "contain",
  },

  headerRight: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },

  iconButton: {
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
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
});
