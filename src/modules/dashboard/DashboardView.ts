import { ItemView, WorkspaceLeaf, TFile, TAbstractFile } from "obsidian";
import type { DashboardSettings } from "./DashboardSettings";
import type { DashboardModule } from "./DashboardModule";

export const DASHBOARD_VIEW_TYPE = "obsidian_ultimate-dashboard";

const I18N = {
  fr: {
    search: "Rechercher dans le vault...",
    files: "fichiers",
    noResults: "Aucun résultat",
    quickLinks: "Accès rapides",
    addLink: "+ Ajouter",
    linkLabel: "Nom du lien",
    linkPath: "Chemin de la note",
    save: "Enregistrer",
    cancel: "Annuler",
    days: ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"],
    months: ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"],
  },
  en: {
    search: "Search vault...",
    files: "files",
    noResults: "No results",
    quickLinks: "Quick links",
    addLink: "+ Add",
    linkLabel: "Link name",
    linkPath: "Note path",
    save: "Save",
    cancel: "Cancel",
    days: ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
    months: ["January","February","March","April","May","June","July","August","September","October","November","December"],
  },
};

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
  getIcon() { return "layout-dashboard"; }

  get settings(): DashboardSettings { return this.module.getDashboardSettings(); }
  get t() { return I18N[this.settings.language]; }

  async onOpen(): Promise<void> {
    this.injectStyles();
    this.render();
  }

  async onClose(): Promise<void> {
    if (this.clockInterval) window.clearInterval(this.clockInterval);
  }

  render(): void {
    const root = this.containerEl.children[1] as HTMLElement;
    root.empty();
    root.addClass("dash-root");

    // Fond d'écran
    this.renderWallpaper(root);

    // Overlay sombre pour lisibilité
    const overlay = root.createDiv("dash-overlay");

    // Bouton settings
    this.renderSettingsBtn(overlay);

    // Centre
    const center = overlay.createDiv("dash-center");

    if (this.settings.showClock) this.renderClock(center);
    this.renderSearch(center);
    if (this.settings.showFileCount) this.renderStats(center);
    this.renderQuickLinks(center);
  }

  // ─── Wallpaper ───────────────────────────────────────────────────────────────

  private renderWallpaper(root: HTMLElement): void {
    if (!this.settings.wallpaperPath) return;
    const file = this.app.vault.getAbstractFileByPath(this.settings.wallpaperPath);
    if (!(file instanceof TFile)) return;
    const url = this.app.vault.getResourcePath(file);
    root.style.backgroundImage = `url("${url}")`;
    root.style.backgroundSize = "cover";
    root.style.backgroundPosition = "center";
  }

  // ─── Clock ───────────────────────────────────────────────────────────────────

  private renderClock(parent: HTMLElement): void {
    const clockEl = parent.createDiv("dash-clock");
    const timeEl = clockEl.createEl("div", { cls: "dash-time" });
    const dateEl = clockEl.createEl("div", { cls: "dash-date" });

    const update = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, "0");
      const m = String(now.getMinutes()).padStart(2, "0");
      timeEl.textContent = `${h}:${m}`;

      const day = this.t.days[now.getDay()];
      const date = now.getDate();
      const month = this.t.months[now.getMonth()];
      const year = now.getFullYear();
      dateEl.textContent = `${day} ${date} ${month} ${year}`;
    };

    update();
    this.clockInterval = window.setInterval(update, 10000);
  }

  // ─── Search ──────────────────────────────────────────────────────────────────

  private renderSearch(parent: HTMLElement): void {
    const wrap = parent.createDiv("dash-search-wrap");
    const input = wrap.createEl("input", {
      type: "text",
      placeholder: this.t.search,
      cls: "dash-search-input",
    });

    const results = wrap.createDiv("dash-search-results");
    results.style.display = "none";

    input.addEventListener("input", () => {
      if (this.searchTimeout) window.clearTimeout(this.searchTimeout);
      this.searchTimeout = window.setTimeout(() => this.doSearch(input.value, results), 200);
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { input.value = ""; results.style.display = "none"; }
    });

    document.addEventListener("click", (e) => {
      if (!wrap.contains(e.target as Node)) results.style.display = "none";
    });
  }

  private doSearch(query: string, results: HTMLElement): void {
    results.empty();
    if (!query.trim()) { results.style.display = "none"; return; }

    const files = this.app.vault.getMarkdownFiles()
      .filter(f => f.basename.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 8);

    results.style.display = "block";

    if (files.length === 0) {
      results.createEl("div", { text: this.t.noResults, cls: "dash-search-empty" });
      return;
    }

    for (const file of files) {
      const item = results.createDiv("dash-search-item");
      item.createEl("span", { text: "📄", cls: "dash-search-icon" });
      item.createEl("span", { text: file.basename, cls: "dash-search-name" });
      item.createEl("span", { text: file.parent?.path ?? "", cls: "dash-search-path" });
      item.addEventListener("click", () => {
        this.app.workspace.openLinkText(file.path, "", false);
        results.style.display = "none";
      });
    }
  }

  // ─── Stats ───────────────────────────────────────────────────────────────────

  private renderStats(parent: HTMLElement): void {
    const count = this.app.vault.getMarkdownFiles().length;
    parent.createDiv({ text: `${count} ${this.t.files}`, cls: "dash-stat" });
  }

  // ─── Quick links ─────────────────────────────────────────────────────────────

  private renderQuickLinks(parent: HTMLElement): void {
    const section = parent.createDiv("dash-quicklinks");
    section.createEl("div", { text: this.t.quickLinks, cls: "dash-quicklinks-title" });
    const list = section.createDiv("dash-quicklinks-list");

    for (const link of this.settings.quickLinks) {
      const btn = list.createEl("button", { text: link.label, cls: "dash-quicklink-btn" });
      btn.addEventListener("click", () => this.app.workspace.openLinkText(link.path, "", false));
      btn.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        this.confirmRemoveLink(link.path);
      });
    }

    const addBtn = list.createEl("button", { text: this.t.addLink, cls: "dash-quicklink-btn dash-quicklink-add" });
    addBtn.addEventListener("click", () => this.openAddLinkModal());
  }

  private openAddLinkModal(): void {
    const root = this.containerEl.children[1] as HTMLElement;
    const overlay = root.createDiv("dash-modal-overlay");
    const modal = overlay.createDiv("dash-modal");
    modal.createEl("h3", { text: this.t.quickLinks });

    const row1 = modal.createDiv("dash-modal-row");
    row1.createEl("label", { text: this.t.linkLabel });
    const labelInput = row1.createEl("input", { type: "text", placeholder: "Mon projet" });

    const row2 = modal.createDiv("dash-modal-row");
    row2.createEl("label", { text: this.t.linkPath });
    const pathInput = row2.createEl("input", { type: "text", placeholder: "dossier/note.md" });

    const btns = modal.createDiv("dash-modal-btns");
    const saveBtn = btns.createEl("button", { text: this.t.save, cls: "mod-cta" });
    saveBtn.addEventListener("click", async () => {
      const label = labelInput.value.trim();
      const path = pathInput.value.trim();
      if (!label || !path) return;
      this.settings.quickLinks.push({ label, path });
      await this.module.saveDashboardSettings();
      overlay.remove();
      this.render();
    });

    const cancelBtn = btns.createEl("button", { text: this.t.cancel });
    cancelBtn.addEventListener("click", () => overlay.remove());
    overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
  }

  private async confirmRemoveLink(path: string): Promise<void> {
    this.settings.quickLinks = this.settings.quickLinks.filter(l => l.path !== path);
    await this.module.saveDashboardSettings();
    this.render();
  }

  // ─── Settings panel ──────────────────────────────────────────────────────────

  private renderSettingsBtn(parent: HTMLElement): void {
    const btn = parent.createEl("button", { cls: "dash-settings-btn", title: "Paramètres du dashboard" });
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;
    btn.addEventListener("click", () => this.openSettingsPanel());
  }

  private openSettingsPanel(): void {
    const root = this.containerEl.children[1] as HTMLElement;
    const overlay = root.createDiv("dash-modal-overlay");
    const panel = overlay.createDiv("dash-modal dash-settings-panel");
    panel.createEl("h3", { text: "⚙️ Dashboard" });

    // Langue
    this.settingRow(panel, "Langue / Language", (row) => {
      const sel = row.createEl("select", { cls: "dash-select" });
      [["fr","Français"],["en","English"]].forEach(([v,l]) => {
        const o = sel.createEl("option", { text: l, value: v });
        if (v === this.settings.language) o.selected = true;
      });
      sel.addEventListener("change", async () => {
        this.settings.language = sel.value as "fr"|"en";
        await this.module.saveDashboardSettings();
      });
    });

    // Afficher l'heure
    this.settingToggle(panel, "Afficher l'heure", "showClock");

    // Afficher le nombre de fichiers
    this.settingToggle(panel, "Afficher le nombre de fichiers", "showFileCount");

    // Ouvrir au démarrage
    this.settingToggle(panel, "Ouvrir au démarrage", "openOnStartup");

    // Fond d'écran
    this.settingRow(panel, "Fond d'écran (chemin vault)", (row) => {
      const input = row.createEl("input", { type: "text", value: this.settings.wallpaperPath, placeholder: "assets/fond.jpg" });
      input.style.flex = "1";
      input.addEventListener("change", async () => {
        this.settings.wallpaperPath = input.value.trim();
        await this.module.saveDashboardSettings();
      });
    });

    // Opacité overlay
    this.settingRow(panel, "Opacité overlay (0-1)", (row) => {
      const input = row.createEl("input", { type: "number", value: String(this.settings.wallpaperOpacity) });
      input.min = "0"; input.max = "1"; input.step = "0.05"; input.style.width = "70px";
      input.addEventListener("change", async () => {
        this.settings.wallpaperOpacity = parseFloat(input.value);
        await this.module.saveDashboardSettings();
      });
    });

    const closeBtn = panel.createEl("button", { text: "Fermer", cls: "mod-cta" });
    closeBtn.style.marginTop = "8px";
    closeBtn.addEventListener("click", async () => { overlay.remove(); this.render(); });
    overlay.addEventListener("click", (e) => { if (e.target === overlay) { overlay.remove(); this.render(); } });
  }

  private settingRow(parent: HTMLElement, label: string, cb: (row: HTMLElement) => void): void {
    const row = parent.createDiv("dash-setting-row");
    row.createEl("span", { text: label, cls: "dash-setting-label" });
    const right = row.createDiv("dash-setting-right");
    cb(right);
  }

  private settingToggle(parent: HTMLElement, label: string, key: keyof DashboardSettings): void {
    this.settingRow(parent, label, (row) => {
      const toggle = row.createEl("input", { type: "checkbox" });
      toggle.checked = this.settings[key] as boolean;
      toggle.addEventListener("change", async () => {
        (this.settings as any)[key] = toggle.checked;
        await this.module.saveDashboardSettings();
      });
    });
  }

  // ─── Styles ──────────────────────────────────────────────────────────────────

  private injectStyles(): void {
    const id = "obsidian_ultimate_dashboard_styles";
    if (document.getElementById(id)) return;
    const s = document.createElement("style");
    s.id = id;
    s.textContent = `
      .dash-root {
        height: 100%; width: 100%; position: relative;
        background-color: var(--background-primary);
        background-size: cover; background-position: center;
        display: flex; flex-direction: column;
      }
      .dash-overlay {
        position: absolute; inset: 0;
        background: rgba(0,0,0,var(--dash-overlay-opacity, 0.45));
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        gap: 24px; padding: 24px;
      }
      .dash-settings-btn {
        position: absolute; top: 14px; right: 14px;
        background: rgba(255,255,255,0.12); border: none;
        border-radius: 8px; padding: 8px; cursor: pointer;
        color: white; backdrop-filter: blur(4px);
        transition: background 0.2s;
      }
      .dash-settings-btn:hover { background: rgba(255,255,255,0.22); }

      /* Clock */
      .dash-clock { text-align: center; color: white; text-shadow: 0 2px 8px rgba(0,0,0,0.5); }
      .dash-time { font-size: 5em; font-weight: 200; letter-spacing: 4px; line-height: 1; }
      .dash-date { font-size: 1.1em; opacity: 0.85; margin-top: 4px; text-transform: capitalize; }

      /* Search */
      .dash-search-wrap { position: relative; width: 100%; max-width: 560px; }
      .dash-search-input {
        width: 100%; padding: 12px 18px; font-size: 1em;
        border: none; border-radius: 30px;
        background: rgba(255,255,255,0.15);
        backdrop-filter: blur(8px);
        color: white; outline: none;
        box-shadow: 0 2px 16px rgba(0,0,0,0.2);
        transition: background 0.2s;
      }
      .dash-search-input::placeholder { color: rgba(255,255,255,0.6); }
      .dash-search-input:focus { background: rgba(255,255,255,0.25); }
      .dash-search-results {
        position: absolute; top: calc(100% + 6px); left: 0; right: 0;
        background: var(--background-primary);
        border: 1px solid var(--background-modifier-border);
        border-radius: 12px; overflow: hidden;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3); z-index: 50;
      }
      .dash-search-item {
        display: flex; align-items: center; gap: 10px;
        padding: 10px 14px; cursor: pointer;
        transition: background 0.15s;
      }
      .dash-search-item:hover { background: var(--background-modifier-hover); }
      .dash-search-icon { font-size: 0.9em; }
      .dash-search-name { font-weight: 500; flex: 1; }
      .dash-search-path { font-size: 0.75em; color: var(--text-muted); }
      .dash-search-empty { padding: 12px 16px; color: var(--text-muted); font-size: 0.9em; }

      /* Stats */
      .dash-stat {
        color: rgba(255,255,255,0.75);
        font-size: 0.85em; letter-spacing: 1px;
        text-shadow: 0 1px 4px rgba(0,0,0,0.4);
      }

      /* Quick links */
      .dash-quicklinks { display: flex; flex-direction: column; align-items: center; gap: 8px; }
      .dash-quicklinks-title { color: rgba(255,255,255,0.6); font-size: 0.75em; letter-spacing: 2px; text-transform: uppercase; }
      .dash-quicklinks-list { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
      .dash-quicklink-btn {
        background: rgba(255,255,255,0.13); border: 1px solid rgba(255,255,255,0.2);
        border-radius: 20px; padding: 6px 16px;
        color: white; cursor: pointer; font-size: 0.88em;
        backdrop-filter: blur(4px); transition: background 0.2s;
      }
      .dash-quicklink-btn:hover { background: rgba(255,255,255,0.25); }
      .dash-quicklink-add { border-style: dashed; opacity: 0.7; }
      .dash-quicklink-add:hover { opacity: 1; }

      /* Modal */
      .dash-modal-overlay {
        position: absolute; inset: 0;
        background: rgba(0,0,0,0.5);
        display: flex; align-items: center; justify-content: center; z-index: 100;
      }
      .dash-modal {
        background: var(--background-primary);
        border: 1px solid var(--background-modifier-border);
        border-radius: 12px; padding: 24px; min-width: 320px;
        display: flex; flex-direction: column; gap: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      }
      .dash-modal h3 { margin: 0; }
      .dash-modal-row { display: flex; flex-direction: column; gap: 4px; }
      .dash-modal-row label { font-size: 0.8em; color: var(--text-muted); }
      .dash-modal-row input { padding: 6px 10px; border-radius: 6px; border: 1px solid var(--background-modifier-border); background: var(--background-secondary); color: var(--text-normal); }
      .dash-modal-btns { display: flex; gap: 8px; justify-content: flex-end; }

      /* Settings panel */
      .dash-settings-panel { min-width: 380px; }
      .dash-setting-row { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--background-modifier-border); gap: 12px; }
      .dash-setting-row:last-of-type { border-bottom: none; }
      .dash-setting-label { font-size: 0.9em; }
      .dash-setting-right { display: flex; align-items: center; gap: 8px; }
      .dash-select { background: var(--background-secondary); color: var(--text-normal); border: 1px solid var(--background-modifier-border); border-radius: 6px; padding: 3px 8px; }
    `;
    document.head.appendChild(s);
  }
}
