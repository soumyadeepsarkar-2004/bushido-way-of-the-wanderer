export class DestinySystem {
  constructor(player) {
    this.player = player;

    this.paths = {
      kensei: {
        id: 'kensei',
        name: 'Kensei (Sword Saint)',
        kanji: '剣聖',
        icon: '⚔️',
        title: 'Master of the Blade',
        desc: 'Unmatched katana duelist. Perfect parries inflict severe stun, +30% sword slash damage, and wider deflect timing.',
        damageMultiplier: 1.3,
        speedMultiplier: 1.0,
        parryWindowBonus: 0.15,
        armorBonus: 0.1
      },
      shinobi: {
        id: 'shinobi',
        name: 'Shinobi (Shadow Assassin)',
        kanji: '忍',
        icon: '🥷',
        title: 'Ghost of the Bamboo',
        desc: 'Silent agile shadow. +35% sprinting speed, double shuriken throw rate, and 2.5x backstab damage from behind enemies.',
        damageMultiplier: 1.1,
        speedMultiplier: 1.35,
        parryWindowBonus: 0.0,
        armorBonus: 0.0
      },
      onmyoji: {
        id: 'onmyoji',
        name: 'Onmyōji (Spirit Exorcist)',
        kanji: '陰陽師',
        icon: '🪬',
        title: 'Wielder of Elements',
        desc: 'Master of spiritual rites. Banishes ethereal yōkai ghosts with sacred talismans and radiates protective wards.',
        damageMultiplier: 1.15,
        speedMultiplier: 1.05,
        parryWindowBonus: 0.05,
        armorBonus: 0.2
      },
      teppo: {
        id: 'teppo',
        name: 'Teppō Marksman (Gunner)',
        kanji: '鉄砲手',
        icon: '💥',
        title: 'Thunderer of the Battlefield',
        desc: 'Feudal firearms pioneer. Wields the Tanegashima matchlock rifle with double ammunition capacity and armor-piercing iron shot.',
        damageMultiplier: 1.25,
        speedMultiplier: 0.95,
        parryWindowBonus: 0.0,
        armorBonus: 0.15
      }
    };

    this.currentPath = 'kensei'; // default starting affinity
  }

  setPath(pathId) {
    if (!this.paths[pathId]) return false;
    this.currentPath = pathId;
    return true;
  }

  getCurrentPath() {
    return this.paths[this.currentPath];
  }

  getDamageMultiplier() {
    return this.paths[this.currentPath].damageMultiplier;
  }

  getSpeedMultiplier() {
    return this.paths[this.currentPath].speedMultiplier;
  }
}
