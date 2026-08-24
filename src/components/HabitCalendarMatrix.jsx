import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getRecentDays, formatDisplayDate, getTodayDateString } from '../utils/dateHelper.js';
import { THEME } from '../theme/index.js';

export function HabitCalendarMatrix({ checkins = [], habitColor = THEME.colors.primary, daysCount = 35 }) {
  const today = getTodayDateString();
  const days = getRecentDays(daysCount);

  const checkinMap = new Map();
  checkins.forEach(c => checkinMap.set(c.checkin_date, c.status));

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Lịch Sử Điểm Danh ({daysCount} ngày qua)</Text>
      </View>

      {/* Grid of days */}
      <View style={styles.grid}>
        {days.map((dateStr) => {
          const status = checkinMap.get(dateStr);
          const isToday = dateStr === today;
          
          let cellBg = '#141A26';
          let borderCol = '#232E44';
          let symbol = '';

          if (status === 'completed') {
            cellBg = habitColor || THEME.colors.success;
            borderCol = habitColor || THEME.colors.success;
            symbol = '✓';
          } else if (status === 'frozen') {
            cellBg = `${THEME.colors.freeze}50`;
            borderCol = THEME.colors.freeze;
            symbol = '❄';
          } else if (status === 'failed') {
            cellBg = `${THEME.colors.danger}40`;
            borderCol = THEME.colors.danger;
            symbol = '✕';
          }

          return (
            <View
              key={dateStr}
              style={[
                styles.dayCell,
                { backgroundColor: cellBg, borderColor: isToday ? '#FFFFFF' : borderCol },
                isToday && styles.todayCell
              ]}
            >
              <Text style={styles.cellSymbol}>{symbol}</Text>
            </View>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: habitColor || THEME.colors.success }]} />
          <Text style={styles.legendText}>Hoàn thành</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: THEME.colors.freeze }]} />
          <Text style={styles.legendText}>Freeze (Bảo lưu)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: THEME.colors.danger }]} />
          <Text style={styles.legendText}>Thất bại (Reset)</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    marginVertical: THEME.spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  title: {
    color: THEME.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: THEME.spacing.md,
  },
  dayCell: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayCell: {
    borderWidth: 2,
    transform: [{ scale: 1.1 }],
  },
  cellSymbol: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: THEME.colors.surfaceBorder,
    paddingTop: THEME.spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
});
