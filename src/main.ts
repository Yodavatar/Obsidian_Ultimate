//Necessary modules
import { Plugin } from "obsidian";
import { ModuleRegistry } from "./core/ModuleRegistry";
import { Harmony_Settings_Tab } from "./core/SettingsTab";
import { setLanguage } from "./core/i18n";
import { TaskStore } from "./shared/taskstore";
import { DEFAULT_SETTINGS, type Harmony_Settings } from "./shared/types";

//All modules one in all
import { KanbanModule } from "./modules/kanban/KanbanModule";
import { DashboardModule } from "./modules/dashboard/DashboardModule";
import { TodoModule } from "./modules/todolist/TodoModule";

export default class Harmony extends Plugin
{
  settings: Harmony_Settings;
  registry: ModuleRegistry;
  taskStore: TaskStore;

  async onload() {
    console.log("[Harmony] Load...");
    await this.loadSettings();
    setLanguage(this.settings.language);

    this.registry = new ModuleRegistry();
    this.taskStore = new TaskStore(this.app);
    await this.taskStore.load();//Sure that the taskstore is ready

    //All modules one in all
    this.registry.register(new DashboardModule(this.app, this, this.taskStore));
    this.registry.register(new KanbanModule(this.app, this, this.taskStore));
    this.registry.register(new TodoModule(this.app, this, this.taskStore));

    for (const [moduleId, enabled] of Object.entries(this.settings.enabledModules))
    {
      if (enabled)
      {
        await this.registry.enable(moduleId);
      }
    }
    this.addSettingTab(new Harmony_Settings_Tab(this.app, this));
    console.log("[Harmony] Ready !");
  }

  onunload()
  {
    console.log("[Harmony] Unload...");
    this.registry.unloadAll();
  }

  async loadSettings()
  {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings()
  {
    await this.saveData(this.settings);
  }
}
