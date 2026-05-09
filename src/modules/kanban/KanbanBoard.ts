import { App, setIcon } from "obsidian";
import type {
  KanbanBoardData,
  KanbanCard,
  KanbanColumn,
} from "./KanbanStore";
import { KanbanStore } from "./KanbanStore";

/**
 * KanbanBoard gère tout le rendu HTML et les interactions utilisateur.
 * Pas de framework externe — DOM natif pour rester léger et compatible Obsidian.
 */
export class KanbanBoard {
  private app: App;
  private store: KanbanStore;
  private board: KanbanBoardData;
  private container: HTMLElement;

  // Drag and drop state
  private dragCard: KanbanCard | null = null;
  private dragSourceColId: string | null = null;

  constructor(
    app: App,
    store: KanbanStore,
    board: KanbanBoardData,
    container: HTMLElement
  ) {
    this.app = app;
    this.store = store;
    this.board = board;
    this.container = container;
  }

  render(): void {
    this.container.empty();
    this.container.addClass("mkb-board");

    // Header du board
    const header = this.container.createDiv("mkb-board-header");
    header.createEl("h2", { text: this.board.title, cls: "mkb-board-title" });

    const addColBtn = header.createEl("button", {
      cls: "mkb-btn mkb-btn-secondary",
      text: "+ Colonne",
    });
    addColBtn.addEventListener("click", () => this.addColumn());

    // Zone scrollable des colonnes
    const columnsEl = this.container.createDiv("mkb-columns");

    for (const col of this.board.columns) {
      this.renderColumn(columnsEl, col);
    }
  }

  private renderColumn(parent: HTMLElement, col: KanbanColumn): void {
    const colEl = parent.createDiv("mkb-column");
    colEl.dataset.colId = col.id;

    // Accent couleur sur le header
    const colHeader = colEl.createDiv("mkb-column-header");
    if (col.color) {
      colHeader.style.borderTopColor = col.color;
    }

    // Titre éditable
    const titleEl = colHeader.createEl("span", {
      text: col.title,
      cls: "mkb-column-title",
    });
    titleEl.addEventListener("dblclick", () =>
      this.editColumnTitle(titleEl, col)
    );

    // Compteur de cards
    colHeader.createEl("span", {
      text: String(col.cards.length),
      cls: "mkb-column-count",
    });

    // Bouton supprimer colonne
    const delColBtn = colHeader.createEl("button", { cls: "mkb-btn-icon" });
    setIcon(delColBtn, "trash");
    delColBtn.addEventListener("click", () => this.deleteColumn(col.id));

    // Zone des cards (drop target)
    const cardsEl = colEl.createDiv("mkb-cards");
    cardsEl.addEventListener("dragover", (e) => {
      e.preventDefault();
      cardsEl.addClass("mkb-drag-over");
    });
    cardsEl.addEventListener("dragleave", () => {
      cardsEl.removeClass("mkb-drag-over");
    });
    cardsEl.addEventListener("drop", (e) => {
      e.preventDefault();
      cardsEl.removeClass("mkb-drag-over");
      this.onDrop(col.id);
    });

    for (const card of col.cards) {
      this.renderCard(cardsEl, card, col.id);
    }

    // Bouton ajouter card
    const addCardBtn = colEl.createEl("button", {
      cls: "mkb-btn mkb-btn-add-card",
      text: "+ Carte",
    });
    addCardBtn.addEventListener("click", () => this.addCard(col.id));
  }

  private renderCard(
    parent: HTMLElement,
    card: KanbanCard,
    colId: string
  ): void {
    const cardEl = parent.createDiv("mkb-card");
    cardEl.draggable = true;
    cardEl.dataset.cardId = card.id;

    cardEl.addEventListener("dragstart", () => {
      this.dragCard = card;
      this.dragSourceColId = colId;
      cardEl.addClass("mkb-dragging");
    });
    cardEl.addEventListener("dragend", () => {
      cardEl.removeClass("mkb-dragging");
    });

    // Titre
    const titleEl = cardEl.createEl("span", {
      text: card.title,
      cls: "mkb-card-title",
    });
    titleEl.addEventListener("dblclick", () =>
      this.editCardTitle(titleEl, card, colId)
    );

    // Lien vers une note
    if (card.noteLink) {
      const linkEl = cardEl.createEl("a", {
        text: `📄 ${card.noteLink}`,
        cls: "mkb-card-note-link",
      });
      linkEl.addEventListener("click", (e) => {
        e.preventDefault();
        this.app.workspace.openLinkText(card.noteLink!, "", false);
      });
    }

    // Due date
    if (card.dueDate) {
      const due = new Date(card.dueDate);
      const isOverdue = due < new Date();
      cardEl.createEl("span", {
        text: `📅 ${due.toLocaleDateString("fr-FR")}`,
        cls: `mkb-card-due ${isOverdue ? "mkb-overdue" : ""}`,
      });
    }

    // Tags
    if (card.tags.length > 0) {
      const tagsEl = cardEl.createDiv("mkb-card-tags");
      for (const tag of card.tags) {
        tagsEl.createEl("span", { text: `#${tag}`, cls: "mkb-tag" });
      }
    }

    // Boutons actions
    const actions = cardEl.createDiv("mkb-card-actions");

    const editBtn = actions.createEl("button", { cls: "mkb-btn-icon" });
    setIcon(editBtn, "pencil");
    editBtn.addEventListener("click", () =>
      this.openCardEditor(card, colId)
    );

    const delBtn = actions.createEl("button", { cls: "mkb-btn-icon mkb-danger" });
    setIcon(delBtn, "trash");
    delBtn.addEventListener("click", () => this.deleteCard(card.id, colId));
  }

  // ─── Drag & Drop ────────────────────────────────────────────────────────────

  private onDrop(targetColId: string): void {
    if (!this.dragCard || !this.dragSourceColId) return;
    if (this.dragSourceColId === targetColId) return;

    // Retirer la card de la colonne source
    const srcCol = this.board.columns.find(
      (c) => c.id === this.dragSourceColId
    );
    if (!srcCol) return;
    srcCol.cards = srcCol.cards.filter((c) => c.id !== this.dragCard!.id);

    // L'ajouter dans la colonne cible
    const dstCol = this.board.columns.find((c) => c.id === targetColId);
    if (!dstCol) return;
    dstCol.cards.push(this.dragCard);

    this.dragCard = null;
    this.dragSourceColId = null;

    this.persist();
    this.render();
  }

  // ─── Actions colonnes ────────────────────────────────────────────────────────

  private async addColumn(): Promise<void> {
    const title = await this.promptInline("Nom de la colonne");
    if (!title) return;
    this.board.columns.push({
      id: this.store.generateId("col"),
      title,
      cards: [],
    });
    await this.persist();
    this.render();
  }

  private async deleteColumn(colId: string): Promise<void> {
    this.board.columns = this.board.columns.filter((c) => c.id !== colId);
    await this.persist();
    this.render();
  }

  private async editColumnTitle(
    el: HTMLElement,
    col: KanbanColumn
  ): Promise<void> {
    const input = document.createElement("input");
    input.type = "text";
    input.value = col.title;
    input.className = "mkb-inline-input";
    el.replaceWith(input);
    input.focus();

    const save = async () => {
      col.title = input.value.trim() || col.title;
      await this.persist();
      this.render();
    };
    input.addEventListener("blur", save);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") input.blur();
      if (e.key === "Escape") this.render();
    });
  }

  // ─── Actions cards ───────────────────────────────────────────────────────────

  private async addCard(colId: string): Promise<void> {
    const title = await this.promptInline("Titre de la carte");
    if (!title) return;

    const col = this.board.columns.find((c) => c.id === colId);
    if (!col) return;

    col.cards.push({
      id: this.store.generateId("card"),
      title,
      tags: [],
    });
    await this.persist();
    this.render();
  }

  private async deleteCard(cardId: string, colId: string): Promise<void> {
    const col = this.board.columns.find((c) => c.id === colId);
    if (!col) return;
    col.cards = col.cards.filter((c) => c.id !== cardId);
    await this.persist();
    this.render();
  }

  private async editCardTitle(
    el: HTMLElement,
    card: KanbanCard,
    colId: string
  ): Promise<void> {
    const input = document.createElement("input");
    input.type = "text";
    input.value = card.title;
    input.className = "mkb-inline-input";
    el.replaceWith(input);
    input.focus();

    const save = async () => {
      card.title = input.value.trim() || card.title;
      await this.persist();
      this.render();
    };
    input.addEventListener("blur", save);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") input.blur();
      if (e.key === "Escape") this.render();
    });
  }

  /**
   * Ouvre un modal simple pour éditer tous les champs d'une card.
   */
  private openCardEditor(card: KanbanCard, colId: string): void {
    // On crée un overlay minimaliste directement dans le container
    const overlay = this.container.createDiv("mkb-editor-overlay");

    const modal = overlay.createDiv("mkb-editor-modal");
    modal.createEl("h3", { text: "Éditer la carte" });

    const field = (label: string, value: string, onchange: (v: string) => void) => {
      const row = modal.createDiv("mkb-editor-row");
      row.createEl("label", { text: label });
      const input = row.createEl("input", { type: "text", value });
      input.addEventListener("input", () => onchange(input.value));
      return input;
    };

    field("Titre", card.title, (v) => (card.title = v));
    field("Lien note", card.noteLink ?? "", (v) => (card.noteLink = v || undefined));
    field("Due date (YYYY-MM-DD)", card.dueDate ?? "", (v) => (card.dueDate = v || undefined));
    field("Tags (virgule)", card.tags.join(", "), (v) => {
      card.tags = v.split(",").map((t) => t.trim()).filter(Boolean);
    });

    const btns = modal.createDiv("mkb-editor-btns");

    const saveBtn = btns.createEl("button", {
      text: "Enregistrer",
      cls: "mkb-btn mkb-btn-primary",
    });
    saveBtn.addEventListener("click", async () => {
      await this.persist();
      overlay.remove();
      this.render();
    });

    const cancelBtn = btns.createEl("button", {
      text: "Annuler",
      cls: "mkb-btn mkb-btn-secondary",
    });
    cancelBtn.addEventListener("click", () => {
      overlay.remove();
      this.render();
    });

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.remove();
        this.render();
      }
    });
  }

  // ─── Utils ───────────────────────────────────────────────────────────────────

  private async persist(): Promise<void> {
    await this.store.saveBoard(this.board);
  }

  /**
   * Prompt minimaliste inline dans le container (pas de window.prompt).
   */
  private promptInline(placeholder: string): Promise<string | null> {
    return new Promise((resolve) => {
      const overlay = this.container.createDiv("mkb-editor-overlay");
      const box = overlay.createDiv("mkb-prompt-box");
      const input = box.createEl("input", { type: "text", placeholder });
      input.className = "mkb-inline-input";
      input.focus();

      const confirm = () => {
        const val = input.value.trim();
        overlay.remove();
        resolve(val || null);
      };
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") confirm();
        if (e.key === "Escape") { overlay.remove(); resolve(null); }
      });
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) { overlay.remove(); resolve(null); }
      });
    });
  }
}
