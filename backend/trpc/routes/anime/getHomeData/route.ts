import { publicProcedure } from "@/backend/trpc/create-context";

export default publicProcedure
  .query(async () => {
    try {
      // Fetch home data from the Aniflix API
      console.log("🔍 Fetching home data from API...");
      const response = await fetch("https://aniflix-api.aniflix-00.workers.dev/api/home");
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const rawData = await response.json();
      
      // Check if the response has the expected structure
      // The API might return data directly or nested under a data property
      const data = rawData.data || rawData;
      const success = rawData.success !== undefined ? rawData.success : true;
      
      if (!success) {
        throw new Error("API returned unsuccessful response");
      }
      
      // Log the structure to help debug
      console.log("🏠 Home API response structure:", {
        success: success,
        hasData: !!data,
        hasSpotlight: Array.isArray(data.spotlightAnimes) && data.spotlightAnimes.length > 0,
        hasTopAiring: Array.isArray(data.topAiringAnimes) && data.topAiringAnimes.length > 0,
        hasTrending: Array.isArray(data.trendingAnimes) && data.trendingAnimes.length > 0,
        hasMostFavorite: Array.isArray(data.mostFavoriteAnimes) && data.mostFavoriteAnimes.length > 0,
        hasMostPopular: Array.isArray(data.mostPopularAnimes) && data.mostPopularAnimes.length > 0,
        hasLatestCompleted: Array.isArray(data.latestCompletedAnimes) && data.latestCompletedAnimes.length > 0,
        hasUpcoming: Array.isArray(data.upcomingAnimes) && data.upcomingAnimes.length > 0,
        hasAnimeMovies: Array.isArray(data.animeMovies) && data.animeMovies.length > 0,
        hasNewlyAdded: Array.isArray(data.newlyAdded) && data.newlyAdded.length > 0,
        hasSchedule: Array.isArray(data.animeSchedule) && data.animeSchedule.length > 0,
        hasGenres: Array.isArray(data.genres) && data.genres.length > 0,
        hasTop10: data.top10Animes && Object.keys(data.top10Animes).length > 0
      });
      
      // Validate anime IDs
      const validateAnimeList = (animeList: any[]) => {
        if (!Array.isArray(animeList)) return [];
        
        return animeList.map(anime => {
          // Ensure anime has an ID
          if (!anime.aid && !anime.id) {
            console.log("⚠️ Anime missing ID:", anime.name);
          }
          return anime;
        });
      };
      
      // If we have the first spotlight anime, log its structure
      if (data.spotlightAnimes?.[0]) {
        console.log("🔍 First spotlight anime structure:", 
          Object.keys(data.spotlightAnimes[0])
        );
      } else if (data.trendingAnimes?.[0]) {
        console.log("🔍 First trending anime structure:", 
          Object.keys(data.trendingAnimes[0])
        );
      }
      
      // Return the processed data with validation
      return {
        spotlightAnimes: validateAnimeList(data.spotlightAnimes || []),
        topAiringAnimes: validateAnimeList(data.topAiringAnimes || []),
        trendingAnimes: validateAnimeList(data.trendingAnimes || []),
        mostFavoriteAnimes: validateAnimeList(data.mostFavoriteAnimes || []),
        mostPopularAnimes: validateAnimeList(data.mostPopularAnimes || []),
        latestCompletedAnimes: validateAnimeList(data.latestCompletedAnimes || []),
        upcomingAnimes: validateAnimeList(data.upcomingAnimes || data.topUpcomingAnimes || []),
        animeMovies: validateAnimeList(data.animeMovies || []),
        newlyAdded: validateAnimeList(data.newlyAdded || []),
        animeSchedule: data.animeSchedule || [],
        genres: data.genres || [],
        top10Animes: data.top10Animes || { today: [], week: [], month: [] }
      };
    } catch (error) {
      console.error("Error fetching home data:", error);
      // Return empty data on error
      return {
        spotlightAnimes: [],
        topAiringAnimes: [],
        trendingAnimes: [],
        mostFavoriteAnimes: [],
        mostPopularAnimes: [],
        latestCompletedAnimes: [],
        upcomingAnimes: [],
        animeMovies: [],
        newlyAdded: [],
        animeSchedule: [],
        genres: [],
        top10Animes: { today: [], week: [], month: [] }
      };
    }
  });