// Simple test for flywheel integration
import { 
  depositConversationResidue, 
  depositTaskResidue, 
  depositDelegationResidue,
  depositSpatialResidue,
  depositOutcomeResidue
} from "./residueLogger";
import { analyzeOfficeResidues } from "./reviewHeatEngine";
import { evaluatePromotions } from "./promotionEngine";
import { evaluateAdaptations } from "./adaptationSystem";

console.log("Testing Flywheel Integration...");

// Test 1: Basic residue logging
console.log("\n1. Testing residue logging...");
depositConversationResidue(
  "test-session-1",
  "test topic",
  ["testAgent1", "testAgent2"],
  "kitchen",
  "This is a test conversation about reviewing PRs and addressing bottlenecks"
);

depositTaskResidue(
  "test-session-1",
  "test-task-1",
  "Test task from conversation",
  "completed"
);

depositDelegationResidue(
  "test-session-1",
  "testAgent1",
  "testAgent2",
  "code_review"
);

depositSpatialResidue(
  "kitchen",
  "conversation",
  "test topic",
  ["testAgent1", "testAgent2"],
  0.7
);

depositOutcomeResidue(
  "test-session-1",
  "test-task-1",
  "completed",
  {
    usefulness_score: 0.8,
    time_to_completion: 60,
    quality_indicators: { 
      completeness: 0.9,
      accuracy: 0.85 
    }
  }
);

// Test 2: Analysis
console.log("\n2. Testing office analysis...");
const analysis = analyzeOfficeResidues();
console.log(`Review Heat: ${analysis.review_heat.toFixed(2)}`);
console.log(`Task Shadow: ${analysis.task_shadow.toFixed(2)}`);
console.log(`Topic Persistence: ${analysis.topic_persistence.toFixed(2)}`);
console.log(`Delegation Confidence:`, analysis.delegation_confidence);
console.log(`Office Mood:`, analysis.office_mood);

// Test 3: Promotions
console.log("\n3. Testing promotions...");
const promotions = evaluatePromotions();
console.log(`Found ${promotions.length} potential promotions`);
promotions.forEach(p => {
  if (p.promoted) {
    console.log(`✓ Promoted: ${p.title} (${p.promotion_type})`);
  }
});

// Test 4: Adaptations
console.log("\n4. Testing adaptations...");
const adaptations = evaluateAdaptations();
console.log(`Routing rules: ${adaptations.routing_rules.length}`);
console.log(`Delegation preferences: ${adaptations.delegation_preferences.length}`);
console.log(`UI emphasis: ${adaptations.ui_emphasis.length}`);
console.log(`SCRUM prioritization: ${adaptations.scrum_prioritization.length}`);
console.log(`Memory settings: ${adaptations.memory_settings.length}`);

console.log("\n✅ Flywheel integration test complete!");