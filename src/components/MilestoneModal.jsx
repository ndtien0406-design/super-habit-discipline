import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, Trophy, Check } from 'lucide-react-native';
import { useAppTheme } from '../theme/index.js';
import { getMilestoneDetails } from '../utils/streakEngine.js';

export function MilestoneModal({ visible, streakCount = 7, habitTitle = '', onClose }) {
  const { THEME, colors, isDark } = useAppTheme();
  const details = getMilestoneDetails(streakCount);
  if (!details) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: isDark ? 'rgba(26,14,2,0.85)' : 'rgba(255,247,233,0.85)' }]}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          <View style={styles.gradientCard}>
            {/* Celebration Badge */}
            <View style={[styles.badgeContainer, { backgroundColor: `${details.accent}20`, borderColor: details.accent }]}>
              <Text style={styles.badgeEmoji}>{details.badge}</Text>
            </View>

            {/* Title & Streak */}
            <View style={styles.header}>
              <View style={styles.sparkleRow}>
                <Sparkles size={18} color={details.accent} />
                <Text style={[styles.milestoneTag, { color: details.accent }]}>
                  MILESTONE REACHED
                </Text>
                <Sparkles size={18} color={details.accent} />
              </View>
              <Text style={[styles.title, { color: colors.textPrimary }]}>{details.title}</Text>
              <Text style={[styles.habitSubtitle, { color: colors.textSecondary }]}>
                Habit: <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{habitTitle}</Text>
              </Text>
            </View>

            {/* Streak Number Big Display */}
            <View style={[styles.streakHighlight, { borderColor: `${colors.warning}30` }]}>
              <LinearGradient
                colors={[`${colors.warning}25`, `${colors.primary}15`]}
                style={styles.streakHighlightGradient}
              >
                <Text style={[styles.streakNumber, { color: colors.warning }]}>{streakCount}</Text>
                <Text style={[styles.streakLabel, { color: colors.textSecondary }]}>CONSECUTIVE DAYS</Text>
              </LinearGradient>
            </View>

            {/* Description */}
            <Text style={[styles.description, { color: colors.textSecondary }]}>
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
                <Text style={styles.buttonText}>Awesome, Keep It Up!</Text>
              </LinearGradient>
            </TouchableOpacity>
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
    padding: THEME.spacing.lg,
  },
  container: {
    width: '100%',
    maxWidth: 380,
    borderRadius: THEME.radius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
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
    fontFamily: THEME.typography.bodyBold.fontFamily,
    letterSpacing: 1,
  },
  title: {
    fontSize: 22,
    fontFamily: THEME.typography.title2.fontFamily,
    textAlign: 'center',
    marginTop: 4,
  },
  habitSubtitle: {
    fontSize: 13,
    fontFamily: THEME.typography.body.fontFamily,
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
    fontSize: 42,
    fontFamily: THEME.typography.hero.fontFamily,
    letterSpacing: -1,
  },
  streakLabel: {
    fontSize: 11,
    fontFamily: THEME.typography.bodyBold.fontFamily,
    letterSpacing: 1.5,
  },
  description: {
    fontSize: 14,
    fontFamily: THEME.typography.body.fontFamily,
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
    fontFamily: THEME.typography.bodyBold.fontFamily,
  },
});
