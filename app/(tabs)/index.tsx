
import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, ScrollView, StatusBar, ActivityIndicator, Text, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import Layout from '@/constants/layout';
import Header from '@/components/Header';
import AnimeSection from '@/components/AnimeSection';
import GenreList from '@/components/GenreList';
import SpotlightCarousel from '@/components/SpotlightCarousel';
import ScheduleSection from '@/components/ScheduleSection';
import Top10Section from '@/components/Top10Section';
import { trpc } from '@/lib/trpc';
import { LocalAnime } from '@/types/anime';
import PlaceholderSection from '@/components/PlaceholderSection';
import HomeSkeleton from '@/components/HomeSkeleton';

// Define interfaces for the different anime data structures from the API
interface ApiAnimeBase {
  aid?: string | number;
  id?: string;
  name: string;
  poster: string;
}

interface ApiDetailedAnime extends ApiAnimeBase {
  jname?: string;
  bposter?: string;
  banner?: string;
  genre?: string | string[];
  synopsis?: string;
  description?: string;
  imdb_rating?: number | string;
  IMDb?: number | string;
  total_episodes?: number;
  episodes?: string | number;
  status?: string;
  studio?: string;
  type?: string;
  duration?: string;
  quality?: string;
  vdo?: string;
}

interface ApiFavoriteAnime extends ApiAnimeBase {
  episodes?: {
    sub?: number;
    dub?: number;
  };
}

interface ApiUpcomingAnime extends ApiAnimeBase {
  duration?: string;
  rating?: number | string | null;
  type?: string;
}

interface ApiTop10Anime extends ApiAnimeBase {
  rank: number;
  episodes?: {
    sub?: number;
    dub?: number;
  };
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const headerRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [spotlightAnime, setSpotlightAnime] = useState<LocalAnime[]>([]);
  const [trendingAnime, setTrendingAnime] = useState<LocalAnime[]>([]);
  const [topAiringAnime, setTopAiringAnime] = useState<LocalAnime[]>([]);
  const [mostFavoriteAnime, setMostFavoriteAnime] = useState<LocalAnime[]>([]);
  const [mostPopularAnime, setMostPopularAnime] = useState<LocalAnime[]>([]);
  const [latestCompletedAnime, setLatestCompletedAnime] = useState<LocalAnime[]>([]);
  const [upcomingAnime, setUpcomingAnime] = useState<LocalAnime[]>([]);
  const [animeMovies, setAnimeMovies] = useState<LocalAnime[]>([]);
  const [newlyAddedAnime, setNewlyAddedAnime] = useState<LocalAnime[]>([]);
  const [topRatedAnime, setTopRatedAnime] = useState<LocalAnime[]>([]);

  // Fetch home data from the API
  const { data: homeData, isLoading: isLoadingHomeData, refetch } = 
    trpc.anime.getHomeData.useQuery();
  
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  useEffect(() => {
    if (homeData) {
      console.log("🏠 Home data received:", {
        spotlightCount: homeData.spotlightAnimes?.length || 0,
        trendingCount: homeData.trendingAnimes?.length || 0,
        topAiringCount: homeData.topAiringAnimes?.length || 0,
        mostFavoriteCount: homeData.mostFavoriteAnimes?.length || 0,
        mostPopularCount: homeData.mostPopularAnimes?.length || 0,
        latestCompletedCount: homeData.latestCompletedAnimes?.length || 0,
        upcomingCount: homeData.upcomingAnimes?.length || 0,
        animeMoviesCount: homeData.animeMovies?.length || 0,
        newlyAddedCount: homeData.newlyAdded?.length || 0,
      });
      
      // Process spotlight anime
      if (homeData.spotlightAnimes && homeData.spotlightAnimes.length > 0) {
        const spotlightList = homeData.spotlightAnimes.map((anime: ApiDetailedAnime) => {
          // Safely access properties with fallbacks
          const coverImage = anime.poster ? 
            (typeof anime.poster === 'string' ? anime.poster.split(", ")[0] : anime.poster) : 
            "";
          
          const bannerImage = anime.banner || anime.bposter || coverImage;
          
          const genres = anime.genre ? 
            (typeof anime.genre === 'string' ? anime.genre.split(", ") : anime.genre) : 
            [];
          
          // Use either IMDb or imdb_rating
          const rating = anime.IMDb !== undefined ? anime.IMDb : anime.imdb_rating || 0;
          
          // Use either episodes or total_episodes
          const episodesCount = anime.episodes !== undefined ? 
            (typeof anime.episodes === 'string' ? parseInt(anime.episodes) : anime.episodes) : 
            anime.total_episodes || 0;
          
          return {
            id: anime.aid?.toString() || "",
            title: anime.name || "",
            coverImage,
            bannerImage,
            description: anime.description || anime.synopsis || "",
            genres,
            rating,
            episodes: episodesCount,
            status: anime.status || "",
            studio: anime.studio || "",
            duration: anime.duration || "",
            quality: anime.quality || "",
            vdo: anime.vdo || ""
          };
        });
        
        setSpotlightAnime(spotlightList);
      }
      
      // Process trending anime
      if (homeData.trendingAnimes && homeData.trendingAnimes.length > 0) {
        const trendingList = homeData.trendingAnimes.map((anime: ApiDetailedAnime) => {
          // Safely access properties with fallbacks
          const coverImage = anime.poster ? 
            (typeof anime.poster === 'string' ? anime.poster.split(", ")[0] : anime.poster) : 
            "";
          
          const bannerImage = anime.bposter || 
            (anime.banner ? 
              (typeof anime.banner === 'string' ? anime.banner.split(", ")[0] : anime.banner) : 
              coverImage);
          
          const genres = anime.genre ? 
            (typeof anime.genre === 'string' ? anime.genre.split(", ") : anime.genre) : 
            [];
          
          return {
            id: anime.aid?.toString() || "",
            title: anime.name || "",
            coverImage,
            bannerImage,
            description: anime.synopsis || anime.description || "",
            genres,
            rating: anime.imdb_rating || anime.IMDb || 0,
            episodes: anime.total_episodes || (typeof anime.episodes === 'string' ? parseInt(anime.episodes) : anime.episodes) || 0,
            status: anime.status || "",
            studio: anime.studio || "",
            vdo: anime.vdo || ""
          };
        });
        
        setTrendingAnime(trendingList);
      }
      
      // Process top airing anime
      if (homeData.topAiringAnimes && homeData.topAiringAnimes.length > 0) {
        const topAiringList = homeData.topAiringAnimes.map((anime: ApiDetailedAnime) => {
          const coverImage = anime.poster ? 
            (typeof anime.poster === 'string' ? anime.poster.split(", ")[0] : anime.poster) : 
            "";
          
          const bannerImage = anime.bposter || 
            (anime.banner ? 
              (typeof anime.banner === 'string' ? anime.banner.split(", ")[0] : anime.banner) : 
              coverImage);
          
          const genres = anime.genre ? 
            (typeof anime.genre === 'string' ? anime.genre.split(", ") : anime.genre) : 
            [];
          
          return {
            id: anime.aid?.toString() || "",
            title: anime.name || "",
            coverImage,
            bannerImage,
            description: anime.synopsis || anime.description || "",
            genres,
            rating: anime.imdb_rating || anime.IMDb || 0,
            episodes: anime.total_episodes || (typeof anime.episodes === 'string' ? parseInt(anime.episodes) : anime.episodes) || 0,
            status: anime.status || "",
            studio: anime.studio || ""
          };
        });
        
        setTopAiringAnime(topAiringList);
      }
      
      // Process most favorite anime
      if (homeData.mostFavoriteAnimes && homeData.mostFavoriteAnimes.length > 0) {
        const favoriteList = homeData.mostFavoriteAnimes.map((anime: ApiFavoriteAnime) => {
          const coverImage = anime.poster || "";
          const episodes = anime.episodes?.sub || anime.episodes?.dub || 0;
          const id = anime.aid?.toString() || anime.id || "";
          
          return {
            id,
            title: anime.name || "",
            coverImage,
            bannerImage: coverImage,
            description: "",
            genres: [],
            rating: 0,
            episodes: typeof episodes === 'number' ? episodes : 0,
            status: "",
            studio: ""
          };
        });
        
        setMostFavoriteAnime(favoriteList);
      }
      
      // Process most popular anime
      if (homeData.mostPopularAnimes && homeData.mostPopularAnimes.length > 0) {
        const popularList = homeData.mostPopularAnimes.map((anime: ApiDetailedAnime) => {
          const coverImage = anime.poster ? 
            (typeof anime.poster === 'string' ? anime.poster.split(", ")[0] : anime.poster) : 
            "";
          
          const bannerImage = anime.bposter || 
            (anime.banner ? 
              (typeof anime.banner === 'string' ? anime.banner.split(", ")[0] : anime.banner) : 
              coverImage);
          
          const genres = anime.genre ? 
            (typeof anime.genre === 'string' ? anime.genre.split(", ") : anime.genre) : 
            [];
          
          return {
            id: anime.aid?.toString() || "",
            title: anime.name || "",
            coverImage,
            bannerImage,
            description: anime.synopsis || anime.description || "",
            genres,
            rating: anime.imdb_rating || anime.IMDb || 0,
            episodes: anime.total_episodes || (typeof anime.episodes === 'string' ? parseInt(anime.episodes) : anime.episodes) || 0,
            status: anime.status || "",
            studio: anime.studio || ""
          };
        });
        
        setMostPopularAnime(popularList);
      }
      
      // Process latest completed anime
      if (homeData.latestCompletedAnimes && homeData.latestCompletedAnimes.length > 0) {
        const completedList = homeData.latestCompletedAnimes.map((anime: ApiDetailedAnime) => {
          const coverImage = anime.poster ? 
            (typeof anime.poster === 'string' ? anime.poster.split(", ")[0] : anime.poster) : 
            "";
          
          const bannerImage = anime.bposter || 
            (anime.banner ? 
              (typeof anime.banner === 'string' ? anime.banner.split(", ")[0] : anime.banner) : 
              coverImage);
          
          const genres = anime.genre ? 
            (typeof anime.genre === 'string' ? anime.genre.split(", ") : anime.genre) : 
            [];
          
          return {
            id: anime.aid?.toString() || "",
            title: anime.name || "",
            coverImage,
            bannerImage,
            description: anime.synopsis || anime.description || "",
            genres,
            rating: anime.imdb_rating || anime.IMDb || 0,
            episodes: anime.total_episodes || (typeof anime.episodes === 'string' ? parseInt(anime.episodes) : anime.episodes) || 0,
            status: anime.status || "",
            studio: anime.studio || ""
          };
        });
        
        setLatestCompletedAnime(completedList);
      }
      
      // Process upcoming anime
      if (homeData.upcomingAnimes && homeData.upcomingAnimes.length > 0) {
        const upcomingList = homeData.upcomingAnimes.map((anime: ApiUpcomingAnime) => {
          const coverImage = anime.poster || "";
          const id = anime.aid?.toString() || anime.id || "";
          
          return {
            id,
            title: anime.name || "",
            coverImage,
            bannerImage: coverImage,
            description: anime.duration || "",
            genres: [],
            rating: anime.rating || 0,
            episodes: 0,
            status: anime.type || "",
            studio: ""
          };
        });
        
        setUpcomingAnime(upcomingList);
      }
      
      // Process anime movies
      if (homeData.animeMovies && homeData.animeMovies.length > 0) {
        const moviesList = homeData.animeMovies.map((anime: ApiDetailedAnime) => {
          const coverImage = anime.poster || "";
          const bannerImage = anime.bposter || coverImage;
          const id = anime.aid?.toString() || anime.id || "";
          const genres = anime.genre ? 
            (typeof anime.genre === 'string' ? anime.genre.split(", ") : anime.genre) : 
            [];
          
          return {
            id,
            title: anime.name || "",
            coverImage,
            bannerImage,
            description: anime.synopsis || anime.description || "",
            genres,
            rating: anime.imdb_rating || anime.IMDb || 0,
            episodes: anime.total_episodes || 1,
            status: anime.status || "",
            studio: ""
          };
        });
        
        setAnimeMovies(moviesList);
      }
      
      // Process newly added anime
      if (homeData.newlyAdded && homeData.newlyAdded.length > 0) {
        const newlyAddedList = homeData.newlyAdded.map((anime: ApiDetailedAnime) => {
          const coverImage = anime.poster ? 
            (typeof anime.poster === 'string' ? anime.poster.split(", ")[0] : anime.poster) : 
            "";
          
          const genres = anime.genre ? 
            (typeof anime.genre === 'string' ? anime.genre.split(", ") : anime.genre) : 
            [];
          
          return {
            id: anime.aid?.toString() || "",
            title: anime.name || "",
            coverImage,
            bannerImage: coverImage,
            description: anime.synopsis || anime.description || "",
            genres,
            rating: anime.imdb_rating || anime.IMDb || 0,
            episodes: anime.total_episodes || (typeof anime.episodes === 'string' ? parseInt(anime.episodes) : anime.episodes) || 0,
            status: anime.status || "",
            studio: anime.studio || ""
          };
        });
        
        setNewlyAddedAnime(newlyAddedList);
      }
      
      // Process top rated anime (using top10Animes.month if available)
      if (homeData.top10Animes?.month && homeData.top10Animes.month.length > 0) {
        const topRatedList = homeData.top10Animes.month.map((anime: ApiTop10Anime) => {
          const coverImage = anime.poster || "";
          const id = anime.aid?.toString() || anime.id || "";
          
          return {
            id,
            title: anime.name || "",
            coverImage,
            bannerImage: coverImage,
            description: "",
            genres: [],
            rating: 0,
            episodes: anime.episodes?.sub || anime.episodes?.dub || 0,
            status: "",
            studio: "",
            // Add these properties to match Top10Anime interface
            rank: anime.rank,
            name: anime.name || "",
            jname: "",
            poster: anime.poster || ""
          };
        });
        
        setTopRatedAnime(topRatedList);
      }
    }
    
    if (!isLoadingHomeData) {
      setIsLoading(false);
    }
  }, [homeData, isLoadingHomeData]);

  // Handle scroll events
  const handleScroll = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    if (headerRef.current && headerRef.current.handleScroll) {
      headerRef.current.handleScroll(scrollY);
    }
  };

  // Helper function to check if data is valid
  const hasValidData = (data: any[] | undefined): boolean => {
    return !!(data && data.length > 0 && (data[0] as any).id);
  };

  if (isLoading) {
    return <HomeSkeleton />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Header Component with ref */}
      <Header ref={headerRef} />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16} // Important: Add this for smooth scroll events
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.dark.primary]}
            tintColor={Colors.dark.primary}
          />
        }
      >
        {/* 1. SPOTLIGHT */}
        {hasValidData(spotlightAnime) ? (
          <SpotlightCarousel animeList={spotlightAnime} autoPlay={true} interval={35000} />
        ) : hasValidData(trendingAnime) ? (
          <SpotlightCarousel animeList={trendingAnime} autoPlay={true} interval={35000} />
        ) : (
          <PlaceholderSection title="Spotlight" message="Featured anime coming soon" />
        )}
        
        {/* 2. NEWLY ADDED - New On Arise */}
        {hasValidData(newlyAddedAnime) ? (
          <AnimeSection 
            title="New On Arise" 
            animeList={newlyAddedAnime} 
            viewAllLink="/explore?section=new" 
          />
        ) : (
          <PlaceholderSection title="New On Arise" message="New anime coming soon" />
        )}
        
        {/* 3. CONTINUE WATCHING */}
        <PlaceholderSection title="Continue Watching" message="Your watch history will appear here" />
        
        {/* 4. CURRENTLY AIRING */}
        {hasValidData(topAiringAnime) ? (
          <AnimeSection 
            title="Currently Airing" 
            animeList={topAiringAnime} 
            viewAllLink="/explore?section=airing" 
          />
        ) : (
          <PlaceholderSection title="Currently Airing" message="Airing anime coming soon" />
        )}
        
        {/* 5. TRENDING */}
        {hasValidData(trendingAnime) ? (
          <AnimeSection 
            title="Trending Now" 
            animeList={trendingAnime} 
            viewAllLink="/explore?section=trending" 
          />
        ) : (
          <PlaceholderSection title="Trending Now" message="Trending anime coming soon" />
        )}
        
        {/* 6. MOVIES */}
        {hasValidData(animeMovies) ? (
          <AnimeSection 
            title="Anime Movies" 
            animeList={animeMovies} 
            viewAllLink="/explore?section=movies" 
          />
        ) : (
          <PlaceholderSection title="Anime Movies" message="Movies coming soon" />
        )}
        
        {/* 7. MOST POPULAR */}
        {hasValidData(mostPopularAnime) ? (
          <AnimeSection 
            title="Most Popular" 
            animeList={mostPopularAnime} 
            viewAllLink="/explore?section=popular" 
          />
        ) : hasValidData(mostFavoriteAnime) ? (
          <AnimeSection 
            title="Most Popular" 
            animeList={mostFavoriteAnime} 
            viewAllLink="/explore?section=popular" 
          />
        ) : (
          <PlaceholderSection title="Most Popular" message="Popular anime coming soon" />
        )}
        
        {/* 8. ESTIMATED SCHEDULE */}
        {homeData?.animeSchedule && homeData.animeSchedule.length > 0 ? (
          <ScheduleSection 
            title="Weekly Schedule" 
            scheduleData={homeData.animeSchedule} 
          />
        ) : (
          <PlaceholderSection title="Weekly Schedule" message="Schedule coming soon" />
        )}
        
        {/* 9. LATEST COMPLETED */}
        {hasValidData(latestCompletedAnime) ? (
          <AnimeSection 
            title="Recently Completed" 
            animeList={latestCompletedAnime} 
            viewAllLink="/explore?section=completed" 
          />
        ) : (
          <PlaceholderSection title="Recently Completed" message="Completed anime coming soon" />
        )}
        
        {/* 10. TOP RATED */}
        {hasValidData(topRatedAnime) ? (
          <Top10Section 
            title="Top Rated" 
            animeList={topRatedAnime.map(anime => ({
              ...anime,
              // Ensure all required properties for Top10Anime are present
              id: anime.id || "",
              name: anime.title || "",
              jname: "",
              poster: anime.coverImage || "",
              rank: anime.rank || 0,
              // Ensure episodes object exists with optional sub/dub
              episodes: anime.episodes ? {
                sub: typeof anime.episodes === 'number' ? anime.episodes : undefined,
                dub: undefined
              } : undefined
            }))}
            viewAllLink="/explore?section=top10" 
          />
        ) : homeData?.top10Animes?.today && homeData.top10Animes.today.length > 0 ? (
          <Top10Section 
            title="Top Rated" 
            animeList={homeData.top10Animes.today.map((anime: ApiTop10Anime) => ({
              ...anime,
              // Ensure all required properties are present
              id: anime.aid?.toString() || anime.id || "",
              name: anime.name || "",
              jname: "",
              poster: anime.poster || "",
              rank: anime.rank || 0,
              // Ensure episodes object exists with optional sub/dub
              episodes: anime.episodes ? {
                sub: anime.episodes.sub,
                dub: anime.episodes.dub
              } : undefined
            }))} 
            viewAllLink="/explore?section=top10" 
          />
        ) : (
          <PlaceholderSection title="Top Rated" message="Top rated anime coming soon" />
        )}
        
        {/* 11. UPCOMING */}
        {hasValidData(upcomingAnime) ? (
          <AnimeSection 
            title="Upcoming Anime" 
            animeList={upcomingAnime} 
            viewAllLink="/explore?section=upcoming" 
          />
        ) : (
          <PlaceholderSection title="Upcoming Anime" message="Upcoming anime coming soon" />
        )}
        
        {/* GENRES */}
        <GenreList genres={homeData?.genres || []} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  contentContainer: {
    paddingTop: 100, // Add padding to account for header height
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
  }
});