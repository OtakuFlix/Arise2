import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Platform, useWindowDimensions, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, ChevronRight, Settings, Volume2, VolumeX } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Layout from '@/constants/layout';
import { trpc } from '@/lib/trpc';
import { Episode, videoProviders } from '@/types/anime';

export default function PlayerScreen() {
  const { animeId, episodeId } = useLocalSearchParams<{ animeId: string; episodeId: string }>();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [nextEpisode, setNextEpisode] = useState<Episode | null>(null);
  const [prevEpisode, setPrevEpisode] = useState<Episode | null>(null);

  // Get anime details
  const { data: anime, isLoading: isLoadingAnime } = 
    trpc.anime.getAnimeById.useQuery({ id: animeId }, { enabled: !!animeId });

  // Get episodes
  const { data: episodes, isLoading: isLoadingEpisodes } = 
    trpc.anime.getEpisodes.useQuery(
      { 
        animeId,
        animeName: anime?.name || "",
        providers: anime?.providers || [],
        providerIds: anime?.providerIds || []
      },
      { enabled: !!anime }
    );

  useEffect(() => {
    if (episodes) {
      const currentIndex = episodes.findIndex(ep => ep.id === episodeId);
      setCurrentEpisode(episodes[currentIndex] || null);
      setNextEpisode(episodes[currentIndex + 1] || null);
      setPrevEpisode(episodes[currentIndex - 1] || null);
    }
  }, [episodes, episodeId]);

  const handleNext = () => {
    if (nextEpisode) {
      router.replace(`/player/${animeId}/${nextEpisode.id}`);
    }
  };

  const handlePrev = () => {
    if (prevEpisode) {
      router.replace(`/player/${animeId}/${prevEpisode.id}`);
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (!currentEpisode || isLoadingAnime || isLoadingEpisodes) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Get video provider
  const provider = videoProviders[currentEpisode.provider];
  if (!provider) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Video provider not supported</Text>
      </View>
    );
  }

  const embedUrl = provider.buildEmbedUrl(currentEpisode.file_code);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.playerContainer, { height: Platform.OS === 'web' ? height : width * 0.5625 }]}>
        {/* Video Player */}
        <View style={styles.videoWrapper}>
          {Platform.OS === 'web' ? (
            <iframe
              src={embedUrl}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
              }}
              allowFullScreen
            />
          ) : (
            <WebView
              source={{ uri: embedUrl }}
              style={styles.webview}
              allowsFullscreenVideo
            />
          )}

          {/* Player Controls Overlay */}
          <Pressable 
            style={[styles.controlsOverlay, !showControls && styles.controlsHidden]}
            onPress={() => setShowControls(!showControls)}
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.7)', 'transparent', 'transparent', 'rgba(0,0,0,0.7)']}
              style={StyleSheet.absoluteFill}
            />
            
            {/* Top Controls */}
            <View style={styles.topControls}>
              <Pressable style={styles.backButton} onPress={handleBack}>
                <ChevronLeft size={24} color={Colors.dark.text} />
                <Text style={styles.backText}>Back</Text>
              </Pressable>

              <Text style={styles.episodeTitle} numberOfLines={1}>
                {currentEpisode.title}
              </Text>

              <View style={styles.topRightControls}>
                <Pressable 
                  style={styles.controlButton} 
                  onPress={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? (
                    <VolumeX size={20} color={Colors.dark.text} />
                  ) : (
                    <Volume2 size={20} color={Colors.dark.text} />
                  )}
                </Pressable>
                <Pressable style={styles.controlButton}>
                  <Settings size={20} color={Colors.dark.text} />
                </Pressable>
              </View>
            </View>

            {/* Side Controls */}
            <View style={styles.sideControls}>
              {prevEpisode && (
                <Pressable style={styles.sideButton} onPress={handlePrev}>
                  <ChevronLeft size={24} color={Colors.dark.text} />
                  <Text style={styles.sideButtonText}>Previous</Text>
                </Pressable>
              )}
              {nextEpisode && (
                <Pressable style={styles.sideButton} onPress={handleNext}>
                  <Text style={styles.sideButtonText}>Next</Text>
                  <ChevronRight size={24} color={Colors.dark.text} />
                </Pressable>
              )}
            </View>
          </Pressable>
        </View>

        {/* Episode List */}
        <ScrollView style={styles.episodeList}>
          <View style={styles.episodeListHeader}>
            <Text style={styles.episodeListTitle}>Episodes</Text>
            <Text style={styles.episodeCount}>{episodes?.length || 0} Episodes</Text>
          </View>

          <View style={styles.episodeGrid}>
            {episodes?.map((episode) => (
              <Pressable
                key={episode.id}
                style={[
                  styles.episodeItem,
                  episode.id === currentEpisode.id && styles.episodeItemActive
                ]}
                onPress={() => router.replace(`/player/${animeId}/${episode.id}`)}
              >
                <Text style={[
                  styles.episodeNumber,
                  episode.id === currentEpisode.id && styles.episodeNumberActive
                ]}>
                  {episode.number}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

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
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark.background,
  },
  errorText: {
    color: Colors.dark.text,
    fontSize: 16,
  },
  playerContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  videoWrapper: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
  },
  webview: {
    flex: 1,
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: Layout.spacing.md,
  },
  controlsHidden: {
    opacity: 0,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.sm,
  },
  backText: {
    color: Colors.dark.text,
    marginLeft: Layout.spacing.xs,
    fontSize: 16,
  },
  episodeTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: Layout.spacing.md,
  },
  topRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    padding: Layout.spacing.sm,
    marginLeft: Layout.spacing.sm,
  },
  sideControls: {
    position: 'absolute',
    top: '50%',
    left: Layout.spacing.md,
    right: Layout.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    transform: [{ translateY: -20 }],
  },
  sideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: Layout.spacing.sm,
    borderRadius: Layout.borderRadius.sm,
  },
  sideButtonText: {
    color: Colors.dark.text,
    marginHorizontal: Layout.spacing.xs,
  },
  episodeList: {
    width: 300,
    backgroundColor: Colors.dark.card,
    borderLeftWidth: 1,
    borderLeftColor: Colors.dark.border,
  },
  episodeListHeader: {
    padding: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  episodeListTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Layout.spacing.xs,
  },
  episodeCount: {
    color: Colors.dark.subtext,
    fontSize: 14,
  },
  episodeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Layout.spacing.sm,
    gap: Layout.spacing.sm,
  },
  episodeItem: {
    width: 50,
    height: 50,
    backgroundColor: Colors.dark.background,
    borderRadius: Layout.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  episodeItemActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  episodeNumber: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '600',
  },
  episodeNumberActive: {
    color: Colors.dark.text,
    fontWeight: '700',
  },
});