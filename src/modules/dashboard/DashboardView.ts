import { PRIORITY_COLORS, PRIORITY_ORDER, getPriorityLabels, Priority, TaskStore } from "../../shared/taskstore";
import { ItemView, WorkspaceLeaf, FileSystemAdapter } from "obsidian";
import type { DashboardSettings } from "./DashboardSettings";
import type { DashboardModule } from "./DashboardModule";
import { t } from "../../core/i18n";


export const DASHBOARD_VIEW_TYPE = "Harmony-dashboard";

export class DashboardView extends ItemView
{
  private module: DashboardModule;
  private clockInterval: number | null = null;
  private searchTimeout: number | null = null;

  taskstore : TaskStore;

  constructor(leaf: WorkspaceLeaf, module: DashboardModule, taskstore:TaskStore)
  {
    super(leaf);
    this.module = module;
    this.taskstore = taskstore;
  }

  getViewType() { return DASHBOARD_VIEW_TYPE; }
  getDisplayText() { return "Dashboard"; }
  getIcon() { return "home"; }

  get s(): DashboardSettings { return this.module.getDashboardSettings(); }

  async onOpen(): Promise<void>
  {
    const unsubsribe = this.module.taskstore.on(() =>
    {
      this.render(); 
    });

    //Optimization
    this.register(() => unsubsribe());

    //make sure that one dashboard opens at a time
    this.app.workspace.getLeavesOfType(DASHBOARD_VIEW_TYPE).forEach(leaf =>
    {
      if (leaf !== this.leaf) leaf.detach();
    });

    this.injectStyles();
    this.render();
  }

  async onClose(): Promise<void>
  {
    if (this.clockInterval) window.clearInterval(this.clockInterval);
  }

  render(): void
  {
    const labels = getPriorityLabels();
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
    this.renderTasks(center,labels);
  }

  //Get tasks
  private renderTasks(parent: HTMLElement, labels: Record<Priority, string>): void
  {
    const tasks = this.module.taskstore.getTasks({ done: false, archived: false });
  
    tasks.sort((a, b) =>
    {
      const priorityA = PRIORITY_ORDER.indexOf(a.priority);
      const priorityB = PRIORITY_ORDER.indexOf(b.priority);
      if (priorityA !== priorityB) return priorityA - priorityB;
      if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return 0;
    });
  
    const urgentTasks = tasks.slice(0, 6);
    if (urgentTasks.length === 0) return;
  
    const tasksContainer = parent.createDiv("dash-tasks-container"); 
    tasksContainer.createEl("h4", { text: t(221), cls: "dash-section-title" });
    const tasksGrid = tasksContainer.createDiv("dash-tasks-horizontal");

    for (const task of urgentTasks)
    {
      const taskCard = tasksGrid.createDiv("dash-task-card");
      const header = taskCard.createDiv("dash-card-header");
      const prioritySpan = header.createSpan(
      {
        cls: "dash-task-priority",
        text: labels[task.priority],
      });
      prioritySpan.style.color = PRIORITY_COLORS[task.priority];

      /*
      const checkbox = header.createEl("input", { type: "checkbox" });
      checkbox.checked = task.done ?? false;
      checkbox.addEventListener("change", async (e) =>
      {
        e.stopPropagation();
        await this.module.taskstore.updateTask(task.id, { done: checkbox.checked });
      });
      */

      taskCard.createDiv({ text: task.title, cls: "dash-task-title" });
      const footer = taskCard.createDiv("dash-card-footer");
      
      if (task.dueDate)
      {
        const date = new Date(task.dueDate);
        footer.createSpan(
        { 
          text: date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }), 
          cls: "dash-task-date" 
        });
      }

      /*
      const deleteBtn = footer.createEl("button", { cls: "dash-btn-icon", text: "🗑" });
      deleteBtn.addEventListener("click", async (e) =>
      {
        e.stopPropagation();
        await this.module.taskstore.deleteTask(task.id);
      });
      */

      /*
      if (task.noteLink)
      {
        taskCard.addEventListener("click", (e) =>
        {
          if ((e.target as HTMLElement).tagName === "INPUT" || (e.target as HTMLElement).tagName === "BUTTON") return;
          const file = this.app.vault.getAbstractFileByPath(task.noteLink!);
          if (file instanceof TFile) this.leaf.openFile(file);
        });
      }
      */
    }
  }

  //Wallpaper
  // We use FileSystemAdapter.getResourcePath() because the files stored in
  // hidden folders (e.g..Harmony/) are not indexed in TFile.
  private applyWallpaper(root: HTMLElement): void
  {
    if (!this.s.wallpaperPath) return;

    //If path begin by https, it is a url
    //Electron or Obsidian is blocking the download... I haven't found another solution
    /*
    if (this.s.wallpaperPath.startsWith("https"))
    {
      root.style.backgroundImage = `url("${this.s.wallpaperPath}")`;
      root.style.backgroundSize = "cover";
      root.style.backgroundPosition = "center";
      return;
    }
    */

    const adapter = this.app.vault.adapter;
    if (!(adapter instanceof FileSystemAdapter)) return;
    const url = adapter.getResourcePath(this.s.wallpaperPath);
    root.style.backgroundImage = `url("${url}")`;
    root.style.backgroundSize = "cover";
    root.style.backgroundPosition = "center";
  }

  //Clock
  private renderClock(parent: HTMLElement): void
  {
    const wrap = parent.createDiv("dash-clock");
    const time = wrap.createDiv("dash-time");
    const date = wrap.createDiv("dash-date");

    const DAYS   = [t(256),t(250),t(251),t(252),t(253),t(254),t(255)];
    const MONTHS = [t(257),t(258),t(259),t(260),t(261),t(262),t(263),t(264),t(265),t(266),t(267),t(268)];

    const tick = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, "0");
      const m = String(now.getMinutes()).padStart(2, "0");
      const s = String(now.getSeconds()).padStart(2, "0");
      time.textContent = this.s.showSeconds ? `${h}:${m}:${s}` : `${h}:${m}`;
      date.textContent = `${DAYS[now.getDay()]} ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
    };
    tick();
    this.clockInterval = window.setInterval(tick, 1000);
  }

  //Research
  //The files open in the same leaf as the dashboard (this.leaf).
  private renderSearch(parent: HTMLElement): void {
    const wrap = parent.createDiv("dash-search-wrap");
    const input = wrap.createEl("input", {
      type: "text",
      placeholder: t(202),
      cls: "dash-search",
    });
    const results = wrap.createDiv("dash-results");

    input.addEventListener("input", () =>
      {
        if (this.searchTimeout) window.clearTimeout(this.searchTimeout);
        this.searchTimeout = window.setTimeout(() =>
          {
            results.empty();
            const q = input.value.trim().toLowerCase();
            if (!q) { results.style.display = "none"; return; }

            const files = this.app.vault
              .getMarkdownFiles()
              .filter(f => f.basename.toLowerCase().includes(q))
              .slice(0, 8);

            results.style.display = "block";

            if (files.length === 0) {
              results.createDiv({ text:t(203), cls: "dash-result-empty" });
              return;
            }

            for (const f of files) {
              const item = results.createDiv("dash-result-item");
              item.createSpan({ text: f.basename, cls: "dash-result-name" });
              item.createSpan({ text: f.parent?.path ?? "/", cls: "dash-result-path" });

              //Opens the file in the dashboard leaf (replaces the view)
              item.addEventListener("click", () =>
              {
                this.leaf.openFile(f);
                results.style.display = "none";
                input.value = "";
              });
            }
        }, 150);
      });

    input.addEventListener("keydown", e =>
    {
      if (e.key === "Escape") { input.value = ""; results.style.display = "none"; }
    });

    document.addEventListener("click", e =>
    {
      if (!wrap.contains(e.target as Node)) results.style.display = "none";
    });

    results.style.display = "none";
  }

  //Settings
  private openSettings(): void {
    const root = this.containerEl.children[1] as HTMLElement;
    const existing = root.querySelector(".dash-overlay-modal");
    if (existing) { existing.remove(); return; }

    const overlay = this.makeOverlay();
    const panel = overlay.createDiv("dash-modal dash-settings");
    panel.createEl("h3", { text: t(205) });

    this.settingToggle(panel, t(206), "showClock");
    this.settingToggle(panel, t(207), "showSeconds");
    this.settingToggle(panel, t(209), "openOnStartup");

    // Fond d'écran
    const wr = panel.createDiv("dash-setting-row");
    wr.createSpan({ text: t(210), cls: "dash-setting-label" });
    const wpRight = wr.createDiv("dash-setting-right");
    const wpName = wpRight.createSpan({
      text: this.s.wallpaperPath ? this.s.wallpaperPath.split("/").pop()! : "Aucun",
      cls: "dash-setting-val",
    });

    const wpBtn = wpRight.createEl("button", { text: t(211), cls: "dash-btn" });
    wpBtn.addEventListener("click", () => {
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "image/*";
      fileInput.addEventListener("change", async () => {
        const file = fileInput.files?.[0];
        if (!file) return;
        const destDir  = ".Harmony/dashboard";
        const destPath = `${destDir}/${file.name}`;
        if (!(await this.app.vault.adapter.exists(destDir))) {
          await this.app.vault.adapter.mkdir(destDir);
        }
        await this.app.vault.adapter.writeBinary(destPath, await file.arrayBuffer());
        this.s.wallpaperPath = destPath;
        wpName.textContent = file.name;
        await this.module.saveDashboardSettings();
        // Prévisualisation immédiate
        const dashRoot = this.containerEl.children[1] as HTMLElement;
        this.applyWallpaper(dashRoot);
      });
      fileInput.click();
    });

    const clearBtn = wpRight.createEl("button", { text: "✕", cls: "dash-btn", title: t(212) });
    clearBtn.addEventListener("click", async () => {
      this.s.wallpaperPath = "";
      wpName.textContent = "Aucun";
      await this.module.saveDashboardSettings();
      (this.containerEl.children[1] as HTMLElement).style.backgroundImage = "";
    });

    // Opacity of the overlay
    const or = panel.createDiv("dash-setting-row");
    or.createSpan({ text: t(213), cls: "dash-setting-label" });
    const orRight = or.createDiv("dash-setting-right");
    const opInput = orRight.createEl("input", { type: "range", value: String(this.s.wallpaperOpacity) });
    opInput.min = "0"; opInput.max = "1"; opInput.step = "0.05";
    const opVal = orRight.createSpan({ text: String(this.s.wallpaperOpacity), cls: "dash-setting-val" });
    opInput.addEventListener("input", async () => {
      this.s.wallpaperOpacity = parseFloat(opInput.value);
      opVal.textContent = opInput.value;
      await this.module.saveDashboardSettings();
    });

    panel.createEl("button", { text: t(214), cls: "dash-btn dash-btn-primary" })
      .addEventListener("click", () => { overlay.remove(); this.render(); });
  }

  private settingToggle(parent: HTMLElement, label: string, key: keyof DashboardSettings): void
  {
    const row = parent.createDiv("dash-setting-row");
    row.createSpan({ text: label, cls: "dash-setting-label" });
    const toggle = row.createEl("input", { type: "checkbox" });
    toggle.checked = this.s[key] as boolean;
    toggle.addEventListener("change", async () => {
      (this.s as any)[key] = toggle.checked;
      await this.module.saveDashboardSettings();
    });
  }

  private makeOverlay(): HTMLElement {
    const root = this.containerEl.children[1] as HTMLElement;
    const overlay = root.createDiv("dash-overlay-modal");
    overlay.addEventListener("click", e => {
      if (e.target === overlay)
      {
        overlay.remove();
        this.render();
      }
    });
    return overlay;
  }

  //Styles
  private injectStyles(): void
  {
    const id = "Harmony_dashboard_styles";
    if (document.getElementById(id)) return;
    const s = document.createElement("style");
    s.id = id;
    s.textContent = `
      /* Racine */
      .dash-root {
        height: 100%;
        width: 100%;
        position: relative;
        background-color: var(--background-primary);
        display: flex;
        align-items: stretch;
      }

      /* Overlay sombre sur le fond */
      .dash-overlay {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, calc(var(--dash-op, 0.45) * 1));
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 28px;
        padding: 32px;
      }

      /* Bouton engrenage */
      .dash-gear-btn {
        position: absolute;
        top: 16px;
        right: 16px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 8px;
        padding: 8px 9px;
        color: rgba(255, 255, 255, 0.7);
        cursor: pointer;
        backdrop-filter: blur(6px);
        transition: background 0.2s, color 0.2s;
        line-height: 0;
      }
      .dash-gear-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        color: #fff;
      }

      /* Zone centrale */
      .dash-center {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 24px;
        width: 100%;
        padding: 0 20px;
      }

      /* Horloge */
      .dash-clock {
        text-align: center;
        color: #fff;
        text-shadow: 0 2px 12px rgba(0, 0, 0, 0.6);
      }
      .dash-time {
        font-size: 6em;
        font-weight: 100;
        letter-spacing: 6px;
        line-height: 1;
        font-variant-numeric: tabular-nums;
      }
      .dash-date {
        font-size: 1em;
        opacity: 0.8;
        margin-top: 6px;
        letter-spacing: 1px;
      }

      .dash-task-actions {
        display: none;
        gap: 4px;
      }
      .dash-task-item:hover .dash-task-actions {
        display: flex;
      }
      .dash-btn-small {
        padding: 3px 8px !important;
        font-size: 0.7em !important;
      }

      /* Barre de recherche */
      .dash-search-wrap {
        position: relative;
        width: 100%;
        max-width: 580px;
      }
      .dash-search {
        width: 100%;
        padding: 14px 22px;
        font-size: 1em;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 40px;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(12px);
        color: #fff;
        outline: none;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
        transition: background 0.2s, border-color 0.2s, box-shadow 0.2s;
        box-sizing: border-box;
      }
      .dash-search::placeholder { color: rgba(255, 255, 255, 0.5); }
      .dash-search:focus {
        background: rgba(255, 255, 255, 0.18);
        border-color: rgba(255, 255, 255, 0.35);
        box-shadow: 0 4px 32px rgba(0, 0, 0, 0.3);
      }

      /* Résultats */
      .dash-results {
        position: absolute;
        top: calc(100% + 8px);
        left: 0;
        right: 0;
        background: var(--background-primary);
        border: 1px solid var(--background-modifier-border);
        border-radius: 14px;
        overflow: hidden;
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
        z-index: 50;
      }
      .dash-result-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 11px 16px;
        cursor: pointer;
        gap: 12px;
        border-bottom: 1px solid var(--background-modifier-border);
        transition: background 0.15s;
      }
      .dash-result-item:last-child { border-bottom: none; }
      .dash-result-item:hover { background: var(--background-modifier-hover); }
      .dash-result-name { font-size: 0.9em; font-weight: 500; }
      .dash-result-path { font-size: 0.75em; color: var(--text-muted); }
      .dash-result-empty { padding: 14px 16px; color: var(--text-muted); font-size: 0.88em; }

      /* Overlay modal (paramètres / ajout) */
      .dash-overlay-modal {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.55);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100;
        backdrop-filter: blur(2px);
      }
      .dash-modal {
        background: var(--background-primary);
        border: 1px solid var(--background-modifier-border);
        border-radius: 14px;
        padding: 28px;
        min-width: 340px;
        max-width: 460px;
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 14px;
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
      }
      .dash-modal h3 { margin: 0; font-size: 1.1em; }

      /* Panneau paramètres */
      .dash-settings { min-width: 400px; }
      .dash-setting-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 0;
        border-bottom: 1px solid var(--background-modifier-border);
        gap: 16px;
      }
      .dash-setting-row:last-of-type { border-bottom: none; }
      .dash-setting-label { font-size: 0.88em; flex: 1; }
      .dash-setting-right {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .dash-setting-val {
        font-size: 0.8em;
        color: var(--text-muted);
        min-width: 60px;
        text-align: right;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 120px;
      }
      .dash-setting-row input[type="range"] {
        width: 100px;
        accent-color: var(--interactive-accent);
      }
      .dash-setting-row input[type="checkbox"] {
        width: 16px;
        height: 16px;
        accent-color: var(--interactive-accent);
        cursor: pointer;
      }

      /* Boutons génériques */
      .dash-btn {
        border-radius: 8px;
        padding: 7px 14px;
        font-size: 0.82em;
        cursor: pointer;
        border: 1px solid var(--background-modifier-border);
        background: var(--background-secondary);
        color: var(--text-normal);
        transition: background 0.15s;
        white-space: nowrap;
      }
      .dash-btn:hover { background: var(--background-modifier-hover); }
      .dash-btn-primary {
        background: var(--interactive-accent);
        color: var(--text-on-accent);
        border-color: transparent;
      }
      .dash-btn-primary:hover { filter: brightness(1.1); }
      /* Conteneur principal des tâches */
      .dash-tasks-container {
          width: 100%;
          max-width: 1200px;
          margin-top: 20px;
      }

      .dash-section-title {
          color: #fff;
          font-size: 0.9em;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 15px;
          opacity: 0.8;
      }

      /* Alignement horizontal */
      .dash-tasks-horizontal {
          display: flex !important;
          flex-direction: row !important; /* Aligne en ligne */
          flex-wrap: nowrap !important;   /* Empêche le retour à la ligne */
          gap: 16px;           /* Espace entre les boîtes */
          overflow-x: auto;    /* Active le menu déroulant horizontal */
          width: 100%;
          padding: 15px 5px;
          scrollbar-width: none; /* Pour un scroll plus joli sur Firefox */
      }

      .dash-tasks-horizontal::-webkit-scrollbar { display: none; }


      /* Style de la Carte */
      .dash-task-card {
          flex: 0 0 220px !important;    /* IMPORTANT : Largeur fixe de 200px, ne rétrécit pas */
          min-height: 130px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          padding: 15px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
      }

      .dash-task-card:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateY(-5px);
      }

      .dash-card-header, .dash-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
      }

      .dash-task-title {
          font-weight: 500;
          color: white;
          margin: 10px 0;
          font-size: 0.9em;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
      }

      .dash-task-priority { font-size: 0.7em; font-weight: bold; text-transform: uppercase; }
      .dash-task-date { font-size: 0.75em; color: rgba(255, 255, 255, 0.6); }

      .dash-btn-icon {
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          opacity: 0.4;
          transition: opacity 0.2s;
      }
      .dash-btn-icon:hover { opacity: 1; }

      .is-done { opacity: 0.5; text-decoration: line-through; }
    `;
    document.head.appendChild(s);
  }
}
