import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ShieldCheck, ArrowLeft, Heart, Flame, Sparkles, Check, Smile, BatteryCharging, Zap } from 'lucide-react-native';
import { useAppTheme, THEME } from '../theme/index.js';
import { getTodayDateString, formatDisplayDate } from '../utils/dateHelper.js';
import { insertOrUpdateCheckin, getCheckinByHabitAndDate, addExp } from '../database/queries.js';
import { updateHabitWidget } from '../services/widgetService.js';
import { isMilestone } from '../utils/streakEngine.js';

const MOOD_TAGS = [
  { label: '💪 Vững vàng', value: 'Steadfast' },
  { label: '🧘 Bình tĩnh', value: 'Calm' },
  { label: '🛡️ Đã kháng cự', value: 'Resisted' },
  { label: '⚡ Năng lượng', value: 'Energetic' },
  { label: '🎯 Tập trung', value: 'Focused' },
];

export function QuitCheckinScreen({ route, navigation }) {
  const { THEME, colors, isDark } = useAppTheme();
  
  const { habit } = route.params;
  const [note, setNote] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const today = getTodayDateString();
  const nextDayNumber = (habit.currentStreak || 0) + 1;
  const habitColor = habit.color_code || colors.warning;

  const handleConfirmSurvived = async () => {
    setIsSaving(true);
    try {
      const fullNote = selectedTag
        ? `[Mood: ${selectedTag}]\n${note.trim()}`
        : note.trim();

      // Check if already checked in today
      const existing = await getCheckinByHabitAndDate(habit.id, today);

      // 1. Insert checkin record into SQLite (image_path is NULL for quit habits)
      await insertOrUpdateCheckin({
        habit_id: habit.id,
        checkin_date: today,
        image_path: null,
        note: fullNote,
        day_number: nextDayNumber,
        status: 'completed',
      });

      if (!existing) {
        // Award EXP for completing checkin
        const { exp, level } = await addExp(10);
        console.log(`[Gamification] Gained 10 EXP. Current Level: ${level}, EXP: ${exp}`);
      }

      // 2. Update Android Widget
      await updateHabitWidget();

      setIsSaving(false);

      // 3. Check for milestone
      const reachedMilestone = isMilestone(nextDayNumber);

      navigation.navigate('Dashboard', {
        milestoneStreak: reachedMilestone ? nextDayNumber : null,
        milestoneHabitTitle: reachedMilestone ? habit.title : null,
        refresh: Date.now(),
      });
    } catch (error) {
      setIsSaving(false);
      Alert.alert('Lỗi Điểm Danh', error.message);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Top Header */}
      <View style={[styles.topHeader, { backgroundColor: colors.bg, borderBottomColor: colors.surfaceBorder }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Xác Nhận Kỷ Luật (Từ Bỏ)</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Card */}
        <LinearGradient
          colors={isDark ? ['#1E2638', '#0F1420'] : [colors.surface, colors.bg]}
          style={[styles.heroCard, { borderColor: colors.surfaceBorder }]}
        >
          <View style={[styles.heroIconCircle, { backgroundColor: `${habitColor}20`, borderColor: habitColor }]}>
            <ShieldCheck size={42} color={habitColor} />
          </View>

          <Text style={[styles.habitName, { color: colors.textPrimary }]}>{habit.title}</Text>
          <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>{formatDisplayDate(today, 'full')}</Text>

          <View style={styles.streakBadge}>
            <Flame size={18} color="#F59E0B" />
            <Text style={styles.streakBadgeText}>
              XÁC NHẬN VƯỢT QUA NGÀY {nextDayNumber}
            </Text>
          </View>
        </LinearGradient>

        {/* Mood Tags */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>TÂM TRẠNG HÔM NAY</Text>
          <View style={styles.tagGrid}>
            {MOOD_TAGS.map(tag => (
              <TouchableOpacity
                key={tag.value}
                style={[
                  styles.moodTag,
                  { backgroundColor: colors.surfaceSubtle, borderColor: colors.surfaceBorder },
                  selectedTag === tag.value && { backgroundColor: `${habitColor}30`, borderColor: habitColor }
                ]}
                onPress={() => setSelectedTag(selectedTag === tag.value ? '' : tag.value)}
              >
                <Text style={[
                  styles.moodTagText,
                  { color: colors.textSecondary },
                  selectedTag === tag.value && { color: habitColor, fontWeight: '700' }
                ]}>
                  {tag.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Reflection Note */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>NHẬT KÝ VƯỢT QUA CÁM DỖ (TÙY CHỌN)</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Ghi lại cảm xúc hoặc những cám dỗ bạn đã vượt qua hôm nay. Điều này sẽ được đồng bộ lên Notion.
          </Text>
          <TextInput
            style={[styles.reflectionInput, { backgroundColor: colors.surfaceSubtle, borderColor: colors.surfaceBorder, color: colors.textPrimary }]}
            placeholder="Bạn cảm thấy thế nào khi giữ kỷ luật hôm nay? Bạn đã đối mặt với cám dỗ ra sao?..."
            placeholderTextColor={colors.textMuted}
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={5}
          />
        </View>

        {/* Big "I Survived" Action Button */}
        <TouchableOpacity
          style={styles.survivedButton}
          onPress={handleConfirmSurvived}
          disabled={isSaving}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={['#F59E0B', '#D97706']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.survivedGradient}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <ShieldCheck size={22} color="#FFFFFF" />
                <Text style={styles.survivedButtonText}>TÔI ĐÃ VƯỢT QUA</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
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
    paddingHorizontal: THEME.spacing.md,
    paddingTop: 48,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  iconBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: THEME.typography.title2.fontFamily,
  },
  scrollContent: {
    padding: THEME.spacing.md,
  },
  heroCard: {
    borderRadius: THEME.radius.xl,
    padding: THEME.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: THEME.spacing.lg,
  },
  heroIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  habitName: {
    fontSize: 22,
    fontFamily: THEME.typography.title2.fontFamily,
    textAlign: 'center',
    marginBottom: 4,
  },
  dateLabel: {
    fontSize: 13,
    fontFamily: THEME.typography.body.fontFamily,
    marginBottom: THEME.spacing.md,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: THEME.radius.full,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  streakBadgeText: {
    color: THEME.colors.warning,
    fontSize: 12,
    fontFamily: THEME.typography.title2.fontFamily,
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: THEME.spacing.lg,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: THEME.typography.title2.fontFamily,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: THEME.typography.body.fontFamily,
    lineHeight: 17,
    marginBottom: 10,
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  moodTag: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: THEME.radius.md,
  },
  moodTagText: {
    fontSize: 13,
    fontFamily: THEME.typography.body.fontFamily,
  },
  reflectionInput: {
    borderRadius: THEME.radius.lg,
    borderWidth: 1,
    padding: 14,
    fontSize: 14,
    fontFamily: THEME.typography.body.fontFamily,
    lineHeight: 20,
    textAlignVertical: 'top',
    minHeight: 120,
  },
  survivedButton: {
    borderRadius: THEME.radius.lg,
    overflow: 'hidden',
    marginTop: THEME.spacing.sm,
    elevation: 8,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  survivedGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  survivedButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: THEME.typography.title2.fontFamily,
    letterSpacing: 0.5,
  },
});

