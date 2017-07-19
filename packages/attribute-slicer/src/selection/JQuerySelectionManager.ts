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

import { default as SelectionManager, ISelectableItem, BrushSelectionDelta } from "./SelectionManager";
import * as $ from "jquery";
const EVENTS_NS = ".selection-manager";
export default class JQuerySelectionManager<T extends ISelectableItem<any>> extends SelectionManager<T> {

    private listEle: JQuery;
    private itemSelector: string;
    private eleItemGetter: (ele: JQuery) => T;
    private itemEleGetter: (item: T) => JQuery;

    /**
     * Control brushing
     */
    private lastMouseDownX: number;
    private lastMouseDownY: number;
    private mouseDownEle: JQuery;


    /**
     * Will bind event listeners to the given set of elements
     */
    public bindTo(listEle: JQuery, itemEleSelector: string, eleItemGetter: (ele: JQuery) => T, itemEleGetter: (item: T) => JQuery) {
        this.listEle = listEle;
        this.itemSelector = itemEleSelector;
        this.eleItemGetter = eleItemGetter;
        this.itemEleGetter = itemEleGetter;

        listEle.on(`contextmenu${EVENTS_NS}`, (e) => this.endDrag());
        listEle.on(`selectstart${EVENTS_NS}`, (e) => false);
        listEle.on(`mouseenter${EVENTS_NS}`, (e) => {
            e.stopPropagation();
            this.endDrag();
        });
        listEle.on(`mouseleave${EVENTS_NS}`, () => this.endDrag());
        listEle.on(`mousedown${EVENTS_NS}`, (e) => {
            e.stopPropagation();
            this.keyPressed({ctrl: e.ctrlKey, shift: e.shiftKey});
            const button = e.which || e["buttons"];
            if (button === 1) { // Only let the left mouse button start it
                let $target = $(e.target);
                if (!$target.is(itemEleSelector)) {
                    $target = $target.parents(".item");
                }
                if ($target.is(itemEleSelector)) {
                    this.mouseDownEle = $target;
                    this.lastMouseDownX = e.clientX;
                    this.lastMouseDownY = e.clientY;
                }
            }
        });
        listEle.on(`mouseup${EVENTS_NS}`, (e) => {
            e.stopPropagation();
            this.keyPressed({ctrl: e.ctrlKey, shift: e.shiftKey});
            this.lastMouseDownX = undefined;
            this.lastMouseDownY = undefined;
            if (this._dragging) {
                this.endDrag();
            }
        });
        listEle.on(`mousemove${EVENTS_NS}`, (e) => {
            e.stopPropagation();
            const button = e.which || e["buttons"];
            // If the user moved more than 10 px in any direction with the mouse down
            if (button !== 1) { // No longer dragging
                this.endDrag();
            } else if (typeof this.lastMouseDownX !== "undefined" &&
                (Math.abs(e.clientX - this.lastMouseDownX) >= 10 ||
                 Math.abs(e.clientY - this.lastMouseDownY)) &&
                 !this._dragging) {
                this.startDrag();

                // Add the item that we mouse downed on
                const item = this.eleItemGetter(this.mouseDownEle);
                if (item) {
                    this.itemHovered(item);
                }
            }
        });

        this.refresh();

        // Return a function to unbind
        return () => {
            let u: any;
            listEle.off(EVENTS_NS);
            listEle.find(itemEleSelector).off(EVENTS_NS);
            this.listEle = u;
            this.itemSelector = u;
            this.eleItemGetter = u;
            this.lastMouseDownX = u;
            this.lastMouseDownY = u;
            this.mouseDownEle = u;
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
     * Indicates that we are ending a drag
     */
    public endDrag() {
        let u: any;
        this.lastMouseDownX = u;
        this.lastMouseDownY = u;
        this.mouseDownEle = u;
        super.endDrag();
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
                .on(`selectstart${EVENTS_NS}`, (e) => false)
                .on(`mouseenter${EVENTS_NS}`, function(e) {
                    e.stopPropagation();
                    that.itemHovered(that.eleItemGetter($(this)));
                })
                .on(`click${EVENTS_NS}`, function (e) {
                    e.stopPropagation();
                    that.keyPressed({ctrl: e.ctrlKey, shift: e.shiftKey});
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
        let delta: BrushSelectionDelta<T> = super.itemHovered(item);
        if (this.itemEleGetter) {
            delta.removed.forEach(n => {
                $(this.itemEleGetter(n)).removeClass("selected-slicer-item");
            });
            delta.added.forEach(n => {
                $(this.itemEleGetter(n)).addClass("selected-slicer-item");
            });
        }
        return delta;
    }

    /**
     * Internal method for setting the selection
     */
    protected setSelection(value: T[]) {
        super.setSelection(value);
        this.refresh();
    }
}
