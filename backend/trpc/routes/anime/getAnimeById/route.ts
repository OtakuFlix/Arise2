import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";

// Define the anime schema
const AnimeSchema = z.object({
  aid: z.number(),
  name: z.string(),
  jname: z.string(),
  poster: z.string(),
  banner: z.string(),
  cname: z.string(),
  cid: z.string(),
  let: z.string(),
  trailer: z.string(),
  genre: z.string(),
  type: z.string(),
  status: z.string(),
  airing: z.string(),
  studio: z.string(),
  producers: z.string(),
  total_episodes: z.number(),
  pg_rating: z.string(),
  sanime: z.string(),
  imdb_rating: z.number(),
  imdb_votes: z.number(),
  synopsis: z.string(),
  ranime: z.array(z.string()),
});

// This function would normally fetch from an external API
async function fetchAnimeData(id: string) {
  try {
    // In a real implementation, we would fetch from the external API
    // For now, we'll use a mock API endpoint
    const response = await fetch(`https://raw.githubusercontent.com/OtakuFlix/ADATA/refs/heads/main/anime_data.txt`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    const anime = data.find((a: any) => a.aid.toString() === id);
    
    if (!anime) {
      throw new Error("Anime not found");
    }
    
    return anime;
  } catch (error) {
    console.error("Error fetching anime data:", error);
    // Fallback to mock data if the API fails
    return mockAnimeData.find(a => a.aid.toString() === id);
  }
}

// Mock data for anime
const mockAnimeData = [
  {
    aid: 233,
    name: "Kaguya-Sama: Love Is War",
    jname: "\u304b\u3050\u3084\u69d8\u306f\u544a\u3089\u305b\u305f\u3044\uff5e\u5929\u624d\u305f\u3061\u306e\u604b\u611b\u982d\u8133\u6226\uff5e",
    poster: "https://iili.io/3vGIm4j.webp, https://iili.io/3vGIZQe.webp, https://iili.io/3vGIeIt.webp",
    banner: "https://iili.io/3vGT2TP.webp, https://iili.io/3vGISBs.webp",
    cname: "Filemoon, RpmShare",
    cid: "296721, 3827",
    let: "K",
    trailer: "https://www.youtube.com/embed/rZ95aZmQu_8?enablejsapi=1&wmode=opaque&autoplay=1&loop=1, https://www.youtube.com/embed/Ti2kJ-GYO68?enablejsapi=1&wmode=opaque&autoplay=1&loop=1",
    genre: "Comedy, Romance",
    type: "TV",
    status: "Finished",
    airing: "false",
    studio: "A-1 Pictures",
    producers: "Aniplex, Mainichi Broadcasting System, Magic Capsule, Shueisha, JR East Marketing & Communications",
    total_episodes: 12,
    pg_rating: "PG-13 - Teens 13 or older",
    sanime: "Karakai Jouzu no Takagi-san, Death Note, Rikei ga Koi ni Ochita no de Shoumei shitemita., School Rumble, Gekkan Shoujo Nozaki-kun, Spy x Family, Toradora!, Komi-san wa, Comyushou desu., Ouran Koukou Host Club, Kaichou wa Maid-sama!, [Oshi no Ko], Yahari Ore no Seishun Love Comedy wa Machigatteiru., Masamune-kun no Revenge, Kareshi Kanojo no Jijou, Kakegurui, Horimiya, Tsurezure Children, Sayonara Zetsubou Sensei, Fantasy Bishoujo Juniku Ojisan to, Special A, Wotaku ni Koi wa Muzukashii, Shokugeki no Souma, Asobi Asobase, Sono Bisque Doll wa Koi wo Suru, Tomo-chan wa Onnanoko!, Saiki Kusuo no \u03a8-nan, Seishun Buta Yarou wa Bunny Girl Senpai no Yume wo Minai, Kono Subarashii Sekai ni Shukufuku wo!, K-On!, Gamers!, Kishuku Gakkou no Juliet, Danshi Koukousei no Nichijou, High Score Girl, Ijiranaide, Nagatoro-san, Sakamoto desu ga?, Oroka na Tenshi wa Akuma to Odoru, Nisekoi, Seitokai no Ichizon, Kono Bijutsu-bu ni wa Mondai ga Aru!, Romantic Killer, Working!!!, Tonikaku Kawaii, Kimi no Koto ga Daidaidaidaidaisuki na 100-nin no Kanojo 2nd Season, Bakemonogatari, Blend S, Tensai Ouji no Akaji Kokka Saisei Jutsu, Kuroiwa Medaka ni Watashi no Kawaii ga Tsuujinai, One Punch Man, Kakkou no Iinazuke, Ookami to Koushinryou, Komi-san wa, Comyushou desu. 2nd Season, Kaguya-hime no Monogatari, Kamisama Hajimemashita, Monogatari Series: Off & Monster Season, Class no Daikirai na Joshi to Kekkon suru Koto ni Natta., Make Heroine ga Oosugiru!, Medaka Box, Yumemiru Danshi wa Genjitsushugisha, Kobayashi-san Chi no Maid Dragon S, Ore wo Suki nano wa Omae dake ka yo, 4-nin wa Sorezore Uso wo Tsuku, Boku no Kokoro no Yabai Yatsu, Minami-ke, Code Geass: Hangyaku no Lelouch, Nanatsu no Taizai: Imashime no Fukkatsu, Ojisan to Marshmallow, Lovely\u2605Complex, Boku wa Tomodachi ga Sukunai, Yakusoku no Neverland, Hajimete no Gal, Love Lab, Nodame Cantabile, Araburu Kisetsu no Otome-domo yo., Asagao to Kase-san., Chuunibyou demo Koi ga Shitai!, Baka to Test to Shoukanjuu, Tokidoki Bosotto Russia-go de Dereru Tonari no Alya-san, Dr. Stone, 5-toubun no Hanayome, Mamahaha no Tsurego ga Motokano datta, Beelzebub-jou no Okinimesu mama., Fruits Basket 1st Season, Amagi Brilliant Park, Seitokai Yakuindomo, Azumanga Daiou The Animation, Taishou Otome Otogibanashi",
    imdb_rating: 8.5,
    imdb_votes: 24197,
    synopsis: "Known for being both brilliant and powerful, Miyuki Shirogane and Kaguya Shinomiya lead the illustrious Shuchiin Academy as near equals. Everyone thinks they\u2019d make a great couple. But with pride and arrogance in ample supply, the only logical move is to trick the other into instigating a date! Who will come out on top in this psychological war where the first move is the only one that matters?\n\n(Source: Funimation)",
    ranime: [
      "Kaguya-sama wa Kokurasetai? Tensai-tachi no Renai Zunousen",
      "Kaguya-sama wa Kokurasetai: Tensai-tachi no Renai Zunousen",
      "He Wei Dao x Hui Yeda Xiaojie Xiangyao Wo Gaobai"
    ]
  },
  {
    aid: 234,
    name: "The Shiunji Family Children",
    jname: "\u7d2b\u96f2\u5bfa\u5bb6\u306e\u5b50\u4f9b\u305f\u3061",
    poster: "https://iili.io/3vGVxSI.webp, https://iili.io/3vGVFta.webp, https://iili.io/3vGMUG4.webp",
    banner: "https://iili.io/3vGVAts.webp, https://iili.io/3vGVd91.webp",
    cname: "Filemoon, RpmShare",
    cid: "296722, 3829",
    let: "T",
    trailer: "https://www.youtube.com/embed/4XVwQr0t_zU?enablejsapi=1&wmode=opaque&autoplay=1&loop=1, https://www.youtube.com/embed/4XVwQr0t_zU?enablejsapi=1&wmode=opaque&autoplay=1&loop=1",
    genre: "Comedy, Romance",
    type: "TV",
    status: "Current",
    airing: "true",
    studio: "Doga Kobo",
    producers: "Lantis, Hakusensha, AT-X, Magic Capsule, Tokyo MX, Kansai Telecasting, BS11, Kadokawa, Bandai Namco Music Live",
    total_episodes: 12,
    pg_rating: "PG-13 - Teens 13 or older",
    sanime: "Megami no Caf\u00e9 Terrace, Kakkou no Iinazuke, 5-toubun no Hanayome, Joukamachi no Dandelion",
    imdb_rating: 7.0,
    imdb_votes: 169,
    synopsis: "The Shiunji family, with their seven children reside in a mansion within Tokyo\u2019s Setagaya ward. The eldest son, Arata, is tired of being pushed around by his five sisters and daydreams of a life without them. That is, until Arata\u2019s father reveals a shocking truth\u2014Arata isn\u2019t biologically related to his sisters! The siblings\u2019 relationships will be tested as they navigate life in this new light.\n\n(Source: Crunchyroll)",
    ranime: [
      "Shiunji-ke no Kodomotachi"
    ]
  }
];

export default publicProcedure
  .input(z.object({ id: z.string() }))
  .query(async ({ input }) => {
    try {
      // Fetch anime data from the API
      const anime = await fetchAnimeData(input.id);
      
      if (!anime) {
        throw new Error("Anime not found");
      }
      
      // Process the data to make it more usable
      const processedAnime = {
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
      };
      
      return processedAnime;
    } catch (error) {
      console.error("Error in getAnimeById procedure:", error);
      throw error;
    }
  });