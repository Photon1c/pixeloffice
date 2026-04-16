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
exports.sessions = exports.tasksV2 = exports.events = exports.pixelState = exports.prefs = exports.memEntries = exports.entities = void 0;
exports.generateTodaysPlan = generateTodaysPlan;
exports.generateTodaysLog = generateTodaysLog;
exports.suggestEveningMicroSprint = suggestEveningMicroSprint;
var config_js_1 = require("./config.js");
function parseValue(value, isJson) {
    if (value === null || value === undefined)
        return null;
    if (isJson && typeof value === "string") {
        try {
            return JSON.parse(value);
        }
        catch (_a) {
            return value;
        }
    }
    return value;
}
function toMySQLPlaceholders(sql) {
    return sql.replace(/\$[0-9]+/g, "?");
}
function stripReturning(sql) {
    return sql.replace(/\s+RETURNING\s+\*\s*$/gim, "");
}
function runInsert(sql_1) {
    return __awaiter(this, arguments, void 0, function (sql, params) {
        var pool, config, isPg, result, result;
        if (params === void 0) { params = []; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, config_js_1.getPool)()];
                case 1:
                    pool = _a.sent();
                    config = (0, config_js_1.getConfig)();
                    isPg = config.db.type === "postgres";
                    if (!isPg) {
                        sql = toMySQLPlaceholders(sql);
                        sql = stripReturning(sql);
                    }
                    if (!isPg) return [3 /*break*/, 3];
                    return [4 /*yield*/, pool.query(sql, params)];
                case 2:
                    result = _a.sent();
                    return [2 /*return*/, { rows: result.rows }];
                case 3: return [4 /*yield*/, pool.query(sql, params)];
                case 4:
                    result = (_a.sent())[0];
                    return [2 /*return*/, { rows: [], insertId: result.insertId }];
            }
        });
    });
}
function runQuery(sql_1) {
    return __awaiter(this, arguments, void 0, function (sql, params) {
        var pool, config, isPg, result, rows;
        if (params === void 0) { params = []; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, config_js_1.getPool)()];
                case 1:
                    pool = _a.sent();
                    config = (0, config_js_1.getConfig)();
                    isPg = config.db.type === "postgres";
                    if (!isPg) {
                        sql = toMySQLPlaceholders(sql);
                        sql = stripReturning(sql);
                    }
                    if (!isPg) return [3 /*break*/, 3];
                    return [4 /*yield*/, pool.query(sql, params)];
                case 2:
                    result = _a.sent();
                    return [2 /*return*/, result.rows];
                case 3: return [4 /*yield*/, pool.query(sql, params)];
                case 4:
                    rows = (_a.sent())[0];
                    return [2 /*return*/, rows];
            }
        });
    });
}
exports.entities = {
    create: function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var sql, metadata, rows, row;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sql = "\n      INSERT INTO entities (type, name, slug, metadata)\n      VALUES ($1, $2, $3, $4)\n      RETURNING *\n    ";
                        metadata = input.metadata ? JSON.stringify(input.metadata) : null;
                        return [4 /*yield*/, runQuery(sql, [input.type, input.name, input.slug || null, metadata])];
                    case 1:
                        rows = _a.sent();
                        row = rows[0];
                        return [2 /*return*/, __assign(__assign({}, row), { metadata: parseValue(row.metadata, true) })];
                }
            });
        });
    },
    getById: function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var rows, row;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, runQuery("SELECT * FROM entities WHERE id = $1", [id])];
                    case 1:
                        rows = _a.sent();
                        if (!rows[0])
                            return [2 /*return*/, null];
                        row = rows[0];
                        return [2 /*return*/, __assign(__assign({}, row), { metadata: parseValue(row.metadata, true) })];
                }
            });
        });
    },
    getBySlug: function (slug) {
        return __awaiter(this, void 0, void 0, function () {
            var rows, row;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, runQuery("SELECT * FROM entities WHERE slug = $1", [slug])];
                    case 1:
                        rows = _a.sent();
                        if (!rows[0])
                            return [2 /*return*/, null];
                        row = rows[0];
                        return [2 /*return*/, __assign(__assign({}, row), { metadata: parseValue(row.metadata, true) })];
                }
            });
        });
    },
    list: function () {
        return __awaiter(this, arguments, void 0, function (input) {
            var conditions, params, paramIndex, where, limit, offset, sql, rows;
            if (input === void 0) { input = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        conditions = [];
                        params = [];
                        paramIndex = 1;
                        if (input.type) {
                            conditions.push("type = $".concat(paramIndex++));
                            params.push(input.type);
                        }
                        if (input.search) {
                            conditions.push("(name ILIKE $".concat(paramIndex, " OR type ILIKE $").concat(paramIndex, ")"));
                            params.push("%".concat(input.search, "%"));
                            paramIndex++;
                        }
                        where = conditions.length > 0 ? "WHERE ".concat(conditions.join(" AND ")) : "";
                        limit = input.limit || 50;
                        offset = input.offset || 0;
                        sql = "\n      SELECT * FROM entities ".concat(where, "\n      ORDER BY created_at DESC\n      LIMIT ").concat(limit, " OFFSET ").concat(offset, "\n    ");
                        return [4 /*yield*/, runQuery(sql, params)];
                    case 1:
                        rows = _a.sent();
                        return [2 /*return*/, rows.map(function (row) { return (__assign(__assign({}, row), { metadata: parseValue(row.metadata, true) })); })];
                }
            });
        });
    },
    update: function (id, input) {
        return __awaiter(this, void 0, void 0, function () {
            var updates, params, paramIndex, sql, rows, row;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        updates = [];
                        params = [];
                        paramIndex = 1;
                        if (input.name !== undefined) {
                            updates.push("name = $".concat(paramIndex++));
                            params.push(input.name);
                        }
                        if (input.slug !== undefined) {
                            updates.push("slug = $".concat(paramIndex++));
                            params.push(input.slug || null);
                        }
                        if (input.metadata !== undefined) {
                            updates.push("metadata = $".concat(paramIndex++));
                            params.push(input.metadata ? JSON.stringify(input.metadata) : null);
                        }
                        if (updates.length === 0)
                            return [2 /*return*/, this.getById(id)];
                        updates.push("updated_at = NOW()");
                        params.push(id);
                        sql = "\n      UPDATE entities SET ".concat(updates.join(", "), "\n      WHERE id = $").concat(paramIndex, "\n      RETURNING *\n    ");
                        return [4 /*yield*/, runQuery(sql, params)];
                    case 1:
                        rows = _a.sent();
                        if (!rows[0])
                            return [2 /*return*/, null];
                        row = rows[0];
                        return [2 /*return*/, __assign(__assign({}, row), { metadata: parseValue(row.metadata, true) })];
                }
            });
        });
    },
};
exports.memEntries = {
    create: function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var sql, tags, rows, row;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sql = "\n      INSERT INTO mem_entries (entity_id, kind, title, content, tags, timestamp)\n      VALUES ($1, $2, $3, $4, $5, $6)\n      RETURNING *\n    ";
                        tags = input.tags ? JSON.stringify(input.tags) : null;
                        return [4 /*yield*/, runQuery(sql, [
                                input.entityId || null,
                                input.kind,
                                input.title || null,
                                input.content,
                                tags,
                                input.timestamp || new Date(),
                            ])];
                    case 1:
                        rows = _a.sent();
                        row = rows[0];
                        return [2 /*return*/, __assign(__assign({}, row), { tags: parseValue(row.tags, true) })];
                }
            });
        });
    },
    getById: function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var rows, row;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, runQuery("SELECT * FROM mem_entries WHERE id = $1", [id])];
                    case 1:
                        rows = _a.sent();
                        if (!rows[0])
                            return [2 /*return*/, null];
                        row = rows[0];
                        return [2 /*return*/, __assign(__assign({}, row), { tags: parseValue(row.tags, true) })];
                }
            });
        });
    },
    list: function () {
        return __awaiter(this, arguments, void 0, function (input) {
            var conditions, params, paramIndex, where, limit, offset, sql, rows;
            if (input === void 0) { input = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        conditions = [];
                        params = [];
                        paramIndex = 1;
                        if (input.entityId !== undefined) {
                            conditions.push("entity_id = $".concat(paramIndex++));
                            params.push(input.entityId);
                        }
                        if (input.kind) {
                            conditions.push("kind = $".concat(paramIndex++));
                            params.push(input.kind);
                        }
                        if (input.since) {
                            conditions.push("timestamp >= $".concat(paramIndex++));
                            params.push(input.since);
                        }
                        if (input.until) {
                            conditions.push("timestamp <= $".concat(paramIndex++));
                            params.push(input.until);
                        }
                        where = conditions.length > 0 ? "WHERE ".concat(conditions.join(" AND ")) : "";
                        limit = input.limit || 50;
                        offset = input.offset || 0;
                        sql = "\n      SELECT * FROM mem_entries ".concat(where, "\n      ORDER BY timestamp DESC\n      LIMIT ").concat(limit, " OFFSET ").concat(offset, "\n    ");
                        return [4 /*yield*/, runQuery(sql, params)];
                    case 1:
                        rows = _a.sent();
                        return [2 /*return*/, rows.map(function (row) { return (__assign(__assign({}, row), { tags: parseValue(row.tags, true) })); })];
                }
            });
        });
    },
    update: function (id, input) {
        return __awaiter(this, void 0, void 0, function () {
            var updates, params, paramIndex, sql, rows, row;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        updates = [];
                        params = [];
                        paramIndex = 1;
                        if (input.title !== undefined) {
                            updates.push("title = $".concat(paramIndex++));
                            params.push(input.title);
                        }
                        if (input.content !== undefined) {
                            updates.push("content = $".concat(paramIndex++));
                            params.push(input.content);
                        }
                        if (input.tags !== undefined) {
                            updates.push("tags = $".concat(paramIndex++));
                            params.push(input.tags ? JSON.stringify(input.tags) : null);
                        }
                        if (input.timestamp !== undefined) {
                            updates.push("timestamp = $".concat(paramIndex++));
                            params.push(input.timestamp);
                        }
                        if (updates.length === 0)
                            return [2 /*return*/, this.getById(id)];
                        updates.push("updated_at = NOW()");
                        params.push(id);
                        sql = "\n      UPDATE mem_entries SET ".concat(updates.join(", "), "\n      WHERE id = $").concat(paramIndex, "\n      RETURNING *\n    ");
                        return [4 /*yield*/, runQuery(sql, params)];
                    case 1:
                        rows = _a.sent();
                        if (!rows[0])
                            return [2 /*return*/, null];
                        row = rows[0];
                        return [2 /*return*/, __assign(__assign({}, row), { tags: parseValue(row.tags, true) })];
                }
            });
        });
    },
};
exports.prefs = {
    get: function (scope, key) {
        return __awaiter(this, void 0, void 0, function () {
            var rows;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, runQuery("SELECT value FROM prefs WHERE scope = $1 AND key = $2", [scope, key])];
                    case 1:
                        rows = _a.sent();
                        if (!rows[0])
                            return [2 /*return*/, null];
                        return [2 /*return*/, parseValue(rows[0].value, true)];
                }
            });
        });
    },
    set: function (scope, key, value) {
        return __awaiter(this, void 0, void 0, function () {
            var valueStr;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        valueStr = typeof value === "string" ? value : JSON.stringify(value);
                        return [4 /*yield*/, runQuery("INSERT INTO prefs (scope, key, value) VALUES ($1, $2, $3)\n       ON CONFLICT (scope, key) DO UPDATE SET value = $3, updated_at = NOW()", [scope, key, valueStr])];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    },
    list: function (scope) {
        return __awaiter(this, void 0, void 0, function () {
            var rows, result, _i, rows_1, row;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, runQuery("SELECT key, value FROM prefs WHERE scope = $1", [scope])];
                    case 1:
                        rows = _a.sent();
                        result = {};
                        for (_i = 0, rows_1 = rows; _i < rows_1.length; _i++) {
                            row = rows_1[_i];
                            result[row.key] = parseValue(row.value, true);
                        }
                        return [2 /*return*/, result];
                }
            });
        });
    },
};
exports.pixelState = {
    get: function (owner, key) {
        return __awaiter(this, void 0, void 0, function () {
            var rows;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, runQuery("SELECT value FROM pixel_state WHERE owner = $1 AND key = $2", [owner, key])];
                    case 1:
                        rows = _a.sent();
                        if (!rows[0])
                            return [2 /*return*/, null];
                        return [2 /*return*/, parseValue(rows[0].value, true)];
                }
            });
        });
    },
    set: function (owner, key, value) {
        return __awaiter(this, void 0, void 0, function () {
            var valueJson;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        valueJson = JSON.stringify(value);
                        return [4 /*yield*/, runQuery("INSERT INTO pixel_state (owner, key, value) VALUES ($1, $2, $3)\n       ON CONFLICT (owner, key) DO UPDATE SET value = $3, updated_at = NOW()", [owner, key, valueJson])];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    },
    list: function (owner) {
        return __awaiter(this, void 0, void 0, function () {
            var rows, result, _i, rows_2, row;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, runQuery("SELECT key, value FROM pixel_state WHERE owner = $1", [owner])];
                    case 1:
                        rows = _a.sent();
                        result = {};
                        for (_i = 0, rows_2 = rows; _i < rows_2.length; _i++) {
                            row = rows_2[_i];
                            result[row.key] = parseValue(row.value, true);
                        }
                        return [2 /*return*/, result];
                }
            });
        });
    },
};
exports.events = {
    create: function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var sql, links, result, row, fetched;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sql = "\n      INSERT INTO events (title, type, start_time, end_time, source, notes, links)\n      VALUES ($1, $2, $3, $4, $5, $6, $7)\n      RETURNING *\n    ";
                        links = input.links ? JSON.stringify(input.links) : "[]";
                        return [4 /*yield*/, runInsert(sql, [
                                input.title,
                                input.type,
                                input.start_time,
                                input.end_time,
                                input.source || "manual",
                                input.notes || null,
                                links,
                            ])];
                    case 1:
                        result = _a.sent();
                        if (result.rows[0]) {
                            row = result.rows[0];
                            return [2 /*return*/, __assign(__assign({}, row), { links: parseValue(row.links, true) })];
                        }
                        return [4 /*yield*/, exports.events.getById(result.insertId)];
                    case 2:
                        fetched = _a.sent();
                        if (!fetched)
                            throw new Error("Failed to create event");
                        return [2 /*return*/, fetched];
                }
            });
        });
    },
    getById: function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var rows, row;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, runQuery("SELECT * FROM events WHERE id = $1", [id])];
                    case 1:
                        rows = _a.sent();
                        if (!rows[0])
                            return [2 /*return*/, null];
                        row = rows[0];
                        return [2 /*return*/, __assign(__assign({}, row), { links: parseValue(row.links, true) })];
                }
            });
        });
    },
    listByDay: function (date) {
        return __awaiter(this, void 0, void 0, function () {
            var startOfDay, endOfDay, sql, rows;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startOfDay = new Date(date);
                        startOfDay.setHours(0, 0, 0, 0);
                        endOfDay = new Date(date);
                        endOfDay.setHours(23, 59, 59, 999);
                        sql = "\n      SELECT * FROM events\n      WHERE start_time >= $1 AND start_time <= $2\n      ORDER BY start_time ASC\n    ";
                        return [4 /*yield*/, runQuery(sql, [startOfDay, endOfDay])];
                    case 1:
                        rows = _a.sent();
                        return [2 /*return*/, rows.map(function (row) { return (__assign(__assign({}, row), { links: parseValue(row.links, true) })); })];
                }
            });
        });
    },
    listByWeek: function (weekStartDate) {
        return __awaiter(this, void 0, void 0, function () {
            var start, end, sql, rows;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        start = new Date(weekStartDate);
                        start.setHours(0, 0, 0, 0);
                        end = new Date(start);
                        end.setDate(end.getDate() + 7);
                        sql = "\n      SELECT * FROM events\n      WHERE start_time >= $1 AND start_time < $2\n      ORDER BY start_time ASC\n    ";
                        return [4 /*yield*/, runQuery(sql, [start, end])];
                    case 1:
                        rows = _a.sent();
                        return [2 /*return*/, rows.map(function (row) { return (__assign(__assign({}, row), { links: parseValue(row.links, true) })); })];
                }
            });
        });
    },
    update: function (id, input) {
        return __awaiter(this, void 0, void 0, function () {
            var updates, params, paramIndex, sql, rows, row;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        updates = [];
                        params = [];
                        paramIndex = 1;
                        if (input.title !== undefined) {
                            updates.push("title = $".concat(paramIndex++));
                            params.push(input.title);
                        }
                        if (input.type !== undefined) {
                            updates.push("type = $".concat(paramIndex++));
                            params.push(input.type);
                        }
                        if (input.start_time !== undefined) {
                            updates.push("start_time = $".concat(paramIndex++));
                            params.push(input.start_time);
                        }
                        if (input.end_time !== undefined) {
                            updates.push("end_time = $".concat(paramIndex++));
                            params.push(input.end_time);
                        }
                        if (input.notes !== undefined) {
                            updates.push("notes = $".concat(paramIndex++));
                            params.push(input.notes || null);
                        }
                        if (input.links !== undefined) {
                            updates.push("links = $".concat(paramIndex++));
                            params.push(JSON.stringify(input.links));
                        }
                        if (updates.length === 0)
                            return [2 /*return*/, this.getById(id)];
                        updates.push("updated_at = NOW()");
                        params.push(id);
                        sql = "\n      UPDATE events SET ".concat(updates.join(", "), "\n      WHERE id = $").concat(paramIndex, "\n      RETURNING *\n    ");
                        return [4 /*yield*/, runQuery(sql, params)];
                    case 1:
                        rows = _a.sent();
                        if (!rows[0])
                            return [2 /*return*/, null];
                        row = rows[0];
                        return [2 /*return*/, __assign(__assign({}, row), { links: parseValue(row.links, true) })];
                }
            });
        });
    },
    delete: function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var sql;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sql = "DELETE FROM events WHERE id = $1";
                        return [4 /*yield*/, runQuery(sql, [id])];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                }
            });
        });
    },
};
exports.tasksV2 = {
    create: function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var sql, tags, links, result, row, fetched;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sql = "\n      INSERT INTO tasks_v2 (title, description, status, priority, timebox, due, tags, source, links)\n      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)\n      RETURNING *\n    ";
                        tags = input.tags ? JSON.stringify(input.tags) : "[]";
                        links = input.links ? JSON.stringify(input.links) : "[]";
                        return [4 /*yield*/, runInsert(sql, [
                                input.title,
                                input.description || null,
                                input.status || "inbox",
                                input.priority || "P2",
                                input.timebox || null,
                                input.due || null,
                                tags,
                                input.source || "manual",
                                links,
                            ])];
                    case 1:
                        result = _a.sent();
                        if (result.rows[0]) {
                            row = result.rows[0];
                            return [2 /*return*/, __assign(__assign({}, row), { tags: parseValue(row.tags, true), links: parseValue(row.links, true) })];
                        }
                        return [4 /*yield*/, exports.tasksV2.getById(result.insertId)];
                    case 2:
                        fetched = _a.sent();
                        if (!fetched)
                            throw new Error("Failed to create task");
                        return [2 /*return*/, fetched];
                }
            });
        });
    },
    getById: function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var rows, row;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, runQuery("SELECT * FROM tasks_v2 WHERE id = $1", [id])];
                    case 1:
                        rows = _a.sent();
                        if (!rows[0])
                            return [2 /*return*/, null];
                        row = rows[0];
                        return [2 /*return*/, __assign(__assign({}, row), { tags: parseValue(row.tags, true), links: parseValue(row.links, true) })];
                }
            });
        });
    },
    list: function () {
        return __awaiter(this, arguments, void 0, function (input) {
            var conditions, params, paramIndex, where, limit, offset, sql, rows;
            if (input === void 0) { input = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        conditions = [];
                        params = [];
                        paramIndex = 1;
                        if (input.status) {
                            conditions.push("status = $".concat(paramIndex++));
                            params.push(input.status);
                        }
                        if (input.priority) {
                            conditions.push("priority = $".concat(paramIndex++));
                            params.push(input.priority);
                        }
                        if (input.since) {
                            conditions.push("created_at >= $".concat(paramIndex++));
                            params.push(input.since);
                        }
                        if (input.until) {
                            conditions.push("created_at <= $".concat(paramIndex++));
                            params.push(input.until);
                        }
                        where = conditions.length > 0 ? "WHERE ".concat(conditions.join(" AND ")) : "";
                        limit = input.limit || 50;
                        offset = input.offset || 0;
                        sql = "\n      SELECT * FROM tasks_v2 ".concat(where, "\n      ORDER BY \n        CASE priority WHEN 'P0' THEN 1 WHEN 'P1' THEN 2 WHEN 'P2' THEN 3 END,\n        due IS NOT NULL DESC, due ASC,\n        created_at DESC\n      LIMIT ").concat(limit, " OFFSET ").concat(offset, "\n    ");
                        return [4 /*yield*/, runQuery(sql, params)];
                    case 1:
                        rows = _a.sent();
                        return [2 /*return*/, rows.map(function (row) { return (__assign(__assign({}, row), { tags: parseValue(row.tags, true), links: parseValue(row.links, true) })); })];
                }
            });
        });
    },
    update: function (id, input) {
        return __awaiter(this, void 0, void 0, function () {
            var updates, params, paramIndex, sql, rows, row;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        updates = [];
                        params = [];
                        paramIndex = 1;
                        if (input.title !== undefined) {
                            updates.push("title = $".concat(paramIndex++));
                            params.push(input.title);
                        }
                        if (input.description !== undefined) {
                            updates.push("description = $".concat(paramIndex++));
                            params.push(input.description || null);
                        }
                        if (input.status !== undefined) {
                            updates.push("status = $".concat(paramIndex++));
                            params.push(input.status);
                        }
                        if (input.priority !== undefined) {
                            updates.push("priority = $".concat(paramIndex++));
                            params.push(input.priority);
                        }
                        if (input.timebox !== undefined) {
                            updates.push("timebox = $".concat(paramIndex++));
                            params.push(input.timebox || null);
                        }
                        if (input.due !== undefined) {
                            updates.push("due = $".concat(paramIndex++));
                            params.push(input.due || null);
                        }
                        if (input.tags !== undefined) {
                            updates.push("tags = $".concat(paramIndex++));
                            params.push(JSON.stringify(input.tags));
                        }
                        if (input.links !== undefined) {
                            updates.push("links = $".concat(paramIndex++));
                            params.push(JSON.stringify(input.links));
                        }
                        if (updates.length === 0)
                            return [2 /*return*/, this.getById(id)];
                        updates.push("updated_at = NOW()");
                        params.push(id);
                        sql = "\n      UPDATE tasks_v2 SET ".concat(updates.join(", "), "\n      WHERE id = $").concat(paramIndex, "\n      RETURNING *\n    ");
                        return [4 /*yield*/, runQuery(sql, params)];
                    case 1:
                        rows = _a.sent();
                        if (!rows[0])
                            return [2 /*return*/, null];
                        row = rows[0];
                        return [2 /*return*/, __assign(__assign({}, row), { tags: parseValue(row.tags, true), links: parseValue(row.links, true) })];
                }
            });
        });
    },
    delete: function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, runQuery("DELETE FROM tasks_v2 WHERE id = $1", [id])];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                }
            });
        });
    },
};
exports.sessions = {
    start: function () {
        return __awaiter(this, arguments, void 0, function (input) {
            var sql, result, fetched;
            if (input === void 0) { input = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sql = "\n      INSERT INTO sessions (task_id, start_time)\n      VALUES ($1, $2)\n      RETURNING *\n    ";
                        return [4 /*yield*/, runInsert(sql, [
                                input.task_id || null,
                                input.start_time || new Date(),
                            ])];
                    case 1:
                        result = _a.sent();
                        if (result.rows[0]) {
                            return [2 /*return*/, result.rows[0]];
                        }
                        return [4 /*yield*/, exports.sessions.getById(result.insertId)];
                    case 2:
                        fetched = _a.sent();
                        if (!fetched)
                            throw new Error("Failed to create session");
                        return [2 /*return*/, fetched];
                }
            });
        });
    },
    end: function (id_1) {
        return __awaiter(this, arguments, void 0, function (id, input) {
            var updates, params, paramIndex, sql, rows;
            if (input === void 0) { input = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        updates = [];
                        params = [];
                        paramIndex = 1;
                        updates.push("end_time = $".concat(paramIndex++));
                        params.push(input.end_time || new Date());
                        if (input.notes !== undefined) {
                            updates.push("notes = $".concat(paramIndex++));
                            params.push(input.notes || null);
                        }
                        updates.push("updated_at = NOW()");
                        params.push(id);
                        sql = "\n      UPDATE sessions SET ".concat(updates.join(", "), "\n      WHERE id = $").concat(paramIndex, "\n      RETURNING *\n    ");
                        return [4 /*yield*/, runQuery(sql, params)];
                    case 1:
                        rows = _a.sent();
                        return [2 /*return*/, rows[0] || null];
                }
            });
        });
    },
    getById: function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var rows;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, runQuery("SELECT * FROM sessions WHERE id = $1", [id])];
                    case 1:
                        rows = _a.sent();
                        return [2 /*return*/, rows[0] || null];
                }
            });
        });
    },
    listByDay: function (date) {
        return __awaiter(this, void 0, void 0, function () {
            var startOfDay, endOfDay, sql;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startOfDay = new Date(date);
                        startOfDay.setHours(0, 0, 0, 0);
                        endOfDay = new Date(date);
                        endOfDay.setHours(23, 59, 59, 999);
                        sql = "\n      SELECT * FROM sessions\n      WHERE start_time >= $1 AND start_time <= $2\n      ORDER BY start_time ASC\n    ";
                        return [4 /*yield*/, runQuery(sql, [startOfDay, endOfDay])];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    },
    listByTask: function (taskId) {
        return __awaiter(this, void 0, void 0, function () {
            var sql;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sql = "\n      SELECT * FROM sessions\n      WHERE task_id = $1\n      ORDER BY start_time DESC\n    ";
                        return [4 /*yield*/, runQuery(sql, [taskId])];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    },
    getActive: function () {
        return __awaiter(this, void 0, void 0, function () {
            var sql, rows;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sql = "\n      SELECT * FROM sessions\n      WHERE end_time IS NULL\n      ORDER BY start_time DESC\n      LIMIT 1\n    ";
                        return [4 /*yield*/, runQuery(sql, [])];
                    case 1:
                        rows = _a.sent();
                        return [2 /*return*/, rows[0] || null];
                }
            });
        });
    },
};
function parseTimeboxToMinutes(timebox) {
    if (!timebox)
        return 0;
    var match = timebox.match(/^(\d+)(m|h)$/);
    if (!match)
        return 0;
    var value = parseInt(match[1], 10);
    return match[2] === "h" ? value * 60 : value;
}
function formatDate(date) {
    return date.toISOString().split("T")[0];
}
function generateTodaysPlan() {
    return __awaiter(this, arguments, void 0, function (date) {
        var dayEvents, dayTasks, workEvents, personalEvents, workTasks, personalTasks, chapters;
        if (date === void 0) { date = new Date(); }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, exports.events.listByDay(date)];
                case 1:
                    dayEvents = _a.sent();
                    return [4 /*yield*/, exports.tasksV2.list({
                            status: "ready",
                            limit: 20,
                        })];
                case 2:
                    dayTasks = _a.sent();
                    workEvents = dayEvents.filter(function (e) { return e.type === "work"; });
                    personalEvents = dayEvents.filter(function (e) { return ["hobby", "self-care", "social", "health"].includes(e.type); });
                    workTasks = dayTasks.filter(function (t) { var _a, _b; return ((_a = t.tags) === null || _a === void 0 ? void 0 : _a.includes("work")) || !((_b = t.tags) === null || _b === void 0 ? void 0 : _b.length); });
                    personalTasks = dayTasks.filter(function (t) { var _a; return (_a = t.tags) === null || _a === void 0 ? void 0 : _a.some(function (tag) { return ["hobby", "health", "learning", "personal"].includes(tag); }); });
                    chapters = [];
                    if (workEvents.length > 0 || workTasks.length > 0)
                        chapters.push("Work");
                    if (personalEvents.length > 0 || personalTasks.length > 0)
                        chapters.push("Personal");
                    return [2 /*return*/, {
                            date: formatDate(date),
                            work: { events: workEvents, tasks: workTasks },
                            personal: { events: personalEvents, tasks: personalTasks },
                            chapters: chapters,
                        }];
            }
        });
    });
}
function generateTodaysLog() {
    return __awaiter(this, arguments, void 0, function (date) {
        var daySessions, dayTasks, completedTasks, blockedTasks, totalMinutes, narrative;
        if (date === void 0) { date = new Date(); }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, exports.sessions.listByDay(date)];
                case 1:
                    daySessions = _a.sent();
                    return [4 /*yield*/, exports.tasksV2.list({})];
                case 2:
                    dayTasks = _a.sent();
                    completedTasks = dayTasks.filter(function (t) { return t.status === "done" && new Date(t.updated_at).toDateString() === date.toDateString(); });
                    blockedTasks = dayTasks.filter(function (t) { return t.status === "blocked"; });
                    totalMinutes = daySessions.reduce(function (sum, s) {
                        if (s.end_time) {
                            return sum + Math.round((new Date(s.end_time).getTime() - new Date(s.start_time).getTime()) / 60000);
                        }
                        return sum;
                    }, 0);
                    narrative = [
                        completedTasks.length > 0 ? "Completed ".concat(completedTasks.length, " task(s)") : "No tasks completed today",
                        blockedTasks.length > 0 ? "".concat(blockedTasks.length, " task(s) blocked") : "",
                        "".concat(totalMinutes, " minutes logged in sessions"),
                    ]
                        .filter(Boolean)
                        .join(". ") + ".";
                    return [2 /*return*/, {
                            date: formatDate(date),
                            sessions: daySessions,
                            completedTasks: completedTasks,
                            blockedTasks: blockedTasks,
                            narrative: narrative,
                        }];
            }
        });
    });
}
function suggestEveningMicroSprint() {
    return __awaiter(this, arguments, void 0, function (date) {
        var now, eveningStart, midnight, dayEvents, eveningEvents, usedMinutes, availableMinutes, hobbyTasks, sortedHobbyTasks, suggestedTasks, accumulated, _i, sortedHobbyTasks_1, task, taskMinutes;
        if (date === void 0) { date = new Date(); }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    now = new Date(date);
                    eveningStart = new Date(date);
                    eveningStart.setHours(18, 0, 0, 0);
                    midnight = new Date(date);
                    midnight.setHours(23, 59, 59, 999);
                    if (now > eveningStart) {
                        eveningStart.setTime(now.getTime());
                    }
                    return [4 /*yield*/, exports.events.listByDay(date)];
                case 1:
                    dayEvents = _a.sent();
                    eveningEvents = dayEvents.filter(function (e) { return new Date(e.start_time) >= eveningStart; });
                    usedMinutes = eveningEvents.reduce(function (sum, e) {
                        return sum + Math.round((new Date(e.end_time).getTime() - new Date(e.start_time).getTime()) / 60000);
                    }, 0);
                    availableMinutes = Math.max(0, 180 - usedMinutes);
                    return [4 /*yield*/, exports.tasksV2.list({
                            status: "ready",
                            limit: 5,
                        })];
                case 2:
                    hobbyTasks = _a.sent();
                    sortedHobbyTasks = hobbyTasks
                        .filter(function (t) { var _a; return (_a = t.tags) === null || _a === void 0 ? void 0 : _a.some(function (tag) { return ["hobby", "learning", "pixel-office"].includes(tag); }); })
                        .sort(function (a, b) {
                        var aMins = parseTimeboxToMinutes(a.timebox);
                        var bMins = parseTimeboxToMinutes(b.timebox);
                        return aMins - bMins;
                    });
                    suggestedTasks = [];
                    accumulated = 0;
                    for (_i = 0, sortedHobbyTasks_1 = sortedHobbyTasks; _i < sortedHobbyTasks_1.length; _i++) {
                        task = sortedHobbyTasks_1[_i];
                        taskMinutes = parseTimeboxToMinutes(task.timebox) || 30;
                        if (accumulated + taskMinutes <= availableMinutes && suggestedTasks.length < 2) {
                            suggestedTasks.push(task);
                            accumulated += taskMinutes;
                        }
                    }
                    return [2 /*return*/, {
                            availableMinutes: availableMinutes,
                            suggestedTasks: suggestedTasks,
                            calendarBlocks: eveningEvents,
                        }];
            }
        });
    });
}
