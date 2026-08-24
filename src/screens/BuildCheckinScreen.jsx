import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, FlipHorizontal, ArrowLeft, Check, Sparkles, AlertCircle } from 'lucide-react-native';
import { THEME } from '../theme/index.js';
import { getTodayDateString, formatDisplayDate } from '../utils/dateHelper.js';
import { insertOrUpdateCheckin } from '../database/queries.js';
import { updateHabitWidget } from '../services/widgetService.js';
import { isMilestone } from '../utils/streakEngine.js';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function BuildCheckinScreen({ route, navigation }) {
  const { habit } = route.params;
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState('back');
  const [photoUri, setPhotoUri] = useState(null);
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const cameraRef = useRef(null);

  const today = getTodayDateString();
  const nextDayNumber = (habit.currentStreak || 0) + 1;
  const habitColor = habit.color_code || THEME.colors.primary;

  const handleTakePhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.85,
          skipProcessing: false,
        });
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
      Alert.alert('Chưa có ảnh', 'Vui lòng chụp một bức ảnh làm bằng chứng kỷ luật.');
      return;
    }

    setIsSaving(true);
    try {
      // 1. Copy captured photo to permanent local storage
      const filename = `habit_${habit.id}_${today}_${Date.now()}.jpg`;
      const permanentUri = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.copyAsync({ from: photoUri, to: permanentUri });

      // 2. Insert checkin record into SQLite
      await insertOrUpdateCheckin({
        habit_id: habit.id,
        checkin_date: today,
        image_path: permanentUri,
        note: note.trim(),
        day_number: nextDayNumber,
        status: 'completed',
      });

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
      Alert.alert('Lỗi lưu điểm danh', error.message);
    }
  };

  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <AlertCircle size={48} color={THEME.colors.warning} />
        <Text style={styles.permissionTitle}>Cần quyền truy cập Camera</Text>
        <Text style={styles.permissionDesc}>
          Ứng dụng cần sử dụng Camera để chụp ảnh bằng chứng kỷ luật và đóng dấu watermark số ngày.
        </Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Cấp Quyền Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
          <Text style={styles.backLinkText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <ArrowLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerHabitTitle} numberOfLines={1}>{habit.title}</Text>
          <Text style={styles.headerDayText}>Điểm danh Ngày {nextDayNumber} (Build)</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Main Area: Camera or Watermarked Preview */}
      <View style={styles.previewArea}>
        {!photoUri ? (
          <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
            {/* Live Camera Guidelines */}
            <View style={styles.cameraOverlay}>
              <View style={styles.cameraHeaderNotice}>
                <Text style={styles.cameraNoticeText}>
                  📸 Chụp ảnh kỷ luật hôm nay ({formatDisplayDate(today, 'short')})
                </Text>
              </View>

              {/* Bottom camera controls */}
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
                {formatDisplayDate(today, 'full')} • Super Client Kỷ Luật
              </Text>
            </LinearGradient>
          </View>
        )}
      </View>

      {/* Bottom Panel: Note & Action Buttons */}
      {photoUri && (
        <View style={styles.bottomPanel}>
          <TextInput
            style={styles.noteInput}
            placeholder="Thêm ghi chú/cảm xúc ngày hôm nay (tùy chọn)..."
            placeholderTextColor={THEME.colors.textMuted}
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={2}
          />

          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={styles.retakeButton}
              onPress={handleRetake}
              disabled={isSaving}
            >
              <Text style={styles.retakeText}>Chụp Lại</Text>
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
    paddingBottom: 12,
    backgroundColor: '#0F141F',
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.surfaceBorder,
  },
  iconBtn: {
    padding: 8,
  },
  headerInfo: {
    alignItems: 'center',
    flex: 1,
  },
  headerHabitTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  headerDayText: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
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
    fontWeight: '600',
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
    fontWeight: '900',
    letterSpacing: 1,
  },
  watermarkHabitName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  watermarkDateText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
  bottomPanel: {
    backgroundColor: '#0F141F',
    padding: THEME.spacing.md,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.surfaceBorder,
  },
  noteInput: {
    backgroundColor: '#141A26',
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    color: THEME.colors.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    maxHeight: 70,
    marginBottom: 12,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  retakeButton: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: THEME.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retakeText: {
    color: THEME.colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
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
    fontWeight: '700',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: THEME.colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.spacing.xl,
  },
  permissionTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionDesc: {
    color: THEME.colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  permissionBtn: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: THEME.radius.md,
  },
  permissionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  backLink: {
    marginTop: 16,
    padding: 8,
  },
  backLinkText: {
    color: THEME.colors.textMuted,
    fontSize: 13,
  },
});
