import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { ArrowLeft, ImageIcon } from 'lucide-react-native';
import { useAppTheme } from '../theme/index.js';
import { getHabitImages } from '../database/queries.js';

export function VisualTimelineScreen({ route, navigation }) {
  const { habitId, habitTitle } = route.params;
  const { THEME, colors } = useAppTheme();
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState([]);

  useEffect(() => {
    async function loadImages() {
      try {
        const data = await getHabitImages(habitId);
        setImages(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadImages();
  }, [habitId]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.topHeader, { backgroundColor: colors.bg, borderBottomColor: colors.surfaceBorder }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>Dòng Thời Gian</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>{habitTitle}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : images.length === 0 ? (
        <View style={styles.center}>
          <ImageIcon size={48} color={colors.textMuted} style={{ marginBottom: 16 }} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Chưa có hình ảnh check-in nào.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.gridContainer}>
          {images.map((img) => (
            <View key={img.id} style={[styles.imageCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              <Image source={{ uri: img.image_path }} style={styles.image} />
              <View style={styles.imageMeta}>
                <Text style={[styles.dateText, { color: colors.textPrimary }]}>{img.checkin_date}</Text>
                <Text style={[styles.dayText, { color: colors.primary }]}>Ngày {img.day_number}</Text>
              </View>
              {img.note ? (
                <Text style={[styles.noteText, { color: colors.textSecondary }]} numberOfLines={2}>{img.note}</Text>
              ) : null}
            </View>
          ))}
        </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  iconBtn: {
    padding: 8,
  },
  headerTitleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'Georgia',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
  },
  gridContainer: {
    padding: 16,
    gap: 16,
  },
  imageCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    paddingBottom: 12,
  },
  image: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  imageMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  dateText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  dayText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  noteText: {
    fontSize: 12,
    paddingHorizontal: 12,
    paddingTop: 4,
  }
});
