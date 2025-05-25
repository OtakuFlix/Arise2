import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, StatusBar, Platform, ActivityIndicator, TouchableOpacity, ScrollView, Dimensions, TextInput } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { ArrowLeft, Info, ChevronLeft, ChevronRight, List, X, Volume2, VolumeX, Search, MessageSquare, Grid, Rows, LayoutList, Play, Pause, SkipForward, SkipBack, Settings, Maximize, Minimize, Share } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Colors from '@/constants/colors';
import Layout from '@/constants/layout';
import { trpc, trpcClient } from '@/lib/trpc';
import type { Episode, ServerInfo } from '@/types/anime';

// Define a more specific type for the episode with servers
interface EpisodeWithServers extends Omit<Episode, 'servers'> {
  servers?: Array<{
    provider: string;
    file_code: string;
  }>;
}
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Layout types for episode display
type EpisodeLayout = 'grid' | 'tile' | 'list';

// Subtitle and dubbing options
type AudioOption = 'SUB' | 'DUB';
type ServerOption = 'strix' | 'zaza' | 'pahe';

export default function PlayerScreen() {
    const params = useLocalSearchParams();
    const animeId = params.animeId as string;
    const episodeId = params.episodeId as string;
    const router = useRouter();
    const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(0);
    const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(true);
    const [episodes, setEpisodes] = useState<EpisodeWithServers[]>([]);
    const [filteredEpisodes, setFilteredEpisodes] = useState<EpisodeWithServers[]>([]);
    const [episodeError, setEpisodeError] = useState<string | null>(null);
    const [currentEpisode, setCurrentEpisode] = useState<EpisodeWithServers | null>(null);
    const [selectedServer, setSelectedServer] = useState<ServerOption>('strix');
    const [showEpisodeList, setShowEpisodeList] = useState(false);
    const [isControlsVisible, setIsControlsVisible] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showComments, setShowComments] = useState(false);
    const [episodeLayout, setEpisodeLayout] = useState<EpisodeLayout>('grid');
    const [isPlaying, setIsPlaying] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [audioOption, setAudioOption] = useState<AudioOption>('SUB');
    const [showSettings, setShowSettings] = useState(false);
    const [showQualityOptions, setShowQualityOptions] = useState(false);
    const [selectedQuality, setSelectedQuality] = useState('1080p');
    const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
    const [showSpeedOptions, setShowSpeedOptions] = useState(false);
    const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const episodeListRef = useRef<ScrollView | null>(null);
    const videoRef = useRef<WebView | null>(null);
    const progressBarRef = useRef<View | null>(null);
    
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
        anime.providers?.forEach((provider: string, index: number) => {
          const providerId = anime.providerIds?.[index];
          if (provider === "RpmShare" && providerId) {
            console.log(`🔗 RPMShare URL: https://rpmshare.com/api/file/list?key=b57f6ad44bf1fb528c57ea90&fld_id=${providerId}`);
          } else if (provider === "Filemoon" && providerId) {
            console.log(`🔗 Filemoon URL: https://filemoonapi.com/api/file/list?key=42605q5ytvlhmu9eris67&fld_id=${providerId}`);
          }
        });
        
        const result = await trpcClient.anime.getEpisodes.query({ 
          animeId: animeId,
          animeName: anime.name || 'Unknown',
          providers: Array.isArray(anime.providers) ? anime.providers : [],
          providerIds: Array.isArray(anime.providerIds) ? anime.providerIds : []
        }) as EpisodeWithServers[];
        
        console.log(`✅ Found ${result.length} episodes:`, result);
        setEpisodes(result);
        setFilteredEpisodes(result);
        
        // Find the current episode
        const episodeIndex = result.findIndex((ep: EpisodeWithServers) => ep.id === episodeId);
        if (episodeIndex !== -1) {
          setCurrentEpisodeIndex(episodeIndex);
          const foundEpisode = result[episodeIndex];
          setCurrentEpisode(foundEpisode);
          
          // Set the default server to the first available one
          if (!foundEpisode) return;
          
          // Type-safe server selection
          const servers = Array.isArray(foundEpisode.servers) ? foundEpisode.servers : [];
          if (servers.length > 0 && servers[0]?.provider) {
            const provider = servers[0].provider.toLowerCase();
            if (['strix', 'zaza', 'pahe'].includes(provider)) {
              setSelectedServer(provider as ServerOption);
            }
          } else if (foundEpisode.provider) {
            const provider = foundEpisode.provider.toLowerCase();
            if (['strix', 'zaza', 'pahe'].includes(provider)) {
              setSelectedServer(provider as ServerOption);
            }
          }
          
          // Scroll to the current episode when the episode list is shown
          setTimeout(() => {
            if (episodeListRef.current && episodeIndex > 0) {
              episodeListRef.current.scrollTo({
                y: episodeIndex * 70, // Approximate height of each episode item
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

  // Filter episodes when search query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredEpisodes(episodes);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = episodes.filter(episode => 
        episode.title.toLowerCase().includes(query) || 
        episode.number.toString().includes(query)
      );
      setFilteredEpisodes(filtered);
    }
  }, [searchQuery, episodes]);
    // Navigation handlers
    const goBack = () => {
        router.back();
      };
      
      const navigateToEpisode = (episodeIndex: number) => {
        if (episodeIndex >= 0 && episodeIndex < episodes.length) {
          const targetEpisode = episodes[episodeIndex];
          if (targetEpisode) {
            router.replace(`/player/${animeId}/${targetEpisode.id}`);
            // Update current episode index after navigation
            setCurrentEpisodeIndex(episodeIndex);
            setCurrentEpisode(targetEpisode);
          }
        }
      };
      
      // UI state handlers
      const toggleEpisodeList = () => {
        setShowEpisodeList(!showEpisodeList);
        setSearchQuery('');
      };
      
      const toggleComments = () => {
        setShowComments(!showComments);
      };
      
      const handleServerChange = (server: ServerOption) => {
        setSelectedServer(server);
      };
      
      const toggleMute = () => {
        setIsMuted(!isMuted);
      };
      
      const changeEpisodeLayout = (layout: EpisodeLayout) => {
        setEpisodeLayout(layout);
      };
      
      const togglePlayPause = () => {
        setIsPlaying(!isPlaying);
      };
      
      const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
      };
      
      const toggleAudioOption = () => {
        setAudioOption(audioOption === 'SUB' ? 'DUB' : 'SUB');
      };
      
      const toggleSettings = () => {
        setShowSettings(!showSettings);
      };
      
      const toggleQualityOptions = () => {
        setShowQualityOptions(!showQualityOptions);
        setShowSpeedOptions(false);
      };
      
      const toggleSpeedOptions = () => {
        setShowSpeedOptions(!showSpeedOptions);
        setShowQualityOptions(false);
      };
      
      const setQuality = (quality: string) => {
        setSelectedQuality(quality);
        setShowQualityOptions(false);
      };
      
      const setSpeed = (speed: number) => {
        setPlaybackSpeed(speed);
        setShowSpeedOptions(false);
      };
      
      // Show/hide controls with auto-hide
      const showControls = () => {
        if (isControlsVisible) {
          if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
          }
        } else {
          setIsControlsVisible(true);
        }
        
        controlsTimeoutRef.current = setTimeout(() => {
          setIsControlsVisible(false);
        }, 3000);
      };
      
      // Format time for display (MM:SS)
      const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      };
        // Loading and error states
  if (isLoadingAnime || isLoadingEpisodes) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
        <Text style={styles.loadingText}>Loading anime...</Text>
      </View>
    );
  }
  
  if (animeError || !anime) {
    return (
      <View style={styles.errorContainer}>
        <Info size={64} color={Colors.dark.subtext} />
        <Text style={styles.errorText}>Failed to load anime details</Text>
        <TouchableOpacity style={styles.retryButton} onPress={goBack}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  if (episodeError || !currentEpisode) {
    return (
      <View style={styles.errorContainer}>
        <Info size={64} color={Colors.dark.subtext} />
        <Text style={styles.errorText}>{episodeError || "Episode not found"}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={goBack}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // Get the next episode
  const nextEpisode = currentEpisodeIndex < episodes.length - 1 ? episodes[currentEpisodeIndex + 1] : null;
  
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
          {Platform.OS === 'web' ? (
            <iframe
              src={`https://example.com/embed/${currentEpisode.id}?server=${selectedServer}&audio=${audioOption.toLowerCase()}`}
              style={{ width: '100%', height: '100%', border: 'none' }}
              allowFullScreen
            />
          ) : (
            <WebView
              ref={videoRef}
              source={{ uri: `https://example.com/embed/${currentEpisode.id}?server=${selectedServer}&audio=${audioOption.toLowerCase()}` }}
              style={styles.webview}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              allowsFullscreenVideo={true}
            />
          )}
          
          {isControlsVisible && (
            <View style={styles.controlsOverlay}>
              {/* Top controls */}
              <View style={styles.topControls}>
                <TouchableOpacity style={styles.backButton} onPress={goBack}>
                  <ArrowLeft size={24} color={Colors.dark.text} />
                </TouchableOpacity>
                
                <Text style={styles.episodeTitle}>
                  {anime.name} - Episode {currentEpisode.number}
                </Text>
                
                <View style={styles.topRightControls}>
                  <TouchableOpacity style={styles.audioOptionButton} onPress={toggleAudioOption}>
                    <Text style={styles.audioOptionText}>{audioOption}:</Text>
                    <View style={styles.serverTabs}>
                      <TouchableOpacity
                        style={[
                          styles.serverTab,
                          selectedServer === 'strix' && styles.activeServerTab
                        ]}
                        onPress={() => handleServerChange('strix')}
                      >
                        <Text style={styles.serverTabText}>strix</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.serverTab,
                          selectedServer === 'zaza' && styles.activeServerTab
                        ]}
                        onPress={() => handleServerChange('zaza')}
                      >
                        <Text style={styles.serverTabText}>zaza</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.serverTab,
                          selectedServer === 'pahe' && styles.activeServerTab
                        ]}
                        onPress={() => handleServerChange('pahe')}
                      >
                        <Text style={styles.serverTabText}>pahe</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Center play/pause button */}
              <View style={styles.centerControls}>
                <TouchableOpacity style={styles.playPauseButton} onPress={togglePlayPause}>
                  {isPlaying ? (
                    <Pause size={40} color={Colors.dark.text} />
                  ) : (
                    <Play size={40} color={Colors.dark.text} />
                  )}
                </TouchableOpacity>
              </View>
              
              {/* Bottom controls */}
              <View style={styles.bottomControls}>
                <View style={styles.progressContainer}>
                  <View style={styles.progressBarBackground}>
                    <View 
                      ref={progressBarRef}
                      style={[
                        styles.progressBar,
                        { width: `${(currentTime / duration) * 100}%` }
                      ]} 
                    />
                  </View>
                  <View style={styles.timeContainer}>
                    <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                    <Text style={styles.timeText}>{formatTime(duration)}</Text>
                  </View>
                </View>
                
                <View style={styles.bottomButtonsContainer}>
                  <View style={styles.leftBottomButtons}>
                    <TouchableOpacity style={styles.controlButton} onPress={togglePlayPause}>
                      {isPlaying ? (
                        <Pause size={24} color={Colors.dark.text} />
                      ) : (
                        <Play size={24} color={Colors.dark.text} />
                      )}
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.controlButton} onPress={() => navigateToEpisode(currentEpisodeIndex - 1)} disabled={currentEpisodeIndex === 0}>
                      <SkipBack size={24} color={currentEpisodeIndex === 0 ? Colors.dark.subtext : Colors.dark.text} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.controlButton} onPress={() => navigateToEpisode(currentEpisodeIndex + 1)} disabled={currentEpisodeIndex === episodes.length - 1}>
                      <SkipForward size={24} color={currentEpisodeIndex === episodes.length - 1 ? Colors.dark.subtext : Colors.dark.text} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.controlButton} onPress={toggleMute}>
                      {isMuted ? (
                        <VolumeX size={24} color={Colors.dark.text} />
                      ) : (
                        <Volume2 size={24} color={Colors.dark.text} />
                      )}
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.rightBottomButtons}>
                    <TouchableOpacity style={styles.controlButton} onPress={toggleSettings}>
                      <Settings size={24} color={Colors.dark.text} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.controlButton} onPress={toggleEpisodeList}>
                      <List size={24} color={Colors.dark.text} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.controlButton} onPress={toggleFullscreen}>
                      {isFullscreen ? (
                        <Minimize size={24} color={Colors.dark.text} />
                      ) : (
                        <Maximize size={24} color={Colors.dark.text} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
              
              {/* Settings panel */}
              {showSettings && (
                <View style={styles.settingsPanel}>
                  <TouchableOpacity style={styles.settingsOption} onPress={toggleQualityOptions}>
                    <Text style={styles.settingsOptionText}>Quality: {selectedQuality}</Text>
                    <ChevronRight size={16} color={Colors.dark.text} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.settingsOption} onPress={toggleSpeedOptions}>
                    <Text style={styles.settingsOptionText}>Speed: {playbackSpeed}x</Text>
                    <ChevronRight size={16} color={Colors.dark.text} />
                  </TouchableOpacity>
                </View>
              )}
              
              {/* Quality options panel */}
              {showQualityOptions && (
                <View style={styles.optionsPanel}>
                  {['1080p', '720p', '480p', '360p', 'Auto'].map(quality => (
                    <TouchableOpacity 
                      key={quality}
                      style={[
                        styles.optionItem,
                        selectedQuality === quality && styles.activeOptionItem
                      ]}
                      onPress={() => setQuality(quality)}
                    >
                      <Text style={styles.optionItemText}>{quality}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              
              {/* Speed options panel */}
              {showSpeedOptions && (
                <View style={styles.optionsPanel}>
                  {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map(speed => (
                    <TouchableOpacity 
                      key={speed.toString()}
                      style={[
                        styles.optionItem,
                        playbackSpeed === speed && styles.activeOptionItem
                      ]}
                      onPress={() => setSpeed(speed)}
                    >
                      <Text style={styles.optionItemText}>{speed}x</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        </TouchableOpacity>
                {/* Episode list overlay */}
                {showEpisodeList && (
          <View style={styles.episodeListOverlay}>
            <BlurView intensity={80} style={styles.blurBackground} tint="dark">
              <View style={styles.episodeListContainer}>
                <View style={styles.episodeListHeader}>
                  <Text style={styles.episodeListTitle}>All Episodes</Text>
                  
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
                
                {/* Episode grid layout */}
                {episodeLayout === 'grid' && (
                  <ScrollView style={styles.episodeListScroll}>
                    <View style={styles.episodeGrid}>
                      {filteredEpisodes.map((episode, index) => {
                        const isActive = episode.id === currentEpisode?.id;
                        
                        return (
                          <TouchableOpacity
                            key={episode.id}
                            style={[
                              styles.episodeGridItem,
                              isActive && styles.activeEpisodeGridItem,
                            ]}
                            onPress={() => {
                              navigateToEpisode(episodes.indexOf(episode));
                              setShowEpisodeList(false);
                            }}
                          >
                            <Image
                              source={{ uri: episode.thumbnail || anime.posters?.[0] || anime.poster }}
                              style={styles.episodeGridThumbnail}
                              contentFit="cover"
                            />
                            <View style={styles.episodeTileContent}>
                              <Text
                                style={[
                                  styles.episodeGridNumber,
                                  isActive && styles.activeEpisodeText,
                                ]}
                              >
                                {episode.number}
                              </Text>
                              
                              <Text
                                style={[
                                  styles.episodeTileTitle,
                                  isActive && styles.activeEpisodeText,
                                ]}
                                numberOfLines={1}
                              >
                                {episode.title}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>
                )}
                
                {/* Episode list layout */}
                {episodeLayout === 'list' && (
                  <ScrollView 
                    ref={episodeListRef}
                    style={styles.episodeListScroll}
                  >
                    {filteredEpisodes.map((episode) => {
                      const isActive = episode.id === currentEpisode?.id;
                      
                      return (
                        <TouchableOpacity
                          key={episode.id}
                          style={[
                            styles.episodeItem,
                            isActive && styles.activeEpisodeItem,
                          ]}
                          onPress={() => {
                            navigateToEpisode(episodes.indexOf(episode));
                            setShowEpisodeList(false);
                          }}
                        >
                          <View style={styles.episodeThumbnailContainer}>
                            <Image
                              source={{ uri: episode.thumbnail || anime.posters?.[0] || anime.poster }}
                              style={styles.episodeThumbnail}
                              contentFit="cover"
                            />
                            <View style={styles.episodeNumberBadge}>
                              <Text style={styles.episodeNumberBadgeText}>{episode.number}</Text>
                            </View>
                          </View>
                          
                          <View style={styles.episodeDetails}>
                            <Text 
                              style={[
                                styles.episodeTitle,
                                isActive && styles.activeEpisodeText,
                              ]}
                              numberOfLines={2}
                            >
                              {episode.title}
                            </Text>
                            
                            {episode.synopsis && (
                              <Text 
                                style={styles.episodeSynopsis}
                                numberOfLines={2}
                              >
                                {episode.synopsis}
                              </Text>
                            )}
                            
                            <Text style={styles.episodeDuration}>
                              {episode.duration || 24} min
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
                
                {/* Episode tile layout */}
                {episodeLayout === 'tile' && (
                  <ScrollView style={styles.episodeListScroll}>
                    <View style={styles.episodeTileGrid}>
                      {filteredEpisodes.map((episode) => {
                        const isActive = episode.id === currentEpisode?.id;
                        
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
                              source={{ uri: episode.thumbnail || anime.posters?.[0] || anime.poster }}
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
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
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
    topRightControls: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingHorizontal: Layout.spacing.md,
      paddingVertical: Layout.spacing.sm,
    },
    audioOptionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      borderRadius: Layout.borderRadius.md,
      paddingHorizontal: Layout.spacing.md,
      paddingVertical: Layout.spacing.sm,
      marginRight: Layout.spacing.sm,
    },
    audioOptionText: {
      color: Colors.dark.text,
      fontSize: 12,
      fontWeight: '500',
      marginRight: Layout.spacing.xs,
    },
    centerControls: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    playPauseButton: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    bottomControls: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      padding: Layout.spacing.md,
    },
    progressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Layout.spacing.sm,
    },
    progressBarBackground: {
      flex: 1,
      height: 4,
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      borderRadius: 2,
      marginHorizontal: Layout.spacing.sm,
    },
    progressBar: {
      height: 4,
      backgroundColor: Colors.dark.primary,
      borderRadius: 2,
    },
    timeContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: Layout.spacing.sm,
    },
    timeText: {
      color: Colors.dark.text,
      fontSize: 12,
      opacity: 0.8,
    },
    bottomButtonsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    leftBottomButtons: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    rightBottomButtons: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    controlButton: {
      padding: Layout.spacing.sm,
      marginHorizontal: 2,
    },
    settingsPanel: {
      position: 'absolute',
      bottom: 60,
      right: Layout.spacing.md,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      borderRadius: Layout.borderRadius.md,
      padding: Layout.spacing.md,
      minWidth: 160,
    },
    settingsOption: {
      paddingVertical: Layout.spacing.sm,
      paddingHorizontal: Layout.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
    },
    settingsOptionText: {
      color: Colors.dark.text,
      fontSize: 14,
      marginLeft: Layout.spacing.sm,
    },
    optionsPanel: {
      position: 'absolute',
      bottom: 60,
      right: Layout.spacing.md,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      borderRadius: Layout.borderRadius.md,
      padding: Layout.spacing.md,
      minWidth: 120,
    },
    optionItem: {
      paddingVertical: Layout.spacing.sm,
      paddingHorizontal: Layout.spacing.md,
    },
    optionItemText: {
      color: Colors.dark.text,
      fontSize: 14,
    },
    activeOptionItem: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: Layout.borderRadius.sm,
    },
    // Episode List Styles
    episodeListOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      zIndex: 100,
    },
    blurBackground: {
      flex: 1,
    },
    episodeListContainer: {
      flex: 1,
      padding: Layout.spacing.md,
      marginBottom: Layout.spacing.lg,
    },
    episodeListHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Layout.spacing.md,
      paddingHorizontal: Layout.spacing.sm,
    },
    episodeListTitle: {
      color: Colors.dark.text,
      fontSize: 18,
      fontWeight: 'bold',
    },
    layoutToggleContainer: {
      flexDirection: 'row',
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      borderRadius: Layout.borderRadius.md,
      overflow: 'hidden',
      padding: 2,
    },
    episodeListScroll: {
      flex: 1,
    },
    episodeItem: {
      flexDirection: 'row',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: Layout.borderRadius.md,
      marginBottom: Layout.spacing.sm,
      overflow: 'hidden',
    },
    activeEpisodeItem: {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      borderWidth: 1,
      borderColor: Colors.dark.primary,
    },
    episodeThumbnailContainer: {
      width: 120,
      aspectRatio: 16/9,
      position: 'relative',
    },
    episodeThumbnail: {
      width: '100%',
      height: '100%',
    },
    episodeNumberBadge: {
      position: 'absolute',
      bottom: Layout.spacing.xs,
      right: Layout.spacing.xs,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      borderRadius: Layout.borderRadius.sm,
      paddingHorizontal: Layout.spacing.xs,
      paddingVertical: 2,
    },
    episodeNumberBadgeText: {
      color: Colors.dark.text,
      fontSize: 10,
      fontWeight: 'bold',
    },
    episodeDetails: {
      flex: 1,
      padding: Layout.spacing.md,
      justifyContent: 'center',
    },
    episodeTitle: {
      color: Colors.dark.text,
      fontSize: 14,
      fontWeight: '500',
      marginBottom: Layout.spacing.xs,
    },
    episodeSynopsis: {
      color: 'rgba(255, 255, 255, 0.7)',
      fontSize: 12,
      marginBottom: Layout.spacing.xs,
    },
    episodeDuration: {
      color: 'rgba(255, 255, 255, 0.5)',
      fontSize: 11,
    },
    episodeTileGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      padding: Layout.spacing.sm,
    },
    episodeTileItem: {
      width: '50%',
      padding: Layout.spacing.sm,
    },
    activeEpisodeTileItem: {
      opacity: 0.8,
    },
    episodeTileThumbnail: {
      width: '100%',
      aspectRatio: 16/9,
      borderRadius: Layout.borderRadius.md,
      overflow: 'hidden',
    },
    episodeTileOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    episodeTileNumber: {
      color: 'white',
      fontSize: 24,
      fontWeight: 'bold',
      textShadowColor: 'rgba(0, 0, 0, 0.8)',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 2,
    },
    episodeTileContent: {
      marginTop: Layout.spacing.xs,
    },
    episodeTileTitle: {
      color: Colors.dark.text,
      fontSize: 12,
      fontWeight: '500',
    },
    activeEpisodeTileTitle: {
      color: Colors.dark.primary,
    },
    videoContainer: {
      width: '100%',
      height: Platform.OS === 'web' ? SCREEN_HEIGHT : SCREEN_WIDTH * 9 / 16,
      backgroundColor: '#000',
      position: 'relative',
    },
    webview: {
      width: '100%',
      height: '100%',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: Colors.dark.background,
    },
    loadingText: {
      color: Colors.dark.text,
      marginTop: Layout.spacing.md,
      fontSize: 16,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: Colors.dark.background,
      padding: Layout.spacing.lg,
    },
    errorText: {
      color: Colors.dark.text,
      marginTop: Layout.spacing.md,
      fontSize: 16,
    },
    retryButton: {
        backgroundColor: Colors.dark.primary,
        paddingHorizontal: Layout.spacing.md,
        paddingVertical: Layout.spacing.sm,
        borderRadius: Layout.borderRadius.md,
        marginTop: Layout.spacing.md,
      },
      retryButtonText: {
        color: Colors.dark.text,
        fontWeight: '600',
      },
      controlsOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'space-between',
      },
      topControls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Layout.spacing.md,
      },
      backButton: {
        padding: Layout.spacing.sm,
      },
      // episodeTitle style removed - using episodeTileTitle instead
      muteButton: {
        padding: Layout.spacing.sm,
      },
      serverTabs: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderRadius: Layout.borderRadius.md,
        overflow: 'hidden',
      },
      serverTab: {
        paddingHorizontal: Layout.spacing.md,
        paddingVertical: Layout.spacing.sm,
      },
      activeServerTab: {
        backgroundColor: Colors.dark.primary,
      },
      rpmShareTab: {
        borderRightWidth: 1,
        borderRightColor: Colors.dark.border,
      },
      filemoonTab: {},
      serverTabText: {
        color: Colors.dark.text,
        fontSize: 12,
        fontWeight: '500',
      },
      activeServerTabText: {
        fontWeight: '700',
      },
      navigationControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Layout.spacing.md,
      },
      navButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: Layout.spacing.md,
        paddingVertical: Layout.spacing.sm,
        borderRadius: Layout.borderRadius.md,
      },
      disabledNavButton: {
        opacity: 0.5,
      },
      navButtonText: {
        color: Colors.dark.text,
        fontSize: 14,
        fontWeight: '500',
        marginHorizontal: Layout.spacing.sm,
      },
      episodeListButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: Layout.spacing.md,
        paddingVertical: Layout.spacing.sm,
        borderRadius: Layout.borderRadius.md,
      },
      episodeListButtonText: {
        color: Colors.dark.text,
        fontSize: 14,
        fontWeight: '500',
        marginLeft: Layout.spacing.sm,
      },
      infoContainer: {
        flex: 1,
        padding: Layout.spacing.md,
      },
      title: {
        color: Colors.dark.text,
        fontSize: 20,
        fontWeight: '700',
        marginBottom: Layout.spacing.sm,
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
        marginBottom: Layout.spacing.lg,
      },
      serverSwitcher: {
        marginBottom: Layout.spacing.lg,
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
        borderRadius: Layout.borderRadius.md,
        marginRight: Layout.spacing.sm,
        marginBottom: Layout.spacing.sm,
        borderWidth: 1,
        borderColor: Colors.dark.border,
      },
      activeServerButton: {
        backgroundColor: Colors.dark.primary,
        borderColor: Colors.dark.primary,
      },
      rpmShareButton: {
        backgroundColor: 'rgba(255, 69, 58, 0.2)',
      },
      filemoonButton: {
        backgroundColor: 'rgba(10, 132, 255, 0.2)',
      },
      serverButtonText: {
        color: Colors.dark.text,
        fontSize: 14,
        fontWeight: '500',
      },
      activeServerButtonText: {
        fontWeight: '700',
      },
      upNextContainer: {
        marginBottom: Layout.spacing.lg,
      },
      upNextTitle: {
        color: Colors.dark.text,
        fontSize: 16,
        fontWeight: '600',
        marginBottom: Layout.spacing.sm,
      },
      upNextCard: {
        flexDirection: 'row',
        backgroundColor: Colors.dark.card,
        borderRadius: Layout.borderRadius.md,
        overflow: 'hidden',
      },
      upNextThumbnailContainer: {
        width: 120,
        height: 68,
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
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
      },
      upNextInfo: {
        flex: 1,
        padding: Layout.spacing.md,
      },
      upNextEpisodeNumber: {
        color: Colors.dark.primary,
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 2,
      },
      upNextEpisodeTitle: {
        color: Colors.dark.text,
        fontSize: 14,
        fontWeight: '600',
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
      },
      upNextServers: {
        flexDirection: 'row',
        marginTop: 4,
      },
      upNextServerTag: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 3,
        marginRight: 4,
      },
      upNextServerTagText: {
        color: Colors.dark.text,
        fontSize: 10,
        fontWeight: '500',
      },
      // episodeListContainer style moved and combined above
      sectionHeader: {
        fontSize: 14,
        fontWeight: '500',
      },
      episodeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -Layout.spacing.xs,
      },
      episodeGridItem: {
        width: (SCREEN_WIDTH - Layout.spacing.md * 2 - Layout.spacing.xs * 6) / 3,
        marginHorizontal: Layout.spacing.xs,
        marginBottom: Layout.spacing.sm,
        borderRadius: Layout.borderRadius.md,
        overflow: 'hidden',
        backgroundColor: Colors.dark.card,
      },
      activeEpisodeGridItem: {
        borderWidth: 2,
        borderColor: Colors.dark.primary,
      },
      episodeGridThumbnail: {
        width: '100%',
        aspectRatio: 16 / 9,
      },
      episodeGridInfo: {
        padding: Layout.spacing.sm,
      },
      episodeGridNumber: {
        color: Colors.dark.text,
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 2,
      },
      episodeGridTitle: {
        color: Colors.dark.subtext,
        fontSize: 10,
      },
      activeEpisodeText: {
        color: Colors.dark.primary,
      },
      episodeServerCount: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        width: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
      },
      episodeServerCountText: {
        color: Colors.dark.text,
        fontSize: 8,
        fontWeight: 'bold',
      },
      moreEpisodesButton: {
        width: (SCREEN_WIDTH - Layout.spacing.md * 2 - Layout.spacing.xs * 6) / 3,
        aspectRatio: 1,
        marginHorizontal: Layout.spacing.xs,
        marginBottom: Layout.spacing.sm,
        borderRadius: Layout.borderRadius.md,
        backgroundColor: Colors.dark.card,
        justifyContent: 'center',
        alignItems: 'center',
      },
      moreEpisodesText: {
        color: Colors.dark.primary,
        fontSize: 16,
        fontWeight: '700',
      },
      commentsContainer: {
        marginBottom: Layout.spacing.lg,
      },
      commentsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Layout.spacing.md,
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
        marginTop: Layout.spacing.md,
        height: 400,
      },
      mobileCommentsPlaceholder: {
        padding: Layout.spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
      },
      mobileCommentsText: {
        color: Colors.dark.subtext,
        textAlign: 'center',
      },
      fullEpisodeListOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10,
      },
      // blurBackground style is already defined above
      fullEpisodeListContainer: {
        flex: 1,
        padding: Layout.spacing.md,
      },
      fullEpisodeListHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Layout.spacing.md,
      },
      fullEpisodeListTitle: {
        color: Colors.dark.text,
        fontSize: 18,
        fontWeight: '700',
      },
      // layoutToggleContainer style moved and merged above
      layoutToggleButton: {
        padding: Layout.spacing.sm,
      },
      activeLayoutToggleButton: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      },
      closeButton: {
        padding: Layout.spacing.sm,
      },
      searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: Layout.borderRadius.md,
        paddingHorizontal: Layout.spacing.md,
        marginBottom: Layout.spacing.md,
      },
      searchIcon: {
        marginRight: Layout.spacing.sm,
      },
      searchInput: {
        flex: 1,
        height: 40,
        color: Colors.dark.text,
        fontSize: 14,
      },
      clearButton: {
        padding: Layout.spacing.sm,
      },
      fullEpisodeListScroll: {
        flex: 1,
      },
      rpmShareTag: {
        backgroundColor: 'rgba(255, 69, 58, 0.7)',
      },
      filemoonTag: {
        backgroundColor: 'rgba(10, 132, 255, 0.7)',
      },
    });