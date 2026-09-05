import { soundManager } from '../engine/AudioSystem.js';

export class AbilitiesSystem {
  constructor(player) {
    this.player = player;

    this.abilities = {
      thunder: {
        id: 'thunder',
        name: 'Thunder Step',
        key: 'Q',
        icon: '⚡',
        colorHex: 0x00e5ff,
        duration: 30,
        cooldown: 45,
        remainingTime: 0,
        cooldownTimer: 0,
        isActive: false,
        desc: '+60% Movement speed & Electric Blade Slashes'
      },
      flame: {
        id: 'flame',
        name: 'Flame Blade',
        key: 'R',
        icon: '🔥',
        colorHex: 0xff5722,
        duration: 45,
        cooldown: 60,
        remainingTime: 0,
        cooldownTimer: 0,
        isActive: false,
        desc: 'Ignites blade with fire for +40% Bonus Burn Damage'
      },
      spirit: {
        id: 'spirit',
        name: 'Spirit Ward',
        key: 'F',
        icon: '🛡️',
        colorHex: 0xffd700,
        duration: 30,
        cooldown: 50,
        remainingTime: 0,
        cooldownTimer: 0,
        isActive: false,
        desc: 'Immunity to ghost curses & +30% Armor Defense'
      },
      shadow: {
        id: 'shadow',
        name: 'Shadow Veil',
        key: 'T',
        icon: '🌑',
        colorHex: 0x7e57c2,
        duration: 25,
        cooldown: 40,
        remainingTime: 0,
        cooldownTimer: 0,
        isActive: false,
        desc: 'Invisibility from lurker ambush pounces'
      }
    };
  }

  triggerAbility(abilityId) {
    const ab = this.abilities[abilityId];
    if (!ab) return false;

    // Check if on cooldown or currently active
    if (ab.cooldownTimer > 0 || ab.isActive) {
      return false;
    }

    ab.isActive = true;
    ab.remainingTime = ab.duration;
    ab.cooldownTimer = ab.cooldown;

    if (abilityId === 'thunder') soundManager.playThunderAbility();
    else if (abilityId === 'flame') soundManager.playFlameAbility();
    else if (abilityId === 'spirit') soundManager.playSpiritAbility();
    else if (abilityId === 'shadow') soundManager.playShadowAbility();
    else soundManager.playAbilityActivation();
    this.updateAura();

    return true;
  }

  updateAura() {
    if (this.abilities.flame.isActive) {
      this.player.model.setElementalAura(0xff5722, 0.85);
    } else if (this.abilities.thunder.isActive) {
      this.player.model.setElementalAura(0x00e5ff, 0.85);
    } else if (this.abilities.spirit.isActive) {
      this.player.model.setElementalAura(0xffd700, 0.85);
    } else if (this.abilities.shadow.isActive) {
      this.player.model.setElementalAura(0x9c27b0, 0.85);
    } else {
      this.player.model.setElementalAura(0xffffff, 0.0);
    }
  }

  update(delta) {
    let auraChanged = false;

    for (const key in this.abilities) {
      const ab = this.abilities[key];

      // Active duration countdown
      if (ab.isActive) {
        ab.remainingTime -= delta;
        if (ab.remainingTime <= 0) {
          ab.isActive = false;
          ab.remainingTime = 0;
          auraChanged = true;
        }
      }

      // Cooldown timer countdown
      if (ab.cooldownTimer > 0) {
        ab.cooldownTimer -= delta;
        if (ab.cooldownTimer < 0) ab.cooldownTimer = 0;
      }
    }

    if (auraChanged) {
      this.updateAura();
    }
  }

  hasBuff(abilityId) {
    return !!(this.abilities[abilityId] && this.abilities[abilityId].isActive);
  }
}
