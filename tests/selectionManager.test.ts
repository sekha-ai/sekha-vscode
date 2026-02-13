import { describe, it, expect, beforeEach } from 'vitest';
import { SelectionManager } from '../src/selectionManager';

describe('SelectionManager', () => {
  let manager: SelectionManager;

  beforeEach(() => {
    manager = new SelectionManager();
  });

  it('should initialize with empty selection', () => {
    expect(manager.getSelected()).toEqual([]);
    expect(manager.isSelected('test-id')).toBe(false);
  });

  it('should select a single item', () => {
    manager.select('conv-1');
    
    expect(manager.isSelected('conv-1')).toBe(true);
    expect(manager.getSelected()).toContain('conv-1');
    expect(manager.getSelected().length).toBe(1);
  });

  it('should not duplicate selections', () => {
    manager.select('conv-1');
    manager.select('conv-1');
    
    expect(manager.getSelected().length).toBe(1);
  });

  it('should select multiple items', () => {
    manager.select('conv-1');
    manager.select('conv-2');
    manager.select('conv-3');
    
    expect(manager.getSelected()).toEqual(['conv-1', 'conv-2', 'conv-3']);
  });

  it('should deselect an item', () => {
    manager.select('conv-1');
    manager.select('conv-2');
    
    manager.deselect('conv-1');
    
    expect(manager.isSelected('conv-1')).toBe(false);
    expect(manager.isSelected('conv-2')).toBe(true);
    expect(manager.getSelected()).toEqual(['conv-2']);
  });

  it('should toggle selection', () => {
    manager.toggle('conv-1');
    expect(manager.isSelected('conv-1')).toBe(true);
    
    manager.toggle('conv-1');
    expect(manager.isSelected('conv-1')).toBe(false);
  });

  it('should select all from array', () => {
    const ids = ['conv-1', 'conv-2', 'conv-3', 'conv-4'];
    manager.selectAll(ids);
    
    expect(manager.getSelected().length).toBe(4);
    ids.forEach(id => {
      expect(manager.isSelected(id)).toBe(true);
    });
  });

  it('should select range of items', () => {
    const range = ['conv-5', 'conv-6', 'conv-7'];
    manager.selectRange(range);
    
    expect(manager.getSelected()).toEqual(range);
  });

  it('should clear all selections', () => {
    manager.select('conv-1');
    manager.select('conv-2');
    manager.select('conv-3');
    
    manager.clear();
    
    expect(manager.getSelected()).toEqual([]);
    expect(manager.isSelected('conv-1')).toBe(false);
  });

  it('should emit change events on select', () => {
    let emittedSelection: string[] = [];
    
    manager.onDidChangeSelection((selected) => {
      emittedSelection = selected;
    });
    
    manager.select('conv-1');
    
    expect(emittedSelection).toEqual(['conv-1']);
  });

  it('should emit change events on deselect', () => {
    let emittedSelection: string[] = [];
    
    manager.select('conv-1');
    manager.select('conv-2');
    
    manager.onDidChangeSelection((selected) => {
      emittedSelection = selected;
    });
    
    manager.deselect('conv-1');
    
    expect(emittedSelection).toEqual(['conv-2']);
  });

  it('should emit change events on clear', () => {
    let emittedSelection: string[] = [];
    
    manager.select('conv-1');
    
    manager.onDidChangeSelection((selected) => {
      emittedSelection = selected;
    });
    
    manager.clear();
    
    expect(emittedSelection).toEqual([]);
  });

  it('should handle multiple subscribers', () => {
    const results: string[][] = [];
    
    manager.onDidChangeSelection((s) => results.push([...s]));
    manager.onDidChangeSelection((s) => results.push([...s]));
    
    manager.select('conv-1');
    
    expect(results.length).toBe(2);
    expect(results[0]).toEqual(['conv-1']);
    expect(results[1]).toEqual(['conv-1']);
  });
});
