import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, Trophy, Check } from 'lucide-react-native';
import { THEME } from '../theme/index.js';
import { getMilestoneDetails } from '../utils/streakEngine.js';

export function MilestoneModal({ visible, streakCount = 7, habitTitle = '', onClose }) {
  const details = getMilestoneDetails(streakCount);
  if (!details) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <LinearGradient
            colors={['#1F293D', '#0F141F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientCard}
          >
            {/* Celebration Badge */}
            <View style={[styles.badgeContainer, { backgroundColor: `${details.accent}20`, borderColor: details.accent }]}>
              <Text style={styles.badgeEmoji}>{details.badge}</Text>
            </View>

            {/* Title & Streak */}
            <View style={styles.header}>
              <View style={styles.sparkleRow}>
                <Sparkles size={18} color={details.accent} />
                <Text style={[styles.milestoneTag, { color: details.accent }]}>
                  CỘT MỐC ĐẠT ĐƯỢC
                </Text>
                <Sparkles size={18} color={details.accent} />
              </View>
              <Text style={styles.title}>{details.title}</Text>
              <Text style={styles.habitSubtitle}>
                Thói quen: <Text style={{ color: THEME.colors.textPrimary, fontWeight: '700' }}>{habitTitle}</Text>
              </Text>
            </View>

            {/* Streak Number Big Display */}
            <View style={styles.streakHighlight}>
              <LinearGradient
                colors={['#FF7A0025', '#FF005515']}
                style={styles.streakHighlightGradient}
              >
                <Text style={styles.streakNumber}>{streakCount}</Text>
                <Text style={styles.streakLabel}>NGÀY LIÊN TIẾP</Text>
              </LinearGradient>
            </View>

            {/* Description */}
            <Text style={styles.description}>
              {details.description}
            </Text>

            {/* Action button */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.continueButton, { backgroundColor: details.accent }]}
              onPress={onClose}
            >
              <LinearGradient
                colors={[details.accent, `${details.accent}CC`]}
                style={styles.buttonGradient}
              >
                <Check size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>Tuyệt Vời, Tiếp Tục Giữ Kỷ Luật!</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 14, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.spacing.lg,
  },
  container: {
    width: '100%',
    maxWidth: 380,
    borderRadius: THEME.radius.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    elevation: 20,
  },
  gradientCard: {
    padding: THEME.spacing.xl,
    alignItems: 'center',
  },
  badgeContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: THEME.spacing.md,
    elevation: 8,
  },
  badgeEmoji: {
    fontSize: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  sparkleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  milestoneTag: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    color: THEME.colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 4,
  },
  habitSubtitle: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  streakHighlight: {
    width: '100%',
    marginVertical: THEME.spacing.md,
    borderRadius: THEME.radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  streakHighlightGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  streakNumber: {
    color: THEME.colors.warning,
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -1,
  },
  streakLabel: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  description: {
    color: THEME.colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: THEME.spacing.xl,
  },
  continueButton: {
    width: '100%',
    borderRadius: THEME.radius.md,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
