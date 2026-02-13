import * as vscode from 'vscode';

export class SelectionManager {
  private selected: Set<string> = new Set();
  private _onDidChangeSelection = new vscode.EventEmitter<string[]>();
  readonly onDidChangeSelection = this._onDidChangeSelection.event;

  select(id: string): void {
    this.selected.add(id);
    this._onDidChangeSelection.fire(this.getSelected());
  }

  deselect(id: string): void {
    this.selected.delete(id);
    this._onDidChangeSelection.fire(this.getSelected());
  }

  toggle(id: string): void {
    if (this.selected.has(id)) {
      this.deselect(id);
    } else {
      this.select(id);
    }
  }

  selectRange(ids: string[]): void {
    ids.forEach(id => this.selected.add(id));
    this._onDidChangeSelection.fire(this.getSelected());
  }

  selectAll(ids: string[]): void {
    this.selected.clear();
    this.selectRange(ids);
  }

  clear(): void {
    this.selected.clear();
    this._onDidChangeSelection.fire([]);
  }

  getSelected(): string[] {
    return Array.from(this.selected);
  }

  hasSelection(): boolean {
    return this.selected.size > 0;
  }

  getCount(): number {
    return this.selected.size;
  }

  isSelected(id: string): boolean {
    return this.selected.has(id);
  }
}
