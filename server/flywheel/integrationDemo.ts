// Flywheel Integration Demo for Pixel Office
// This demonstrates how the complete flywheel system would work

import { 
  depositConversationResidue, 
  depositTaskResidue, 
  depositDelegationResidue,
  depositSpatialResidue,
  depositOutcomeResidue
} from "./residueLogger";
import { analyzeOfficeResidues } from "./reviewHeatEngine";
import { evaluatePromotions } from "./promotionEngine";
import { evaluateAdaptations, applyAdaptations } from "./adaptationSystem";

// Simulate a complete flywheel cycle
export async function runFlywheelCycle() {
  console.log("=== Starting Pixel Office Flywheel Cycle ===\n");
  
  // 1. CAPTURE: Agents act and leave traces
  console.log("1. CAPTURE PHASE: Agents acting and leaving traces");
  
  // Simulate a cooler session about review backlog
  depositConversationResidue(
    "session-001",
    "We really need to address the PR review backlog - it's blocking our releases",
    ["OpenClaw", "LeslieClaw", "IronClaw"],
    "kitchen",
    "We really need to address the PR review backlog - it's blocking our releases. This has been going on for weeks and someone should really look into improving our review process."
  );
  
  // Simulate task creation from that conversation
  depositTaskResidue(
    "session-001",
    "task-001",
    "Investigate PR review bottleneck",
    "pending"
  );
  
  // Simulate delegation - someone asks for help
  depositDelegationResidue(
    "session-001",
    "OpenClaw",
    "HermitClaw",
    "process_analysis"
  );
  
  // Simulate spatial residue - where the conversation happened
  depositSpatialResidue(
    "kitchen",
    "conversation",
    "PR review backlog discussion",
    ["OpenClaw", "LeslieClaw", "IronClaw"],
    0.8 // high intensity because it's a recurring issue
  );
  
  // Simulate outcome - task gets completed successfully
  setTimeout(() => {
    depositOutcomeResidue(
      "session-001",
      "task-001",
      "completed",
      {
        usefulness_score: 0.9,
        time_to_completion: 120, // 2 hours
        quality_indicators: {
          clarity: 0.8,
          actionability: 0.9,
          impact: 0.85
        }
      }
    );
    
    // Small delay to let the outcome residue register
    setTimeout(async () => {
      // 2. INTERPRET: System analyzes the traces
      console.log("\n2. INTERPRET PHASE: System analyzing residue patterns");
      const analysis = analyzeOfficeResidues();
      
      console.log("Office Analysis:");
      console.log(`- Review Heat: ${analysis.review_heat.toFixed(2)}`);
      console.log(`- Task Shadow: ${analysis.task_shadow.toFixed(2)}`);
      console.log(`- Topic Persistence: ${analysis.topic_persistence.toFixed(2)}`);
      console.log(`- Office Mood: Valence=${analysis.office_mood.valence.toFixed(2)}, Arousal=${analysis.office_mood.arousal.toFixed(2)}`);
      
      // 3. PROMOTE: Turn high-value residue into structured objects
      console.log("\n3. PROMOTE PHASE: Converting residue to office objects");
      const promotions = evaluatePromotions();
      
      promotions.forEach(promo => {
        if (promo.promoted) {
          console.log(`✓ Promotion: ${promo.title}`);
          console.log(`  Type: ${promo.promotion_type}`);
          console.log(`  Rationale: ${promo.rationale}`);
        }
      });
      
      // 4. ADAPT: Office changes its behavior based on learned patterns
      console.log("\n4. ADAPT PHASE: Office adapting behavior");
      const adaptations = evaluateAdaptations();
      
      console.log("Adaptations to apply:");
      console.log(`- Routing Rules: ${adaptations.routing_rules.length}`);
      console.log(`- Delegation Preferences: ${adaptations.delegation_preferences.length}`);
      console.log(`- UI Emphasis: ${adaptations.ui_emphasis.length}`);
      console.log(`- SCRUM Prioritization: ${adaptations.scrum_prioritization.length}`);
      console.log(`- Memory Settings: ${adaptations.memory_settings.length}`);
      
      // Apply the adaptations (in a real system, this would update office behavior)
      applyAdaptations(adaptations);
      
      console.log("\n=== Flywheel Cycle Complete ===");
      console.log("The office has learned from this interaction and will behave differently next time!");
    }, 1000);
  }, 2000);
}

// Run the demo if this file is executed directly
if (require.main === module) {
  runFlywheelCycle().catch(console.error);
}