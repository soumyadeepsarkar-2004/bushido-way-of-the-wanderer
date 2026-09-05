export class SaveSystem {
  constructor(game) {
    this.game = game;
    this.storageKey = 'bushido_save_v1';
    this.saveTimer = 0;
    this.saveInterval = 10; // Save every 10 seconds
  }

  save() {
    try {
      const data = {
        level: this.game.exp.level,
        currentXP: this.game.exp.currentXP,
        xpToLevel: this.game.exp.xpToLevel,
        equippedArmor: this.game.inventory.equippedArmor,
        equippedWeapon: this.game.inventory.equippedWeapon,
        unlockedWeapons: Array.from(this.game.inventory.unlockedWeapons),
        unlockedArmors: Array.from(this.game.inventory.unlockedArmors),
        resources: this.game.inventory.resources,
        foods: this.game.inventory.foods,
        currentPath: this.game.destiny.currentPath,
        bestStreak: this.game.streak.bestStreak,
        streakPoints: this.game.streak.streakPoints,
        formulatedScrolls: Array.from(this.game.alchemy.formulatedScrolls),
        timestamp: Date.now()
      };

      localStorage.setItem(this.storageKey, JSON.stringify(data));
      return true;
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
      return false;
    }
  }

  load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return false;

      const data = JSON.parse(raw);
      if (!data) return false;

      // Restore XP & Level
      this.game.exp.level = data.level || 1;
      this.game.exp.currentXP = data.currentXP || 0;
      this.game.exp.xpToLevel = data.xpToLevel || 100;
      this.game.player.setEvolutionStage(this.game.exp.level);

      // Restore Inventory & Unlocks
      if (data.resources) Object.assign(this.game.inventory.resources, data.resources);
      if (data.foods) Object.assign(this.game.inventory.foods, data.foods);
      if (data.unlockedWeapons) this.game.inventory.unlockedWeapons = new Set(data.unlockedWeapons);
      if (data.unlockedArmors) this.game.inventory.unlockedArmors = new Set(data.unlockedArmors);

      if (data.equippedArmor) this.game.inventory.equipArmor(data.equippedArmor);
      if (data.equippedWeapon) this.game.inventory.equipWeapon(data.equippedWeapon);

      // Restore Destiny Path
      if (data.currentPath) this.game.destiny.setPath(data.currentPath);

      // Restore Streaks
      if (data.bestStreak) this.game.streak.bestStreak = data.bestStreak;
      if (data.streakPoints) this.game.streak.streakPoints = data.streakPoints;

      // Restore Alchemy
      if (data.formulatedScrolls) {
        this.game.alchemy.formulatedScrolls = new Set(data.formulatedScrolls);
      }

      return true;
    } catch (e) {
      console.warn('Could not load from localStorage:', e);
      return false;
    }
  }

  update(delta) {
    this.saveTimer += delta;
    if (this.saveTimer >= this.saveInterval) {
      this.saveTimer = 0;
      this.save();
    }
  }
}
