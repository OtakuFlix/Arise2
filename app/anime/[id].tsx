import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, StatusBar, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Star, Play, Bookmark, BookmarkCheck, Info, ArrowLeft, Clock } from 'lucide-react-native';
import Header from '@/components/Header';
import Colors from '@/constants/colors';
import Layout from '@/constants/layout';
import EpisodeCard from '@/components/EpisodeCard';
import { useWatchlistStore } from '@/stores/watchlistStore';
import { trpc } from '@/lib/trpc';
import { Episode, LocalAnime } from '@/types/anime';

export default function AnimeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlistStore();
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(true);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [episodeError, setEpisodeError] = useState<string | null>(null);
  const [currentEpisodeId, setCurrentEpisodeId] = useState<string | null>(null);
  
  // Fetch anime details
  const { data: anime, isLoading: isLoadingAnime, error: animeError } = 
    trpc.anime.getAnimeById.useQuery({ id }, { enabled: !!id });
  
  // Fetch episodes separately to handle errors better
  useEffect(() => {
    const fetchEpisodes = async () => {
      if (!anime) return;
      
      setIsLoadingEpisodes(true);
      setEpisodeError(null);
      
      try {
        console.log(`🔍 Fetching episodes for anime ${id} with providers:`, anime.providers);
        console.log(`🔑 Provider IDs:`, anime.providerIds);
        
        // Log the exact URLs that would be used
        anime.providers.forEach((provider: string, index: number) => {
          const providerId = anime.providerIds[index];
          if (provider === "RpmShare") {
            console.log(`🔗 RPMShare URL: https://rpmshare.com/api/file/list?key=b57f6ad44bf1fb528c57ea90&fld_id=${providerId}`);
          } else if (provider === "Filemoon") {
            console.log(`🔗 Filemoon URL: https://filemoonapi.com/api/file/list?key=42605q5ytvlhmu9eris67&fld_id=${providerId}`);
          }
        });
        
        const result = await trpcClient.anime.getEpisodes.query({ 
          animeId: id,
          providers: anime.providers,
          providerIds: anime.providerIds
        });
        
        console.log(`✅ Fetched ${result.length} episodes:`, result);
        setEpisodes(result);
      } catch (error) {
        console.error('❌ Error fetching episodes:', error);
        setEpisodeError(error instanceof Error ? error.message : 'Failed to load episodes');
      } finally {
        setIsLoadingEpisodes(false);
      }
    };
    
    if (anime) {
      fetchEpisodes();
    }
  }, [anime, id]);

  const goBack = () => {
    router.back();
  };

  if (isLoadingAnime) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
        <Text style={styles.loadingText}>Loading anime details...</Text>
      </View>
    );
  }

  if (animeError || !anime) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <Header title="" showSearch={true} />
        <Info size={64} color={Colors.dark.subtext} />
        <Text style={styles.notFoundText}>
          {animeError ? animeError.message : "Anime not found"}
        </Text>
      </View>
    );
  }

  const inWatchlist = isInWatchlist(anime.aid.toString());

  const toggleWatchlist = () => {
    // Convert the API anime to our local format for watchlist
    const watchlistAnime: LocalAnime = {
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
    };

    if (inWatchlist) {
      removeFromWatchlist(anime.aid.toString());
    } else {
      addToWatchlist(watchlistAnime);
    }
  };

  const handleWatchNow = () => {
    if (episodes && episodes.length > 0) {
      router.push(`/player/${anime.aid}/${episodes[0].id}`);
    }
  };

  // Get the first poster and banner
  const posterImage = anime.posters?.[0] || anime.poster.split(", ")[0];
  const bannerImage = anime.banners?.[0] || anime.banner.split(", ")[0];

  return (
    <>
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />
      <Header title="" showSearch={false} />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.bannerContainer}>
          <Image
            source={{ uri: bannerImage }}
            style={styles.bannerImage}
            contentFit="cover"
          />
          <LinearGradient
            colors={['transparent', Colors.dark.background]}
            style={styles.bannerGradient}
          />
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <ArrowLeft size={24} color={Colors.dark.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.posterContainer}>
              <Image
                source={{ uri: posterImage }}
                style={styles.posterImage}
                contentFit="cover"
              />
            </View>
            <View style={styles.infoContainer}>
              <Text style={styles.title}>{anime.name}</Text>
              <View style={styles.metaContainer}>
                <View style={styles.ratingContainer}>
                  <Star size={16} color={Colors.dark.accent} fill={Colors.dark.accent} />
                  <Text style={styles.rating}>
                    {typeof anime.imdb_rating === 'number' 
                      ? anime.imdb_rating.toFixed(1) 
                      : parseFloat(String(anime.imdb_rating || 0)).toFixed(1)}
                  </Text>
                </View>
                <Text style={styles.meta}>{anime.total_episodes} Episodes</Text>
                <Text style={styles.meta}>{anime.type}</Text>
              </View>
              <View style={styles.genreContainer}>
                {(anime.genres || anime.genre.split(", ")).map((genre: string, index: number) => (
                  <View key={index} style={styles.genreTag}>
                    <Text style={styles.genreText}>{genre}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.watchButton} onPress={handleWatchNow}>
              <Play size={20} color={Colors.dark.text} />
              <Text style={styles.watchButtonText}>Watch Now</Text>
            </Pressable>
            <Pressable 
              style={[
                styles.watchlistButton,
                inWatchlist && styles.watchlistButtonActive
              ]} 
              onPress={toggleWatchlist}
            >
              {inWatchlist ? (
                <BookmarkCheck size={20} color={Colors.dark.text} />
              ) : (
                <Bookmark size={20} color={Colors.dark.text} />
              )}
            </Pressable>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Synopsis</Text>
            <Text style={styles.description}>{anime.synopsis}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Information</Text>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Studio</Text>
                <Text style={styles.infoValue}>{anime.studio || "Unknown"}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Status</Text>
                <Text style={styles.infoValue}>{anime.status || "Unknown"}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Rating</Text>
                <Text style={styles.infoValue}>{anime.pg_rating || "Unknown"}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Type</Text>
                <Text style={styles.infoValue}>{anime.type || "Unknown"}</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Episodes</Text>
            {isLoadingEpisodes ? (
              <View style={styles.episodeLoadingContainer}>
                <ActivityIndicator size="small" color={Colors.dark.primary} />
                <Text style={styles.episodeLoadingText}>Loading episodes...</Text>
              </View>
            ) : episodeError ? (
              <View style={styles.episodeErrorContainer}>
                <Info size={24} color={Colors.dark.subtext} />
                <Text style={styles.episodeErrorText}>{episodeError}</Text>
              </View>
            ) : episodes && episodes.length > 0 ? (
              <View style={styles.episodesContainer}>
                {episodes.map((episode: Episode) => (
                  <EpisodeCard 
                    key={episode.id} 
                    episode={episode}
                    animeId={anime.aid.toString()}
                    isActive={episode.id === currentEpisodeId}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.episodeErrorContainer}>
                <Info size={24} color={Colors.dark.subtext} />
                <Text style={styles.episodeErrorText}>
                  No episodes available
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </>
  );
}

// Import the trpcClient at the top of the file
import { trpcClient } from '@/lib/trpc';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark.background,
  },
  loadingText: {
    color: Colors.dark.text,
    marginTop: 16,
    fontSize: 16,
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark.background,
    padding: 20,
  },
  notFoundText: {
    color: Colors.dark.text,
    fontSize: 18,
    textAlign: 'center',
    marginTop: 16,
  },
  bannerContainer: {
    height: 250,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  content: {
    paddingHorizontal: Layout.spacing.md,
    paddingBottom: Layout.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    marginTop: -50,
    marginBottom: Layout.spacing.md,
  },
  posterContainer: {
    width: 120,
    height: 180,
    borderRadius: Layout.borderRadius.md,
    overflow: 'hidden',
    marginRight: Layout.spacing.md,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderWidth: 2,
    borderColor: Colors.dark.primary,
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  title: {
    color: Colors.dark.text,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: Layout.spacing.xs,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
    flexWrap: 'wrap',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Layout.spacing.md,
    marginBottom: Layout.spacing.xs,
  },
  rating: {
    color: Colors.dark.text,
    fontSize: 14,
    marginLeft: 4,
  },
  meta: {
    color: Colors.dark.subtext,
    fontSize: 14,
    marginRight: Layout.spacing.md,
    marginBottom: Layout.spacing.xs,
  },
  genreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  genreTag: {
    backgroundColor: Colors.dark.card,
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.xs,
    borderRadius: 4,
    marginRight: Layout.spacing.xs,
    marginBottom: Layout.spacing.xs,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  genreText: {
    color: Colors.dark.text,
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    marginVertical: Layout.spacing.md,
  },
  watchButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.primary,
    paddingVertical: Layout.spacing.md,
    borderRadius: Layout.borderRadius.sm,
    marginRight: Layout.spacing.sm,
  },
  watchButtonText: {
    color: Colors.dark.text,
    fontWeight: 'bold',
    marginLeft: Layout.spacing.xs,
  },
  watchlistButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.card,
    borderRadius: Layout.borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  watchlistButtonActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  section: {
    marginBottom: Layout.spacing.lg,
  },
  sectionTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: Layout.spacing.md,
  },
  description: {
    color: Colors.dark.text,
    fontSize: 14,
    lineHeight: 22,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  infoItem: {
    width: '50%',
    marginBottom: Layout.spacing.md,
  },
  infoLabel: {
    color: Colors.dark.subtext,
    fontSize: 14,
    marginBottom: 4,
  },
  infoValue: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '500',
  },
  episodeLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.md,
    backgroundColor: Colors.dark.card,
    borderRadius: Layout.borderRadius.md,
  },
  episodeLoadingText: {
    color: Colors.dark.text,
    marginLeft: Layout.spacing.md,
  },
  episodeErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.md,
    backgroundColor: Colors.dark.card,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  episodeErrorText: {
    color: Colors.dark.subtext,
    marginLeft: Layout.spacing.md,
    flex: 1,
  },
  episodesContainer: {
    marginTop: Layout.spacing.sm,
  },
});