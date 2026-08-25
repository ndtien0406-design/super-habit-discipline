import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, StatusBar, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Font from 'expo-font';

import { AppNavigator } from './src/navigation/AppNavigator.jsx';
import { getDatabase } from './src/database/dbSetup.js';
import { getAllHabits, createHabit } from './src/database/queries.js';
import { initNotifications, scheduleHabitReminder } from './src/services/notificationManager.js';
import { THEME, ThemeProvider, useAppTheme } from './src/theme/index.js';

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

function MainApp() {
  const { colors, isDark } = useAppTheme();
  
  return (
    <SafeAreaProvider style={[styles.rootContainer, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.bg} />
      {Platform.OS === 'web' ? (
        <View style={[styles.webOuterBackground, { backgroundColor: isDark ? '#000' : '#E8DFD1' }]}>
          <View style={[styles.webMobileFrame, { borderColor: colors.surfaceBorder, backgroundColor: colors.bg }]}>
            <AppNavigator />
          </View>
        </View>
      ) : (
        <AppNavigator />
      )}
    </SafeAreaProvider>
  );
}

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function prepareApp() {
      try {
        // 1. Load Fonts
        await Font.loadAsync({
          'Gilroy-Bold': require('./src/assets/fonts/Gilroy-Bold.ttf'),
          'Gilroy-Heavy': require('./src/assets/fonts/Gilroy-Heavy.ttf'),
          'Gilroy-Medium': require('./src/assets/fonts/Gilroy-Medium.ttf'),
          'Gilroy-Regular': require('./src/assets/fonts/Gilroy-Regular.ttf'),
          'Gilroy-Light': require('./src/assets/fonts/Gilroy-Light.ttf'),
        });

        // 2. Initialize SQLite Database
        await getDatabase();

        // 2. Initialize Notifications
        await initNotifications();

        // 3. Seed initial starter habits if database is completely empty
        const existingHabits = await getAllHabits();
        if (existingHabits.length === 0) {
          const habit1Id = await createHabit({
            title: 'Chạy bộ 5km buổi sáng',
            type: 'build',
            color_code: '#F66F00',
            reminder_time: '06:00',
          });
          await scheduleHabitReminder({
            id: habit1Id,
            title: 'Chạy bộ 5km buổi sáng',
            type: 'build',
            color_code: '#F66F00',
            reminder_time: '06:00',
          });

          const habit2Id = await createHabit({
            title: 'Ngủ trước 23:00',
            type: 'quit',
            color_code: '#4DA2FF',
            reminder_time: '22:30',
          });
          await scheduleHabitReminder({
            id: habit2Id,
            title: 'Ngủ trước 23:00',
            type: 'quit',
            color_code: '#4DA2FF',
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
        <ActivityIndicator size="large" color={THEME.colors.primary} />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFF7E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webOuterBackground: {
    flex: 1,
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
    overflow: 'hidden',
    borderRadius: 24,
    borderWidth: 1.5,
  },
});
