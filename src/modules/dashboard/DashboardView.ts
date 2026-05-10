import { ItemView, WorkspaceLeaf, TFile } from "obsidian";
import type { DashboardSettings } from "./DashboardSettings";
import type { DashboardModule } from "./DashboardModule";

export const DASHBOARD_VIEW_TYPE = "obsidian_ultimate-dashboard";

export class DashboardView extends ItemView {
  private module: DashboardModule;
  private clockInterval: number | null = null;
  private searchTimeout: number | null = null;

  constructor(leaf: WorkspaceLeaf, module: DashboardModule) {
    super(leaf);
    this.module = module;
  }

  getViewType() { return DASHBOARD_VIEW_TYPE; }
  getDisplayText() { return "Dashboard"; }
  getIcon() { return "home"; }

  get s(): DashboardSettings { return this.module.getDashboardSettings(); }

  async onOpen(): Promise<void> {
    this.injectStyles();
    this.render();
  }

  async onClose(): Promise<void> {
    if (this.clockInterval) window.clearInterval(this.clockInterval);
  }

  render(): void {
    if (this.clockInterval) { window.clearInterval(this.clockInterval); this.clockInterval = null; }
    const root = this.containerEl.children[1] as HTMLElement;
    root.empty();
    root.className = "dash-root";

    this.applyWallpaper(root);

    const overlay = root.createDiv("dash-overlay");
    overlay.style.setProperty("--dash-op", String(this.s.wallpaperOpacity));

    const btn = overlay.createEl("button", { cls: "dash-gear-btn" });
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;
    btn.addEventListener("click", () => this.openSettings());

    const center = overlay.createDiv("dash-center");

    if (this.s.showClock) this.renderClock(center);
    this.renderSearch(center);
    if (this.s.showFileCount) this.renderStats(center);
    if (this.s.quickLinks.length > 0 || true) this.renderQuickLinks(center);
  }

  private applyWallpaper(root: HTMLElement): void {
    if (!this.s.wallpaperPath) return;
    const file = this.app.vault.getAbstractFileByPath(this.s.wallpaperPath);
    if (!(file instanceof TFile)) return;
    root.style.backgroundImage = `url("${this.app.vault.getResourcePath(file)}")`;
  }

  private renderClock(parent: HTMLElement): void {
    const wrap = parent.createDiv("dash-clock");
    const time = wrap.createDiv("dash-time");
    const date = wrap.createDiv("dash-date");

    const DAYS = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];
    const MONTHS = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];

    const tick = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2,"0");
      const m = String(now.getMinutes()).padStart(2,"0");
      const s = String(now.getSeconds()).padStart(2,"0");
      time.textContent = this.s.showSeconds ? `${h}:${m}:${s}` : `${h}:${m}`;
      date.textContent = `${DAYS[now.getDay()]} ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
    };
    tick();
    this.clockInterval = window.setInterval(tick, 1000);
  }

  private renderSearch(parent: HTMLElement): void {
    const wrap = parent.createDiv("dash-search-wrap");
    const input = wrap.createEl("input", { type: "text", placeholder: "🔍  Rechercher dans le vault…", cls: "dash-search" });
    const results = wrap.createDiv("dash-results");

    input.addEventListener("input", () => {
      if (this.searchTimeout) window.clearTimeout(this.searchTimeout);
      this.searchTimeout = window.setTimeout(() => {
        results.empty();
        const q = input.value.trim().toLowerCase();
        if (!q) { results.style.display = "none"; return; }
        const files = this.app.vault.getMarkdownFiles().filter(f => f.basename.toLowerCase().includes(q)).slice(0, 8);
        results.style.display = "block";
        if (files.length === 0) { results.createDiv({ text: "Aucun résultat", cls: "dash-result-empty" }); return; }
        for (const f of files) {
          const item = results.createDiv("dash-result-item");
          item.createSpan({ text: f.basename, cls: "dash-result-name" });
          item.createSpan({ text: f.parent?.path ?? "/", cls: "dash-result-path" });
          item.addEventListener("click", () => {
            this.app.workspace.openLinkText(f.path, "", false);
            results.style.display = "none";
            input.value = "";
          });
        }
      }, 150);
    });

    input.addEventListener("keydown", e => { if (e.key === "Escape") { input.value = ""; results.style.display = "none"; } });
    document.addEventListener("click", e => { if (!wrap.contains(e.target as Node)) results.style.display = "none"; }, { capture: false });
    results.style.display = "none";
  }

  private renderStats(parent: HTMLElement): void {
    const count = this.app.vault.getMarkdownFiles().length;
    parent.createDiv({ text: `${count} notes`, cls: "dash-stat" });
  }

  private renderQuickLinks(parent: HTMLElement): void {
    const section = parent.createDiv("dash-links");
    const list = section.createDiv("dash-links-list");

    for (const link of this.s.quickLinks) {
      const btn = list.createEl("button", { text: link.label, cls: "dash-link-btn" });
      btn.addEventListener("click", () => this.app.workspace.openLinkText(link.path, "", false));
      btn.addEventListener("contextmenu", async e => {
        e.preventDefault();
        this.s.quickLinks = this.s.quickLinks.filter(l => l.path !== link.path);
        await this.module.saveDashboardSettings();
        this.render();
      });
    }

    const add = list.createEl("button", { text: "+ Ajouter", cls: "dash-link-btn dash-link-add" });
    add.addEventListener("click", () => this.openAddLink());
  }

  private openAddLink(): void {
    const overlay = this.makeOverlay();
    const modal = overlay.createDiv("dash-modal");
    modal.createEl("h3", { text: "Nouveau lien rapide" });

    const r1 = modal.createDiv("dash-modal-row");
    r1.createEl("label", { text: "Nom" });
    const labelInput = r1.createEl("input", { type: "text", placeholder: "Mon projet" });

    const r2 = modal.createDiv("dash-modal-row");
    r2.createEl("label", { text: "Chemin (note.md)" });
    const pathInput = r2.createEl("input", { type: "text", placeholder: "dossier/note.md" });

    const btns = modal.createDiv("dash-modal-btns");
    btns.createEl("button", { text: "Ajouter", cls: "dash-btn dash-btn-primary" }).addEventListener("click", async () => {
      const label = labelInput.value.trim();
      const path = pathInput.value.trim();
      if (!label || !path) return;
      this.s.quickLinks.push({ label, path });
      await this.module.saveDashboardSettings();
      overlay.remove();
      this.render();
    });
    btns.createEl("button", { text: "Annuler", cls: "dash-btn" }).addEventListener("click", () => overlay.remove());
  }

  private openSettings(): void {
    const root = this.containerEl.children[1] as HTMLElement;
    const existing = root.querySelector(".dash-overlay-modal");
    if (existing) { existing.remove(); return; }

    const overlay = this.makeOverlay();
    const panel = overlay.createDiv("dash-modal dash-settings");
    panel.createEl("h3", { text: "⚙️ Paramètres du Dashboard" });

    this.settingToggle(panel, "Afficher l'horloge", "showClock");
    this.settingToggle(panel, "Afficher les secondes", "showSeconds");
    this.settingToggle(panel, "Afficher le nombre de notes", "showFileCount");
    this.settingToggle(panel, "Ouvrir au démarrage", "openOnStartup");

    // Wallpaper — file picker natif
    const wr = panel.createDiv("dash-setting-row");
    wr.createSpan({ text: "Fond d'écran", cls: "dash-setting-label" });
    const wpRight = wr.createDiv("dash-setting-right");
    const wpName = wpRight.createSpan({ text: this.s.wallpaperPath ? this.s.wallpaperPath.split("/").pop()! : "Aucun", cls: "dash-setting-val" });
    const wpBtn = wpRight.createEl("button", { text: "Choisir…", cls: "dash-btn" });
    wpBtn.addEventListener("click", () => {
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "image/*";
      fileInput.addEventListener("change", async () => {
        const file = fileInput.files?.[0];
        if (!file) return;
        const destDir = ".Obsidian_Ultimate/dashboard";
        const destPath = `${destDir}/${file.name}`;
        if (!(await this.app.vault.adapter.exists(destDir))) {
          await this.app.vault.adapter.mkdir(destDir);
        }
        const buffer = await file.arrayBuffer();
        await this.app.vault.adapter.writeBinary(destPath, buffer);
        this.s.wallpaperPath = destPath;
        wpName.textContent = file.name;
        await this.module.saveDashboardSettings();
      });
      fileInput.click();
    });
    const clearBtn = wpRight.createEl("button", { text: "✕", cls: "dash-btn", title: "Supprimer le fond" });
    clearBtn.addEventListener("click", async () => {
      this.s.wallpaperPath = "";
      wpName.textContent = "Aucun";
      await this.module.saveDashboardSettings();
    });

    // Opacité
    const or = panel.createDiv("dash-setting-row");
    or.createSpan({ text: "Opacité overlay", cls: "dash-setting-label" });
    const orRight = or.createDiv("dash-setting-right");
    const opInput = orRight.createEl("input", { type: "range", value: String(this.s.wallpaperOpacity) });
    opInput.min = "0"; opInput.max = "1"; opInput.step = "0.05";
    const opVal = orRight.createSpan({ text: String(this.s.wallpaperOpacity), cls: "dash-setting-val" });
    opInput.addEventListener("input", async () => {
      this.s.wallpaperOpacity = parseFloat(opInput.value);
      opVal.textContent = opInput.value;
      await this.module.saveDashboardSettings();
    });

    panel.createEl("button", { text: "Fermer", cls: "dash-btn dash-btn-primary" })
      .addEventListener("click", () => { overlay.remove(); this.render(); });
  }

  private settingToggle(parent: HTMLElement, label: string, key: keyof DashboardSettings): void {
    const row = parent.createDiv("dash-setting-row");
    row.createSpan({ text: label, cls: "dash-setting-label" });
    const toggle = row.createEl("input", { type: "checkbox" });
    toggle.checked = this.s[key] as boolean;
    toggle.addEventListener("change", async () => { (this.s as any)[key] = toggle.checked; await this.module.saveDashboardSettings(); });
  }

  private makeOverlay(): HTMLElement {
    const root = this.containerEl.children[1] as HTMLElement;
    const overlay = root.createDiv("dash-overlay-modal");
    overlay.addEventListener("click", e => { if (e.target === overlay) { overlay.remove(); this.render(); } });
    return overlay;
  }

  private injectStyles(): void {
    const id = "obsidian_ultimate_dashboard_styles";
    if (document.getElementById(id)) return;
    const s = document.createElement("style");
    s.id = id;
    s.textContent = `
      .dash-root {
        height: 100%; width: 100%; position: relative;
        background: var(--background-primary);
        background-size: cover; background-position: center;
        display: flex;
      }
      .dash-overlay {
        position: absolute; inset: 0;
        background: rgba(0,0,0,calc(var(--dash-op, 0.5) * 1));
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        gap: 28px; padding: 32px;
      }
      .dash-gear-btn {
        position: absolute; top: 16px; right: 16px;
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.15);
        border-radius: 8px; padding: 8px 9px;
        color: rgba(255,255,255,0.7); cursor: pointer;
        backdrop-filter: blur(6px); transition: all 0.2s; line-height: 0;
      }
      .dash-gear-btn:hover { background: rgba(255,255,255,0.2); color: white; }

      /* Clock */
      .dash-clock { text-align: center; color: white; text-shadow: 0 2px 12px rgba(0,0,0,0.6); }
      .dash-time { font-size: 6em; font-weight: 100; letter-spacing: 6px; line-height: 1; font-variant-numeric: tabular-nums; }
      .dash-date { font-size: 1em; opacity: 0.8; margin-top: 6px; letter-spacing: 1px; }

      /* Search */
      .dash-search-wrap { position: relative; width: 100%; max-width: 580px; }
      .dash-search {
        width: 100%; padding: 14px 22px; font-size: 1em;
        border: 1px solid rgba(255,255,255,0.2);
        border-radius: 40px;
        background: rgba(255,255,255,0.1);
        backdrop-filter: blur(12px);
        color: white; outline: none;
        box-shadow: 0 4px 24px rgba(0,0,0,0.2);
        transition: all 0.2s; box-sizing: border-box;
      }
      .dash-search::placeholder { color: rgba(255,255,255,0.5); }
      .dash-search:focus { background: rgba(255,255,255,0.18); border-color: rgba(255,255,255,0.35); box-shadow: 0 4px 32px rgba(0,0,0,0.3); }
      .dash-results {
        position: absolute; top: calc(100% + 8px); left: 0; right: 0;
        background: var(--background-primary);
        border: 1px solid var(--background-modifier-border);
        border-radius: 14px; overflow: hidden;
        box-shadow: 0 12px 40px rgba(0,0,0,0.4); z-index: 50;
      }
      .dash-result-item {
        display: flex; align-items: center; justify-content: space-between;
        padding: 11px 16px; cursor: pointer; gap: 12px;
        border-bottom: 1px solid var(--background-modifier-border);
        transition: background 0.15s;
      }
      .dash-result-item:last-child { border-bottom: none; }
      .dash-result-item:hover { background: var(--background-modifier-hover); }
      .dash-result-name { font-size: 0.9em; font-weight: 500; }
      .dash-result-path { font-size: 0.75em; color: var(--text-muted); }
      .dash-result-empty { padding: 14px 16px; color: var(--text-muted); font-size: 0.88em; }

      /* Stats */
      .dash-stat { color: rgba(255,255,255,0.55); font-size: 0.8em; letter-spacing: 2px; text-transform: uppercase; }

      /* Quick links */
      .dash-links { display: flex; flex-direction: column; align-items: center; gap: 10px; }
      .dash-links-list { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; max-width: 640px; }
      .dash-link-btn {
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.18);
        border-radius: 22px; padding: 7px 18px;
        color: rgba(255,255,255,0.85); cursor: pointer; font-size: 0.85em;
        backdrop-filter: blur(6px); transition: all 0.2s;
      }
      .dash-link-btn:hover { background: rgba(255,255,255,0.22); color: white; transform: translateY(-1px); }
      .dash-link-add { border-style: dashed; opacity: 0.55; }
      .dash-link-add:hover { opacity: 1; }

      /* Modal overlay */
      .dash-overlay-modal {
        position: absolute; inset: 0;
        background: rgba(0,0,0,0.55);
        display: flex; align-items: center; justify-content: center; z-index: 100;
        backdrop-filter: blur(2px);
      }
      .dash-modal {
        background: var(--background-primary);
        border: 1px solid var(--background-modifier-border);
        border-radius: 14px; padding: 28px; min-width: 340px; max-width: 460px; width: 100%;
        display: flex; flex-direction: column; gap: 14px;
        box-shadow: 0 16px 48px rgba(0,0,0,0.5);
      }
      .dash-modal h3 { margin: 0; font-size: 1.1em; }
      .dash-modal-row { display: flex; flex-direction: column; gap: 5px; }
      .dash-modal-row label { font-size: 0.78em; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
      .dash-modal-row input { padding: 8px 12px; border-radius: 8px; border: 1px solid var(--background-modifier-border); background: var(--background-secondary); color: var(--text-normal); font-size: 0.9em; outline: none; }
      .dash-modal-row input:focus { border-color: var(--interactive-accent); }
      .dash-modal-btns { display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px; }

      /* Settings panel */
      .dash-settings { min-width: 380px; }
      .dash-setting-row {
        display: flex; align-items: center; justify-content: space-between;
        padding: 10px 0; border-bottom: 1px solid var(--background-modifier-border); gap: 16px;
      }
      .dash-setting-row:last-of-type { border-bottom: none; }
      .dash-setting-label { font-size: 0.88em; }
      .dash-setting-val { font-size: 0.8em; color: var(--text-muted); min-width: 28px; text-align: right; }
      .dash-setting-row input[type="range"] { flex: 1; max-width: 120px; accent-color: var(--interactive-accent); }
      .dash-setting-row input[type="text"] { flex: 1; padding: 5px 9px; border-radius: 6px; border: 1px solid var(--background-modifier-border); background: var(--background-secondary); color: var(--text-normal); font-size: 0.85em; min-width: 0; outline: none; }

      /* Buttons */
      .dash-btn { border-radius: 8px; padding: 8px 16px; font-size: 0.85em; cursor: pointer; border: 1px solid var(--background-modifier-border); background: var(--background-secondary); color: var(--text-normal); transition: background 0.15s; }
      .dash-btn:hover { background: var(--background-modifier-hover); }
      .dash-btn-primary { background: var(--interactive-accent); color: var(--text-on-accent); border-color: transparent; }
      .dash-btn-primary:hover { filter: brightness(1.1); }
    `;
    document.head.appendChild(s);
  }
}