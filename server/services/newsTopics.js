"use strict";
/**
 * News Topic Service for Pixel Office Cooler Sessions
 *
 * Fetches current news topics to spark interesting conversations
 * among the office agents.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchNewsTopics = fetchNewsTopics;
exports.getRandomTopic = getRandomTopic;
exports.getTopicForConversation = getTopicForConversation;
exports.getTopicsForSession = getTopicsForSession;
var NEWS_API_URL = process.env.NEWS_API_URL || "https://newsapi.org/v2/top-headlines";
var NEWS_API_KEY = process.env.NEWS_API || process.env.NEWS_API_KEY || "";
var FALLBACK_TOPICS = [
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
var RSS_FEEDS = [
    { url: "https://feeds.bbci.co.uk/news/technology/rss.xml", name: "BBC Tech" },
    { url: "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml", name: "NY Times Tech" },
];
var cachedTopics = [];
var lastFetchTime = 0;
var CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes
function fetchFromRSS() {
    return __awaiter(this, void 0, void 0, function () {
        var _loop_1, _i, RSS_FEEDS_1, feed, state_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _loop_1 = function (feed) {
                        var controller_1, timeout, response, xml, items, itemRegex, match, title, error_1;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 3, , 4]);
                                    controller_1 = new AbortController();
                                    timeout = setTimeout(function () { return controller_1.abort(); }, 5000);
                                    return [4 /*yield*/, fetch(feed.url, { signal: controller_1.signal })];
                                case 1:
                                    response = _b.sent();
                                    clearTimeout(timeout);
                                    if (!response.ok)
                                        return [2 /*return*/, "continue"];
                                    return [4 /*yield*/, response.text()];
                                case 2:
                                    xml = _b.sent();
                                    items = [];
                                    itemRegex = /<item[^>]*>[\s\S]*?<title[^>]*>([^<]+)<\/title>/gi;
                                    match = void 0;
                                    while ((match = itemRegex.exec(xml)) !== null && items.length < 5) {
                                        title = match[1].trim();
                                        if (title && !title.includes("[Removed]")) {
                                            items.push(title);
                                        }
                                    }
                                    if (items.length > 0) {
                                        console.log("[NewsTopics] Fetched ".concat(items.length, " topics from RSS: ").concat(feed.name));
                                        return [2 /*return*/, { value: items.map(function (title) { return ({
                                                    title: title.replace(/[^\w\s,.-]/g, "").trim(),
                                                    category: "news",
                                                    source: feed.name
                                                }); }) }];
                                    }
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_1 = _b.sent();
                                    console.log("[NewsTopics] RSS fetch from ".concat(feed.name, " failed: ").concat(error_1 instanceof Error ? error_1.message : "unknown"));
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, RSS_FEEDS_1 = RSS_FEEDS;
                    _a.label = 1;
                case 1:
                    if (!(_i < RSS_FEEDS_1.length)) return [3 /*break*/, 4];
                    feed = RSS_FEEDS_1[_i];
                    return [5 /*yield**/, _loop_1(feed)];
                case 2:
                    state_1 = _a.sent();
                    if (typeof state_1 === "object")
                        return [2 /*return*/, state_1.value];
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/, []];
            }
        });
    });
}
function fetchFromWebSearch() {
    return __awaiter(this, void 0, void 0, function () {
        var searchTerms, topics, _loop_2, _i, searchTerms_1, term, state_2, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    searchTerms = ["technology news", "science breakthroughs", "artificial intelligence", "climate change"];
                    topics = [];
                    _loop_2 = function (term) {
                        var url, controller, timeout, response, xml, resultsRegex, match, count, _b;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    url = "https://duckduckgo.com/?q=".concat(encodeURIComponent(term), "&format=rss");
                                    controller = new AbortController();
                                    timeout = setTimeout(function () { return controller.abort(); }, 3000);
                                    _c.label = 1;
                                case 1:
                                    _c.trys.push([1, 5, , 6]);
                                    return [4 /*yield*/, fetch(url, { signal: controller.signal })];
                                case 2:
                                    response = _c.sent();
                                    clearTimeout(timeout);
                                    if (!response.ok) return [3 /*break*/, 4];
                                    return [4 /*yield*/, response.text()];
                                case 3:
                                    xml = _c.sent();
                                    resultsRegex = /<link>([^<]+)<\/link>/gi;
                                    match = void 0;
                                    count = 0;
                                    while ((match = resultsRegex.exec(xml)) !== null && count < 2) {
                                        if (match[1] && !match[1].includes("duckduckgo")) {
                                            topics.push({
                                                title: "".concat(term, ": ").concat(new URL(match[1]).hostname),
                                                category: "news",
                                                source: "web"
                                            });
                                            count++;
                                        }
                                    }
                                    _c.label = 4;
                                case 4: return [3 /*break*/, 6];
                                case 5:
                                    _b = _c.sent();
                                    return [3 /*break*/, 6];
                                case 6:
                                    if (topics.length >= 3)
                                        return [2 /*return*/, "break"];
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, searchTerms_1 = searchTerms;
                    _a.label = 1;
                case 1:
                    if (!(_i < searchTerms_1.length)) return [3 /*break*/, 4];
                    term = searchTerms_1[_i];
                    return [5 /*yield**/, _loop_2(term)];
                case 2:
                    state_2 = _a.sent();
                    if (state_2 === "break")
                        return [3 /*break*/, 4];
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    if (topics.length > 0) {
                        console.log("[NewsTopics] Fetched ".concat(topics.length, " topics from web search"));
                        return [2 /*return*/, topics];
                    }
                    return [3 /*break*/, 6];
                case 5:
                    error_2 = _a.sent();
                    console.log("[NewsTopics] Web search failed: ".concat(error_2 instanceof Error ? error_2.message : "unknown"));
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/, []];
            }
        });
    });
}
function fetchNewsTopics() {
    return __awaiter(this, void 0, void 0, function () {
        var now, categories, _loop_3, _i, categories_1, category, state_3, error_3, rssTopics, webTopics, shuffled;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    now = Date.now();
                    if (cachedTopics.length > 0 && now - lastFetchTime < CACHE_DURATION_MS) {
                        return [2 /*return*/, cachedTopics];
                    }
                    if (!NEWS_API_KEY) return [3 /*break*/, 7];
                    categories = ["technology", "business", "science"];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, , 7]);
                    _loop_3 = function (category) {
                        var response, data, categoryTopics;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0: return [4 /*yield*/, Promise.race([
                                        fetch("".concat(NEWS_API_URL, "?country=us&category=").concat(category, "&apiKey=").concat(NEWS_API_KEY, "&pageSize=5")),
                                        new Promise(function (_, reject) {
                                            return setTimeout(function () { return reject(new Error("timeout")); }, 5000);
                                        })
                                    ])];
                                case 1:
                                    response = _b.sent();
                                    if (!response.ok) return [3 /*break*/, 3];
                                    return [4 /*yield*/, response.json()];
                                case 2:
                                    data = _b.sent();
                                    if (data.articles && data.articles.length > 0) {
                                        categoryTopics = data.articles
                                            .filter(function (a) { return a.title && a.title !== "[Removed]"; })
                                            .slice(0, 3)
                                            .map(function (a) {
                                            var _a;
                                            return ({
                                                title: a.title.replace(/[^\w\s,.-]/g, "").trim(),
                                                category: category,
                                                source: ((_a = a.source) === null || _a === void 0 ? void 0 : _a.name) || "news"
                                            });
                                        });
                                        cachedTopics = __spreadArray(__spreadArray([], cachedTopics, true), categoryTopics, true);
                                        if (cachedTopics.length >= 5)
                                            return [2 /*return*/, "break"];
                                    }
                                    _b.label = 3;
                                case 3: return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, categories_1 = categories;
                    _a.label = 2;
                case 2:
                    if (!(_i < categories_1.length)) return [3 /*break*/, 5];
                    category = categories_1[_i];
                    return [5 /*yield**/, _loop_3(category)];
                case 3:
                    state_3 = _a.sent();
                    if (state_3 === "break")
                        return [3 /*break*/, 5];
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5:
                    if (cachedTopics.length > 0) {
                        lastFetchTime = now;
                        console.log("[NewsTopics] Fetched ".concat(cachedTopics.length, " topics from NewsAPI"));
                        return [2 /*return*/, cachedTopics];
                    }
                    return [3 /*break*/, 7];
                case 6:
                    error_3 = _a.sent();
                    console.log("[NewsTopics] NewsAPI fetch failed: ".concat(error_3 instanceof Error ? error_3.message : "unknown"));
                    return [3 /*break*/, 7];
                case 7: return [4 /*yield*/, fetchFromRSS()];
                case 8:
                    rssTopics = _a.sent();
                    if (rssTopics.length > 0) {
                        cachedTopics = rssTopics;
                        lastFetchTime = now;
                        return [2 /*return*/, cachedTopics];
                    }
                    return [4 /*yield*/, fetchFromWebSearch()];
                case 9:
                    webTopics = _a.sent();
                    if (webTopics.length > 0) {
                        cachedTopics = webTopics;
                        lastFetchTime = now;
                        return [2 /*return*/, cachedTopics];
                    }
                    shuffled = __spreadArray([], FALLBACK_TOPICS, true).sort(function () { return Math.random() - 0.5; });
                    cachedTopics = shuffled.slice(0, 5);
                    lastFetchTime = now;
                    console.log("[NewsTopics] Using fallback topics (cached)");
                    return [2 /*return*/, cachedTopics];
            }
        });
    });
}
function getRandomTopic() {
    var topics = cachedTopics.length > 0 ? cachedTopics : FALLBACK_TOPICS;
    var topic = topics[Math.floor(Math.random() * topics.length)];
    return topic.title;
}
function getTopicForConversation() {
    var topic = getRandomTopic();
    console.log("[NewsTopics] Selected topic: ".concat(topic));
    return topic;
}
function getTopicsForSession() {
    return __awaiter(this, void 0, void 0, function () {
        var topics;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetchNewsTopics()];
                case 1:
                    topics = _a.sent();
                    return [2 /*return*/, topics.map(function (t) { return t.title; })];
            }
        });
    });
}
