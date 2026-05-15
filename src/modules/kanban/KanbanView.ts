import { ItemView, WorkspaceLeaf, setIcon } from "obsidian";
import type { KanbanStore, KanbanBoardData } from "./KanbanStore";
import { KanbanBoard } from "./KanbanBoard";
import { t } from "../../core/i18n";

export const KANBAN_VIEW_TYPE = "Harmony-kanban";

export class KanbanView extends ItemView
{
  private store: KanbanStore;
  private currentBoard: KanbanBoardData | null = null;
  private boardComponent: KanbanBoard | null = null;

  constructor(leaf: WorkspaceLeaf, store: KanbanStore)
  {
    super(leaf);
    this.store = store;
  }

  getViewType() { return KANBAN_VIEW_TYPE; }
  getDisplayText() { return this.currentBoard?.title ?? t(100); }
  getIcon() { return "kanban"; }

  async onOpen(): Promise<void>
  {
    await this.renderBoardSelector();
  }

  async onClose(): Promise<void>{}

  public async renderBoardSelector(): Promise<void>
  {
    const root = this.containerEl.children[1] as HTMLElement;
    root.empty();
    root.addClass("mkb-view-root");

    const boards = await this.store.listBoards();

    if (boards.length === 0)
    {
      const empty = root.createDiv("mkb-selector-empty");
      empty.createEl("p", { text: t(105) });
      const btn = empty.createEl("button", { text: t(106), cls: "mkb-btn mkb-btn-primary" });
      btn.addEventListener("click", () => void this.createBoard(root));
      return;
    }

    const bar = root.createDiv("mkb-selector-bar");
    const select = bar.createEl("select", { cls: "mkb-select" });
    for (const b of boards)
    {
      const opt = select.createEl("option", { text: b.title, value: b.id });
      if (this.currentBoard && b.id === this.currentBoard.id) opt.selected = true;
    }

    select.addEventListener("change", () => {
      void (async () =>
      {
        const board = await this.store.loadBoard(select.value);
        if (board) this.openBoard(board, root);
      })();
    });

    const newBtn = bar.createEl("button", { cls: "mkb-btn mkb-btn-secondary", text: t(106) });
    newBtn.addEventListener("click", () => void this.createBoard(root));

    const delBtn = bar.createEl("button", { cls: "mkb-btn-icon mkb-danger", title: t(104) });
    setIcon(delBtn, "trash");
  
    delBtn.addEventListener("click", () =>
    {
      void(async() =>
      {
        await this.store.deleteBoard(select.value);
        this.currentBoard = null;
        await this.renderBoardSelector();
      })()
    });

    const boardContainer = root.createDiv("mkb-board-container");
    const toOpen = this.currentBoard ? (await this.store.loadBoard(this.currentBoard.id)) ?? boards[0] : boards[0];

    if (toOpen)
    {
      select.value = toOpen.id;
      this.openBoard(toOpen, root, boardContainer);
    }
  }

  private openBoard(board: KanbanBoardData, root: HTMLElement, existingContainer?: HTMLElement): void
  {
    this.currentBoard = board;
    this.app.workspace.requestSaveLayout();

    let boardContainer = existingContainer ?? root.querySelector(".mkb-board-container") as HTMLElement;
    if (!boardContainer) { boardContainer = root.createDiv("mkb-board-container"); }
    boardContainer.empty();

    this.boardComponent = new KanbanBoard(this.app, this.store, board, boardContainer);
    this.boardComponent.onBoardChange = () =>
    {
      const select = root.querySelector(".mkb-select") as HTMLSelectElement;
      if (select)
      {
        const opt = select.querySelector(`option[value="${board.id}"]`) as HTMLOptionElement;
        if (opt) opt.text = board.title;
      }
      this.app.workspace.requestSaveLayout();
    };
    this.boardComponent.render();
  }

  private async createBoard(root: HTMLElement): Promise<void>
  {
    const title = await new Promise<string | null>((resolve) =>
    {
      const overlay = (this.containerEl.children[1] as HTMLElement).createDiv("mkb-editor-overlay");
      const box = overlay.createDiv("mkb-prompt-box");
      box.createEl("p", { text: t(107) });
      const input = box.createEl("input", { type: "text", placeholder: t(113) });
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
}