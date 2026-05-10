import { App, normalizePath } from "obsidian";

export type Priority = "urgent" | "high" | "normal" | "low";

export interface KanbanCard {
  id: string;
  title: string;
  noteLink?: string;
  dueDate?: string;
  tags: string[];
  description?: string;
  priority: Priority;
  archived: boolean;
}

export interface KanbanColumn {
  id: string;
  title: string;
  color?: string;
  cards: KanbanCard[];
}

export interface KanbanBoardData {
  id: string;
  title: string;
  columns: KanbanColumn[];
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = normalizePath(".mega-plugin/kanban");

export class KanbanStore {
  private app: App;

  constructor(app: App) {
    this.app = app;
  }

  private boardPath(boardId: string): string {
    return normalizePath(`${DATA_DIR}/${boardId}.json`);
  }

  async ensureDataDir(): Promise<void> {
    if (!(await this.app.vault.adapter.exists(DATA_DIR))) {
      await this.app.vault.adapter.mkdir(DATA_DIR);
    }
  }

  async loadBoard(boardId: string): Promise<KanbanBoardData | null> {
    const path = this.boardPath(boardId);
    if (!(await this.app.vault.adapter.exists(path))) return null;
    const raw = await this.app.vault.adapter.read(path);
    return JSON.parse(raw) as KanbanBoardData;
  }

  async saveBoard(board: KanbanBoardData): Promise<void> {
    await this.ensureDataDir();
    board.updatedAt = new Date().toISOString();
    await this.app.vault.adapter.write(
      this.boardPath(board.id),
      JSON.stringify(board, null, 2)
    );
  }

  async listBoards(): Promise<KanbanBoardData[]> {
    await this.ensureDataDir();
    const files = await this.app.vault.adapter.list(DATA_DIR);
    const boards: KanbanBoardData[] = [];
    for (const f of files.files.filter((f) => f.endsWith(".json"))) {
      const raw = await this.app.vault.adapter.read(f);
      try { boards.push(JSON.parse(raw)); } catch {}
    }
    return boards.sort((a, b) => a.title.localeCompare(b.title));
  }

  async deleteBoard(boardId: string): Promise<void> {
    const path = this.boardPath(boardId);
    if (await this.app.vault.adapter.exists(path)) {
      await this.app.vault.adapter.remove(path);
    }
  }

  createEmptyBoard(title: string): KanbanBoardData {
    const now = new Date().toISOString();
    const ts = Date.now();
    return {
      id: `board-${ts}`,
      title,
      createdAt: now,
      updatedAt: now,
      columns: [
        { id: `col-${ts}-1`, title: "À faire",  color: "#6c8ebf", cards: [] },
        { id: `col-${ts}-2`, title: "En cours", color: "#d6a94a", cards: [] },
        { id: `col-${ts}-3`, title: "Terminé",  color: "#5a9e6f", cards: [] },
      ],
    };
  }

  generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }
}

export const PRIORITY_ORDER: Priority[] = ["urgent", "high", "normal", "low"];
export const PRIORITY_LABELS: Record<Priority, string> = {
  urgent: "🔴 Urgent",
  high:   "🟠 Haute",
  normal: "🟢 Normale",
  low:    "🫙 Basse",
};
export const PRIORITY_COLORS: Record<Priority, string> = {
  urgent: "#e55",
  high:   "#e96f00",
  normal: "#3a3",
  low:    "#888",
};
