# Opencode Handoff: Pixel Office Daily Plans & Task Management

## Goal

Enhance the current Pixel Office database and backend to support a **daily plan** feature driven by the existing tasks, with minimal new tables and a single Flask route that generates a daily plan via the OpenAI API.

This should integrate cleanly into the existing Pixel Office / LeslieClaw stack, using the `u510826077_ironfort` MySQL database.

## 1. Database Changes (MySQL)

Target DB: `u510826077_ironfort`

Add **three** tables to support task management and daily plans.

### a) `tasks` – what’s on the plate

```sql
CREATE TABLE tasks (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  status ENUM('open', 'in_progress', 'done', 'archived') DEFAULT 'open',
  priority TINYINT UNSIGNED DEFAULT 3, -- 1 = highest, 5 = lowest
  estimated_minutes TINYINT UNSIGNED DEFAULT 12, -- 6–18 min buckets if you want
  due_date DATE NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_status (status),
  INDEX idx_due_priority (status, due_date, priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### b) `daily_plans` – header row per day

```sql
CREATE TABLE daily_plans (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  plan_date DATE NOT NULL,
  summary TEXT NULL, -- high-level narrative from the AI
  total_allocated_minutes INT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_plan_date (plan_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### c) `daily_plan_items` – slots for that day

```sql
CREATE TABLE daily_plan_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  daily_plan_id BIGINT UNSIGNED NOT NULL,
  task_id BIGINT UNSIGNED NOT NULL,
  slot_index INT UNSIGNED NOT NULL, -- 1, 2, 3... sequence for the day
  allocated_minutes TINYINT UNSIGNED NOT NULL,
  notes TEXT NULL, -- short directive from AI
  PRIMARY KEY (id),
  KEY idx_daily_plan (daily_plan_id),
  CONSTRAINT fk_daily_plan_items_plan FOREIGN KEY (daily_plan_id)
    REFERENCES daily_plans(id) ON DELETE CASCADE,
  CONSTRAINT fk_daily_plan_items_task FOREIGN KEY (task_id)
    REFERENCES tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**Task for opencode:**
- Generate the appropriate migration / SQL scripts for `u510826077_ironfort` to create these tables.
- Ensure naming and charset match existing Pixel Office conventions.

## 2. Backend: Daily Plan Route (Flask)

We want a **single Flask route** that:

1. Reads open tasks from `tasks`.
2. Calls the LLM once to generate a daily plan.
3. Writes the result to `daily_plans` and `daily_plan_items`.
4. Returns the plan JSON to the Pixel Office / LeslieClaw frontend.

### Assumptions

- There is an existing Flask app for Pixel Office / LeslieClaw.
- There is an existing `get_db()` or equivalent that returns a MySQL connection to `u510826077_ironfort`.
- There is an existing OpenAI client / helper for calling models (currently gpt-5.1 is the preferred model; feel free to adapt the model name from the example).

### Proposed blueprint and route

Create a new module, e.g. `daily_plan.py` in the backend, with the following logic (adapt it to your app layout):

```python
import datetime
import json
from flask import Blueprint, request, jsonify

# Adjust the import paths below to match the existing codebase
# from your_app.db import get_db
# from your_app.openai_client import call_model


daily_bp = Blueprint("daily", __name__)


def get_db():
    """Return a MySQL connection to u510826077_ironfort.
    TODO: Wire this to the existing DB connector (pymysql / mysqlclient / SQLAlchemy).
    """
    raise NotImplementedError("Wire get_db() to your existing MySQL connection")


def call_openai_daily_plan(tasks, max_minutes=450, min_slot=6, max_slot=18):
    """Call the LLM once to get a JSON daily plan.

    `tasks` is a list of dict rows from MySQL.

    Expected return structure:
    {
      "summary": "...",
      "total_allocated_minutes": 432,
      "items": [
        {"task_id": 12, "allocated_minutes": 12, "notes": "Do quick review first"},
        {"task_id": 7, "allocated_minutes": 18, "notes": "Deep focus, no distractions"},
        ...
      ]
    }
    """
    system_msg = (
        "You are a workload planner for a single knowledge worker with 450 minutes "
        "of capacity per day. Tasks are 6–18 minutes each. You must produce a JSON "
        "plan that respects total capacity and uses only provided task_ids."
    )

    user_payload = {
        "capacity_minutes": max_minutes,
        "min_slot_minutes": min_slot,
        "max_slot_minutes": max_slot,
        "tasks": [
            {
                "id": t["id"],
                "title": t["title"],
                "description": t.get("description"),
                "priority": t.get("priority"),
                "estimated_minutes": t.get("estimated_minutes"),
                "due_date": t.get("due_date").isoformat() if t.get("due_date") else None,
            }
            for t in tasks
        ],
    }

    user_msg = (
        "Given the following open tasks and constraints, create a JSON object with keys "
        "`summary`, `total_allocated_minutes`, and `items` (a list of objects with "
        "`task_id`, `allocated_minutes`, and `notes`).\n\n"
        "Constraints:\n"
        f"- Total allocated minutes <= {max_minutes}\n"
        f"- Each slot between {min_slot} and {max_slot} minutes\n"
        "- Use only task_ids from the list.\n"
        "- Prefer higher priority and nearer due_date.\n\n"
        "Tasks JSON:\n" + json.dumps(user_payload, ensure_ascii=False)
    )

    # TODO: replace this block with your existing OpenAI client call
    from openai import OpenAI
    client = OpenAI()
    resp = client.chat.completions.create(
        model="gpt-5.1",  # adjust to your configured model
        messages=[
            {"role": "system", "content": system_msg},
            {"role": "user", "content": user_msg},
        ],
        response_format={"type": "json_object"},
        temperature=0.2,
    )
    content = resp.choices[0].message.content
    return json.loads(content)


@daily_bp.route("/api/daily_plan", methods=["POST"])
def generate_daily_plan():
    """Generate or regenerate today's daily plan.

    - Reads open tasks from `tasks`.
    - Calls LLM once to allocate up to 450 minutes.
    - Writes header into `daily_plans`.
    - Writes slots into `daily_plan_items`.
    - Returns the plan JSON.
    """
    today = datetime.date.today()
    conn = get_db()
    cur = conn.cursor(dictionary=True)

    # 1) Fetch open tasks (tune WHERE as you like)
    cur.execute(
        """
        SELECT id, title, description, status, priority, estimated_minutes, due_date
        FROM tasks
        WHERE status IN ('open', 'in_progress')
        ORDER BY priority ASC,
                 COALESCE(due_date, '9999-12-31') ASC,
                 id ASC
        LIMIT 100
        """
    )
    tasks = cur.fetchall()

    if not tasks:
        return jsonify({"message": "No open tasks found.", "plan": None}), 200

    # 2) Call the AI once
    try:
        plan = call_openai_daily_plan(tasks)
    except Exception as e:
        return jsonify({"error": "Failed to generate plan", "details": str(e)}), 500

    summary = plan.get("summary", "")
    total_allocated = int(plan.get("total_allocated_minutes", 0))
    items = plan.get("items", [])

    if not items:
        return jsonify({"error": "Plan contained no items"}), 500

    # 3) Upsert daily_plans row for today
    cur.execute(
        """
        INSERT INTO daily_plans (plan_date, summary, total_allocated_minutes)
        VALUES (%s, %s, %s)
        ON DUPLICATE KEY UPDATE
          summary = VALUES(summary),
          total_allocated_minutes = VALUES(total_allocated_minutes),
          created_at = created_at
        """,
        (today, summary, total_allocated),
    )
    conn.commit()

    # 4) Get the plan id (either inserted or existing)
    cur.execute("SELECT id FROM daily_plans WHERE plan_date = %s", (today,))
    row = cur.fetchone()
    daily_plan_id = row["id"]

    # 5) Clear any previous items for today
    cur.execute("DELETE FROM daily_plan_items WHERE daily_plan_id = %s", (daily_plan_id,))

    # 6) Insert new items
    slot_index = 1
    for item in items:
        task_id = int(item.get("task_id"))
        alloc_min = int(item.get("allocated_minutes", 0))
        notes = item.get("notes", "")
        if alloc_min <= 0:
            continue

        cur.execute(
            """
            INSERT INTO daily_plan_items
              (daily_plan_id, task_id, slot_index, allocated_minutes, notes)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (daily_plan_id, task_id, slot_index, alloc_min, notes),
        )
        slot_index += 1

    conn.commit()

    # 7) Return the plan to the UI
    return jsonify(
        {
            "plan_date": today.isoformat(),
            "summary": summary,
            "total_allocated_minutes": total_allocated,
            "items": items,
        }
    ), 200
```

**Tasks for opencode in this section:**
- Wire `get_db()` to the existing MySQL connector for `u510826077_ironfort`.
- Replace the inline OpenAI client call with the existing application-specific model client (using gpt-5.1 as configured).
- Place this blueprint module in the correct backend location and register it in the main Flask app, e.g.:

```python
from daily_plan import daily_bp
app.register_blueprint(daily_bp)
```

- Adjust imports, logging, and error-handling to match the codebase style.

## 3. Pixel Office / Admin Cockpit Integration

This piece is primarily for later, but good to note in the handoff so the wiring is clear:

- In the Pixel Office **admin cockpit**, especially around the existing **"Evaluate due stock forecasts"** section, add:
  - A way to call `POST /api/daily_plan` (e.g. a button or scheduled action) to generate todays plan.
  - A UI panel that displays:
    - The `summary` from `daily_plans`.
    - The ordered list of `daily_plan_items` with:
      - Slot number,
      - Task title,
      - Allocated minutes,
      - Notes.

This turns Pixel Office into an operational daily cockpit with:
- Forecast evaluation (existing), and
- A task-aware daily plan (new), backed by the same AI stack.

## 4. Done Criteria

- [ ] The three tables (`tasks`, `daily_plans`, `daily_plan_items`) exist in `u510826077_ironfort`.
- [ ] `POST /api/daily_plan`:
  - Reads from `tasks`.
  - Calls the configured LLM once.
  - Writes/updates a `daily_plans` row for today.
  - Writes `daily_plan_items` rows for today.
  - Returns valid JSON resembling the plan.
- [ ] Basic error paths handled:
  - No open tasks → 200 with `{"message": "No open tasks found.", "plan": null}`.
  - LLM failure → 500 with error info.
- [ ] (Optional, but ideal) Admin cockpit UI updated to show todays plan when present.
