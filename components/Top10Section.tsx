import React from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Layout from '@/constants/layout';

export interface Top10Anime {
  id: string;
  rank: number;
  name: string;
  jname: string;
  poster: string;
  episodes?: {
    sub?: number;
    dub?: number;
  };
}

interface Top10SectionProps {
  title: string;
  animeList: Top10Anime[];
  viewAllLink?: string;
}

export default function Top10Section({
  title,
  animeList,
  viewAllLink = '/explore',
}: Top10SectionProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {viewAllLink && (
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
        {animeList.map((anime, index) => (
          <Link key={`${anime.id}-${index}`} href={`/anime/${anime.id}`} asChild>
            <Pressable style={styles.animeCard}>
              <View style={styles.rankContainer}>
                <Text style={styles.rankText}>{anime.rank || index + 1}</Text>
              </View>
              <Image
                source={{ uri: anime.poster }}
                style={styles.poster}
                contentFit="cover"
                transition={200}
              />
              <View style={styles.infoContainer}>
                <Text style={styles.animeName} numberOfLines={2}>
                  {anime.name}
                </Text>
                {anime.episodes && (
                  <View style={styles.episodesContainer}>
                    {anime.episodes.sub && (
                      <View style={styles.episodeTag}>
                        <Text style={styles.episodeText}>SUB: {anime.episodes.sub}</Text>
                      </View>
                    )}
                    {anime.episodes.dub && (
                      <View style={[styles.episodeTag, styles.dubTag]}>
                        <Text style={styles.episodeText}>DUB: {anime.episodes.dub}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </Pressable>
          </Link>
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
    paddingBottom: Layout.spacing.sm,
  },
  animeCard: {
    width: 150,
    marginHorizontal: Layout.spacing.xs,
    backgroundColor: Colors.dark.card,
    borderRadius: Layout.borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  rankContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.dark.accent,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  rankText: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  poster: {
    width: '100%',
    height: 200,
  },
  infoContainer: {
    padding: Layout.spacing.sm,
  },
  animeName: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: Layout.spacing.xs,
  },
  episodesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  episodeTag: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 4,
  },
  dubTag: {
    backgroundColor: Colors.dark.secondary,
  },
  episodeText: {
    color: Colors.dark.text,
    fontSize: 10,
    fontWeight: 'bold',
  },
});