Task: Add “Test Inventory Workflow” button + coordinated inventory animation to tiny-router app

Goal
Add a new UI button labeled “Test Inventory Workflow” that triggers a coordinated animation showing how an inventory-routing workflow moves through the system. This is a simulation/visual demo, not a real backend integration yet.

Concept
The animation should demonstrate the difference between:
1. bulk object detection / perception
2. deterministic routing / coordinated workflow

When clicked, the app should animate a test inventory scenario:
- Inventory scan starts
- Items are detected
- Ambiguous/unstable items are flagged
- Router sends tasks to the correct role/node
- Human/agent verification resolves exceptions
- Final inventory state is logged

Suggested visual flow

[Inventory Scan]
      ↓
[Bulk Detect Objects]
      ↓
[Confidence Split]
   ↙        ↘
[Known SKU] [Ambiguous Item]
   ↓             ↓
[Auto Count]   [Route to Review]
   ↓             ↓
[Update State] [Human/Agent Verify]
      ↘       ↙
   [Inventory Log / Done]

Implementation Requirements

1. Add button
- Add a visible button in the main control panel/sidebar:
  “Test Inventory Workflow”
- It should not interfere with existing router controls.
- Keep styling consistent with the current app.

2. Add test workflow data
Create a small mock inventory scenario, for example:

const testInventoryWorkflow = [
  {
    id: "scan-start",
    label: "Inventory Scan",
    type: "input",
    status: "pending"
  },
  {
    id: "bulk-detect",
    label: "Bulk Detect Objects",
    type: "perception",
    status: "pending"
  },
  {
    id: "known-sku",
    label: "Known SKU",
    type: "auto",
    status: "pending"
  },
  {
    id: "ambiguous-item",
    label: "Ambiguous Item",
    type: "exception",
    status: "pending"
  },
  {
    id: "route-review",
    label: "Route to Review",
    type: "router",
    status: "pending"
  },
  {
    id: "verify",
    label: "Human / Agent Verify",
    type: "review",
    status: "pending"
  },
  {
    id: "inventory-log",
    label: "Inventory Log / Done",
    type: "output",
    status: "pending"
  }
];

3. Animation behavior
On button click:
- Reset prior animation state.
- Highlight each node in order.
- Animate a moving pulse/packet along the route.
- Use a distinct warning state for “Ambiguous Item.”
- Show that ambiguous objects are routed to review instead of being blindly counted.
- End with “Inventory Log / Done” marked complete.

Suggested sequence:
1. scan-start active
2. bulk-detect active
3. split into known-sku and ambiguous-item
4. known-sku goes to auto-count/update path
5. ambiguous-item routes to review
6. verify resolves exception
7. both paths converge at inventory-log

4. Add small status panel
Display a simple text log during animation:

Inventory workflow test running...
Scanning shelf state...
Detected 6 known SKUs.
Detected 2 ambiguous items.
Routing ambiguous items to review.
Verification complete.
Inventory state updated.

5. Keep this modular
Prefer adding:
- inventoryWorkflowDemo.js / inventoryWorkflowDemo.ts
- or a small component like InventoryWorkflowButton.jsx / .tsx

Avoid stuffing everything into the main app file unless the project is currently very small.

6. No backend required yet
This should be front-end only unless the app already has a clean simulation/event system.

7. Definition of Done
- Button appears in the UI.
- Clicking it triggers the full animation.
- Existing router behavior still works.
- Animation can be replayed repeatedly.
- Ambiguous-item routing is visually distinct.
- Console has no major errors.
- Code is modular enough to extend later.

Design intent
This feature is meant to demonstrate that inventory AI should not merely “count objects.” It should route uncertainty. The visual should make it obvious that the correct system response to ambiguity is coordinated review, not blind automation.
