import test from 'node:test';
import assert from 'node:assert/strict';

import { applyNightlyUpkeep, getTimeStage, updateStaminaAndHealth } from '../src/gameLogic.js';

test('getTimeStage maps time of day to labels and wraps around', () => {
  assert.equal(getTimeStage(0), 'Night');
  assert.equal(getTimeStage(0.2), 'Dawn');
  assert.equal(getTimeStage(0.35), 'Morning');
  assert.equal(getTimeStage(0.51), 'Noon');
  assert.equal(getTimeStage(0.74), 'Afternoon');
  assert.equal(getTimeStage(0.95), 'Dusk');
  assert.equal(getTimeStage(1), 'Night');
});

test('getTimeStage rejects non-numeric input', () => {
  assert.throws(() => getTimeStage(NaN), /finite number/);
});

test('applyNightlyUpkeep heals when food is available', () => {
  const result = applyNightlyUpkeep({ health: 80, maxHealth: 120, food: 3 });
  assert.equal(result.food, 2);
  assert.equal(result.health, 100);
});

test('applyNightlyUpkeep caps health at max and reduces when starving', () => {
  const healed = applyNightlyUpkeep({ health: 115, maxHealth: 120, food: 1 });
  assert.equal(healed.health, 120);
  assert.equal(healed.food, 0);

  const starved = applyNightlyUpkeep({ health: 12, maxHealth: 120, food: 0 });
  assert.equal(starved.health, 0);
  assert.equal(starved.food, 0);
});

test('updateStaminaAndHealth drains stamina while moving and damages on exhaustion', () => {
  const delta = 1;
  const moving = updateStaminaAndHealth({ stamina: 5, maxStamina: 120, health: 50 }, { moving: true, delta });
  assert.equal(moving.stamina, 0);
  assert.equal(moving.health, 46);
});

test('updateStaminaAndHealth regenerates stamina while idle up to max', () => {
  const regenerated = updateStaminaAndHealth({ stamina: 80, maxStamina: 120, health: 60 }, { moving: false, delta: 1 });
  assert.equal(regenerated.stamina, 98);
  assert.equal(regenerated.health, 60);

  const capped = updateStaminaAndHealth({ stamina: 118, maxStamina: 120, health: 60 }, { moving: false, delta: 1 });
  assert.equal(capped.stamina, 120);
  assert.equal(capped.health, 60);
});

test('updateStaminaAndHealth validates input', () => {
  assert.throws(() => updateStaminaAndHealth({ stamina: NaN, maxStamina: 100, health: 50 }, { moving: true, delta: 1 }), /finite number/);
  assert.throws(() => updateStaminaAndHealth({ stamina: 10, maxStamina: 100, health: 50 }, { moving: true, delta: NaN }), /finite number/);
});
