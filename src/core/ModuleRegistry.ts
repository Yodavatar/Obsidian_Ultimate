import { type IModule } from "../shared/types";

/**
 * Registre central des modules.
 * Le plugin principal délègue toute la gestion des modules ici.
 */
export class ModuleRegistry {
  private modules: Map<string, IModule> = new Map();
  private activeModules: Set<string> = new Set();

  /**
   * Enregistre un module sans l'activer.
   * À appeler dans main.ts au démarrage.
   */
  register(module: IModule): void {
    if (this.modules.has(module.id)) {
      console.warn(`[MegaPlugin] Module "${module.id}" déjà enregistré, ignoré.`);
      return;
    }
    this.modules.set(module.id, module);
    console.log(`[MegaPlugin] Module "${module.id}" enregistré.`);
  }

  /**
   * Active un module (appelle son onload).
   */
  async enable(moduleId: string): Promise<void> {
    const module = this.modules.get(moduleId);
    if (!module) {
      console.error(`[MegaPlugin] Module "${moduleId}" introuvable.`);
      return;
    }
    if (this.activeModules.has(moduleId)) return;

    await module.onload();
    this.activeModules.add(moduleId);
    console.log(`[MegaPlugin] Module "${moduleId}" activé.`);
  }

  /**
   * Désactive un module (appelle son onunload).
   */
  disable(moduleId: string): void {
    const module = this.modules.get(moduleId);
    if (!module || !this.activeModules.has(moduleId)) return;

    module.onunload();
    this.activeModules.delete(moduleId);
    console.log(`[MegaPlugin] Module "${moduleId}" désactivé.`);
  }

  /**
   * Désactive tous les modules actifs.
   * Appelé quand le plugin est déchargé.
   */
  unloadAll(): void {
    for (const id of this.activeModules) {
      this.disable(id);
    }
  }

  isActive(moduleId: string): boolean {
    return this.activeModules.has(moduleId);
  }

  getAll(): IModule[] {
    return Array.from(this.modules.values());
  }
}
