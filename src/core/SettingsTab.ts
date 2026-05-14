import { App, PluginSettingTab, Setting } from "obsidian";
import { t, setLanguage, type Language } from "./i18n";
import type Harmony from "../main";

export class Harmony_Settings_Tab extends PluginSettingTab {
  plugin: Harmony;

  constructor(app: App, plugin: Harmony) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName(t(1))
      .setHeading();

    containerEl.createEl("p", {
      text: t(2),
      cls: "setting-item-description",
    });

    new Setting(containerEl)
      .setName(t(13))
      .setHeading();

    new Setting(containerEl)
      .setName(t(14))
      .setDesc("Sélectionnez la langue de l'interface.")
      .addDropdown(drop => {
        drop
          .addOption("en", "English")
          .addOption("fr", "Français")
          .setValue(this.plugin.settings.language)
          .onChange(async (value) => {
            this.plugin.settings.language = value as Language;
            await this.plugin.saveSettings();
            setLanguage(value as Language);
            this.display();
          });
      });

    containerEl.createEl("hr");
    
    new Setting(containerEl)
      .setName(t(10))
      .setHeading();

    const modules = Array.from((this.plugin.registry as any).modules.values()) as any[];
    
    if (modules.length === 0) {
      containerEl.createEl("p", { text: t(11) });
    } else {
      for (const module of modules) {
        new Setting(containerEl)
          .setName(module.name)
          .setDesc(`Identifiant : ${module.id}`)
          .addToggle((toggle) => {
            toggle
              .setValue(this.plugin.settings.enabledModules[module.id] ?? false)
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

    containerEl.createEl("hr");

    new Setting(containerEl)
      .setName(t(3))
      .setHeading();

    new Setting(containerEl)
      .setName(t(4))
      .setDesc(t(5))
      .addButton(btn => btn
        .setButtonText(t(6))
        .setCta()
        .onClick(() => {
          window.open("https://github.com/yodavatar/Harmony/discussions", "_blank");
        })
      );
  }
}