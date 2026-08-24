import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  FlatList,
  Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Flame,
  Trophy,
  Snowflake,
  Film,
  Trash2,
  Edit,
  Camera,
  ShieldCheck,
  Calendar,
  Sparkles,
  X
} from 'lucide-react-native';
import { THEME } from '../theme/index.js';
import { getHabitById, getCheckinsByHabitId, deleteHabit, updateHabit } from '../database/queries.js';
import { calculateStreakMetrics } from '../utils/streakEngine.js';
import { HabitCalendarMatrix } from '../components/HabitCalendarMatrix.jsx';
import { VideoRecapModal } from '../components/VideoRecapModal.jsx';
import { formatDisplayDate, getTodayDateString } from '../utils/dateHelper.js';
import { cancelHabitReminder } from '../services/notificationManager.js';
import { updateHabitWidget } from '../services/widgetService.js';

export function HabitDetailScreen({ route, navigation }) {
  const { habitId } = route.params;
  const [habit, setHabit] = useState(null);
  const [checkins, setCheckins] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const loadHabitData = useCallback(async () => {
    try {
      const h = await getHabitById(habitId);
      if (!h) {
        Alert.alert('Không tìm thấy', 'Thói quen này không tồn tại.');
        navigation.goBack();
        return;
      }
      const cList = await getCheckinsByHabitId(habitId);
      const met = calculateStreakMetrics(cList, getTodayDateString());

      setHabit(h);
      setCheckins(cList);
      setMetrics(met);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [habitId, navigation]);

  useEffect(() => {
    loadHabitData();
  }, [loadHabitData]);

  const handleDelete = () => {
    Alert.alert(
      'Xóa Thói Quen',
      `Bạn có chắc chắn muốn xóa vĩnh viễn "${habit.title}" cùng toàn bộ lịch sử điểm danh?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            await cancelHabitReminder(habit.id);
            await deleteHabit(habit.id);
            await updateHabitWidget();
            navigation.navigate('Dashboard', { refresh: Date.now() });
          },
        },
      ]
    );
  };

  if (loading || !habit || !metrics) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
      </View>
    );
  }

  const isBuild = habit.type === 'build';
  const habitColor = habit.color_code || THEME.colors.primary;
  const photoCheckins = checkins.filter((c) => c.image_path != null);
  const notesCheckins = checkins.filter((c) => c.note && c.note.trim().length > 0);

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <ArrowLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{habit.title}</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.iconBtn}>
          <Trash2 size={20} color={THEME.colors.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Habit Hero Card */}
        <LinearGradient
          colors={['#1E273A', '#0F1420']}
          style={[styles.heroCard, { borderColor: `${habitColor}60` }]}
        >
          <View style={[styles.topAccent, { backgroundColor: habitColor }]} />

          <View style={styles.typeBadgeRow}>
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

            <View style={styles.freezeBadge}>
              <Snowflake size={13} color={THEME.colors.freeze} />
              <Text style={styles.freezeBadgeText}>
                {habit.freezes_left ?? 3}/3 Freeze
              </Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>{habit.title}</Text>
          <Text style={styles.heroReminder}>⏰ Nhắc nhở lúc {habit.reminder_time || '08:00'} mỗi ngày</Text>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={[styles.statBox, { borderColor: `${THEME.colors.warning}30` }]}>
              <Flame size={18} color={THEME.colors.warning} />
              <Text style={styles.statLabel}>STREAK HIỆN TẠI</Text>
              <Text style={[styles.statNumber, { color: THEME.colors.warning }]}>
                {metrics.currentStreak} <Text style={styles.statUnit}>ngày</Text>
              </Text>
            </View>

            <View style={[styles.statBox, { borderColor: `${THEME.colors.primary}30` }]}>
              <Trophy size={18} color={THEME.colors.primary} />
              <Text style={styles.statLabel}>KỶ LỤC DÀI NHẤT</Text>
              <Text style={[styles.statNumber, { color: THEME.colors.primary }]}>
                {metrics.bestStreak} <Text style={styles.statUnit}>ngày</Text>
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Video Recap Action Card (For Build Habits) */}
        {isBuild && (
          <TouchableOpacity
            style={styles.recapBanner}
            onPress={() => setVideoModalVisible(true)}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={['#6366F1', '#4F46E5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.recapBannerGradient}
            >
              <View style={styles.recapBannerLeft}>
                <Film size={24} color="#FFFFFF" />
                <View>
                  <Text style={styles.recapBannerTitle}>Xuất Video Recap Timelapse</Text>
                  <Text style={styles.recapBannerDesc}>
                    Ghép {photoCheckins.length} ảnh watermark thành video ngắn 3-5s (FFmpeg Local)
                  </Text>
                </View>
              </View>
              <Sparkles size={18} color="#FDE047" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Calendar History Matrix */}
        <HabitCalendarMatrix
          checkins={checkins}
          habitColor={habitColor}
          daysCount={35}
        />

        {/* Build Photo Gallery Timeline */}
        {isBuild && photoCheckins.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>BỘ SƯU TẬP ẢNH KỶ LUẬT ({photoCheckins.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
              {photoCheckins.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.photoThumbWrapper}
                  onPress={() => setSelectedPhoto(item)}
                >
                  <Image source={{ uri: item.image_path }} style={styles.photoThumb} />
                  <View style={styles.photoDayBadge}>
                    <Text style={styles.photoDayText}>Ngày {item.day_number}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Reflection Notes History */}
        {notesCheckins.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>NHẬT KÝ & GHI CHÚ ({notesCheckins.length})</Text>
            {notesCheckins.slice().reverse().map((item) => (
              <View key={item.id} style={styles.noteCard}>
                <View style={styles.noteCardHeader}>
                  <Text style={styles.noteDayNumber}>Ngày {item.day_number}</Text>
                  <Text style={styles.noteDate}>{formatDisplayDate(item.checkin_date, 'short')}</Text>
                </View>
                <Text style={styles.noteContent}>{item.note}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Video Recap Modal */}
      {isBuild && (
        <VideoRecapModal
          visible={videoModalVisible}
          habit={habit}
          images={photoCheckins}
          onClose={() => setVideoModalVisible(false)}
        />
      )}

      {/* Full Size Photo View Modal */}
      {selectedPhoto && (
        <Modal visible={true} transparent animationType="fade" onRequestClose={() => setSelectedPhoto(null)}>
          <View style={styles.photoModalOverlay}>
            <TouchableOpacity style={styles.closePhotoBtn} onPress={() => setSelectedPhoto(null)}>
              <X size={26} color="#FFFFFF" />
            </TouchableOpacity>
            <Image
              source={{ uri: selectedPhoto.image_path }}
              style={styles.fullSizePhoto}
              resizeMode="contain"
            />
            <View style={styles.fullPhotoBottomInfo}>
              <Text style={styles.fullPhotoDay}>Ngày {selectedPhoto.day_number}</Text>
              <Text style={styles.fullPhotoDate}>{formatDisplayDate(selectedPhoto.checkin_date, 'full')}</Text>
              {selectedPhoto.note ? (
                <Text style={styles.fullPhotoNote}>{selectedPhoto.note}</Text>
              ) : null}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.bg,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: THEME.colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
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
    maxWidth: '70%',
  },
  scrollContent: {
    padding: THEME.spacing.md,
  },
  heroCard: {
    borderRadius: THEME.radius.xl,
    padding: THEME.spacing.lg,
    borderWidth: 1.5,
    marginBottom: THEME.spacing.md,
    position: 'relative',
    overflow: 'hidden',
  },
  topAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  typeBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
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
  heroTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    marginTop: 4,
    marginBottom: 4,
  },
  heroReminder: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
    marginBottom: THEME.spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#0F141F',
    borderRadius: THEME.radius.md,
    padding: 12,
    borderWidth: 1,
  },
  statLabel: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 6,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 2,
  },
  statUnit: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  recapBanner: {
    borderRadius: THEME.radius.lg,
    overflow: 'hidden',
    marginBottom: THEME.spacing.md,
    elevation: 4,
  },
  recapBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  recapBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  recapBannerTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  recapBannerDesc: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    marginTop: 2,
  },
  sectionContainer: {
    marginVertical: THEME.spacing.sm,
  },
  sectionTitle: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  photoScroll: {
    flexDirection: 'row',
  },
  photoThumbWrapper: {
    width: 100,
    height: 140,
    borderRadius: THEME.radius.md,
    overflow: 'hidden',
    marginRight: 10,
    backgroundColor: '#141A26',
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    position: 'relative',
  },
  photoThumb: {
    width: '100%',
    height: '100%',
  },
  photoDayBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(10, 13, 20, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: THEME.radius.sm,
  },
  photoDayText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  noteCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.md,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
  },
  noteCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  noteDayNumber: {
    color: THEME.colors.warning,
    fontSize: 12,
    fontWeight: '700',
  },
  noteDate: {
    color: THEME.colors.textMuted,
    fontSize: 11,
  },
  noteContent: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  photoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closePhotoBtn: {
    position: 'absolute',
    top: 48,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  fullSizePhoto: {
    width: '90%',
    height: '70%',
    borderRadius: THEME.radius.lg,
  },
  fullPhotoBottomInfo: {
    marginTop: 16,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  fullPhotoDay: {
    color: THEME.colors.warning,
    fontSize: 18,
    fontWeight: '800',
  },
  fullPhotoDate: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  fullPhotoNote: {
    color: THEME.colors.textPrimary,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});
