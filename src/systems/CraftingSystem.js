export class CraftingSystem {
  constructor(inventory) {
    this.inventory = inventory;

    this.recipes = {
      // --- WEAPONS & AMMUNITION ---
      katana: {
        id: 'katana',
        category: 'weapons',
        name: 'Fine Steel Katana',
        icon: '🗡️',
        desc: 'Balanced blade crafted from folded iron. Reliable base slashes.',
        damage: 25,
        cost: { iron: 3, stone: 2 }
      },
      nodachi: {
        id: 'nodachi',
        category: 'weapons',
        name: 'Gilded Nodachi',
        icon: '⚔️',
        desc: 'Massive two-handed greatsword reinforced with gold and stone.',
        damage: 45,
        cost: { gold: 4, iron: 4, stone: 3 }
      },
      sunBlade: {
        id: 'sunBlade',
        category: 'weapons',
        name: 'Celestial Sun Blade',
        icon: '✨',
        desc: 'Mythical blade forged with sacred gold and uncut diamond.',
        damage: 70,
        cost: { gold: 6, diamond: 2, stone: 2 }
      },
      gunMatchlock: {
        id: 'gunMatchlock',
        category: 'weapons',
        name: 'Tanegashima Matchlock Gun',
        icon: '💥',
        desc: 'Feudal firearms shooting iron shot with devastating thunderous force.',
        damage: 90,
        cost: { iron: 6, gold: 3, stone: 4 }
      },
      shurikens: {
        id: 'shurikens',
        category: 'weapons',
        name: 'Shinobi Throwing Shurikens',
        icon: '🥷',
        desc: 'Quintuple four-pointed throwing stars forged of sharp iron.',
        damage: 35,
        cost: { iron: 2, stone: 1 }
      },

      // --- ARMORS ---
      armorLeather: {
        id: 'leather',
        category: 'armors',
        name: 'Leather Traveler Garb',
        icon: '🥋',
        desc: 'Supple boiled leather providing agility and +20% damage protection.',
        reduction: 20,
        cost: { leather: 3, silver: 1 }
      },
      armorIron: {
        id: 'iron',
        category: 'armors',
        name: 'Iron Gusoku Armor',
        icon: '🛡️',
        desc: 'Heavy interlocking steel plates offering +40% damage protection.',
        reduction: 40,
        cost: { iron: 6, leather: 2, stone: 4 }
      },
      armorGold: {
        id: 'gold',
        category: 'armors',
        name: 'Gilded Gold Plate',
        icon: '👑',
        desc: 'Radiant gold-inlaid samurai armor granting +55% damage reduction.',
        reduction: 55,
        cost: { gold: 8, iron: 4, silver: 3 }
      },
      armorDiamond: {
        id: 'diamond',
        category: 'armors',
        name: 'Celestial Diamond Armor',
        icon: '💎',
        desc: 'Indestructible crystal armor providing +75% damage reduction & curse immunity.',
        reduction: 75,
        cost: { diamond: 4, gold: 6, iron: 6 }
      }
    };
  }

  canCraft(recipeId) {
    const recipe = this.recipes[recipeId];
    if (!recipe) return false;
    return this.inventory.hasResources(recipe.cost);
  }

  craft(recipeId) {
    const recipe = this.recipes[recipeId];
    if (!recipe || !this.canCraft(recipeId)) {
      return { success: false, reason: 'Insufficient materials' };
    }

    this.inventory.deductResources(recipe.cost);

    if (recipe.category === 'weapons') {
      this.inventory.unlockedWeapons.add(recipe.id);
      this.inventory.equipWeapon(recipe.id);
    } else if (recipe.category === 'armors') {
      this.inventory.unlockedArmors.add(recipe.id);
      this.inventory.equipArmor(recipe.id);
    }

    return { success: true, item: recipe };
  }
}
