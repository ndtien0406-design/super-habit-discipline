import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Cloud, Settings, Flame, Shield, Trophy, Sparkles, CheckCircle2 } from 'lucide-react-native';
import { THEME } from '../theme/index.js';
import { getEnrichedHabitsList } from '../database/queries.js';
import { SwipeableHabitCard, CARD_WIDTH } from '../components/SwipeableHabitCard.jsx';
import { MilestoneModal } from '../components/MilestoneModal.jsx';
import { NotionConfigModal } from '../components/NotionConfigModal.jsx';
import { getTodayDateString, formatDisplayDate } from '../utils/dateHelper.js';
import { updateHabitWidget } from '../services/widgetService.js';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function DashboardScreen({ navigation, route }) {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeHabitIndex, setActiveHabitIndex] = useState(0);

  // Modals state
  const [notionModalVisible, setNotionModalVisible] = useState(false);
  const [milestoneData, setMilestoneData] = useState(null);

  const today = getTodayDateString();

  const loadData = useCallback(async () => {
    try {
      const list = await getEnrichedHabitsList(today);
      setHabits(list);
      await updateHabitWidget();
    } catch (e) {
      console.error('[Dashboard] Error loading habits:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [today]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    loadData();
    return unsubscribe;
  }, [navigation, loadData]);

  // Check if routed with milestone params
  useEffect(() => {
    if (route.params?.milestoneStreak && route.params?.milestoneHabitTitle) {
      setMilestoneData({
        streak: route.params.milestoneStreak,
        title: route.params.milestoneHabitTitle,
      });
      // Clear params to avoid re-triggering
      navigation.setParams({ milestoneStreak: null, milestoneHabitTitle: null });
    }
  }, [route.params]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleCheckinPress = (habit) => {
    if (habit.type === 'build') {
      navigation.navigate('BuildCheckin', { habit });
    } else {
      navigation.navigate('QuitCheckin', { habit });
    }
  };

  const handleCardPress = (habit) => {
    navigation.navigate('HabitDetail', { habitId: habit.id });
  };

  // Quick stats calculations
  const totalHabits = habits.length;
  const completedTodayCount = habits.filter(h => h.isTodayCompleted).length;
  const bestOverallStreak = habits.reduce((max, h) => Math.max(max, h.bestStreak || 0), 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0D14" />

      {/* Top Header */}
      <View style={styles.topHeader}>
        <View>
          <View style={styles.logoRow}>
            <LinearGradient
              colors={['#FF7A00', '#FF0055']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoBadge}
            >
              <Flame size={16} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.headerAppTitle}>SUPER CLIENT</Text>
          </View>
          <Text style={styles.dateSubtitle}>{formatDisplayDate(today, 'full')}</Text>
        </View>

        {/* Header Right Action Icons */}
        <View style={styles.headerIconsRow}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setNotionModalVisible(true)}
          >
            <Cloud size={20} color={THEME.colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Settings size={20} color={THEME.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Overview Quick Stats Bar */}
      <View style={styles.quickStatsContainer}>
        <View style={styles.quickStatBox}>
          <Text style={styles.quickStatLabel}>TIẾN ĐỘ HÔM NAY</Text>
          <Text style={[styles.quickStatValue, { color: THEME.colors.success }]}>
            {completedTodayCount}/{totalHabits}
          </Text>
        </View>
        <View style={styles.quickStatDivider} />
        <View style={styles.quickStatBox}>
          <Text style={styles.quickStatLabel}>THÓI QUEN ĐANG THEO</Text>
          <Text style={[styles.quickStatValue, { color: THEME.colors.textPrimary }]}>
            {totalHabits}
          </Text>
        </View>
        <View style={styles.quickStatDivider} />
        <View style={styles.quickStatBox}>
          <Text style={styles.quickStatLabel}>KỶ LỤC CAO NHẤT</Text>
          <Text style={[styles.quickStatValue, { color: THEME.colors.warning }]}>
            {bestOverallStreak}d
          </Text>
        </View>
      </View>

      {/* Main Swipeable Habits Cards Carousel */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME.colors.primary} />
          <Text style={styles.loadingText}>Đang nạp dữ liệu kỷ luật...</Text>
        </View>
      ) : habits.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <LinearGradient
            colors={['#171F2E', '#0F141F']}
            style={styles.emptyCard}
          >
            <View style={styles.emptyIconCircle}>
              <Sparkles size={36} color={THEME.colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Chưa Có Thói Quen Nào</Text>
            <Text style={styles.emptyDesc}>
              Bắt đầu hành trình rèn luyện kỷ luật bằng cách tạo thói quen Build (Xây dựng) hoặc Quit (Từ bỏ).
            </Text>
            <TouchableOpacity
              style={styles.emptyAddBtn}
              onPress={() => navigation.navigate('CreateHabit')}
            >
              <LinearGradient
                colors={['#6366F1', '#4F46E5']}
                style={styles.emptyAddGradient}
              >
                <Plus size={18} color="#FFFFFF" />
                <Text style={styles.emptyAddText}>Tạo Thói Quen Đầu Tiên</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      ) : (
        <View style={styles.carouselWrapper}>
          <FlatList
            data={habits}
            keyExtractor={(item) => String(item.id)}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_WIDTH + 16}
            decelerationRate="fast"
            contentContainerStyle={styles.carouselContent}
            renderItem={({ item }) => (
              <SwipeableHabitCard
                habit={item}
                onCheckinPress={handleCheckinPress}
                onCardPress={handleCardPress}
              />
            )}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={THEME.colors.primary}
              />
            }
          />
        </View>
      )}

      {/* Floating Add Habit Button */}
      {habits.length > 0 && (
        <TouchableOpacity
          style={styles.fabButton}
          onPress={() => navigation.navigate('CreateHabit')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#6366F1', '#4F46E5']}
            style={styles.fabGradient}
          >
            <Plus size={24} color="#FFFFFF" />
            <Text style={styles.fabText}>Thêm Thói Quen</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Notion Config & Sync Modal */}
      <NotionConfigModal
        visible={notionModalVisible}
        onClose={() => setNotionModalVisible(false)}
        onSyncComplete={loadData}
      />

      {/* Milestone Celebration Modal */}
      {milestoneData && (
        <MilestoneModal
          visible={true}
          streakCount={milestoneData.streak}
          habitTitle={milestoneData.title}
          onClose={() => setMilestoneData(null)}
        />
      )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.md,
    paddingTop: 48,
    paddingBottom: 12,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAppTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  dateSubtitle: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  headerIconsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickStatsContainer: {
    flexDirection: 'row',
    backgroundColor: '#121722',
    marginHorizontal: THEME.spacing.md,
    marginVertical: THEME.spacing.sm,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: THEME.radius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  quickStatBox: {
    alignItems: 'center',
    flex: 1,
  },
  quickStatLabel: {
    color: THEME.colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  quickStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: THEME.colors.surfaceBorder,
  },
  carouselWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  carouselContent: {
    paddingHorizontal: (SCREEN_WIDTH - CARD_WIDTH) / 2 - 8,
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: THEME.colors.textSecondary,
    fontSize: 14,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.spacing.lg,
  },
  emptyCard: {
    width: '100%',
    borderRadius: THEME.radius.xl,
    padding: THEME.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: `${THEME.colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  emptyTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyDesc: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: THEME.spacing.lg,
  },
  emptyAddBtn: {
    borderRadius: THEME.radius.md,
    overflow: 'hidden',
    width: '100%',
  },
  emptyAddGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  emptyAddText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  fabButton: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    borderRadius: THEME.radius.full,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  fabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 13,
    gap: 8,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
