export class ModalManager {
  constructor(inventory, crafting, store, expSystem, destinySystem, alchemySystem) {
    this.inventory = inventory;
    this.crafting = crafting;
    this.store = store;
    this.exp = expSystem;
    this.destiny = destinySystem;
    this.alchemy = alchemySystem;

    this.container = document.getElementById('modal-container');
    this.title = document.getElementById('modal-title');
    this.tabs = document.getElementById('modal-tabs');
    this.body = document.getElementById('modal-body');
    this.closeBtn = document.getElementById('modal-close-btn');

    this.currentModal = null;
    this._previousFocus = null;

    this.closeBtn.addEventListener('click', () => this.close());
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) {
        this.close();
      }
      // Focus trapping
      if (this.isOpen() && e.key === 'Tab') {
        this._trapFocus(e);
      }
    });
  }

  _trapFocus(e) {
    const focusable = this.container.querySelectorAll(
      'button, [tabindex]:not([tabindex="-1"]), input, select, textarea'
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  isOpen() {
    return this.container.style.display === 'flex';
  }

  close() {
    this.container.style.display = 'none';
    this.container.setAttribute('aria-hidden', 'true');
    this.currentModal = null;
    if (this._previousFocus) {
      this._previousFocus.focus();
      this._previousFocus = null;
    }
  }

  open(type) {
    this._previousFocus = document.activeElement;
    this.currentModal = type;
    this.container.style.display = 'flex';
    this.container.setAttribute('aria-hidden', 'false');
    this.container.setAttribute('role', 'dialog');
    this.container.setAttribute('aria-modal', 'true');

    if (type === 'crafting') {
      this.renderCraftingModal('weapons');
    } else if (type === 'store') {
      this.renderStoreModal();
    } else if (type === 'inventory') {
      this.renderInventoryModal();
    } else if (type === 'skills') {
      this.renderSkillsModal();
    } else if (type === 'destiny') {
      this.renderDestinyModal();
    } else if (type === 'alchemy') {
      this.renderAlchemyModal();
    }
    // Move focus to first focusable element
    requestAnimationFrame(() => {
      const first = this.container.querySelector('button, [tabindex]');
      if (first) first.focus();
    });
  }

  isOpen() {
    return this.container.style.display === 'flex';
  }

  close() {
    this.container.style.display = 'none';
    this.currentModal = null;
  }

  open(type) {
    this.currentModal = type;
    this.container.style.display = 'flex';

    if (type === 'crafting') {
      this.renderCraftingModal('weapons');
    } else if (type === 'store') {
      this.renderStoreModal();
    } else if (type === 'inventory') {
      this.renderInventoryModal();
    } else if (type === 'skills') {
      this.renderSkillsModal();
    } else if (type === 'destiny') {
      this.renderDestinyModal();
    } else if (type === 'alchemy') {
      this.renderAlchemyModal();
    }
  }

  // --- BLACKSMITH FORGE ---
  renderCraftingModal(activeCategory = 'weapons') {
    this.title.innerText = '⚔️ Master Blacksmith Forge';
    this.tabs.innerHTML = `
      <button class="modal-tab-btn ${activeCategory === 'weapons' ? 'active' : ''}" id="tab-weapons">Weapons & Firearms</button>
      <button class="modal-tab-btn ${activeCategory === 'armors' ? 'active' : ''}" id="tab-armors">Armor & Gusoku Sets</button>
    `;

    document.getElementById('tab-weapons').onclick = () => this.renderCraftingModal('weapons');
    document.getElementById('tab-armors').onclick = () => this.renderCraftingModal('armors');

    const recipes = Object.values(this.crafting.recipes).filter(r => r.category === activeCategory);

    let html = '<div class="grid-container">';
    recipes.forEach(r => {
      const canMake = this.crafting.canCraft(r.id);
      const isEquipped = (r.category === 'weapons' && this.inventory.equippedWeapon === r.id) ||
                         (r.category === 'armors' && this.inventory.equippedArmor === r.id);

      const costText = Object.entries(r.cost).map(([res, amt]) => {
        const has = this.inventory.resources[res] || 0;
        const color = has >= amt ? '#4caf50' : '#f44336';
        return `<span style="color: ${color}">${res.toUpperCase()}: ${has}/${amt}</span>`;
      }).join(' • ');

      html += `
        <div class="item-card ${isEquipped ? 'equipped' : ''}">
          <div class="item-card-header">
            <span class="item-card-icon">${r.icon}</span>
            <div>
              <div class="item-card-title">${r.name}</div>
              <div style="font-size: 11px; color: ${r.damage ? '#ff5252' : '#00e5ff'}; font-weight: bold;">
                ${r.damage ? `Attack Power: ${r.damage}` : `Damage Reduction: +${r.reduction}%`}
              </div>
            </div>
          </div>
          <div class="item-card-desc">${r.desc}</div>
          <div class="item-card-cost">${costText}</div>
          <button class="action-button" ${canMake && !isEquipped ? '' : 'disabled'} id="btn-craft-${r.id}">
            ${isEquipped ? 'EQUIPPED' : (canMake ? 'FORGE ITEM' : 'NEED ORES')}
          </button>
        </div>
      `;
    });
    html += '</div>';

    this.body.innerHTML = html;

    recipes.forEach(r => {
      const btn = document.getElementById(`btn-craft-${r.id}`);
      if (btn && !btn.disabled) {
        btn.onclick = () => {
          this.crafting.craft(r.id);
          this.renderCraftingModal(activeCategory);
        };
      }
    });
  }

  // --- MERCHANT STORE ---
  renderStoreModal() {
    this.title.innerText = '🏮 Village Wanderer Outpost Store';
    this.tabs.innerHTML = `
      <button class="modal-tab-btn active">Provisions & Materials</button>
    `;

    let html = '<div class="grid-container">';
    this.store.storeGoods.forEach(g => {
      const canAfford = this.inventory.resources.gold >= g.priceGold;
      html += `
        <div class="item-card">
          <div class="item-card-header">
            <span class="item-card-icon">${g.icon}</span>
            <div>
              <div class="item-card-title">${g.name}</div>
              <div style="font-size: 11px; color: #ffd700; font-weight: bold;">🪙 ${g.priceGold} Gold</div>
            </div>
          </div>
          <div class="item-card-desc">${g.desc}</div>
          <button class="action-button" ${canAfford ? '' : 'disabled'} id="btn-buy-${g.id}">
            ${canAfford ? 'PURCHASE' : 'NOT ENOUGH GOLD'}
          </button>
        </div>
      `;
    });
    html += '</div>';

    this.body.innerHTML = html;

    this.store.storeGoods.forEach(g => {
      const btn = document.getElementById(`btn-buy-${g.id}`);
      if (btn && !btn.disabled) {
        btn.onclick = () => {
          this.store.buyItem(g.id);
          this.renderStoreModal();
        };
      }
    });
  }

  // --- INVENTORY & FOODS ---
  renderInventoryModal() {
    this.title.innerText = '🎒 Inventory & Foraged Provisions';
    this.tabs.innerHTML = `
      <button class="modal-tab-btn active">Rucksack</button>
    `;

    let html = '<div class="grid-container">';

    // Display Foods
    const foodIcons = {
      berries: { name: 'Wild Red Berries', icon: '🫐', desc: 'Restores 25 HP & 30 Stamina' },
      mushroom: { name: 'Shiitake Mushroom', icon: '🍄', desc: 'Restores 35 HP & 40 Stamina' },
      herb: { name: 'Medicinal Forest Herb', icon: '🌿', desc: 'Restores 50 HP & 50 Stamina' },
      lotus: { name: 'Sacred Spirit Lotus', icon: '🪷', desc: 'Restores 80 HP & 80 Stamina' }
    };

    for (const [key, count] of Object.entries(this.inventory.foods)) {
      const meta = foodIcons[key];
      html += `
        <div class="item-card">
          <div class="item-card-header">
            <span class="item-card-icon">${meta.icon}</span>
            <div>
              <div class="item-card-title">${meta.name}</div>
              <div style="font-size: 11px; color: #00e5ff; font-weight: bold;">Quantity: ${count}</div>
            </div>
          </div>
          <div class="item-card-desc">${meta.desc}</div>
          <button class="action-button" ${count > 0 ? '' : 'disabled'} id="btn-eat-${key}">
            ${count > 0 ? 'CONSUME / EAT' : 'DEPLETED'}
          </button>
        </div>
      `;
    }

    html += '</div>';
    this.body.innerHTML = html;

    for (const key of Object.keys(this.inventory.foods)) {
      const btn = document.getElementById(`btn-eat-${key}`);
      if (btn && !btn.disabled) {
        btn.onclick = () => {
          this.inventory.eatFood(key);
          this.renderInventoryModal();
        };
      }
    }
  }

  // --- SKILL PROGRESSION & EVOLUTION ---
  renderSkillsModal() {
    this.title.innerText = '📜 Way of Bushido: Destiny & Growth';
    this.tabs.innerHTML = `<button class="modal-tab-btn active">Evolution Tree</button>`;

    const stages = [
      {
        title: 'Stage I: The Kid (Peasant Wanderer)',
        levelReq: 'Levels 1 - 4',
        desc: 'Unlearned novice awakening in the wilderness. Nimble and curious, discovers the basics of survival, running, and foraging wild food.',
        current: this.exp.level < 5
      },
      {
        title: 'Stage II: The Wandering Ronin',
        levelReq: 'Levels 5 - 9',
        desc: 'A hardened swordsman in a dark haori cloak. Has mastered the katana combo, parrying steel, and crafting heavy armor plates.',
        current: this.exp.level >= 5 && this.exp.level < 10
      },
      {
        title: 'Stage III: Legendary Samurai Lord',
        levelReq: 'Levels 10+',
        desc: 'A transcendent master warrior clad in golden horned Kabuto and Menpo armor. Katana gleams with spiritual energy and commands the battlefield.',
        current: this.exp.level >= 10
      }
    ];

    let html = '<div style="display: flex; flex-direction: column; gap: 16px; width: 100%;">';
    stages.forEach(s => {
      html += `
        <div class="item-card ${s.current ? 'equipped' : ''}" style="width: 100%;">
          <div class="item-card-title" style="font-size: 16px; color: ${s.current ? '#ffd700' : '#fff'};">
            ${s.title} ${s.current ? '👑 [ACTIVE FORM]' : ''}
          </div>
          <div style="font-size: 12px; color: #00e5ff; font-weight: 700;">${s.levelReq}</div>
          <div class="item-card-desc" style="font-size: 13px; line-height: 1.5;">${s.desc}</div>
        </div>
      `;
    });
    html += '</div>';

    this.body.innerHTML = html;
  }

  // --- DESTINY PATH ---
  renderDestinyModal() {
    this.title.innerText = '🪬 Destiny Path';
    this.tabs.innerHTML = '';

    const paths = this.destiny.paths;
    let html = '<div style="display: flex; flex-direction: column; gap: 14px; width: 100%;">';
    Object.values(paths).forEach(p => {
      const active = this.destiny.currentPath === p.id;
      html += `
        <div class="item-card ${active ? 'equipped' : ''}" style="width: 100%; cursor: pointer;" data-path="${p.id}">
          <div class="item-card-header">
            <span class="item-card-icon">${p.icon}</span>
            <span class="item-card-title">${p.name} <span style="color:#00e5ff;font-size:11px;">[${p.kanji}]</span></span>
          </div>
          <div class="item-card-desc" style="font-size: 13px; line-height: 1.5;">${p.desc}</div>
          ${active ? '<div style="color:#d4af37;font-weight:700;font-size:12px;margin-top:4px;">👑 ACTIVE</div>' : ''}
        </div>
      `;
    });
    html += '</div>';
    this.body.innerHTML = html;

    this.body.querySelectorAll('[data-path]').forEach(el => {
      el.addEventListener('click', () => {
        const pathId = el.dataset.path;
        if (this.destiny.setPath(pathId)) {
          this.renderDestinyModal();
          this.destiny.getCurrentPath();
        }
      });
    });
  }

  // --- ALCHEMY / FORMULATION ---
  renderAlchemyModal() {
    this.title.innerText = '📜 Alchemy — Formulate Scrolls';
    this.tabs.innerHTML = '';

    const recipes = this.alchemy.scrollRecipes;
    let html = '<div style="display: flex; flex-direction: column; gap: 14px; width: 100%;">';
    recipes.forEach(r => {
      const canForm = this.alchemy.canFormulate(r.id);
      const formulated = this.alchemy.formulatedScrolls.has(r.id);
      html += `
        <div class="item-card" style="width: 100%; ${formulated ? 'opacity:0.5;' : ''}" data-scroll="${r.id}">
          <div class="item-card-header">
            <span class="item-card-icon">${r.icon}</span>
            <span class="item-card-title">${r.name}</span>
          </div>
          <div class="item-card-desc" style="font-size: 13px; line-height: 1.5;">${r.desc}</div>
          <div style="font-size:11px;color:#888;">Requires active/cooling ${r.reqAbility} ability + resources</div>
          ${formulated ? '<div style="color:#00e5ff;font-weight:700;font-size:12px;margin-top:4px;">✨ FORMULATED</div>' : ''}
          <button class="action-button" style="margin-top:8px;" ${canForm && !formulated ? '' : 'disabled'} data-formulate="${r.id}">Formulate</button>
        </div>
      `;
    });
    html += '</div>';
    this.body.innerHTML = html;

    this.body.querySelectorAll('[data-formulate]').forEach(btn => {
      btn.addEventListener('click', () => {
        const result = this.alchemy.formulate(btn.dataset.formulate);
        if (result.success) {
          this.hud.showAlert({ title: '✨ Scroll Forged!', subtitle: `You have formulated ${result.item.name}!`, type: 'xp-gain' });
          this.renderAlchemyModal();
        } else {
          this.hud.showAlert({ title: '⚠️ Cannot Formulate', subtitle: result.reason || 'Requirements not met', type: 'xp-loss' });
        }
      });
    });
  }
}
