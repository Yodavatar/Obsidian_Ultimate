import { App } from "obsidian";
import type Obsidian_Ultimate from "../../main";
import type { IModule } from "../../shared/types";
import { DashboardView, DASHBOARD_VIEW_TYPE } from "./DashboardView";
import { DEFAULT_DASHBOARD_SETTINGS, type DashboardSettings } from "./DashboardSettings";

export class DashboardModule implements IModule {
  id = "dashboard";
  name = "Dashboard";

  private app: App;
  private plugin: Obsidian_Ultimate;
  private settings: DashboardSettings;

  constructor(app: App, plugin: Obsidian_Ultimate) {
    this.app = app;
    this.plugin = plugin;
    this.settings = {
      ...DEFAULT_DASHBOARD_SETTINGS,
      ...(plugin.settings.moduleSettings["dashboard"] as DashboardSettings ?? {}),
    };
  }

  getDashboardSettings(): DashboardSettings { return this.settings; }

  async saveDashboardSettings(): Promise<void> {
    this.plugin.settings.moduleSettings["dashboard"] = this.settings;
    await this.plugin.saveSettings();
  }

  async onload(): Promise<void> {
    this.plugin.registerView(
      DASHBOARD_VIEW_TYPE,
      (leaf) => new DashboardView(leaf, this)
    );

    this.plugin.addCommand({
      id: "open-dashboard",
      name: "Ouvrir le Dashboard",
      callback: () => this.activateView(),
    });

    // Remplace le new tab vide
    this.plugin.registerEvent(
      this.app.workspace.on("layout-change", () => {
        const emptyLeaves = this.app.workspace.getLeavesOfType("empty");
        for (const leaf of emptyLeaves) {
          leaf.setViewState({ type: DASHBOARD_VIEW_TYPE, active: false });
        }
      })
    );

    // Ouvrir au démarrage
    if (this.settings.openOnStartup) {
      this.app.workspace.onLayoutReady(() => this.activateView());
    }

    console.log("[DashboardModule] Activé.");
  }

  onunload(): void {
    this.app.workspace.detachLeavesOfType(DASHBOARD_VIEW_TYPE);
    console.log("[DashboardModule] Désactivé.");
  }

  async activateView(): Promise<void> {
    const existing = this.app.workspace.getLeavesOfType(DASHBOARD_VIEW_TYPE);
    if (existing.length > 0) { this.app.workspace.revealLeaf(existing[0]); return; }
    const leaf = this.app.workspace.getLeaf("tab");
    await leaf.setViewState({ type: DASHBOARD_VIEW_TYPE, active: true });
    this.app.workspace.revealLeaf(leaf);
  }
}
