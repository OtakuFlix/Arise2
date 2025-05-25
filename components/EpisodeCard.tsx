import React from 'react';
import { StyleSheet, View, Text, Pressable, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Play, Clock } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Layout from '@/constants/layout';
import { Episode, ServerInfo } from '@/types/anime';

interface EpisodeCardProps {
  episode: Episode;
  animeId: string;
  isActive?: boolean;
  layout?: 'grid' | 'tile' | 'list';
}

export default function EpisodeCard({ 
  episode, 
  animeId, 
  isActive = false, 
  layout = 'list' 
}: EpisodeCardProps) {
  // Use the thumbnail from the API if available
  const thumbnailUrl = episode.thumbnail && episode.thumbnail.trim() !== "" 
    ? episode.thumbnail 
    : "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=500";

  // Use a wrapper component to avoid transform styles on Link/a tags
  const CardWrapper = ({ children }: { children: React.ReactNode }) => (
    <View style={[
      styles.container,
      isActive && styles.activeContainer,
      layout === 'grid' && styles.gridContainer,
      layout === 'tile' && styles.tileContainer
    ]}>
      {children}
    </View>
  );

  // Grid layout
  if (layout === 'grid') {
    return (
      <Link href={`/player/${animeId}/${episode.id}`} asChild>
        <Pressable>
          <CardWrapper>
            <View style={styles.gridThumbnailContainer}>
              <Image
                source={{ uri: thumbnailUrl }}
                style={styles.gridThumbnail}
                contentFit="cover"
              />
              <View style={styles.gridPlayButton}>
                <Play size={16} color={Colors.dark.text} fill={Colors.dark.text} />
              </View>
              <View style={styles.gridNumberBadge}>
                <Text style={styles.gridNumberText}>{episode.number}</Text>
              </View>
            </View>
            <View style={styles.gridContent}>
              <Text style={[styles.gridTitle, isActive && styles.activeTitle]} numberOfLines={1}>
                {episode.title}
              </Text>
              
              {episode.servers && episode.servers.length > 0 && (
                <View style={styles.gridServers}>
                  {episode.servers.map((server: ServerInfo, index: number) => (
                    <View 
                      key={`${server.provider}-${server.file_code}-${index}`}
                      style={[
                        styles.gridProviderTag,
                        server.provider === "RpmShare" ? styles.rpmShareTag : styles.filemoonTag
                      ]}
                    >
                      <Text style={styles.gridProviderText}>{server.provider}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </CardWrapper>
        </Pressable>
      </Link>
    );
  }

  // Tile layout
  if (layout === 'tile') {
    return (
      <Link href={`/player/${animeId}/${episode.id}`} asChild>
        <Pressable>
          <CardWrapper>
            <Image
              source={{ uri: thumbnailUrl }}
              style={styles.tileThumbnail}
              contentFit="cover"
            />
            <View style={styles.tileOverlay}>
              <View style={styles.tilePlayButton}>
                <Play size={24} color={Colors.dark.text} fill={Colors.dark.text} />
              </View>
              <View style={styles.tileNumberBadge}>
                <Text style={styles.tileNumberText}>{episode.number}</Text>
              </View>
            </View>
            <View style={styles.tileContent}>
              <Text style={[styles.tileTitle, isActive && styles.activeTitle]} numberOfLines={2}>
                {episode.title}
              </Text>
              
              {episode.servers && episode.servers.length > 0 && (
                <View style={styles.tileServers}>
                  {episode.servers.map((server: ServerInfo, index: number) => (
                    <View 
                      key={`${server.provider}-${server.file_code}-${index}`}
                      style={[
                        styles.tileProviderTag,
                        server.provider === "RpmShare" ? styles.rpmShareTag : styles.filemoonTag
                      ]}
                    >
                      <Text style={styles.tileProviderText}>{server.provider}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </CardWrapper>
        </Pressable>
      </Link>
    );
  }

  // Default list layout
  return (
    <Link href={`/player/${animeId}/${episode.id}`} asChild>
      <Pressable>
        <CardWrapper>
          <View style={styles.thumbnailContainer}>
            <Image
              source={{ uri: thumbnailUrl }}
              style={styles.thumbnail}
              contentFit="cover"
            />
            <View style={styles.playButton}>
              <Play size={20} color={Colors.dark.text} fill={Colors.dark.text} />
            </View>
            {isActive && (
              <View style={styles.nowPlayingBadge}>
                <Text style={styles.nowPlayingText}>NOW PLAYING</Text>
              </View>
            )}
          </View>
          <View style={styles.content}>
            <View style={styles.episodeNumberContainer}>
              <Text style={styles.episodeNumber}>{episode.number}</Text>
            </View>
            <View style={styles.details}>
              <Text style={[styles.title, isActive && styles.activeTitle]} numberOfLines={2}>
                {episode.title}
              </Text>
              
              {episode.synopsis && (
                <Text style={styles.synopsis} numberOfLines={2}>
                  {episode.synopsis}
                </Text>
              )}
              
              <View style={styles.metaContainer}>
                {episode.duration && (
                  <View style={styles.durationContainer}>
                    <Clock size={12} color={Colors.dark.subtext} />
                    <Text style={styles.duration}>{episode.duration} min</Text>
                  </View>
                )}
                {episode.servers && episode.servers.length > 0 ? (
                  <View style={styles.serversContainer}>
                    {episode.servers.map((server: ServerInfo, index: number) => (
                      <View 
                        key={`${server.provider}-${server.file_code}-${index}`}
                        style={[
                          styles.providerTag,
                          server.provider === "RpmShare" ? styles.rpmShareTag : styles.filemoonTag
                        ]}
                      >
                        <Text style={styles.providerText}>{server.provider}</Text>
                      </View>
                    ))}
                  </View>
                ) : episode.provider ? (
                  <View style={[
                    styles.providerTag,
                    episode.provider === "RpmShare" ? styles.rpmShareTag : styles.filemoonTag
                  ]}>
                    <Text style={styles.providerText}>{episode.provider}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        </CardWrapper>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.card,
    borderRadius: Layout.borderRadius.md,
    marginBottom: Layout.spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  activeContainer: {
    borderColor: Colors.dark.primary,
    backgroundColor: Colors.dark.episodeActive,
  },
  // List layout styles
  thumbnailContainer: {
    width: 140,
    height: 80,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  playButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nowPlayingBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.dark.primary,
    paddingVertical: 2,
    alignItems: 'center',
  },
  nowPlayingText: {
    color: Colors.dark.text,
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    padding: Layout.spacing.sm,
  },
  episodeNumberContainer: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: Colors.dark.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.sm,
  },
  episodeNumber: {
    color: Colors.dark.text,
    fontWeight: 'bold',
    fontSize: 14,
  },
  details: {
    flex: 1,
  },
  title: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: Layout.spacing.xs,
  },
  activeTitle: {
    fontWeight: 'bold',
    color: Colors.dark.primary,
  },
  synopsis: {
    color: Colors.dark.subtext,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: Layout.spacing.xs,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Layout.spacing.sm,
  },
  duration: {
    color: Colors.dark.subtext,
    fontSize: 12,
    marginLeft: 4,
  },
  serversContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  providerTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 4,
  },
  rpmShareTag: {
    backgroundColor: Colors.dark.serverTag.rpmshare,
  },
  filemoonTag: {
    backgroundColor: Colors.dark.serverTag.filemoon,
  },
  providerText: {
    color: Colors.dark.text,
    fontSize: 10,
    fontWeight: 'bold',
  },
  
  // Grid layout styles
  gridContainer: {
    flexDirection: 'column',
    width: '48%', // 2 columns
    marginHorizontal: '1%',
  },
  gridThumbnailContainer: {
    width: '100%',
    aspectRatio: 16/9,
    position: 'relative',
  },
  gridThumbnail: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: Layout.borderRadius.md,
    borderTopRightRadius: Layout.borderRadius.md,
  },
  gridPlayButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridNumberBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  gridNumberText: {
    color: Colors.dark.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  gridContent: {
    padding: Layout.spacing.sm,
  },
  gridTitle: {
    color: Colors.dark.text,
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  gridServers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridProviderTag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 3,
    marginRight: 3,
    marginBottom: 3,
  },
  gridProviderText: {
    color: Colors.dark.text,
    fontSize: 8,
    fontWeight: 'bold',
  },
  
  // Tile layout styles
  tileContainer: {
    flexDirection: 'column',
    width: '31%', // 3 columns
    marginHorizontal: '1%',
    aspectRatio: 0.75,
  },
  tileThumbnail: {
    width: '100%',
    height: '70%',
    borderTopLeftRadius: Layout.borderRadius.md,
    borderTopRightRadius: Layout.borderRadius.md,
  },
  tileOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '70%',
    justifyContent: 'space-between',
  },
  tilePlayButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tileNumberBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tileNumberText: {
    color: Colors.dark.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  tileContent: {
    padding: 8,
    height: '30%',
  },
  tileTitle: {
    color: Colors.dark.text,
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  tileServers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tileProviderTag: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
    marginRight: 2,
    marginBottom: 2,
  },
  tileProviderText: {
    color: Colors.dark.text,
    fontSize: 7,
    fontWeight: 'bold',
  },
});