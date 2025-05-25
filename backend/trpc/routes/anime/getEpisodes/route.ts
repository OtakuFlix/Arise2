import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { Episode, ServerInfo } from "@/types/anime";

// Define the episode schema
const EpisodeSchema = z.object({
  id: z.string(),
  title: z.string(),
  file_code: z.string(),
  provider: z.string(),
  number: z.number(),
  thumbnail: z.string().optional(),
  duration: z.number().optional(),
  synopsis: z.string().optional(),
});

// RPMShare API response schema
const RPMShareFileSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  file_code: z.string(),
  thumbnail: z.string().optional(),
  length: z.number().optional(), // duration in seconds
  canplay: z.number().optional(),
  views: z.number().optional(),
  uploaded: z.string().optional(),
  link: z.string().optional(),
  public: z.number().optional(),
  fld_id: z.number().optional(),
});

// Updated to match the actual API response structure
const RPMShareResponseSchema = z.object({
  msg: z.string().optional(),
  result: z.object({
    results_total: z.number().optional(),
    pages: z.number().optional(),
    files: z.array(RPMShareFileSchema).optional(),
  }).optional(),
  status: z.string().optional(),
  message: z.string().optional(),
});

// Filemoon API response schema (similar structure)
const FilemoonFileSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  file_code: z.string(),
  thumbnail: z.string().optional(),
  length: z.number().optional(),
  canplay: z.number().optional(),
  views: z.number().optional(),
  uploaded: z.string().optional(),
  link: z.string().optional(),
  public: z.number().optional(),
  fld_id: z.number().optional(),
});

// Updated to match the actual API response structure
const FilemoonResponseSchema = z.object({
  msg: z.string().optional(),
  result: z.object({
    results_total: z.number().optional(),
    pages: z.number().optional(),
    files: z.array(FilemoonFileSchema).optional(),
  }).optional(),
  status: z.string().optional(),
  message: z.string().optional(),
});

// TVDB API response schema (simplified)
const TVDBEpisodeSchema = z.object({
  id: z.number(),
  episodeName: z.string(),
  overview: z.string().optional(),
  airedEpisodeNumber: z.number(),
  filename: z.string().optional(), // Image path
});

// TVDB API integration
let tvdbToken: string | null = null;
let tvShowIdCache: Record<string, string> = {};

// Step 1: Authenticate with TVDB
async function getTVDBToken() {
  try {
    console.log("🔑 Authenticating with TVDB API");
    const apiKey = "04c0d28a-0e77-4b78-9768-d0b2e816165d"; // This would normally be in an environment variable
    
    const response = await fetch("https://api4.thetvdb.com/v4/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apikey: apiKey })
    });

    if (!response.ok) {
      console.error(`❌ TVDB Authentication failed: ${response.status}`);
      return null;
    }

    const data = await response.json();
    console.log("✅ TVDB Authentication successful:", data);
    return data?.data?.token || null;
  } catch (error) {
    console.error("❌ TVDB Authentication error:", error);
    return null;
  }
}

// Step 2: Search for anime on TVDB
async function searchTVDBShow(animeName: string, token: string) {
  try {
    // Extract base anime name & season number
    const baseAnimeName = animeName.replace(/\s*Season\s*\d+/i, '').trim();
    const seasonMatch = animeName.match(/Season\s*(\d+)/i);
    const seasonNumber = seasonMatch ? parseInt(seasonMatch[1]) : 1;
    
    console.log(`🔍 Searching TVDB for anime: "${baseAnimeName}" (Season ${seasonNumber})`);
    
    // Check cache first
    const cacheKey = `${baseAnimeName}-${seasonNumber}`;
    if (tvShowIdCache[cacheKey]) {
      console.log(`✅ Found cached TVDB ID for ${baseAnimeName}: ${tvShowIdCache[cacheKey]}`);
      return tvShowIdCache[cacheKey];
    }
    
    const searchUrl = `https://api4.thetvdb.com/v4/search?query=${encodeURIComponent(baseAnimeName)}&type=series`;
    
    const response = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      console.error(`❌ TVDB Search failed: ${response.status}`);
      return null;
    }

    const data = await response.json();
    console.log(`🔍 TVDB Search results for "${baseAnimeName}":`, data);
    
    if (!data?.data?.length) {
      console.log(`⚠️ No results found for "${baseAnimeName}"`);
      return null;
    }

    // Find the best match
    let bestMatch = null;
    
    // First try to find an exact match
    for (let item of data.data) {
      if (item.name.toLowerCase() === baseAnimeName.toLowerCase()) {
        bestMatch = item;
        break;
      }
    }
    
    // If no exact match, use the first result
    if (!bestMatch) {
      bestMatch = data.data[0];
    }
    
    if (!bestMatch) {
      console.log(`⚠️ No suitable match found for "${baseAnimeName}"`);
      return null;
    }
    
    console.log(`✅ Found TVDB match for "${baseAnimeName}": ${bestMatch.name} (ID: ${bestMatch.tvdb_id})`);
    
    // Cache the result
    tvShowIdCache[cacheKey] = bestMatch.tvdb_id;
    
    return bestMatch.tvdb_id;
  } catch (error) {
    console.error("❌ TVDB Search error:", error);
    return null;
  }
}

// Step 3: Fetch episode details from TVDB
async function getEpisodeDetails(tvShowId: string, seasonNumber: number, episodeNumber: number, token: string) {
  try {
    console.log(`🔍 Fetching episode details for show ID ${tvShowId}, S${seasonNumber}E${episodeNumber}`);
    
    let page = 0;
    let episodeFound = null;
    
    while (!episodeFound) {
      const url = `https://api4.thetvdb.com/v4/series/${tvShowId}/episodes/default?page=${page}`;
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        console.error(`❌ TVDB Episode fetch failed: ${response.status}`);
        return null;
      }
      
      const data = await response.json();
      console.log(`📋 TVDB Episodes response page ${page}:`, data);
      
      if (!data?.data?.episodes?.length) {
        console.log(`⚠️ No episodes found for show ID ${tvShowId}`);
        break;
      }
      
      // Find the episode with matching season and episode number
      episodeFound = data.data.episodes.find(
        (ep: any) => ep.seasonNumber === seasonNumber && ep.number === episodeNumber
      );
      
      if (episodeFound) {
        console.log(`✅ Found episode S${seasonNumber}E${episodeNumber}:`, episodeFound);
        break;
      }
      
      // Check if there are more pages
      if (data.links?.next) {
        page++;
      } else {
        break;
      }
    }
    
    if (!episodeFound) {
      console.log(`⚠️ Episode S${seasonNumber}E${episodeNumber} not found for show ID ${tvShowId}`);
      return null;
    }
    
    console.log(`✅ Found episode details for S${seasonNumber}E${episodeNumber}: "${episodeFound.name}"`);
    
    // Clean up the synopsis by removing source information
    let synopsis = episodeFound.overview || "";
    synopsis = synopsis.replace(/\(Source:.*?\)/g, "").trim();
    
    return {
      title: episodeFound.name || `Episode ${episodeNumber}`,
      synopsis: synopsis,
      thumbnail: episodeFound.image || null
    };
  } catch (error) {
    console.error("❌ TVDB Episode details error:", error);
    return null;
  }
}

// Function to translate Japanese text to English
async function translateText(text: string) {
  // Check if the text is likely in Japanese (based on character range)
  if (!/[\u3040-\u30ff\u4e00-\u9faf\u3400-\u4dbf]/.test(text)) {
    return text; // If the text isn't Japanese, return as is
  }
  
  try {
    console.log(`🔄 Translating Japanese text: "${text.substring(0, 30)}..."`);
    
    const sourceLang = 'ja'; // Japanese
    const targetLang = 'en'; // English
    
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`❌ Translation failed: ${response.status}`);
      return text;
    }
    
    const data = await response.json();
    
    // Return translated text
    const translatedText = data[0][0][0] || text;
    console.log(`✅ Translated to: "${translatedText.substring(0, 30)}..."`);
    
    return translatedText;
  } catch (error) {
    console.error("❌ Translation error:", error);
    return text;  // Return the original text if translation fails
  }
}

// Main function to fetch episode metadata from TVDB
async function fetchTVDBEpisodeData(animeId: string, animeName: string, episodes: Episode[]): Promise<Episode[]> {
  try {
    console.log(`🔍 Attempting to fetch TVDB data for anime "${animeName}" (ID: ${animeId})`);
    
    // Extract season number from anime name
    const seasonMatch = animeName.match(/Season (\d+)/i);
    const seasonNumber = seasonMatch ? parseInt(seasonMatch[1]) : 1;
    
    // Authenticate with TVDB if not already authenticated
    if (!tvdbToken) {
      tvdbToken = await getTVDBToken();
      if (!tvdbToken) {
        console.log("⚠️ Failed to authenticate with TVDB, using fallback data");
        return episodes;
      }
    }
    
    // Search for the anime on TVDB
    const tvShowId = await searchTVDBShow(animeName, tvdbToken);
    if (!tvShowId) {
      console.log("⚠️ Failed to find anime on TVDB, using fallback data");
      return episodes;
    }
    
    // Create a map of episode numbers to TVDB data
    const tvdbDataMap = new Map();
    
    // Fetch episode details for each episode
    for (const episode of episodes) {
      try {
        const episodeDetails = await getEpisodeDetails(tvShowId, seasonNumber, episode.number, tvdbToken);
        
        if (episodeDetails) {
          tvdbDataMap.set(episode.number, episodeDetails);
        }
      } catch (error) {
        console.error(`❌ Error fetching details for episode ${episode.number}:`, error);
      }
    }
    
    // Enhance episodes with TVDB data
    return episodes.map(episode => {
      const tvdbData = tvdbDataMap.get(episode.number);
      
      if (tvdbData) {
        console.log(`✅ Enhanced episode ${episode.number} with TVDB data: "${tvdbData.title}"`);
        return {
          ...episode,
          title: tvdbData.title || episode.title,
          synopsis: tvdbData.synopsis || episode.synopsis,
          thumbnail: tvdbData.thumbnail || episode.thumbnail
        };
      }
      
      return episode;
    });
    
  } catch (error) {
    console.error("❌ Error fetching TVDB data:", error);
    // Return original episodes if TVDB fetch fails
    return episodes;
  }
}

// This function extracts episode number from title
function extractEpisodeNumber(title: string): number {
  console.log(`🔢 Extracting episode number from title: "${title}"`);
  
  // Try to find episode number patterns like "E01", "Episode 1", "Ep 1", "Ep. 1", etc.
  const patterns = [
    /E(\d+)/i,                    // E01, e01
    /Episode\s*(\d+)/i,           // Episode 1, Episode01
    /Ep\s*\.?\s*(\d+)/i,          // Ep 1, Ep.1, Ep01
    /\[(\d+)\]/,                  // [01]
    /\s(\d+)\s/,                  // Space followed by number followed by space
    /\s(\d+)$/,                   // Space followed by number at end
    /^(\d+)/,                     // Number at beginning
    /\D(\d+)$/                    // Non-digit followed by number at end
  ];
  
  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match && match[1]) {
      const episodeNumber = parseInt(match[1], 10);
      console.log(`✅ Extracted episode number ${episodeNumber} using pattern ${pattern}`);
      return episodeNumber;
    }
  }
  
  // If no pattern matches, try to find any number in the title
  const numberMatch = title.match(/\d+/);
  if (numberMatch) {
    const episodeNumber = parseInt(numberMatch[0], 10);
    console.log(`⚠️ Fallback: extracted episode number ${episodeNumber} from first number in title`);
    return episodeNumber;
  }
  
  console.log(`❌ Could not extract episode number from title, defaulting to 0`);
  return 0; // Default if no number found
}

// This function fetches episodes from RPMShare API
async function fetchRPMShareEpisodes(folderId: string): Promise<Episode[]> {
  try {
    const apiKey = "b57f6ad44bf1fb528c57ea90"; // This would normally be in an environment variable
    const url = `https://rpmshare.com/api/file/list?key=${apiKey}&fld_id=${folderId}`;
    
    console.log("🔍 Fetching RPMShare episodes from:", url);
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`❌ RPMShare API error: ${response.status}`);
      throw new Error(`RPMShare API error: ${response.status}`);
    }
    
    const rawData = await response.json();
    console.log("📦 RPMShare API raw response:", JSON.stringify(rawData));
    
    // Check if the response has an error message
    if (rawData.status === "error" || rawData.msg !== "OK") {
      console.error("❌ RPMShare API error:", rawData.message || rawData.msg);
      throw new Error(`RPMShare API error: ${rawData.message || rawData.msg}`);
    }
    
    // Log the structure to help debug
    console.log("🔍 RPMShare response structure:", {
      hasMsg: 'msg' in rawData,
      msgValue: rawData.msg,
      hasResult: 'result' in rawData,
      resultType: rawData.result ? typeof rawData.result : 'undefined',
      hasFiles: rawData.result && 'files' in rawData.result,
      filesCount: rawData.result && rawData.result.files ? rawData.result.files.length : 0
    });
    
    // If files exist, log the first one to see its structure
    if (rawData.result && rawData.result.files && rawData.result.files.length > 0) {
      console.log("📄 First RPMShare file example:", rawData.result.files[0]);
    } else {
      console.log("⚠️ No files found in RPMShare response");
    }
    
    try {
      const data = RPMShareResponseSchema.parse(rawData);
      
      // Check if we have files in the nested result structure
      if (!data.result?.files || data.result.files.length === 0) {
        console.log("⚠️ No files found in RPMShare response after parsing");
        return [];
      }
      
      console.log(`✅ Found ${data.result.files.length} episodes from RPMShare`);
      
      // Map the API response to our episode format
      const episodes = data.result.files.map((file) => {
        // Extract episode number from title
        const episodeNumber = extractEpisodeNumber(file.title);
        
        // Clean up the title
        let cleanTitle = file.title
          .replace(/\.[^/.]+$/, "") // Remove file extension
          .replace(/\d{3,4}p/i, "") // Remove resolution
          .replace(/x265|x264|ESub|PikaHD\.com|\.mkv|\.mp4/gi, "") // Remove encoding info
          .replace(/S\d+E\d+/i, "") // Remove season/episode notation
          .replace(/\s{2,}/g, " ") // Remove extra spaces
          .trim();
        
        console.log(`📺 RPMShare Episode ${episodeNumber}:`, {
          id: `rpm-${file.file_code}`,
          title: cleanTitle || `Episode ${episodeNumber}`,
          file_code: file.file_code,
          thumbnail: file.thumbnail || ""
        });
        
        return {
          id: `rpm-${file.file_code}`,
          title: cleanTitle || `Episode ${episodeNumber}`,
          file_code: file.file_code,
          provider: "RpmShare",
          number: episodeNumber,
          thumbnail: file.thumbnail || "",
          duration: file.length ? Math.floor(file.length / 60) : 24, // Convert seconds to minutes
        };
      });
      
      // Sort episodes by episode number
      episodes.sort((a, b) => a.number - b.number);
      console.log(`🔄 Sorted ${episodes.length} RPMShare episodes by episode number`);
      
      return episodes;
    } catch (parseError) {
      console.error("❌ Error parsing RPMShare response:", parseError);
      console.log("🔍 Failed to parse response with schema, attempting manual extraction");
      
      // Try manual extraction if schema parsing fails
      if (rawData.result && Array.isArray(rawData.result.files)) {
        const episodes = rawData.result.files.map((file: any) => {
          const episodeNumber = extractEpisodeNumber(file.title || "");
          
          let cleanTitle = file.title
            ? file.title
                .replace(/\.[^/.]+$/, "")
                .replace(/\d{3,4}p/i, "")
                .replace(/x265|x264|ESub|PikaHD\.com|\.mkv|\.mp4/gi, "")
                .replace(/S\d+E\d+/i, "")
                .replace(/\s{2,}/g, " ")
                .trim()
            : `Episode ${episodeNumber}`;
          
          return {
            id: `rpm-${file.file_code || "unknown"}`,
            title: cleanTitle,
            file_code: file.file_code || "",
            provider: "RpmShare",
            number: episodeNumber,
            thumbnail: file.thumbnail || "",
            duration: file.length ? Math.floor(file.length / 60) : 24,
          };
        });
        
        // Sort episodes by episode number
        episodes.sort((a, b) => a.number - b.number);
        console.log(`🔄 Sorted ${episodes.length} manually extracted RPMShare episodes by episode number`);
        
        return episodes;
      }
      
      return [];
    }
  } catch (error) {
    console.error("❌ Error fetching from RPMShare:", error);
    return [];
  }
}

// This function fetches episodes from Filemoon API
async function fetchFilemoonEpisodes(folderId: string): Promise<Episode[]> {
  try {
    const apiKey = "42605q5ytvlhmu9eris67"; // This would normally be in an environment variable
    const url = `https://filemoonapi.com/api/file/list?key=${apiKey}&fld_id=${folderId}`;
    
    console.log("🔍 Fetching Filemoon episodes from:", url);
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`❌ Filemoon API error: ${response.status}`);
      throw new Error(`Filemoon API error: ${response.status}`);
    }
    
    const rawData = await response.json();
    console.log("📦 Filemoon API raw response:", JSON.stringify(rawData));
    
    // Check if the response has an error message
    if (rawData.status === "error" || rawData.msg !== "OK") {
      console.error("❌ Filemoon API error:", rawData.message || rawData.msg);
      throw new Error(`Filemoon API error: ${rawData.message || rawData.msg}`);
    }
    
    // Log the structure to help debug
    console.log("🔍 Filemoon response structure:", {
      hasMsg: 'msg' in rawData,
      msgValue: rawData.msg,
      hasResult: 'result' in rawData,
      resultType: rawData.result ? typeof rawData.result : 'undefined',
      hasFiles: rawData.result && 'files' in rawData.result,
      filesCount: rawData.result && rawData.result.files ? rawData.result.files.length : 0
    });
    
    // If files exist, log the first one to see its structure
    if (rawData.result && rawData.result.files && rawData.result.files.length > 0) {
      console.log("📄 First Filemoon file example:", rawData.result.files[0]);
    } else {
      console.log("⚠️ No files found in Filemoon response");
    }
    
    try {
      const data = FilemoonResponseSchema.parse(rawData);
      
      // Check if we have files in the nested result structure
      if (!data.result?.files || data.result.files.length === 0) {
        console.log("⚠️ No files found in Filemoon response after parsing");
        return [];
      }
      
      console.log(`✅ Found ${data.result.files.length} episodes from Filemoon`);
      
      // Map the API response to our episode format
      const episodes = data.result.files.map((file) => {
        // Extract episode number from title
        const episodeNumber = extractEpisodeNumber(file.title);
        
        // Clean up the title
        let cleanTitle = file.title
          .replace(/\.[^/.]+$/, "") // Remove file extension
          .replace(/\d{3,4}p/i, "") // Remove resolution
          .replace(/x265|x264|ESub|PikaHD\.com|\.mkv|\.mp4/gi, "") // Remove encoding info
          .replace(/S\d+E\d+/i, "") // Remove season/episode notation
          .replace(/\s{2,}/g, " ") // Remove extra spaces
          .trim();
        
        console.log(`📺 Filemoon Episode ${episodeNumber}:`, {
          id: `filemoon-${file.file_code}`,
          title: cleanTitle || `Episode ${episodeNumber}`,
          file_code: file.file_code,
          thumbnail: file.thumbnail || ""
        });
        
        return {
          id: `filemoon-${file.file_code}`,
          title: cleanTitle || `Episode ${episodeNumber}`,
          file_code: file.file_code,
          provider: "Filemoon",
          number: episodeNumber,
          thumbnail: file.thumbnail || "",
          duration: file.length ? Math.floor(file.length / 60) : 24, // Convert seconds to minutes
        };
      });
      
      // Sort episodes by episode number
      episodes.sort((a, b) => a.number - b.number);
      console.log(`🔄 Sorted ${episodes.length} Filemoon episodes by episode number`);
      
      return episodes;
    } catch (parseError) {
      console.error("❌ Error parsing Filemoon response:", parseError);
      console.log("🔍 Failed to parse response with schema, attempting manual extraction");
      
      // Try manual extraction if schema parsing fails
      if (rawData.result && Array.isArray(rawData.result.files)) {
        const episodes = rawData.result.files.map((file: any) => {
          const episodeNumber = extractEpisodeNumber(file.title || "");
          
          let cleanTitle = file.title
            ? file.title
                .replace(/\.[^/.]+$/, "")
                .replace(/\d{3,4}p/i, "")
                .replace(/x265|x264|ESub|PikaHD\.com|\.mkv|\.mp4/gi, "")
                .replace(/S\d+E\d+/i, "")
                .replace(/\s{2,}/g, " ")
                .trim()
            : `Episode ${episodeNumber}`;
          
          return {
            id: `filemoon-${file.file_code || "unknown"}`,
            title: cleanTitle,
            file_code: file.file_code || "",
            provider: "Filemoon",
            number: episodeNumber,
            thumbnail: file.thumbnail || "",
            duration: file.length ? Math.floor(file.length / 60) : 24,
          };
        });
        
        // Sort episodes by episode number
        episodes.sort((a, b) => a.number - b.number);
        console.log(`🔄 Sorted ${episodes.length} manually extracted Filemoon episodes by episode number`);
        
        return episodes;
      }
      
      return [];
    }
  } catch (error) {
    console.error("❌ Error fetching from Filemoon:", error);
    return [];
  }
}

// Mock data for episodes - we'll use this when we can't fetch from the APIs
const mockEpisodes: Record<string, Episode[]> = {
  "233": [
    { id: "ep233-1", title: "I Want to be Confessed To: Kaguya Wants to be Confessed To", file_code: "mock_file_code_1", provider: "Filemoon", number: 1, thumbnail: "https://iili.io/3vGIm4j.webp", duration: 24, synopsis: "Kaguya Shinomiya and Miyuki Shirogane are two geniuses who stand atop their prestigious academy's student council, making them the elite among elite. But it's lonely at the top and each has fallen for the other." },
    { id: "ep233-2", title: "I Want to be Heard: Kaguya Wants to be Heard", file_code: "mock_file_code_2", provider: "Filemoon", number: 2, thumbnail: "https://iili.io/3vGIm4j.webp", duration: 24, synopsis: "Kaguya tries to get Miyuki to praise her by having him overhear her singing, but her plan backfires. Later, Chika suggests a game of Twenty Questions that quickly turns into a battle of wits between Kaguya and Miyuki." },
    { id: "ep233-3", title: "I Want to be Invited: Kaguya Wants to be Invited", file_code: "mock_file_code_3", provider: "Filemoon", number: 3, thumbnail: "https://iili.io/3vGIm4j.webp", duration: 24, synopsis: "Miyuki invites everyone but Kaguya to his house to study. Kaguya tries to get herself invited without directly asking. Later, Kaguya and Miyuki compete to see who can make the other look at them first." },
    { id: "ep233-4", title: "I Want to be Visited: Kaguya Wants to be Visited", file_code: "mock_file_code_4", provider: "Filemoon", number: 4, thumbnail: "https://iili.io/3vGIm4j.webp", duration: 24, synopsis: "Kaguya falls ill and hopes that Miyuki will visit her. Meanwhile, Miyuki struggles with whether he should visit her or not." },
    { id: "ep233-5", title: "I Want to be Stopped: Kaguya Wants to be Stopped", file_code: "mock_file_code_5", provider: "Filemoon", number: 5, thumbnail: "https://iili.io/3vGIm4j.webp", duration: 24, synopsis: "Kaguya and Miyuki both end up working on the same project. Kaguya hopes that Miyuki will stop her from overworking herself." },
    { id: "ep233-6", title: "I Want to Offer: Kaguya Wants to Offer", file_code: "mock_file_code_6", provider: "Filemoon", number: 6, thumbnail: "https://iili.io/3vGIm4j.webp", duration: 24, synopsis: "Valentine's Day is approaching, and Kaguya wants to give Miyuki chocolates without making it seem like a romantic gesture." },
    { id: "ep233-7", title: "I Want You to Believe Me: Kaguya Wants to Be Believed", file_code: "mock_file_code_7", provider: "RpmShare", number: 7, thumbnail: "https://iili.io/3vGIm4j.webp", duration: 24, synopsis: "Kaguya tells a lie that spirals out of control. Meanwhile, Miyuki tries to determine if Kaguya is telling the truth or not." },
    { id: "ep233-8", title: "I Want to Be Covered: Kaguya Wants to Be Covered", file_code: "mock_file_code_8", provider: "RpmShare", number: 8, thumbnail: "https://iili.io/3vGIm4j.webp", duration: 24, synopsis: "During a rainstorm, Kaguya hopes that Miyuki will offer to share his umbrella with her." },
    { id: "ep233-9", title: "I Want to Do Something: Kaguya Wants to Do Something", file_code: "mock_file_code_9", provider: "RpmShare", number: 9, thumbnail: "https://iili.io/3vGIm4j.webp", duration: 24, synopsis: "Kaguya and Miyuki both want to do something special for each other but struggle with how to approach it." },
    { id: "ep233-10", title: "I Want to Make You Look Good: Kaguya Wants to Make You Look Good", file_code: "mock_file_code_10", provider: "RpmShare", number: 10, thumbnail: "https://iili.io/3vGIm4j.webp", duration: 24, synopsis: "Kaguya tries to help Miyuki improve his image, while Miyuki does the same for her." },
    { id: "ep233-11", title: "I Can't Hear the Fireworks, Part 1", file_code: "mock_file_code_11", provider: "RpmShare", number: 11, thumbnail: "https://iili.io/3vGIm4j.webp", duration: 24, synopsis: "The summer festival is approaching, and Kaguya wants to see the fireworks with Miyuki. However, her family obligations threaten to keep her from attending." },
    { id: "ep233-12", title: "I Can't Hear the Fireworks, Part 2", file_code: "mock_file_code_12", provider: "RpmShare", number: 12, thumbnail: "https://iili.io/3vGIm4j.webp", duration: 24, synopsis: "Miyuki and the others devise a plan to help Kaguya see the fireworks despite her family's restrictions." },
  ],
  "234": [
    { id: "ep234-1", title: "The Hated Classmate", file_code: "mock_file_code_13", provider: "Filemoon", number: 1, thumbnail: "https://iili.io/3vGVxSI.webp", duration: 24, synopsis: "Cid Kagenou was reborn into a world of magic, where he aspires to become the power in the shadows. He creates an elaborate backstory for his secret organization, Shadow Garden, never expecting it to become real." },
    { id: "ep234-2", title: "Shadow Garden is Born", file_code: "mock_file_code_14", provider: "Filemoon", number: 2, thumbnail: "https://iili.io/3vGVxSI.webp", duration: 24, synopsis: "Cid saves a girl named Alpha and implants false memories about a fictional organization called Shadow Garden. To his surprise, she takes it seriously and begins recruiting others." },
    { id: "ep234-3", title: "A Flock of Black-Winged Followers", file_code: "mock_file_code_15", provider: "Filemoon", number: 3, thumbnail: "https://iili.io/3vGVxSI.webp", duration: 24, synopsis: "Shadow Garden has grown into a real organization with devoted followers. Cid continues his act as their leader while attending school as an ordinary student." },
    { id: "ep234-4", title: "Sadism's Rewards", file_code: "mock_file_code_16", provider: "RpmShare", number: 4, thumbnail: "https://iili.io/3vGVxSI.webp", duration: 24, synopsis: "Cid's elaborate role-playing leads to unexpected consequences as Shadow Garden uncovers a real conspiracy that matches his fictional narrative." },
  ]
};

// Group episodes by number to combine servers
function groupEpisodesByNumber(episodes: Episode[]): Episode[] {
  const episodeMap = new Map<number, Episode>();
  
  episodes.forEach(episode => {
    if (!episodeMap.has(episode.number)) {
      // Create a new episode with servers array
      episodeMap.set(episode.number, {
        ...episode,
        servers: [{
          provider: episode.provider,
          file_code: episode.file_code
        }]
      });
    } else {
      // Add this server to the existing episode
      const existingEpisode = episodeMap.get(episode.number)!;
      
      // Make sure we don't add duplicate servers
      const serverExists = existingEpisode.servers?.some(
        server => server.provider === episode.provider && server.file_code === episode.file_code
      );
      
      if (!serverExists) {
        existingEpisode.servers = [
          ...(existingEpisode.servers || []),
          {
            provider: episode.provider,
            file_code: episode.file_code
          }
        ];
      }
      
      // If the new episode has a thumbnail and the existing one doesn't, use the new thumbnail
      if (episode.thumbnail && !existingEpisode.thumbnail) {
        existingEpisode.thumbnail = episode.thumbnail;
      }
      
      // If the new episode has a synopsis and the existing one doesn't, use the new synopsis
      if (episode.synopsis && !existingEpisode.synopsis) {
        existingEpisode.synopsis = episode.synopsis;
      }
    }
  });
  
  // Convert map to array and sort by episode number
  return Array.from(episodeMap.values()).sort((a, b) => a.number - b.number);
}

// This function attempts to fetch episodes from the APIs, falling back to mock data
async function fetchEpisodesFromProviders(animeId: string, animeName: string, providerIds: string[], providers: string[]): Promise<Episode[]> {
  try {
    let allEpisodes: Episode[] = [];
    
    console.log(`🔄 Fetching episodes for anime ID ${animeId} (${animeName})`);
    console.log(`📋 Providers: ${providers.join(', ')}`);
    console.log(`🔑 Provider IDs: ${providerIds.join(', ')}`);
    
    // Try to fetch from each provider
    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i];
      const providerId = providerIds[i];
      
      if (!providerId || providerId.trim() === '') {
        console.log(`⚠️ Skipping provider ${provider} because providerId is empty`);
        continue;
      }
      
      console.log(`🔄 Attempting to fetch episodes from ${provider} with ID ${providerId}`);
      
      if (provider === "RpmShare") {
        const episodes = await fetchRPMShareEpisodes(providerId);
        if (episodes.length > 0) {
          console.log(`✅ Found ${episodes.length} episodes from RpmShare`);
          allEpisodes = [...allEpisodes, ...episodes];
        }
      } else if (provider === "Filemoon") {
        const episodes = await fetchFilemoonEpisodes(providerId);
        if (episodes.length > 0) {
          console.log(`✅ Found ${episodes.length} episodes from Filemoon`);
          allEpisodes = [...allEpisodes, ...episodes];
        }
      }
    }
    
    // Group episodes by number to combine servers
    const groupedEpisodes = groupEpisodesByNumber(allEpisodes);
    console.log(`✅ After grouping, found ${groupedEpisodes.length} unique episodes`);
    
    // If we couldn't fetch any episodes, use mock data
    if (groupedEpisodes.length === 0) {
      console.log(`⚠️ No episodes found from APIs for anime ID ${animeId}, using mock data`);
      return mockEpisodes[animeId] || [];
    }
    
    // Enhance episodes with TVDB data
    const enhancedEpisodes = await fetchTVDBEpisodeData(animeId, animeName, groupedEpisodes);
    
    return enhancedEpisodes;
  } catch (error) {
    console.error("❌ Error fetching episodes:", error);
    // Fallback to mock data
    return mockEpisodes[animeId] || [];
  }
}

export default publicProcedure
  .input(z.object({ 
    animeId: z.string(),
    animeName: z.string().optional(),
    providerIds: z.array(z.string()).optional(),
    providers: z.array(z.string()).optional()
  }))
  .query(async ({ input }) => {
    try {
      console.log("🚀 getEpisodes procedure called with:", input);
      
      // If provider info is provided directly, use it
      if (input.providers && input.providerIds && 
          input.providers.length > 0 && input.providerIds.length > 0) {
        console.log("📋 Using provided provider info:", input.providers, input.providerIds);
        
        // Fetch episodes from providers
        const episodes = await fetchEpisodesFromProviders(
          input.animeId,
          input.animeName || "Unknown Anime",
          input.providerIds,
          input.providers
        );
        
        console.log(`✅ Found ${episodes.length} episodes for anime ${input.animeId}`);
        return episodes;
      }
      
      // Otherwise, get the anime details to extract provider information
      console.log("🔍 Fetching anime data to get provider info");
      const animeResponse = await fetch(`https://raw.githubusercontent.com/OtakuFlix/ADATA/refs/heads/main/anime_data.txt`);
      
      if (!animeResponse.ok) {
        throw new Error(`Failed to fetch anime data: ${animeResponse.status}`);
      }
      
      const animeData = await animeResponse.json();
      const anime = animeData.find((a: any) => a.aid.toString() === input.animeId);
      
      if (!anime) {
        throw new Error(`Anime with ID ${input.animeId} not found`);
      }
      
      // Extract provider information
      const providers = anime.cname.split(", ");
      const providerIds = anime.cid.split(", ");
      
      console.log(`📋 Providers for anime ${input.animeId}:`, providers);
      console.log(`🔑 Provider IDs for anime ${input.animeId}:`, providerIds);
      
      // Fetch episodes from providers
      const episodes = await fetchEpisodesFromProviders(
        input.animeId,
        anime.name || input.animeName || "Unknown Anime",
        providerIds,
        providers
      );
      
      console.log(`✅ Found ${episodes.length} episodes for anime ${input.animeId}`);
      
      return episodes;
    } catch (error) {
      console.error("❌ Error in getEpisodes procedure:", error);
      
      // Fallback to mock data if anything goes wrong
      if (mockEpisodes[input.animeId as keyof typeof mockEpisodes]) {
        console.log(`⚠️ Using mock data for anime ${input.animeId}`);
        return mockEpisodes[input.animeId as keyof typeof mockEpisodes];
      }
      
      console.log(`⚠️ No mock data available for anime ${input.animeId}`);
      throw error;
    }
  });