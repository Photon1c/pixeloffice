"use strict";
/**
 * Cooler Talk — public API surface.
 *
 * This module provides the high-level functions that a server, UI, or
 * SCRUM system should call. It wraps the internal controller, validation,
 * repair, and persistence modules into a small ergonomic interface.
 *
 * Session mutation:
 *   runNextTurn() mutates the session **in place** (documented contract).
 *   This avoids expensive deep-clones on every turn while keeping the API
 *   simple. Callers who need immutability should serialize before mutating.
 */
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
exports.deserializeSession = exports.serializeSession = exports.createCoolerSession = void 0;
exports.runNextTurn = runNextTurn;
exports.runSession = runSession;
exports.exportSession = exportSession;
var coolerController_1 = require("./coolerController");
var serialize_1 = require("./persistence/serialize");
var config_1 = require("./config");
function cleanModelOutput(raw) {
    return raw
        .replace(/^["']+|["']+$/g, "")
        .replace(/^\*[^*]*\*\s*/g, "")
        .replace(/\n.*/g, "")
        .replace(/In recent news:?\s*/gi, "")
        .replace(/According to recent news:?\s*/gi, "")
        .trim();
}
/**
 * Runs a single conversation turn. Mutates session in-place.
 *
 * If generateFn is provided, calls it up to maxRetries times, validating
 * each response. Falls back to deterministic repair on exhaustion.
 * If generateFn is omitted, uses repair immediately (useful for testing).
 */
function runNextTurn(session, generateFn) {
    return __awaiter(this, void 0, void 0, function () {
        var speaker, intent, utterance, validation, repaired, prompt_1, attempt, raw, cleaned, candidate, result, prevText, cleanTopic, repairText, result;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    speaker = session.participants[session.currentTurn % session.participants.length];
                    intent = (0, coolerController_1.getNextIntent)(session);
                    utterance = null;
                    validation = {
                        valid: false,
                        retries: 0,
                        rejected_reasons: [],
                    };
                    repaired = false;
                    if (!generateFn) return [3 /*break*/, 4];
                    prompt_1 = (0, coolerController_1.buildTurnPrompt)(session, speaker, intent, session.participants);
                    attempt = 0;
                    _b.label = 1;
                case 1:
                    if (!(attempt < config_1.COOLER_CONFIG.maxRetries)) return [3 /*break*/, 4];
                    return [4 /*yield*/, generateFn(prompt_1)];
                case 2:
                    raw = _b.sent();
                    cleaned = cleanModelOutput(raw);
                    candidate = {
                        speaker: speaker,
                        text: cleaned,
                        intent: intent,
                        replyTo: session.currentTurn > 0 ? session.currentTurn - 1 : null,
                    };
                    result = (0, coolerController_1.validateUtterance)(candidate, session, session.utterances);
                    if (result.valid) {
                        utterance = candidate;
                        validation = __assign(__assign({}, result), { retries: attempt + 1 });
                        return [3 /*break*/, 4];
                    }
                    validation = __assign(__assign({}, result), { retries: attempt + 1 });
                    _b.label = 3;
                case 3:
                    attempt++;
                    return [3 /*break*/, 1];
                case 4:
                    if (!utterance) {
                        prevText = (_a = session.utterances[session.utterances.length - 1]) === null || _a === void 0 ? void 0 : _a.text;
                        cleanTopic = session.topic;
                        if (cleanTopic.startsWith("In recent news: ")) {
                            cleanTopic = cleanTopic.substring(15).trim();
                        }
                        repairText = (0, coolerController_1.getRepairText)(intent, cleanTopic, prevText);
                        // Clean the repair text too
                        repairText = repairText.replace(/In recent news:?\s*/gi, "").replace(/According to recent news:?\s*/gi, "").trim();
                        utterance = {
                            speaker: speaker,
                            text: repairText,
                            intent: intent,
                            replyTo: session.currentTurn > 0 ? session.currentTurn - 1 : null,
                        };
                        result = (0, coolerController_1.validateUtterance)(utterance, session, session.utterances);
                        validation = __assign(__assign({}, result), { retries: validation.retries });
                        repaired = true;
                    }
                    session.utterances.push(utterance);
                    session.validationDetails.push(validation);
                    (0, coolerController_1.addUtteranceToHistory)(session, utterance);
                    session.currentTurn++;
                    return [2 /*return*/, { utterance: utterance, validation: validation, repaired: repaired, intent: intent }];
            }
        });
    });
}
/**
 * Runs a complete conversation for up to maxTurns turns.
 */
function runSession(options, maxTurns, generateFn) {
    return __awaiter(this, void 0, void 0, function () {
        var session, i;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    session = (0, coolerController_1.createCoolerSession)(options);
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < maxTurns)) return [3 /*break*/, 4];
                    return [4 /*yield*/, runNextTurn(session, generateFn)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/, session];
            }
        });
    });
}
/**
 * Returns both markdown and structured JSON for a session.
 */
function exportSession(session) {
    return {
        markdown: (0, coolerController_1.sessionToMarkdown)(session),
        json: (0, serialize_1.serializeSession)(session),
    };
}
// Re-export core functions so api.ts can serve as a single entry point
var coolerController_2 = require("./coolerController");
Object.defineProperty(exports, "createCoolerSession", { enumerable: true, get: function () { return coolerController_2.createCoolerSession; } });
var serialize_2 = require("./persistence/serialize");
Object.defineProperty(exports, "serializeSession", { enumerable: true, get: function () { return serialize_2.serializeSession; } });
Object.defineProperty(exports, "deserializeSession", { enumerable: true, get: function () { return serialize_2.deserializeSession; } });
