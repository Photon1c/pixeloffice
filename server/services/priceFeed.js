"use strict";
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
exports.fetchCurrentPrice = fetchCurrentPrice;
exports.fetchPriceForDate = fetchPriceForDate;
function fetchCurrentPrice(symbol) {
    return __awaiter(this, void 0, void 0, function () {
        var url, res, data, meta, _a;
        var _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    _e.trys.push([0, 3, , 4]);
                    url = "https://query1.finance.yahoo.com/v8/finance/chart/".concat(encodeURIComponent(symbol), "?range=1d&interval=1d");
                    return [4 /*yield*/, fetch(url, {
                            headers: { "User-Agent": "PixelOffice/1.0" },
                        })];
                case 1:
                    res = _e.sent();
                    if (!res.ok)
                        return [2 /*return*/, null];
                    return [4 /*yield*/, res.json()];
                case 2:
                    data = _e.sent();
                    meta = (_d = (_c = (_b = data === null || data === void 0 ? void 0 : data.chart) === null || _b === void 0 ? void 0 : _b.result) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.meta;
                    if (!(meta === null || meta === void 0 ? void 0 : meta.regularMarketPrice))
                        return [2 /*return*/, null];
                    return [2 /*return*/, {
                            symbol: symbol.toUpperCase(),
                            price: meta.regularMarketPrice,
                            date: new Date().toISOString().split("T")[0],
                            source: "yahoo_finance",
                        }];
                case 3:
                    _a = _e.sent();
                    return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function fetchPriceForDate(symbol, date) {
    return __awaiter(this, void 0, void 0, function () {
        var targetDate, period1, period2, url, res, data, result, timestamps, closes, targetTs, bestIdx, bestDiff, i, diff, price, actualDate, _a;
        var _b, _c, _d, _e, _f;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    _g.trys.push([0, 3, , 4]);
                    targetDate = new Date(date);
                    period1 = Math.floor(targetDate.getTime() / 1000) - 86400 * 5;
                    period2 = Math.floor(targetDate.getTime() / 1000) + 86400;
                    url = "https://query1.finance.yahoo.com/v8/finance/chart/".concat(encodeURIComponent(symbol), "?period1=").concat(period1, "&period2=").concat(period2, "&interval=1d");
                    return [4 /*yield*/, fetch(url, {
                            headers: { "User-Agent": "PixelOffice/1.0" },
                        })];
                case 1:
                    res = _g.sent();
                    if (!res.ok)
                        return [2 /*return*/, null];
                    return [4 /*yield*/, res.json()];
                case 2:
                    data = _g.sent();
                    result = (_c = (_b = data === null || data === void 0 ? void 0 : data.chart) === null || _b === void 0 ? void 0 : _b.result) === null || _c === void 0 ? void 0 : _c[0];
                    timestamps = result === null || result === void 0 ? void 0 : result.timestamp;
                    closes = (_f = (_e = (_d = result === null || result === void 0 ? void 0 : result.indicators) === null || _d === void 0 ? void 0 : _d.quote) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.close;
                    if (!(timestamps === null || timestamps === void 0 ? void 0 : timestamps.length) || !(closes === null || closes === void 0 ? void 0 : closes.length))
                        return [2 /*return*/, null];
                    targetTs = targetDate.getTime() / 1000;
                    bestIdx = 0;
                    bestDiff = Math.abs(timestamps[0] - targetTs);
                    for (i = 1; i < timestamps.length; i++) {
                        diff = Math.abs(timestamps[i] - targetTs);
                        if (diff < bestDiff) {
                            bestDiff = diff;
                            bestIdx = i;
                        }
                    }
                    price = closes[bestIdx];
                    if (price == null)
                        return [2 /*return*/, null];
                    actualDate = new Date(timestamps[bestIdx] * 1000).toISOString().split("T")[0];
                    return [2 /*return*/, {
                            symbol: symbol.toUpperCase(),
                            price: price,
                            date: actualDate,
                            source: "yahoo_finance",
                        }];
                case 3:
                    _a = _g.sent();
                    return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    });
}
