# Cooler Talk Feature - Implementation Summary

**Date:** 2026-03-17
**Feature:** Water Cooler Chat Animation

## Overview

Added a "Cooler Talk" button to the Pixel Office UI that triggers agents to gather around the water cooler in the kitchen area for casual conversation. The feature uses local ollama models to generate dialogue displayed in speech bubbles above the agents.

## Changes

### Frontend (`src/components/PixelOffice.tsx`)
- Added "Cooler Talk" button (purple `#7c5cbf`) below the "Train" button
- Button triggers `/api/coolertalk` endpoint
- On success: moves 4-6 random agents to kitchen positions, displays dialogue bubbles
- Agents return to desks after 1 minute
- Dialogue updates every 5 seconds during session

### Layout (`src/utils/layout.ts`)
- Added `KITCHEN_COOLER_POINTS` array with 6 positions around water cooler

### Drawing (`src/utils/drawAgent.ts`)
- Improved speech bubble visibility:
  - Font size: 10px → 14px
  - Bubble height: 16px → 24px
  - Minimum width: 120px
  - Added brown border stroke
  - Cream/yellow fill color (`rgba(255, 248, 220, 0.98)`)
  - Higher positioning above agents

### Server API (`server/index.ts`)

**POST /api/coolertalk**
- Selects 4-6 random agents
- Assigns kitchen positions
- Generates initial dialogue using ollama (llama3.2 model)
- Returns assignments and dialogues

**GET /api/coolertalk/dialogue**
- Returns updated dialogue during session

**GET /api/coolertalk/log**
- Returns in-memory conversation history (last 10 sessions)

### Conversation Logging

- Each session saved to: `/home/sherlockhums/apps/pixelworld/pixel_office/cooler_talk_log.md`
- Format: Markdown with timestamp, topic, participants, and dialogue
- Console logs with `[CoolerTalk]` prefix for debugging

## Agent Names
- FrontDesk, IronClaw, ZeroClaw, HermitClaw, OpenClaw, LeslieClaw, Sherlobster, Hercule Prawnro

## Sample Topics
- weekend plans
- the coffee machine
- latest office gossip
- whether the AC is broken
- the ping pong tournament
- the weather

## Future Enhancements
- SCRUM session button (planned)
- Different conversation styles per agent personality
- Voice/typing indicators
