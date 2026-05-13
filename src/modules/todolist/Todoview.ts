import { ItemView, WorkspaceLeaf, setIcon } from "obsidian";
import { TodoStore } from "./TodoStore";
import { PRIORITY_COLORS, PRIORITY_ORDER, getPriorityLabels, Priority } from "../../shared/taskstore";
import {t} from "../../core/i18n";

export const TODO_VIEW_TYPE = "obsidian_ultimate-todo";

export class TodoView extends ItemView {
  private activeMenu: HTMLElement | null = null;

  constructor(leaf: WorkspaceLeaf, private store: TodoStore) {
    super(leaf);
  }

  getViewType(): string { return TODO_VIEW_TYPE; }
  getDisplayText(): string { return "Ma Todo List"; }
  getIcon(): string { return "check-check"; }

  async onOpen() {
    this.injectStyles();
    this.render();
  }

  async render()
  {
    const labels = getPriorityLabels();
    const root = this.containerEl.children[1] as HTMLElement;
    root.empty();
    root.addClass("utodo-view");

    root.createEl("h2", { text: t(300) });

    const inputContainer = root.createDiv("utodo-input-container");
    const input = inputContainer.createEl("input", { type: "text", placeholder: t(301) });
    input.onkeydown = async (e) => { 
        if (e.key === "Enter" && input.value.trim()) { 
            await this.store.addTask(input.value.trim()); 
            input.value = ""; 
            this.render(); 
        } 
    };

    const listEl = root.createDiv("utodo-list");
    let tasks = await this.store.getTasks();

    tasks.sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority);
    });

    tasks.forEach(task => {
      const itemEl = listEl.createDiv(`utodo-item ${task.done ? "is-done" : ""}`);
      
      const check = itemEl.createDiv("utodo-checkbox");
      if (task.done) setIcon(check, "check");
      check.onclick = async () => { await this.store.toggleTask(task.id, !task.done); this.render(); };

      const prioWrapper = itemEl.createDiv("utodo-prio-wrapper");
      const dot = prioWrapper.createDiv("utodo-prio-dot");
      dot.style.backgroundColor = PRIORITY_COLORS[task.priority];

      // Déclenchement du menu au clic (mousedown pour le feeling "drag")
      prioWrapper.onmousedown = (e) => {
        e.preventDefault();
        this.openRadialMenu(e, task.id,labels);
      };

      itemEl.createDiv({ text: task.title, cls: "utodo-title" });

      const del = itemEl.createDiv("utodo-action-del");
      setIcon(del, "trash");
      del.onclick = async () => { await this.store.deleteTask(task.id); this.render(); };
    });
  }

  private openRadialMenu(e: MouseEvent, taskId: string,labels:Record<Priority, string>) {
    this.closeMenu();

    const menu = document.body.createDiv("utodo-radial-container");
    this.activeMenu = menu;
    
    // On centre le menu sur la souris
    menu.style.left = `${e.clientX}px`;
    menu.style.top = `${e.clientY}px`;

    // Rayon du cercle pour positionner les boutons
    const radius = 80; 

    PRIORITY_ORDER.forEach((prio, index) =>
    {
      const angle = (index * (360 / PRIORITY_ORDER.length) - 90) * (Math.PI / 180);
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      const btn = menu.createDiv("utodo-radial-btn");
      btn.style.backgroundColor = PRIORITY_COLORS[prio];
      btn.style.transform = `translate(${x}px, ${y}px)`;
      
      btn.createSpan({ text: labels[prio] });

      btn.onmouseup = async (ev) =>
      {
        ev.stopPropagation();
        await this.store.updateTaskPriority(taskId, prio);
        this.closeMenu();
        this.render();
      };

      btn.onmouseenter = () => btn.addClass("is-hovered");
      btn.onmouseleave = () => btn.removeClass("is-hovered");
    });

    const onGlobalMouseUp = (ev: MouseEvent) =>
    {
      setTimeout(() => this.closeMenu(), 10);
      window.removeEventListener("mouseup", onGlobalMouseUp);
    };
    window.addEventListener("mouseup", onGlobalMouseUp);
  }

  private closeMenu()
  {
    if (this.activeMenu)
    {
      this.activeMenu.remove();
      this.activeMenu = null;
    }
  }

  private injectStyles()
  {
    const styleId = "utodo-radial-styles";
    if (document.getElementById(styleId)) return;
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      .utodo-prio-wrapper { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
      .utodo-prio-dot { width: 14px; height: 14px; border-radius: 50%; border: 2px solid var(--background-modifier-border); }

      /* MENU RADIAL CORRIGÉ */
      .utodo-radial-container {
        position: fixed;
        width: 1px; height: 1px; /* Point central */
        z-index: 10000;
        display: flex; align-items: center; justify-content: center;
        pointer-events: none;
      }

      .utodo-radial-btn {
        position: absolute;
        pointer-events: all;
        cursor: pointer;
        padding: 8px 14px;
        border-radius: 20px;
        color: white;
        font-weight: bold;
        font-size: 13px;
        white-space: nowrap;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        border: 2px solid rgba(255,255,255,0.2);
        transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), background 0.2s;
        display: flex; align-items: center; justify-content: center;
      }

      .utodo-radial-btn.is-hovered {
        filter: brightness(1.1);
        z-index: 10001;
        /* On garde la translation du cercle mais on ajoute un scale */
        scale: 1.15;
      }

      .utodo-radial-btn span {
        text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
      }
    `;
    document.head.appendChild(style);
  }
}