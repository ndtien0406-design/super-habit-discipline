import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, Alert, ActivityIndicator, Dimensions, Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, FlipHorizontal, ArrowLeft, Check, Sparkles, AlertCircle, ImagePlus } from 'lucide-react-native';
import { useAppTheme, THEME } from '../theme/index.js';
import { getTodayDateString, formatDisplayDate } from '../utils/dateHelper.js';
import { getCheckinByHabitAndDate, insertOrUpdateCheckin, addExp } from '../database/queries.js';
import { updateHabitWidget } from '../services/widgetService.js';
import { isMilestone } from '../utils/streakEngine.js';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Default sample evidence photo for Web testing
const SAMPLE_PHOTO = 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80';

export function BuildCheckinScreen({ route, navigation }) {
  const { THEME, colors, isDark } = useAppTheme();
  
  const { habit } = route.params;
  const isWeb = Platform.OS === 'web';
  const [permission, requestPermission] = isWeb ? [{ granted: true }, () => {}] : useCameraPermissions();
  const [facing, setFacing] = useState('back');
  const [photoUri, setPhotoUri] = useState(null);
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const cameraRef = useRef(null);

  const today = getTodayDateString();
  const nextDayNumber = (habit.currentStreak || 0) + 1;
  const habitColor = habit.color_code || colors.primary;

  const handleTakePhoto = async () => {
    if (isWeb) {
      // Simulate photo capture on Web Preview
      setPhotoUri(SAMPLE_PHOTO);
      return;
    }

    if (cameraRef.current) {
      try {
        let photo = await cameraRef.current.takePictureAsync({
          quality: 0.85,
          skipProcessing: false,
        });

        // Lật ngược ảnh (mirror) nếu là camera trước (selfie)
        if (facing === 'front' && !isWeb) {
          photo = await ImageManipulator.manipulateAsync(
            photo.uri,
            [{ flip: ImageManipulator.FlipType.Horizontal }],
            { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
          );
        }

        setPhotoUri(photo.uri);
      } catch (e) {
        Alert.alert('Lỗi chụp ảnh', e.message);
      }
    }
  };

  const handleRetake = () => {
    setPhotoUri(null);
  };

  const handleSaveCheckin = async () => {
    if (!photoUri) {
      Alert.alert('Thiếu Ảnh', 'Vui lòng chụp ảnh để chứng minh bạn đã hoàn thành thói quen.');
      return;
    }

    setIsSaving(true);
    try {
      let permanentUri = photoUri;

      // Copy captured photo to permanent local storage on Native
      if (!isWeb && FileSystem.documentDirectory) {
        const filename = `habit_${habit.id}_${today}_${Date.now()}.jpg`;
        permanentUri = `${FileSystem.documentDirectory}${filename}`;
        await FileSystem.copyAsync({ from: photoUri, to: permanentUri });
      }

      // Check if already checked in today
      const existing = await getCheckinByHabitAndDate(habit.id, today);

      // 2. Insert checkin record into SQLite
      await insertOrUpdateCheckin({
        habit_id: habit.id,
        checkin_date: today,
        image_path: permanentUri,
        note: note.trim(),
        day_number: nextDayNumber,
        status: 'completed',
      });

      if (!existing) {
        // Award EXP for completing checkin
        const { exp, level } = await addExp(20);
        // We could show a toast or alert here, but for now just console.log
        console.log(`[Gamification] Gained 20 EXP. Current Level: ${level}, EXP: ${exp}`);
      }

      // 3. Update Android Widget
      await updateHabitWidget();

      setIsSaving(false);

      // 4. Check for milestone
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

  if (!isWeb && !permission) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isWeb && !permission.granted) {
    return (
      <View style={[styles.permissionContainer, { backgroundColor: colors.bg }]}>
        <AlertCircle size={48} color={colors.warning} />
        <Text style={[styles.permissionTitle, { color: colors.textPrimary }]}>Cần Quyền Camera</Text>
        <Text style={[styles.permissionDesc, { color: colors.textSecondary }]}>
          Ứng dụng cần quyền truy cập camera để chụp ảnh chứng minh và thêm watermark chuỗi kỷ lục.
        </Text>
        <TouchableOpacity style={[styles.permissionBtn, { backgroundColor: colors.primary }]} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Cấp Quyền Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
          <Text style={[styles.backLinkText, { color: colors.textMuted }]}>Quay Lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Top Header */}
      <View style={[styles.topHeader, { backgroundColor: colors.bg, borderBottomColor: colors.surfaceBorder }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerHabitTitle, { color: colors.textPrimary }]} numberOfLines={1}>{habit.title}</Text>
          <Text style={[styles.headerDayText, { color: colors.textSecondary }]}>Điểm Danh Ngày {nextDayNumber} (Xây Dựng)</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Main Area: Camera or Watermarked Preview */}
      <View style={styles.previewArea}>
        {!photoUri ? (
          isWeb ? (
            <View style={[styles.webCameraMock, { backgroundColor: colors.surfaceSubtle }]}>
              <Camera size={56} color={habitColor} />
              <Text style={[styles.webMockTitle, { color: colors.textPrimary }]}>Trình Giả Lập Camera</Text>
              <Text style={[styles.webMockDesc, { color: colors.textSecondary }]}>
                Nhấn nút chụp bên dưới để chụp ảnh mẫu và xem trước hiệu ứng watermark chuỗi kỷ lục!
              </Text>
              <TouchableOpacity style={[styles.webCaptureBtn, { backgroundColor: habitColor }]} onPress={handleTakePhoto}>
                <Camera size={20} color="#FFFFFF" />
                <Text style={styles.webCaptureBtnText}>Chụp Ảnh</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
              <View style={styles.cameraOverlay}>
                <View style={styles.cameraHeaderNotice}>
                  <Text style={styles.cameraNoticeText}>
                    📸 Ảnh Chứng Minh Hôm Nay ({formatDisplayDate(today, 'short')})
                  </Text>
                </View>

                <View style={styles.cameraControlsRow}>
                  <TouchableOpacity
                    style={styles.flipBtn}
                    onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}
                  >
                    <FlipHorizontal size={24} color="#FFFFFF" />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.captureBtn} onPress={handleTakePhoto}>
                    <View style={[styles.captureInnerCircle, { backgroundColor: habitColor }]} />
                  </TouchableOpacity>

                  <View style={{ width: 48 }} />
                </View>
              </View>
            </CameraView>
          )
        ) : (
          <View style={styles.capturedPhotoContainer}>
            <Image source={{ uri: photoUri }} style={styles.capturedImage} resizeMode="cover" />

            {/* AUTOMATIC WATERMARK OVERLAY */}
            <LinearGradient
              colors={['transparent', 'rgba(10, 13, 20, 0.95)']}
              style={styles.watermarkContainer}
            >
              <View style={styles.watermarkTopBadge}>
                <Sparkles size={14} color="#F59E0B" />
                <Text style={styles.watermarkDayHighlight}>
                  NGÀY {nextDayNumber}
                </Text>
              </View>
              <Text style={styles.watermarkHabitName}>{habit.title}</Text>
              <Text style={styles.watermarkDateText}>
                {formatDisplayDate(today, 'full')} • Super Discipline Client
              </Text>
            </LinearGradient>
          </View>
        )}
      </View>

      {/* Bottom Panel: Note & Action Buttons */}
      {photoUri && (
        <View style={[styles.bottomPanel, { backgroundColor: colors.surface, borderTopColor: colors.surfaceBorder }]}>
          <TextInput
            style={[styles.noteInput, { backgroundColor: colors.surfaceSubtle, borderColor: colors.surfaceBorder, color: colors.textPrimary }]}
            placeholder="Thêm ghi chú/cảm nghĩ hôm nay (tùy chọn)..."
            placeholderTextColor={colors.textMuted}
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={2}
          />

          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={[styles.retakeButton, { backgroundColor: colors.surfaceSubtle }]}
              onPress={handleRetake}
              disabled={isSaving}
            >
              <Text style={[styles.retakeText, { color: colors.textSecondary }]}>Chụp Lại</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: habitColor }]}
              onPress={handleSaveCheckin}
              disabled={isSaving}
            >
              <LinearGradient
                colors={[habitColor, `${habitColor}CC`]}
                style={styles.saveGradient}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Check size={18} color="#FFFFFF" />
                    <Text style={styles.saveButtonText}>Lưu & Hoàn Thành</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
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
    paddingHorizontal: THEME.spacing.md,
    paddingTop: 48,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  iconBtn: {
    padding: 8,
  },
  headerInfo: {
    alignItems: 'center',
    flex: 1,
  },
  headerHabitTitle: {
    fontSize: 16,
    fontFamily: THEME.typography.title2.fontFamily,
  },
  headerDayText: {
    fontSize: 12,
    fontFamily: THEME.typography.small.fontFamily,
  },
  previewArea: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: THEME.spacing.lg,
  },
  cameraHeaderNotice: {
    alignSelf: 'center',
    backgroundColor: 'rgba(10, 13, 20, 0.75)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: THEME.radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  cameraNoticeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: THEME.typography.bodyBold.fontFamily,
  },
  cameraControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 16,
  },
  flipBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  captureInnerCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  capturedPhotoContainer: {
    flex: 1,
    position: 'relative',
  },
  capturedImage: {
    width: '100%',
    height: '100%',
  },
  watermarkContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 20,
  },
  watermarkTopBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: THEME.radius.full,
    gap: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.5)',
  },
  watermarkDayHighlight: {
    color: '#F59E0B',
    fontSize: 14,
    fontFamily: THEME.typography.title2.fontFamily,
    letterSpacing: 1,
  },
  watermarkHabitName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: THEME.typography.title2.fontFamily,
    marginBottom: 4,
  },
  watermarkDateText: {
    color: '#94A3B8',
    fontSize: 12,
    fontFamily: THEME.typography.body.fontFamily,
  },
  bottomPanel: {
    padding: THEME.spacing.md,
    borderTopWidth: 1,
  },
  noteInput: {
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontFamily: THEME.typography.body.fontFamily,
    maxHeight: 70,
    marginBottom: 12,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  retakeButton: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: THEME.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retakeText: {
    fontSize: 14,
    fontFamily: THEME.typography.bodyBold.fontFamily,
  },
  saveButton: {
    flex: 1,
    borderRadius: THEME.radius.md,
    overflow: 'hidden',
  },
  saveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: THEME.typography.bodyBold.fontFamily,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.spacing.xl,
  },
  permissionTitle: {
    fontSize: 18,
    fontFamily: THEME.typography.title2.fontFamily,
    marginTop: 16,
    marginBottom: 8,
  },
  permissionDesc: {
    fontSize: 14,
    fontFamily: THEME.typography.body.fontFamily,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  permissionBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: THEME.radius.md,
  },
  permissionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: THEME.typography.bodyBold.fontFamily,
  },
  backLink: {
    marginTop: 16,
    padding: 8,
  },
  backLinkText: {
    fontSize: 13,
    fontFamily: THEME.typography.body.fontFamily,
  },
  webCameraMock: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  webMockTitle: {
    fontSize: 18,
    fontFamily: THEME.typography.title2.fontFamily,
    marginTop: 16,
    marginBottom: 8,
  },
  webMockDesc: {
    fontSize: 13,
    fontFamily: THEME.typography.body.fontFamily,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    maxWidth: 320,
  },
  webCaptureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: THEME.radius.md,
    gap: 8,
  },
  webCaptureBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: THEME.typography.bodyBold.fontFamily,
  },
});

