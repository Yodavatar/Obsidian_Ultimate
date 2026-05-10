import { App } from "obsidian";
import type Obsidian_Ultimate from "../../main";
import type { IModule } from "../../shared/types";
import { KanbanStore } from "./KanbanStore";
import { KanbanView, KANBAN_VIEW_TYPE } from "./KanbanView";

export class KanbanModule implements IModule
{
  id = "kanban";
  name = "Kanban";

  private app: App;
  private plugin: Obsidian_Ultimate;
  private store: KanbanStore;

  constructor(app: App, plugin: Obsidian_Ultimate)
  {
    this.app = app;
    this.plugin = plugin;
    this.store = new KanbanStore(app);
  }

  async onload(): Promise<void>
  {
    this.plugin.registerView(
      KANBAN_VIEW_TYPE,
      (leaf) => new KanbanView(leaf, this.store)
    );

    this.plugin.addCommand(
    {
      id: "open-kanban",
      name: "Ouvrir le Kanban",
      callback: () => this.activateView(),
    });

    this.plugin.addRibbonIcon("kanban", "Kanban", () => this.activateView());
    console.log("[KanbanModule] Activé.");
  }

  onunload(): void {
    this.app.workspace.detachLeavesOfType(KANBAN_VIEW_TYPE);
    console.log("[KanbanModule] Désactivé.");
  }

  private async activateView(): Promise<void>
  {
    const existing = this.app.workspace.getLeavesOfType(KANBAN_VIEW_TYPE);
    if (existing.length > 0)
    {
      this.app.workspace.revealLeaf(existing[0]); return;
    }
    const leaf = this.app.workspace.getLeaf("tab");
    await leaf.setViewState({ type: KANBAN_VIEW_TYPE, active: true });
    this.app.workspace.revealLeaf(leaf);
  }
}
