import { soundManager } from '../engine/AudioSystem.js';

export class ExperienceSystem {
  constructor(player) {
    this.player = player;
    this.currentXP = 0;
    this.xpToLevel = 100;
    this.level = 1;

    // Temporary lost XP pool that can be recovered by counter-attacking
    this.lostXPPool = 0;
    this.recoveryTimer = 0;
    this.recoveryWindow = 5.0; // 5 seconds to counter-attack

    this.onAlert = null;     // callback to show on-screen banner
    this.onLevelUp = null;   // callback when character grows
  }

  setCallbacks(onAlert, onLevelUp) {
    this.onAlert = onAlert;
    this.onLevelUp = onLevelUp;
  }

  addXP(amount, streakMultiplier = 1.0, reason = 'Training') {
    const finalXP = Math.round(amount * streakMultiplier);
    this.currentXP += finalXP;

    // Check level up
    while (this.currentXP >= this.xpToLevel) {
      this.currentXP -= this.xpToLevel;
      this.level++;
      this.xpToLevel = Math.round(this.xpToLevel * 1.45);

      soundManager.playLevelUp();
      const stageChanged = this.player.setEvolutionStage(this.level);

      if (this.onAlert) {
        this.onAlert({
          title: `⚔️ MASTERY ASCENDED: LEVEL ${this.level}!`,
          subtitle: stageChanged ? `Your spirit has evolved: You are now ${this.player.stageTitle}!` : 'Combat attributes and stamina amplified!',
          type: 'xp-gain'
        });
      }

      if (this.onLevelUp) {
        this.onLevelUp(this.level, this.player.stageTitle);
      }
    }
  }

  // Called when player is damaged by an enemy
  penalizeXPLoss(damageTaken) {
    // Calculate XP loss: proportional to damage taken
    const xpLost = Math.min(this.currentXP, Math.max(10, Math.round(damageTaken * 0.75)));

    if (xpLost > 0) {
      this.currentXP -= xpLost;
      this.lostXPPool = xpLost;
      this.recoveryTimer = this.recoveryWindow;

      soundManager.playXPLoss();

      if (this.onAlert) {
        this.onAlert({
          title: '⚠️ FOCUS SHATTERED!',
          subtitle: `-${xpLost} Skill XP Lost! Strike back within 5s to reclaim your focus!`,
          type: 'xp-loss'
        });
      }
    }
  }

  // Called when player successfully strikes back
  onPlayerCounterHit() {
    if (this.lostXPPool > 0 && this.recoveryTimer > 0) {
      const recovered = this.lostXPPool;
      this.currentXP += recovered;
      this.lostXPPool = 0;
      this.recoveryTimer = 0;

      if (this.onAlert) {
        this.onAlert({
          title: '⚡ FOCUS RECLAIMED!',
          subtitle: `+${recovered} Skill XP restored through disciplined counter-strike!`,
          type: 'xp-gain'
        });
      }
    }
  }

  update(delta, playerRunningDistance) {
    // Exploration / running XP: Running across the infinite world trains endurance!
    if (playerRunningDistance > 40) {
      this.addXP(15, 1.0, 'Endurance Running');
    }

    // Recovery timer decay
    if (this.recoveryTimer > 0) {
      this.recoveryTimer -= delta;
      if (this.recoveryTimer <= 0) {
        this.lostXPPool = 0;
      }
    }
  }

  getProgress() {
    return {
      currentXP: this.currentXP,
      xpToLevel: this.xpToLevel,
      percent: Math.min(100, Math.round((this.currentXP / this.xpToLevel) * 100)),
      level: this.level
    };
  }
}
