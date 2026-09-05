import { soundManager } from '../engine/AudioSystem.js';

export class AlchemySystem {
  constructor(abilitiesSystem, inventorySystem, expSystem) {
    this.abilities = abilitiesSystem;
    this.inventory = inventorySystem;
    this.exp = expSystem;

    // Formulation recipes that distill temporary abilities into permanent scrolls
    this.scrollRecipes = [
      {
        id: 'scrollGodspeed',
        name: 'Scroll of Godspeed',
        icon: '⚡📜',
        reqAbility: 'thunder',
        reqResource: { gold: 2 },
        desc: 'Permanent +15% Sprint & Running Speed.',
        apply: () => {
          this.inventory.player.walkSpeed *= 1.15;
          this.inventory.player.sprintSpeed *= 1.15;
        }
      },
      {
        id: 'scrollFierySpirit',
        name: 'Scroll of Fiery Spirit',
        icon: '🔥📜',
        reqAbility: 'flame',
        reqResource: { stone: 3, silver: 1 },
        desc: 'Permanent +15 Base Blade Damage.',
        apply: () => {
          this.inventory.player.baseDamage += 15;
        }
      },
      {
        id: 'scrollIronMind',
        name: 'Scroll of Iron Mind',
        icon: '🛡️📜',
        reqAbility: 'spirit',
        reqResource: { diamond: 1 },
        desc: 'Permanent +20% Damage Reduction.',
        apply: () => {
          this.inventory.player.damageReduction = Math.min(0.85, this.inventory.player.damageReduction + 0.2);
        }
      },
      {
        id: 'scrollCamouflage',
        name: 'Scroll of Camouflage',
        icon: '🌑📜',
        reqAbility: 'shadow',
        reqResource: { herb: 2, leather: 1 },
        desc: 'Permanent +30 Max Stamina for swift evasion.',
        apply: () => {
          this.inventory.player.maxStamina += 30;
          this.inventory.player.stamina = this.inventory.player.maxStamina;
        }
      }
    ];

    this.formulatedScrolls = new Set();
  }

  canFormulate(recipeId) {
    const r = this.scrollRecipes.find(x => x.id === recipeId);
    if (!r) return false;
    if (this.formulatedScrolls.has(recipeId)) return false;

    // Check if ability is active OR if remaining cooldown is running
    const hasAbilityActive = this.abilities.hasBuff(r.reqAbility) || this.abilities.abilities[r.reqAbility].cooldownTimer > 0;
    if (!hasAbilityActive) return false;

    // Check resources
    return this.inventory.hasResources(r.reqResource);
  }

  formulate(recipeId) {
    const r = this.scrollRecipes.find(x => x.id === recipeId);
    if (!r || !this.canFormulate(recipeId)) {
      return { success: false, reason: 'Requires active ability and resources' };
    }

    this.inventory.deductResources(r.reqResource);
    r.apply();
    this.formulatedScrolls.add(recipeId);

    soundManager.playFormulation();

    // Significant XP boost for mastering a permanent scroll
    this.exp.addXP(80, 1.0, `Formulated ${r.name}`);

    return { success: true, item: r };
  }
}
