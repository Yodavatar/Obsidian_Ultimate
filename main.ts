import { Plugin } from "obsidian";
import { ModuleRegistry } from "./core/ModuleRegistry";
import { MegaPluginSettingsTab } from "./core/SettingsTab";
import { DEFAULT_SETTINGS, type MegaPluginSettings } from "./shared/types";

// Import des modules — ajouter ici au fur et à mesure
import { KanbanModule } from "./modules/kanban/KanbanModule";

export default class MegaPlugin extends Plugin {
  settings: MegaPluginSettings;
  registry: ModuleRegistry;

  async onload() {
    console.log("[MegaPlugin] Chargement...");

    // 1. Charger les settings
    await this.loadSettings();

    // 2. Initialiser le registre
    this.registry = new ModuleRegistry();

    // 3. Enregistrer les modules disponibles
    this.registry.register(new KanbanModule(this.app, this));

    // 4. Activer les modules que l'utilisateur avait activés
    for (const [moduleId, enabled] of Object.entries(
      this.settings.enabledModules
    )) {
      if (enabled) {
        await this.registry.enable(moduleId);
      }
    }

    // 5. Ajouter la page de settings
    this.addSettingTab(new MegaPluginSettingsTab(this.app, this));

    console.log("[MegaPlugin] Prêt !");
  }

  onunload() {
    console.log("[MegaPlugin] Déchargement...");
    this.registry.unloadAll();
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
