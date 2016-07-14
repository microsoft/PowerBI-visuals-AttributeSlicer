/**
 * TODO:
 *  - Update the brushing code to not use the "selected" class, but a brushed class that has the same colors/look as the selection class.
 */
export default class SelectionManager<T extends ISelectableItem<any>> {
    /**
     * The current selection
     */
    protected _selectionDontUseDirectly: T[] = [];

    /**
     * The brushing selection, the selection that is occuring while the brushing is happening
     */
    protected _brushingSelection: T[] = [];

    /**
     * The current key state
     */
    protected keyState: IKeyState = {};

    /**
     * Whether or not the user is currently dragging
     */
    protected _dragging = false;

    /**
     * Whether or not we are currently in brush mode
     */
    protected _brushMode = false;

    /**
     * The list of all items
     */
    protected _items: T[];

    /**
     * The selection listener
     */
    private selectionListener: (items: T[]) => any;

    /**
     * The item (pivot point) which the user started shift selecting
     */
    private shiftPivot: T;

    /**
     * Constructor
     */
    constructor(onSelectionChanged?: (items: T[]) => any) {
        this.selectionListener = onSelectionChanged;
    }

    /**
     * Gets the set of items associated with this manager
     */
    public get items(): T[] {
        return this._items;
    }

    /**
     * Sets the current set of items
     */
    public set items(value: T[]) {
        this._items = value || [];
    }

    /**
     * Returns the current selection
     */
    public get selection(): T[] {
        return this._selectionDontUseDirectly;
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
    private _singleSelectDontUse = false;
    public get singleSelect() {
        return this._singleSelectDontUse;
    }

    /**
     * Setter for single select mode
     */
    public set singleSelect(value: boolean) {
        this._singleSelectDontUse = value;

        // Cheat, reset it, this forces a single item to be selected
        this.selection = this.selection.slice(0);
    }

    /**
     * Returns the brushing selection
     */
    public get brushingSelection(): T[] {
        return this._brushingSelection;
    }

    /**
     * Returns true if we are current dragging
     */
    public get dragging() {
        return this._dragging;
    }

    /**
     * Getter for brushMode
     */
    public get brushMode() {
        return this._brushMode;
    }

    /**
     * Setter for brush mode
     */
    public set brushMode(value: boolean) {
        this._brushMode = value;
    }

    /**
     * Indicates that an item was hovered over
     */
    public itemHovered(item: T) {
        if (this._dragging && this._brushMode && this.findIndex(item, this._brushingSelection) < 0) {
            this._brushingSelection.push(item);
        }
    }

    /**
     * Indicates that an item was clicked
     */
    public itemClicked(item: T) {
        // Toggles the selected item out of the selection
        const toggleItem = () => {
            const idx = this.findIndex(item);
            const newSel = this.selection.slice(0);
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
                const idx = this.findIndex(this.shiftPivot, this.items);
                const lastIdx = this.findIndex(item, this.items);

                // The selection is the range between the first and second indexes
                this.selection =
                    this.items.slice(
                        idx < lastIdx ? idx : lastIdx,
                        (idx < lastIdx ? lastIdx : idx) + 1);
            } else if (this._brushMode) {
                // The user just clicked on a single item in brush mode
                this.selection = [item];
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
    public keyPressed(state: IKeyState) {
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
    public startDrag() {
        this._dragging = true;
        this._brushingSelection = [];
    }

    /**
     * Indicates that we are ending a drag operation
     */
    public endDrag() {
        if (this._dragging) {
            this._dragging = false;
            if (this.brushMode) {
                this.selection = this._brushingSelection.slice(0);
            }
            this._brushingSelection = [];
        }
    }

    /**
     * Finds the given item in the list of selections
     */
    protected findIndex(item: T, list?: T[]): number {
        if (!list) {
            list = this.selection;
        }
        for (let i = 0; i < list.length; i++) {
            let toCompare = list[i];
            if (toCompare.equals(item)) {
                return i;
            }
        }
        return -1;
    }

    /**
     * Internal method for setting the selection
     */
    protected setSelection(value: T[]) {
        value = value || [];

        // We are single select, limit to one
        if (this.singleSelect && value.length) {
            value = [value[value.length - 1]];
        }

        this._selectionDontUseDirectly = value;

        if (this.selectionListener) {
            this.selectionListener(value);
        }
    }
}

/**
 * Represents an item that can be used with the selection manager
 */
export interface ISelectableItem<T> {
    equals: (otherItem: T) => boolean;
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
