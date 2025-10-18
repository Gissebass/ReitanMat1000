import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, Text, SafeAreaView, StatusBar } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Fonts } from '@/constants/theme';

type TabType = 'oktober' | 'year' | 'total' | 'history';

const MONTHS = [
  'Januar', 'Februar', 'Mars', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Desember'
];

export default function HandleturScreen() {
  const colorScheme = useColorScheme();
  const [activeTab, setActiveTab] = useState<TabType>('oktober');
  const [selectedMonth, setSelectedMonth] = useState('Oktober');

  const isDark = colorScheme === 'dark';
  const backgroundColor = '#E8F1F8'; // Lighter blue
  const cardBackground = '#FFFFFF';
  const tabContainerBg = '#DCE9F5'; // Previous main background color
  const activeTabBg = '#FFFFFF';
  const inactiveTabBg = 'transparent';
  const titleColor = '#003380'; // Dark blue
  const textColor = '#013DA4';
  const subtleTextColor = '#555555';
  const activeTabTextColor = '#013DA4';
  const inactiveTabTextColor = '#013DA4';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={{ alignItems: 'flex-start', marginLeft: 15 }}>
          <Text style={[styles.headerTitle, { color: titleColor, fontFamily: Fonts.rounded, transform: [{ scaleY: 1.15 }, { scaleX: 0.75 }] }]}>HANDLETURER</Text>
        </View>
        
        {/* Tab Navigation */}
        <View style={[styles.tabContainer, { backgroundColor: tabContainerBg }]}>
          <TouchableOpacity 
            style={[
              styles.tab, 
              { backgroundColor: activeTab === 'oktober' ? activeTabBg : inactiveTabBg }
            ]}
            onPress={() => setActiveTab('oktober')}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === 'oktober' ? activeTabTextColor : inactiveTabTextColor }
            ]}>
              Oktober
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.tab, 
              { backgroundColor: activeTab === 'year' ? activeTabBg : inactiveTabBg }
            ]}
            onPress={() => setActiveTab('year')}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === 'year' ? activeTabTextColor : inactiveTabTextColor }
            ]}>
              Hittil i år
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.tab, 
              { backgroundColor: activeTab === 'total' ? activeTabBg : inactiveTabBg }
            ]}
            onPress={() => setActiveTab('total')}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === 'total' ? activeTabTextColor : inactiveTabTextColor }
            ]}>
              Totalt
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.tab, 
              { backgroundColor: activeTab === 'history' ? activeTabBg : inactiveTabBg }
            ]}
            onPress={() => setActiveTab('history')}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === 'history' ? activeTabTextColor : inactiveTabTextColor }
            ]}>
              Historikk
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Month Selector */}
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
            <Text style={[
              styles.monthText,
              { 
                color: selectedMonth === month ? '#555555' : '#999999',
                fontWeight: selectedMonth === month ? '700' : '400'
              }
            ]}>
              {month}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={[styles.card, { backgroundColor: cardBackground }]}>
          <Text style={[styles.cardLabel, { color: subtleTextColor }]}>
            Spart totalt
          </Text>
          <Text style={[styles.totalAmount, { color: titleColor, fontFamily: Fonts.rounded }]}>0 kr</Text>
          
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <View style={styles.detailLeft}>
                <View style={[styles.iconCircle, { backgroundColor: '#DCE9F5' }]}>
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
                <View style={[styles.iconCircle, { backgroundColor: '#DCE9F5' }]}>
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
              0,00 kr
            </Text>
          </View>
        </View>
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
    fontWeight: '800',
    textAlign: 'left',
    marginBottom: 18,
    letterSpacing: 0.5,
    lineHeight: 38,
  },
  tabContainer: {
    flexDirection: 'row',
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
    textAlign: 'center',
    fontWeight: '700',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '400',
    marginBottom: 2,
  },
  totalAmount: {
    fontSize: 39,
    fontWeight: '900',
    marginBottom: 20,
  },
  detailsContainer: {
    paddingTop: 14,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#A7C5E7',
  },
  iconText: {
    fontSize: 16,
    fontWeight: '600',
  },
  detailText: {
    fontSize: 15,
    fontWeight: '400',
  },
  detailAmount: {
    fontSize: 15,
    fontWeight: '500',
  },
  summaryContainer: {
    marginTop: 18,
    paddingTop: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#A7C5E7',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 13,
    fontWeight: '400',
  },
  summaryAmount: {
    fontSize: 15,
    fontWeight: '600',
  },
});