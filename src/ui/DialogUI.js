export class DialogUI {
  constructor() {
    this._buildDOM();
    this.isDialogOpen = false;
    this.onConfirmCallback = null;
    this.currentNpcId = null;
    this.lineIndex = 0;
    this.dialogLines = [];
    this._typeInterval = null;
  }

  _buildDOM() {
    this.container = document.createElement('div');
    this.container.id = 'dialog-container';
    this.container.style.cssText = `
      display:none;position:fixed;bottom:80px;left:50%;transform:translateX(-50%);
      width:680px;max-width:95vw;
      background:linear-gradient(135deg,rgba(8,5,2,0.96),rgba(30,15,5,0.96));
      border:2px solid #8b6914;border-radius:6px;padding:24px 28px;
      font-family:Georgia,serif;color:#f5e6c8;
      box-shadow:0 0 40px rgba(180,120,20,0.3),inset 0 0 60px rgba(0,0,0,0.5);
      z-index:9999;pointer-events:all;
    `;

    const topStripe = document.createElement('div');
    topStripe.style.cssText = `position:absolute;top:0;left:0;right:0;height:3px;
      background:linear-gradient(90deg,transparent,#d4af37,transparent);border-radius:6px 6px 0 0;`;
    this.container.appendChild(topStripe);

    const header = document.createElement('div');
    header.style.cssText = `display:flex;align-items:center;gap:16px;margin-bottom:16px;
      padding-bottom:14px;border-bottom:1px solid rgba(212,175,55,0.3);`;

    this.portraitEl = document.createElement('div');
    this.portraitEl.style.cssText = `font-size:52px;width:72px;height:72px;display:flex;
      align-items:center;justify-content:center;
      background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.4);
      border-radius:4px;flex-shrink:0;`;

    const nameCol = document.createElement('div');
    this.nameEl = document.createElement('div');
    this.nameEl.style.cssText = `font-size:20px;font-weight:bold;color:#d4af37;letter-spacing:1px;`;
    this.roleEl = document.createElement('div');
    this.roleEl.style.cssText = `font-size:13px;color:#aaa;margin-top:4px;font-style:italic;`;
    nameCol.appendChild(this.nameEl);
    nameCol.appendChild(this.roleEl);
    header.appendChild(this.portraitEl);
    header.appendChild(nameCol);
    this.container.appendChild(header);

    this.textEl = document.createElement('div');
    this.textEl.style.cssText = `font-size:16px;line-height:1.7;color:#f5e6c8;
      min-height:56px;padding:8px 0;letter-spacing:0.3px;`;
    this.container.appendChild(this.textEl);

    this.cursorEl = document.createElement('span');
    this.cursorEl.textContent = '▌';
    this.cursorEl.style.cssText = `color:#d4af37;`;

    if (!document.getElementById('dialog-blink-style')) {
      const style = document.createElement('style');
      style.id = 'dialog-blink-style';
      style.textContent = `@keyframes dlg-blink{0%,100%{opacity:1}50%{opacity:0}}
        #dialog-container span{animation:dlg-blink 0.8s step-end infinite;}`;
      document.head.appendChild(style);
    }

    const btnRow = document.createElement('div');
    btnRow.style.cssText = `display:flex;gap:12px;margin-top:18px;justify-content:flex-end;`;

    const bs = (bg, col) => `background:${bg};color:${col};border:none;padding:8px 20px;
      font-family:Georgia,serif;font-size:14px;cursor:pointer;border-radius:3px;letter-spacing:0.5px;`;

    this.nextBtn = document.createElement('button');
    this.nextBtn.textContent = 'Continue \u2192';
    this.nextBtn.style.cssText = bs('#d4af37', '#111');
    this.nextBtn.addEventListener('click', () => this._advance());

    this.giftBtn = document.createElement('button');
    this.giftBtn.textContent = '\uD83C\uDF81 Accept Gift';
    this.giftBtn.style.cssText = bs('#2e7d32', '#fff');
    this.giftBtn.style.display = 'none';
    this.giftBtn.addEventListener('click', () => { this.onConfirmCallback?.(); this.close(); });

    this.closeBtn = document.createElement('button');
    this.closeBtn.textContent = 'Farewell';
    this.closeBtn.style.cssText = bs('#444', '#aaa');
    this.closeBtn.addEventListener('click', () => this.close());

    btnRow.appendChild(this.nextBtn);
    btnRow.appendChild(this.giftBtn);
    btnRow.appendChild(this.closeBtn);
    this.container.appendChild(btnRow);
    document.body.appendChild(this.container);
  }

  open(npcId, config, onConfirm) {
    this.currentNpcId = npcId;
    this.dialogLines = config.dialogueLines || [];
    this.lineIndex = 0;
    this.onConfirmCallback = onConfirm;
    this.isDialogOpen = true;
    this.portraitEl.textContent = config.emoji;
    this.nameEl.textContent = config.name;
    this.roleEl.textContent = config.role;
    this.giftBtn.style.display = 'none';
    this.nextBtn.style.display = 'inline-block';
    this.container.style.display = 'block';
    this._showLine(0);
    document.exitPointerLock();
  }

  _showLine(index) {
    this.lineIndex = index;
    const line = this.dialogLines[index] || '';
    this.textEl.textContent = '';
    this.textEl.appendChild(this.cursorEl);
    let charIdx = 0;
    if (this._typeInterval) clearInterval(this._typeInterval);
    this._typeInterval = setInterval(() => {
      if (charIdx < line.length) {
        this.textEl.insertBefore(document.createTextNode(line[charIdx]), this.cursorEl);
        charIdx++;
      } else {
        clearInterval(this._typeInterval);
        this._typeInterval = null;
      }
    }, 28);
    const isLast = index >= this.dialogLines.length - 1;
    this.nextBtn.style.display = isLast ? 'none' : 'inline-block';
    this.giftBtn.style.display = isLast ? 'inline-block' : 'none';
  }

  _advance() {
    if (this._typeInterval) {
      clearInterval(this._typeInterval);
      this._typeInterval = null;
      this.textEl.textContent = this.dialogLines[this.lineIndex] || '';
      this.textEl.appendChild(this.cursorEl);
      return;
    }
    if (this.lineIndex < this.dialogLines.length - 1) this._showLine(this.lineIndex + 1);
  }

  close() {
    this.isDialogOpen = false;
    this.container.style.display = 'none';
    if (this._typeInterval) { clearInterval(this._typeInterval); this._typeInterval = null; }
    setTimeout(() => { document.getElementById('game-canvas')?.requestPointerLock(); }, 100);
  }

  isOpen() { return this.isDialogOpen; }
}
