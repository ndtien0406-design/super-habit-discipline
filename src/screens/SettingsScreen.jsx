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
  ExternalLink,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
  Database
} from 'lucide-react-native';
import * as Notifications from 'expo-notifications';
import { useAppTheme, THEME } from '../theme/index.js';
import { NotionConfigModal } from '../components/NotionConfigModal.jsx';
import { getCurrentMonthKey } from '../utils/dateHelper.js';
import { updateHabitWidget } from '../services/widgetService.js';
import { exportDataToJSON, importDataFromJSON } from '../services/backupService.js';

export function SettingsScreen({ navigation }) {
  const { THEME, colors, isDark, themePreference, updateThemePreference } = useAppTheme();
  
  const [notionModalVisible, setNotionModalVisible] = useState(false);
  const currentMonth = getCurrentMonthKey();

  const handleTestNotification = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔥 Thử Nghiệm Nhắc Nhở Kỷ Luật',
          body: 'Thông báo hoạt động hoàn hảo! Đừng quên điểm danh để giữ vững kỷ lục nhé.',
          data: { test: true },
          color: '#6366F1',
        },
        trigger: null, // trigger immediately
      });
      Alert.alert('Thành công', 'Đã gửi thông báo thử nghiệm đến thiết bị!');
    } catch (e) {
      Alert.alert('Lỗi Thông Báo', e.message);
    }
  };

  const handleRefreshWidget = async () => {
    await updateHabitWidget();
    Alert.alert('Đã Cập Nhật Widget', 'Dữ liệu mới nhất đã được đồng bộ lên Widget trên màn hình chính Android (Jetpack Glance).');
  };

  const handleExport = async () => {
    try {
      await exportDataToJSON();
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    }
  };

  const handleImport = async () => {
    Alert.alert('Cảnh Báo', 'Việc phục hồi dữ liệu sẽ GHI ĐÈ toàn bộ dữ liệu hiện tại. Bạn có chắc chắn muốn tiếp tục?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Tiếp Tục', style: 'destructive', onPress: async () => {
        try {
          const success = await importDataFromJSON();
          if (success) {
            Alert.alert('Thành Công', 'Đã phục hồi dữ liệu. Khởi động lại ứng dụng hoặc tải lại để thấy thay đổi.');
          }
        } catch (e) {
          Alert.alert('Lỗi', e.message);
        }
      }}
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Top Header */}
      <View style={[styles.topHeader, { backgroundColor: colors.bg, borderBottomColor: colors.surfaceBorder }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Cài Đặt & Đồng Bộ</Text>
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
            <Text style={[styles.architectureTitle, { color: colors.textPrimary }]}>Kiến Trúc My Note</Text>
          </View>
          <Text style={[styles.architectureDesc, { color: colors.textSecondary }]}>
            100% Ưu Tiên Ngoại Tuyến. Toàn bộ logic điểm danh, tính toán kỷ lục, render video bằng CPU thiết bị và đồng bộ Notion API trực tiếp từ điện thoại — không qua máy chủ trung gian.
          </Text>
        </LinearGradient>

        {/* Section 1: Notion Cloud Sync */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>ĐỒNG BỘ ĐÁM MÂY (NOTION API)</Text>
          
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
                <Text style={[styles.settingItemTitle, { color: colors.textPrimary }]}>Cấu Hình & Đồng Bộ Notion</Text>
                <Text style={[styles.settingItemSubtitle, { color: colors.textSecondary }]}>Tự động đẩy ghi chú và nhật ký lên Database của Notion</Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Section: GIAO DIỆN (THEME) */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>GIAO DIỆN HIỂN THỊ</Text>
          <View style={[styles.themeToggleContainer, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <TouchableOpacity
              style={[styles.themeOption, themePreference === 'light' && { backgroundColor: colors.primaryGlow }]}
              onPress={() => updateThemePreference('light')}
            >
              <Sun size={20} color={themePreference === 'light' ? colors.primary : colors.textMuted} />
              <Text style={[styles.themeOptionText, { color: themePreference === 'light' ? colors.primary : colors.textMuted }]}>Sáng</Text>
            </TouchableOpacity>

            <View style={[styles.themeDivider, { backgroundColor: colors.surfaceBorder }]} />

            <TouchableOpacity
              style={[styles.themeOption, themePreference === 'dark' && { backgroundColor: colors.primaryGlow }]}
              onPress={() => updateThemePreference('dark')}
            >
              <Moon size={20} color={themePreference === 'dark' ? colors.primary : colors.textMuted} />
              <Text style={[styles.themeOptionText, { color: themePreference === 'dark' ? colors.primary : colors.textMuted }]}>Tối</Text>
            </TouchableOpacity>

            <View style={[styles.themeDivider, { backgroundColor: colors.surfaceBorder }]} />

            <TouchableOpacity
              style={[styles.themeOption, themePreference === 'system' && { backgroundColor: colors.primaryGlow }]}
              onPress={() => updateThemePreference('system')}
            >
              <Monitor size={20} color={themePreference === 'system' ? colors.primary : colors.textMuted} />
              <Text style={[styles.themeOptionText, { color: themePreference === 'system' ? colors.primary : colors.textMuted }]}>Tự động</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 2: Freeze Quota System */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>CƠ CHẾ THẺ BỎ QUA</Text>
          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <View style={styles.infoCardHeader}>
              <Snowflake size={18} color={colors.freeze} />
              <Text style={[styles.infoCardTitle, { color: colors.textPrimary }]}>Giới hạn: 3 Lần / Tháng / Thói Quen</Text>
            </View>
            <Text style={[styles.infoCardDesc, { color: colors.textSecondary }]}>
              Mỗi thói quen được phép bỏ qua tối đa 3 lần trong tháng hiện tại ({currentMonth}) mà không mất kỷ lục. Lần bỏ qua thứ 4 sẽ bị tính là Thất Bại và kỷ lục sẽ về 0. Hạn mức tự động làm mới 3 lần vào ngày mùng 1 hàng tháng.
            </Text>
          </View>
        </View>

        {/* Section 3: Notifications & Widget */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>THÔNG BÁO & WIDGET MÀN HÌNH CHÍNH</Text>

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
                <Text style={[styles.settingItemTitle, { color: colors.textPrimary }]}>Gửi Thông Báo Thử Nghiệm</Text>
                <Text style={[styles.settingItemSubtitle, { color: colors.textSecondary }]}>Kiểm tra âm thanh & các kênh thông báo</Text>
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
                <Text style={[styles.settingItemTitle, { color: colors.textPrimary }]}>Đồng Bộ Widget Jetpack Glance</Text>
                <Text style={[styles.settingItemSubtitle, { color: colors.textSecondary }]}>Cập nhật dữ liệu widget trên màn hình chính Android</Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Section 4: Local Database & Backup */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>SAO LƯU & CƠ SỞ DỮ LIỆU</Text>

          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
            onPress={handleExport}
            activeOpacity={0.8}
          >
            <View style={styles.settingItemLeft}>
              <View style={[styles.iconBadge, { backgroundColor: `${colors.primary}20` }]}>
                <Cloud size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.settingItemTitle, { color: colors.textPrimary }]}>Sao Lưu Dữ Liệu (Export)</Text>
                <Text style={[styles.settingItemSubtitle, { color: colors.textSecondary }]}>Xuất toàn bộ dữ liệu ra file JSON an toàn</Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
            onPress={handleImport}
            activeOpacity={0.8}
          >
            <View style={styles.settingItemLeft}>
              <View style={[styles.iconBadge, { backgroundColor: `${colors.danger}20` }]}>
                <Database size={20} color={colors.danger} />
              </View>
              <View>
                <Text style={[styles.settingItemTitle, { color: colors.textPrimary }]}>Phục Hồi Dữ Liệu (Import)</Text>
                <Text style={[styles.settingItemSubtitle, { color: colors.textSecondary }]}>Ghi đè bằng file JSON đã sao lưu</Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, marginTop: 8 }]}>
            <View style={styles.infoCardHeader}>
              <Shield size={18} color={colors.textSecondary} />
              <Text style={[styles.infoCardTitle, { color: colors.textPrimary }]}>Động cơ SQLite an toàn</Text>
            </View>
            <Text style={[styles.infoCardDesc, { color: colors.textSecondary }]}>
              Tất cả dữ liệu thói quen, lịch sử điểm danh và ảnh có watermark được lưu trữ an toàn trong bộ nhớ thiết bị của bạn.
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
  themeToggleContainer: {
    flexDirection: 'row',
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  themeOptionText: {
    fontSize: 13,
    fontFamily: THEME.typography.bodyBold.fontFamily,
  },
  themeDivider: {
    width: 1,
    height: '100%',
  },
});

