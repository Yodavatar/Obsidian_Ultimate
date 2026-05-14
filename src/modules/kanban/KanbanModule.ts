import { App } from "obsidian";
import type Harmony from "../../main";
import type { IModule } from "../../shared/types";
import type { TaskStore } from "../../shared/taskstore";
import { KanbanStore } from "./KanbanStore";
import { KanbanView, KANBAN_VIEW_TYPE } from "./KanbanView";
import { t, onLanguageChange } from "../../core/i18n";

export class KanbanModule implements IModule
{
  id = "kanban";
  name = "Kanban";

  private app: App;
  private plugin: Harmony;
  private store: KanbanStore;
  private taskStore: TaskStore;
  private unsubLang?: () => void;
  private ribbonIconEl: HTMLElement | null = null;

  constructor(app: App, plugin: Harmony, taskStore: TaskStore)
  {
    this.app = app;
    this.plugin = plugin;
    this.taskStore = taskStore;
    this.store = new KanbanStore(app, taskStore);
  }

  async onload(): Promise<void>
  {
    // @ts-ignore
    if (!this.app.viewRegistry.viewByType[KANBAN_VIEW_TYPE])
    {
      this.plugin.registerView(
          KANBAN_VIEW_TYPE,
          (leaf) => new KanbanView(leaf, this.store)
      );
    }

    this.unsubLang = onLanguageChange(() =>
    {
      const leaves = this.app.workspace.getLeavesOfType(KANBAN_VIEW_TYPE);
      for (const leaf of leaves) (leaf.view as KanbanView).renderBoardSelector();
    });

    this.plugin.addCommand(
    {
      id: "open-kanban",
      name: t(101),
      callback: () => this.activateView(),
    });

    this.ribbonIconEl = this.plugin.addRibbonIcon("kanban", "Kanban", () => this.activateView());
    //await this.activateView();
    console.log("[KanbanModule] Activé.");
  }

  onunload(): void
  {
    this.unsubLang?.();
    this.app.workspace.detachLeavesOfType(KANBAN_VIEW_TYPE);
    
    if (this.ribbonIconEl)
    {
      this.ribbonIconEl.remove();
      //this.ribbonIconEl = null;
      console.log("delete kanban logo")
    }
    console.log("[KanbanModule] Désactivé.");
  }

  private async activateView(): Promise<void>
  {
    const existing = this.app.workspace.getLeavesOfType(KANBAN_VIEW_TYPE);
    if (existing.length > 0)
    {
      this.app.workspace.revealLeaf(existing[0]); 
      return;
    }
    const leaf = this.app.workspace.getLeaf("tab");
    await leaf.setViewState({ type: KANBAN_VIEW_TYPE, active: true });
    this.app.workspace.revealLeaf(leaf);
  }
}