import { default as SelectionManager, ISelectableItem } from "./SelectionManager";
const EVENTS_NS = ".selection-manager";
export default class JQuerySelectionManager<T extends ISelectableItem<any>> extends SelectionManager<T> {

    private listEle: JQuery;
    private itemSelector: string;
    private eleItemGetter: (ele: JQuery) => T;
    private itemEleGetter: (item: T) => JQuery;

    /**
     * Constructor
     */
    constructor(onSelectionChanged?: (items: T[]) => any) {
        super(onSelectionChanged);

        const updateKeyState = (e: JQueryEventObject) => {
            this.keyPressed({
                ctrl: e.ctrlKey,
                shift: e.shiftKey,
            });
        };

        $(window)
            .on(`keydown${EVENTS_NS}`, updateKeyState)
            .on(`keyup${EVENTS_NS}`, updateKeyState)
            .on(`focus${EVENTS_NS}`, updateKeyState)
            .on(`blur${EVENTS_NS}`, updateKeyState);
    }

    /**
     * Will bind event listeners to the given set of elements
     */
    public bindTo(listEle: JQuery, itemEleSelector: string, eleItemGetter: (ele: JQuery) => T, itemEleGetter: (item: T) => JQuery) {
        this.listEle = listEle;
        this.itemSelector = itemEleSelector;
        this.eleItemGetter = eleItemGetter;
        this.itemEleGetter = itemEleGetter;

        listEle.on(`mouseleave${EVENTS_NS}`, () => this.endDrag());

        let lastMouseDownX: number;
        let lastMouseDownY: number;
        let mouseDownEle: JQuery;
        listEle.on(`mousedown${EVENTS_NS}`, (e) => {
            e.stopPropagation();
            let $target = $(e.target);
            if (!$target.is(itemEleSelector)) {
                $target = $target.parents(".item");
            }
            if ($target.is(itemEleSelector)) {
                mouseDownEle = $target;
                lastMouseDownX = e.clientX;
                lastMouseDownY = e.clientY;
            }
        });
        listEle.on(`mouseup${EVENTS_NS}`, (e) => {
            e.stopPropagation();
            lastMouseDownX = undefined;
            lastMouseDownY = undefined;
            if (this._dragging) {
                this.endDrag();
            }
        });
        listEle.on(`mousemove${EVENTS_NS}`, (e) => {
            e.stopPropagation();
            // If the user moved more than 10 px in any direction with the mouse down
            if (typeof lastMouseDownX !== "undefined" &&
                (Math.abs(e.clientX - lastMouseDownX) >= 10 ||
                 Math.abs(e.clientY - lastMouseDownY)) &&
                 !this._dragging) {
                this.startDrag();

                // Add the item that we mouse downed on
                const item = this.eleItemGetter(mouseDownEle);
                if (item) {
                    this.itemHovered(item);
                }
            }
        });

        this.refresh();

        // Return a function to unbind
        return () => {
            listEle.off(EVENTS_NS);
            listEle.find(itemEleSelector).off(EVENTS_NS);
            delete this.listEle;
            delete this.itemSelector;
            delete this.eleItemGetter;
        };
    }

    /**
     * Destroys
     */
    public destroy() {
        $(window).off(EVENTS_NS);
        if (this.listEle) {
            this.listEle
                .off(EVENTS_NS)
                .find(this.itemSelector)
                .off(EVENTS_NS);
        }
    }

    /** 
     * OVERRIDES 
     */

    /**
     * Indicate that we are starting to drag
     */
    public startDrag() {
        super.startDrag();
        if (this.brushMode) {
            this.listEle.find(this.itemSelector).removeClass("selected-slicer-item");
        }
    }

    /**
     * Refreshes the selection state for all of the item elements
     */
    public refresh() {
        if (this.listEle) {
            // "function" important here
            const that = this;
            this.listEle.find(this.itemSelector)
                .off(EVENTS_NS) // Remove all the other ones
                .on(`mouseenter${EVENTS_NS}`, function(e) {
                    e.stopPropagation();
                    that.itemHovered(that.eleItemGetter($(this)));
                })
                .on(`click${EVENTS_NS}`, function (e) {
                    e.stopPropagation();
                    that.itemClicked(that.eleItemGetter($(this)));
                })
                .each((idx, ele) => {
                    const item = this.eleItemGetter($(ele));

                    // This says, if we are brushing, then show the brushing selection, otherwise show the real selection
                    const isItemSelected =
                        this.findIndex(item, this._dragging && this.brushMode ? this._brushingSelection : this.selection) >= 0;

                    // Add the selected class if it is selected
                    $(ele).toggleClass("selected-slicer-item", isItemSelected);
                });
        }
    }

    /**
     * Override of itemHovered
     */
    public itemHovered(item: T) {
        super.itemHovered(item);
        if (this.itemEleGetter) {
            this._brushingSelection.forEach(n => {
                $(this.itemEleGetter(n)).addClass("selected-slicer-item");
            });
        }
    }

    /**
     * Internal method for setting the selection
     */
    protected setSelection(value: T[]) {
        super.setSelection(value);
        this.refresh();
    }
}
