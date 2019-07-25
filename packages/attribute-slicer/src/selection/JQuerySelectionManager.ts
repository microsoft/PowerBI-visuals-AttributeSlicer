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

import { ISlicerItem, BaseSelection } from "../interfaces";
import {
	IBrushSelectionDelta,
	ISelectableItem,
	SelectionManager,
} from "./SelectionManager";
import { select } from "d3-selection";
import * as d3Selection from "d3-selection";
const EVENTS_NS: string = ".selection-manager";

/**
 * Defines a manager that maintains a set of selectable items, and specifically uses JQuery to pull it off
 */
export class JQuerySelectionManager<
	T extends ISelectableItem<ISlicerItem>
> extends SelectionManager<T> {
	private listEle: BaseSelection;
	private itemSelector: string;
	private eleItemGetter: (ele: BaseSelection) => T;
	private itemEleGetter: (item: T) => BaseSelection;

	/**
	 * Control brushing
	 */
	private lastMouseDownX: number;
	private lastMouseDownY: number;
	private mouseDownEle: BaseSelection;

	/**
	 * Will bind event listeners to the given set of elements
	 */
	public bindTo(
		listEle: BaseSelection,
		className: string,
		eleItemGetter: (ele: BaseSelection) => T,
		itemEleGetter: (item: T) => BaseSelection,
	): () => void {
		this.listEle = listEle;
		this.itemSelector = `.${className}`;
		this.eleItemGetter = eleItemGetter;
		this.itemEleGetter = itemEleGetter;

		listEle.on(`contextmenu${EVENTS_NS}`, () => this.endDrag());
		listEle.on(`selectstart${EVENTS_NS}`, () => false);
		listEle.on(`mouseenter${EVENTS_NS}`, () => {
			const e = d3Selection.event;
			e.stopPropagation();
			this.endDrag();
		});
		listEle.on(`mouseleave${EVENTS_NS}`, () => this.endDrag());
		listEle.on(`mousedown${EVENTS_NS}`, () => {
			const e = d3Selection.event;
			e.stopPropagation();
			this.keyPressed({ ctrl: e.ctrlKey, shift: e.shiftKey });
			const button: number = e.which || e["buttons"];
			if (button === 1) {
				// Only let the left mouse button start it
				let $target: BaseSelection = select(e.target);
				if (!$target.classed(className)) {
					let current = $target.node();
					while (current && current !== document.body) {
						if (select(current).classed("item")) {
							$target = select(current);
							break;
						}
						current = current.parentElement;
					}
				}
				if ($target.classed(className)) {
					this.mouseDownEle = $target;
					this.lastMouseDownX = e.clientX;
					this.lastMouseDownY = e.clientY;
				}
			}
		});
		listEle.on(`mouseup${EVENTS_NS}`, () => {
			const e = d3Selection.event;
			e.stopPropagation();
			this.keyPressed({ ctrl: e.ctrlKey, shift: e.shiftKey });
			this.lastMouseDownX = undefined;
			this.lastMouseDownY = undefined;
			if (this.internalDragging) {
				this.endDrag();
			}
		});
		listEle.on(`mousemove${EVENTS_NS}`, () => {
			const e = d3Selection.event;
			e.stopPropagation();
			const button: number = e.which || e["buttons"];
			// If the user moved more than 10 px in any direction with the mouse down
			if (button !== 1) {
				// No longer dragging
				this.endDrag();
			} else if (
				this.lastMouseDownX !== undefined &&
				(Math.abs(e.clientX - this.lastMouseDownX) >= 10 ||
					Math.abs(e.clientY - this.lastMouseDownY)) &&
				!this.internalDragging
			) {
				this.startDrag();

				// Add the item that we mouse downed on
				const item: T = this.eleItemGetter(this.mouseDownEle);
				if (item) {
					this.itemHovered(item);
				}
			}
		});

		this.refresh();

		// Return a function to unbind
		return (): void => {
			const u: undefined = undefined;
			listEle.on(EVENTS_NS, null);
			listEle.selectAll(this.itemSelector).on(EVENTS_NS, null);
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
	public destroy(): void {
		select(window).on(EVENTS_NS, null);
		if (this.listEle) {
			this.listEle
				.on(EVENTS_NS, null)
				.selectAll(this.itemSelector)
				.on(EVENTS_NS, null);
		}
	}

	/**
	 * OVERRIDES
	 */

	/**
	 * Indicate that we are starting to drag
	 */
	public startDrag(): void {
		super.startDrag();
		if (this.brushMode) {
			this.listEle
				.selectAll(this.itemSelector)
				.classed("selected-slicer-item", false);
		}
	}

	/**
	 * Indicates that we are ending a drag
	 */
	public endDrag(): void {
		const u: undefined = undefined;
		this.lastMouseDownX = u;
		this.lastMouseDownY = u;
		this.mouseDownEle = u;
		super.endDrag();
	}

	/**
	 * Refreshes the selection state for all of the item elements
	 */
	public refresh(): void {
		const that = this;
		if (this.listEle) {
			// "function" important here
			// This is necessary because we need both the this context from the
			// event listeners, and reference to this calss
			this.listEle
				.selectAll(this.itemSelector)
				.on(EVENTS_NS, null) // Remove all the other ones
				.on(`selectstart${EVENTS_NS}`, () => false)
				.on(`mouseenter${EVENTS_NS}`, () => {
					const e = d3Selection.event;
					e.stopPropagation();
					this.itemHovered(this.eleItemGetter(select(e.currentTarget)));
				})
				.on(`click${EVENTS_NS}`, () => {
					const e = d3Selection.event;
					e.stopPropagation();
					this.keyPressed({ ctrl: e.ctrlKey, shift: e.shiftKey });
					this.itemClicked(this.eleItemGetter(select(e.currentTarget)));
				})
				.each(function() {
					const item: T = that.eleItemGetter(select(<HTMLElement>this));

					// This says, if we are brushing, then show the brushing selection,
					// otherwise show the real selection
					const isItemSelected: boolean =
						that.findIndex(
							item,
							that.internalDragging && that.brushMode
								? that.internalBrushingSelection
								: that.selection,
						) >= 0;

					// Add the selected class if it is selected
					select(this).classed("selected-slicer-item", isItemSelected);
				});
		}
	}

	/**
	 * Override of itemHovered
	 */
	public itemHovered(item: T): IBrushSelectionDelta<T> {
		const delta: IBrushSelectionDelta<T> = super.itemHovered(item);
		if (this.itemEleGetter) {
			delta.removed.forEach((n: T) => {
				this.itemEleGetter(n).classed("selected-slicer-item", false);
			});
			delta.added.forEach((n: T) => {
				this.itemEleGetter(n).classed("selected-slicer-item", true);
			});
		}

		return delta;
	}

	/**
	 * Internal method for setting the selection
	 */
	protected setSelection(value: T[]): boolean {
		const changed: boolean = super.setSelection(value);
		if (changed) {
			this.refresh();
		}

		return changed;
	}
}
