import type MegaPlugin from "../main";

/**
 * Interface que chaque module doit implémenter.
 * Le core appelle ces méthodes au bon moment.
 */
export interface IModule {
  /** Identifiant unique du module (ex: "kanban", "theme") */
  id: string;
  /** Nom affiché dans les settings */
  name: string;
  /** Appelé quand le module est activé */
  onload(): Promise<void> | void;
  /** Appelé quand le module est désactivé ou le plugin déchargé */
  onunload(): void;
}

/**
 * Settings globaux du plugin.
 * Chaque module a sa propre clé pour ses settings.
 */
export interface MegaPluginSettings {
  /** Map module_id → activé ou non */
  enabledModules: Record<string, boolean>;
  /** Settings spécifiques à chaque module (clé = module id) */
  moduleSettings: Record<string, unknown>;
}

export const DEFAULT_SETTINGS: MegaPluginSettings = {
  enabledModules: {},
  moduleSettings: {},
};
