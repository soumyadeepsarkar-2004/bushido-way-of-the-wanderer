import * as THREE from 'three';

const NPC_CONFIGS = {
  chiyo: {
    name: 'Grandmother Chiyo', role: 'Village Cook', emoji: '👵',
    color: 0xe8c07a, clothColor: 0x8b4513,
    dialogueLines: [
      "Child... you carry the wind of warriors in your step. Eat well — the body must be strong before the spirit.",
      "I have cooked for three generations of wanderers. None were as hungry as you look right now.",
      "My grandson walked this same path. He became legend. You shall too, little sprout."
    ],
    gift: { type: 'berries', amount: 3 }, giftMessage: 'Chiyo gave you 3 Berries'
  },
  genkaku: {
    name: 'Elder Genkaku', role: 'Wandering Sensei', emoji: '🧙',
    color: 0xd4a080, clothColor: 0x2e4a1e,
    dialogueLines: [
      "The path of mastery begins with a single breath. Close your eyes... what do you hear?",
      "I have trained ten thousand strikes. But it was the ten-thousand-and-first that taught me patience.",
      "Your destiny is unwritten. That is not a curse — it is the greatest gift of all."
    ],
    gift: { type: 'xp', amount: 50 }, giftMessage: 'Genkaku shared wisdom — +50 XP'
  },
  muramasa: {
    name: 'Muramasa the Smith', role: 'Master Swordsmith', emoji: '⚒️',
    color: 0xa06040, clothColor: 0x1a1a2e,
    dialogueLines: [
      "Hmm. Your blade... it has seen things. Bring me iron and I shall make it sing again.",
      "The forge never lies. Metal reveals its truth under heat. So do men.",
      "Come back when you have found diamond ore. I have a design that would make the gods themselves weep."
    ],
    gift: { type: 'iron', amount: 3 }, giftMessage: 'Muramasa gifted you 3 Iron Ore'
  }
};

export { NPC_CONFIGS };

export class NPCManager {
  constructor(scene, dialogUI, inventory, exp, hud, soundManager) {
    this.scene = scene;
    this.dialogUI = dialogUI;
    this.inventory = inventory;
    this.exp = exp;
    this.hud = hud;
    this.soundManager = soundManager;
    this.npcs = [];
    this.interactiveObjects = [];
    this.giftCooldowns = {};
  }

  spawnNPC(npcId, position) {
    const config = NPC_CONFIGS[npcId];
    if (!config) return null;

    const group = this._buildNPCModel(config);
    group.position.copy(position);
    this.scene.add(group);

    const nameplate = this._buildNameplate(config);
    nameplate.position.y = 3.2;
    group.add(nameplate);

    group.userData.isNPC = true;
    group.userData.npcId = npcId;
    group.userData.npcName = config.name;

const npcObj = {
      id: npcId, config, group, nameplate,
      animTime: Math.random() * Math.PI * 2,
      position: group.position,
      _toPlayer: new THREE.Vector3()
    };

    this.npcs.push(npcObj);
    this.interactiveObjects.push(group);
    this.giftCooldowns[npcId] = 0;
    return group;
  }

  _buildNPCModel(config) {
    const group = new THREE.Group();
    const skinMat = new THREE.MeshStandardMaterial({ color: config.color, roughness: 0.8 });
    const clothMat = new THREE.MeshStandardMaterial({ color: config.clothColor, roughness: 0.9 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 1.0 });

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.36), skinMat);
    head.position.y = 1.72; head.castShadow = true;
    group.add(head);

    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.18, 0.4), hairMat);
    hair.position.y = 1.94;
    group.add(hair);

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.6, 0.32), clothMat);
    torso.position.y = 1.18; torso.castShadow = true;
    group.add(torso);

    for (const side of [-1, 1]) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.52, 0.18), clothMat);
      arm.position.set(side * 0.35, 1.18, 0); arm.castShadow = true;
      group.add(arm);
    }

    for (const side of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.55, 0.2), clothMat);
      leg.position.set(side * 0.13, 0.6, 0); leg.castShadow = true;
      group.add(leg);
    }

    const glow = new THREE.PointLight(0xffeecc, 0.6, 4);
    glow.position.y = 1.5;
    group.add(glow);
    return group;
  }

  _buildNameplate(config) {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    ctx.roundRect(4, 4, 248, 56, 8);
    ctx.fill();
    ctx.fillStyle = '#f5e6c8';
    ctx.font = 'bold 18px serif';
    ctx.textAlign = 'center';
    ctx.fillText(config.emoji + ' ' + config.name, 128, 28);
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '13px serif';
    ctx.fillText(config.role, 128, 48);

    const texture = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }));
    sprite.scale.set(2.2, 0.55, 1);
    return sprite;
  }

  interact(npcId) {
    const config = NPC_CONFIGS[npcId];
    if (!config) return;
    if (this.soundManager) this.soundManager.playNPCDialog?.();
    this.dialogUI.open(npcId, config, () => this._giveGift(npcId, config));
  }

  _giveGift(npcId, config) {
    if (this.giftCooldowns[npcId] > 0) {
      this.hud?.showAlert({ title: '🕐 PATIENCE', subtitle: `${config.name} will have more gifts soon.`, type: 'info' });
      return;
    }
    const gift = config.gift;
    if (gift.type === 'xp') {
      this.exp?.addXP(gift.amount, 1.0, config.giftMessage);
    } else {
      this.inventory?.addResource(gift.type, gift.amount);
    }
    this.hud?.showAlert({ title: '🎁 GIFT RECEIVED', subtitle: config.giftMessage, type: 'xp-gain' });
    this.giftCooldowns[npcId] = 120;
  }

  update(delta, playerPosition) {
    for (const npc of this.npcs) {
      if (this.giftCooldowns[npc.id] > 0) this.giftCooldowns[npc.id] -= delta;
      npc.animTime += delta;
npc.group.position.y = npc.position.y + Math.sin(npc.animTime * 1.2) * 0.05;
      const toPlayer = npc._toPlayer.subVectors(playerPosition, npc.group.position);
      toPlayer.y = 0;
      if (toPlayer.lengthSq() > 0.01) {
        const angle = Math.atan2(toPlayer.x, toPlayer.z);
        npc.group.rotation.y = THREE.MathUtils.lerp(npc.group.rotation.y, angle, delta * 2.0);
      }
    }
  }

  getInteractiveObjects() { return this.interactiveObjects; }
}
