import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, StatusBar, Platform, ActivityIndicator, TouchableOpacity, ScrollView, Dimensions, TextInput } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { ArrowLeft, Info, ChevronLeft, ChevronRight, List, X, Volume2, VolumeX, Search, MessageSquare, Grid, Rows, LayoutList } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Colors from '@/constants/colors';
import Layout from '@/constants/layout';
import { trpc, trpcClient } from '@/lib/trpc';
import { Episode, videoProviders, ServerInfo } from '@/types/anime';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Layout types for episode display
type EpisodeLayout = 'grid' | 'tile' | 'list';

export default function PlayerScreen() {
  const { animeId, episodeId } = useLocalSearchParams<{ animeId: string; episodeId: string }>();
  const router = useRouter();
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(0);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(true);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [filteredEpisodes, setFilteredEpisodes] = useState<Episode[]>([]);
  const [episodeError, setEpisodeError] = useState<string | null>(null);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [showEpisodeList, setShowEpisodeList] = useState(false);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [episodeLayout, setEpisodeLayout] = useState<EpisodeLayout>('grid');
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const episodeListRef = useRef<ScrollView>(null);
  
  // Fetch anime details
  const { data: anime, isLoading: isLoadingAnime, error: animeError } = 
    trpc.anime.getAnimeById.useQuery({ id: animeId }, { enabled: !!animeId });
  
  // Load saved layout preference
  useEffect(() => {
    const loadLayoutPreference = async () => {
      try {
        const savedLayout = await AsyncStorage.getItem('episodeLayout');
        if (savedLayout) {
          setEpisodeLayout(savedLayout as EpisodeLayout);
        }
      } catch (error) {
        console.error('Error loading layout preference:', error);
      }
    };
    
    loadLayoutPreference();
  }, []);
  
  // Save layout preference when it changes
  useEffect(() => {
    const saveLayoutPreference = async () => {
      try {
        await AsyncStorage.setItem('episodeLayout', episodeLayout);
      } catch (error) {
        console.error('Error saving layout preference:', error);
      }
    };
    
    saveLayoutPreference();
  }, [episodeLayout]);
  
  // Fetch episodes separately to handle errors better
  useEffect(() => {
    const fetchEpisodes = async () => {
      if (!anime) return;
      
      setIsLoadingEpisodes(true);
      setEpisodeError(null);
      
      try {
        console.log(`🔍 Fetching episodes for anime ${animeId} with providers:`, anime.providers);
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
          animeId,
          animeName: anime.name,
          providers: anime.providers,
          providerIds: anime.providerIds
        });
        
        console.log(`✅ Found ${result.length} episodes:`, result);
        setEpisodes(result);
        setFilteredEpisodes(result);
        
        // Find the current episode
        const index = result.findIndex((ep: Episode) => ep.id === episodeId);
        if (index !== -1) {
          setCurrentEpisodeIndex(index);
          setCurrentEpisode(result[index]);
          
          // Set the default server to the first available one
          if (result[index].servers && result[index].servers.length > 0) {
            setSelectedServer(result[index].servers[0].provider);
          } else if (result[index].provider) {
            setSelectedServer(result[index].provider);
          }
          
          // Scroll to the current episode when the episode list is shown
          setTimeout(() => {
            if (episodeListRef.current && index > 0) {
              episodeListRef.current.scrollTo({
                y: index * 70, // Approximate height of each episode item
                animated: false
              });
            }
          }, 100);
        } else {
          setEpisodeError("Episode not found");
        }
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
  }, [anime, animeId, episodeId]);

  // Filter episodes based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredEpisodes(episodes);
      return;
    }
    
    const query = searchQuery.toLowerCase().trim();
    const filtered = episodes.filter(episode => 
      episode.number.toString().includes(query) || 
      episode.title.toLowerCase().includes(query)
    );
    
    setFilteredEpisodes(filtered);
  }, [searchQuery, episodes]);

  const goBack = () => {
    router.back();
  };

  const navigateToEpisode = (index: number) => {
    if (index >= 0 && index < episodes.length) {
      if (Platform.OS !== 'web') {
        Haptics.selectionAsync();
      }
      router.replace(`/player/${animeId}/${episodes[index].id}`);
    }
  };

  const toggleEpisodeList = () => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setShowEpisodeList(!showEpisodeList);
    setSearchQuery(''); // Clear search when toggling
  };

  const toggleComments = () => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setShowComments(!showComments);
  };

  const handleServerChange = (provider: string) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setSelectedServer(provider);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const changeEpisodeLayout = (layout: EpisodeLayout) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setEpisodeLayout(layout);
  };

  // Auto-hide controls after a delay
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    
    if (isControlsVisible) {
      // Clear any existing timeout
      if (controlsTimeoutRef.current !== null) {
        clearTimeout(controlsTimeoutRef.current as unknown as number);
      }
      
      // Set new timeout
      timeoutId = setTimeout(() => {
        setIsControlsVisible(false);
      }, 5000);
      
      // Store the timeout ID
      controlsTimeoutRef.current = timeoutId;
    }
    
    // Cleanup function
    return () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId as unknown as number);
      }
    };
  }, [isControlsVisible]);

  const showControls = () => {
    setIsControlsVisible(true);
  };

  if (isLoadingAnime || isLoadingEpisodes) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
        <Text style={styles.loadingText}>Loading player...</Text>
      </View>
    );
  }

  if (animeError || !anime) {
    return (
      <View style={styles.notFound}>
        <Info size={64} color={Colors.dark.subtext} />
        <Text style={styles.notFoundText}>
          {animeError ? animeError.message : "Anime not found"}
        </Text>
      </View>
    );
  }

  if (episodeError || !currentEpisode) {
    return (
      <View style={styles.notFound}>
        <Info size={64} color={Colors.dark.subtext} />
        <Text style={styles.notFoundText}>
          {episodeError || "Episode not found"}
        </Text>
      </View>
    );
  }

  // Get the embed URL based on the selected server
  const getEmbedUrl = () => {
    if (!currentEpisode) {
      return null;
    }
    
    // If the episode has servers array, use that
    if (currentEpisode.servers && currentEpisode.servers.length > 0) {
      // Find the selected server or use the first one
      const server = currentEpisode.servers.find(s => s.provider === selectedServer) || 
                     currentEpisode.servers[0];
      
      if (server && videoProviders[server.provider]) {
        const embedUrl = videoProviders[server.provider].buildEmbedUrl(server.file_code);
        console.log(`🎬 Using embed URL for ${server.provider}:`, embedUrl);
        return embedUrl;
      }
    } 
    // Otherwise use the direct provider and file_code
    else if (currentEpisode.provider && currentEpisode.file_code) {
      if (videoProviders[currentEpisode.provider]) {
        const embedUrl = videoProviders[currentEpisode.provider].buildEmbedUrl(currentEpisode.file_code);
        console.log(`🎬 Using embed URL for ${currentEpisode.provider}:`, embedUrl);
        return embedUrl;
      }
    }
    
    return null;
  };

  const embedUrl = getEmbedUrl();
  
  // Get the next episode
  const nextEpisode = currentEpisodeIndex < episodes.length - 1 ? episodes[currentEpisodeIndex + 1] : null;

  // Get available servers for the current episode
  const availableServers = currentEpisode.servers || 
    (currentEpisode.provider ? [{ provider: currentEpisode.provider, file_code: currentEpisode.file_code }] : []);

  // Determine if we should use grid layout for episodes
  const useGridLayout = episodes.length > 25;

  // Disqus configuration
  const disqusConfig = {
    url: `https://otakuflix.app/anime/${animeId}/episode/${currentEpisode.number}`,
    identifier: `anime-${animeId}-episode-${currentEpisode.number}`,
    title: `${anime.name} - Episode ${currentEpisode.number}: ${currentEpisode.title}`
  };

  return (
    <>
      <StatusBar hidden />
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <TouchableOpacity 
          style={styles.videoContainer} 
          activeOpacity={1}
          onPress={showControls}
        >
          {Platform.OS === 'web' && embedUrl ? (
            <iframe
              src={`${embedUrl}${embedUrl.includes('?') ? '&' : '?'}${isMuted ? 'mute=1' : ''}`}
              style={{ width: '100%', height: '100%', border: 'none' }}
              allowFullScreen
            />
          ) : embedUrl ? (
            <WebView
              source={{ uri: embedUrl }}
              style={styles.webview}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              allowsFullscreenVideo={true}
            />
          ) : (
            <View style={styles.errorContainer}>
              <Info size={64} color={Colors.dark.subtext} />
              <Text style={styles.errorText}>Video player not available</Text>
            </View>
          )}
          
          {isControlsVisible && (
            <View style={styles.controlsOverlay}>
              <TouchableOpacity style={styles.backButton} onPress={goBack}>
                <ArrowLeft size={24} color={Colors.dark.text} />
              </TouchableOpacity>
              
              <View style={styles.topControls}>
                <Text style={styles.episodeTitle}>
                  {anime.name} - Episode {currentEpisode.number}
                </Text>
                
                {Platform.OS === 'web' && (
                  <TouchableOpacity style={styles.muteButton} onPress={toggleMute}>
                    {isMuted ? (
                      <VolumeX size={20} color={Colors.dark.text} />
                    ) : (
                      <Volume2 size={20} color={Colors.dark.text} />
                    )}
                  </TouchableOpacity>
                )}
              </View>
              
              {availableServers.length > 1 && (
                <View style={styles.serverTabs}>
                  {availableServers.map((server: ServerInfo, index: number) => (
                    <TouchableOpacity
                      key={`${server.provider}-${server.file_code}-${index}`}
                      style={[
                        styles.serverTab,
                        selectedServer === server.provider && styles.activeServerTab,
                        server.provider === "RpmShare" ? styles.rpmShareTab : styles.filemoonTab
                      ]}
                      onPress={() => handleServerChange(server.provider)}
                    >
                      <Text
                        style={[
                          styles.serverTabText,
                          selectedServer === server.provider && styles.activeServerTabText
                        ]}
                      >
                        {server.provider}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              
              <View style={styles.navigationControls}>
                <TouchableOpacity
                  style={[styles.navButton, currentEpisodeIndex === 0 && styles.disabledNavButton]}
                  onPress={() => navigateToEpisode(currentEpisodeIndex - 1)}
                  disabled={currentEpisodeIndex === 0}
                >
                  <ChevronLeft size={24} color={Colors.dark.text} />
                  <Text style={styles.navButtonText}>Previous</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.episodeListButton}
                  onPress={toggleEpisodeList}
                >
                  <List size={20} color={Colors.dark.text} />
                  <Text style={styles.episodeListButtonText}>Episodes</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.navButton, 
                    currentEpisodeIndex === episodes.length - 1 && styles.disabledNavButton
                  ]}
                  onPress={() => navigateToEpisode(currentEpisodeIndex + 1)}
                  disabled={currentEpisodeIndex === episodes.length - 1}
                >
                  <Text style={styles.navButtonText}>Next</Text>
                  <ChevronRight size={24} color={Colors.dark.text} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </TouchableOpacity>

        <ScrollView style={styles.infoContainer}>
          <Text style={styles.title}>{currentEpisode.title}</Text>
          <Text style={styles.episodeInfo}>
            Episode {currentEpisode.number} • {currentEpisode.duration || 24} min • {anime.name}
          </Text>
          
          {currentEpisode.synopsis && (
            <Text style={styles.synopsis}>
              {currentEpisode.synopsis}
            </Text>
          )}
          
          {availableServers.length > 1 && (
            <View style={styles.serverSwitcher}>
              <Text style={styles.serverSwitcherTitle}>Available Servers:</Text>
              <View style={styles.serverButtons}>
                {availableServers.map((server: ServerInfo, index: number) => (
                  <TouchableOpacity
                    key={`${server.provider}-${server.file_code}-${index}`}
                    style={[
                      styles.serverButton,
                      selectedServer === server.provider && styles.activeServerButton,
                      server.provider === "RpmShare" ? styles.rpmShareButton : styles.filemoonButton
                    ]}
                    onPress={() => handleServerChange(server.provider)}
                  >
                    <Text
                      style={[
                        styles.serverButtonText,
                        selectedServer === server.provider && styles.activeServerButtonText
                      ]}
                    >
                      {server.provider}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          
          {nextEpisode && (
            <View style={styles.upNextContainer}>
              <Text style={styles.upNextTitle}>Up Next</Text>
              <TouchableOpacity 
                style={styles.upNextCard}
                onPress={() => navigateToEpisode(currentEpisodeIndex + 1)}
              >
                <View style={styles.upNextThumbnailContainer}>
                  <Image
                    source={{ uri: nextEpisode.thumbnail || anime.posters?.[0] || anime.poster.split(", ")[0] }}
                    style={styles.upNextThumbnail}
                    contentFit="cover"
                  />
                  <View style={styles.upNextPlayButton}>
                    <ChevronRight size={20} color={Colors.dark.text} />
                  </View>
                </View>
                <View style={styles.upNextInfo}>
                  <Text style={styles.upNextEpisodeNumber}>Episode {nextEpisode.number}</Text>
                  <Text style={styles.upNextEpisodeTitle} numberOfLines={2}>{nextEpisode.title}</Text>
                  
                  {nextEpisode.synopsis && (
                    <Text style={styles.upNextSynopsis} numberOfLines={3}>
                      {nextEpisode.synopsis}
                    </Text>
                  )}
                  
                  <Text style={styles.upNextDuration}>{nextEpisode.duration || 24} min</Text>
                  
                  {nextEpisode.servers && nextEpisode.servers.length > 0 && (
                    <View style={styles.upNextServers}>
                      {nextEpisode.servers.map((server: ServerInfo, index: number) => (
                        <View 
                          key={`${server.provider}-${server.file_code}-${index}`}
                          style={[
                            styles.upNextServerTag,
                            server.provider === "RpmShare" ? styles.rpmShareTag : styles.filemoonTag
                          ]}
                        >
                          <Text style={styles.upNextServerTagText}>{server.provider}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          )}
          
          <View style={styles.episodeListContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.episodeListTitle}>All Episodes</Text>
              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={toggleEpisodeList}
              >
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.episodeGrid}>
              {episodes.slice(0, 12).map((episode: Episode, index: number) => (
                <TouchableOpacity
                  key={episode.id}
                  style={[
                    styles.episodeGridItem,
                    episode.id === currentEpisode.id && styles.activeEpisodeGridItem,
                  ]}
                  onPress={() => navigateToEpisode(index)}
                >
                  <View style={styles.episodeGridContent}>
                    <Image
                      source={{ uri: episode.thumbnail || anime.posters?.[0] || anime.poster.split(", ")[0] }}
                      style={styles.episodeGridThumbnail}
                      contentFit="cover"
                    />
                    <View style={styles.episodeGridInfo}>
                      <Text
                        style={[
                          styles.episodeGridNumber,
                          episode.id === currentEpisode.id && styles.activeEpisodeText,
                        ]}
                      >
                        {episode.number}
                      </Text>
                      
                      <Text
                        style={[
                          styles.episodeGridTitle,
                          episode.id === currentEpisode.id && styles.activeEpisodeText,
                        ]}
                        numberOfLines={1}
                      >
                        {episode.title}
                      </Text>
                    </View>
                  </View>
                  
                  {episode.servers && episode.servers.length > 1 && (
                    <View style={styles.episodeServerCount}>
                      <Text style={styles.episodeServerCountText}>{episode.servers.length}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
              
              {episodes.length > 12 && (
                <TouchableOpacity
                  style={styles.moreEpisodesButton}
                  onPress={toggleEpisodeList}
                >
                  <Text style={styles.moreEpisodesText}>+{episodes.length - 12}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          {/* Comments Section */}
          <View style={styles.commentsContainer}>
            <TouchableOpacity 
              style={styles.commentsHeader}
              onPress={toggleComments}
            >
              <View style={styles.commentsHeaderLeft}>
                <MessageSquare size={20} color={Colors.dark.text} />
                <Text style={styles.commentsTitle}>Comments</Text>
              </View>
              <Text style={styles.commentsToggle}>
                {showComments ? "Hide" : "Show"}
              </Text>
            </TouchableOpacity>
            
            {showComments && Platform.OS === 'web' && (
              <View style={styles.disqusContainer}>
                <iframe
                  src={`https://disqus.com/embed/comments/?base=default&f=otakuflix&t_i=${disqusConfig.identifier}&t_u=${encodeURIComponent(disqusConfig.url)}&t_d=${encodeURIComponent(disqusConfig.title)}&t_t=${encodeURIComponent(disqusConfig.title)}`}
                  style={{ width: '100%', height: 400, border: 'none' }}
                />
              </View>
            )}
            
            {showComments && Platform.OS !== 'web' && (
              <View style={styles.mobileCommentsPlaceholder}>
                <Text style={styles.mobileCommentsText}>
                  Comments are available on the web version.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
        
        {showEpisodeList && (
          <View style={styles.fullEpisodeListOverlay}>
            <BlurView intensity={80} style={styles.blurBackground} tint="dark">
              <View style={styles.fullEpisodeListContainer}>
                <View style={styles.fullEpisodeListHeader}>
                  <Text style={styles.fullEpisodeListTitle}>All Episodes</Text>
                  <View style={styles.layoutToggleContainer}>
                    <TouchableOpacity 
                      style={[
                        styles.layoutToggleButton, 
                        episodeLayout === 'grid' && styles.activeLayoutToggleButton
                      ]}
                      onPress={() => changeEpisodeLayout('grid')}
                    >
                      <Grid size={20} color={episodeLayout === 'grid' ? Colors.dark.primary : Colors.dark.text} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[
                        styles.layoutToggleButton, 
                        episodeLayout === 'tile' && styles.activeLayoutToggleButton
                      ]}
                      onPress={() => changeEpisodeLayout('tile')}
                    >
                      <Rows size={20} color={episodeLayout === 'tile' ? Colors.dark.primary : Colors.dark.text} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[
                        styles.layoutToggleButton, 
                        episodeLayout === 'list' && styles.activeLayoutToggleButton
                      ]}
                      onPress={() => changeEpisodeLayout('list')}
                    >
                      <LayoutList size={20} color={episodeLayout === 'list' ? Colors.dark.primary : Colors.dark.text} />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity onPress={toggleEpisodeList} style={styles.closeButton}>
                    <X size={24} color={Colors.dark.text} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.searchContainer}>
                  <Search size={20} color={Colors.dark.subtext} style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search episodes..."
                    placeholderTextColor={Colors.dark.subtext}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    returnKeyType="search"
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                      <X size={16} color={Colors.dark.subtext} />
                    </TouchableOpacity>
                  )}
                </View>
                
                {episodeLayout === 'grid' && (
                  <ScrollView style={styles.fullEpisodeListScroll}>
                    <View style={styles.episodeGrid}>
                      {filteredEpisodes.map((episode: Episode, index: number) => {
                        const isActive = episode.id === currentEpisode.id;
                        
                        return (
                          <TouchableOpacity
                            key={episode.id}
                            style={[
                              styles.fullEpisodeGridItem,
                              isActive && styles.activeFullEpisodeGridItem,
                            ]}
                            onPress={() => {
                              navigateToEpisode(episodes.indexOf(episode));
                              setShowEpisodeList(false);
                            }}
                          >
                            <Image
                              source={{ uri: episode.thumbnail || anime.posters?.[0] || anime.poster.split(", ")[0] }}
                              style={styles.fullEpisodeGridThumbnail}
                              contentFit="cover"
                            />
                            <View style={styles.fullEpisodeGridContent}>
                              <Text
                                style={[
                                  styles.fullEpisodeGridNumber,
                                  isActive && styles.activeFullEpisodeGridText,
                                ]}
                              >
                                {episode.number}
                              </Text>
                              
                              <Text
                                style={[
                                  styles.fullEpisodeGridTitle,
                                  isActive && styles.activeFullEpisodeGridText,
                                ]}
                                numberOfLines={1}
                              >
                                {episode.title}
                              </Text>
                              
                              {episode.synopsis && (
                                <Text
                                  style={styles.fullEpisodeGridSynopsis}
                                  numberOfLines={3}
                                >
                                  {episode.synopsis}
                                </Text>
                              )}
                            </View>
                            
                            {episode.servers && episode.servers.length > 1 && (
                              <View style={styles.fullEpisodeGridServerCount}>
                                <Text style={styles.fullEpisodeGridServerCountText}>
                                  {episode.servers.length}
                                </Text>
                              </View>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>
                )}
                
                {episodeLayout === 'tile' && (
                  <ScrollView style={styles.fullEpisodeListScroll}>
                    <View style={styles.episodeTileGrid}>
                      {filteredEpisodes.map((episode: Episode) => {
                        const isActive = episode.id === currentEpisode.id;
                        
                        return (
                          <TouchableOpacity
                            key={episode.id}
                            style={[
                              styles.episodeTileItem,
                              isActive && styles.activeEpisodeTileItem,
                            ]}
                            onPress={() => {
                              navigateToEpisode(episodes.indexOf(episode));
                              setShowEpisodeList(false);
                            }}
                          >
                            <Image
                              source={{ uri: episode.thumbnail || anime.posters?.[0] || anime.poster.split(", ")[0] }}
                              style={styles.episodeTileThumbnail}
                              contentFit="cover"
                            />
                            <View style={styles.episodeTileOverlay}>
                              <Text style={styles.episodeTileNumber}>{episode.number}</Text>
                            </View>
                            <View style={styles.episodeTileContent}>
                              <Text
                                style={[
                                  styles.episodeTileTitle,
                                  isActive && styles.activeEpisodeTileTitle,
                                ]}
                                numberOfLines={2}
                              >
                                {episode.title}
                              </Text>
                              
                              {episode.servers && episode.servers.length > 0 && (
                                <View style={styles.episodeTileServers}>
                                  {episode.servers.map((server: ServerInfo, index: number) => (
                                    <View 
                                      key={`${server.provider}-${server.file_code}-${index}`}
                                      style={[
                                        styles.episodeTileServerTag,
                                        server.provider === "RpmShare" ? styles.rpmShareTag : styles.filemoonTag
                                      ]}
                                    >
                                      <Text style={styles.episodeTileServerText}>{server.provider}</Text>
                                    </View>
                                  ))}
                                </View>
                              )}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>
                )}
                
                {episodeLayout === 'list' && (
                  <ScrollView 
                    ref={episodeListRef}
                    style={styles.fullEpisodeListScroll}
                  >
                    {filteredEpisodes.map((episode: Episode) => {
                      const isActive = episode.id === currentEpisode.id;
                      const episodeIndex = episodes.indexOf(episode);
                      
                      return (
                        <TouchableOpacity
                          key={episode.id}
                          style={[
                            styles.fullEpisodeItem,
                            isActive && styles.activeFullEpisodeItem,
                          ]}
                          onPress={() => {
                            navigateToEpisode(episodeIndex);
                            setShowEpisodeList(false);
                          }}
                        >
                          <View style={styles.fullEpisodeThumbnailContainer}>
                            <Image
                              source={{ uri: episode.thumbnail || anime.posters?.[0] || anime.poster.split(", ")[0] }}
                              style={styles.fullEpisodeThumbnail}
                              contentFit="cover"
                            />
                            <View style={styles.fullEpisodeNumberBadge}>
                              <Text style={styles.fullEpisodeNumberBadgeText}>{episode.number}</Text>
                            </View>
                          </View>
                          
                          <View style={styles.fullEpisodeDetails}>
                            <Text 
                              style={[
                                styles.fullEpisodeTitle,
                                isActive && styles.activeFullEpisodeText,
                              ]}
                              numberOfLines={2}
                            >
                              {episode.title}
                            </Text>
                            
                            {episode.synopsis && (
                              <Text 
                                style={styles.fullEpisodeSynopsis}
                                numberOfLines={2}
                              >
                                {episode.synopsis}
                              </Text>
                            )}
                            
                            <View style={styles.fullEpisodeMetaContainer}>
                              <Text style={styles.fullEpisodeDuration}>
                                {episode.duration || 24} min
                              </Text>
                              {episode.servers && episode.servers.length > 0 && (
                                <View style={styles.fullEpisodeServers}>
                                  {episode.servers.map((server: ServerInfo, index: number) => (
                                    <View 
                                      key={`${server.provider}-${server.file_code}-${index}`}
                                      style={[
                                        styles.fullEpisodeServerTag,
                                        server.provider === "RpmShare" ? styles.rpmShareTag : styles.filemoonTag
                                      ]}
                                    >
                                      <Text style={styles.fullEpisodeServerText}>{server.provider}</Text>
                                    </View>
                                  ))}
                                </View>
                              )}
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              </View>
            </BlurView>
          </View>
        )}
      </View>
    </>
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
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    position: 'relative',
  },
  webview: {
    width: '100%',
    height: '100%',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  errorText: {
    color: Colors.dark.text,
    fontSize: 16,
    marginTop: 16,
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'space-between',
    padding: 16,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 40,
  },
  episodeTitle: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  muteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  serverTabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  serverTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  rpmShareTab: {
    borderColor: Colors.dark.serverTag.rpmshare,
  },
  filemoonTab: {
    borderColor: Colors.dark.serverTag.filemoon,
  },
  activeServerTab: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  serverTabText: {
    color: Colors.dark.text,
    fontWeight: '500',
  },
  activeServerTabText: {
    fontWeight: 'bold',
  },
  navigationControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  disabledNavButton: {
    opacity: 0.5,
  },
  navButtonText: {
    color: Colors.dark.text,
    fontWeight: '500',
    marginHorizontal: 4,
  },
  episodeListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  episodeListButtonText: {
    color: Colors.dark.text,
    fontWeight: '500',
    marginLeft: 8,
  },
  infoContainer: {
    flex: 1,
    padding: Layout.spacing.md,
  },
  title: {
    color: Colors.dark.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: Layout.spacing.xs,
  },
  episodeInfo: {
    color: Colors.dark.subtext,
    fontSize: 14,
    marginBottom: Layout.spacing.md,
  },
  synopsis: {
    color: Colors.dark.text,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Layout.spacing.md,
  },
  serverSwitcher: {
    marginBottom: Layout.spacing.md,
    backgroundColor: Colors.dark.card,
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  serverSwitcherTitle: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Layout.spacing.sm,
  },
  serverButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  serverButton: {
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.borderRadius.sm,
    marginRight: Layout.spacing.sm,
    marginBottom: Layout.spacing.sm,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    backgroundColor: Colors.dark.background,
  },
  rpmShareButton: {
    borderColor: Colors.dark.serverTag.rpmshare,
  },
  filemoonButton: {
    borderColor: Colors.dark.serverTag.filemoon,
  },
  activeServerButton: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  serverButtonText: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '500',
  },
  activeServerButtonText: {
    fontWeight: 'bold',
  },
  upNextContainer: {
    marginTop: Layout.spacing.md,
    marginBottom: Layout.spacing.lg,
  },
  upNextTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Layout.spacing.sm,
  },
  upNextCard: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.card,
    borderRadius: Layout.borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  upNextThumbnailContainer: {
    width: 160,
    height: 90,
    position: 'relative',
  },
  upNextThumbnail: {
    width: '100%',
    height: '100%',
  },
  upNextPlayButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  upNextInfo: {
    flex: 1,
    padding: Layout.spacing.sm,
  },
  upNextEpisodeNumber: {
    color: Colors.dark.primary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  upNextEpisodeTitle: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  upNextSynopsis: {
    color: Colors.dark.subtext,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 4,
  },
  upNextDuration: {
    color: Colors.dark.subtext,
    fontSize: 12,
    marginBottom: 4,
  },
  upNextServers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  upNextServerTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 4,
  },
  upNextServerTagText: {
    color: Colors.dark.text,
    fontSize: 10,
    fontWeight: 'bold',
  },
  rpmShareTag: {
    backgroundColor: Colors.dark.serverTag.rpmshare,
  },
  filemoonTag: {
    backgroundColor: Colors.dark.serverTag.filemoon,
  },
  episodeListContainer: {
    marginTop: Layout.spacing.md,
    marginBottom: Layout.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
  },
  episodeListTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '600',
  },
  viewAllButton: {
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.xs,
  },
  viewAllText: {
    color: Colors.dark.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  episodeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginHorizontal: -4, // Compensate for item margin
  },
  episodeGridItem: {
    width: '23%', // 4 items per row with some spacing
    aspectRatio: 1,
    margin: '1%',
    borderRadius: 8,
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    overflow: 'hidden',
    position: 'relative',
  },
  episodeGridContent: {
    flex: 1,
  },
  episodeGridThumbnail: {
    width: '100%',
    height: '70%',
  },
  episodeGridInfo: {
    padding: 4,
    height: '30%',
    justifyContent: 'center',
  },
  episodeGridNumber: {
    color: Colors.dark.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  episodeGridTitle: {
    color: Colors.dark.subtext,
    fontSize: 10,
  },
  activeEpisodeGridItem: {
    backgroundColor: Colors.dark.episodeActive,
    borderColor: Colors.dark.primary,
  },
  activeEpisodeText: {
    color: Colors.dark.primary,
  },
  episodeServerCount: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.dark.secondary,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  episodeServerCountText: {
    color: Colors.dark.text,
    fontSize: 10,
    fontWeight: 'bold',
  },
  moreEpisodesButton: {
    width: '23%', // 4 items per row with some spacing
    aspectRatio: 1,
    margin: '1%',
    borderRadius: 8,
    backgroundColor: 'rgba(228, 5, 6, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.primary,
  },
  moreEpisodesText: {
    color: Colors.dark.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  commentsContainer: {
    marginTop: Layout.spacing.md,
    marginBottom: Layout.spacing.xl,
    backgroundColor: Colors.dark.card,
    borderRadius: Layout.borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  commentsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentsTitle: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: Layout.spacing.sm,
  },
  commentsToggle: {
    color: Colors.dark.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  disqusContainer: {
    padding: Layout.spacing.md,
    backgroundColor: Colors.dark.background,
  },
  mobileCommentsPlaceholder: {
    padding: Layout.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileCommentsText: {
    color: Colors.dark.subtext,
    fontSize: 14,
    textAlign: 'center',
  },
  fullEpisodeListOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  blurBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullEpisodeListContainer: {
    width: '90%',
    height: '80%',
    backgroundColor: Colors.dark.card,
    borderRadius: Layout.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  fullEpisodeListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  fullEpisodeListTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  layoutToggleContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.background,
    borderRadius: 20,
    padding: 4,
    marginRight: 8,
  },
  layoutToggleButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  activeLayoutToggleButton: {
    backgroundColor: 'rgba(228, 5, 6, 0.2)',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.background,
    margin: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  searchIcon: {
    marginRight: Layout.spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: Colors.dark.text,
    fontSize: 14,
    height: 40,
    ...Platform.select({
      web: {
        outlineStyle: 'solid',
      },
    }),
  },
  clearButton: {
    padding: Layout.spacing.xs,
  },
  fullEpisodeListScroll: {
    flex: 1,
  },
  fullEpisodeGridItem: {
    width: '48%', // 2 items per row with some spacing
    margin: '1%',
    backgroundColor: Colors.dark.background,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    overflow: 'hidden',
    marginBottom: Layout.spacing.md,
  },
  fullEpisodeGridThumbnail: {
    width: '100%',
    height: 120,
  },
  activeFullEpisodeGridItem: {
    backgroundColor: Colors.dark.episodeActive,
    borderColor: Colors.dark.primary,
  },
  fullEpisodeGridContent: {
    padding: Layout.spacing.sm,
  },
  fullEpisodeGridNumber: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  fullEpisodeGridTitle: {
    color: Colors.dark.text,
    fontSize: 12,
    marginBottom: 4,
  },
  fullEpisodeGridSynopsis: {
    color: Colors.dark.subtext,
    fontSize: 10,
    lineHeight: 14,
  },
  activeFullEpisodeGridText: {
    color: Colors.dark.primary,
    fontWeight: 'bold',
  },
  fullEpisodeGridServerCount: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.dark.secondary,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullEpisodeGridServerCountText: {
    color: Colors.dark.text,
    fontSize: 10,
    fontWeight: 'bold',
  },
  episodeTileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Layout.spacing.sm,
  },
  episodeTileItem: {
    width: '31%', // 3 items per row with spacing
    aspectRatio: 0.75,
    margin: '1%',
    borderRadius: Layout.borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.dark.border,
    backgroundColor: Colors.dark.background,
  },
  activeEpisodeTileItem: {
    borderColor: Colors.dark.primary,
  },
  episodeTileThumbnail: {
    width: '100%',
    height: '70%',
  },
  episodeTileOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '70%',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 8,
  },
  episodeTileNumber: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  episodeTileContent: {
    padding: 8,
    height: '30%',
  },
  episodeTileTitle: {
    color: Colors.dark.text,
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  activeEpisodeTileTitle: {
    color: Colors.dark.primary,
    fontWeight: 'bold',
  },
  episodeTileServers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  episodeTileServerTag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 3,
    marginRight: 3,
    marginBottom: 3,
  },
  episodeTileServerText: {
    color: Colors.dark.text,
    fontSize: 8,
    fontWeight: 'bold',
  },
  fullEpisodeItem: {
    flexDirection: 'row',
    padding: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  activeFullEpisodeItem: {
    backgroundColor: Colors.dark.episodeActive,
  },
  fullEpisodeThumbnailContainer: {
    width: 120,
    height: 68,
    borderRadius: Layout.borderRadius.sm,
    overflow: 'hidden',
    marginRight: Layout.spacing.md,
    position: 'relative',
  },
  fullEpisodeThumbnail: {
    width: '100%',
    height: '100%',
  },
  fullEpisodeNumberBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  fullEpisodeNumberBadgeText: {
    color: Colors.dark.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  fullEpisodeDetails: {
    flex: 1,
  },
  fullEpisodeTitle: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  fullEpisodeSynopsis: {
    color: Colors.dark.subtext,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 4,
  },
  activeFullEpisodeText: {
    color: Colors.dark.primary,
    fontWeight: 'bold',
  },
  fullEpisodeMetaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fullEpisodeDuration: {
    color: Colors.dark.subtext,
    fontSize: 12,
    marginRight: Layout.spacing.sm,
  },
  fullEpisodeServers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  fullEpisodeServerTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
  },
  fullEpisodeServerText: {
    color: Colors.dark.text,
    fontSize: 10,
    fontWeight: 'bold',
  },
});