import * as THREE from 'three';

export class RadarUI {
  constructor() {
    this._buildDOM();
    this.range = 60;
  }

  _buildDOM() {
    this.canvas = document.getElementById('radar-canvas');
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.id = 'radar-canvas';
      document.body.appendChild(this.canvas);
    }
    this.canvas.width = 128;
    this.canvas.height = 128;
    this.canvas.style.cssText = `
      position:fixed;top:16px;right:16px;width:128px;height:128px;
      border-radius:50%;border:2px solid rgba(212,175,55,0.6);
      box-shadow:0 0 12px rgba(0,0,0,0.7),inset 0 0 20px rgba(0,0,0,0.4);
      image-rendering:pixelated;z-index:800;pointer-events:none;
    `;
    this.ctx = this.canvas.getContext('2d');
  }

  update(playerPos, playerAngle, enemies = [], interactives = [], npcs = []) {
    const ctx = this.ctx;
    const W = 128, H = 128, cx = 64, cy = 64, r = 62;

    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(4,8,4,0.82)'; ctx.fill();
    ctx.restore();

    ctx.strokeStyle = 'rgba(100,130,100,0.2)'; ctx.lineWidth = 0.5;
    for (let ring = 1; ring <= 3; ring++) {
      ctx.beginPath(); ctx.arc(cx, cy, (r / 3) * ring, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy);
    ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r);
    ctx.stroke();

    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r - 2, 0, Math.PI * 2); ctx.clip();

    const toRadar = (worldPos) => {
      const dx = worldPos.x - playerPos.x;
      const dz = worldPos.z - playerPos.z;
      const cos = Math.cos(-playerAngle), sin = Math.sin(-playerAngle);
      const rx = dx * cos - dz * sin;
      const rz = dx * sin + dz * cos;
      const scale = r / this.range;
      return { x: cx + rx * scale, y: cy + rz * scale, inRange: Math.sqrt(dx * dx + dz * dz) < this.range };
    };

    const drawDot = (x, y, color, size = 3, glow = false) => {
      if (glow) { ctx.shadowBlur = 6; ctx.shadowColor = color; }
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    };

    for (const enemy of enemies) {
      if (enemy.isDead) continue;
      const pos = enemy.mesh?.position || enemy.group?.position;
      if (!pos) continue;
      const { x, y, inRange } = toRadar(pos);
      if (!inRange) continue;
      const isBoss = enemy.type === 'boss';
      drawDot(x, y, isBoss ? '#cc00ff' : '#ff3333', isBoss ? 5 : 3, isBoss);
    }

    for (const obj of interactives) {
      if (!obj.position) continue;
      const { x, y, inRange } = toRadar(obj.position);
      if (!inRange) continue;
      if (obj.userData?.isMineable) {
        const oreColors = { gold: '#ffd700', iron: '#aaaaaa', diamond: '#00e5ff' };
        drawDot(x, y, oreColors[obj.userData.oreType] || '#ffffff', 2.5);
      } else if (obj.userData?.isRelicShrine) {
        drawDot(x, y, '#00ffcc', 3, true);
      } else if (obj.userData?.isAlchemyAltar) {
        drawDot(x, y, '#ff9900', 3, true);
      } else if (obj.userData?.isBossGate) {
        drawDot(x, y, '#ff00aa', 4, true);
      }
    }

    for (const npc of npcs) {
      const pos = npc.group?.position || npc.position;
      if (!pos) continue;
      const { x, y, inRange } = toRadar(pos);
      if (!inRange) continue;
      drawDot(x, y, '#66ff66', 3, true);
    }
    ctx.restore();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(-4, 5); ctx.lineTo(0, 3); ctx.lineTo(4, 5);
    ctx.closePath(); ctx.fill();
    ctx.restore();

    ctx.strokeStyle = 'rgba(212,175,55,0.5)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();

    ctx.fillStyle = 'rgba(212,175,55,0.7)';
    ctx.font = '9px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('N', cx, cy - r + 9);
    ctx.fillText('S', cx, cy + r - 9);
    ctx.fillText('W', cx - r + 9, cy);
    ctx.fillText('E', cx + r - 9, cy);
  }

  show() { this.canvas.style.display = 'block'; }
  hide() { this.canvas.style.display = 'none'; }
}
