import { ItemView, WorkspaceLeaf, setIcon } from "obsidian";
import type { KanbanStore, KanbanBoardData } from "./KanbanStore";
import { KanbanBoard } from "./KanbanBoard";

export const KANBAN_VIEW_TYPE = "mega-plugin-kanban";

export class KanbanView extends ItemView {
  private store: KanbanStore;
  private currentBoard: KanbanBoardData | null = null;
  private boardComponent: KanbanBoard | null = null;

  constructor(leaf: WorkspaceLeaf, store: KanbanStore) {
    super(leaf);
    this.store = store;
  }

  getViewType() { return KANBAN_VIEW_TYPE; }
  getDisplayText() { return this.currentBoard?.title ?? "Kanban"; }
  getIcon() { return "layout-kanban"; }

  async onOpen(): Promise<void> {
    this.injectStyles();
    await this.renderBoardSelector();
  }

  async onClose(): Promise<void> {}

  // ─── Sélecteur de boards ─────────────────────────────────────────────────────

  private async renderBoardSelector(): Promise<void> {
    const root = this.containerEl.children[1] as HTMLElement;
    root.empty();
    root.addClass("mkb-view-root");

    const boards = await this.store.listBoards();

    // S'il existe déjà des boards, en ouvrir le premier par défaut
    if (boards.length === 0) {
      const empty = root.createDiv("mkb-selector-empty");
      empty.createEl("p", { text: "Aucun board. Crée-en un !" });
      const btn = empty.createEl("button", { text: "+ Nouveau board", cls: "mkb-btn mkb-btn-primary" });
      btn.addEventListener("click", () => this.createBoard(root));
      return;
    }

    // Barre de sélection
    const bar = root.createDiv("mkb-selector-bar");
    const select = bar.createEl("select", { cls: "mkb-select" });
    for (const b of boards) {
      const opt = select.createEl("option", { text: b.title, value: b.id });
      if (this.currentBoard && b.id === this.currentBoard.id) opt.selected = true;
    }

    const openBtn = bar.createEl("button", { cls: "mkb-btn mkb-btn-primary", text: "Ouvrir" });
    openBtn.addEventListener("click", async () => {
      const board = await this.store.loadBoard(select.value);
      if (board) this.openBoard(board, root);
    });

    const newBtn = bar.createEl("button", { cls: "mkb-btn mkb-btn-secondary", text: "+ Nouveau" });
    newBtn.addEventListener("click", () => this.createBoard(root));

    const delBtn = bar.createEl("button", { cls: "mkb-btn-icon mkb-danger", title: "Supprimer ce board" });
    setIcon(delBtn, "trash");
    delBtn.addEventListener("click", async () => {
      await this.store.deleteBoard(select.value);
      this.currentBoard = null;
      await this.renderBoardSelector();
    });

    // Zone du board
    const boardContainer = root.createDiv("mkb-board-container");

    // Ouvrir le board sélectionné (ou le premier par défaut)
    const toOpen = this.currentBoard
      ? (await this.store.loadBoard(this.currentBoard.id)) ?? boards[0]
      : boards[0];

    if (toOpen) {
      select.value = toOpen.id;
      this.openBoard(toOpen, root, boardContainer);
    }
  }

  private openBoard(board: KanbanBoardData, root: HTMLElement, existingContainer?: HTMLElement): void {
    this.currentBoard = board;
    this.app.workspace.requestSaveLayout();

    // Remplacer la zone board
    let boardContainer = existingContainer ?? root.querySelector(".mkb-board-container") as HTMLElement;
    if (!boardContainer) {
      boardContainer = root.createDiv("mkb-board-container");
    }
    boardContainer.empty();

    this.boardComponent = new KanbanBoard(this.app, this.store, board, boardContainer);
    this.boardComponent.onBoardChange = () => {
      // Rafraîchir le sélecteur si le titre change
      const select = root.querySelector(".mkb-select") as HTMLSelectElement;
      if (select) {
        const opt = select.querySelector(`option[value="${board.id}"]`) as HTMLOptionElement;
        if (opt) opt.text = board.title;
      }
      this.app.workspace.requestSaveLayout();
    };
    this.boardComponent.render();
  }

  private async createBoard(root: HTMLElement): Promise<void> {
    const title = await new Promise<string | null>((resolve) => {
      const overlay = (this.containerEl.children[1] as HTMLElement).createDiv("mkb-editor-overlay");
      const box = overlay.createDiv("mkb-prompt-box");
      box.createEl("p", { text: "Nom du nouveau board" });
      const input = box.createEl("input", { type: "text", placeholder: "Mon board" });
      input.className = "mkb-inline-input";
      input.focus();
      const confirm = () => { overlay.remove(); resolve(input.value.trim() || null); };
      input.addEventListener("keydown", (e) => { if (e.key === "Enter") confirm(); if (e.key === "Escape") { overlay.remove(); resolve(null); } });
      overlay.addEventListener("click", (e) => { if (e.target === overlay) { overlay.remove(); resolve(null); } });
    });
    if (!title) return;
    const board = this.store.createEmptyBoard(title);
    await this.store.saveBoard(board);
    this.currentBoard = board;
    await this.renderBoardSelector();
  }

  // ─── Styles ──────────────────────────────────────────────────────────────────

  private injectStyles(): void {
    const styleId = "mega-plugin-kanban-styles";
    if (document.getElementById(styleId)) return;
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      .mkb-view-root { height: 100%; display: flex; flex-direction: column; overflow: hidden; }

      /* Selector bar */
      .mkb-selector-bar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-bottom: 1px solid var(--background-modifier-border); flex-shrink: 0; }
      .mkb-select { background: var(--background-secondary); color: var(--text-normal); border: 1px solid var(--background-modifier-border); border-radius: 6px; padding: 4px 8px; flex: 1; max-width: 300px; }
      .mkb-selector-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 12px; color: var(--text-muted); }

      /* Board container */
      .mkb-board-container { flex: 1; overflow: hidden; display: flex; flex-direction: column; }

      /* Board */
      .mkb-board { display: flex; flex-direction: column; height: 100%; padding: 12px; gap: 10px; }
      .mkb-board-header { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
      .mkb-board-title { margin: 0; font-size: 1.15em; cursor: pointer; }
      .mkb-board-title:hover { text-decoration: underline dotted; }
      .mkb-board-title-input { font-size: 1.15em; font-weight: 700; }
      .mkb-header-actions { display: flex; gap: 6px; margin-left: auto; }

      /* Columns */
      .mkb-columns { display: flex; gap: 12px; overflow-x: auto; flex: 1; padding-bottom: 8px; align-items: flex-start; }
      .mkb-column { min-width: 240px; max-width: 280px; flex-shrink: 0; background: var(--background-secondary); border-radius: 8px; padding: 8px; display: flex; flex-direction: column; gap: 6px; }
      .mkb-column-header { display: flex; align-items: center; gap: 6px; border-top: 3px solid var(--color-accent); padding-top: 4px; }
      .mkb-column-title { font-weight: 600; flex: 1; cursor: pointer; }
      .mkb-column-count { font-size: 0.75em; background: var(--background-modifier-border); border-radius: 10px; padding: 1px 6px; }

      /* Cards */
      .mkb-cards { display: flex; flex-direction: column; gap: 6px; min-height: 40px; }
      .mkb-cards.mkb-drag-over { background: var(--background-modifier-hover); border-radius: 6px; }
      .mkb-card { background: var(--background-primary); border: 1px solid var(--background-modifier-border); border-left: 4px solid #888; border-radius: 6px; padding: 8px 10px; cursor: grab; display: flex; flex-direction: column; gap: 4px; transition: box-shadow 0.15s; }
      .mkb-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
      .mkb-card.mkb-dragging { opacity: 0.4; }
      .mkb-card-archived { cursor: default; opacity: 0.8; }
      .mkb-priority-badge { font-size: 0.72em; font-weight: 600; }
      .mkb-card-title { font-size: 0.9em; font-weight: 500; }
      .mkb-card-note-link { font-size: 0.78em; color: var(--link-color); text-decoration: none; cursor: pointer; }
      .mkb-card-due { font-size: 0.75em; color: var(--text-muted); }
      .mkb-card-due.mkb-overdue { color: var(--color-red); }
      .mkb-card-tags { display: flex; flex-wrap: wrap; gap: 4px; }
      .mkb-tag { font-size: 0.7em; background: var(--tag-background); color: var(--tag-color); border-radius: 4px; padding: 1px 5px; }
      .mkb-card-actions { display: none; gap: 4px; justify-content: flex-end; margin-top: 2px; }
      .mkb-card:hover .mkb-card-actions { display: flex; }

      /* Archives */
      .mkb-archive-section { padding: 12px; border-top: 1px solid var(--background-modifier-border); flex-shrink: 0; max-height: 300px; overflow-y: auto; }
      .mkb-archive-title { margin: 0 0 8px; font-size: 0.95em; color: var(--text-muted); }
      .mkb-archive-grid { display: flex; flex-wrap: wrap; gap: 8px; }
      .mkb-archive-grid .mkb-card { min-width: 200px; max-width: 260px; }
      .mkb-empty { color: var(--text-muted); font-size: 0.85em; }

      /* Buttons */
      .mkb-btn { border-radius: 6px; padding: 4px 10px; font-size: 0.82em; cursor: pointer; border: none; }
      .mkb-btn-primary { background: var(--interactive-accent); color: var(--text-on-accent); }
      .mkb-btn-secondary { background: var(--background-modifier-border); color: var(--text-normal); }
      .mkb-btn.mkb-active { background: var(--interactive-accent); color: var(--text-on-accent); }
      .mkb-btn-add-card { width: 100%; background: transparent; color: var(--text-muted); border: 1px dashed var(--background-modifier-border); }
      .mkb-btn-add-card:hover { background: var(--background-modifier-hover); }
      .mkb-btn-icon { background: transparent; border: none; cursor: pointer; padding: 2px; color: var(--text-muted); }
      .mkb-btn-icon:hover { color: var(--text-normal); }
      .mkb-btn-icon.mkb-danger:hover { color: var(--color-red); }

      /* Inputs */
      .mkb-inline-input { width: 100%; border: 1px solid var(--interactive-accent); border-radius: 4px; padding: 2px 6px; background: var(--background-primary); color: var(--text-normal); font-size: inherit; }

      /* Editor overlay */
      .mkb-editor-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 100; }
      .mkb-editor-modal, .mkb-prompt-box { background: var(--background-primary); border: 1px solid var(--background-modifier-border); border-radius: 10px; padding: 20px; min-width: 300px; display: flex; flex-direction: column; gap: 10px; }
      .mkb-editor-row { display: flex; flex-direction: column; gap: 4px; }
      .mkb-editor-row label { font-size: 0.8em; color: var(--text-muted); }
      .mkb-editor-btns { display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px; }
    `;
    document.head.appendChild(style);
  }
}
