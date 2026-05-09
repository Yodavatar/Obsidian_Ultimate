import { ItemView, WorkspaceLeaf } from "obsidian";
import type { KanbanStore } from "./KanbanStore";
import { KanbanBoard } from "./KanbanBoard";
import type { App } from "obsidian";

export const KANBAN_VIEW_TYPE = "mega-plugin-kanban";

/**
 * La vue Kanban — s'intègre dans le workspace Obsidian comme n'importe quel panneau.
 */
export class KanbanView extends ItemView {
  private store: KanbanStore;
  private boardId: string;
  private board: KanbanBoard | null = null;

  constructor(leaf: WorkspaceLeaf, store: KanbanStore, boardId: string) {
    super(leaf);
    this.store = store;
    this.boardId = boardId;
  }

  getViewType(): string {
    return KANBAN_VIEW_TYPE;
  }

  getDisplayText(): string {
    return "Kanban";
  }

  getIcon(): string {
    return "layout-kanban";
  }

  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.addClass("mkb-view-root");

    // Injecter les styles
    this.injectStyles();

    let boardData = await this.store.loadBoard(this.boardId);

    if (!boardData) {
      // Premier lancement : créer un board par défaut
      boardData = this.store.createEmptyBoard("Mon Board");
      await this.store.saveBoard(boardData);
      this.boardId = boardData.id;
    }

    this.board = new KanbanBoard(this.app, this.store, boardData, container);
    this.board.render();
  }

  async onClose(): Promise<void> {
    // Nettoyage si nécessaire
  }

  private injectStyles(): void {
    const styleId = "mega-plugin-kanban-styles";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      .mkb-view-root { height: 100%; display: flex; flex-direction: column; }

      /* Board */
      .mkb-board { display: flex; flex-direction: column; height: 100%; padding: 12px; gap: 12px; }
      .mkb-board-header { display: flex; align-items: center; gap: 12px; }
      .mkb-board-title { margin: 0; font-size: 1.2em; }

      /* Colonnes */
      .mkb-columns {
        display: flex; gap: 12px; overflow-x: auto; flex: 1;
        padding-bottom: 8px; align-items: flex-start;
      }
      .mkb-column {
        min-width: 240px; max-width: 280px; flex-shrink: 0;
        background: var(--background-secondary);
        border-radius: 8px; padding: 8px;
        display: flex; flex-direction: column; gap: 6px;
      }
      .mkb-column-header {
        display: flex; align-items: center; gap: 6px;
        border-top: 3px solid var(--color-accent);
        padding-top: 4px;
      }
      .mkb-column-title { font-weight: 600; flex: 1; cursor: pointer; }
      .mkb-column-count {
        font-size: 0.75em; background: var(--background-modifier-border);
        border-radius: 10px; padding: 1px 6px;
      }

      /* Cards */
      .mkb-cards { display: flex; flex-direction: column; gap: 6px; min-height: 40px; }
      .mkb-cards.mkb-drag-over { background: var(--background-modifier-hover); border-radius: 6px; }
      .mkb-card {
        background: var(--background-primary);
        border: 1px solid var(--background-modifier-border);
        border-radius: 6px; padding: 8px 10px;
        cursor: grab; transition: box-shadow 0.15s;
        display: flex; flex-direction: column; gap: 4px;
      }
      .mkb-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
      .mkb-card.mkb-dragging { opacity: 0.4; }
      .mkb-card-title { font-size: 0.9em; font-weight: 500; }
      .mkb-card-note-link { font-size: 0.78em; color: var(--link-color); text-decoration: none; cursor: pointer; }
      .mkb-card-due { font-size: 0.75em; color: var(--text-muted); }
      .mkb-card-due.mkb-overdue { color: var(--color-red); }
      .mkb-card-tags { display: flex; flex-wrap: wrap; gap: 4px; }
      .mkb-tag {
        font-size: 0.7em; background: var(--tag-background);
        color: var(--tag-color); border-radius: 4px; padding: 1px 5px;
      }
      .mkb-card-actions { display: none; gap: 4px; justify-content: flex-end; }
      .mkb-card:hover .mkb-card-actions { display: flex; }

      /* Boutons */
      .mkb-btn { border-radius: 6px; padding: 4px 10px; font-size: 0.82em; cursor: pointer; border: none; }
      .mkb-btn-primary { background: var(--interactive-accent); color: var(--text-on-accent); }
      .mkb-btn-secondary { background: var(--background-modifier-border); color: var(--text-normal); }
      .mkb-btn-add-card { width: 100%; background: transparent; color: var(--text-muted); border: 1px dashed var(--background-modifier-border); }
      .mkb-btn-add-card:hover { background: var(--background-modifier-hover); }
      .mkb-btn-icon { background: transparent; border: none; cursor: pointer; padding: 2px; color: var(--text-muted); }
      .mkb-btn-icon:hover { color: var(--text-normal); }
      .mkb-btn-icon.mkb-danger:hover { color: var(--color-red); }

      /* Inputs inline */
      .mkb-inline-input {
        width: 100%; border: 1px solid var(--interactive-accent);
        border-radius: 4px; padding: 2px 6px; background: var(--background-primary);
        color: var(--text-normal); font-size: inherit;
      }

      /* Overlay éditeur */
      .mkb-editor-overlay {
        position: absolute; inset: 0; background: rgba(0,0,0,0.4);
        display: flex; align-items: center; justify-content: center;
        z-index: 100;
      }
      .mkb-editor-modal, .mkb-prompt-box {
        background: var(--background-primary);
        border: 1px solid var(--background-modifier-border);
        border-radius: 10px; padding: 20px; min-width: 300px;
        display: flex; flex-direction: column; gap: 10px;
      }
      .mkb-editor-row { display: flex; flex-direction: column; gap: 4px; }
      .mkb-editor-row label { font-size: 0.8em; color: var(--text-muted); }
      .mkb-editor-btns { display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px; }
    `;
    document.head.appendChild(style);
  }
}
