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
import { THEME } from '../theme/index.js';
import { NotionConfigModal } from '../components/NotionConfigModal.jsx';
import { getCurrentMonthKey } from '../utils/dateHelper.js';
import { updateHabitWidget } from '../services/widgetService.js';

export function SettingsScreen({ navigation }) {
  const [notionModalVisible, setNotionModalVisible] = useState(false);
  const currentMonth = getCurrentMonthKey();

  const handleTestNotification = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔥 Thử Nghiệm Nhắc Nhở Kỷ Luật',
          body: 'Thông báo hoạt động hoàn hảo! Đừng quên điểm danh để giữ vững chuỗi streak.',
          data: { test: true },
          color: '#6366F1',
        },
        trigger: null, // trigger immediately
      });
      Alert.alert('Thành công', 'Đã gửi thông báo kiểm tra lên thiết bị!');
    } catch (e) {
      Alert.alert('Lỗi gửi thông báo', e.message);
    }
  };

  const handleRefreshWidget = async () => {
    await updateHabitWidget();
    Alert.alert('Đã Cập Nhật Widget', 'Dữ liệu mới nhất đã được đồng bộ sang Android Home Screen Widget (Jetpack Glance).');
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <ArrowLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cài Đặt & Đồng Bộ</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Architecture Highlight */}
        <LinearGradient
          colors={['#1E273A', '#0F1420']}
          style={styles.architectureCard}
        >
          <View style={styles.architectureHeader}>
            <Shield size={22} color={THEME.colors.primary} />
            <Text style={styles.architectureTitle}>Kiến Trúc Super Client (V4)</Text>
          </View>
          <Text style={styles.architectureDesc}>
            100% Offline-First. Toàn bộ logic điểm danh, tính streak, xuất video recap bằng CPU thiết bị, và đồng bộ Notion API trực tiếp từ điện thoại — không phụ thuộc server trung gian.
          </Text>
        </LinearGradient>

        {/* Section 1: Notion Cloud Sync */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>ĐỒNG BỘ ĐÁM MÂY (NOTION API)</Text>
          
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setNotionModalVisible(true)}
            activeOpacity={0.8}
          >
            <View style={styles.settingItemLeft}>
              <View style={[styles.iconBadge, { backgroundColor: `${THEME.colors.primary}20` }]}>
                <Cloud size={20} color={THEME.colors.primary} />
              </View>
              <View>
                <Text style={styles.settingItemTitle}>Cấu Hình & Đồng Bộ Notion</Text>
                <Text style={styles.settingItemSubtitle}>Tự động đẩy ghi chú, nhật ký lên Notion Database</Text>
              </View>
            </View>
            <ChevronRight size={18} color={THEME.colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Section 2: Freeze Quota System */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>CƠ CHẾ THẺ ĐÓNG BĂNG (FREEZE CARD)</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <Snowflake size={18} color={THEME.colors.freeze} />
              <Text style={styles.infoCardTitle}>Giới Hạn 3 Lần / Tháng / Thói Quen</Text>
            </View>
            <Text style={styles.infoCardDesc}>
              Mỗi thói quen được phép lỡ điểm danh tối đa 3 lần trong tháng hiện tại ({currentMonth}) mà không bị mất streak. Lần bỏ lỡ thứ 4 sẽ bị tính là Thất Bại (Failed) và streak bị reset về 0. Hạn mức tự động cấp lại 3 lượt vào ngày 1 hàng tháng.
            </Text>
          </View>
        </View>

        {/* Section 3: Notifications & Widget */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>THÔNG BÁO & TIỆN ÍCH MÀN HÌNH CHÍNH</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleTestNotification}
            activeOpacity={0.8}
          >
            <View style={styles.settingItemLeft}>
              <View style={[styles.iconBadge, { backgroundColor: `${THEME.colors.warning}20` }]}>
                <Bell size={20} color={THEME.colors.warning} />
              </View>
              <View>
                <Text style={styles.settingItemTitle}>Gửi Thông Báo Thử Nghiệm</Text>
                <Text style={styles.settingItemSubtitle}>Kiểm tra âm thanh & kênh thông báo</Text>
              </View>
            </View>
            <ChevronRight size={18} color={THEME.colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleRefreshWidget}
            activeOpacity={0.8}
          >
            <View style={styles.settingItemLeft}>
              <View style={[styles.iconBadge, { backgroundColor: `${THEME.colors.success}20` }]}>
                <Smartphone size={20} color={THEME.colors.success} />
              </View>
              <View>
                <Text style={styles.settingItemTitle}>Đồng Bộ Jetpack Glance Widget</Text>
                <Text style={styles.settingItemSubtitle}>Cập nhật dữ liệu lưới widget trên Android Home</Text>
              </View>
            </View>
            <ChevronRight size={18} color={THEME.colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Section 4: Local Database */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>CƠ SỞ DỮ LIỆU CỤC BỘ</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <Database size={18} color={THEME.colors.textSecondary} />
              <Text style={styles.infoCardTitle}>SQLite Local Engine (expo-sqlite)</Text>
            </View>
            <Text style={styles.infoCardDesc}>
              Toàn bộ dữ liệu thói quen, lịch sử check-in, ảnh đã đóng watermark được lưu trữ an toàn trong bộ nhớ máy của bạn.
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
    backgroundColor: THEME.colors.bg,
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
  },
  scrollContent: {
    padding: THEME.spacing.md,
  },
  architectureCard: {
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    marginBottom: THEME.spacing.lg,
  },
  architectureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  architectureTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  architectureDesc: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  section: {
    marginBottom: THEME.spacing.lg,
  },
  sectionHeader: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.surface,
    padding: 14,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
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
    color: THEME.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  settingItemSubtitle: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: THEME.colors.surface,
    padding: 14,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  infoCardTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  infoCardDesc: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
});
