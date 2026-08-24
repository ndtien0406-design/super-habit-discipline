import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Cloud, CheckCircle2, AlertCircle, RefreshCw, X, Shield, ExternalLink } from 'lucide-react-native';
import { THEME } from '../theme/index.js';
import { getSetting, setSetting } from '../database/queries.js';
import { testNotionConnection, syncCheckinsToNotion } from '../services/notionSync.js';

export function NotionConfigModal({ visible, onClose, onSyncComplete }) {
  const [token, setToken] = useState('');
  const [databaseId, setDatabaseId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [syncProgress, setSyncProgress] = useState(null);

  useEffect(() => {
    if (visible) {
      loadSavedConfig();
    }
  }, [visible]);

  const loadSavedConfig = async () => {
    try {
      const savedToken = await getSetting('notion_token', '');
      const savedDbId = await getSetting('notion_database_id', '');
      setToken(savedToken);
      setDatabaseId(savedDbId);
      setTestResult(null);
      setSyncProgress(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async () => {
    await setSetting('notion_token', token.trim());
    await setSetting('notion_database_id', databaseId.trim());
    Alert.alert('Đã lưu', 'Cấu hình Notion đã được lưu cục bộ trên máy.');
  };

  const handleTestConnection = async () => {
    if (!token || !databaseId) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập Token và Database ID.');
      return;
    }
    setIsTesting(true);
    setTestResult(null);

    const result = await testNotionConnection(token, databaseId);
    setIsTesting(false);
    setTestResult(result);

    if (result.success) {
      // Auto save on successful test
      await setSetting('notion_token', token.trim());
      await setSetting('notion_database_id', databaseId.trim());
    }
  };

  const handleSyncNow = async () => {
    if (!token || !databaseId) {
      Alert.alert('Chưa cấu hình', 'Vui lòng kiểm tra kết nối Notion trước khi đồng bộ.');
      return;
    }

    setIsLoading(true);
    setSyncProgress({ current: 0, total: 0, text: 'Đang chuẩn bị dữ liệu SQLite...' });

    try {
      const result = await syncCheckinsToNotion({
        onProgress: (cur, tot, itemTitle) => {
          setSyncProgress({ current: cur, total: tot, text: `Đang đẩy [${cur}/${tot}]: ${itemTitle}` });
        }
      });

      setIsLoading(false);

      if (result.success) {
        Alert.alert(
          '✅ Đồng Bộ Thành Công!',
          `Đã chuyển thành công ${result.syncedCount} bản ghi nhật ký lên Notion Workspace của bạn!`
        );
        if (onSyncComplete) onSyncComplete();
      } else {
        Alert.alert(
          'Đồng bộ hoàn tất một phần',
          `Đã đồng bộ ${result.syncedCount} bản ghi.\nLỗi ${result.errorCount} bản ghi:\n${result.errors.slice(0, 3).join('\n')}`
        );
      }
    } catch (err) {
      setIsLoading(false);
      Alert.alert('Lỗi Đồng Bộ', err.message);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <LinearGradient colors={['#171F2E', '#0A0D14']} style={styles.cardGradient}>
            {/* Top Header */}
            <View style={styles.headerRow}>
              <View style={styles.titleWithIcon}>
                <Cloud size={20} color={THEME.colors.primary} />
                <Text style={styles.modalTitle}>Đồng Bộ Notion Workspace</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={20} color={THEME.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.subtitle}>
                Tự động đẩy toàn bộ ghi chú và nhật ký kỷ luật cá nhân lên database Notion của bạn (Direct Client-to-Cloud).
              </Text>

              {/* Form inputs */}
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>NOTION INTEGRATION TOKEN</Text>
                <TextInput
                  style={styles.input}
                  placeholder="secret_xxxxxxxxxxxxxxxxxxxxxxxxxx"
                  placeholderTextColor={THEME.colors.textMuted}
                  value={token}
                  onChangeText={setToken}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>NOTION DATABASE ID</Text>
                <TextInput
                  style={styles.input}
                  placeholder="32 ký tự ID của Notion Database"
                  placeholderTextColor={THEME.colors.textMuted}
                  value={databaseId}
                  onChangeText={setDatabaseId}
                  autoCapitalize="none"
                />
              </View>

              {/* Test Connection Button & Result */}
              <TouchableOpacity
                style={styles.testBtn}
                onPress={handleTestConnection}
                disabled={isTesting || isLoading}
              >
                {isTesting ? (
                  <ActivityIndicator size="small" color={THEME.colors.primary} />
                ) : (
                  <>
                    <RefreshCw size={15} color={THEME.colors.primary} />
                    <Text style={styles.testBtnText}>Kiểm Tra Kết Nối Database</Text>
                  </>
                )}
              </TouchableOpacity>

              {testResult && (
                <View style={[
                  styles.testResultBox,
                  { borderColor: testResult.success ? THEME.colors.success : THEME.colors.danger }
                ]}>
                  {testResult.success ? (
                    <CheckCircle2 size={16} color={THEME.colors.success} />
                  ) : (
                    <AlertCircle size={16} color={THEME.colors.danger} />
                  )}
                  <Text style={[
                    styles.testResultText,
                    { color: testResult.success ? THEME.colors.success : THEME.colors.danger }
                  ]}>
                    {testResult.message}
                  </Text>
                </View>
              )}

              {/* Live Sync Progress */}
              {syncProgress && (
                <View style={styles.syncProgressBox}>
                  <ActivityIndicator size="small" color={THEME.colors.warning} />
                  <Text style={styles.syncProgressText}>{syncProgress.text}</Text>
                </View>
              )}

              {/* Guide Note */}
              <View style={styles.guideBox}>
                <Shield size={16} color={THEME.colors.freeze} />
                <Text style={styles.guideText}>
                  Bảo mật Super Client: Dữ liệu được đẩy trực tiếp từ điện thoại sang Notion API, không đi qua bất kỳ server trung gian nào.
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.saveBtn]}
                  onPress={handleSave}
                  disabled={isLoading}
                >
                  <Text style={styles.saveBtnText}>Lưu Cấu Hình</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.syncBtn]}
                  onPress={handleSyncNow}
                  disabled={isLoading || isTesting}
                >
                  <LinearGradient
                    colors={['#6366F1', '#4F46E5']}
                    style={styles.syncBtnGradient}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Cloud size={16} color="#FFFFFF" />
                        <Text style={styles.syncBtnText}>Đồng Bộ Ngay</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
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
    padding: THEME.spacing.md,
  },
  container: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    borderRadius: THEME.radius.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: THEME.colors.surfaceBorder,
    elevation: 20,
  },
  cardGradient: {
    padding: THEME.spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  subtitle: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: THEME.spacing.md,
  },
  formGroup: {
    marginBottom: THEME.spacing.md,
  },
  inputLabel: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#0F141F',
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    borderRadius: THEME.radius.md,
    color: THEME.colors.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1E293B',
    paddingVertical: 10,
    borderRadius: THEME.radius.md,
    marginBottom: THEME.spacing.sm,
  },
  testBtnText: {
    color: THEME.colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  testResultBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0F141F',
    padding: 10,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    marginBottom: THEME.spacing.sm,
  },
  testResultText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  syncProgressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: `${THEME.colors.warning}15`,
    padding: 10,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: `${THEME.colors.warning}40`,
    marginBottom: THEME.spacing.sm,
  },
  syncProgressText: {
    color: THEME.colors.warning,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  guideBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: `${THEME.colors.freeze}10`,
    padding: 10,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: `${THEME.colors.freeze}30`,
    marginVertical: THEME.spacing.sm,
  },
  guideText: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: THEME.spacing.md,
  },
  actionBtn: {
    flex: 1,
    borderRadius: THEME.radius.md,
    overflow: 'hidden',
  },
  saveBtn: {
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  saveBtnText: {
    color: THEME.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  syncBtn: {},
  syncBtnGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  syncBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
