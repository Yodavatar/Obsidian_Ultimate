import { ItemView, WorkspaceLeaf, setIcon } from "obsidian";
import { TodoStore } from "./TodoStore";
import { PRIORITY_COLORS } from "../../shared/taskstore";
import { t } from "../../core/i18n";

export const TODO_VIEW_TYPE = "obsidian_ultimate-todo";

export class TodoView extends ItemView {
  constructor(leaf: WorkspaceLeaf, private store: TodoStore) {
    super(leaf);
  }

  getViewType() { return TODO_VIEW_TYPE; }
  getDisplayText() { return "Ma Todo List"; }
  getIcon() { return "check-check"; }

  async onOpen() {
    this.injectStyles();
    this.render();
  }

  async render() {
    const root = this.containerEl.children[1] as HTMLElement;
    root.empty();
    root.addClass("utodo-view");

    // Header
    const header = root.createDiv("utodo-header");
    header.createEl("h2", { text: "Tâches rapides" });

    // Barre d'ajout
    const inputContainer = root.createDiv("utodo-input-container");
    const input = inputContainer.createEl("input", { 
        type: "text", 
        placeholder: "Nouvelle tâche..." 
    });
    
    input.addEventListener("keydown", async (e) => {
      if (e.key === "Enter" && input.value.trim()) {
        await this.store.addTask(input.value.trim());
        input.value = "";
        this.render();
      }
    });

    // Liste des tâches
    const listEl = root.createDiv("utodo-list");
    const tasks = await this.store.getTasks();

    tasks.forEach(task => {
      const itemEl = listEl.createDiv(`utodo-item ${task.done ? "is-done" : ""}`);
      
      // Checkbox custom
      const check = itemEl.createDiv("utodo-checkbox");
      if (task.done) setIcon(check, "check");
      check.onclick = async () => {
        await this.store.toggleTask(task.id, !task.done);
        this.render();
      };

      // Titre avec couleur de priorité
      const titleEl = itemEl.createDiv({ text: task.title, cls: "utodo-title" });
      titleEl.style.borderLeft = `3px solid ${PRIORITY_COLORS[task.priority]}`;

      // Bouton supprimer
      const del = itemEl.createDiv("utodo-action-del");
      setIcon(del, "trash");
      del.onclick = async () => {
        await this.store.deleteTask(task.id);
        this.render();
      };
    });
  }

  private injectStyles() {
    const styleId = "utodo-css";
    if (document.getElementById(styleId)) return;
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      .utodo-view { padding: 20px; max-width: 500px; margin: 0 auto; }
      .utodo-header h2 { margin-bottom: 20px; font-weight: 600; opacity: 0.9; }
      
      .utodo-input-container input {
        width: 100%; padding: 12px; border-radius: 8px;
        background: var(--background-secondary);
        border: 1px solid var(--background-modifier-border);
        margin-bottom: 20px; transition: all 0.2s;
      }
      .utodo-input-container input:focus { border-color: var(--interactive-accent); box-shadow: 0 0 0 2px var(--background-modifier-border); }

      .utodo-list { display: flex; flex-direction: column; gap: 8px; }
      
      .utodo-item {
        display: flex; align-items: center; padding: 10px;
        background: var(--background-primary);
        border-radius: 8px; border: 1px solid var(--background-modifier-border);
        transition: transform 0.1s;
      }
      .utodo-item:hover { transform: scale(1.01); background: var(--background-secondary-alt); }
      
      .utodo-checkbox {
        width: 20px; height: 20px; border-radius: 5px;
        border: 2px solid var(--interactive-accent);
        margin-right: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center;
      }
      .utodo-item.is-done .utodo-checkbox { background: var(--interactive-accent); color: white; }
      .utodo-item.is-done .utodo-title { text-decoration: line-through; opacity: 0.5; }
      
      .utodo-title { flex: 1; padding-left: 10px; }
      
      .utodo-action-del { opacity: 0; cursor: pointer; color: var(--text-error); padding: 4px; }
      .utodo-item:hover .utodo-action-del { opacity: 0.6; }
      .utodo-action-del:hover { opacity: 1 !important; }
    `;
    document.head.appendChild(style);
  }
}