import React from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import Layout from '@/constants/layout';

interface GenreListProps {
  genres?: string[];
}

export default function GenreList({ genres = [] }: GenreListProps) {
  const router = useRouter();
  
  // Use provided genres or fallback to default list
  const genreList = genres.length > 0 ? genres : [
    'Action',
    'Adventure',
    'Comedy',
    'Drama',
    'Fantasy',
    'Horror',
    'Mystery',
    'Romance',
    'Sci-Fi',
    'Slice of Life',
    'Sports',
    'Supernatural',
    'Thriller'
  ];

  const handleGenrePress = (genre: string) => {
    router.push({
      pathname: '/explore',
      params: { genre },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Browse by Genre</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {genreList.map((genre) => (
          <Pressable
            key={genre}
            style={styles.genreItem}
            onPress={() => handleGenrePress(genre)}
          >
            <Text style={styles.genreText}>{genre}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Layout.spacing.lg,
  },
  title: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: Layout.spacing.md,
    marginBottom: Layout.spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: Layout.spacing.sm,
  },
  genreItem: {
    backgroundColor: Colors.dark.card,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.borderRadius.sm,
    marginRight: Layout.spacing.sm,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  genreText: {
    color: Colors.dark.text,
    fontSize: 14,
  },
});