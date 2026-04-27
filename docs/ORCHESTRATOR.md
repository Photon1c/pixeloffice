# Pixel Office Agent Orchestrator

Runs autonomous agent activities using local Ollama models. When you wake up, there will be progress reports and agent activity.

## Models Used

- **Primary**: `gemma3:270m` (~20 tok/s)
- **Fallback**: `qwen:0.5b` (~17 tok/s)

Both are fast, local small models ideal for scheduled operations.

## Quick Start

```bash
cd /home/sherlockhums/apps/pixelworld/pixel_office/server

# Start orchestrator (runs in background)
node orchestrator.cjs --start

# Or install as systemd service
sudo cp pixel-office-orchestrator.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now pixel-office-orchestrator

# Check status
node orchestrator.cjs --status

# Run one cycle immediately
node orchestrator.cjs --runnow

# Stop
node orchestrator.cjs --stop
```

## Activity Types

### Scheduled (every 15 min)
- Each agent role performs one action
- Topics: review updates, check communications, generate ideas, write notes

### Random (every 5-10 min)
- Agent pairing/checkins between roles
- Bounce ideas off one another

### Output Files
- Report: `data/orchestrator_report.json`
- Log: `data/orchestrator.log`

## Agent Roles

- `clerk` - Project management
- `specialist` - Technical work  
- `custodian` - Office maintenance
- `thought_loop` - Ideas and analysis

## Configuration

Edit `model_role_mapping.json` to change models per role:

```json
{
  "clerk": { "model_name": "gemma3:270m", "provider": "ollama" },
  "specialist": { "model_name": "gemma3:270m", "provider": "ollama" }
}
```