import React from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Link } from 'expo-router';
import Colors from '@/constants/colors';
import Layout from '@/constants/layout';
import AnimeCard from './AnimeCard';
import { LocalAnime } from '@/types/anime';

interface AnimeSectionProps {
  title: string;
  animeList: LocalAnime[];
  size?: 'small' | 'medium' | 'large';
  showViewAll?: boolean;
  viewAllLink?: string;
}

export default function AnimeSection({
  title,
  animeList,
  size = 'medium',
  showViewAll = true,
  viewAllLink = '/explore',
}: AnimeSectionProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {showViewAll && (
          <Link href={viewAllLink} asChild>
            <Pressable style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All</Text>
              <ChevronRight size={16} color={Colors.dark.primary} />
            </Pressable>
          </Link>
        )}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {animeList.map((anime) => (
          <AnimeCard key={anime.id} anime={anime} size={size} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Layout.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.md,
    marginBottom: Layout.spacing.sm,
  },
  title: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    color: Colors.dark.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: Layout.spacing.sm,
  },
});