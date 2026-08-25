import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Camera, ShieldCheck, Check, Clock, Palette, Flag } from 'lucide-react-native';
import { useAppTheme } from '../theme/index.js';
import { createHabit } from '../database/queries.js';
import { scheduleHabitReminder } from '../services/notificationManager.js';
import { updateHabitWidget } from '../services/widgetService.js';
import { parseVietnameseDateToIso } from '../utils/dateHelper.js';

const TIME_PRESETS = ['06:00', '07:00', '08:00', '12:00', '18:00', '20:00', '21:30', '22:00'];

export function CreateHabitScreen({ navigation }) {
  const { THEME, colors, isDark } = useAppTheme();
  
  const [title, setTitle] = useState('');
  const [type, setType] = useState('build'); // 'build' or 'quit'
  const [colorCode, setColorCode] = useState(THEME.habitColorPresets[0].hex);
  const [reminderTime, setReminderTime] = useState('08:00');
  const [targetType, setTargetType] = useState('none'); // 'none' | 'streak' | 'date'
  const [targetStreak, setTargetStreak] = useState('21');
  const [targetDate, setTargetDate] = useState(''); // e.g. 01/01/2027
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Name missing', 'Please enter a habit name.');
      return;
    }

    setIsSaving(true);
    try {
      const isoDate = targetType === 'date' ? parseVietnameseDateToIso(targetDate) : null;
      if (targetType === 'date' && !isoDate) {
        Alert.alert('Invalid date', 'Please enter date in DD/MM/YYYY format (e.g., 01/01/2027)');
        setIsSaving(false);
        return;
      }

      const habitId = await createHabit({
        title: title.trim(),
        type,
        color_code: colorCode,
        reminder_time: reminderTime,
        target_streak: targetType === 'streak' ? (parseInt(targetStreak) || 21) : 0,
        target_type: targetType,
        target_date: isoDate,
      });

      // Schedule daily reminder
      await scheduleHabitReminder({
        id: habitId,
        title: title.trim(),
        type,
        color_code: colorCode,
        reminder_time: reminderTime,
      });

      // Update widget
      await updateHabitWidget();

      setIsSaving(false);
      navigation.navigate('Dashboard', { refresh: Date.now() });
    } catch (error) {
      setIsSaving(false);
      Alert.alert('Error creating habit', error.message);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Top Header */}
      <View style={[styles.topHeader, { backgroundColor: colors.bg, borderBottomColor: colors.surfaceBorder }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Create New Habit</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Title Input */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textMuted }]}>HABIT NAME</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, color: colors.textPrimary }]}
            placeholder="e.g., Read for 30 mins, Run 5km..."
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
            maxLength={60}
          />
        </View>

        {/* Habit Type Selection */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textMuted }]}>HABIT TYPE</Text>
          <View style={styles.typeSelectorRow}>
            {/* Build Type Card */}
            <TouchableOpacity
              style={[
                styles.typeOptionCard,
                { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
                type === 'build' && { borderColor: colors.success, backgroundColor: isDark ? '#10B98125' : '#10B98115' }
              ]}
              onPress={() => setType('build')}
              activeOpacity={0.85}
            >
              <View style={[styles.typeIconCircle, { backgroundColor: isDark ? '#10B98135' : '#10B98125' }]}>
                <Camera size={22} color={colors.success} />
              </View>
              <Text style={[styles.typeTitle, { color: colors.textPrimary }, type === 'build' && { color: colors.success }]}>
                Photo Proof
              </Text>
            </TouchableOpacity>

            {/* Quit Type Card */}
            <TouchableOpacity
              style={[
                styles.typeOptionCard,
                { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
                type === 'quit' && { borderColor: colors.warning, backgroundColor: isDark ? '#F59E0B25' : '#F59E0B15' }
              ]}
              onPress={() => setType('quit')}
              activeOpacity={0.85}
            >
              <View style={[styles.typeIconCircle, { backgroundColor: isDark ? '#F59E0B35' : '#F59E0B25' }]}>
                <ShieldCheck size={22} color={colors.warning} />
              </View>
              <Text style={[styles.typeTitle, { color: colors.textPrimary }, type === 'quit' && { color: colors.warning }]}>
                I Survived
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Target Streak Input */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderWithIcon}>
            <Flag size={16} color={colors.textMuted} />
            <Text style={[styles.label, { color: colors.textMuted }]}>COMPLETION TARGET</Text>
          </View>
          
          <View style={[styles.targetTypeToggle, { backgroundColor: colors.surfaceSubtle, borderColor: colors.surfaceBorder }]}>
            <TouchableOpacity
              style={[styles.targetTypeBtn, targetType === 'none' && styles.targetTypeBtnActive, targetType === 'none' && { backgroundColor: colors.surface, shadowColor: colors.textPrimary }]}
              onPress={() => setTargetType('none')}
              activeOpacity={0.7}
            >
              <Text style={[styles.targetTypeBtnText, { color: colors.textMuted }, targetType === 'none' && [styles.targetTypeBtnTextActive, { color: colors.textPrimary }]]}>Forever</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.targetTypeBtn, targetType === 'streak' && styles.targetTypeBtnActive, targetType === 'streak' && { backgroundColor: colors.surface, shadowColor: colors.textPrimary }]}
              onPress={() => setTargetType('streak')}
              activeOpacity={0.7}
            >
              <Text style={[styles.targetTypeBtnText, { color: colors.textMuted }, targetType === 'streak' && [styles.targetTypeBtnTextActive, { color: colors.textPrimary }]]}>Streak Goal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.targetTypeBtn, targetType === 'date' && styles.targetTypeBtnActive, targetType === 'date' && { backgroundColor: colors.surface, shadowColor: colors.textPrimary }]}
              onPress={() => setTargetType('date')}
              activeOpacity={0.7}
            >
              <Text style={[styles.targetTypeBtnText, { color: colors.textMuted }, targetType === 'date' && [styles.targetTypeBtnTextActive, { color: colors.textPrimary }]]}>By Date</Text>
            </TouchableOpacity>
          </View>

          {targetType === 'streak' && (
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, color: colors.textPrimary }]}
              placeholder="e.g., 21, 66, 90 (days)..."
              placeholderTextColor={colors.textMuted}
              value={targetStreak}
              onChangeText={setTargetStreak}
              keyboardType="number-pad"
              maxLength={4}
            />
          )}
          {targetType === 'date' && (
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, color: colors.textPrimary }]}
              placeholder="e.g., 01/01/2027"
              placeholderTextColor={colors.textMuted}
              value={targetDate}
              onChangeText={setTargetDate}
              maxLength={10}
            />
          )}
        </View>

        {/* Color Palette Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderWithIcon}>
            <Palette size={16} color={colors.textMuted} />
            <Text style={[styles.label, { color: colors.textMuted }]}>THEME COLOR</Text>
          </View>
          <View style={styles.paletteGrid}>
            {THEME.habitColorPresets.map((preset) => {
              const isSelected = colorCode === preset.hex;
              return (
                <TouchableOpacity
                  key={preset.hex}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: preset.hex },
                    isSelected && [styles.colorCircleSelected, { borderColor: colors.textPrimary }]
                  ]}
                  onPress={() => setColorCode(preset.hex)}
                >
                  {isSelected && <Check size={16} color="#FFFFFF" />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Reminder Time Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderWithIcon}>
            <Clock size={16} color={colors.textMuted} />
            <Text style={[styles.label, { color: colors.textMuted }]}>DAILY REMINDER TIME</Text>
          </View>
          <View style={styles.timePresetsGrid}>
            {TIME_PRESETS.map((t) => {
              const isSelected = reminderTime === t;
              return (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.timeChip,
                    { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
                    isSelected && { backgroundColor: `${colorCode}25`, borderColor: colorCode }
                  ]}
                  onPress={() => setReminderTime(t)}
                >
                  <Text style={[styles.timeChipText, { color: colors.textSecondary }, isSelected && { color: colorCode, fontWeight: '700' }]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colorCode }]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.9}
        >
          <View style={styles.saveInner}>
            {isSaving ? (
              <ActivityIndicator size="small" color={isDark ? '#000' : '#FFF'} />
            ) : (
              <>
                <Check size={20} color={isDark ? '#000' : '#FFF'} />
                <Text style={[styles.saveBtnText, { color: isDark ? '#000' : '#FFF' }]}>Create Habit</Text>
              </>
            )}
          </View>
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
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  iconBtn: {
    padding: 8,
    borderRadius: THEME.radius.full,
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: THEME.typography.title2.fontFamily,
  },
  scrollContent: {
    padding: THEME.spacing.lg,
  },
  section: {
    marginBottom: THEME.spacing.xl,
  },
  sectionHeaderWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    fontFamily: THEME.typography.small.fontFamily,
    fontWeight: THEME.typography.small.fontWeight,
    textTransform: THEME.typography.small.textTransform,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  input: {
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: THEME.typography.body.fontFamily,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 12,
  },
  typeOptionCard: {
    flex: 1,
    borderRadius: THEME.radius.lg,
    padding: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  typeIconCircle: {
    width: 48,
    height: 48,
    borderRadius: THEME.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeTitle: {
    fontSize: 14,
    fontFamily: THEME.typography.bodyBold.fontFamily,
    fontWeight: THEME.typography.bodyBold.fontWeight,
    marginBottom: 4,
    textAlign: 'center',
  },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: THEME.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorCircleSelected: {
    borderWidth: 3,
    transform: [{ scale: 1.1 }],
  },
  timePresetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeChip: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: THEME.radius.full,
  },
  timeChipText: {
    fontSize: 14,
    fontFamily: THEME.typography.bodyBold.fontFamily,
    fontWeight: THEME.typography.bodyBold.fontWeight,
  },
  saveBtn: {
    borderRadius: THEME.radius.full,
    overflow: 'hidden',
    marginTop: THEME.spacing.md,
    marginBottom: 40,
  },
  saveInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  saveBtnText: {
    fontSize: 16,
    fontFamily: THEME.typography.bodyBold.fontFamily,
    fontWeight: THEME.typography.bodyBold.fontWeight,
  },
  targetTypeToggle: {
    flexDirection: 'row',
    borderRadius: THEME.radius.full,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
  },
  targetTypeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: THEME.radius.full,
  },
  targetTypeBtnActive: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  targetTypeBtnText: {
    fontSize: 13,
    fontFamily: THEME.typography.bodyBold.fontFamily,
    fontWeight: THEME.typography.bodyBold.fontWeight,
  },
  targetTypeBtnTextActive: {
  }
});
