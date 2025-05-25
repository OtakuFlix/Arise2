export interface Anime {
  aid: number;
  name: string;
  jname: string;
  poster: string;
  banner: string;
  cname: string;
  cid: string;
  let: string;
  trailer: string;
  genre: string;
  type: string;
  status: string;
  airing: string;
  studio: string;
  producers: string;
  total_episodes: number;
  pg_rating: string;
  sanime: string;
  imdb_rating: number;
  imdb_votes: number;
  synopsis: string;
  ranime: string[];
  
  // Processed fields
  posters?: string[];
  banners?: string[];
  providers?: string[];
  providerIds?: string[];
  trailers?: string[];
  genres?: string[];
  producersList?: string[];
  similarAnime?: string[];
  isAiring?: boolean;
}

// For local app state
export interface LocalAnime {
  id: string;
  title: string;
  coverImage: string;
  bannerImage: string;
  description: string;
  genres: string[];
  rating: number | string;
  episodes: number;
  status: string;
  studio: string;
  duration?: string;
  quality?: string;
  vdo?: string; // YouTube embed URL
  // Add these properties to make it compatible with Top10Anime when needed
  rank?: number;
  name?: string;
  jname?: string;
  poster?: string;
}

export interface ServerInfo {
  provider: string;
  file_code: string;
}

export interface Episode {
  id: string;
  title: string;
  file_code: string;
  provider: string;
  number: number;
  thumbnail?: string;
  duration?: number;
  synopsis?: string;
  servers?: ServerInfo[];
}

export interface VideoProvider {
  name: string;
  id: string;
  buildEmbedUrl: (fileCode: string) => string;
}

export interface TVDBEpisodeData {
  title: string;
  synopsis: string;
  thumbnail: string;
}

export const videoProviders: Record<string, VideoProvider> = {
  Filemoon: {
    name: "Filemoon",
    id: "filemoon",
    buildEmbedUrl: (fileCode: string) => `https://filemoon.in/e/${fileCode}`
  },
  RpmShare: {
    name: "RpmShare",
    id: "rpmshare",
    buildEmbedUrl: (fileCode: string) => `https://aniflix.rpmvip.com/#${fileCode}`
  }
};