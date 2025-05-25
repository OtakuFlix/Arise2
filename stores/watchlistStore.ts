import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocalAnime } from '@/types/anime';

interface WatchlistState {
  watchlist: LocalAnime[];
  addToWatchlist: (anime: LocalAnime) => void;
  removeFromWatchlist: (animeId: string) => void;
  isInWatchlist: (animeId: string) => boolean;
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      watchlist: [],
      addToWatchlist: (anime) => {
        const { watchlist } = get();
        const isAlreadyInWatchlist = watchlist.some((item) => item.id === anime.id);
        
        if (!isAlreadyInWatchlist) {
          set({ watchlist: [...watchlist, anime] });
        }
      },
      removeFromWatchlist: (animeId) => {
        const { watchlist } = get();
        set({ watchlist: watchlist.filter((anime) => anime.id !== animeId) });
      },
      isInWatchlist: (animeId) => {
        const { watchlist } = get();
        return watchlist.some((anime) => anime.id === animeId);
      },
    }),
    {
      name: 'watchlist-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);