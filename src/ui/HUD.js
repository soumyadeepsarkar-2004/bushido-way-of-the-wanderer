import { soundManager } from '../engine/AudioSystem.js';

export class HUD {
  constructor() {
    // Health & Stamina & XP
    this.hpBar = document.getElementById('hp-bar');
    this.hpVal = document.getElementById('hp-val');
    this.staminaBar = document.getElementById('stamina-bar');
    this.staminaVal = document.getElementById('stamina-val');
    this.xpBar = document.getElementById('xp-bar');
    this.xpVal = document.getElementById('xp-val');

    this.playerStageBadge = document.getElementById('player-stage-badge');
    this.playerLevelText = document.getElementById('player-level-text');

    // Streaks
    this.streakCount = document.getElementById('streak-count');
    this.streakMult = document.getElementById('streak-mult');

    // Resources
    this.resGold = document.getElementById('res-gold');
    this.resIron = document.getElementById('res-iron');
    this.resDiamond = document.getElementById('res-diamond');
    this.resFood = document.getElementById('res-food');

    // Alert Banner
    this.alertBanner = document.getElementById('alert-banner');
    this.alertTitle = document.getElementById('alert-title');
    this.alertSub = document.getElementById('alert-sub');
    this.alertTimeout = null;

    // Damage screen flash
    this.damageFlash = document.getElementById('damage-flash');

    // Interaction prompt
    this.interactPrompt = document.getElementById('interact-prompt');
    this.interactText = document.getElementById('interact-text');

    // Ability slots
    this.abilitySlots = {
      thunder: { el: document.getElementById('ability-thunder'), cd: document.getElementById('cd-thunder'), timer: document.getElementById('timer-thunder') },
      flame: { el: document.getElementById('ability-flame'), cd: document.getElementById('cd-flame'), timer: document.getElementById('timer-flame') },
      spirit: { el: document.getElementById('ability-spirit'), cd: document.getElementById('cd-spirit'), timer: document.getElementById('timer-spirit') },
      shadow: { el: document.getElementById('ability-shadow'), cd: document.getElementById('cd-shadow'), timer: document.getElementById('timer-shadow') }
    };

    // Floating damage numbers container
    this.floatContainer = document.createElement('div');
    this.floatContainer.id = 'float-container';
    this.floatContainer.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:25;overflow:hidden;';
    document.getElementById('ui-container').appendChild(this.floatContainer);

    // Enemy health bars container
    this.enemyBarsContainer = document.createElement('div');
    this.enemyBarsContainer.id = 'enemy-bars';
    this.enemyBarsContainer.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:18;overflow:hidden;';
    document.getElementById('ui-container').appendChild(this.enemyBarsContainer);

    this.enemyBarElements = new Map();

    this._lastAbilityState = {};

    // Low HP warning
    this.lowHpShown = false;
  }

  updatePlayerStatus(player, expProgress) {
    const hpPct = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
    if (hpPct !== this._lastHpPct) {
      this._lastHpPct = hpPct;
      this.hpBar.style.width = `${hpPct}%`;
    }
    const hpText = `${Math.round(player.hp)} / ${player.maxHp}`;
    if (hpText !== this._lastHpText) {
      this._lastHpText = hpText;
      this.hpVal.innerText = hpText;
    }

    const stamPct = Math.max(0, Math.min(100, (player.stamina / player.maxStamina) * 100));
    if (stamPct !== this._lastStamPct) {
      this._lastStamPct = stamPct;
      this.staminaBar.style.width = `${stamPct}%`;
    }
    const stamText = `${Math.round(player.stamina) / player.maxStamina}`;
    if (stamText !== this._lastStamText) {
      this._lastStamText = stamText;
      this.staminaVal.innerText = stamText;
    }

    const xpPct = expProgress.percent;
    if (xpPct !== this._lastXpPct) {
      this._lastXpPct = xpPct;
      this.xpBar.style.width = `${xpPct}%`;
    }
    const xpText = `${expProgress.currentXP} / ${expProgress.xpToLevel}`;
    if (xpText !== this._lastXpText) {
      this._lastXpText = xpText;
      this.xpVal.innerText = xpText;
    }

    const lvlText = `LVL ${player.level}`;
    if (lvlText !== this._lastLvlText) {
      this._lastLvlText = lvlText;
      this.playerLevelText.innerText = lvlText;
    }
    if (player.stageTitle !== this._lastStageTitle) {
      this._lastStageTitle = player.stageTitle;
      this.playerStageBadge.innerText = player.stageTitle;
    }

    // Low HP audio warning
    if (player.hp <= player.maxHp * 0.2 && !this.lowHpShown) {
      this.lowHpShown = true;
      if (soundManager.playLowHpWarning) {
        soundManager.playLowHpWarning();
      }
    } else if (player.hp > player.maxHp * 0.2) {
      this.lowHpShown = false;
    }
  }

  showFloatingDamage(amount, isCrit = false) {
    const el = document.createElement('div');
    el.style.cssText = `
      position:absolute; left:50%; top:40%; transform:translate(-50%, 0);
      font-family:var(--font-title); font-size:${isCrit ? '32px' : '24px'}; font-weight:900;
      color:${isCrit ? '#ff3333' : '#ffffff'}; text-shadow:0 0 10px ${isCrit ? 'rgba(255,0,0,0.6)' : 'rgba(255,255,255,0.4)'};
      pointer-events:none; white-space:nowrap; transition:all 1.2s ease-out;
    `;
    el.innerText = (isCrit ? 'CRIT! ' : '') + Math.round(amount);
    this.floatContainer.appendChild(el);
    requestAnimationFrame(() => {
      el.style.opacity = '0';
      el.style.transform = 'translate(-50%, -80px)';
    });
    setTimeout(() => el.remove(), 1200);
  }

  updateEnemyHealthBars(enemies) {
    const activeIds = new Set();
    for (const enemy of enemies) {
      if (enemy.isDead) continue;
      activeIds.add(enemy.mesh.uuid);
      if (!this.enemyBarElements.has(enemy.mesh.uuid)) {
        const bar = document.createElement('div');
        bar.style.cssText = 'position:absolute; left:0; top:0; width:60px; pointer-events:none; z-index:18;';
        const bg = document.createElement('div');
        bg.style.cssText = 'width:100%;height:6px;background:rgba(0,0,0,0.7);border-radius:3px;overflow:hidden;border:1px solid rgba(255,255,255,0.2);';
        const fill = document.createElement('div');
        fill.style.cssText = 'height:100%;width:100%;border-radius:3px;transition:width 0.2s;';
        fill.className = 'enemy-hp-fill';
        bg.appendChild(fill);
        bar.appendChild(bg);
        this.enemyBarsContainer.appendChild(bar);
        this.enemyBarElements.set(enemy.mesh.uuid, { bar, fill, enemy, lastPct: null, lastColor: null });
      }
      const hpPct = Math.max(0, (enemy.hp / enemy.maxHp) * 100);
      const barData = this.enemyBarElements.get(enemy.mesh.uuid);
      if (hpPct !== barData.lastPct) {
        barData.lastPct = hpPct;
        barData.fill.style.width = `${hpPct}%`;
      }
      const barColor = hpPct > 50 ? '#c41e3a' : hpPct > 25 ? '#ff5252' : '#b71c1c';
      if (barColor !== barData.lastColor) {
        barData.lastColor = barColor;
        barData.fill.style.background = barColor;
      }
    }
    // Remove bars for dead enemies
    for (const [uuid, data] of this.enemyBarElements) {
      if (!activeIds.has(uuid)) {
        data.bar.remove();
        this.enemyBarElements.delete(uuid);
      }
    }
  }

  updateStreaks(streakSystem) {
    const count = streakSystem.currentStreak;
    if (count !== this._lastStreakCount) {
      this._lastStreakCount = count;
      this.streakCount.innerText = count;
    }
    const mult = `${streakSystem.streakMultiplier.toFixed(1)}x XP Boost`;
    if (mult !== this._lastStreakMult) {
      this._lastStreakMult = mult;
      this.streakMult.innerText = mult;
    }
  }

  updateResources(inventory) {
    const gold = inventory.resources.gold;
    if (gold !== this._lastGold) {
      this._lastGold = gold;
      this.resGold.innerText = gold;
    }
    const iron = inventory.resources.iron + inventory.resources.silver;
    if (iron !== this._lastIron) {
      this._lastIron = iron;
      this.resIron.innerText = iron;
    }
    const diamond = inventory.resources.diamond;
    if (diamond !== this._lastDiamond) {
      this._lastDiamond = diamond;
      this.resDiamond.innerText = diamond;
    }
    const totalFood = Object.values(inventory.foods).reduce((a, b) => a + b, 0);
    if (totalFood !== this._lastFood) {
      this._lastFood = totalFood;
      this.resFood.innerText = totalFood;
    }
  }

  updateAbilities(abilitiesSystem) {
    for (const [key, ab] of Object.entries(abilitiesSystem.abilities)) {
      const slot = this.abilitySlots[key];
      if (!slot) continue;
      if (ab.isActive) {
        const state = `a:${Math.ceil(ab.remainingTime)}`;
        if (this._lastAbilityState[key] === state) continue;
        this._lastAbilityState[key] = state;
        slot.el.classList.add('active');
        slot.timer.style.display = 'block';
        slot.timer.innerText = `${Math.ceil(ab.remainingTime)}s`;
        slot.cd.style.height = '0%';
      } else {
        const cdPct = ab.cooldownTimer > 0 ? (ab.cooldownTimer / ab.cooldown) * 100 : 0;
        const state = `i:${cdPct}`;
        if (this._lastAbilityState[key] === state) continue;
        this._lastAbilityState[key] = state;
        slot.el.classList.remove('active');
        slot.timer.style.display = 'none';
        slot.cd.style.height = `${cdPct}%`;
      }
    }
  }

  showDamageFlash() {
    this.damageFlash.style.opacity = '1';
    setTimeout(() => { this.damageFlash.style.opacity = '0'; }, 180);
  }

  showAlert(data) {
    if (this.alertTimeout) clearTimeout(this.alertTimeout);
    this.alertTitle.innerText = data.title;
    this.alertSub.innerText = data.subtitle;
    this.alertBanner.className = `interactive ${data.type || 'xp-loss'} show`;
    this.alertTimeout = setTimeout(() => { this.alertBanner.classList.remove('show'); }, 3800);
  }

  showInteractionPrompt(text) {
    if (text) {
      this.interactText.innerText = text;
      this.interactPrompt.style.display = 'flex';
    } else {
      this.interactPrompt.style.display = 'none';
    }
  }

  showGameOver() {
    const overlay = document.createElement('div');
    overlay.id = 'game-over-overlay';
    overlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:300;font-family:var(--font-title);';
    overlay.innerHTML = `
      <div style="font-size:72px;font-weight:900;color:#c41e3a;text-shadow:0 0 40px rgba(196,30,58,0.6);margin-bottom:16px;">YOU FELL</div>
      <div style="font-size:20px;color:#888;letter-spacing:2px;margin-bottom:32px;">Your journey ends here</div>
      <button id="game-over-btn" style="background:linear-gradient(135deg,#d4af37,#b8860b);color:#0c0e12;border:none;border-radius:8px;padding:16px 48px;font-family:var(--font-title);font-weight:900;font-size:18px;cursor:pointer;letter-spacing:2px;box-shadow:0 0 30px rgba(212,175,55,0.5);">RISE AGAIN</button>
    `;
    document.getElementById('ui-container').appendChild(overlay);
    document.getElementById('game-over-btn').addEventListener('click', () => {
      overlay.remove();
      if (typeof game !== 'undefined') {
        location.reload();
      }
    });
  }
}
