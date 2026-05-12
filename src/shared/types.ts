import type { Language } from "../core/i18n";

/**
 * Interface that each module must implement.
 * The core calls these methods at the right time.
 */

export interface IModule
{
  id: string;
  name: string;
  onload(): Promise<void> | void;
  onunload(): void;
}

/**
 * Global settings of the plugin.
 * Each module has its own key for its settings.
 */

export interface Obsidian_Ultimate_Settings
{
  enabledModules: Record<string, boolean>;
  moduleSettings: Record<string, unknown>;
  language: Language;
}

export const DEFAULT_SETTINGS: Obsidian_Ultimate_Settings =
{
  enabledModules: {},
  moduleSettings: {},
  language: "en",
};