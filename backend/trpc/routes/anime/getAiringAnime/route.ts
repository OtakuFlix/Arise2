import { publicProcedure } from "@/backend/trpc/create-context";
import { Anime } from "@/types/anime";

export default publicProcedure
  .query(async () => {
    try {
      // Fetch all anime data from the API
      const response = await fetch(`https://raw.githubusercontent.com/OtakuFlix/ADATA/refs/heads/main/anime_data.txt`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const allAnime: Anime[] = await response.json();
      
      // Filter to get only currently airing anime
      const airingAnime = allAnime.filter(anime => anime.airing === "true");
      
      // Process the anime data to make it more usable
      const processedAnime = airingAnime.map(anime => ({
        ...anime,
        posters: anime.poster.split(", "),
        banners: anime.banner.split(", "),
        providers: anime.cname.split(", "),
        providerIds: anime.cid.split(", "),
        trailers: anime.trailer.split(", "),
        genres: anime.genre.split(", "),
        producersList: anime.producers.split(", "),
        similarAnime: anime.sanime.split(", "),
        isAiring: true,
      }));
      
      return processedAnime;
    } catch (error) {
      console.error("Error fetching airing anime:", error);
      throw error;
    }
  });