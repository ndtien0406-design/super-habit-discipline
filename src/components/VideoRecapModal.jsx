import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Film, Play, Pause, Download, X, CheckCircle2, Sparkles } from 'lucide-react-native';
import { THEME } from '../theme/index.js';
import { calculateOptimalFps, renderHabitRecapVideo } from '../services/videoRenderService.js';

export function VideoRecapModal({ visible, habit, images = [], onClose }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState({ text: '', percent: 0 });

  const totalImages = images.length;
  const fps = calculateOptimalFps(totalImages, 4);
  const duration = +(totalImages / fps).toFixed(1);
  const frameIntervalMs = Math.round(1000 / fps);

  // Timelapse playback loop
  useEffect(() => {
    if (!visible || !isPlaying || totalImages === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalImages);
    }, frameIntervalMs);

    return () => clearInterval(interval);
  }, [visible, isPlaying, totalImages, frameIntervalMs]);

  const handleExport = async () => {
    if (totalImages === 0) {
      Alert.alert('Chưa có ảnh', 'Cần ít nhất 1 ảnh để kết xuất video recap.');
      return;
    }

    setIsExporting(true);
    setExportProgress({ text: 'Đang khởi động render...', percent: 10 });

    try {
      const result = await renderHabitRecapVideo(habit.id, habit.title, {
        onProgress: (text, percent) => setExportProgress({ text, percent })
      });

      if (result.success) {
        Alert.alert(
          '🎉 Xuất Video Thành Công!',
          `${result.message}\nVideo đã được lưu vào Thư viện ảnh (Gallery) của máy, sẵn sàng đăng tải lên YouTube Shorts / TikTok.`
        );
      } else {
        Alert.alert('Không thể xuất video', result.message);
      }
    } catch (err) {
      Alert.alert('Lỗi', err.message);
    } finally {
      setIsExporting(false);
    }
  };

  if (!visible) return null;

  const currentImage = images[currentIndex];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <LinearGradient
            colors={['#171F2E', '#0A0D14']}
            style={styles.gradientCard}
          >
            {/* Top Bar */}
            <View style={styles.topBar}>
              <View style={styles.titleRow}>
                <Film size={18} color={THEME.colors.primary} />
                <Text style={styles.headerTitle}>Timelapse Video Recap</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={20} color={THEME.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Video Player Preview Box */}
            <View style={styles.playerContainer}>
              {totalImages > 0 && currentImage ? (
                <>
                  <Image
                    source={{ uri: currentImage.image_path }}
                    style={styles.previewImage}
                    resizeMode="cover"
                  />
                  {/* Overlay Frame Badge */}
                  <View style={styles.frameBadge}>
                    <Text style={styles.frameBadgeText}>
                      Ngày {currentImage.day_number || currentIndex + 1} ({currentIndex + 1}/{totalImages})
                    </Text>
                  </View>
                </>
              ) : (
                <View style={styles.emptyContainer}>
                  <Film size={40} color={THEME.colors.textMuted} />
                  <Text style={styles.emptyText}>Chưa có ảnh điểm danh nào.</Text>
                </View>
              )}
            </View>

            {/* Specs Row */}
            <View style={styles.specsRow}>
              <View style={styles.specBox}>
                <Text style={styles.specLabel}>TỔNG ẢNH</Text>
                <Text style={styles.specVal}>{totalImages}</Text>
              </View>
              <View style={styles.specBox}>
                <Text style={styles.specLabel}>TỐC ĐỘ FPS</Text>
                <Text style={styles.specVal}>{fps} fps</Text>
              </View>
              <View style={styles.specBox}>
                <Text style={styles.specLabel}>THỜI LƯỢNG</Text>
                <Text style={styles.specVal}>{duration}s</Text>
              </View>
            </View>

            {/* Export Progress indicator */}
            {isExporting && (
              <View style={styles.progressBox}>
                <ActivityIndicator size="small" color={THEME.colors.primary} />
                <Text style={styles.progressText}>{exportProgress.text}</Text>
              </View>
            )}

            {/* Action buttons */}
            <View style={styles.actionButtonsRow}>
              {/* Play / Pause Preview */}
              <TouchableOpacity
                style={styles.playPauseBtn}
                onPress={() => setIsPlaying(!isPlaying)}
                disabled={totalImages === 0}
              >
                {isPlaying ? (
                  <Pause size={18} color="#FFFFFF" />
                ) : (
                  <Play size={18} color="#FFFFFF" />
                )}
                <Text style={styles.playPauseText}>{isPlaying ? 'Tạm dừng' : 'Xem trước'}</Text>
              </TouchableOpacity>

              {/* Export MP4 button */}
              <TouchableOpacity
                style={styles.exportBtn}
                onPress={handleExport}
                disabled={isExporting || totalImages === 0}
              >
                <LinearGradient
                  colors={['#6366F1', '#4F46E5']}
                  style={styles.exportGradient}
                >
                  <Download size={18} color="#FFFFFF" />
                  <Text style={styles.exportText}>
                    {isExporting ? 'Đang xuất MP4...' : 'Xuất Video Gallery'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 14, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.spacing.md,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderRadius: THEME.radius.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: THEME.colors.surfaceBorder,
    elevation: 20,
  },
  gradientCard: {
    padding: THEME.spacing.lg,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  playerContainer: {
    width: '100%',
    height: 320,
    backgroundColor: '#0F141F',
    borderRadius: THEME.radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  frameBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(10, 13, 20, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: THEME.radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  frameBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    color: THEME.colors.textMuted,
    fontSize: 13,
  },
  specsRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: THEME.spacing.md,
  },
  specBox: {
    flex: 1,
    backgroundColor: '#0F141F',
    padding: 10,
    borderRadius: THEME.radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
  },
  specLabel: {
    color: THEME.colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  specVal: {
    color: THEME.colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  progressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  progressText: {
    color: THEME.colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: THEME.spacing.sm,
  },
  playPauseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: THEME.radius.md,
    gap: 6,
  },
  playPauseText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  exportBtn: {
    flex: 1,
    borderRadius: THEME.radius.md,
    overflow: 'hidden',
  },
  exportGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    gap: 8,
  },
  exportText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
