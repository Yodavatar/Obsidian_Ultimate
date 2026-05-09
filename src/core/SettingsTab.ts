import { App, PluginSettingTab, Setting } from "obsidian";
import type MegaPlugin from "../main";

/**
 * Page de settings du plugin.
 * Affiche un toggle pour chaque module enregistré.
 */
export class MegaPluginSettingsTab extends PluginSettingTab {
  plugin: MegaPlugin;

  constructor(app: App, plugin: MegaPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Mega Plugin" });
    containerEl.createEl("p", {
      text: "Active ou désactive les modules ci-dessous. Les changements sont immédiats.",
      cls: "setting-item-description",
    });

    containerEl.createEl("h3", { text: "Modules" });

    const modules = this.plugin.registry.getAll();

    if (modules.length === 0) {
      containerEl.createEl("p", { text: "Aucun module disponible." });
      return;
    }

    for (const module of modules) {
      new Setting(containerEl)
        .setName(module.name)
        .setDesc(`ID : ${module.id}`)
        .addToggle((toggle) => {
          toggle
            .setValue(
              this.plugin.settings.enabledModules[module.id] ?? false
            )
            .onChange(async (value) => {
              this.plugin.settings.enabledModules[module.id] = value;
              await this.plugin.saveSettings();

              if (value) {
                await this.plugin.registry.enable(module.id);
              } else {
                this.plugin.registry.disable(module.id);
              }
            });
        });
    }
  }
}
