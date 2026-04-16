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
exports.runMigrations = runMigrations;
exports.migrate = migrate;
var config_js_1 = require("./config.js");
var schema_js_1 = require("./schema.js");
var MIGRATION_TABLE = "schema_migrations";
function runDbQuery(pool, sql, params) {
    return __awaiter(this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, pool.query(sql, params)];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, result.rows || result];
            }
        });
    });
}
function ensureMigrationTable(pool, dbType) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(dbType === "postgres")) return [3 /*break*/, 2];
                    return [4 /*yield*/, runDbQuery(pool, "\n      CREATE TABLE IF NOT EXISTS ".concat(MIGRATION_TABLE, " (\n        version INT PRIMARY KEY,\n        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()\n      )\n    "))];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, runDbQuery(pool, "\n      CREATE TABLE IF NOT EXISTS ".concat(MIGRATION_TABLE, " (\n        version INT PRIMARY KEY,\n        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n      ) ENGINE=InnoDB\n    "))];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4: return [2 /*return*/];
            }
        });
    });
}
function getAppliedMigrations(pool) {
    return __awaiter(this, void 0, void 0, function () {
        var rows;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, runDbQuery(pool, "SELECT version FROM ".concat(MIGRATION_TABLE, " ORDER BY version"))];
                case 1:
                    rows = _a.sent();
                    return [2 /*return*/, rows.map(function (row) { return row.version; })];
            }
        });
    });
}
function markMigrationApplied(pool, dbType, version) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(dbType === "postgres")) return [3 /*break*/, 2];
                    return [4 /*yield*/, runDbQuery(pool, "INSERT INTO ".concat(MIGRATION_TABLE, " (version) VALUES ($1)"), [version])];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, runDbQuery(pool, "INSERT INTO ".concat(MIGRATION_TABLE, " (version) VALUES (?)"), [version])];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4: return [2 /*return*/];
            }
        });
    });
}
function runMigrations() {
    return __awaiter(this, void 0, void 0, function () {
        var pool, config, dbType, dbSchemas, applied, err_1, _i, _a, tableName, sql;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, config_js_1.getPool)()];
                case 1:
                    pool = _b.sent();
                    config = (0, config_js_1.getConfig)();
                    dbType = config.db.type;
                    dbSchemas = schema_js_1.schemas[dbType];
                    return [4 /*yield*/, ensureMigrationTable(pool, dbType)];
                case 2:
                    _b.sent();
                    return [4 /*yield*/, getAppliedMigrations(pool)];
                case 3:
                    applied = _b.sent();
                    console.log("Current database: ".concat(config.db.database));
                    console.log("Applied migrations: ".concat(applied.join(", ") || "none"));
                    if (!applied.includes(schema_js_1.SCHEMA_VERSION)) return [3 /*break*/, 5];
                    console.log("Schema v".concat(schema_js_1.SCHEMA_VERSION, " already applied."));
                    return [4 /*yield*/, ensureDefaultUser(pool, dbType)];
                case 4:
                    _b.sent();
                    return [2 /*return*/];
                case 5:
                    console.log("Applying schema v".concat(schema_js_1.SCHEMA_VERSION, "..."));
                    if (!(schema_js_1.SCHEMA_VERSION > 4)) return [3 /*break*/, 12];
                    console.log("  Checking completed_at column in daily_plan_items...");
                    _b.label = 6;
                case 6:
                    _b.trys.push([6, 11, , 12]);
                    if (!(dbType === "postgres")) return [3 /*break*/, 8];
                    return [4 /*yield*/, runDbQuery(pool, "ALTER TABLE daily_plan_items ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP")];
                case 7:
                    _b.sent();
                    return [3 /*break*/, 10];
                case 8: return [4 /*yield*/, runDbQuery(pool, "ALTER TABLE daily_plan_items ADD COLUMN completed_at TIMESTAMP NULL")];
                case 9:
                    _b.sent();
                    _b.label = 10;
                case 10: return [3 /*break*/, 12];
                case 11:
                    err_1 = _b.sent();
                    if (err_1.code !== "4271" && err_1.code !== "ER_DUP_FIELDNAME") {
                        throw err_1;
                    }
                    console.log("  completed_at column already exists, skipping...");
                    return [3 /*break*/, 12];
                case 12:
                    _i = 0, _a = Object.keys(dbSchemas);
                    _b.label = 13;
                case 13:
                    if (!(_i < _a.length)) return [3 /*break*/, 16];
                    tableName = _a[_i];
                    sql = dbSchemas[tableName];
                    console.log("  Creating ".concat(tableName, "..."));
                    return [4 /*yield*/, runDbQuery(pool, sql)];
                case 14:
                    _b.sent();
                    _b.label = 15;
                case 15:
                    _i++;
                    return [3 /*break*/, 13];
                case 16: return [4 /*yield*/, markMigrationApplied(pool, dbType, schema_js_1.SCHEMA_VERSION)];
                case 17:
                    _b.sent();
                    console.log("Schema v".concat(schema_js_1.SCHEMA_VERSION, " applied successfully!"));
                    return [4 /*yield*/, ensureDefaultUser(pool, dbType)];
                case 18:
                    _b.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function ensureDefaultUser(pool, dbType) {
    return __awaiter(this, void 0, void 0, function () {
        var existing, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 7, , 8]);
                    return [4 /*yield*/, runDbQuery(pool, "SELECT id FROM users WHERE id = 1")];
                case 1:
                    existing = _a.sent();
                    if (!(existing.length === 0)) return [3 /*break*/, 6];
                    console.log("  Creating default user...");
                    if (!(dbType === "postgres")) return [3 /*break*/, 3];
                    return [4 /*yield*/, runDbQuery(pool, "INSERT INTO users (id, email, name) VALUES (1, 'default@pixel.office', 'Default User')")];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, runDbQuery(pool, "INSERT INTO users (id, email, name) VALUES (1, 'default@pixel.office', 'Default User')")];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5:
                    console.log("  Default user created.");
                    _a.label = 6;
                case 6: return [3 /*break*/, 8];
                case 7:
                    err_2 = _a.sent();
                    console.log("  Default user check skipped:", err_2);
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    });
}
function migrate() {
    return __awaiter(this, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, runMigrations()];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    console.error("Migration failed:", error_1);
                    process.exit(1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
