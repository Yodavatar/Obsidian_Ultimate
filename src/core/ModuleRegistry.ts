import { type IModule } from "../shared/types";

export class ModuleRegistry
{
  private modules: Map<string, IModule> = new Map();
  private activeModules: Set<string> = new Set();

  register(module: IModule): void
  {
    if (this.modules.has(module.id))
    {
      console.warn(`[Harmony] Module "${module.id}" déjà enregistré, ignoré.`);
      return;
    }
    this.modules.set(module.id, module);
    console.log(`[Harmony] Module "${module.id}" enregistré.`);
  }

  async enable(moduleId: string): Promise<void>
  {
    const module = this.modules.get(moduleId);
    if (!module)
    {
      console.error(`[Harmony] Module "${moduleId}" introuvable.`);
      return;
    }

    if (this.activeModules.has(moduleId)) return;

    await module.onload();
    this.activeModules.add(moduleId);

    console.log(`[Harmony] Module "${moduleId}" activé.`);
  }

  disable(moduleId: string): void
  {
    const module = this.modules.get(moduleId);
    if (!module || !this.activeModules.has(moduleId)) return;

    try
    {
      module.onunload();
    }
    catch(e)
    {
      console.error(`Erreur lors du déchargement de ${moduleId}`, e)
    }
    this.activeModules.delete(moduleId);
    console.log(`[Harmony] Module "${moduleId}" désactivé.`);
  }

  unloadAll(): void
  {
    for (const id of this.activeModules)
    {
      this.disable(id);
    }
  }

  isActive(moduleId: string): boolean
  {
    return this.activeModules.has(moduleId);
  }

  getAll(): IModule[]
  {
    return Array.from(this.modules.values());
  }
}