import React from 'react';
import { StyleSheet, View, Text, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bookmark } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Header from '@/components/Header';
import Layout from '@/constants/layout';
import { useWatchlistStore } from '@/stores/watchlistStore';
import AnimeCard from '@/components/AnimeCard';

export default function WatchlistScreen() {
  const insets = useSafeAreaInsets();
  const { watchlist } = useWatchlistStore();

  const EmptyWatchlist = () => (
    <View style={styles.emptyContainer}>
      <Bookmark size={64} color={Colors.dark.subtext} />
      <Text style={styles.emptyTitle}>Your watchlist is empty</Text>
      <Text style={styles.emptySubtitle}>
        Add anime to your watchlist to keep track of what you want to watch
      </Text>
    </View>
  );

  return (
    <View style={[styles.container]}>
      <Header title="My Watchlist" showSearch={false} />
      {watchlist.length === 0 ? (
        <EmptyWatchlist />
      ) : (
        <FlatList
          data={watchlist}
          renderItem={({ item }) => (
            <View style={styles.animeCardContainer}>
              <AnimeCard anime={item} size="medium" />
            </View>
          )}
          keyExtractor={(item) => item.id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.animeGrid}
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
  animeGrid: {
    paddingHorizontal: Layout.spacing.sm,
    paddingBottom: Layout.spacing.lg,
  },
  animeCardContainer: {
    width: '50%',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
  },
  emptyTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: Layout.spacing.md,
    marginBottom: Layout.spacing.sm,
  },
  emptySubtitle: {
    color: Colors.dark.subtext,
    fontSize: 14,
    textAlign: 'center',
  },
});