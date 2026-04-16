"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConferenceRoomStorage = void 0;
var ConferenceRoomStorage = /** @class */ (function () {
    function ConferenceRoomStorage() {
        this.agents = new Map();
        this.rooms = new Map();
        this.events = new Map();
    }
    ConferenceRoomStorage.prototype.upsertAgent = function (agent) {
        this.agents.set(agent.agent_id, agent);
    };
    ConferenceRoomStorage.prototype.getAgent = function (agentId) {
        return this.agents.get(agentId);
    };
    ConferenceRoomStorage.prototype.listAgents = function (status) {
        var all = Array.from(this.agents.values());
        if (status) {
            return all.filter(function (a) { return a.status === status; });
        }
        return all;
    };
    ConferenceRoomStorage.prototype.upsertRoom = function (room) {
        this.rooms.set(room.room_id, room);
    };
    ConferenceRoomStorage.prototype.getRoom = function (roomId) {
        return this.rooms.get(roomId);
    };
    ConferenceRoomStorage.prototype.listRooms = function (status) {
        var all = Array.from(this.rooms.values());
        if (status) {
            return all.filter(function (r) { return r.status === status; });
        }
        return all;
    };
    ConferenceRoomStorage.prototype.getOpenRoomsWithPendingEpisodes = function () {
        var rooms = this.listRooms();
        return rooms.filter(function (room) {
            if (room.status !== "open" && room.status !== "in_progress")
                return false;
            return room.agenda.some(function (item) { return item.status === "pending"; });
        });
    };
    ConferenceRoomStorage.prototype.insertEvent = function (event) {
        var roomEvents = this.events.get(event.room_id) || [];
        roomEvents.push(event);
        this.events.set(event.room_id, roomEvents);
    };
    ConferenceRoomStorage.prototype.getRoomEvents = function (roomId, limit) {
        if (limit === void 0) { limit = 100; }
        var events = this.events.get(roomId) || [];
        return events.slice(-limit).reverse();
    };
    return ConferenceRoomStorage;
}());
exports.ConferenceRoomStorage = ConferenceRoomStorage;
