import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Cloud, CheckCircle2, AlertCircle, RefreshCw, X, Shield, ExternalLink } from 'lucide-react-native';
import { useAppTheme } from '../theme/index.js';
import { getSetting, setSetting } from '../database/queries.js';
import { testNotionConnection, syncCheckinsToNotion } from '../services/notionSync.js';

export function NotionConfigModal({ visible, onClose, onSyncComplete }) {
  const { THEME, colors, isDark } = useAppTheme();
  
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
    Alert.alert('Saved', 'Notion config saved locally on device.');
  };

  const handleTestConnection = async () => {
    if (!token || !databaseId) {
      Alert.alert('Missing Info', 'Please enter Token and Database ID.');
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
      Alert.alert('Not Configured', 'Please test Notion connection before syncing.');
      return;
    }

    setIsLoading(true);
    setSyncProgress({ current: 0, total: 0, text: 'Preparing SQLite data...' });

    try {
      const result = await syncCheckinsToNotion({
        onProgress: (cur, tot, itemTitle) => {
          setSyncProgress({ current: cur, total: tot, text: `Pushing [${cur}/${tot}]: ${itemTitle}` });
        }
      });

      setIsLoading(false);

      if (result.success) {
        Alert.alert(
          '✅ Sync Successful!',
          `Successfully pushed ${result.syncedCount} journal records to your Notion Workspace!`
        );
        if (onSyncComplete) onSyncComplete();
      } else {
        Alert.alert(
          'Sync Partially Completed',
          `Synced ${result.syncedCount} records.\nFailed ${result.errorCount} records:\n${result.errors.slice(0, 3).join('\n')}`
        );
      }
    } catch (err) {
      setIsLoading(false);
      Alert.alert('Sync Error', err.message);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { borderColor: colors.surfaceBorder, backgroundColor: colors.bg }]}>
          <LinearGradient colors={isDark ? ['#171F2E', '#0A0D14'] : [colors.surface, colors.bg]} style={styles.cardGradient}>
            {/* Top Header */}
            <View style={styles.headerRow}>
              <View style={styles.titleWithIcon}>
                <Cloud size={20} color={colors.primary} />
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Sync Notion Workspace</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Automatically push all personal discipline notes and journals to your Notion database (Direct Client-to-Cloud).
              </Text>

              {/* Form inputs */}
              <View style={styles.formGroup}>
                <Text style={[styles.inputLabel, { color: colors.textMuted }]}>NOTION INTEGRATION TOKEN</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surfaceSubtle, borderColor: colors.surfaceBorder, color: colors.textPrimary }]}
                  placeholder="secret_xxxxxxxxxxxxxxxxxxxxxxxxxx"
                  placeholderTextColor={colors.textMuted}
                  value={token}
                  onChangeText={setToken}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.inputLabel, { color: colors.textMuted }]}>NOTION DATABASE ID</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surfaceSubtle, borderColor: colors.surfaceBorder, color: colors.textPrimary }]}
                  placeholder="32-character Notion Database ID"
                  placeholderTextColor={colors.textMuted}
                  value={databaseId}
                  onChangeText={setDatabaseId}
                  autoCapitalize="none"
                />
              </View>

              {/* Test Connection Button & Result */}
              <TouchableOpacity
                style={[styles.testBtn, { backgroundColor: colors.surfaceSubtle }]}
                onPress={handleTestConnection}
                disabled={isTesting || isLoading}
              >
                {isTesting ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <>
                    <RefreshCw size={15} color={colors.primary} />
                    <Text style={[styles.testBtnText, { color: colors.primary }]}>Test Database Connection</Text>
                  </>
                )}
              </TouchableOpacity>

              {testResult && (
                <View style={[
                  styles.testResultBox,
                  { backgroundColor: colors.surfaceSubtle, borderColor: testResult.success ? colors.success : colors.danger }
                ]}>
                  {testResult.success ? (
                    <CheckCircle2 size={16} color={colors.success} />
                  ) : (
                    <AlertCircle size={16} color={colors.danger} />
                  )}
                  <Text style={[
                    styles.testResultText,
                    { color: testResult.success ? colors.success : colors.danger }
                  ]}>
                    {testResult.message}
                  </Text>
                </View>
              )}

              {/* Live Sync Progress */}
              {syncProgress && (
                <View style={[styles.syncProgressBox, { backgroundColor: `${colors.warning}15`, borderColor: `${colors.warning}40` }]}>
                  <ActivityIndicator size="small" color={colors.warning} />
                  <Text style={[styles.syncProgressText, { color: colors.warning }]}>{syncProgress.text}</Text>
                </View>
              )}

              {/* Guide Note */}
              <View style={[styles.guideBox, { backgroundColor: `${colors.freeze}10`, borderColor: `${colors.freeze}30` }]}>
                <Shield size={16} color={colors.freeze} />
                <Text style={[styles.guideText, { color: colors.textSecondary }]}>
                  Super Client Security: Data is pushed directly from your phone to Notion API, completely bypassing intermediary servers.
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.saveBtn, { backgroundColor: colors.surfaceSubtle }]}
                  onPress={handleSave}
                  disabled={isLoading}
                >
                  <Text style={[styles.saveBtnText, { color: colors.textPrimary }]}>Save Config</Text>
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
                        <Text style={styles.syncBtnText}>Sync Now</Text>
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
    fontSize: 17,
    fontFamily: THEME.typography.title2.fontFamily,
  },
  closeBtn: {
    padding: 4,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: THEME.typography.body.fontFamily,
    lineHeight: 18,
    marginBottom: THEME.spacing.md,
  },
  formGroup: {
    marginBottom: THEME.spacing.md,
  },
  inputLabel: {
    fontSize: 10,
    fontFamily: THEME.typography.title2.fontFamily,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: THEME.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: THEME.typography.body.fontFamily,
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: THEME.radius.md,
    marginBottom: THEME.spacing.sm,
  },
  testBtnText: {
    fontSize: 13,
    fontFamily: THEME.typography.bodyBold.fontFamily,
  },
  testResultBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    marginBottom: THEME.spacing.sm,
  },
  testResultText: {
    fontSize: 12,
    fontFamily: THEME.typography.bodyBold.fontFamily,
    flex: 1,
  },
  syncProgressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    marginBottom: THEME.spacing.sm,
  },
  syncProgressText: {
    fontSize: 12,
    fontFamily: THEME.typography.bodyBold.fontFamily,
    flex: 1,
  },
  guideBox: {
    flexDirection: 'row',
    gap: 8,
    padding: 10,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    marginVertical: THEME.spacing.sm,
  },
  guideText: {
    fontSize: 11,
    fontFamily: THEME.typography.body.fontFamily,
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  saveBtnText: {
    fontSize: 14,
    fontFamily: THEME.typography.bodyBold.fontFamily,
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
    fontFamily: THEME.typography.bodyBold.fontFamily,
  },
});
