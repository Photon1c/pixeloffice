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
exports.isLocalModelAvailable = isLocalModelAvailable;
exports.generateWithLocalModel = generateWithLocalModel;
exports.tryLocalModel = tryLocalModel;
require("dotenv/config");
var OLLAMA_ENDPOINT = process.env.OLLAMA_ENDPOINT || "http://localhost:11434";
var LOCAL_MODEL = process.env.LOCAL_MODEL_NAME || "llama3.2";
var LOCAL_TIMEOUT_MS = parseInt(process.env.LOCAL_TIMEOUT_MS || "8000", 10);
function isLocalModelAvailable() {
    return __awaiter(this, void 0, void 0, function () {
        var response, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, Promise.race([
                            fetch("".concat(OLLAMA_ENDPOINT, "/api/tags")),
                            new Promise(function (_, reject) {
                                return setTimeout(function () { return reject(new Error("timeout")); }, 2000);
                            })
                        ])];
                case 1:
                    response = _b.sent();
                    return [2 /*return*/, response.ok];
                case 2:
                    _a = _b.sent();
                    return [2 /*return*/, false];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function generateWithLocalModel(prompt) {
    return __awaiter(this, void 0, void 0, function () {
        var startTime, controller_1, timeoutId, response, data, content, error_1, latencyMs, errorMessage;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    startTime = Date.now();
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, , 5]);
                    controller_1 = new AbortController();
                    timeoutId = setTimeout(function () { return controller_1.abort(); }, LOCAL_TIMEOUT_MS);
                    return [4 /*yield*/, fetch("".concat(OLLAMA_ENDPOINT, "/api/generate"), {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                model: LOCAL_MODEL,
                                prompt: prompt,
                                stream: false,
                                options: {
                                    temperature: 0.7,
                                    num_predict: 100,
                                },
                            }),
                            signal: controller_1.signal,
                        })];
                case 2:
                    response = _b.sent();
                    clearTimeout(timeoutId);
                    if (!response.ok) {
                        return [2 /*return*/, {
                                success: false,
                                content: "",
                                error: "Ollama API error: ".concat(response.status, " ").concat(response.statusText),
                                latencyMs: Date.now() - startTime,
                            }];
                    }
                    return [4 /*yield*/, response.json()];
                case 3:
                    data = _b.sent();
                    content = ((_a = data.response) === null || _a === void 0 ? void 0 : _a.trim()) || "";
                    if (!content) {
                        return [2 /*return*/, {
                                success: false,
                                content: "",
                                error: "Empty response from local model",
                                latencyMs: Date.now() - startTime,
                            }];
                    }
                    return [2 /*return*/, {
                            success: true,
                            content: content,
                            latencyMs: Date.now() - startTime,
                        }];
                case 4:
                    error_1 = _b.sent();
                    latencyMs = Date.now() - startTime;
                    errorMessage = error_1 instanceof Error ? error_1.message : "Unknown error";
                    return [2 /*return*/, {
                            success: false,
                            content: "",
                            error: errorMessage,
                            latencyMs: latencyMs,
                        }];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function tryLocalModel(prompt) {
    return __awaiter(this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, generateWithLocalModel(prompt)];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, result.success && result.content.length > 0 ? result.content : null];
            }
        });
    });
}
