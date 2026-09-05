import { soundManager } from '../engine/AudioSystem.js';

export class StoreSystem {
  constructor(inventory) {
    this.inventory = inventory;
    this.storeGoods = [
      {
        id: 'onigiri',
        name: 'Rice Ball (Onigiri)',
        icon: '🍙',
        desc: 'Traditional seaweed-wrapped rice ball. Restores 40 HP & 40 Stamina.',
        priceGold: 2,
        action: () => {
          this.inventory.player.heal(40);
          this.inventory.player.restoreStamina(40);
        }
      },
      {
        id: 'wildStew',
        name: 'Wild Mountain Stew',
        icon: '🍲',
        desc: 'Savory stew made with forest mushrooms and wild herbs. Restores 80 HP.',
        priceGold: 4,
        action: () => {
          this.inventory.player.heal(80);
          this.inventory.player.restoreStamina(80);
        }
      },
      {
        id: 'ironPack',
        name: 'Pack of Refined Iron',
        icon: '⛏️',
        desc: 'Bundle of 5 refined iron ores for weaponsmithing.',
        priceGold: 3,
        action: () => {
          this.inventory.addResource('iron', 5);
        }
      },
      {
        id: 'diamondPack',
        name: 'Uncut Diamond Gem',
        icon: '💎',
        desc: 'Extremely rare diamond crystal mined from the highest peaks.',
        priceGold: 10,
        action: () => {
          this.inventory.addResource('diamond', 1);
        }
      },
      {
        id: 'ammoKit',
        name: 'Matchlock Powder & Bullets',
        icon: '💥',
        desc: 'Ammunition kit for feudal firearms.',
        priceGold: 4,
        action: () => {
          this.inventory.addResource('stone', 8);
          this.inventory.addResource('iron', 3);
        }
      }
    ];
  }

  buyItem(itemId) {
    const item = this.storeGoods.find(g => g.id === itemId);
    if (!item) return { success: false, reason: 'Item not found' };

    if (this.inventory.resources.gold < item.priceGold) {
      return { success: false, reason: 'Not enough gold coins!' };
    }

    this.inventory.resources.gold -= item.priceGold;
    item.action();
    soundManager.playStorePurchase();
    return { success: true, item };
  }
}
