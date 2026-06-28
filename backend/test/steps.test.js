import { test } from "node:test";
import assert from "node:assert/strict";
import { computeStatus, emptySteps, STEP_IDS } from "../src/steps.js";

test("status is 'planned' when no steps are completed", () => {
  assert.equal(computeStatus(emptySteps()), "planned");
});

test("status is 'ongoing' when some but not all steps are completed", () => {
  const steps = emptySteps();
  steps[STEP_IDS[0]] = true;
  assert.equal(computeStatus(steps), "ongoing");
});

test("status is 'done' when all steps are completed", () => {
  const steps = {};
  for (const id of STEP_IDS) steps[id] = true;
  assert.equal(computeStatus(steps), "done");
});

test("status handles missing keys as incomplete", () => {
  assert.equal(computeStatus({}), "planned");
});
