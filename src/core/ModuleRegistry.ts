import { type IModule } from "../shared/types";

export class ModuleRegistry
{
  private modules: Map<string, IModule> = new Map();
  private activeModules: Set<string> = new Set();

  register(module: IModule): void
  {
    if (this.modules.has(module.id))
    {
      console.warn(`[Obsidian Ultimate] Module "${module.id}" déjà enregistré, ignoré.`);
      return;
    }
    this.modules.set(module.id, module);
    console.log(`[Obsidian Ultimate] Module "${module.id}" enregistré.`);
  }

  async enable(moduleId: string): Promise<void>
  {
    const module = this.modules.get(moduleId);
    if (!module)
    {
      console.error(`[Obsidian Ultimate] Module "${moduleId}" introuvable.`);
      return;
    }

    if (this.activeModules.has(moduleId)) return;

    await module.onload();
    this.activeModules.add(moduleId);

    console.log(`[Obsidian Ultimate] Module "${moduleId}" activé.`);
  }

  disable(moduleId: string): void {
    const module = this.modules.get(moduleId);
    if (!module || !this.activeModules.has(moduleId)) return;

    module.onunload();
    this.activeModules.delete(moduleId);
    console.log(`[Obsidian Ultimate] Module "${moduleId}" désactivé.`);
  }

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
