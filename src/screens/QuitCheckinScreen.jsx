import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ShieldCheck, ArrowLeft, Heart, Flame, Sparkles, Check, Smile, BatteryCharging, Zap } from 'lucide-react-native';
import { THEME } from '../theme/index.js';
import { getTodayDateString, formatDisplayDate } from '../utils/dateHelper.js';
import { insertOrUpdateCheckin } from '../database/queries.js';
import { updateHabitWidget } from '../services/widgetService.js';
import { isMilestone } from '../utils/streakEngine.js';

const MOOD_TAGS = [
  { label: '💪 Kiên định', value: 'Kiên định' },
  { label: '🧘 Bình thản', value: 'Bình thản' },
  { label: '🛡️ Vượt cám dỗ', value: 'Vượt cám dỗ' },
  { label: '⚡ Năng lượng', value: 'Năng lượng' },
  { label: '🎯 Tập trung', value: 'Tập trung' },
];

export function QuitCheckinScreen({ route, navigation }) {
  const { habit } = route.params;
  const [note, setNote] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const today = getTodayDateString();
  const nextDayNumber = (habit.currentStreak || 0) + 1;
  const habitColor = habit.color_code || THEME.colors.warning;

  const handleConfirmSurvived = async () => {
    setIsSaving(true);
    try {
      const fullNote = selectedTag
        ? `[Tâm trạng: ${selectedTag}]\n${note.trim()}`
        : note.trim();

      // 1. Insert checkin record into SQLite (image_path is NULL for quit habits)
      await insertOrUpdateCheckin({
        habit_id: habit.id,
        checkin_date: today,
        image_path: null,
        note: fullNote,
        day_number: nextDayNumber,
        status: 'completed',
      });

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
      Alert.alert('Lỗi lưu điểm danh', error.message);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <ArrowLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Xác Nhận Kỷ Luật (Quit)</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Card */}
        <LinearGradient
          colors={['#1E2638', '#0F1420']}
          style={styles.heroCard}
        >
          <View style={[styles.heroIconCircle, { backgroundColor: `${habitColor}20`, borderColor: habitColor }]}>
            <ShieldCheck size={42} color={habitColor} />
          </View>

          <Text style={styles.habitName}>{habit.title}</Text>
          <Text style={styles.dateLabel}>{formatDisplayDate(today, 'full')}</Text>

          <View style={styles.streakBadge}>
            <Flame size={18} color="#F59E0B" />
            <Text style={styles.streakBadgeText}>
              XÁC NHẬN HOÀN THÀNH NGÀY THỨ {nextDayNumber}
            </Text>
          </View>
        </LinearGradient>

        {/* Mood Tags */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TÂM TRẠNG HÔM NAY</Text>
          <View style={styles.tagGrid}>
            {MOOD_TAGS.map(tag => (
              <TouchableOpacity
                key={tag.value}
                style={[
                  styles.moodTag,
                  selectedTag === tag.value && { backgroundColor: `${habitColor}30`, borderColor: habitColor }
                ]}
                onPress={() => setSelectedTag(selectedTag === tag.value ? '' : tag.value)}
              >
                <Text style={[
                  styles.moodTagText,
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
          <Text style={styles.sectionTitle}>NHẬT KÝ VƯỢT QUA CÁM DỖ (TÙY CHỌN)</Text>
          <Text style={styles.sectionSubtitle}>
            Ghi lại cảm xúc hoặc thử thách bạn đã vượt qua hôm nay. Nội dung này sẽ được đồng bộ trực tiếp lên Notion.
          </Text>
          <TextInput
            style={styles.reflectionInput}
            placeholder="Hôm nay bạn cảm thấy thế nào khi giữ được kỷ luật? Bạn đã đối mặt với cám dỗ ra sao?..."
            placeholderTextColor={THEME.colors.textMuted}
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
                <Text style={styles.survivedButtonText}>I SURVIVED (Tôi Đã Vượt Qua!)</Text>
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
    backgroundColor: THEME.colors.bg,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.md,
    paddingTop: 48,
    paddingBottom: 14,
    backgroundColor: '#0F141F',
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.surfaceBorder,
  },
  iconBtn: {
    padding: 8,
  },
  headerTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  scrollContent: {
    padding: THEME.spacing.md,
  },
  heroCard: {
    borderRadius: THEME.radius.xl,
    padding: THEME.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
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
    color: THEME.colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  dateLabel: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
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
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: THEME.spacing.lg,
  },
  sectionTitle: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  sectionSubtitle: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  moodTag: {
    backgroundColor: '#141A26',
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: THEME.radius.md,
  },
  moodTagText: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  reflectionInput: {
    backgroundColor: '#141A26',
    borderRadius: THEME.radius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    color: THEME.colors.textPrimary,
    padding: 14,
    fontSize: 14,
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
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
