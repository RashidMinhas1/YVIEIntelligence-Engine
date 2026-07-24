import { SceneMemoryState } from "../types/pipeline";

export class VisualMemoryManager {
  private memory: SceneMemoryState[] = [];

  constructor() {}

  public addScene(state: SceneMemoryState) {
    this.memory.push(state);
  }

  public getMemory(): SceneMemoryState[] {
    return this.memory;
  }

  public clear() {
    this.memory = [];
  }

  public getRecentConsecutiveCount(field: keyof SceneMemoryState, value: string): number {
    let count = 0;
    for (let i = this.memory.length - 1; i >= 0; i--) {
      if (this.memory[i][field] === value) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }

  public getTotalUses(field: keyof SceneMemoryState, value: string): number {
    return this.memory.filter((m) => m[field] === value).length;
  }
}
