import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Cloud,
  Bell,
  Snowflake,
  Shield,
  Smartphone,
  Database,
  ExternalLink,
  ChevronRight
} from 'lucide-react-native';
import * as Notifications from 'expo-notifications';
import { useAppTheme } from '../theme/index.js';
import { NotionConfigModal } from '../components/NotionConfigModal.jsx';
import { getCurrentMonthKey } from '../utils/dateHelper.js';
import { updateHabitWidget } from '../services/widgetService.js';

export function SettingsScreen({ navigation }) {
  const { THEME, colors, isDark } = useAppTheme();
  
  const [notionModalVisible, setNotionModalVisible] = useState(false);
  const currentMonth = getCurrentMonthKey();

  const handleTestNotification = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔥 Discipline Reminder Test',
          body: 'Notification is working perfectly! Don\'t forget to check in to keep your streak alive.',
          data: { test: true },
          color: '#6366F1',
        },
        trigger: null, // trigger immediately
      });
      Alert.alert('Success', 'Test notification sent to device!');
    } catch (e) {
      Alert.alert('Notification Error', e.message);
    }
  };

  const handleRefreshWidget = async () => {
    await updateHabitWidget();
    Alert.alert('Widget Updated', 'Latest data has been synced to the Android Home Screen Widget (Jetpack Glance).');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Top Header */}
      <View style={[styles.topHeader, { backgroundColor: colors.bg, borderBottomColor: colors.surfaceBorder }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Settings & Sync</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Architecture Highlight */}
        <LinearGradient
          colors={isDark ? ['#1E273A', '#0F1420'] : [colors.surface, colors.bg]}
          style={[styles.architectureCard, { borderColor: 'rgba(99, 102, 241, 0.3)' }]}
        >
          <View style={styles.architectureHeader}>
            <Shield size={22} color={colors.primary} />
            <Text style={[styles.architectureTitle, { color: colors.textPrimary }]}>Super Client Architecture (V4)</Text>
          </View>
          <Text style={[styles.architectureDesc, { color: colors.textSecondary }]}>
            100% Offline-First. All check-in logic, streak calculation, video recap rendering using device CPU, and direct Notion API sync from phone — no intermediary servers.
          </Text>
        </LinearGradient>

        {/* Section 1: Notion Cloud Sync */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>CLOUD SYNC (NOTION API)</Text>
          
          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
            onPress={() => setNotionModalVisible(true)}
            activeOpacity={0.8}
          >
            <View style={styles.settingItemLeft}>
              <View style={[styles.iconBadge, { backgroundColor: `${colors.primary}20` }]}>
                <Cloud size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.settingItemTitle, { color: colors.textPrimary }]}>Notion Config & Sync</Text>
                <Text style={[styles.settingItemSubtitle, { color: colors.textSecondary }]}>Automatically push notes and journals to Notion Database</Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Section 2: Freeze Quota System */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>FREEZE CARD MECHANISM</Text>
          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <View style={styles.infoCardHeader}>
              <Snowflake size={18} color={colors.freeze} />
              <Text style={[styles.infoCardTitle, { color: colors.textPrimary }]}>Limit: 3 Times / Month / Habit</Text>
            </View>
            <Text style={[styles.infoCardDesc, { color: colors.textSecondary }]}>
              Each habit can miss check-ins up to 3 times in the current month ({currentMonth}) without losing the streak. The 4th miss will be counted as Failed and the streak will reset to 0. Quota automatically refills 3 times on the 1st of every month.
            </Text>
          </View>
        </View>

        {/* Section 3: Notifications & Widget */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>NOTIFICATIONS & HOME SCREEN WIDGET</Text>

          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
            onPress={handleTestNotification}
            activeOpacity={0.8}
          >
            <View style={styles.settingItemLeft}>
              <View style={[styles.iconBadge, { backgroundColor: `${colors.warning}20` }]}>
                <Bell size={20} color={colors.warning} />
              </View>
              <View>
                <Text style={[styles.settingItemTitle, { color: colors.textPrimary }]}>Send Test Notification</Text>
                <Text style={[styles.settingItemSubtitle, { color: colors.textSecondary }]}>Test sound & notification channels</Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
            onPress={handleRefreshWidget}
            activeOpacity={0.8}
          >
            <View style={styles.settingItemLeft}>
              <View style={[styles.iconBadge, { backgroundColor: `${colors.success}20` }]}>
                <Smartphone size={20} color={colors.success} />
              </View>
              <View>
                <Text style={[styles.settingItemTitle, { color: colors.textPrimary }]}>Sync Jetpack Glance Widget</Text>
                <Text style={[styles.settingItemSubtitle, { color: colors.textSecondary }]}>Update widget grid data on Android Home</Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Section 4: Local Database */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>LOCAL DATABASE</Text>
          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <View style={styles.infoCardHeader}>
              <Database size={18} color={colors.textSecondary} />
              <Text style={[styles.infoCardTitle, { color: colors.textPrimary }]}>SQLite Local Engine (expo-sqlite)</Text>
            </View>
            <Text style={[styles.infoCardDesc, { color: colors.textSecondary }]}>
              All habit data, check-in history, and watermarked photos are securely stored in your device's memory.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Notion Config Modal */}
      <NotionConfigModal
        visible={notionModalVisible}
        onClose={() => setNotionModalVisible(false)}
      />
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
    paddingHorizontal: THEME.spacing.md,
    paddingTop: 48,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  iconBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: THEME.typography.title2.fontFamily,
  },
  scrollContent: {
    padding: THEME.spacing.md,
  },
  architectureCard: {
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.md,
    borderWidth: 1,
    marginBottom: THEME.spacing.lg,
  },
  architectureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  architectureTitle: {
    fontSize: 14,
    fontFamily: THEME.typography.title2.fontFamily,
  },
  architectureDesc: {
    fontSize: 12,
    fontFamily: THEME.typography.body.fontFamily,
    lineHeight: 18,
  },
  section: {
    marginBottom: THEME.spacing.lg,
  },
  sectionHeader: {
    fontSize: 11,
    fontFamily: THEME.typography.title2.fontFamily,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    marginBottom: 8,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingItemTitle: {
    fontSize: 14,
    fontFamily: THEME.typography.bodyBold.fontFamily,
  },
  settingItemSubtitle: {
    fontSize: 11,
    fontFamily: THEME.typography.body.fontFamily,
    marginTop: 2,
  },
  infoCard: {
    padding: 14,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  infoCardTitle: {
    fontSize: 13,
    fontFamily: THEME.typography.title2.fontFamily,
  },
  infoCardDesc: {
    fontSize: 12,
    fontFamily: THEME.typography.body.fontFamily,
    lineHeight: 18,
  },
});
