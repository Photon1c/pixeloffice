7️⃣ What I Would Do Next (Very Controlled)

Two small refinements only:

A) Add a completed_at field to daily_plan_items

So you can track:

Planned vs executed

Drift

Over-allocation

B) Add one analytics query:
SELECT
  plan_date,
  total_allocated_minutes,
  SUM(CASE WHEN t.status = 'done' THEN dpi.allocated_minutes ELSE 0 END) AS executed_minutes
FROM daily_plans dp
JOIN daily_plan_items dpi ON dp.id = dpi.daily_plan_id
JOIN tasks t ON dpi.task_id = t.id
GROUP BY plan_date
ORDER BY plan_date DESC;

That gives you:
Capacity discipline.