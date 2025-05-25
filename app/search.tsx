import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, Text, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, Dimensions, Animated, useWindowDimensions } from 'react-native';

import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search as SearchIcon, ArrowLeft } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Layout from '@/constants/layout';
import AnimeCard from '@/components/AnimeCard';
import SearchBar from '@/components/SearchBar';
import Header from '@/components/Header';
import { trpc } from '@/lib/trpc';
import { LocalAnime } from '@/types/anime';
import { LinearGradient } from 'expo-linear-gradient';

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string }>();
  const [query, setQuery] = useState(params.q || '');
  const [searchResults, setSearchResults] = useState<LocalAnime[]>([]);
  const [offset, setOffset] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 20;
  const { width: windowWidth } = useWindowDimensions();
  
  // Calculate number of columns based on screen width
  const getColumnsCount = () => {
    const cardWidth = 160; // Base card width
    const minSpacing = 16; // Minimum spacing between cards
    const containerPadding = 16; // Horizontal padding of the container
    
    // Calculate how many cards can fit in the screen width
    const availableWidth = windowWidth - (containerPadding * 2);
    const columns = Math.floor(availableWidth / (cardWidth + minSpacing));
    
    // Ensure at least 1 column
    return Math.max(1, columns);
  };
  
  const columns = getColumnsCount();
  const cardMargin = 8; // Margin around each card
  
  // Use tRPC to search anime with regular query instead of infinite query
  const { data, isLoading, refetch, isFetching } = trpc.anime.getAllAnime.useQuery(
    {
      search: query,
      limit: LIMIT,
      offset: offset,
      random: !query, // Randomize only when not searching
    },
    {
      enabled: true, // Always enabled to show random anime initially
    }
  );

  useEffect(() => {
    if (params.q) {
      setQuery(params.q);
    }
  }, [params.q]);

  useEffect(() => {
    if (data) {
      // Convert API anime to our local format
      const results = data.anime.map((anime: any) => ({
        id: anime.aid.toString(),
        title: anime.name,
        coverImage: anime.posters?.[0] || anime.poster.split(", ")[0],
        bannerImage: anime.banners?.[0] || anime.banner.split(", ")[0],
        description: anime.synopsis,
        genres: anime.genres || anime.genre.split(", "),
        rating: anime.imdb_rating,
        episodes: anime.total_episodes,
        status: anime.status,
        studio: anime.studio
      }));
      
      setSearchResults(results);
      setHasMore(data.hasMore);
    }
  }, [data]);

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    setOffset(0);
    setSearchResults([]);
    refetch();
  };

  const handleLoadMore = useCallback(() => {
    if (hasMore && !isFetching) {
      setOffset(prev => prev + LIMIT);
      refetch();
    }
  }, [hasMore, isFetching, refetch]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setOffset(0);
    setSearchResults([]);
    refetch().finally(() => setRefreshing(false));
  }, [refetch]);

  const goBack = () => {
    router.back();
  };

  const LoadingSkeleton = () => {
    const { width, height } = Dimensions.get('window');
    const isLandscape = width > height;
    const skeletonCount = isLandscape ? 5 : 6; // 5 placeholders in landscape, 6 in portrait
    const cardHeight = 240; // Match AnimeCard medium size
    const skeletonCardWidth = (width - (columns * cardMargin * 2) - 32) / columns; // Calculate width based on columns
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      const shimmer = Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      shimmer.start();
      return () => shimmer.stop();
    }, [shimmerAnim]);

    const shimmerStyle = {
      transform: [
        {
          translateX: shimmerAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [-100, 100],
          }),
        },
      ],
    };
    
    return (
      <FlatList
        data={Array(skeletonCount).fill(0)}
        numColumns={columns}
        contentContainerStyle={styles.skeletonList}
        columnWrapperStyle={[styles.skeletonColumnWrapper, { marginBottom: cardMargin * 2 }]}
        key={`skeleton-${columns}-${skeletonCount}`} // Include columns and count in key to force re-render
        renderItem={() => (
          <View style={[styles.skeletonContainer, { width: skeletonCardWidth, margin: cardMargin }]}>
            <View style={[styles.skeletonCard, { height: cardHeight }]}>
              <View style={styles.skeletonThumbnail}>
                <Animated.View
                  style={[
                    styles.shimmer,
                    shimmerStyle,
                  ]}
                />
              </View>
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.skeletonGradient}
              />
              <View style={styles.skeletonContent}>
                <View style={styles.skeletonTitle}>
                  <Animated.View
                    style={[
                      styles.shimmer,
                      shimmerStyle,
                    ]}
                  />
                </View>
                <View style={styles.skeletonRating}>
                  <Animated.View
                    style={[
                      styles.shimmer,
                      shimmerStyle,
                    ]}
                  />
                </View>
              </View>
            </View>
          </View>
        )}
      />
    );
  };

  const EmptyResults = () => (
    <View style={styles.emptyContainer}>
      <SearchIcon size={64} color={Colors.dark.subtext} />
      <Text style={styles.emptyTitle}>No results found</Text>
      <Text style={styles.emptySubtitle}>
        Try searching for a different anime title
      </Text>
    </View>
  );

  const ListFooter = () => {
    if (isFetching && offset > 0) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="large" color={Colors.dark.primary} />
        </View>
      );
    }
    
    if (!hasMore && searchResults.length > 0) {
      return (
        <View style={styles.endOfResults}>
          <Text style={styles.endOfResultsText}>End of results</Text>
        </View>
      );
    }
    
    return null;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header title="Search" showSearch={true} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <View style={styles.searchBarContainer}>
          <SearchBar 
            initialQuery={query} 
            onSearch={handleSearch} 
            isLoading={isLoading && !isFetching}
            autoFocus={true}
          />
        </View>
      </View>
      
      {query ? (
        <Text style={styles.resultsTitle}>
          {isLoading && !isFetching ? 'Searching...' : `${searchResults.length} results for "${query}"`}
        </Text>
      ) : (
        <Text style={styles.resultsTitle}>Discover Anime</Text>
      )}
      
      {isLoading && offset === 0 ? (
        <LoadingSkeleton />
      ) : searchResults.length === 0 ? (
        <EmptyResults />
      ) : (
        <FlatList
          data={searchResults}
          renderItem={({ item }) => (
            <View style={[styles.animeCardContainer, { 
              width: `${100 / columns}%`,
              padding: cardMargin
            }]}>
              <AnimeCard anime={item} size="medium" />
            </View>
          )}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          numColumns={columns}
          columnWrapperStyle={columns > 1 && styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.animeGrid}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[Colors.dark.primary]}
              tintColor={Colors.dark.primary}
            />
          }
          ListFooterComponent={<ListFooter />}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.md,
    paddingBottom: Layout.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  backButton: {
    padding: Layout.spacing.sm,
    marginRight: Layout.spacing.xs,
  },
  searchBarContainer: {
    flex: 1,
  },
  resultsTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: Layout.spacing.md,
    marginVertical: Layout.spacing.md,
  },
  animeGrid: {
    paddingHorizontal: 8,
    paddingBottom: Layout.spacing.lg,
  },
  columnWrapper: {
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
  },
  animeCardContainer: {
    alignItems: 'center',
  },
  skeletonList: {
    alignSelf: 'flex-start',
    width: '100%',
  },
  skeletonContainer: {
    marginBottom: 16,
  },
  skeletonColumnWrapper: {
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
  },
  skeletonCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: Layout.borderRadius.md,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  skeletonThumbnail: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#2a2a2a',
  },
  skeletonGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  skeletonContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Layout.spacing.sm,
  },
  skeletonTitle: {
    height: 16,
    width: '80%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  skeletonRating: {
    height: 14,
    width: '40%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.spacing.xl,
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
  footerLoader: {
    paddingVertical: Layout.spacing.lg,
    alignItems: 'center',
  },
  endOfResults: {
    paddingVertical: Layout.spacing.lg,
    alignItems: 'center',
  },
  endOfResultsText: {
    color: Colors.dark.subtext,
    fontSize: 14,
  },
});