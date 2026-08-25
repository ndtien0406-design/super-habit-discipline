import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Pause, Download, X, Film, Sparkles } from 'lucide-react-native';
import { useAppTheme } from '../theme/index.js';
import { calculateOptimalFps, renderHabitRecapVideo } from '../services/videoRenderService.js';

export function VideoRecapModal({ visible, habit, images = [], onClose }) {
  const { THEME, colors, isDark } = useAppTheme();
  
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
      Alert.alert('No Photos', 'At least 1 photo is required to render a recap video.');
      return;
    }

    setIsExporting(true);
    setExportProgress({ text: 'Starting render...', percent: 10 });

    try {
      const result = await renderHabitRecapVideo(habit.id, habit.title, {
        onProgress: (text, percent) => setExportProgress({ text, percent })
      });

      if (result.success) {
        Alert.alert(
          '🎉 Export Successful!',
          `${result.message}\nVideo has been saved to your device Gallery, ready for YouTube Shorts / TikTok.`
        );
      } else {
        Alert.alert('Cannot export video', result.message);
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setIsExporting(false);
    }
  };

  if (!visible) return null;

  const currentImage = images[currentIndex];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: isDark ? 'rgba(26, 14, 2, 0.9)' : 'rgba(255, 247, 233, 0.9)' }]}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          <View style={styles.gradientCard}>
            {/* Top Bar */}
            <View style={styles.topBar}>
              <View style={styles.titleRow}>
                <Film size={18} color={colors.primary} />
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Timelapse Video Recap</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Video Player Preview Box */}
            <View style={[styles.playerContainer, { backgroundColor: colors.surfaceSubtle, borderColor: colors.surfaceBorder }]}>
              {totalImages > 0 && currentImage ? (
                <>
                  <Image
                    source={{ uri: currentImage.image_path }}
                    style={styles.previewImage}
                    resizeMode="cover"
                  />
                  {/* Overlay Frame Badge */}
                  <View style={[styles.frameBadge, { backgroundColor: isDark ? 'rgba(26,14,2,0.8)' : 'rgba(255,255,255,0.8)', borderColor: colors.surfaceBorder }]}>
                    <Text style={[styles.frameBadgeText, { color: colors.textPrimary }]}>
                      Day {currentImage.day_number || currentIndex + 1} ({currentIndex + 1}/{totalImages})
                    </Text>
                  </View>
                </>
              ) : (
                <View style={styles.emptyContainer}>
                  <Film size={40} color={colors.textMuted} />
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>No check-in photos yet.</Text>
                </View>
              )}
            </View>

            {/* Specs Row */}
            <View style={styles.specsRow}>
              <View style={[styles.specBox, { backgroundColor: colors.surfaceSubtle, borderColor: colors.surfaceBorder }]}>
                <Text style={[styles.specLabel, { color: colors.textMuted }]}>TOTAL PHOTOS</Text>
                <Text style={[styles.specVal, { color: colors.textPrimary }]}>{totalImages}</Text>
              </View>
              <View style={[styles.specBox, { backgroundColor: colors.surfaceSubtle, borderColor: colors.surfaceBorder }]}>
                <Text style={[styles.specLabel, { color: colors.textMuted }]}>FPS RATE</Text>
                <Text style={[styles.specVal, { color: colors.textPrimary }]}>{fps} fps</Text>
              </View>
              <View style={[styles.specBox, { backgroundColor: colors.surfaceSubtle, borderColor: colors.surfaceBorder }]}>
                <Text style={[styles.specLabel, { color: colors.textMuted }]}>DURATION</Text>
                <Text style={[styles.specVal, { color: colors.textPrimary }]}>{duration}s</Text>
              </View>
            </View>

            {/* Export Progress indicator */}
            {isExporting && (
              <View style={styles.progressBox}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.progressText, { color: colors.primary }]}>{exportProgress.text}</Text>
              </View>
            )}

            {/* Action buttons */}
            <View style={styles.actionButtonsRow}>
              {/* Play / Pause Preview */}
              <TouchableOpacity
                style={[styles.playPauseBtn, { backgroundColor: colors.surfaceSubtle }]}
                onPress={() => setIsPlaying(!isPlaying)}
                disabled={totalImages === 0}
              >
                {isPlaying ? (
                  <Pause size={18} color={colors.textPrimary} />
                ) : (
                  <Play size={18} color={colors.textPrimary} />
                )}
                <Text style={[styles.playPauseText, { color: colors.textPrimary }]}>{isPlaying ? 'Pause' : 'Preview'}</Text>
              </TouchableOpacity>

              {/* Export MP4 button */}
              <TouchableOpacity
                style={styles.exportBtn}
                onPress={handleExport}
                disabled={isExporting || totalImages === 0}
              >
                <LinearGradient
                  colors={[colors.primary, colors.warning]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.exportGradient}
                >
                  <Download size={18} color={isDark ? '#000' : '#FFF'} />
                  <Text style={[styles.exportText, { color: isDark ? '#000' : '#FFF' }]}>
                    {isExporting ? 'Exporting MP4...' : 'Export Video to Gallery'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.spacing.md,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderRadius: THEME.radius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
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
    fontSize: 16,
    fontFamily: THEME.typography.title2.fontFamily,
  },
  closeBtn: {
    padding: 6,
    borderRadius: THEME.radius.full,
  },
  playerContainer: {
    width: '100%',
    height: 320,
    borderRadius: THEME.radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: THEME.radius.full,
    borderWidth: 1,
  },
  frameBadgeText: {
    fontSize: 12,
    fontFamily: THEME.typography.small.fontFamily,
  },
  emptyContainer: {
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: THEME.typography.body.fontFamily,
  },
  specsRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: THEME.spacing.md,
  },
  specBox: {
    flex: 1,
    padding: 10,
    borderRadius: THEME.radius.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  specLabel: {
    fontSize: 9,
    fontFamily: THEME.typography.small.fontFamily,
    letterSpacing: 0.5,
  },
  specVal: {
    fontSize: 15,
    fontFamily: THEME.typography.bodyBold.fontFamily,
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
    fontSize: 13,
    fontFamily: THEME.typography.bodyBold.fontFamily,
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
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: THEME.radius.md,
    gap: 6,
  },
  playPauseText: {
    fontSize: 13,
    fontFamily: THEME.typography.bodyBold.fontFamily,
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
    fontSize: 14,
    fontFamily: THEME.typography.bodyBold.fontFamily,
  },
});
