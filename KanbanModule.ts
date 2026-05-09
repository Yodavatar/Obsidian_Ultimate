import { App } from "obsidian";
import type MegaPlugin from "../../main";
import type { IModule } from "../../shared/types";

/**
 * Module Kanban.
 * Pour l'instant : s'enregistre, loggue, et sera étoffé dans les prochaines étapes.
 */
export class KanbanModule implements IModule {
  id = "kanban";
  name = "Kanban";

  private app: App;
  private plugin: MegaPlugin;

  constructor(app: App, plugin: MegaPlugin) {
    this.app = app;
    this.plugin = plugin;
  }

  async onload(): Promise<void> {
    console.log("[KanbanModule] Activé.");
    // TODO : enregistrer la vue Kanban, les commandes, le ribbon icon
  }

  onunload(): void {
    console.log("[KanbanModule] Désactivé.");
    // TODO : nettoyer la vue, les listeners, etc.
  }
}
