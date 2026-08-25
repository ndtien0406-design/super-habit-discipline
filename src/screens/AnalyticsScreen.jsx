import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ArrowLeft, TrendingUp } from 'lucide-react-native';
import { useAppTheme } from '../theme/index.js';
import { getAllCheckinsWithHabitInfo } from '../database/queries.js';

export function AnalyticsScreen({ navigation }) {
  const { THEME, colors } = useAppTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCompleted: 0,
    totalFailed: 0,
    contributionMap: {} // { 'YYYY-MM-DD': count }
  });

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      const checkins = await getAllCheckinsWithHabitInfo();
      
      let completed = 0;
      let failed = 0;
      const map = {};

      checkins.forEach(c => {
        if (c.status === 'completed') {
          completed++;
          map[c.checkin_date] = (map[c.checkin_date] || 0) + 1;
        } else if (c.status === 'failed') {
          failed++;
        }
      });

      setStats({
        totalCompleted: completed,
        totalFailed: failed,
        contributionMap: map
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Generate last 180 days for the grid (approx 6 months) to fit on mobile
  const getContributionGrid = () => {
    const grid = [];
    const today = new Date();
    for (let i = 180; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = stats.contributionMap[dateStr] || 0;
      grid.push({ date: dateStr, count });
    }
    return grid;
  };

  const getCellColor = (count) => {
    if (count === 0) return colors.surfaceBorder;
    if (count === 1) return `${colors.primary}40`; // 25% opacity
    if (count === 2) return `${colors.primary}80`; // 50% opacity
    if (count === 3) return `${colors.primary}C0`; // 75% opacity
    return colors.primary; // 100% opacity
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.topHeader, { backgroundColor: colors.bg, borderBottomColor: colors.surfaceBorder }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Phân Tích Dữ Liệu</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.summaryRow}>
            <View style={[styles.summaryBox, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              <Text style={[styles.summaryValue, { color: colors.success }]}>{stats.totalCompleted}</Text>
              <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Hoàn thành</Text>
            </View>
            <View style={[styles.summaryBox, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              <Text style={[styles.summaryValue, { color: colors.danger }]}>{stats.totalFailed}</Text>
              <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Thất bại</Text>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Biểu đồ Đóng góp (6 tháng qua)</Text>
          <View style={[styles.graphContainer, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.grid}>
                {getContributionGrid().map((cell, idx) => (
                  <View 
                    key={idx} 
                    style={[styles.cell, { backgroundColor: getCellColor(cell.count) }]} 
                  />
                ))}
              </View>
            </ScrollView>
            <View style={styles.legend}>
              <Text style={[styles.legendText, { color: colors.textMuted }]}>Ít</Text>
              <View style={[styles.cell, { backgroundColor: getCellColor(0) }]} />
              <View style={[styles.cell, { backgroundColor: getCellColor(1) }]} />
              <View style={[styles.cell, { backgroundColor: getCellColor(2) }]} />
              <View style={[styles.cell, { backgroundColor: getCellColor(3) }]} />
              <View style={[styles.cell, { backgroundColor: getCellColor(4) }]} />
              <Text style={[styles.legendText, { color: colors.textMuted }]}>Nhiều</Text>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  iconBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'Georgia',
    letterSpacing: -0.3,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  summaryBox: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 28,
    fontFamily: 'Georgia',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  graphContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  grid: {
    flexDirection: 'column',
    flexWrap: 'wrap',
    height: 120, // 7 rows roughly
    alignContent: 'flex-start',
    gap: 4,
  },
  cell: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: 4,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 4,
  },
  legendText: {
    fontSize: 10,
    marginHorizontal: 4,
  },
});
