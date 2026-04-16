"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRoomId = generateRoomId;
exports.generateEventId = generateEventId;
exports.getCurrentUtc = getCurrentUtc;
function generateRoomId() {
    var now = new Date();
    var dateStr = now.toISOString().split("T")[0];
    var randomPart = Math.random().toString(36).substring(2, 10);
    return "conf-".concat(dateStr, "-").concat(randomPart);
}
function generateEventId() {
    return "evt-".concat(Math.random().toString(36).substring(2, 10));
}
function getCurrentUtc() {
    return new Date().toISOString();
}
