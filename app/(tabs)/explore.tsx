import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import Layout from '@/constants/layout';
import AnimeCard from '@/components/AnimeCard';
import { trpc } from '@/lib/trpc';

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Fetch anime data from API
  const { data, isLoading, refetch } = trpc.anime.getAllAnime.useQuery(
    {
      limit: 50,
      offset: 0,
      search: query,
      random: !query, // Randomize only when not searching
    },
    {
      enabled: true,
    }
  );

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    setIsSearching(!!searchQuery);
  };

  const renderHeader = () => {
    if (!isSearching && !query) {
      return (
        <Text style={styles.headerTitle}>All Anime</Text>
      );
    }
    return null;
  };

  return (
    <View style={[styles.container]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.dark.primary} />
          <Text style={styles.loadingText}>Loading anime...</Text>
        </View>
      ) : (
        <FlatList
          data={data?.anime || []}
          renderItem={({ item }) => (
            <View style={styles.animeCardContainer}>
              <AnimeCard 
                anime={{
                  id: item.aid.toString(),
                  title: item.name,
                  coverImage: item.posters?.[0] || item.poster.split(", ")[0],
                  bannerImage: item.banners?.[0] || item.banner.split(", ")[0],
                  description: item.synopsis,
                  genres: item.genres || item.genre.split(", "),
                  rating: item.imdb_rating,
                  episodes: item.total_episodes,
                  status: item.status,
                  studio: item.studio
                }} 
                size="medium" 
              />
            </View>
          )}
          keyExtractor={(item) => item.aid.toString()}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.animeGrid}
          ListHeaderComponent={renderHeader}
          onRefresh={refetch}
          refreshing={isLoading}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  headerTitle: {
    color: Colors.dark.text,
    fontSize: 24,
    fontWeight: 'bold',
    marginHorizontal: Layout.spacing.md,
    marginTop: Layout.spacing.md,
    marginBottom: Layout.spacing.sm,
  },
  animeGrid: {
    paddingHorizontal: Layout.spacing.sm,
    paddingBottom: Layout.spacing.lg,
  },
  animeCardContainer: {
    width: '50%',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.dark.text,
    marginTop: 16,
    fontSize: 16,
  },
});