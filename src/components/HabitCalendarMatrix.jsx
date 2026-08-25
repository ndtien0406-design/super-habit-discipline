import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getRecentDays, formatDisplayDate, getTodayDateString } from '../utils/dateHelper.js';
import { useAppTheme } from '../theme/index.js';

export function HabitCalendarMatrix({ checkins = [], habitColor, daysCount = 35 }) {
  const { THEME, colors, isDark } = useAppTheme();
  const today = getTodayDateString();
  const days = getRecentDays(daysCount);

  const checkinMap = new Map();
  checkins.forEach(c => checkinMap.set(c.checkin_date, c.status));

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Check-in History (Last {daysCount} days)</Text>
      </View>

      {/* Grid of days */}
      <View style={styles.grid}>
        {days.map((dateStr) => {
          const status = checkinMap.get(dateStr);
          const isToday = dateStr === today;
          
          let cellBg = colors.surfaceSubtle;
          let borderCol = colors.surfaceBorder;
          let symbol = '';
          const activeHabitColor = habitColor || colors.primary;

          if (status === 'completed') {
            cellBg = activeHabitColor;
            borderCol = activeHabitColor;
            symbol = '✓';
          } else if (status === 'frozen') {
            cellBg = `${colors.freeze}50`;
            borderCol = colors.freeze;
            symbol = '❄';
          } else if (status === 'failed') {
            cellBg = `${colors.danger}40`;
            borderCol = colors.danger;
            symbol = '✕';
          }

          return (
            <View
              key={dateStr}
              style={[
                styles.dayCell,
                { backgroundColor: cellBg, borderColor: isToday ? colors.textPrimary : borderCol },
                isToday && styles.todayCell
              ]}
            >
              <Text style={[styles.cellSymbol, { color: isDark ? '#000' : '#FFF' }]}>{symbol}</Text>
            </View>
          );
        })}
      </View>

      {/* Legend */}
      <View style={[styles.legendRow, { borderTopColor: colors.surfaceBorder }]}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: habitColor || colors.primary }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Completed</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.freeze }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Freeze</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Failed</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.md,
    // removed border completely for cleaner minimal look
    marginVertical: THEME.spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  title: {
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
    fontSize: 10,
    fontWeight: '900',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
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
    fontSize: 11,
    fontWeight: '500',
  },
});
