import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { Anime } from "@/types/anime";

// Fisher-Yates shuffle algorithm for randomizing array
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export default publicProcedure
  .input(z.object({
    limit: z.number().optional().default(20),
    offset: z.number().optional().default(0),
    genre: z.string().optional(),
    status: z.string().optional(),
    search: z.string().optional(),
    random: z.boolean().optional().default(false),
  }))
  .query(async ({ input }) => {
    try {
      console.log("Fetching all anime data...");
      
      // Fetch all anime data from the GitHub URL
      const response = await fetch(`https://raw.githubusercontent.com/OtakuFlix/ADATA/refs/heads/main/anime_data.txt`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const allAnime: Anime[] = await response.json();
      console.log(`Fetched ${allAnime.length} anime entries`);
      
      // Apply filters
      let filteredAnime = allAnime;
      
      if (input.genre) {
        filteredAnime = filteredAnime.filter(anime => 
          anime.genre.toLowerCase().includes(input.genre!.toLowerCase())
        );
      }
      
      if (input.status) {
        filteredAnime = filteredAnime.filter(anime => 
          anime.status.toLowerCase() === input.status!.toLowerCase()
        );
      }
      
      if (input.search) {
        filteredAnime = filteredAnime.filter(anime => 
          anime.name.toLowerCase().includes(input.search!.toLowerCase()) ||
          anime.jname.toLowerCase().includes(input.search!.toLowerCase()) ||
          anime.synopsis.toLowerCase().includes(input.search!.toLowerCase())
        );
      }
      
      // Randomize the results if requested
      if (input.random) {
        filteredAnime = shuffleArray(filteredAnime);
      }
      
      // Apply pagination
      const paginatedAnime = filteredAnime.slice(input.offset, input.offset + input.limit);
      
      // Process the anime data to make it more usable
      const processedAnime = paginatedAnime.map(anime => ({
        ...anime,
        posters: anime.poster.split(", "),
        banners: anime.banner.split(", "),
        providers: anime.cname.split(", "),
        providerIds: anime.cid.split(", "),
        trailers: anime.trailer.split(", "),
        genres: anime.genre.split(", "),
        producersList: anime.producers.split(", "),
        similarAnime: anime.sanime.split(", "),
        isAiring: anime.airing === "true",
      }));
      
      return {
        anime: processedAnime,
        total: filteredAnime.length,
        hasMore: input.offset + input.limit < filteredAnime.length
      };
    } catch (error) {
      console.error("Error fetching all anime:", error);
      throw error;
    }
  });