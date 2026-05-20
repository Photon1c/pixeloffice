import { getPool, getConfig } from "./config.js";
function parseValue(value, isJson) {
    if (value === null || value === undefined)
        return null;
    if (isJson && typeof value === "string") {
        try {
            return JSON.parse(value);
        }
        catch {
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
async function runInsert(sql, params = []) {
    const pool = await getPool();
    const config = getConfig();
    const isPg = config.db.type === "postgres";
    if (!isPg) {
        sql = toMySQLPlaceholders(sql);
        sql = stripReturning(sql);
    }
    if (isPg) {
        const result = await pool.query(sql, params);
        return { rows: result.rows };
    }
    else {
        const [result] = await pool.query(sql, params);
        return { rows: [], insertId: result.insertId };
    }
}
async function runQuery(sql, params = []) {
    const pool = await getPool();
    const config = getConfig();
    const isPg = config.db.type === "postgres";
    if (!isPg) {
        sql = toMySQLPlaceholders(sql);
        sql = stripReturning(sql);
    }
    if (isPg) {
        const result = await pool.query(sql, params);
        return result.rows;
    }
    else {
        const [rows] = await pool.query(sql, params);
        return rows;
    }
}
export const entities = {
    async create(input) {
        const sql = `
      INSERT INTO entities (type, name, slug, metadata)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
        const metadata = input.metadata ? JSON.stringify(input.metadata) : null;
        const rows = await runQuery(sql, [input.type, input.name, input.slug || null, metadata]);
        const row = rows[0];
        return {
            ...row,
            metadata: parseValue(row.metadata, true),
        };
    },
    async getById(id) {
        const rows = await runQuery("SELECT * FROM entities WHERE id = $1", [id]);
        if (!rows[0])
            return null;
        const row = rows[0];
        return {
            ...row,
            metadata: parseValue(row.metadata, true),
        };
    },
    async getBySlug(slug) {
        const rows = await runQuery("SELECT * FROM entities WHERE slug = $1", [slug]);
        if (!rows[0])
            return null;
        const row = rows[0];
        return {
            ...row,
            metadata: parseValue(row.metadata, true),
        };
    },
    async list(input = {}) {
        const conditions = [];
        const params = [];
        let paramIndex = 1;
        if (input.type) {
            conditions.push(`type = $${paramIndex++}`);
            params.push(input.type);
        }
        if (input.search) {
            conditions.push(`(name ILIKE $${paramIndex} OR type ILIKE $${paramIndex})`);
            params.push(`%${input.search}%`);
            paramIndex++;
        }
        const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
        const limit = input.limit || 50;
        const offset = input.offset || 0;
        const sql = `
      SELECT * FROM entities ${where}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
        const rows = await runQuery(sql, params);
        return rows.map((row) => ({
            ...row,
            metadata: parseValue(row.metadata, true),
        }));
    },
    async update(id, input) {
        const updates = [];
        const params = [];
        let paramIndex = 1;
        if (input.name !== undefined) {
            updates.push(`name = $${paramIndex++}`);
            params.push(input.name);
        }
        if (input.slug !== undefined) {
            updates.push(`slug = $${paramIndex++}`);
            params.push(input.slug || null);
        }
        if (input.metadata !== undefined) {
            updates.push(`metadata = $${paramIndex++}`);
            params.push(input.metadata ? JSON.stringify(input.metadata) : null);
        }
        if (updates.length === 0)
            return this.getById(id);
        updates.push(`updated_at = NOW()`);
        params.push(id);
        const sql = `
      UPDATE entities SET ${updates.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
        const rows = await runQuery(sql, params);
        if (!rows[0])
            return null;
        const row = rows[0];
        return {
            ...row,
            metadata: parseValue(row.metadata, true),
        };
    },
};
export const memEntries = {
    async create(input) {
        const sql = `
      INSERT INTO mem_entries (entity_id, kind, title, content, tags, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
        const tags = input.tags ? JSON.stringify(input.tags) : null;
        const rows = await runQuery(sql, [
            input.entityId || null,
            input.kind,
            input.title || null,
            input.content,
            tags,
            input.timestamp || new Date(),
        ]);
        const row = rows[0];
        return {
            ...row,
            tags: parseValue(row.tags, true),
        };
    },
    async getById(id) {
        const rows = await runQuery("SELECT * FROM mem_entries WHERE id = $1", [id]);
        if (!rows[0])
            return null;
        const row = rows[0];
        return {
            ...row,
            tags: parseValue(row.tags, true),
        };
    },
    async list(input = {}) {
        const conditions = [];
        const params = [];
        let paramIndex = 1;
        if (input.entityId !== undefined) {
            conditions.push(`entity_id = $${paramIndex++}`);
            params.push(input.entityId);
        }
        if (input.kind) {
            conditions.push(`kind = $${paramIndex++}`);
            params.push(input.kind);
        }
        if (input.since) {
            conditions.push(`timestamp >= $${paramIndex++}`);
            params.push(input.since);
        }
        if (input.until) {
            conditions.push(`timestamp <= $${paramIndex++}`);
            params.push(input.until);
        }
        const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
        const limit = input.limit || 50;
        const offset = input.offset || 0;
        const sql = `
      SELECT * FROM mem_entries ${where}
      ORDER BY timestamp DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
        const rows = await runQuery(sql, params);
        return rows.map((row) => ({
            ...row,
            tags: parseValue(row.tags, true),
        }));
    },
    async update(id, input) {
        const updates = [];
        const params = [];
        let paramIndex = 1;
        if (input.title !== undefined) {
            updates.push(`title = $${paramIndex++}`);
            params.push(input.title);
        }
        if (input.content !== undefined) {
            updates.push(`content = $${paramIndex++}`);
            params.push(input.content);
        }
        if (input.tags !== undefined) {
            updates.push(`tags = $${paramIndex++}`);
            params.push(input.tags ? JSON.stringify(input.tags) : null);
        }
        if (input.timestamp !== undefined) {
            updates.push(`timestamp = $${paramIndex++}`);
            params.push(input.timestamp);
        }
        if (updates.length === 0)
            return this.getById(id);
        updates.push(`updated_at = NOW()`);
        params.push(id);
        const sql = `
      UPDATE mem_entries SET ${updates.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
        const rows = await runQuery(sql, params);
        if (!rows[0])
            return null;
        const row = rows[0];
        return {
            ...row,
            tags: parseValue(row.tags, true),
        };
    },
};
export const prefs = {
    async get(scope, key) {
        const rows = await runQuery("SELECT value FROM prefs WHERE scope = $1 AND key = $2", [scope, key]);
        if (!rows[0])
            return null;
        return parseValue(rows[0].value, true);
    },
    async set(scope, key, value) {
        const valueStr = typeof value === "string" ? value : JSON.stringify(value);
        await runQuery(`INSERT INTO prefs (scope, key, value) VALUES ($1, $2, $3)
       ON CONFLICT (scope, key) DO UPDATE SET value = $3, updated_at = NOW()`, [scope, key, valueStr]);
    },
    async list(scope) {
        const rows = await runQuery("SELECT key, value FROM prefs WHERE scope = $1", [scope]);
        const result = {};
        for (const row of rows) {
            result[row.key] = parseValue(row.value, true);
        }
        return result;
    },
};
export const pixelState = {
    async get(owner, key) {
        const rows = await runQuery("SELECT value FROM pixel_state WHERE owner = $1 AND key = $2", [owner, key]);
        if (!rows[0])
            return null;
        return parseValue(rows[0].value, true);
    },
    async set(owner, key, value) {
        const valueJson = JSON.stringify(value);
        await runQuery(`INSERT INTO pixel_state (owner, key, value) VALUES ($1, $2, $3)
       ON CONFLICT (owner, key) DO UPDATE SET value = $3, updated_at = NOW()`, [owner, key, valueJson]);
    },
    async list(owner) {
        const rows = await runQuery("SELECT key, value FROM pixel_state WHERE owner = $1", [owner]);
        const result = {};
        for (const row of rows) {
            result[row.key] = parseValue(row.value, true);
        }
        return result;
    },
};
export const events = {
    async create(input) {
        const sql = `
      INSERT INTO events (title, type, start_time, end_time, source, notes, links)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
        const links = input.links ? JSON.stringify(input.links) : "[]";
        const result = await runInsert(sql, [
            input.title,
            input.type,
            input.start_time,
            input.end_time,
            input.source || "manual",
            input.notes || null,
            links,
        ]);
        if (result.rows[0]) {
            const row = result.rows[0];
            return {
                ...row,
                links: parseValue(row.links, true),
            };
        }
        const fetched = await events.getById(result.insertId);
        if (!fetched)
            throw new Error("Failed to create event");
        return fetched;
    },
    async getById(id) {
        const rows = await runQuery("SELECT * FROM events WHERE id = $1", [id]);
        if (!rows[0])
            return null;
        const row = rows[0];
        return {
            ...row,
            links: parseValue(row.links, true),
        };
    },
    async listByDay(date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        const sql = `
      SELECT * FROM events
      WHERE start_time >= $1 AND start_time <= $2
      ORDER BY start_time ASC
    `;
        const rows = await runQuery(sql, [startOfDay, endOfDay]);
        return rows.map((row) => ({
            ...row,
            links: parseValue(row.links, true),
        }));
    },
    async listByWeek(weekStartDate) {
        const start = new Date(weekStartDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 7);
        const sql = `
      SELECT * FROM events
      WHERE start_time >= $1 AND start_time < $2
      ORDER BY start_time ASC
    `;
        const rows = await runQuery(sql, [start, end]);
        return rows.map((row) => ({
            ...row,
            links: parseValue(row.links, true),
        }));
    },
    async update(id, input) {
        const updates = [];
        const params = [];
        let paramIndex = 1;
        if (input.title !== undefined) {
            updates.push(`title = $${paramIndex++}`);
            params.push(input.title);
        }
        if (input.type !== undefined) {
            updates.push(`type = $${paramIndex++}`);
            params.push(input.type);
        }
        if (input.start_time !== undefined) {
            updates.push(`start_time = $${paramIndex++}`);
            params.push(input.start_time);
        }
        if (input.end_time !== undefined) {
            updates.push(`end_time = $${paramIndex++}`);
            params.push(input.end_time);
        }
        if (input.notes !== undefined) {
            updates.push(`notes = $${paramIndex++}`);
            params.push(input.notes || null);
        }
        if (input.links !== undefined) {
            updates.push(`links = $${paramIndex++}`);
            params.push(JSON.stringify(input.links));
        }
        if (updates.length === 0)
            return this.getById(id);
        updates.push(`updated_at = NOW()`);
        params.push(id);
        const sql = `
      UPDATE events SET ${updates.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
        const rows = await runQuery(sql, params);
        if (!rows[0])
            return null;
        const row = rows[0];
        return {
            ...row,
            links: parseValue(row.links, true),
        };
    },
    async delete(id) {
        const sql = "DELETE FROM events WHERE id = $1";
        await runQuery(sql, [id]);
        return true;
    },
};
export const tasksV2 = {
    async create(input) {
        const sql = `
      INSERT INTO tasks_v2 (title, description, status, priority, timebox, due, tags, source, links)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
        const tags = input.tags ? JSON.stringify(input.tags) : "[]";
        const links = input.links ? JSON.stringify(input.links) : "[]";
        const result = await runInsert(sql, [
            input.title,
            input.description || null,
            input.status || "inbox",
            input.priority || "P2",
            input.timebox || null,
            input.due || null,
            tags,
            input.source || "manual",
            links,
        ]);
        if (result.rows[0]) {
            const row = result.rows[0];
            return {
                ...row,
                tags: parseValue(row.tags, true),
                links: parseValue(row.links, true),
            };
        }
        const fetched = await tasksV2.getById(result.insertId);
        if (!fetched)
            throw new Error("Failed to create task");
        return fetched;
    },
    async getById(id) {
        const rows = await runQuery("SELECT * FROM tasks_v2 WHERE id = $1", [id]);
        if (!rows[0])
            return null;
        const row = rows[0];
        return {
            ...row,
            tags: parseValue(row.tags, true),
            links: parseValue(row.links, true),
        };
    },
    async list(input = {}) {
        const conditions = [];
        const params = [];
        let paramIndex = 1;
        if (input.status) {
            conditions.push(`status = $${paramIndex++}`);
            params.push(input.status);
        }
        if (input.priority) {
            conditions.push(`priority = $${paramIndex++}`);
            params.push(input.priority);
        }
        if (input.since) {
            conditions.push(`created_at >= $${paramIndex++}`);
            params.push(input.since);
        }
        if (input.until) {
            conditions.push(`created_at <= $${paramIndex++}`);
            params.push(input.until);
        }
        const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
        const limit = input.limit || 50;
        const offset = input.offset || 0;
        const sql = `
      SELECT * FROM tasks_v2 ${where}
      ORDER BY 
        CASE priority WHEN 'P0' THEN 1 WHEN 'P1' THEN 2 WHEN 'P2' THEN 3 END,
        due IS NOT NULL DESC, due ASC,
        created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
        const rows = await runQuery(sql, params);
        return rows.map((row) => ({
            ...row,
            tags: parseValue(row.tags, true),
            links: parseValue(row.links, true),
        }));
    },
    async update(id, input) {
        const updates = [];
        const params = [];
        let paramIndex = 1;
        if (input.title !== undefined) {
            updates.push(`title = $${paramIndex++}`);
            params.push(input.title);
        }
        if (input.description !== undefined) {
            updates.push(`description = $${paramIndex++}`);
            params.push(input.description || null);
        }
        if (input.status !== undefined) {
            updates.push(`status = $${paramIndex++}`);
            params.push(input.status);
        }
        if (input.priority !== undefined) {
            updates.push(`priority = $${paramIndex++}`);
            params.push(input.priority);
        }
        if (input.timebox !== undefined) {
            updates.push(`timebox = $${paramIndex++}`);
            params.push(input.timebox || null);
        }
        if (input.due !== undefined) {
            updates.push(`due = $${paramIndex++}`);
            params.push(input.due || null);
        }
        if (input.tags !== undefined) {
            updates.push(`tags = $${paramIndex++}`);
            params.push(JSON.stringify(input.tags));
        }
        if (input.links !== undefined) {
            updates.push(`links = $${paramIndex++}`);
            params.push(JSON.stringify(input.links));
        }
        if (updates.length === 0)
            return this.getById(id);
        updates.push(`updated_at = NOW()`);
        params.push(id);
        const sql = `
      UPDATE tasks_v2 SET ${updates.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
        const rows = await runQuery(sql, params);
        if (!rows[0])
            return null;
        const row = rows[0];
        return {
            ...row,
            tags: parseValue(row.tags, true),
            links: parseValue(row.links, true),
        };
    },
    async delete(id) {
        await runQuery("DELETE FROM tasks_v2 WHERE id = $1", [id]);
        return true;
    },
};
export const sessions = {
    async start(input = {}) {
        const sql = `
      INSERT INTO sessions (task_id, start_time)
      VALUES ($1, $2)
      RETURNING *
    `;
        const result = await runInsert(sql, [
            input.task_id || null,
            input.start_time || new Date(),
        ]);
        if (result.rows[0]) {
            return result.rows[0];
        }
        const fetched = await sessions.getById(result.insertId);
        if (!fetched)
            throw new Error("Failed to create session");
        return fetched;
    },
    async end(id, input = {}) {
        const updates = [];
        const params = [];
        let paramIndex = 1;
        updates.push(`end_time = $${paramIndex++}`);
        params.push(input.end_time || new Date());
        if (input.notes !== undefined) {
            updates.push(`notes = $${paramIndex++}`);
            params.push(input.notes || null);
        }
        updates.push(`updated_at = NOW()`);
        params.push(id);
        const sql = `
      UPDATE sessions SET ${updates.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
        const rows = await runQuery(sql, params);
        return rows[0] || null;
    },
    async getById(id) {
        const rows = await runQuery("SELECT * FROM sessions WHERE id = $1", [id]);
        return rows[0] || null;
    },
    async listByDay(date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        const sql = `
      SELECT * FROM sessions
      WHERE start_time >= $1 AND start_time <= $2
      ORDER BY start_time ASC
    `;
        return await runQuery(sql, [startOfDay, endOfDay]);
    },
    async listByTask(taskId) {
        const sql = `
      SELECT * FROM sessions
      WHERE task_id = $1
      ORDER BY start_time DESC
    `;
        return await runQuery(sql, [taskId]);
    },
    async getActive() {
        const sql = `
      SELECT * FROM sessions
      WHERE end_time IS NULL
      ORDER BY start_time DESC
      LIMIT 1
    `;
        const rows = await runQuery(sql, []);
        return rows[0] || null;
    },
};
function parseTimeboxToMinutes(timebox) {
    if (!timebox)
        return 0;
    const match = timebox.match(/^(\d+)(m|h)$/);
    if (!match)
        return 0;
    const value = parseInt(match[1], 10);
    return match[2] === "h" ? value * 60 : value;
}
function formatDate(date) {
    return date.toISOString().split("T")[0];
}
export async function generateTodaysPlan(date = new Date()) {
    const dayEvents = await events.listByDay(date);
    const dayTasks = await tasksV2.list({
        status: "ready",
        limit: 20,
    });
    const workEvents = dayEvents.filter((e) => e.type === "work");
    const personalEvents = dayEvents.filter((e) => ["hobby", "self-care", "social", "health"].includes(e.type));
    const workTasks = dayTasks.filter((t) => t.tags?.includes("work") || !t.tags?.length);
    const personalTasks = dayTasks.filter((t) => t.tags?.some((tag) => ["hobby", "health", "learning", "personal"].includes(tag)));
    const chapters = [];
    if (workEvents.length > 0 || workTasks.length > 0)
        chapters.push("Work");
    if (personalEvents.length > 0 || personalTasks.length > 0)
        chapters.push("Personal");
    return {
        date: formatDate(date),
        work: { events: workEvents, tasks: workTasks },
        personal: { events: personalEvents, tasks: personalTasks },
        chapters,
    };
}
export async function generateTodaysLog(date = new Date()) {
    const daySessions = await sessions.listByDay(date);
    const dayTasks = await tasksV2.list({});
    const completedTasks = dayTasks.filter((t) => t.status === "done" && new Date(t.updated_at).toDateString() === date.toDateString());
    const blockedTasks = dayTasks.filter((t) => t.status === "blocked");
    const totalMinutes = daySessions.reduce((sum, s) => {
        if (s.end_time) {
            return sum + Math.round((new Date(s.end_time).getTime() - new Date(s.start_time).getTime()) / 60000);
        }
        return sum;
    }, 0);
    const narrative = [
        completedTasks.length > 0 ? `Completed ${completedTasks.length} task(s)` : "No tasks completed today",
        blockedTasks.length > 0 ? `${blockedTasks.length} task(s) blocked` : "",
        `${totalMinutes} minutes logged in sessions`,
    ]
        .filter(Boolean)
        .join(". ") + ".";
    return {
        date: formatDate(date),
        sessions: daySessions,
        completedTasks,
        blockedTasks,
        narrative,
    };
}
export async function suggestEveningMicroSprint(date = new Date()) {
    const now = new Date(date);
    const eveningStart = new Date(date);
    eveningStart.setHours(18, 0, 0, 0);
    const midnight = new Date(date);
    midnight.setHours(23, 59, 59, 999);
    if (now > eveningStart) {
        eveningStart.setTime(now.getTime());
    }
    const dayEvents = await events.listByDay(date);
    const eveningEvents = dayEvents.filter((e) => new Date(e.start_time) >= eveningStart);
    const usedMinutes = eveningEvents.reduce((sum, e) => {
        return sum + Math.round((new Date(e.end_time).getTime() - new Date(e.start_time).getTime()) / 60000);
    }, 0);
    const availableMinutes = Math.max(0, 180 - usedMinutes);
    const hobbyTasks = await tasksV2.list({
        status: "ready",
        limit: 5,
    });
    const sortedHobbyTasks = hobbyTasks
        .filter((t) => t.tags?.some((tag) => ["hobby", "learning", "pixel-office"].includes(tag)))
        .sort((a, b) => {
        const aMins = parseTimeboxToMinutes(a.timebox);
        const bMins = parseTimeboxToMinutes(b.timebox);
        return aMins - bMins;
    });
    const suggestedTasks = [];
    let accumulated = 0;
    for (const task of sortedHobbyTasks) {
        const taskMinutes = parseTimeboxToMinutes(task.timebox) || 30;
        if (accumulated + taskMinutes <= availableMinutes && suggestedTasks.length < 2) {
            suggestedTasks.push(task);
            accumulated += taskMinutes;
        }
    }
    return {
        availableMinutes,
        suggestedTasks,
        calendarBlocks: eveningEvents,
    };
}
