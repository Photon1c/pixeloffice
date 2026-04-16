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
exports.generateFn = void 0;
exports.resetLocalModelCache = resetLocalModelCache;
var localClient_js_1 = require("../llm/localClient.js");
var llmRouter_js_1 = require("../llm/llmRouter.js");
var MAX_TOKENS = 40;
var TEMPERATURE = 0.7;
var localModelAvailable = null;
/**
 * Check if local model is available (cached)
 */
function checkLocalAvailability() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(localModelAvailable === null)) return [3 /*break*/, 2];
                    return [4 /*yield*/, (0, localClient_js_1.isLocalModelAvailable)()];
                case 1:
                    localModelAvailable = _a.sent();
                    if (localModelAvailable) {
                        console.log("[generateFn] Local model available, will use local-first strategy");
                    }
                    else {
                        console.log("[generateFn] Local model unavailable, using cloud providers");
                    }
                    _a.label = 2;
                case 2: return [2 /*return*/, localModelAvailable];
            }
        });
    });
}
/**
 * Tiered generation strategy:
 * 1. Local (Ollama)
 * 2. Cloud Router (NVIDIA -> OpenAI)
 */
var generateFn = function (prompt) { return __awaiter(void 0, void 0, void 0, function () {
    var localAvailable, localResult, result, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, checkLocalAvailability()];
            case 1:
                localAvailable = _a.sent();
                if (!localAvailable) return [3 /*break*/, 3];
                return [4 /*yield*/, (0, localClient_js_1.tryLocalModel)(prompt)];
            case 2:
                localResult = _a.sent();
                if (localResult !== null && localResult.length > 0) {
                    return [2 /*return*/, localResult];
                }
                _a.label = 3;
            case 3:
                _a.trys.push([3, 5, , 6]);
                return [4 /*yield*/, (0, llmRouter_js_1.routeChat)([{ role: "user", content: prompt }], {
                        max_tokens: MAX_TOKENS,
                        temperature: TEMPERATURE
                    })];
            case 4:
                result = _a.sent();
                return [2 /*return*/, result.content];
            case 5:
                error_1 = _a.sent();
                console.error("[generateFn] Cloud Router error:", error_1);
                return [2 /*return*/, "I'm having trouble thinking right now. Let's try again."];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.generateFn = generateFn;
/**
 * Reset the local model availability cache
 * Useful for testing or when Ollama is restarted
 */
function resetLocalModelCache() {
    localModelAvailable = null;
}
