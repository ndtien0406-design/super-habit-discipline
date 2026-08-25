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
  StatusBar,
  Alert,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Cloud, Settings, Flame, Shield, Trophy, Sparkles, CheckCircle2 } from 'lucide-react-native';
import { useAppTheme } from '../theme/index.js';
import { getEnrichedHabitsList, deleteHabit } from '../database/queries.js';
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

  const { THEME, colors, isDark } = useAppTheme();

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

  const handleCardLongPress = (habit) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Do you want to delete the habit "${habit.title}"?`);
      if (confirmed) {
        deleteHabit(habit.id).then(() => {
          updateHabitWidget();
          loadData();
        });
      }
      return;
    }

    Alert.alert(
      'Delete Habit',
      `Do you want to delete the habit "${habit.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            await deleteHabit(habit.id);
            await updateHabitWidget();
            loadData();
          }
        }
      ]
    );
  };

  // Quick stats calculations
  const totalHabits = habits.length;
  const completedTodayCount = habits.filter(h => h.isTodayCompleted).length;
  const bestOverallStreak = habits.reduce((max, h) => Math.max(max, h.bestStreak || 0), 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.bg} />

      {/* Top Header */}
      <View style={styles.topHeader}>
        <View>
          <View style={styles.logoRow}>
            <View style={[styles.logoBadge, { backgroundColor: colors.primary }]}>
              <Flame size={16} color={isDark ? '#000' : '#FFF'} />
            </View>
            <Text style={[styles.headerAppTitle, { color: colors.textPrimary }]}>SUPER CLIENT</Text>
          </View>
          <Text style={[styles.dateSubtitle, { color: colors.textMuted }]}>{formatDisplayDate(today, 'full')}</Text>
        </View>

        {/* Header Right Action Icons */}
        <View style={styles.headerIconsRow}>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
            onPress={() => setNotionModalVisible(true)}
          >
            <Cloud size={20} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
            onPress={() => navigation.navigate('Settings')}
          >
            <Settings size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Overview Quick Stats Bar */}
      <View style={[styles.quickStatsContainer, { backgroundColor: colors.surface }]}>
        <View style={styles.quickStatBox}>
          <Text style={[styles.quickStatLabel, { color: colors.textMuted }]}>TODAY'S PROGRESS</Text>
          <Text style={[styles.quickStatValue, { color: colors.success }]}>
            {completedTodayCount}/{totalHabits}
          </Text>
        </View>
        <View style={[styles.quickStatDivider, { backgroundColor: colors.surfaceBorder }]} />
        <View style={styles.quickStatBox}>
          <Text style={[styles.quickStatLabel, { color: colors.textMuted }]}>ACTIVE HABITS</Text>
          <Text style={[styles.quickStatValue, { color: colors.textPrimary }]}>
            {totalHabits}
          </Text>
        </View>
        <View style={[styles.quickStatDivider, { backgroundColor: colors.surfaceBorder }]} />
        <View style={styles.quickStatBox}>
          <Text style={[styles.quickStatLabel, { color: colors.textMuted }]}>BEST STREAK</Text>
          <Text style={[styles.quickStatValue, { color: colors.warning }]}>
            {bestOverallStreak}d
          </Text>
        </View>
      </View>

      {/* Main Swipeable Habits Cards Carousel */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading disciplines...</Text>
        </View>
      ) : habits.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <View style={[styles.emptyIconCircle, { backgroundColor: colors.surfaceSubtle, borderColor: colors.surfaceBorder }]}>
              <Sparkles size={36} color={colors.textPrimary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Habits Yet</Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
              Start your journey of discipline by creating a Build or Quit habit.
            </Text>
            <TouchableOpacity
              style={[styles.emptyAddBtn, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('CreateHabit')}
            >
              <Plus size={18} color={isDark ? '#000' : '#FFF'} />
              <Text style={[styles.emptyAddText, { color: isDark ? '#000' : '#FFF' }]}>Create First Habit</Text>
            </TouchableOpacity>
          </View>
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
                onCardLongPress={handleCardLongPress}
              />
            )}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
              />
            }
          />
        </View>
      )}

      {/* Floating Add Habit Button */}
      {habits.length > 0 && (
        <TouchableOpacity
          style={[styles.fabButton, { backgroundColor: colors.textPrimary, shadowColor: colors.textPrimary }]}
          onPress={() => navigation.navigate('CreateHabit')}
          activeOpacity={0.9}
        >
          <Plus size={24} color={colors.bg} />
          <Text style={[styles.fabText, { color: colors.bg }]}>Add Habit</Text>
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
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: 56,
    paddingBottom: 16,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    width: 28,
    height: 28,
    borderRadius: THEME.radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAppTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 22,
    fontFamily: THEME.typography.title1.fontFamily,
    letterSpacing: THEME.typography.title1.letterSpacing,
  },
  dateSubtitle: {
    fontSize: 12,
    fontFamily: THEME.typography.small.fontFamily,
    textTransform: THEME.typography.small.textTransform,
    letterSpacing: 0.5,
    marginTop: 4,
  },
  headerIconsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: THEME.radius.full,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickStatsContainer: {
    flexDirection: 'row',
    marginHorizontal: THEME.spacing.lg,
    marginVertical: THEME.spacing.sm,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: THEME.radius.lg,
    justifyContent: 'space-around',
    alignItems: 'center',
    // Removed thick border to reduce borders
    // Can optionally add a very soft shadow here if preferred
  },
  quickStatBox: {
    alignItems: 'center',
    flex: 1,
  },
  quickStatLabel: {
    fontSize: 10,
    fontFamily: THEME.typography.small.fontFamily,
    textTransform: THEME.typography.small.textTransform,
    letterSpacing: 0.5,
  },
  quickStatValue: {
    fontSize: 20,
    fontFamily: THEME.typography.title2.fontFamily,
    color: THEME.colors.textPrimary,
    marginTop: 4,
  },
  quickStatDivider: {
    width: 1,
    height: 32,
  },
  carouselWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  carouselContent: {
    paddingHorizontal: Math.max(12, ((SCREEN_WIDTH > 440 ? 440 : SCREEN_WIDTH) - CARD_WIDTH) / 2 - 8),
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: THEME.typography.body.fontFamily,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.spacing.lg,
  },
  emptyCard: {
    width: '100%',
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: THEME.typography.title2.fontFamily,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    fontFamily: THEME.typography.body.fontFamily,
    lineHeight: THEME.typography.body.lineHeight,
    textAlign: 'center',
    marginBottom: THEME.spacing.xl,
  },
  emptyAddBtn: {
    borderRadius: THEME.radius.full,
    overflow: 'hidden',
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  emptyAddText: {
    fontSize: 15,
    fontFamily: THEME.typography.bodyBold.fontFamily,
    fontWeight: THEME.typography.bodyBold.fontWeight,
  },
  fabButton: {
    position: 'absolute',
    bottom: 32,
    alignSelf: 'center',
    borderRadius: THEME.radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
    shadowColor: THEME.colors.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  fabText: {
    fontSize: 15,
    fontFamily: THEME.typography.bodyBold.fontFamily,
    fontWeight: THEME.typography.bodyBold.fontWeight,
  },
});
