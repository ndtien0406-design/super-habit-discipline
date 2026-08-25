import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, ShieldCheck, Flame, Trophy, Snowflake, ChevronRight, CheckCircle2, Calendar } from 'lucide-react-native';
import { useAppTheme, THEME } from '../theme/index.js';
import { getDaysDifference, getTodayDateString, formatDisplayDate } from '../utils/dateHelper.js';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
export const CARD_WIDTH = '100%';

export function SwipeableHabitCard({ habit, onCheckinPress, onCardPress, onCardLongPress }) {
  const { THEME, colors, isDark } = useAppTheme();
  
  const isBuild = habit.type === 'build';
  const isCompleted = habit.isTodayCompleted;
  const habitColor = habit.color_code || colors.primary;

  return (
    <View style={styles.cardContainer}>
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={() => onCardPress(habit)}
        onLongPress={() => onCardLongPress && onCardLongPress(habit)}
        delayLongPress={600}
        style={[styles.cardWrapper, { backgroundColor: colors.surface, shadowColor: colors.textPrimary }]}
      >
        <View style={[styles.cardInner, { backgroundColor: colors.surface }]}>
          {/* Header with Type badge and Freezes left */}
          <View style={styles.headerRow}>
            <View style={[styles.typeBadge, { backgroundColor: `${habitColor}25` }]}>
              {isBuild ? (
                <Camera size={16} color={habitColor} />
              ) : (
                <ShieldCheck size={16} color={habitColor} />
              )}
            </View>

            {/* Freeze quota indicator (max 3/month) */}
            <View style={[styles.freezeBadge, { backgroundColor: `${colors.freeze}10`, borderColor: `${colors.freeze}30` }]}>
              <Snowflake size={13} color={colors.freeze} />
              <Text style={[styles.freezeBadgeText, { color: colors.freeze }]}>
                {(typeof habit.freezes_left === 'number' && !isNaN(habit.freezes_left)) ? habit.freezes_left : 3}/3 Bỏ qua
              </Text>
            </View>
          </View>

          {/* Title & Reminder time */}
          <View style={styles.titleSection}>
            <Text style={[styles.habitTitle, { color: colors.textPrimary }]} numberOfLines={2}>
              {habit.title}
            </Text>
            {habit.notes ? (
              <Text style={[styles.habitNotes, { color: colors.textMuted }]} numberOfLines={1}>
                {habit.notes}
              </Text>
            ) : null}
            <Text style={[styles.reminderTimeText, { color: colors.textSecondary }]}>
              ⏰ Nhắc nhở: {habit.reminder_time ? habit.reminder_time.split(',').join(' & ') : '08:00'} mỗi ngày
            </Text>
          </View>

          {/* Stats Row: Current Streak & Best Streak OR Deadline */}
          <View style={styles.statsRow}>
            {habit.target_type === 'date' ? (() => {
              const daysLeft = habit.target_date ? getDaysDifference(getTodayDateString(), habit.target_date) : 0;
              return (
                <>
                  <View style={[styles.statBox, { backgroundColor: colors.surfaceSubtle }]}>
                    <View style={styles.statIconHeader}>
                      <Flame size={18} color={colors.warning} />
                      <Text style={[styles.statLabel, { color: colors.textMuted }]}>CHUỖI HIỆN TẠI</Text>
                    </View>
                    <View style={styles.statValueRow}>
                      <Text style={[styles.statValue, { color: colors.warning }]}>
                        {habit.currentStreak || 0}
                      </Text>
                      <Text style={[styles.statUnit, { color: colors.textSecondary }]}>ngày</Text>
                    </View>
                  </View>

                  <View style={[styles.statBox, { backgroundColor: colors.surfaceSubtle }]}>
                    <View style={styles.statIconHeader}>
                      <Calendar size={16} color={colors.primary} />
                      <Text style={[styles.statLabel, { color: colors.textMuted }]}>SỐ NGÀY CÒN LẠI</Text>
                    </View>
                    <View style={styles.statValueRow}>
                      <Text style={[styles.statValue, { color: colors.primary }]}>
                        {Math.max(0, daysLeft)}
                      </Text>
                      <Text style={[styles.statUnit, { color: colors.textSecondary }]}>ngày</Text>
                    </View>
                  </View>
                </>
              );
            })() : (
              <>
                {/* Current Streak */}
                <View style={[styles.statBox, { backgroundColor: colors.surfaceSubtle }]}>
                  <View style={styles.statIconHeader}>
                    <Flame size={18} color={colors.warning} />
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>CHUỖI HIỆN TẠI</Text>
                  </View>
                  <View style={styles.statValueRow}>
                    <Text style={[styles.statValue, { color: colors.warning }]}>
                      {habit.currentStreak || 0}
                    </Text>
                    <Text style={[styles.statUnit, { color: colors.textSecondary }]}>ngày</Text>
                  </View>
                </View>

                {/* Best Streak */}
                <View style={[styles.statBox, { backgroundColor: colors.surfaceSubtle }]}>
                  <View style={styles.statIconHeader}>
                    <Trophy size={16} color={colors.primary} />
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>KỶ LỤC DÀI NHẤT</Text>
                  </View>
                  <View style={styles.statValueRow}>
                    <Text style={[styles.statValue, { color: colors.primary }]}>
                      {habit.bestStreak || 0}
                    </Text>
                    <Text style={[styles.statUnit, { color: colors.textSecondary }]}>ngày</Text>
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Action Button Section */}
          <View style={styles.actionSection}>
            {isCompleted ? (
              <View style={[styles.completedBanner, { backgroundColor: `${colors.success}10`, borderColor: `${colors.success}30` }]}>
                <CheckCircle2 size={20} color={colors.success} />
                <Text style={[styles.completedText, { color: colors.success }]}>Hoàn thành hôm nay!</Text>
              </View>
            ) : (
              <TouchableOpacity
                activeOpacity={0.85}
                style={[
                  styles.actionButton,
                  { backgroundColor: isBuild ? habitColor : colors.warning }
                ]}
                onPress={() => onCheckinPress(habit)}
              >
                <View style={styles.actionButtonInner}>
                  {isBuild ? (
                    <>
                      <Camera size={20} color={isDark ? '#000' : '#FFF'} />
                      <Text style={[styles.actionButtonText, { color: isDark ? '#000' : '#FFF' }]}>Chụp Ảnh Minh Chứng</Text>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={20} color={isDark ? '#000' : '#FFF'} />
                      <Text style={[styles.actionButtonText, { color: isDark ? '#000' : '#FFF' }]}>Đã Vượt Qua</Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>
            )}

            {/* Tap for details hint */}
            <View style={styles.detailHintRow}>
              <Text style={[styles.detailHintText, { color: colors.textMuted }]}>Xem lịch sử & tổng kết</Text>
              <ChevronRight size={14} color={colors.textMuted} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    marginVertical: 8,
  },
  cardWrapper: {
    borderRadius: THEME.radius.lg,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardInner: {
    padding: THEME.spacing.lg,
    minHeight: 320,
    justifyContent: 'space-between',
  },
  topAccentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: THEME.radius.full,
  },
  freezeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: THEME.radius.full,
    gap: 4,
    borderWidth: 1,
  },
  freezeBadgeText: {
    fontSize: 11,
    fontFamily: THEME.typography.small.fontFamily,
    fontWeight: THEME.typography.small.fontWeight,
    textTransform: THEME.typography.small.textTransform,
  },
  titleSection: {
    marginBottom: THEME.spacing.md,
  },
  habitTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 24,
    fontFamily: THEME.typography.title1.fontFamily,
    letterSpacing: THEME.typography.title1.letterSpacing,
    marginBottom: 4,
  },
  habitNotes: {
    fontSize: 13,
    fontFamily: THEME.typography.body.fontFamily,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  reminderTimeText: {
    fontSize: 13,
    fontFamily: THEME.typography.body.fontFamily,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: THEME.spacing.sm,
  },
  statBox: {
    flex: 1,
    borderRadius: THEME.radius.md,
    padding: 16,
    // border removed
  },
  statIconHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: THEME.typography.small.fontFamily,
    textTransform: THEME.typography.small.textTransform,
    letterSpacing: 0.5,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  statValue: {
    fontSize: 32,
    fontFamily: THEME.typography.hero.fontFamily,
    letterSpacing: THEME.typography.hero.letterSpacing,
  },
  statUnit: {
    fontSize: 13,
    fontFamily: THEME.typography.bodyBold.fontFamily,
    fontWeight: THEME.typography.bodyBold.fontWeight,
  },
  actionSection: {
    marginTop: THEME.spacing.md,
    gap: 12,
  },
  actionButton: {
    borderRadius: THEME.radius.full,
    overflow: 'hidden',
  },
  actionButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 10,
  },
  actionButtonText: {
    fontSize: 15,
    fontFamily: THEME.typography.bodyBold.fontFamily,
    fontWeight: THEME.typography.bodyBold.fontWeight,
    letterSpacing: 0.2,
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: THEME.radius.full,
    borderWidth: 1,
    gap: 8,
  },
  completedText: {
    fontSize: 14,
    fontFamily: THEME.typography.bodyBold.fontFamily,
    fontWeight: THEME.typography.bodyBold.fontWeight,
  },
  detailHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 4,
  },
  detailHintText: {
    fontSize: 13,
    fontFamily: THEME.typography.body.fontFamily,
  },
});
