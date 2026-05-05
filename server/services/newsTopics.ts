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

export async function fetchNewsTopics(): Promise<NewsTopic[]> {
  const now = Date.now();
  
  if (cachedTopics.length > 0 && now - lastFetchTime < CACHE_DURATION_MS) {
    return cachedTopics;
  }
  
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
            
            cachedTopics = [...cachedTopics, ...categoryTopics];
            
            if (cachedTopics.length >= 5) break;
          }
        }
      }
      
      if (cachedTopics.length > 0) {
        lastFetchTime = now;
        console.log(`[NewsTopics] Fetched ${cachedTopics.length} topics from NewsAPI`);
        return cachedTopics;
      }
    } catch (error) {
      console.log(`[NewsTopics] NewsAPI fetch failed: ${error instanceof Error ? error.message : "unknown"}`);
    }
  }
  
  const rssTopics = await fetchFromRSS();
  if (rssTopics.length > 0) {
    cachedTopics = rssTopics;
    lastFetchTime = now;
    return cachedTopics;
  }
  
  const webTopics = await fetchFromWebSearch();
  if (webTopics.length > 0) {
    cachedTopics = webTopics;
    lastFetchTime = now;
    return cachedTopics;
  }
  
  const shuffled = [...FALLBACK_TOPICS].sort(() => Math.random() - 0.5);
  cachedTopics = shuffled.slice(0, 5);
  lastFetchTime = now;
  
  console.log(`[NewsTopics] Using fallback topics (cached)`);
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

export async function getTopicsForSession(): Promise<string[]> {
  const topics = await fetchNewsTopics();
  return topics.map(t => t.title);
}
