import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import getAnimeByIdRoute from "./routes/anime/getAnimeById/route";
import getEpisodesRoute from "./routes/anime/getEpisodes/route";
import getAllAnimeRoute from "./routes/anime/getAllAnime/route";
import getAiringAnimeRoute from "./routes/anime/getAiringAnime/route";
import getHomeDataRoute from "./routes/anime/getHomeData/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  anime: createTRPCRouter({
    getAnimeById: getAnimeByIdRoute,
    getEpisodes: getEpisodesRoute,
    getAllAnime: getAllAnimeRoute,
    getAiringAnime: getAiringAnimeRoute,
    getHomeData: getHomeDataRoute,
  }),
});

export type AppRouter = typeof appRouter;