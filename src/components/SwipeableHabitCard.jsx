import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, ShieldCheck, Flame, Trophy, Snowflake, ChevronRight, CheckCircle2 } from 'lucide-react-native';
import { THEME } from '../theme/index.js';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
export const CARD_WIDTH = Math.min(SCREEN_WIDTH * 0.85, 360);

export function SwipeableHabitCard({ habit, onCheckinPress, onCardPress }) {
  const isBuild = habit.type === 'build';
  const isCompleted = habit.isTodayCompleted;
  const habitColor = habit.color_code || THEME.colors.primary;

  return (
    <View style={styles.cardContainer}>
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={() => onCardPress(habit)}
        style={[styles.cardWrapper, { borderColor: `${habitColor}50` }]}
      >
        <LinearGradient
          colors={['#171F2E', '#0F141F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          {/* Top color accent bar */}
          <View style={[styles.topAccentBar, { backgroundColor: habitColor }]} />

          {/* Header with Type badge and Freezes left */}
          <View style={styles.headerRow}>
            <View style={[styles.typeBadge, { backgroundColor: `${habitColor}25` }]}>
              {isBuild ? (
                <Camera size={13} color={habitColor} />
              ) : (
                <ShieldCheck size={13} color={habitColor} />
              )}
              <Text style={[styles.typeBadgeText, { color: habitColor }]}>
                {isBuild ? 'XÂY DỰNG (BUILD)' : 'TỪ BỎ / KỶ LUẬT (QUIT)'}
              </Text>
            </View>

            {/* Freeze quota indicator (max 3/month) */}
            <View style={styles.freezeBadge}>
              <Snowflake size={13} color={THEME.colors.freeze} />
              <Text style={styles.freezeBadgeText}>
                {habit.freezes_left ?? 3}/3 Freeze
              </Text>
            </View>
          </View>

          {/* Title & Reminder time */}
          <View style={styles.titleSection}>
            <Text style={styles.habitTitle} numberOfLines={2}>
              {habit.title}
            </Text>
            <Text style={styles.reminderTimeText}>
              ⏰ Nhắc nhở: {habit.reminder_time || '08:00'} hàng ngày
            </Text>
          </View>

          {/* Stats Row: Current Streak & Best Streak */}
          <View style={styles.statsRow}>
            {/* Current Streak */}
            <View style={[styles.statBox, { borderColor: `${THEME.colors.warning}30` }]}>
              <View style={styles.statIconHeader}>
                <Flame size={18} color={THEME.colors.warning} />
                <Text style={styles.statLabel}>STREAK HIỆN TẠI</Text>
              </View>
              <View style={styles.statValueRow}>
                <Text style={[styles.statValue, { color: THEME.colors.warning }]}>
                  {habit.currentStreak || 0}
                </Text>
                <Text style={styles.statUnit}>ngày</Text>
              </View>
            </View>

            {/* Best Streak */}
            <View style={[styles.statBox, { borderColor: `${THEME.colors.primary}30` }]}>
              <View style={styles.statIconHeader}>
                <Trophy size={16} color={THEME.colors.primary} />
                <Text style={styles.statLabel}>KỶ LỤC DÀI NHẤT</Text>
              </View>
              <View style={styles.statValueRow}>
                <Text style={[styles.statValue, { color: THEME.colors.primary }]}>
                  {habit.bestStreak || 0}
                </Text>
                <Text style={styles.statUnit}>ngày</Text>
              </View>
            </View>
          </View>

          {/* Action Button Section */}
          <View style={styles.actionSection}>
            {isCompleted ? (
              <View style={styles.completedBanner}>
                <CheckCircle2 size={20} color={THEME.colors.success} />
                <Text style={styles.completedText}>Đã hoàn thành hôm nay!</Text>
              </View>
            ) : (
              <TouchableOpacity
                activeOpacity={0.85}
                style={[
                  styles.actionButton,
                  { backgroundColor: isBuild ? habitColor : THEME.colors.warning }
                ]}
                onPress={() => onCheckinPress(habit)}
              >
                <LinearGradient
                  colors={
                    isBuild
                      ? [habitColor, `${habitColor}CC`]
                      : ['#F59E0B', '#D97706']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.actionButtonGradient}
                >
                  {isBuild ? (
                    <>
                      <Camera size={20} color="#FFFFFF" />
                      <Text style={styles.actionButtonText}>Chụp Ảnh Kỷ Luật</Text>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={20} color="#FFFFFF" />
                      <Text style={styles.actionButtonText}>I Survived (Tôi Vượt Qua)</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Tap for details hint */}
            <View style={styles.detailHintRow}>
              <Text style={styles.detailHintText}>Xem chi tiết lịch sử & video recap</Text>
              <ChevronRight size={14} color={THEME.colors.textMuted} />
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: CARD_WIDTH,
    marginHorizontal: 8,
    marginVertical: 12,
  },
  cardWrapper: {
    borderRadius: THEME.radius.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    backgroundColor: THEME.colors.surface,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  cardGradient: {
    padding: THEME.spacing.lg,
    minHeight: 380,
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
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: THEME.radius.full,
    gap: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  freezeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${THEME.colors.freeze}18`,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: THEME.radius.full,
    gap: 4,
    borderWidth: 1,
    borderColor: `${THEME.colors.freeze}40`,
  },
  freezeBadgeText: {
    color: THEME.colors.freeze,
    fontSize: 11,
    fontWeight: '700',
  },
  titleSection: {
    marginBottom: THEME.spacing.md,
  },
  habitTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  reminderTimeText: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: THEME.spacing.sm,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#0F141F',
    borderRadius: THEME.radius.md,
    padding: 12,
    borderWidth: 1,
  },
  statIconHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  statLabel: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
  },
  statUnit: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  actionSection: {
    marginTop: THEME.spacing.md,
    gap: 10,
  },
  actionButton: {
    borderRadius: THEME.radius.md,
    overflow: 'hidden',
    elevation: 4,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 10,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${THEME.colors.success}18`,
    paddingVertical: 14,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: `${THEME.colors.success}40`,
    gap: 8,
  },
  completedText: {
    color: THEME.colors.success,
    fontSize: 14,
    fontWeight: '700',
  },
  detailHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  detailHintText: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
});
