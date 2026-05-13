import { App } from "obsidian";
import type { TaskStore, Task } from "../../shared/taskstore";

export class TodoStore
{
  constructor(private taskStore: TaskStore) {}

  //Get the tasks
  async getTasks(): Promise<Task[]>
  {
    return this.taskStore.getTasks({ source: "todo", archived: false });
  }

  async addTask(title: string): Promise<Task>
  {
    return this.taskStore.addTask(
    {
      id: this.taskStore.generateId("todo"),
      source: "todo",
      title,
      done: false,
      archived: false,
      priority: "normal",
      tags: [],
    });
  }

  async toggleTask(id: string, done: boolean): Promise<void>
  {
    await this.taskStore.updateTask(id, { done });
  }

  async deleteTask(id: string): Promise<void>
  {
    await this.taskStore.deleteTask(id);
  }
}