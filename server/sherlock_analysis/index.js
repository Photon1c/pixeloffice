"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.HybridAnalyzer = exports.RealAnalyzer = exports.MockAnalyzer = exports.DataSource = void 0;
exports.createAnalyzer = createAnalyzer;
var DataSource;
(function (DataSource) {
    DataSource["Real"] = "Real";
    DataSource["Mock"] = "Mock";
    DataSource["Hybrid"] = "Hybrid";
})(DataSource || (exports.DataSource = DataSource = {}));
function generateMockPrice(symbol) {
    var basePrice = Math.random() * 500 + 50;
    var changePct = (Math.random() - 0.5) * 10;
    return {
        symbol: symbol.toUpperCase(),
        current: parseFloat(basePrice.toFixed(2)),
        change_pct: parseFloat(changePct.toFixed(2)),
        volume: Math.floor(Math.random() * 10000000) + 1000000,
    };
}
function generateMockScenarios(symbol, horizon, currentPrice) {
    return [
        {
            scenario: "base",
            horizon: horizon,
            price_target: parseFloat((currentPrice * (1 + (Math.random() - 0.5) * 0.1)).toFixed(2)),
            confidence: parseFloat((0.5 + Math.random() * 0.3).toFixed(2)),
            rationale: "Based on historical trends and current market conditions.",
        },
        {
            scenario: "bull",
            horizon: horizon,
            price_target: parseFloat((currentPrice * (1 + Math.random() * 0.2)).toFixed(2)),
            confidence: parseFloat((0.3 + Math.random() * 0.2).toFixed(2)),
            rationale: "Positive momentum and favorable industry tailwinds.",
        },
        {
            scenario: "bear",
            horizon: horizon,
            price_target: parseFloat((currentPrice * (1 - Math.random() * 0.15)).toFixed(2)),
            confidence: parseFloat((0.3 + Math.random() * 0.2).toFixed(2)),
            rationale: "Macroeconomic headwinds and potential earnings slowdown.",
        },
        {
            scenario: "stress",
            horizon: horizon,
            price_target: parseFloat((currentPrice * (1 - Math.random() * 0.3)).toFixed(2)),
            confidence: parseFloat((0.2 + Math.random() * 0.15).toFixed(2)),
            rationale: "Extreme adverse scenario simulation.",
        },
    ];
}
function generateMockRiskProfile(symbol, currentPrice) {
    var volatility = parseFloat((0.1 + Math.random() * 0.3).toFixed(2));
    var maxDrawdown = parseFloat((volatility * (1 + Math.random())).toFixed(2));
    return {
        volatility: volatility,
        max_drawdown: maxDrawdown > 1 ? 0.99 : maxDrawdown,
        notes: "Mock risk assessment for ".concat(symbol, "."),
    };
}
var MockAnalyzer = /** @class */ (function () {
    function MockAnalyzer() {
    }
    MockAnalyzer.prototype.analyzeAsset = function (symbol, ctx) {
        return __awaiter(this, void 0, void 0, function () {
            var priceSnapshot, scenarios, riskProfile;
            return __generator(this, function (_a) {
                priceSnapshot = generateMockPrice(symbol);
                scenarios = generateMockScenarios(symbol, ctx.horizon, priceSnapshot.current);
                riskProfile = generateMockRiskProfile(symbol, priceSnapshot.current);
                return [2 /*return*/, {
                        symbol: symbol.toUpperCase(),
                        price_snapshot: priceSnapshot,
                        fundamentals: null,
                        technical: null,
                        risk_profile: riskProfile,
                        scenarios: scenarios,
                    }];
            });
        });
    };
    return MockAnalyzer;
}());
exports.MockAnalyzer = MockAnalyzer;
var RealAnalyzer = /** @class */ (function () {
    function RealAnalyzer() {
    }
    RealAnalyzer.prototype.analyzeAsset = function (symbol, ctx) {
        return __awaiter(this, void 0, void 0, function () {
            var priceSnapshot, url, res, data, meta, _a, scenarios, basePrice, multiplier, rationale;
            var _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        priceSnapshot = null;
                        _e.label = 1;
                    case 1:
                        _e.trys.push([1, 5, , 6]);
                        url = "https://query1.finance.yahoo.com/v8/finance/chart/".concat(encodeURIComponent(symbol), "?range=1d&interval=1d");
                        return [4 /*yield*/, fetch(url, { headers: { "User-Agent": "PixelOffice/1.0" } })];
                    case 2:
                        res = _e.sent();
                        if (!res.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, res.json()];
                    case 3:
                        data = _e.sent();
                        meta = (_d = (_c = (_b = data === null || data === void 0 ? void 0 : data.chart) === null || _b === void 0 ? void 0 : _b.result) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.meta;
                        if (meta === null || meta === void 0 ? void 0 : meta.regularMarketPrice) {
                            priceSnapshot = {
                                symbol: symbol.toUpperCase(),
                                current: meta.regularMarketPrice,
                                change_pct: 0,
                                volume: null,
                            };
                        }
                        _e.label = 4;
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        _a = _e.sent();
                        return [3 /*break*/, 6];
                    case 6:
                        scenarios = [];
                        if (ctx.scenario && ctx.scenario !== "base" && priceSnapshot) {
                            basePrice = priceSnapshot.current;
                            multiplier = 1;
                            rationale = "";
                            switch (ctx.scenario) {
                                case "bull":
                                    multiplier = 1 + Math.random() * 0.15;
                                    rationale = "Bullish scenario.";
                                    break;
                                case "bear":
                                    multiplier = 1 - Math.random() * 0.1;
                                    rationale = "Bearish scenario.";
                                    break;
                                case "stress":
                                    multiplier = 1 - Math.random() * 0.2;
                                    rationale = "Stress test.";
                                    break;
                                default: multiplier = 1;
                            }
                            scenarios.push({
                                scenario: ctx.scenario,
                                horizon: ctx.horizon,
                                price_target: parseFloat((basePrice * multiplier).toFixed(2)),
                                confidence: parseFloat((0.4 + Math.random() * 0.3).toFixed(2)),
                                rationale: rationale,
                            });
                        }
                        return [2 /*return*/, {
                                symbol: symbol.toUpperCase(),
                                price_snapshot: priceSnapshot,
                                fundamentals: null,
                                technical: null,
                                risk_profile: priceSnapshot ? { volatility: null, max_drawdown: null, notes: "Real data for ".concat(symbol, ".") } : null,
                                scenarios: scenarios,
                            }];
                }
            });
        });
    };
    return RealAnalyzer;
}());
exports.RealAnalyzer = RealAnalyzer;
var HybridAnalyzer = /** @class */ (function () {
    function HybridAnalyzer() {
        this.mock = new MockAnalyzer();
        this.real = new RealAnalyzer();
    }
    HybridAnalyzer.prototype.analyzeAsset = function (symbol, ctx) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, realResult, mockResult;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, Promise.all([
                            this.real.analyzeAsset(symbol, __assign(__assign({}, ctx), { source: DataSource.Real })),
                            this.mock.analyzeAsset(symbol, __assign(__assign({}, ctx), { source: DataSource.Mock })),
                        ])];
                    case 1:
                        _a = _b.sent(), realResult = _a[0], mockResult = _a[1];
                        return [2 /*return*/, {
                                symbol: realResult.symbol || mockResult.symbol,
                                price_snapshot: realResult.price_snapshot || mockResult.price_snapshot,
                                fundamentals: realResult.fundamentals || mockResult.fundamentals,
                                technical: realResult.technical || mockResult.technical,
                                risk_profile: realResult.risk_profile || mockResult.risk_profile,
                                scenarios: mockResult.scenarios,
                            }];
                }
            });
        });
    };
    return HybridAnalyzer;
}());
exports.HybridAnalyzer = HybridAnalyzer;
function createAnalyzer(source) {
    switch (source) {
        case DataSource.Mock: return new MockAnalyzer();
        case DataSource.Real: return new RealAnalyzer();
        case DataSource.Hybrid: return new HybridAnalyzer();
        default: return new MockAnalyzer();
    }
}
