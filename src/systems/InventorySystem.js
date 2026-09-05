export class InventorySystem {
  constructor(player) {
    this.player = player;

    // Currency & Raw Resources
    this.resources = {
      gold: 5,
      silver: 3,
      iron: 8,
      diamond: 1,
      stone: 10,
      leather: 2
    };

    // Foraged Foods
    this.foods = {
      berries: 3,
      mushroom: 2,
      herb: 2,
      lotus: 1
    };

    // Equipment state
    this.equippedWeapon = 'katana';
    this.equippedArmor = 'none';

    this.unlockedWeapons = new Set(['katana']);
    this.unlockedArmors = new Set(['none']);
  }

  addResource(type, count = 1) {
    if (this.resources[type] !== undefined) {
      this.resources[type] += count;
    } else if (this.foods[type] !== undefined) {
      this.foods[type] += count;
    }
  }

  hasResources(costs) {
    for (const [key, amount] of Object.entries(costs)) {
      if ((this.resources[key] || 0) < amount) {
        return false;
      }
    }
    return true;
  }

  deductResources(costs) {
    if (!this.hasResources(costs)) return false;
    for (const [key, amount] of Object.entries(costs)) {
      this.resources[key] -= amount;
    }
    return true;
  }

  eatFood(foodType) {
    if ((this.foods[foodType] || 0) <= 0) return false;
    this.foods[foodType]--;

    if (foodType === 'berries') {
      this.player.heal(25);
      this.player.restoreStamina(30);
    } else if (foodType === 'mushroom') {
      this.player.heal(35);
      this.player.restoreStamina(40);
    } else if (foodType === 'herb') {
      this.player.heal(50);
      this.player.restoreStamina(50);
    } else if (foodType === 'lotus') {
      this.player.heal(80);
      this.player.restoreStamina(80);
    }

    return true;
  }

  equipArmor(armorType) {
    if (this.unlockedArmors.has(armorType)) {
      this.equippedArmor = armorType;
      this.player.setArmor(armorType);
      return true;
    }
    return false;
  }

  equipWeapon(weaponType) {
    if (this.unlockedWeapons.has(weaponType)) {
      this.equippedWeapon = weaponType;
      this.player.setWeapon(weaponType);
      return true;
    }
    return false;
  }
}
