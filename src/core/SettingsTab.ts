import { App, PluginSettingTab, Setting } from "obsidian";
import { t, setLanguage, type Language } from "./i18n";
import type Harmony from "../main";

export class Harmony_Settings_Tab extends PluginSettingTab
{
  plugin: Harmony;

  constructor(app: App, plugin: Harmony)
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
          window.open("https://github.com/yodavatar/Harmony/discussions", "_blank");
        })
      );

    new Setting(containerEl)
      .setName(t(7))
      .setDesc(t(8))
      .addButton(btn => btn
        .setButtonText(t(9))
        .onClick(() => {
          window.open("https://github.com/yodavatar/Harmony/projects", "_blank");
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
              
              // Force reload of the plugin to clean up views
              // @ts-ignore
              this.app.plugins.disablePlugin(this.plugin.manifest.id);
              // @ts-ignore
              await this.app.plugins.enablePlugin(this.plugin.manifest.id);
              //Open the settings on the good page
              // @ts-ignore
              this.app.setting.openTabById(this.plugin.manifest.id);
            });
        });
    }
  }
}
