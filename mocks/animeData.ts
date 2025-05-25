export interface Anime {
  id: string;
  title: string;
  coverImage: string;
  bannerImage: string;
  description: string;
  genres: string[];
  rating: number;
  episodes: number;
  status: 'FINISHED' | 'ONGOING' | 'UPCOMING';
  studio: string;
}

export interface Episode {
  id: string;
  animeId: string;
  number: number;
  title: string;
  thumbnail: string;
  duration: number; // in minutes
  releaseDate: string;
}

export const featuredAnime: Anime[] = [
  {
    id: '1',
    title: 'Demon Slayer',
    coverImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1000',
    bannerImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=2000',
    description: 'Tanjiro Kamado, a kind-hearted boy who sells charcoal for a living, finds his family slaughtered by a demon. To make matters worse, his younger sister Nezuko, the sole survivor, has been transformed into a demon herself. Though devastated by this grim reality, Tanjiro resolves to become a "demon slayer" to turn his sister back into a human and avenge his family.',
    genres: ['Action', 'Fantasy', 'Adventure'],
    rating: 9.2,
    episodes: 26,
    status: 'ONGOING',
    studio: 'Ufotable'
  },
  {
    id: '2',
    title: 'Attack on Titan',
    coverImage: 'https://images.unsplash.com/photo-1541562232579-512a21360020?q=80&w=1000',
    bannerImage: 'https://images.unsplash.com/photo-1541562232579-512a21360020?q=80&w=2000',
    description: 'In a world where humanity lives within cities surrounded by enormous walls that protect them from gigantic man-eating humanoids referred to as Titans, the story follows Eren Yeager, who vows to retake the world after a Titan brings about the destruction of his hometown and the death of his mother.',
    genres: ['Action', 'Drama', 'Fantasy'],
    rating: 9.0,
    episodes: 75,
    status: 'FINISHED',
    studio: 'Wit Studio'
  },
  {
    id: '3',
    title: 'My Hero Academia',
    coverImage: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=1000',
    bannerImage: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=2000',
    description: 'In a world where people with superpowers known as "Quirks" are the norm, Izuku Midoriya has dreams of one day becoming a Hero, despite being bullied by his classmates for not having a Quirk. After being the only one to try and save his childhood bully from a villain, Izuku is given a Quirk by the world\'s greatest Hero, All Might.',
    genres: ['Action', 'Comedy', 'Superhero'],
    rating: 8.5,
    episodes: 113,
    status: 'ONGOING',
    studio: 'Bones'
  },
  {
    id: '4',
    title: 'One Piece',
    coverImage: 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=1000',
    bannerImage: 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=2000',
    description: 'Follows the adventures of Monkey D. Luffy and his pirate crew in order to find the greatest treasure ever left by the legendary Pirate, Gold Roger. The famous mystery treasure named "One Piece".',
    genres: ['Adventure', 'Comedy', 'Fantasy'],
    rating: 8.7,
    episodes: 1000,
    status: 'ONGOING',
    studio: 'Toei Animation'
  },
  {
    id: '5',
    title: 'Jujutsu Kaisen',
    coverImage: 'https://images.unsplash.com/photo-1614583225154-5fcdda07019e?q=80&w=1000',
    bannerImage: 'https://images.unsplash.com/photo-1614583225154-5fcdda07019e?q=80&w=2000',
    description: 'Yuji Itadori is an unnaturally fit high school student living a normal life. But when he consumes the finger of a legendary demon to protect others, he finds himself caught in the world of Curses.',
    genres: ['Action', 'Supernatural', 'Horror'],
    rating: 8.8,
    episodes: 24,
    status: 'ONGOING',
    studio: 'MAPPA'
  },
  {
    id: '6',
    title: 'Spy x Family',
    coverImage: 'https://images.unsplash.com/photo-1601850494422-3cf14624b0b3?q=80&w=1000',
    bannerImage: 'https://images.unsplash.com/photo-1601850494422-3cf14624b0b3?q=80&w=2000',
    description: 'A spy on an undercover mission gets married and adopts a child as part of his cover. His wife and daughter have secrets of their own, and all three must strive to keep together.',
    genres: ['Action', 'Comedy', 'Slice of Life'],
    rating: 8.6,
    episodes: 25,
    status: 'ONGOING',
    studio: 'Wit Studio'
  }
];

export const trendingAnime: Anime[] = [
  {
    id: '7',
    title: 'Chainsaw Man',
    coverImage: 'https://images.unsplash.com/photo-1560972550-aba3456b5564?q=80&w=1000',
    bannerImage: 'https://images.unsplash.com/photo-1560972550-aba3456b5564?q=80&w=2000',
    description: 'Denji has a simple dream—to live a happy and peaceful life, spending time with a girl he likes. This is a far cry from reality, however, as Denji is forced by the yakuza into killing devils in order to pay off his crushing debts.',
    genres: ['Action', 'Horror', 'Supernatural'],
    rating: 8.9,
    episodes: 12,
    status: 'ONGOING',
    studio: 'MAPPA'
  },
  {
    id: '8',
    title: 'Violet Evergarden',
    coverImage: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?q=80&w=1000',
    bannerImage: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?q=80&w=2000',
    description: 'The story revolves around Auto Memory Dolls: people initially employed by a scientist named Dr. Orland to assist his blind wife Mollie in writing her novels, and later hired by other people who needed their services.',
    genres: ['Drama', 'Fantasy', 'Slice of Life'],
    rating: 8.9,
    episodes: 13,
    status: 'FINISHED',
    studio: 'Kyoto Animation'
  },
  {
    id: '9',
    title: 'Fullmetal Alchemist: Brotherhood',
    coverImage: 'https://images.unsplash.com/photo-1612487528505-d2338264c821?q=80&w=1000',
    bannerImage: 'https://images.unsplash.com/photo-1612487528505-d2338264c821?q=80&w=2000',
    description: 'Two brothers search for a Philosopher\'s Stone after an attempt to revive their deceased mother goes wrong and leaves them in damaged physical forms.',
    genres: ['Action', 'Adventure', 'Drama'],
    rating: 9.1,
    episodes: 64,
    status: 'FINISHED',
    studio: 'Bones'
  }
];

export const newReleases: Anime[] = [
  {
    id: '10',
    title: 'Solo Leveling',
    coverImage: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?q=80&w=1000',
    bannerImage: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?q=80&w=2000',
    description: 'In a world where hunters — humans who possess magical abilities — must battle deadly monsters to protect humanity, Sung Jinwoo, the weakest hunter of all mankind, finds himself in a mysterious dungeon.',
    genres: ['Action', 'Adventure', 'Fantasy'],
    rating: 8.7,
    episodes: 12,
    status: 'ONGOING',
    studio: 'A-1 Pictures'
  },
  {
    id: '11',
    title: 'Frieren: Beyond Journey\'s End',
    coverImage: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=1000',
    bannerImage: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=2000',
    description: 'The adventure is over but life goes on for an elf mage just beginning to learn what living is all about. Elf mage Frieren and her courageous fellow adventurers have defeated the Demon King and brought peace to the land.',
    genres: ['Adventure', 'Drama', 'Fantasy'],
    rating: 9.0,
    episodes: 28,
    status: 'ONGOING',
    studio: 'Madhouse'
  }
];

export const allAnime: Anime[] = [...featuredAnime, ...trendingAnime, ...newReleases];

export const episodes: Record<string, Episode[]> = {
  '1': [
    {
      id: 'ep1-1',
      animeId: '1',
      number: 1,
      title: 'Cruelty',
      thumbnail: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=500',
      duration: 24,
      releaseDate: '2019-04-06'
    },
    {
      id: 'ep1-2',
      animeId: '1',
      number: 2,
      title: 'Trainer Sakonji Urokodaki',
      thumbnail: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=500',
      duration: 24,
      releaseDate: '2019-04-13'
    },
    {
      id: 'ep1-3',
      animeId: '1',
      number: 3,
      title: 'Sabito and Makomo',
      thumbnail: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=500',
      duration: 24,
      releaseDate: '2019-04-20'
    },
    {
      id: 'ep1-4',
      animeId: '1',
      number: 4,
      title: 'Final Selection',
      thumbnail: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=500',
      duration: 24,
      releaseDate: '2019-04-27'
    },
    {
      id: 'ep1-5',
      animeId: '1',
      number: 5,
      title: 'My Own Steel',
      thumbnail: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=500',
      duration: 24,
      releaseDate: '2019-05-04'
    }
  ],
  '2': [
    {
      id: 'ep2-1',
      animeId: '2',
      number: 1,
      title: 'To You, 2,000 Years From Now',
      thumbnail: 'https://images.unsplash.com/photo-1541562232579-512a21360020?q=80&w=500',
      duration: 24,
      releaseDate: '2013-04-07'
    },
    {
      id: 'ep2-2',
      animeId: '2',
      number: 2,
      title: 'That Day',
      thumbnail: 'https://images.unsplash.com/photo-1541562232579-512a21360020?q=80&w=500',
      duration: 24,
      releaseDate: '2013-04-14'
    },
    {
      id: 'ep2-3',
      animeId: '2',
      number: 3,
      title: 'A Dim Light Amid Despair',
      thumbnail: 'https://images.unsplash.com/photo-1541562232579-512a21360020?q=80&w=500',
      duration: 24,
      releaseDate: '2013-04-21'
    }
  ],
  '3': [
    {
      id: 'ep3-1',
      animeId: '3',
      number: 1,
      title: 'Izuku Midoriya: Origin',
      thumbnail: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=500',
      duration: 24,
      releaseDate: '2016-04-03'
    },
    {
      id: 'ep3-2',
      animeId: '3',
      number: 2,
      title: 'What It Takes to Be a Hero',
      thumbnail: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=500',
      duration: 24,
      releaseDate: '2016-04-10'
    }
  ]
};

export const genres = [
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Fantasy',
  'Horror',
  'Mystery',
  'Romance',
  'Sci-Fi',
  'Slice of Life',
  'Sports',
  'Supernatural',
  'Thriller'
];

export function getAnimeById(id: string): Anime | undefined {
  return allAnime.find(anime => anime.id === id);
}

export function getEpisodesByAnimeId(animeId: string): Episode[] {
  return episodes[animeId] || [];
}

export function getAnimeByGenre(genre: string): Anime[] {
  return allAnime.filter(anime => anime.genres.includes(genre));
}