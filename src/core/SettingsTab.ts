import { App, PluginSettingTab, Setting } from "obsidian";
import { t, setLanguage, type Language } from "./i18n";
import type Obsidian_Ultimate from "../main";

export class Obsidian_Ultimate_Settings_Tab extends PluginSettingTab
{
  plugin: Obsidian_Ultimate;

  constructor(app: App, plugin: Obsidian_Ultimate)
  {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void
  {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: t(1) });
    containerEl.createEl("p", {
      text: t(2),
      cls: "setting-item-description",
    });


    //traduction section
    containerEl.createEl("h3", { text: t(13) });

    new Setting(containerEl)
      .setName(t(14))
      .addDropdown(drop =>
      {
        drop
          .addOption("en", "English")
          .addOption("fr", "Français")
          .setValue(this.plugin.settings.language)
          .onChange(async (value) =>
          {
            this.plugin.settings.language = value as Language;
            await this.plugin.saveSettings();
            setLanguage(value as Language);
            this.display();
          });
      });

    //community section
    containerEl.createEl("hr");
    containerEl.createEl("h3", { text: t(3) });

    new Setting(containerEl)
      .setName(t(4))
      .setDesc(t(5))
      .addButton(btn => btn
        .setButtonText(t(6))
        .setCta()
        .onClick(() => {
          window.open("https://github.com/yodavatar/Obsidian_Ultimate/discussions", "_blank");
        })
      );

    new Setting(containerEl)
      .setName(t(7))
      .setDesc(t(8))
      .addButton(btn => btn
        .setButtonText(t(9))
        .onClick(() => {
          window.open("https://github.com/yodavatar/Obsidian_Ultimate/projects", "_blank");
        })
      );



    //Show the modules available
    containerEl.createEl("h3", { text: t(10) });

    const modules = this.plugin.registry.getAll();

    if (modules.length === 0)
    {
      containerEl.createEl("p", { text: t(11) });
      return;
    }

    for (const module of modules)
    {
      new Setting(containerEl)
        .setName(module.name)
        .setDesc(`ID : ${module.id}`)
        .addToggle((toggle) =>
        {
          toggle
            .setValue(
              this.plugin.settings.enabledModules[module.id] ?? false
            )
            .onChange(async (value) =>
            {
              this.plugin.settings.enabledModules[module.id] = value;
              await this.plugin.saveSettings();
              if (value)
              {
                await this.plugin.registry.enable(module.id);
              }
              else
              {
                this.plugin.registry.disable(module.id);
              }
              
              // Forcer le rechargement du plugin pour nettoyer les vues
              // @ts-ignore
              this.app.plugins.disablePlugin(this.plugin.manifest.id);
              // @ts-ignore
              await this.app.plugins.enablePlugin(this.plugin.manifest.id);
              // Rouvrir les settings sur la bonne page
              // @ts-ignore
              this.app.setting.openTabById(this.plugin.manifest.id);
            });
        });
    }
  }
}
