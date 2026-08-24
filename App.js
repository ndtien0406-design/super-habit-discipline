import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, StatusBar, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppNavigator } from './src/navigation/AppNavigator.jsx';
import { getDatabase } from './src/database/dbSetup.js';
import { getAllHabits, createHabit } from './src/database/queries.js';
import { initNotifications, scheduleHabitReminder } from './src/services/notificationManager.js';
import { THEME } from './src/theme/index.js';

// Register Android Widget background task handler only on native Android
if (Platform.OS === 'android') {
  try {
    const { registerWidgetTaskHandler } = require('react-native-android-widget');
    const { HabitGlanceWidget } = require('./src/widget/HabitGlanceWidget.jsx');
    registerWidgetTaskHandler(async (props) => {
      const { widgetInfo } = props;
      return <HabitGlanceWidget habits={widgetInfo?.habits || []} lastUpdated={widgetInfo?.lastUpdated || ''} />;
    });
  } catch (e) {
    // Graceful fallback
  }
}

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function prepareApp() {
      try {
        // 1. Initialize SQLite Database
        await getDatabase();

        // 2. Initialize Notifications
        await initNotifications();

        // 3. Seed initial starter habits if database is completely empty
        const existingHabits = await getAllHabits();
        if (existingHabits.length === 0) {
          const habit1Id = await createHabit({
            title: 'Chạy Bộ 5km Buổi Sáng',
            type: 'build',
            color_code: '#10B981',
            reminder_time: '06:00',
          });
          await scheduleHabitReminder({
            id: habit1Id,
            title: 'Chạy Bộ 5km Buổi Sáng',
            type: 'build',
            color_code: '#10B981',
            reminder_time: '06:00',
          });

          const habit2Id = await createHabit({
            title: 'Không Thức Khuya Sau 23:00',
            type: 'quit',
            color_code: '#F59E0B',
            reminder_time: '22:30',
          });
          await scheduleHabitReminder({
            id: habit2Id,
            title: 'Không Thức Khuya Sau 23:00',
            type: 'quit',
            color_code: '#F59E0B',
            reminder_time: '22:30',
          });
        }
      } catch (err) {
        console.error('[App] Bootstrap error:', err);
      } finally {
        setIsReady(true);
      }
    }

    prepareApp();
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0A0D14" />
        <ActivityIndicator size="large" color={THEME.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider style={styles.rootContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0D14" />
      {Platform.OS === 'web' ? (
        <View style={styles.webOuterBackground}>
          <View style={styles.webMobileFrame}>
            <AppNavigator />
          </View>
        </View>
      ) : (
        <AppNavigator />
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#0A0D14',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0A0D14',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webOuterBackground: {
    flex: 1,
    backgroundColor: '#05070B',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    width: '100%',
  },
  webMobileFrame: {
    width: '100%',
    maxWidth: 440,
    height: '100%',
    maxHeight: 920,
    backgroundColor: '#0A0D14',
    overflow: 'hidden',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#1E293B',
  },
});
