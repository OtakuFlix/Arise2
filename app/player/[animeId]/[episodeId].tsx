import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Layout from '@/constants/layout';
import { trpc } from '@/lib/trpc';
import { Episode, ServerInfo } from '@/types/anime';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function PlayerScreen() {
  const { animeId, episodeId } = useLocalSearchParams<{ animeId: string; episodeId: string }>();
  const router = useRouter();
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // Fetch anime details
  const { data: anime, isLoading: isLoadingAnime } = 
    trpc.anime.getAnimeById.useQuery({ id: animeId }, { enabled: !!animeId });

  // Fetch episodes
  useEffect(() => {
    if (!anime) return;

    const fetchEpisodes = async () => {
      try {
        const result = await trpc.anime.getEpisodes.query({
          animeId,
          animeName: anime.name,
          providers: anime.providers,
          providerIds: anime.providerIds
        });

        setEpisodes(result);

        // Find current episode
        const index = result.findIndex(ep => ep.id === episodeId);
        if (index !== -1) {
          setCurrentEpisodeIndex(index);
          setCurrentEpisode(result[index]);
          
          // Set default server
          if (result[index].servers?.length > 0) {
            setSelectedServer(result[index].servers[0].provider);
          }
        }
      } catch (error) {
        console.error('Error fetching episodes:', error);
      }
    };

    fetchEpisodes();
  }, [anime, animeId, episodeId]);

  const getEmbedUrl = () => {
    if (!currentEpisode) return null;

    const server = currentEpisode.servers?.find(s => s.provider === selectedServer) || 
                  currentEpisode.servers?.[0];

    if (!server) return null;

    // Remove player controls from URL
    const baseUrl = server.provider === 'Filemoon' 
      ? `https://filemoon.in/e/${server.file_code}?autoplay=1&mute=0`
      : `https://aniflix.rpmvip.com/#${server.file_code}?autoplay=1&mute=0`;

    return baseUrl;
  };

  const navigateToEpisode = (index: number) => {
    if (index >= 0 && index < episodes.length) {
      router.replace(`/player/${animeId}/${episodes[index].id}`);
    }
  };

  if (isLoadingAnime || !currentEpisode) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.content}>
        {/* Video Player */}
        <View style={styles.playerContainer}>
          <View style={styles.videoWrapper}>
            {Platform.OS === 'web' && getEmbedUrl() ? (
              <iframe
                src={getEmbedUrl()}
                style={{ width: '100%', height: '100%', border: 'none' }}
                allowFullScreen
              />
            ) : (
              <View style={styles.placeholderContainer}>
                <Text style={styles.placeholderText}>Video player not available</Text>
              </View>
            )}
          </View>

          {/* Server Selection */}
          {currentEpisode.servers && currentEpisode.servers.length > 0 && (
            <View style={styles.serverContainer}>
              <Text style={styles.serverLabel}>Servers:</Text>
              <View style={styles.serverButtons}>
                {currentEpisode.servers.map((server, index) => (
                  <TouchableOpacity
                    key={`${server.provider}-${index}`}
                    style={[
                      styles.serverButton,
                      selectedServer === server.provider && styles.activeServerButton,
                      server.provider === 'RpmShare' ? styles.rpmShareButton : styles.filemoonButton
                    ]}
                    onPress={() => setSelectedServer(server.provider)}
                  >
                    <Text style={[
                      styles.serverButtonText,
                      selectedServer === server.provider && styles.activeServerButtonText
                    ]}>
                      {server.provider}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Episode List */}
        <View style={styles.episodeListContainer}>
          <Text style={styles.episodeListTitle}>Up Next</Text>
          
          <ScrollView 
            ref={scrollViewRef}
            style={styles.episodeList}
            showsVerticalScrollIndicator={false}
          >
            {episodes.map((episode, index) => (
              <TouchableOpacity
                key={episode.id}
                style={[
                  styles.episodeItem,
                  episode.id === currentEpisode.id && styles.activeEpisodeItem
                ]}
                onPress={() => navigateToEpisode(index)}
              >
                <View style={styles.episodeThumbnailContainer}>
                  <Image
                    source={{ uri: episode.thumbnail || anime.posters?.[0] }}
                    style={styles.episodeThumbnail}
                    contentFit="cover"
                  />
                  {episode.id === currentEpisode.id && (
                    <View style={styles.playingIndicator}>
                      <Play size={16} color={Colors.dark.text} />
                    </View>
                  )}
                </View>

                <View style={styles.episodeInfo}>
                  <Text style={styles.episodeTitle} numberOfLines={2}>
                    {episode.title}
                  </Text>
                  <Text style={styles.episodeNumber}>
                    Episode {episode.number}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Episode Navigation */}
          <View style={styles.navigationContainer}>
            <TouchableOpacity
              style={[styles.navButton, currentEpisodeIndex === 0 && styles.disabledButton]}
              onPress={() => navigateToEpisode(currentEpisodeIndex - 1)}
              disabled={currentEpisodeIndex === 0}
            >
              <ChevronLeft size={20} color={Colors.dark.text} />
              <Text style={styles.navButtonText}>Previous</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navButton, currentEpisodeIndex === episodes.length - 1 && styles.disabledButton]}
              onPress={() => navigateToEpisode(currentEpisodeIndex + 1)}
              disabled={currentEpisodeIndex === episodes.length - 1}
            >
              <Text style={styles.navButtonText}>Next</Text>
              <ChevronRight size={20} color={Colors.dark.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  playerContainer: {
    flex: 1,
    padding: Layout.spacing.md,
  },
  videoWrapper: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    borderRadius: Layout.borderRadius.md,
    overflow: 'hidden',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: Colors.dark.text,
    fontSize: 16,
  },
  serverContainer: {
    marginTop: Layout.spacing.md,
  },
  serverLabel: {
    color: Colors.dark.text,
    fontSize: 14,
    marginBottom: Layout.spacing.sm,
  },
  serverButtons: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
  },
  serverButton: {
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.borderRadius.sm,
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  activeServerButton: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  rpmShareButton: {
    borderColor: Colors.dark.serverTag.rpmshare,
  },
  filemoonButton: {
    borderColor: Colors.dark.serverTag.filemoon,
  },
  serverButtonText: {
    color: Colors.dark.text,
    fontSize: 14,
  },
  activeServerButtonText: {
    fontWeight: 'bold',
  },
  episodeListContainer: {
    width: 320,
    borderLeftWidth: 1,
    borderLeftColor: Colors.dark.border,
    backgroundColor: Colors.dark.card,
  },
  episodeListTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: 'bold',
    padding: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  episodeList: {
    flex: 1,
  },
  episodeItem: {
    flexDirection: 'row',
    padding: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  activeEpisodeItem: {
    backgroundColor: Colors.dark.episodeActive,
  },
  episodeThumbnailContainer: {
    width: 120,
    height: 68,
    borderRadius: Layout.borderRadius.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  episodeThumbnail: {
    width: '100%',
    height: '100%',
  },
  playingIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  episodeInfo: {
    flex: 1,
    marginLeft: Layout.spacing.md,
  },
  episodeTitle: {
    color: Colors.dark.text,
    fontSize: 14,
    marginBottom: 4,
  },
  episodeNumber: {
    color: Colors.dark.subtext,
    fontSize: 12,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Layout.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.background,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  disabledButton: {
    opacity: 0.5,
  },
  navButtonText: {
    color: Colors.dark.text,
    fontSize: 14,
    marginHorizontal: Layout.spacing.xs,
  },
});