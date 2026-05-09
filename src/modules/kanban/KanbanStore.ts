import { App, normalizePath } from "obsidian";

export interface KanbanCard {
  id: string;
  title: string;
  noteLink?: string;   // chemin vers une note Obsidian (ex: "projets/todo.md")
  dueDate?: string;    // ISO 8601
  tags: string[];
  description?: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  color?: string;      // couleur d'accent hex
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

/**
 * Gère la lecture/écriture des boards Kanban dans le vault.
 * Chaque board = un fichier JSON dans .mega-plugin/kanban/<id>.json
 */
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
    const path = this.boardPath(board.id);
    await this.app.vault.adapter.write(path, JSON.stringify(board, null, 2));
  }

  async listBoards(): Promise<string[]> {
    await this.ensureDataDir();
    const files = await this.app.vault.adapter.list(DATA_DIR);
    return files.files
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(`${DATA_DIR}/`, "").replace(".json", ""));
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
