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
import { ArrowLeft, Camera, ShieldCheck, Check, Clock, Palette } from 'lucide-react-native';
import { THEME } from '../theme/index.js';
import { createHabit } from '../database/queries.js';
import { scheduleHabitReminder } from '../services/notificationManager.js';
import { updateHabitWidget } from '../services/widgetService.js';

const TIME_PRESETS = ['06:00', '07:00', '08:00', '12:00', '18:00', '20:00', '21:30', '22:00'];

export function CreateHabitScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('build'); // 'build' or 'quit'
  const [colorCode, setColorCode] = useState(THEME.habitColorPresets[0].hex);
  const [reminderTime, setReminderTime] = useState('08:00');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Chưa nhập tên', 'Vui lòng nhập tên thói quen kỷ luật.');
      return;
    }

    setIsSaving(true);
    try {
      const habitId = await createHabit({
        title: title.trim(),
        type,
        color_code: colorCode,
        reminder_time: reminderTime,
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
      Alert.alert('Lỗi tạo thói quen', error.message);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <ArrowLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tạo Thói Quen Kỷ Luật</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Title Input */}
        <View style={styles.section}>
          <Text style={styles.label}>TÊN THÓI QUEN</Text>
          <TextInput
            style={styles.input}
            placeholder="Ví dụ: Đọc sách 30 phút, Chạy bộ, Không hút thuốc..."
            placeholderTextColor={THEME.colors.textMuted}
            value={title}
            onChangeText={setTitle}
            maxLength={60}
          />
        </View>

        {/* Habit Type Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>LOẠI THÓI QUEN</Text>
          <View style={styles.typeSelectorRow}>
            {/* Build Type Card */}
            <TouchableOpacity
              style={[
                styles.typeOptionCard,
                type === 'build' && { borderColor: THEME.colors.success, backgroundColor: '#10B98115' }
              ]}
              onPress={() => setType('build')}
              activeOpacity={0.85}
            >
              <View style={[styles.typeIconCircle, { backgroundColor: '#10B98125' }]}>
                <Camera size={22} color={THEME.colors.success} />
              </View>
              <Text style={[styles.typeTitle, type === 'build' && { color: THEME.colors.success }]}>
                XÂY DỰNG (Build)
              </Text>
              <Text style={styles.typeDesc}>
                Yêu cầu chụp ảnh bằng chứng mỗi ngày, tự động đóng watermark số ngày streak.
              </Text>
            </TouchableOpacity>

            {/* Quit Type Card */}
            <TouchableOpacity
              style={[
                styles.typeOptionCard,
                type === 'quit' && { borderColor: THEME.colors.warning, backgroundColor: '#F59E0B15' }
              ]}
              onPress={() => setType('quit')}
              activeOpacity={0.85}
            >
              <View style={[styles.typeIconCircle, { backgroundColor: '#F59E0B25' }]}>
                <ShieldCheck size={22} color={THEME.colors.warning} />
              </View>
              <Text style={[styles.typeTitle, type === 'quit' && { color: THEME.colors.warning }]}>
                TỪ BỎ (Quit)
              </Text>
              <Text style={styles.typeDesc}>
                Bấm "I Survived" để xác nhận kỷ luật, viết nhật ký phản tư, không cần ảnh.
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Color Palette Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderWithIcon}>
            <Palette size={16} color={THEME.colors.textMuted} />
            <Text style={styles.label}>MÀU SẮC ĐẠI DIỆN</Text>
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
                    isSelected && styles.colorCircleSelected
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
            <Clock size={16} color={THEME.colors.textMuted} />
            <Text style={styles.label}>GIỜ NHẮC NHỞ HÀNG NGÀY</Text>
          </View>
          <View style={styles.timePresetsGrid}>
            {TIME_PRESETS.map((t) => {
              const isSelected = reminderTime === t;
              return (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.timeChip,
                    isSelected && { backgroundColor: `${colorCode}25`, borderColor: colorCode }
                  ]}
                  onPress={() => setReminderTime(t)}
                >
                  <Text style={[styles.timeChipText, isSelected && { color: colorCode, fontWeight: '700' }]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[colorCode, `${colorCode}CC`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveGradient}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Check size={20} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>Tạo Thói Quen</Text>
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
    fontSize: 17,
    fontWeight: '700',
  },
  scrollContent: {
    padding: THEME.spacing.md,
  },
  section: {
    marginBottom: THEME.spacing.lg,
  },
  sectionHeaderWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  label: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#141A26',
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    color: THEME.colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 10,
  },
  typeOptionCard: {
    flex: 1,
    backgroundColor: '#141A26',
    borderRadius: THEME.radius.lg,
    padding: 14,
    borderWidth: 1.5,
    borderColor: THEME.colors.surfaceBorder,
  },
  typeIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  typeTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  typeDesc: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.15 }],
  },
  timePresetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeChip: {
    backgroundColor: '#141A26',
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: THEME.radius.md,
  },
  timeChipText: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  saveBtn: {
    borderRadius: THEME.radius.lg,
    overflow: 'hidden',
    marginTop: THEME.spacing.md,
    marginBottom: 32,
    elevation: 6,
  },
  saveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
