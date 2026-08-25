import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getDatabase } from '../database/dbSetup.js';
import { Platform } from 'react-native';

export async function exportDataToJSON() {
  if (Platform.OS === 'web') {
    throw new Error('Sao lưu không khả dụng trên trình duyệt web.');
  }

  const db = await getDatabase();
  
  try {
    const habits = await db.getAllAsync('SELECT * FROM habits');
    const checkins = await db.getAllAsync('SELECT * FROM checkins');
    const settings = await db.getAllAsync('SELECT * FROM app_settings');

    const backupData = {
      version: 1,
      exportDate: new Date().toISOString(),
      habits,
      checkins,
      settings
    };

    const jsonString = JSON.stringify(backupData);
    const fileUri = FileSystem.documentDirectory + 'SuperHabitBackup.json';
    
    await FileSystem.writeAsStringAsync(fileUri, jsonString, {
      encoding: FileSystem.EncodingType.UTF8
    });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Lưu file sao lưu',
        UTI: 'public.json'
      });
      return true;
    } else {
      throw new Error('Không thể chia sẻ file trên thiết bị này.');
    }
  } catch (error) {
    console.error('Export Error:', error);
    throw error;
  }
}

export async function importDataFromJSON() {
  if (Platform.OS === 'web') {
    throw new Error('Phục hồi không khả dụng trên trình duyệt web.');
  }

  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/json', 'text/plain', '*/*'],
      copyToCacheDirectory: true
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return false; // User cancelled
    }

    const file = result.assets[0];
    const fileContent = await FileSystem.readAsStringAsync(file.uri, {
      encoding: FileSystem.EncodingType.UTF8
    });

    const data = JSON.parse(fileContent);

    if (!data.habits || !data.checkins) {
      throw new Error('Định dạng file không hợp lệ.');
    }

    const db = await getDatabase();

    // Begin transaction-like operation (Sequential executes)
    await db.execAsync('PRAGMA foreign_keys = OFF;');
    await db.execAsync('DELETE FROM checkins;');
    await db.execAsync('DELETE FROM habits;');
    await db.execAsync('DELETE FROM app_settings;');

    for (const h of data.habits) {
      await db.runAsync(
        `INSERT INTO habits (id, title, type, color_code, reminder_time, target_streak, target_type, target_date, notes, tag, latitude, longitude, freezes_left, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [h.id, h.title, h.type, h.color_code, h.reminder_time, h.target_streak, h.target_type, h.target_date, h.notes, h.tag, h.latitude, h.longitude, h.freezes_left, h.created_at]
      );
    }

    for (const c of data.checkins) {
      await db.runAsync(
        `INSERT INTO checkins (id, habit_id, checkin_date, image_path, note, day_number, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [c.id, c.habit_id, c.checkin_date, c.image_path, c.note, c.day_number, c.status, c.created_at]
      );
    }

    for (const s of (data.settings || [])) {
      await db.runAsync(
        `INSERT INTO app_settings (key, value) VALUES (?, ?)`,
        [s.key, s.value]
      );
    }

    await db.execAsync('PRAGMA foreign_keys = ON;');
    return true;

  } catch (error) {
    console.error('Import Error:', error);
    throw error;
  }
}
