const TIME_STAGES = ['Night', 'Dawn', 'Morning', 'Noon', 'Afternoon', 'Dusk'];

/**
 * Map a normalized time-of-day value (0-1) to a human-friendly label.
 * @param {number} timeOfDay - Normalized time (0 inclusive, 1 exclusive).
 * @returns {string} Readable time stage.
 */
export function getTimeStage(timeOfDay) {
  if (!Number.isFinite(timeOfDay)) {
    throw new TypeError('timeOfDay must be a finite number');
  }
  const normalized = ((timeOfDay % 1) + 1) % 1; // wrap to [0,1)
  const index = Math.floor(normalized * TIME_STAGES.length) % TIME_STAGES.length;
  return TIME_STAGES[index];
}

/**
 * Apply nightly upkeep: consume food if available to heal, otherwise lose health.
 * @param {{ health: number, maxHealth: number, food: number }} state
 * @returns {{ health: number, food: number }}
 */
export function applyNightlyUpkeep(state) {
  const { health, maxHealth, food } = state;
  if (!Number.isFinite(health) || !Number.isFinite(maxHealth) || !Number.isFinite(food)) {
    throw new TypeError('state must contain finite numbers');
  }

  if (food > 0) {
    return {
      health: Math.min(maxHealth, health + 20),
      food: food - 1,
    };
  }

  return {
    health: Math.max(0, health - 15),
    food,
  };
}

/**
 * Update stamina and health regeneration/penalty based on movement.
 * @param {{ stamina: number, maxStamina: number, health: number }} state
 * @param {{ moving: boolean, delta: number }} context
 * @returns {{ stamina: number, health: number }}
 */
export function updateStaminaAndHealth(state, context) {
  const { stamina, maxStamina, health } = state;
  const { moving, delta } = context;

  if (!Number.isFinite(stamina) || !Number.isFinite(maxStamina) || !Number.isFinite(health)) {
    throw new TypeError('state must contain finite numbers');
  }
  if (!Number.isFinite(delta)) {
    throw new TypeError('delta must be a finite number');
  }

  let nextStamina = stamina;
  if (moving) {
    nextStamina = Math.max(0, nextStamina - delta * 10);
  } else {
    nextStamina = Math.min(maxStamina, nextStamina + delta * 18);
  }

  const nextHealth = nextStamina <= 0 ? Math.max(0, health - delta * 4) : health;

  return { stamina: nextStamina, health: nextHealth };
}

export { TIME_STAGES };
