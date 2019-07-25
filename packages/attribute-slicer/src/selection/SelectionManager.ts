/*
 * Copyright (c) Microsoft
 * All rights reserved.
 * MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

export class SelectionManager<T extends ISelectableItem<any>> {
	/**
	 * The current selection
	 */
	protected internalSelectionDontUseDirectly: T[] = [];

	/**
	 * The brushing selection, the selection that is occuring while the brushing is happening
	 */
	protected internalBrushingSelection: T[] = [];

	/**
	 * The current key state
	 */
	protected keyState: IKeyState = {};

	/**
	 * Whether or not the user is currently dragging
	 */
	protected internalDragging: boolean = false;

	/**
	 * Whether or not we are currently in brush mode
	 */
	protected internalBrushMode: boolean = false;

	/**
	 * The list of all items
	 */
	protected internalItems: T[];

	private selectionListener: (items: T[]) => unknown;

	/**
	 * The item (pivot point) which the user started shift selecting
	 */
	private shiftPivot: T;

	/**
	 * The most recent item selected via brush selection
	 */
	private internalPreviousBrushedItem: T;

	private internalSingleSelectDontUse: boolean = false;

	/**
	 * Constructor
	 */
	constructor(onSelectionChanged?: (items: T[]) => unknown) {
		this.selectionListener = onSelectionChanged;
	}

	/**
	 * Gets the set of items associated with this manager
	 */
	public get items(): T[] {
		return this.internalItems;
	}

	/**
	 * Sets the current set of items
	 */
	public set items(value: T[]) {
		this.internalItems = value || [];
	}

	/**
	 * Returns the current selection
	 */
	public get selection(): T[] {
		return this.internalSelectionDontUseDirectly;
	}

	/**
	 * Setter for selection
	 */
	public set selection(value: T[]) {
		this.setSelection(value);
	}

	/**
	 * Setter for single select mode
	 */
	public get singleSelect(): boolean {
		return this.internalSingleSelectDontUse;
	}

	/**
	 * Setter for single select mode
	 */
	public set singleSelect(value: boolean) {
		this.internalSingleSelectDontUse = value;

		// Cheat, reset it, this forces a single item to be selected
		this.selection = this.selection.slice(0);
	}

	/**
	 * Returns the brushing selection
	 */
	public get brushingSelection(): T[] {
		return this.internalBrushingSelection;
	}

	/**
	 * Returns true if we are current dragging
	 */
	public get dragging(): boolean {
		return this.internalDragging;
	}

	/**
	 * Getter for brushMode
	 */
	public get brushMode(): boolean {
		return this.internalBrushMode;
	}

	/**
	 * Setter for brush mode
	 */
	public set brushMode(value: boolean) {
		this.internalBrushMode = value;
	}

	/**
	 * Indicates that an item was hovered over
	 * @returns IBrushSelectionDelta
	 */
	public itemHovered(item: T): IBrushSelectionDelta<T> {
		const delta: IBrushSelectionDelta<T> = { added: [], removed: [] };
		if (this.internalDragging && this.internalBrushMode) {
			if (
				this.internalBrushingSelection.length >= 1 &&
				this.items &&
				this.items.length
			) {
				let lowIndex: number;
				let highIndex: number;
				const newSel: T[] = this.internalBrushingSelection.slice(0);

				if (this.findIndex(item, newSel) > -1) {
					// remove item if dragging back
					newSel.splice(newSel.indexOf(this.internalPreviousBrushedItem), 1);
					delta.removed.push(this.internalPreviousBrushedItem);
				} else {
					// add the item to selection list
					newSel.push(item);
					delta.added.push(item);
				}

				newSel.forEach((n: T) => {
					const currIndex: number = this.internalItems.indexOf(n);
					if (lowIndex === undefined || currIndex < lowIndex) {
						lowIndex = currIndex;
					}
					if (highIndex === undefined || currIndex > highIndex) {
						highIndex = currIndex;
					}
				});

				this.internalBrushingSelection = this.items.slice(
					lowIndex,
					highIndex + 1,
				);
			} else if (this.findIndex(item, this.internalBrushingSelection) < 0) {
				this.internalBrushingSelection.push(item);
				delta.added.push(item);
			}
			this.internalPreviousBrushedItem = item;
		}

		return delta;
	}

	/**
	 * Indicates that an item was clicked
	 */
	public itemClicked(item: T): void {
		// Toggles the selected item out of the selection
		const toggleItem: Function = (): void => {
			const idx: number = this.findIndex(item);
			const newSel: T[] = this.selection.slice(0);
			if (idx < 0) {
				newSel.push(item);
			} else {
				newSel.splice(idx, 1);
			}
			this.selection = newSel;
		};

		if (!this.keyState.ctrl) {
			// If the user just selected the first item
			if (this.keyState.shift && !this.shiftPivot) {
				this.shiftPivot = item;
			}
			if (this.keyState.shift && this.items && this.items.length) {
				const idx: number = this.findIndex(this.shiftPivot, this.items);
				const lastIdx: number = this.findIndex(item, this.items);

				// The selection is the range between the first and second indexes
				this.selection = this.items.slice(
					idx < lastIdx ? idx : lastIdx,
					(idx < lastIdx ? lastIdx : idx) + 1,
				);
			} else if (this.internalBrushMode) {
				// If the user is in "brush" mode, but just single clicks an item,
				// then just deselect it, otherwise set the item
				this.selection =
					this.selection.length === 1 && this.selection[0].id === item.id
						? []
						: [item];
			} else {
				toggleItem();
			}
		} else {
			toggleItem();
		}
	}

	/**
	 * Lets the selection manager that a key was pressed
	 */
	public keyPressed(state: IKeyState): void {
		this.keyState.ctrl = state.ctrl;
		if (this.keyState.shift !== state.shift) {
			// User started pressing shift
			if (state.shift) {
				this.shiftPivot = this.selection[this.selection.length - 1];
			} else {
				delete this.shiftPivot;
			}
			this.keyState.shift = state.shift;
		}
	}

	/**
	 * Indicates that we are starting to drag
	 */
	public startDrag(): void {
		this.internalDragging = true;
		this.internalBrushingSelection = [];
	}

	/**
	 * Indicates that we are ending a drag operation
	 */
	public endDrag(): void {
		if (this.internalDragging) {
			this.internalDragging = false;
			if (this.brushMode) {
				if (this.keyState.ctrl) {
					this.internalBrushingSelection = [
						...this.internalBrushingSelection,
						...this.selection,
					];
				}
				this.selection = this.internalBrushingSelection.slice(0);
			}
			this.internalBrushingSelection = [];
		}
	}

	/**
	 * Finds the given item in the list of selections
	 */
	protected findIndex(item: T, list?: T[]): number {
		if (!list) {
			list = this.selection;
		}
		for (let i: number = 0; i < list.length; i += 1) {
			const toCompare: T = list[i];
			if (toCompare.id === item.id) {
				return i;
			}
		}

		return -1;
	}

	/**
	 * Internal method for setting the selection
	 */
	protected setSelection(value: T[]): boolean {
		value = value || [];

		// We are single select, limit to one
		if (this.singleSelect && value.length) {
			value = [value[value.length - 1]];
		}

		const oldSelection: T[] = this.selection || [];
		const newSelection: T[] = value;

		// Are there any selected items which do not appear in the new selection
		let hasChanged: boolean =
			oldSelection.filter(
				(n: T) => newSelection.filter((m: T) => n.id === m.id).length === 0,
			).length > 0;

		// Are there any selected items which do not appear in the old selection
		hasChanged =
			hasChanged ||
			newSelection.filter(
				(n: T) => oldSelection.filter((m: T) => n.id === m.id).length === 0,
			).length > 0;

		if (hasChanged) {
			this.internalSelectionDontUseDirectly = value;
			if (this.selectionListener) {
				this.selectionListener(value);
			}

			return true;
		}

		return false;
	}
}

/**
 * Represents an item that can be used with the selection manager
 */
export interface ISelectableItem<T> {
	id: string;
}

export interface IKeyState {
	/**
	 * If ctrl is being held down
	 */
	ctrl?: boolean;

	/**
	 * If shift is being pressed
	 */
	shift?: boolean;
}

export interface IBrushSelectionDelta<T> {
	/**
	 * Items added to the brush selection
	 */
	added: T[];

	/**
	 * Items removed from the brush selection
	 */
	removed: T[];
}
