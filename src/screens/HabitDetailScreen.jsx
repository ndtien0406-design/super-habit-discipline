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
  Modal,
  Platform
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
  X,
  Download
} from 'lucide-react-native';
import * as MediaLibrary from 'expo-media-library';
import { useAppTheme, THEME } from '../theme/index.js';
import { getHabitById, getCheckinsByHabitId, deleteHabit, updateHabit } from '../database/queries.js';
import { calculateStreakMetrics } from '../utils/streakEngine.js';
import { HabitCalendarMatrix } from '../components/HabitCalendarMatrix.jsx';
import { VideoRecapModal } from '../components/VideoRecapModal.jsx';
import { formatDisplayDate, getTodayDateString, getDaysDifference } from '../utils/dateHelper.js';
import { cancelHabitReminder } from '../services/notificationManager.js';
import { updateHabitWidget } from '../services/widgetService.js';

export function HabitDetailScreen({ route, navigation }) {
  const { THEME, colors, isDark } = useAppTheme();
  
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
    const message = `Bạn có chắc chắn muốn xóa vĩnh viễn thói quen "${habit.title}" và toàn bộ lịch sử điểm danh của nó không?`;

    if (Platform.OS === 'web') {
      if (window.confirm(message)) {
        cancelHabitReminder(habit.id).then(() => {
          return deleteHabit(habit.id);
        }).then(() => {
          return updateHabitWidget();
        }).then(() => {
          navigation.navigate('Dashboard', { refresh: Date.now() });
        });
      }
      return;
    }

    Alert.alert(
      'Xóa Thói Quen',
      message,
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

  const handleDownloadPhoto = async () => {
    if (!selectedPhoto) return;
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Từ chối quyền', 'Cần cấp quyền truy cập Thư viện ảnh để lưu.');
        return;
      }
      
      await MediaLibrary.saveToLibraryAsync(selectedPhoto.image_path);
      Alert.alert('Thành công', 'Ảnh đã được tải xuống Thư viện (Gallery) của máy!');
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể lưu ảnh: ' + e.message);
    }
  };

  if (loading || !habit || !metrics) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const isBuild = habit.type === 'build';
  const habitColor = habit.color_code || colors.primary;
  const photoCheckins = checkins.filter((c) => c.image_path != null);
  const notesCheckins = checkins.filter((c) => c.note && c.note.trim().length > 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Top Header */}
      <View style={[styles.topHeader, { backgroundColor: colors.bg, borderBottomColor: colors.surfaceBorder }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>{habit.title}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity onPress={() => navigation.navigate('EditHabit', { habitId: habit.id })} style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <Edit size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <Trash2 size={20} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Habit Hero Card */}
        <View
          style={[styles.heroCard, { backgroundColor: colors.surface, shadowColor: colors.textPrimary }]}
        >

          <View style={styles.typeBadgeRow}>
            <View style={[styles.typeBadge, { backgroundColor: `${habitColor}25` }]}>
              {isBuild ? (
                <Camera size={13} color={habitColor} />
              ) : (
                <ShieldCheck size={13} color={habitColor} />
              )}
              <Text style={[styles.typeBadgeText, { color: habitColor }]}>
                {isBuild ? 'Chụp Ảnh' : 'Đã Vượt Qua'}
              </Text>
            </View>

            <View style={[styles.freezeBadge, { backgroundColor: `${colors.freeze}10`, borderColor: `${colors.freeze}30` }]}>
              <Snowflake size={13} color={colors.freeze} />
              <Text style={[styles.freezeBadgeText, { color: colors.freeze }]}>
                {(typeof habit.freezes_left === 'number' && !isNaN(habit.freezes_left)) ? habit.freezes_left : 3}/3 Bỏ qua
              </Text>
            </View>
          </View>

          <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>{habit.title}</Text>
          <Text style={[styles.heroReminder, { color: colors.textSecondary }]}>⏰ Nhắc nhở vào {habit.reminder_time ? habit.reminder_time.split(',').join(' & ') : '08:00'} mỗi ngày</Text>
          
          {habit.notes ? (
            <Text style={[styles.heroNotes, { color: colors.textMuted, backgroundColor: colors.surfaceSubtle }]}>
              "{habit.notes}"
            </Text>
          ) : null}

          {/* Stats Row */}
          <View style={styles.statsRow}>
            {habit.target_type === 'date' ? (() => {
              const daysLeft = habit.target_date ? getDaysDifference(getTodayDateString(), habit.target_date) : 0;
              return (
                <>
                  <View style={[styles.statBox, { backgroundColor: colors.surfaceSubtle }]}>
                    <Flame size={18} color={colors.warning} />
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>CHUỖI HIỆN TẠI</Text>
                    <Text style={[styles.statNumber, { color: colors.warning }]}>
                      {metrics.currentStreak} <Text style={[styles.statUnit, { color: colors.textSecondary }]}>ngày</Text>
                    </Text>
                  </View>

                  <View style={[styles.statBox, { backgroundColor: colors.surfaceSubtle }]}>
                    <Calendar size={18} color={colors.primary} />
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>SỐ NGÀY CÒN LẠI</Text>
                    <Text style={[styles.statNumber, { color: colors.primary }]}>
                      {Math.max(0, daysLeft)} <Text style={[styles.statUnit, { color: colors.textSecondary }]}>ngày</Text>
                    </Text>
                  </View>
                </>
              );
            })() : (
              <>
                <View style={[styles.statBox, { backgroundColor: colors.surfaceSubtle }]}>
                  <Flame size={18} color={colors.warning} />
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>CHUỖI HIỆN TẠI</Text>
                  <Text style={[styles.statNumber, { color: colors.warning }]}>
                    {metrics.currentStreak} <Text style={[styles.statUnit, { color: colors.textSecondary }]}>ngày</Text>
                  </Text>
                </View>

                <View style={[styles.statBox, { backgroundColor: colors.surfaceSubtle }]}>
                  <Trophy size={18} color={colors.primary} />
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>KỶ LỤC DÀI NHẤT</Text>
                  <Text style={[styles.statNumber, { color: colors.primary }]}>
                    {metrics.bestStreak} <Text style={[styles.statUnit, { color: colors.textSecondary }]}>ngày</Text>
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Video Recap Action Card (For Build Habits) */}
        {isBuild && (
          <TouchableOpacity
            style={[styles.recapBanner, { borderColor: colors.surfaceBorder }]}
            onPress={() => setVideoModalVisible(true)}
            activeOpacity={0.88}
          >
            <View style={[styles.recapBannerGradient, { backgroundColor: colors.primary }]}>
              <View style={styles.recapBannerLeft}>
                <Film size={24} color={isDark ? '#000' : '#FFF'} />
                <View>
                  <Text style={[styles.recapBannerTitle, { color: isDark ? '#000' : '#FFF' }]}>Xuất Video Timelapse Kỷ Niệm</Text>
                  <Text style={[styles.recapBannerDesc, { color: isDark ? '#000' : '#FFF' }]}>
                    Ghép {photoCheckins.length} ảnh có đóng dấu thành video 3-5s (FFmpeg Local)
                  </Text>
                </View>
              </View>
              <Sparkles size={18} color="#FDE047" />
            </View>
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
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>THƯ VIỆN ẢNH CHỨNG MINH ({photoCheckins.length})</Text>
              <TouchableOpacity onPress={() => navigation.navigate('VisualTimeline', { habitId: habit.id, habitTitle: habit.title })}>
                <Text style={{ color: colors.primary, fontSize: 12, fontWeight: 'bold' }}>Xem tất cả &gt;</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
              {photoCheckins.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.photoThumbWrapper, { backgroundColor: colors.surfaceSubtle, borderColor: colors.surfaceBorder }]}
                  onPress={() => setSelectedPhoto(item)}
                >
                  <Image source={{ uri: item.image_path }} style={styles.photoThumb} />
                  <View style={[styles.photoDayBadge, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
                    <Text style={[styles.photoDayText, { color: colors.textPrimary }]}>Ngày {item.day_number}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Reflection Notes History */}
        {notesCheckins.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>NHẬT KÝ & GHI CHÚ ({notesCheckins.length})</Text>
            {notesCheckins.slice().reverse().map((item) => (
              <View key={item.id} style={[styles.noteCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
                <View style={styles.noteCardHeader}>
                  <Text style={[styles.noteDayNumber, { color: colors.warning }]}>Ngày {item.day_number}</Text>
                  <Text style={[styles.noteDate, { color: colors.textMuted }]}>{formatDisplayDate(item.checkin_date, 'short')}</Text>
                </View>
                <Text style={[styles.noteContent, { color: colors.textSecondary }]}>{item.note}</Text>
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
          <View style={[styles.photoModalOverlay, { backgroundColor: colors.bg }]}>
            <TouchableOpacity style={[styles.closePhotoBtn, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]} onPress={() => setSelectedPhoto(null)}>
              <X size={26} color={colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.downloadPhotoBtn, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]} onPress={handleDownloadPhoto}>
              <Download size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <Image
              source={{ uri: selectedPhoto.image_path }}
              style={[styles.fullSizePhoto, { borderColor: colors.surfaceBorder }]}
              resizeMode="contain"
            />
            <View style={styles.fullPhotoBottomInfo}>
              <Text style={[styles.fullPhotoDay, { color: colors.warning }]}>Ngày {selectedPhoto.day_number}</Text>
              <Text style={[styles.fullPhotoDate, { color: colors.textSecondary }]}>{formatDisplayDate(selectedPhoto.checkin_date, 'full')}</Text>
              {selectedPhoto.note ? (
                <Text style={[styles.fullPhotoNote, { color: colors.textPrimary }]}>{selectedPhoto.note}</Text>
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
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    maxWidth: '65%',
    textAlign: 'center',
  },
  scrollContent: {
    padding: THEME.spacing.lg,
  },
  heroCard: {
    borderRadius: THEME.radius.xl,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.lg,
    position: 'relative',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  typeBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.radius.full,
    gap: 6,
  },
  typeBadgeText: {
    fontSize: 12,
    fontFamily: THEME.typography.bodyBold.fontFamily,
    fontWeight: THEME.typography.bodyBold.fontWeight,
  },
  freezeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
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
  heroTitle: {
    fontSize: 32,
    fontFamily: THEME.typography.hero.fontFamily,
    letterSpacing: THEME.typography.hero.letterSpacing,
    marginTop: 8,
    marginBottom: 6,
  },
  heroReminder: {
    fontSize: 14,
    fontFamily: THEME.typography.body.fontFamily,
    marginBottom: 8,
  },
  heroNotes: {
    fontSize: 14,
    fontFamily: THEME.typography.body.fontFamily,
    fontStyle: 'italic',
    padding: 12,
    borderRadius: THEME.radius.md,
    marginBottom: THEME.spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    borderRadius: THEME.radius.md,
    padding: 16,
    // removed border
  },
  statLabel: {
    fontSize: 10,
    fontFamily: THEME.typography.small.fontFamily,
    textTransform: THEME.typography.small.textTransform,
    letterSpacing: 0.5,
    marginTop: 8,
  },
  statNumber: {
    fontSize: 28,
    fontFamily: THEME.typography.title1.fontFamily,
    marginTop: 4,
  },
  statUnit: {
    fontSize: 13,
    fontFamily: THEME.typography.bodyBold.fontFamily,
    fontWeight: THEME.typography.bodyBold.fontWeight,
  },
  recapBanner: {
    borderRadius: THEME.radius.lg,
    overflow: 'hidden',
    marginBottom: THEME.spacing.xl,
    borderWidth: 1,
  },
  recapBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  recapBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  recapBannerTitle: {
    fontSize: 16,
    fontFamily: THEME.typography.bodyBold.fontFamily,
    fontWeight: THEME.typography.bodyBold.fontWeight,
  },
  recapBannerDesc: {
    opacity: 0.8,
    fontSize: 13,
    fontFamily: THEME.typography.body.fontFamily,
    marginTop: 4,
  },
  sectionContainer: {
    marginVertical: THEME.spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: THEME.typography.small.fontFamily,
    textTransform: THEME.typography.small.textTransform,
    fontWeight: THEME.typography.small.fontWeight,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  photoScroll: {
    flexDirection: 'row',
  },
  photoThumbWrapper: {
    width: 110,
    height: 150,
    borderRadius: THEME.radius.md,
    overflow: 'hidden',
    marginRight: 12,
    borderWidth: 1,
    position: 'relative',
  },
  photoThumb: {
    width: '100%',
    height: '100%',
  },
  photoDayBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME.radius.sm,
    borderWidth: 1,
  },
  photoDayText: {
    fontSize: 11,
    fontFamily: THEME.typography.small.fontFamily,
    fontWeight: THEME.typography.small.fontWeight,
    textTransform: THEME.typography.small.textTransform,
  },
  noteCard: {
    borderRadius: THEME.radius.md,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
  },
  noteCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  noteDayNumber: {
    fontSize: 13,
    fontFamily: THEME.typography.bodyBold.fontFamily,
    fontWeight: THEME.typography.bodyBold.fontWeight,
  },
  noteDate: {
    fontSize: 12,
    fontFamily: THEME.typography.body.fontFamily,
  },
  noteContent: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: THEME.typography.body.fontFamily,
  },
  photoModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closePhotoBtn: {
    position: 'absolute',
    top: 56,
    right: 24,
    zIndex: 10,
    padding: 10,
    borderRadius: THEME.radius.full,
    borderWidth: 1,
  },
  fullSizePhoto: {
    width: '90%',
    height: '70%',
    borderRadius: THEME.radius.lg,
    borderWidth: 1,
  },
  fullPhotoBottomInfo: {
    marginTop: 20,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  fullPhotoDay: {
    fontSize: 22,
    fontFamily: THEME.typography.title2.fontFamily,
  },
  fullPhotoDate: {
    fontSize: 14,
    marginTop: 4,
    fontFamily: THEME.typography.body.fontFamily,
  },
  fullPhotoNote: {
    fontSize: 15,
    marginTop: 12,
    textAlign: 'center',
    fontFamily: THEME.typography.body.fontFamily,
    lineHeight: 22,
  }
});

