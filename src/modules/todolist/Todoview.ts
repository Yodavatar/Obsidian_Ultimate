import { ItemView, WorkspaceLeaf, setIcon } from "obsidian";
import { TodoStore } from "./TodoStore";
import { PRIORITY_COLORS, PRIORITY_ORDER, getPriorityLabels, Priority } from "../../shared/taskstore";
import { t } from "../../core/i18n";

export const TODO_VIEW_TYPE = "Harmony-todo";

export class TodoView extends ItemView
{
  private activeMenu: HTMLElement | null = null;
  private labels: Record<Priority, string>;

  constructor(leaf: WorkspaceLeaf, private store: TodoStore)
  {
    super(leaf);
    this.labels = getPriorityLabels();
  }

  getViewType(): string { return TODO_VIEW_TYPE; }
  getDisplayText(): string { return "Todo List"; }
  getIcon(): string { return "check-check"; }

  async onOpen() {
    this.injectStyles();
    this.render();
  }

  async render()
  {
    const root = this.contentEl;
    root.empty();
    root.addClass("utodo-view");

    // Container central pour limiter la largeur et centrer
    const centralContainer = root.createDiv("utodo-central-container");

    centralContainer.createEl("h2", { text: t(300) || "Todo List", cls: "utodo-main-title" });

    const inputContainer = centralContainer.createDiv("utodo-input-container");
    const input = inputContainer.createEl("input", { 
      type: "text", 
      placeholder: t(301) || "Ajouter une tâche..." 
    });

    input.onkeydown = async (e) =>
    { 
      if (e.key === "Enter" && input.value.trim())
      { 
        await this.store.addTask(input.value.trim()); 
        input.value = ""; 
        this.render(); 
      } 
    };

    const listEl = centralContainer.createDiv("utodo-list");
    let tasks = await this.store.getTasks();

    tasks.sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority);
    });

    tasks.forEach(task => {
      const itemEl = listEl.createDiv({
        cls: `utodo-item ${task.done ? "is-done" : ""}`
      });
      
      // --- LE BOUTON CHECK (RÉTABLI) ---
      const checkBtn = itemEl.createDiv("utodo-checkbox");
      if (task.done) {
        setIcon(checkBtn, "check");
        checkBtn.addClass("is-checked");
      }
      checkBtn.onclick = async () => { 
        await this.store.toggleTask(task.id, !task.done); 
        this.render(); 
      };

      // --- LE POINT DE PRIORITÉ ---
      const prioWrapper = itemEl.createDiv("utodo-prio-wrapper");
      const dot = prioWrapper.createDiv("utodo-prio-dot");
      dot.style.backgroundColor = PRIORITY_COLORS[task.priority] || "#ccc";

      prioWrapper.onmousedown = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.openRadialMenu(e, task.id);
      };

      // --- LE TITRE ---
      itemEl.createDiv({ text: task.title, cls: "utodo-title" });

      // --- LE BOUTON DELETE ---
      const del = itemEl.createDiv("utodo-action-del");
      setIcon(del, "trash");
      del.onclick = async () => { 
        await this.store.deleteTask(task.id); 
        this.render(); 
      };
    });
  }

  private openRadialMenu(e: MouseEvent, taskId: string) {
    this.closeMenu();
    const menu = document.body.createDiv("utodo-radial-container");
    this.activeMenu = menu;
    menu.style.left = `${e.clientX}px`;
    menu.style.top = `${e.clientY}px`;
    const radius = 80; 

    PRIORITY_ORDER.forEach((prio, index) => {
      const angle = (index * (360 / PRIORITY_ORDER.length) - 90) * (Math.PI / 180);
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const btn = menu.createDiv("utodo-radial-btn");
      btn.style.backgroundColor = PRIORITY_COLORS[prio];
      btn.style.transform = `translate(${x}px, ${y}px)`;
      const labelText = this.labels[prio] || prio;
      btn.createSpan({ text: labelText });

      btn.onmouseup = async (ev) => {
        ev.stopPropagation();
        await this.store.updateTaskPriority(taskId, prio);
        this.closeMenu();
        this.render();
      };
      btn.onmouseenter = () => btn.addClass("is-hovered");
      btn.onmouseleave = () => btn.removeClass("is-hovered");
    });

    const onGlobalMouseUp = () => {
      setTimeout(() => this.closeMenu(), 50);
      window.removeEventListener("mouseup", onGlobalMouseUp);
    };
    window.addEventListener("mouseup", onGlobalMouseUp);
  }

  private closeMenu() {
    if (this.activeMenu) {
      this.activeMenu.remove();
      this.activeMenu = null;
    }
  }

  private injectStyles() {
    const styleId = "utodo-radial-styles";
    document.getElementById(styleId)?.remove();

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      .utodo-view { 
        display: flex; flex-direction: column; align-items: center; 
        padding: 40px 20px; overflow-y: auto; background-color: var(--background-primary);
      }

      .utodo-central-container { width: 100%; max-width: 550px; display: flex; flex-direction: column; gap: 20px; }

      .utodo-main-title { text-align: center; margin-bottom: 10px; color: var(--text-title); }

      .utodo-input-container { width: 100%; }
      .utodo-input-container input {
        width: 100%; padding: 12px 16px; border-radius: 8px;
        border: 1px solid var(--background-modifier-border);
        background: var(--background-secondary);
        color: var(--text-normal);
        font-size: 1.1em;
      }

      .utodo-list { display: flex; flex-direction: column; gap: 10px; width: 100%; }

      .utodo-item {
        display: flex; align-items: center; padding: 10px 15px;
        background: var(--background-primary);
        border-radius: 10px;
        border: 1px solid var(--background-modifier-border);
        transition: all 0.2s ease;
      }
      .utodo-item:hover { border-color: var(--interactive-accent); background: var(--background-secondary-alt); }

      /* Styles Checkbox */
      .utodo-checkbox {
        width: 22px; height: 22px; border-radius: 6px;
        border: 2px solid var(--text-muted);
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; transition: all 0.2s;
        margin-right: 12px; flex-shrink: 0;
      }
      .utodo-checkbox.is-checked { background: var(--interactive-accent); border-color: var(--interactive-accent); color: white; }
      .utodo-checkbox svg { width: 14px; height: 14px; }

      .utodo-item.is-done { opacity: 0.6; }
      .utodo-item.is-done .utodo-title { text-decoration: line-through; color: var(--text-muted); }

      .utodo-title { flex: 1; font-size: 15px; color: var(--text-normal); }

      .utodo-prio-wrapper { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer; margin-right: 10px; }
      .utodo-prio-dot { width: 12px; height: 12px; border-radius: 50%; border: 1px solid rgba(0,0,0,0.1); }

      .utodo-action-del {
        cursor: pointer; color: var(--text-muted); padding: 5px; border-radius: 4px;
        opacity: 0; transition: all 0.2s;
      }
      .utodo-item:hover .utodo-action-del { opacity: 1; }
      .utodo-action-del:hover { background: var(--background-modifier-error); color: white; }
      .utodo-action-del svg { width: 16px; height: 16px; }

      /* Menu Radial */
      .utodo-radial-container { position: fixed; z-index: 10000; pointer-events: none; }
      .utodo-radial-btn {
        position: absolute; pointer-events: all; cursor: pointer;
        padding: 8px 16px; border-radius: 20px; color: white;
        font-weight: bold; font-size: 13px; box-shadow: 0 4px 15px rgba(0,0,0,0.4);
        transition: transform 0.2s;
      }
    `;
    document.head.appendChild(style);
  }
}