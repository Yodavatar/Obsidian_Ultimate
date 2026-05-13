import { App } from "obsidian";
import type Obsidian_Ultimate from "../../main";
import { IModule } from "../../shared/types";
import { TaskStore } from "../../shared/taskstore";
import { TodoStore } from "./TodoStore";
import { TodoView, TODO_VIEW_TYPE } from "./Todoview";
import { onLanguageChange } from "../../core/i18n";

export class TodoModule implements IModule
{
  id = "todo";
  name = "Todo List";

  private app:App;
  private plugin: Obsidian_Ultimate;
  private store: TodoStore;
  private unsubLang?: () => void;

  constructor(app: App, plugin: Obsidian_Ultimate, taskStore: TaskStore)
  {
    this.app = app;
    this.plugin = plugin;
    this.store = new TodoStore(taskStore);
  }

  async onload()
  {
    this.plugin.registerView(
      TODO_VIEW_TYPE,
      (leaf) => new TodoView(leaf, this.store)
    );

    this.unsubLang = onLanguageChange(() =>
    {
      const leaves = this.app.workspace.getLeavesOfType(TODO_VIEW_TYPE);
      for (const leaf of leaves)
      {
        (leaf.view as TodoView).render();
      }
    });

    this.plugin.addRibbonIcon("check-check", "Todo List", () => this.activateView());
  }

  onunload(): void
  {
    this.unsubLang?.();
    this.app.workspace.detachLeavesOfType(TODO_VIEW_TYPE);
    console.log("[TodoModule] Désactivé.");
  }

  private async activateView()
  {
    const { workspace } = this.plugin.app;
    let leaf = workspace.getLeavesOfType(TODO_VIEW_TYPE)[0];
    if (!leaf)
    {
      leaf = workspace.getLeaf("tab");
      await leaf.setViewState({ type: TODO_VIEW_TYPE, active: true });
    }
    workspace.revealLeaf(leaf);
  }
}