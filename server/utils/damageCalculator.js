/**
 * Advanced Damage Calculator
 * Handles damage calculation with Pokemon stats, variance, and critical hits
 */

class DamageCalculator {
  constructor() {
    this.VARIANCE_MIN = 0.95;
    this.VARIANCE_MAX = 1.05;
    this.CRITICAL_CHANCE = 0.05;
    this.CRITICAL_MULTIPLIER = 1.5;
  }

  /**
   * Calculate base damage based on Pokemon stats
   */
  calculateBaseDamage(attacker, defender) {
    const attackerAttack = attacker.selectedPokemonDetails?.baseStats?.attack || 50;
    const defenderDefense = defender.selectedPokemonDetails?.baseStats?.defense || 50;
    
    // Base damage formula: attack / (1 + defense/100)
    const baseDamage = (attackerAttack / (1 + defenderDefense / 100));
    
    return baseDamage;
  }

  /**
   * Apply damage variance (95-105% of base damage)
   */
  applyVariance(baseDamage) {
    const variance = this.VARIANCE_MIN + Math.random() * (this.VARIANCE_MAX - this.VARIANCE_MIN);
    return baseDamage * variance;
  }

  /**
   * Check for critical hit
   */
  checkCritical() {
    return Math.random() < this.CRITICAL_CHANCE;
  }

  /**
   * Apply critical hit multiplier
   */
  applyCritical(damage, isCritical) {
    return isCritical ? damage * this.CRITICAL_MULTIPLIER : damage;
  }

  /**
   * Calculate damage with distance falloff (longer range = less damage)
   */
  applyDistanceFalloff(damage, distance, maxRange) {
    if (distance > maxRange) return 0;
    if (distance < maxRange * 0.5) return damage; // Full damage within half range
    
    const falloffFactor = 1 - ((distance - maxRange * 0.5) / (maxRange * 0.5));
    return damage * falloffFactor;
  }

  /**
   * Calculate final damage with all modifiers
   */
  calculateDamage(attacker, defender, baseDamage, distance = null, maxRange = null) {
    let damage = baseDamage;
    
    // Apply damage variance
    damage = this.applyVariance(damage);
    
    // Check for critical hit
    const isCritical = this.checkCritical();
    damage = this.applyCritical(damage, isCritical);
    
    // Apply distance falloff if applicable
    if (distance !== null && maxRange !== null) {
      damage = this.applyDistanceFalloff(damage, distance, maxRange);
    }
    
    // Ensure minimum damage of 1
    return Math.max(1, Math.round(damage));
  }

  /**
   * Calculate effective hitpoint damage based on defense
   */
  calculateEffectiveDamage(attacker, defender, baseDamage, distance = null, maxRange = null) {
    // First apply Pokemon stats
    const statDamage = this.calculateBaseDamage(attacker, defender);
    
    // Then apply all modifiers
    const finalDamage = this.calculateDamage(attacker, defender, statDamage, distance, maxRange);
    
    return {
      damage: finalDamage,
      isCritical: Math.random() < this.CRITICAL_CHANCE,
      breakdown: {
        base: baseDamage,
        statModified: statDamage,
        final: finalDamage
      }
    };
  }
}

module.exports = new DamageCalculator();

