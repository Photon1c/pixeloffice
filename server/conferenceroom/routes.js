"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConferenceRoomStorage = void 0;
exports.createConferenceRoomRouter = createConferenceRoomRouter;
var express_1 = require("express");
var models_js_1 = require("./models.js");
var storage_js_1 = require("./storage.js");
Object.defineProperty(exports, "ConferenceRoomStorage", { enumerable: true, get: function () { return storage_js_1.ConferenceRoomStorage; } });
function createConferenceRoomRouter(storage) {
    var router = (0, express_1.Router)();
    // POST /conferenceroom/agent/checkin
    router.post("/agent/checkin", function (req, res) {
        var data = req.body || {};
        var agentId = data.agent_id;
        if (!agentId) {
            return res.status(400).json({ ok: false, error: "agent_id required" });
        }
        var existingAgent = storage.getAgent(agentId);
        if (existingAgent) {
            if (data.display_name)
                existingAgent.display_name = data.display_name;
            if (data.role)
                existingAgent.role = data.role;
            if (data.status)
                existingAgent.status = data.status;
            if (data.capabilities)
                existingAgent.capabilities = data.capabilities;
            if (data.x !== undefined)
                existingAgent.x = data.x;
            if (data.y !== undefined)
                existingAgent.y = data.y;
            existingAgent.last_checkin_utc = (0, models_js_1.getCurrentUtc)();
            storage.upsertAgent(existingAgent);
            console.log("[Conferenceroom] Agent check-in received: ".concat(agentId));
            return res.json({ ok: true, agent: existingAgent });
        }
        else {
            var newAgent = {
                agent_id: agentId,
                display_name: data.display_name || agentId,
                role: data.role || "",
                status: data.status || "available",
                capabilities: data.capabilities || [],
                last_checkin_utc: (0, models_js_1.getCurrentUtc)(),
                x: 100, // Default starting position
                y: 100
            };
            storage.upsertAgent(newAgent);
            console.log("[Conferenceroom] Agent check-in received: ".concat(agentId));
            return res.json({ ok: true, agent: newAgent });
        }
    });
    // GET /conferenceroom/agents
    router.get("/agents", function (req, res) {
        var status = req.query.status;
        var agents = storage.listAgents(status);
        res.json({ agents: agents });
    });
    // POST /conferenceroom/rooms
    router.post("/rooms", function (req, res) {
        var data = req.body || {};
        var title = data.title || "Untitled Room";
        var agentIds = data.agents || [];
        var agendaData = data.agenda || [];
        var agenda = agendaData.map(function (item) { return ({
            episode_id: item.episode_id || "",
            label: item.label || "",
            status: "pending",
        }); });
        var room = {
            room_id: (0, models_js_1.generateRoomId)(),
            title: title,
            status: "open",
            created_utc: (0, models_js_1.getCurrentUtc)(),
            agents: agentIds,
            agenda: agenda,
        };
        storage.upsertRoom(room);
        console.log("[Conferenceroom] Room created: ".concat(room.room_id));
        res.json({ room: room });
    });
    // GET /conferenceroom/rooms
    router.get("/rooms", function (req, res) {
        var status = req.query.status;
        var rooms = storage.listRooms(status);
        res.json({ rooms: rooms });
    });
    // GET /conferenceroom/rooms/:room_id
    router.get("/rooms/:room_id", function (req, res) {
        var roomId = req.params.room_id;
        var room = storage.getRoom(roomId);
        if (!room) {
            return res.status(404).json({ ok: false, error: "Room not found" });
        }
        var events = storage.getRoomEvents(roomId);
        res.json({ room: room, events: events });
    });
    // POST /conferenceroom/rooms/:room_id/status
    router.post("/rooms/:room_id/status", function (req, res) {
        var roomId = req.params.room_id;
        var data = req.body || {};
        var status = data.status;
        if (!status) {
            return res.status(400).json({ ok: false, error: "status required" });
        }
        var room = storage.getRoom(roomId);
        if (!room) {
            return res.status(404).json({ ok: false, error: "Room not found" });
        }
        room.status = status;
        storage.upsertRoom(room);
        res.json({ ok: true, room: room });
    });
    // POST /conferenceroom/rooms/:room_id/events
    router.post("/rooms/:room_id/events", function (req, res) {
        var roomId = req.params.room_id;
        var data = req.body || {};
        var room = storage.getRoom(roomId);
        if (!room) {
            return res.status(404).json({ ok: false, error: "Room not found" });
        }
        var event = {
            event_id: (0, models_js_1.generateEventId)(),
            room_id: roomId,
            agent_id: data.agent_id || "",
            timestamp_utc: (0, models_js_1.getCurrentUtc)(),
            event_type: data.event_type || "NOTE",
            payload: data.payload || {},
        };
        storage.insertEvent(event);
        if (event.event_type === "EPISODE_RESULT") {
            var payload = event.payload;
            var episodeId = payload.episode_id;
            if (episodeId) {
                for (var _i = 0, _a = room.agenda; _i < _a.length; _i++) {
                    var item = _a[_i];
                    if (item.episode_id === episodeId) {
                        item.status = payload.status === "completed" ? "completed" : "failed";
                        storage.upsertRoom(room);
                        break;
                    }
                }
            }
            console.log("[Conferenceroom] Episode result posted: ".concat(episodeId));
        }
        res.json({ ok: true, event: event });
    });
    // POST /conferenceroom/checkin (upgrade-beta style)
    router.post("/checkin", function (req, res) {
        var data = req.body || {};
        var agentId = data.agent_id;
        if (!agentId) {
            return res.status(400).json({ ok: false, error: "agent_id required" });
        }
        var existingAgent = storage.getAgent(agentId);
        var now = data.ts;
        if (existingAgent) {
            if (now)
                existingAgent.last_checkin_utc = now;
            if (data.capabilities)
                existingAgent.capabilities = data.capabilities;
            if (data.status && typeof data.status === "object") {
                var statusObj = data.status;
                existingAgent.status = statusObj.ok === false ? "busy" : "available";
            }
            storage.upsertAgent(existingAgent);
        }
        else {
            var newAgent = {
                agent_id: agentId,
                display_name: agentId,
                role: "",
                status: "available",
                capabilities: data.capabilities || [],
                last_checkin_utc: now,
                x: 0,
                y: 0,
            };
            storage.upsertAgent(newAgent);
        }
        console.log("[Conferenceroom] Checkin received: ".concat(agentId));
        res.json({ ok: true, instructions: [], next_poll_sec: 20 });
    });
    // POST /conferenceroom/report (upgrade-beta style)
    router.post("/report", function (req, res) {
        var data = req.body || {};
        var agentId = data.agent_id;
        var jobId = data.job_id;
        if (!agentId || !jobId) {
            return res.status(400).json({ ok: false, error: "agent_id and job_id required" });
        }
        console.log("[Conferenceroom] Report from ".concat(agentId, ": job=").concat(jobId, ", ok=").concat(data.ok));
        res.json({ ok: true });
    });
    // POST /conferenceroom/agent/:agentId/move - Move an agent by delta coordinates
    router.post("/agent/:agentId/move", function (req, res) {
        var agentId = req.params.agentId;
        var data = req.body || {};
        var dx = data.dx || 0;
        var dy = data.dy || 0;
        var agent = storage.getAgent(agentId);
        if (!agent) {
            return res.status(404).json({ ok: false, error: "Agent not found" });
        }
        // Update agent position (you would need to add x/y properties to your Agent model)
        // For now, we'll just acknowledge the request
        console.log("[Conferenceroom] Move request for ".concat(agentId, ": dx=").concat(dx, ", dy=").concat(dy));
        // In a real implementation, you would update the agent's position here
        // and then broadcast the change via websockets or similar
        res.json({ ok: true, message: "Agent ".concat(agentId, " moved by (").concat(dx, ", ").concat(dy, ")") });
    });
    return router;
}
