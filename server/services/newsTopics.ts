/**
 * News Topic Service for Pixel Office Cooler Sessions
 * 
 * Fetches current news topics to spark interesting conversations
 * among the office agents.
 */

const NEWS_API_URL = process.env.NEWS_API_URL || "https://newsapi.org/v2/top-headlines";
const NEWS_API_KEY = process.env.NEWS_API || process.env.NEWS_API_KEY || "";

interface NewsTopic {
  title: string;
  category: string;
  source: string;
}

// Import GitHub functions for repo-based topics
import { 
  fetchRecentCommits, 
  fetchRecentPRs, 
  fetchRecentIssues, 
  extractRepoInfo 
} from "./repoQuestionHandler.js";

const FALLBACK_TOPICS: NewsTopic[] = [
  // Workspace and project topics (night shift focus)
  { title: "Reviewing the latest workspace files from hermitclaw's research and projects folders - what discoveries were made?", category: "workspace", source: "office" },
  { title: "Analyzing GitHub activity across our repositories - what new PRs, issues, and deployments happened today?", category: "github", source: "office" },
  { title: "The team just shipped a new feature - discussing impact on users and next steps", category: "project", source: "office" },
  // Standard news topics
  { title: "Latest developments in artificial intelligence and how they're transforming everyday work", category: "tech", source: "trending" },
  { title: "New climate change initiatives from major tech companies aiming for carbon neutrality", category: "science", source: "trending" },
  { title: "NASA's latest Mars rover discoveries and what they mean for future space exploration", category: "science", source: "trending" },
  { title: "How remote work trends are reshaping office culture and team collaboration in 2026", category: "workplace", source: "office" },
  { title: "Major tech companies announcing new sustainability initiatives to reduce electronic waste", category: "tech", source: "trending" },
  { title: "New workplace health and wellness programs gaining popularity in Fortune 500 companies", category: "wellness", source: "office" },
  { title: "Breakthrough in solar panel efficiency could revolutionize renewable energy adoption", category: "science", source: "trending" },
  { title: "Rising cybersecurity threats targeting remote workers and best practices to stay safe", category: "tech", source: "trending" },
  { title: "Companies implementing four-day work weeks and the surprising results on productivity", category: "wellness", source: "office" },
  { title: "AI-powered collaboration tools that are changing how teams work together remotely", category: "tech", source: "office" },
  { title: "Quantum computing reaching new milestones with practical business applications emerging", category: "science", source: "trending" },
  { title: "Home robots becoming more affordable and mainstream in everyday household tasks", category: "tech", source: "trending" },
];

const OFFICE_TOPICS: NewsTopic[] = [
  { title: "Redesigning the open office layout - should we add more collaboration zones or quiet focus pods?", category: "office", source: "office" },
  { title: "New ergonomic furniture options for the team - standing desks, balance chairs, or treadmill workstations?", category: "office", source: "office" },
  { title: "Office plant wall installation - improving air quality and aesthetics in the workspace", category: "office", source: "office" },
  { title: "Let's talk about the kitchen redesign - new espresso machine, snack bar, or a full renovation?", category: "office", source: "office" },
  { title: "Conference room AV upgrade - what display and camera setup would improve our standups?", category: "office", source: "office" },
  { title: "Interior design theme poll: cyberpunk minimalist, cozy library, or plant-filled greenhouse?", category: "office", source: "office" },
  { title: "Quiet room proposal - creating a noise-free zone for deep work near the archives section", category: "office", source: "office" },
  { title: "Wall mural ideas for the lobby - should we showcase our product roadmap or team achievements?", category: "office", source: "office" },
  { title: "Lighting upgrade discussion - warm ambient vs bright task lighting for the open office area", category: "office", source: "office" },
  { title: "Reorganizing the data nodes section for better cable management and server access", category: "office", source: "office" },
  { title: "Adding a nap pod or relaxation corner - where should it go and what should it include?", category: "office", source: "office" },
  { title: "Whiteboard wall expansion - turning the hallway into an ideas corridor for spontaneous brainstorming", category: "office", source: "office" },
  { title: "New color scheme for the executive suite - modern slate, warm earth tones, or classic navy?", category: "office", source: "office" },
  { title: "Acoustic panel installation to reduce echo in the war room during intense planning sessions", category: "office", source: "office" },
  { title: "Bringing the gym area to life - should we add a ping pong table, climbing wall, or yoga mats?", category: "office", source: "office" },
  { title: "Digital signage for mission control - real-time dashboards or rotating team achievements?", category: "office", source: "office" },
  { title: "Redesigning the archives with better shelving, reading nooks, and a digitization station", category: "office", source: "office" },
  { title: "Should we convert the unused corner into a podcast/recording booth for team updates?", category: "office", source: "office" },
  { title: "Smart blinds for the windows - automated light control to reduce glare on monitors", category: "office", source: "office" },
  { title: "The great desk rearrangement - team clusters by project or by function for better synergy?", category: "office", source: "office" },
];

const RSS_FEEDS = [
  { url: "https://feeds.bbci.co.uk/news/technology/rss.xml", name: "BBC Tech" },
  { url: "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml", name: "NY Times Tech" },
];

let cachedTopics: NewsTopic[] = [];
let lastFetchTime = 0;
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes

async function fetchFromRSS(): Promise<NewsTopic[]> {
  for (const feed of RSS_FEEDS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(feed.url, { signal: controller.signal });
      clearTimeout(timeout);
      
      if (!response.ok) continue;
      
      const xml = await response.text();
      const items: string[] = [];
      const itemRegex = /<item[^>]*>[\s\S]*?<title[^>]*>([^<]+)<\/title>/gi;
      let match;
      
      while ((match = itemRegex.exec(xml)) !== null && items.length < 5) {
        const title = match[1].trim();
        if (title && !title.includes("[Removed]")) {
          items.push(title);
        }
      }
      
      if (items.length > 0) {
        console.log(`[NewsTopics] Fetched ${items.length} topics from RSS: ${feed.name}`);
        return items.map(title => ({
          title: title.replace(/[^\w\s,.-]/g, "").trim(),
          category: "news",
          source: feed.name
        }));
      }
    } catch (error) {
      console.log(`[NewsTopics] RSS fetch from ${feed.name} failed: ${error instanceof Error ? error.message : "unknown"}`);
    }
  }
  return [];
}

async function fetchFromWebSearch(): Promise<NewsTopic[]> {
  try {
    const searchTerms = ["technology news", "science breakthroughs", "artificial intelligence", "climate change"];
    const topics: NewsTopic[] = [];
    
    for (const term of searchTerms) {
      const url = `https://duckduckgo.com/?q=${encodeURIComponent(term)}&format=rss`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      
      try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        
        if (response.ok) {
          const xml = await response.text();
          const resultsRegex = /<link>([^<]+)<\/link>/gi;
          let match;
          let count = 0;
          
          while ((match = resultsRegex.exec(xml)) !== null && count < 2) {
            if (match[1] && !match[1].includes("duckduckgo")) {
              topics.push({
                title: `${term}: ${new URL(match[1]).hostname}`,
                category: "news",
                source: "web"
              });
              count++;
            }
          }
        }
      } catch {
        // Continue to next term
      }
      
      if (topics.length >= 3) break;
    }
    
    if (topics.length > 0) {
      console.log(`[NewsTopics] Fetched ${topics.length} topics from web search`);
      return topics;
    }
  } catch (error) {
    console.log(`[NewsTopics] Web search failed: ${error instanceof Error ? error.message : "unknown"}`);
  }
  
  return [];
}

async function fetchFromGitHub(repoOverride?: string): Promise<NewsTopic[]> {
  const repoInfo = repoOverride 
    ? { owner: repoOverride.split('/')[0], repo: repoOverride.split('/')[1] }
    : extractRepoInfo({});
  
  if (repoInfo.owner === "unknown" || repoInfo.repo === "unknown") {
    console.log(`[NewsTopics] GitHub: No valid repo configured (SAFE_SCRUM_REPO)`);
    return [];
  }
  
  const topics: NewsTopic[] = [];
  
  try {
    // Fetch recent commits
    const commits = await fetchRecentCommits({
      owner: repoInfo.owner,
      repo: repoInfo.repo,
      limit: 3
    });
    
    if (commits && commits.length > 0) {
      for (const commit of commits) {
        topics.push({
          title: `Latest commit: ${commit.message} (by ${commit.author})`,
          category: "github",
          source: "github_commits"
        });
      }
      console.log(`[NewsTopics] Fetched ${commits.length} commit topics from GitHub`);
    }
  } catch (error) {
    console.log(`[NewsTopics] GitHub commits fetch failed: ${error instanceof Error ? error.message : "unknown"}`);
  }
  
  try {
    // Fetch recent PRs
    const prs = await fetchRecentPRs({
      owner: repoInfo.owner,
      repo: repoInfo.repo,
      state: "open",
      limit: 3
    });
    
    if (prs && prs.length > 0) {
      for (const pr of prs) {
        topics.push({
          title: `New PR #${pr.number}: ${pr.title} (by ${pr.author})`,
          category: "github",
          source: "github_prs"
        });
      }
      console.log(`[NewsTopics] Fetched ${prs.length} PR topics from GitHub`);
    }
  } catch (error) {
    console.log(`[NewsTopics] GitHub PRs fetch failed: ${error instanceof Error ? error.message : "unknown"}`);
  }
  
  try {
    // Fetch recent issues
    const issues = await fetchRecentIssues({
      owner: repoInfo.owner,
      repo: repoInfo.repo,
      state: "open",
      limit: 3
    });
    
    if (issues && issues.length > 0) {
      for (const issue of issues) {
        topics.push({
          title: `Issue #${issue.number}: ${issue.title} (by ${issue.author})`,
          category: "github",
          source: "github_issues"
        });
      }
      console.log(`[NewsTopics] Fetched ${issues.length} issue topics from GitHub`);
    }
  } catch (error) {
    console.log(`[NewsTopics] GitHub issues fetch failed: ${error instanceof Error ? error.message : "unknown"}`);
  }
  
  return topics;
}

async function fetchFromNewsSources(): Promise<NewsTopic[]> {
  const now = Date.now();
  const topics: NewsTopic[] = [];

  if (NEWS_API_KEY) {
    const categories = ["technology", "business", "science"];
    try {
      for (const category of categories) {
        const response = await Promise.race([
          fetch(`${NEWS_API_URL}?country=us&category=${category}&apiKey=${NEWS_API_KEY}&pageSize=5`),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("timeout")), 5000)
          )
        ]) as Response;

        if (response.ok) {
          const data = await response.json() as { articles?: Array<{ title?: string; source?: { name?: string } }> };

          if (data.articles && data.articles.length > 0) {
            const categoryTopics = data.articles
              .filter(a => a.title && a.title !== "[Removed]")
              .slice(0, 3)
              .map(a => ({
                title: a.title!.replace(/[^\w\s,.-]/g, "").trim(),
                category: category,
                source: a.source?.name || "news"
              }));

            topics.push(...categoryTopics);
            if (topics.length >= 5) break;
          }
        }
      }

      if (topics.length > 0) {
        console.log(`[NewsTopics] Fetched ${topics.length} topics from NewsAPI`);
        return topics;
      }
    } catch (error) {
      console.log(`[NewsTopics] NewsAPI fetch failed: ${error instanceof Error ? error.message : "unknown"}`);
    }
  }

  const rssTopics = await fetchFromRSS();
  if (rssTopics.length > 0) {
    console.log(`[NewsTopics] Fetched ${rssTopics.length} topics from RSS`);
    return rssTopics;
  }

  const webTopics = await fetchFromWebSearch();
  if (webTopics.length > 0) {
    console.log(`[NewsTopics] Fetched ${webTopics.length} topics from web search`);
    return webTopics;
  }

  return [];
}

function getFallbackTopics(): NewsTopic[] {
  const shuffled = [...FALLBACK_TOPICS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 5);
}

function fetchOfficeTopics(): NewsTopic[] {
  const shuffled = [...OFFICE_TOPICS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 8);
}

export async function fetchNewsTopics(source: string = "auto", repo?: string): Promise<NewsTopic[]> {
  const now = Date.now();

  if (cachedTopics.length > 0 && now - lastFetchTime < CACHE_DURATION_MS) {
    return cachedTopics;
  }

  if (source === "github") {
    const githubTopics = await fetchFromGitHub(repo);
    if (githubTopics.length > 0) {
      cachedTopics = githubTopics;
      lastFetchTime = now;
      console.log(`[NewsTopics] Using ${githubTopics.length} GitHub topics (source=github)`);
      return cachedTopics;
    }
    cachedTopics = getFallbackTopics();
    lastFetchTime = now;
    console.log(`[NewsTopics] No GitHub topics, using fallback`);
    return cachedTopics;
  }

  if (source === "news") {
    const newsTopics = await fetchFromNewsSources();
    if (newsTopics.length > 0) {
      cachedTopics = newsTopics;
      lastFetchTime = now;
      return cachedTopics;
    }
    cachedTopics = getFallbackTopics();
    lastFetchTime = now;
    return cachedTopics;
  }

  if (source === "office") {
    cachedTopics = fetchOfficeTopics();
    lastFetchTime = now;
    console.log(`[NewsTopics] Using ${cachedTopics.length} office topics`);
    return cachedTopics;
  }

  // auto: Try GitHub topics first
  const githubTopics = await fetchFromGitHub(repo);
  if (githubTopics.length > 0) {
    cachedTopics = githubTopics;
    lastFetchTime = now;
    console.log(`[NewsTopics] Using ${githubTopics.length} GitHub topics`);
    return cachedTopics;
  }

  const newsTopics = await fetchFromNewsSources();
  if (newsTopics.length > 0) {
    cachedTopics = newsTopics;
    lastFetchTime = now;
    return cachedTopics;
  }

  cachedTopics = getFallbackTopics();
  lastFetchTime = now;
  console.log(`[NewsTopics] Using fallback topics`);
  return cachedTopics;
}

export function getRandomTopic(): string {
  const topics = cachedTopics.length > 0 ? cachedTopics : FALLBACK_TOPICS;
  const topic = topics[Math.floor(Math.random() * topics.length)];
  return topic.title;
}

export function getTopicForConversation(): string {
  const topic = getRandomTopic();
  console.log(`[NewsTopics] Selected topic: ${topic}`);
  return topic;
}

export async function getTopicsForSession(source: string = "auto", repo?: string): Promise<string[]> {
  const topics = await fetchNewsTopics(source, repo);
  return topics.map(t => t.title);
}
