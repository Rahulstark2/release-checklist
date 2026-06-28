// The fixed list of release steps. Same steps apply to every release.
// We only store completion booleans per release, keyed by these ids.
// If you ever add/remove a step here, existing releases simply gain/lose
// a key in their `steps` JSON - no migration needed.
export const STEPS = [
  { id: "pr_merged", label: "All relevant GitHub pull requests have been merged" },
  { id: "changelog_updated", label: "CHANGELOG.md files have been updated" },
  { id: "tests_passing", label: "All tests are passing" },
  { id: "github_release_created", label: "Release in GitHub created" },
  { id: "deployed_demo", label: "Deployed in demo" },
  { id: "tested_demo", label: "Tested thoroughly in demo" },
  { id: "deployed_production", label: "Deployed in production" },
];

export const STEP_IDS = STEPS.map((s) => s.id);

export function emptySteps() {
  return Object.fromEntries(STEP_IDS.map((id) => [id, false]));
}

// Compute status from a steps object: { stepId: boolean, ... }
export function computeStatus(steps) {
  const values = STEP_IDS.map((id) => Boolean(steps?.[id]));
  const completedCount = values.filter(Boolean).length;
  if (completedCount === 0) return "planned";
  if (completedCount === values.length) return "done";
  return "ongoing";
}
