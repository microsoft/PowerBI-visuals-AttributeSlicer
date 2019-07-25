/**
 * The MIT License (MIT)
 *
 * Copyright (C) 2013 Sergi Mansilla
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the 'Software'), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import lodashDebounce from "lodash.debounce";
import { Selection, create } from "d3-selection";
import * as d3Selection from "d3-selection";
import { BaseSelection } from "../interfaces";

interface IConfiguration {
	w?: number;
	h?: number;
	itemHeight: number;
	generatorFn?(idx: number): HTMLElement;
	afterRender?(): unknown;
}

/**
 * Creates a virtually-rendered scrollable list.
 */
export class VirtualList {
	public container: BaseSelection;
	public items: unknown[] = [];
	public rerender: Function = lodashDebounce(() => {
		const first: number =
			Math.floor(this.container.node()[this.scrollProp] / this.itemHeight) -
			this.screenItemsLen;
		this.renderChunk(this.listContainer, first < 0 ? 0 : first);
		this.lastScrolled = 0;
	}, 100);

	public itemHeight: number;
	private listContainer: BaseSelection;
	private scroller: BaseSelection;
	private cleanTimeout: NodeJS.Timer;
	private lastScrolled?: number;
	private totalRows: number;
	private horiz: boolean = false;
	private scrollProp: "scrollTop" | "scrollLeft" = "scrollTop";
	private lastRepaintPos?: number;
	private maxBuffer: number;
	private screenItemsLen: number;
	private cachedItemsLen: number;
	private destroyed = false;
	private renderChunkDebounced: (
		element: BaseSelection,
		idx: number,
	) => void = lodashDebounce(
		(element: BaseSelection, idx: number) => this.renderChunk(element, idx),
		50,
	);

	private generatorFn?: (idx: number) => HTMLElement;
	private afterRender?: () => unknown;

	constructor(config: IConfiguration) {
		const width: string = (config && `${config.w}px`) || "100%";
		const height: string = (config && `${config.h}px`) || "100%";
		this.itemHeight = config.itemHeight;
		this.listContainer = create("div").classed("list-display", true);
		this.scroller = VirtualList.createScroller(0);
		this.container = VirtualList.createContainer(width, height);
		this.container.append(() => this.listContainer.node());
		this.container.append(() => this.scroller.node());
		this.generatorFn = config.generatorFn;
		this.afterRender = config.afterRender;

		// As soon as scrolling has stopped, this interval asynchronouslyremoves all
		// the nodes that are not used anymore
		const cleanNodes = () => {
			if (!this.destroyed) {
				if (Date.now() - this.lastScrolled > 100) {
					const badNodes = this.container.selectAll("[data-rm]");
					if (badNodes.size()) {
						badNodes.remove();
					}
				}
				this.cleanTimeout = setTimeout(cleanNodes, 300);
			}
		};
		this.cleanTimeout = setTimeout(cleanNodes, 300);

		this.container.on("scroll.virtual-list", () => {
			const scrollPos: number = d3Selection.event.target[this.scrollProp]; // Triggers reflow
			if (
				!this.lastRepaintPos ||
				Math.abs(scrollPos - this.lastRepaintPos) > this.maxBuffer
			) {
				const first: number =
					Math.floor(scrollPos / this.itemHeight) - this.screenItemsLen;
				this.renderChunk(this.listContainer, first < 0 ? 0 : first);
				this.lastRepaintPos = scrollPos;
			}

			this.lastScrolled = Date.now();

			if (d3Selection.event.preventDefault) {
				d3Selection.event.preventDefault();
			}
		});
	}

	private static createContainer(w: string, h: string): BaseSelection {
		return create("div")
			.classed("virtual-list", true)
			.attr(
				"style",
				`width:100%;height:100%;overflow:hidden;overflow-y:auto;position:relative;padding:0`,
			);
	}

	private static createScroller(h: number): BaseSelection {
		return create("div")
			.classed("vlist-scroller", true)
			.attr(
				"style",
				`opacity:0;position:absolute;top:0;left:0;width:1px;height:${h}px;`,
			);
	}
	public setHeight(height: number): void {
		this.container.style("height", `${height}px`);
		const screenItemsLen: number = (this.screenItemsLen = Math.ceil(
			(this.horiz ? this.getContainerWidth() : height) / this.itemHeight,
		));
		// Cache 4 times the number of items that fit in the container viewport
		this.cachedItemsLen = screenItemsLen * 3;
		this.maxBuffer = screenItemsLen * this.itemHeight;

		this.lastRepaintPos = undefined;
		if (this.items) {
			const first: number =
				Math.floor(this.container.node()[this.scrollProp] / this.itemHeight) -
				this.screenItemsLen;
			this.renderChunkDebounced(this.listContainer, first < 0 ? 0 : first);
		}
	}

	public setItemHeight(itemHeight: number): void {
		this.itemHeight = itemHeight;
		this.screenItemsLen = Math.ceil(
			(this.horiz ? this.getContainerWidth() : this.getContainerHeight()) /
				this.itemHeight,
		);
		// Cache 4 times the number of items that fit in the container viewport
		this.cachedItemsLen = this.screenItemsLen * 3;
		this.maxBuffer = this.screenItemsLen * this.itemHeight;
		this.scroller.style(
			this.horiz ? "width" : "height",
			`${this.itemHeight * this.totalRows}px`,
		);

		this.lastRepaintPos = undefined;
		if (this.items) {
			const first: number =
				Math.floor(this.container.node()[this.scrollProp] / this.itemHeight) -
				this.screenItemsLen;
			this.renderChunkDebounced(this.listContainer, first < 0 ? 0 : first);
		}
	}

	public destroy() {
		this.destroyed = true;
		if (this.cleanTimeout) {
			clearTimeout(this.cleanTimeout);
			delete this.cleanTimeout;
		}
	}

	public setItems(items: unknown[]): void {
		this.items = items;
		this.totalRows = items && items.length;
		this.scroller.style(
			this.horiz ? "width" : "height",
			`${this.itemHeight * this.totalRows}px`,
		);
		this.lastRepaintPos = undefined;
		this.lastScrolled = 0;
		this.renderChunkDebounced(this.listContainer, 0);
	}

	public setDir(horiz: boolean): void {
		const size: number = this.itemHeight * this.totalRows;
		const height: number = this.getContainerHeight();
		const width: number = this.getContainerWidth();
		this.horiz = horiz;
		if (horiz) {
			this.scrollProp = "scrollLeft";
			this.scroller.style("width", `${size}px`).style("height", "1px");
			this.listContainer
				.style("transform", `rotate(-90deg) translateX(-${height - 5}px)`)
				.style("transform-origin", "0px 0px")
				.style("height", `${width}px`)
				.style("width", `${height}px`);
			this.container
				.style("overflow-x", "auto")
				.style("overflow-y", "hidden")
				.node().scrollTop = 0;
		} else {
			this.scrollProp = "scrollTop";
			this.scroller.style("width", "1px").style("height", `${size}px`);
			this.listContainer
				.style("transform", null)
				.style("transform-origin", null)
				.style("width", `${width}px`)
				.style("height", `${height}px`);
			this.container
				.style("overflow-x", "hidden")
				.style("overflow-y", "auto")
				.node().scrollLeft = 0;
		}

		const screenItemsLen: number = (this.screenItemsLen = Math.ceil(
			(this.horiz ? width : height) / this.itemHeight,
		));
		// Cache 4 times the number of items that fit in the container viewport
		this.cachedItemsLen = screenItemsLen * 3;
		this.maxBuffer = screenItemsLen * this.itemHeight;
		this.lastRepaintPos = undefined;
		if (this.items) {
			const first: number =
				Math.floor(this.container.node()[this.scrollProp] / this.itemHeight) -
				this.screenItemsLen;
			this.renderChunkDebounced(this.listContainer, first < 0 ? 0 : first);
		}
	}

	private getContainerHeight(): number {
		return parseFloat(this.container.style("height").replace("px", ""));
	}

	private getContainerWidth(): number {
		return parseFloat(this.container.style("width").replace("px", ""));
	}

	/**
	 * Renders a particular, consecutive chunk of the total rows in the list. To
	 * keep acceleration while scrolling, we mark the nodes that are candidate for
	 * deletion instead of deleting them right away, which would suddenly stop the
	 * acceleration. We delete them once scrolling has finished.
	 *
	 * @param {Node} node Parent node where we want to append the children chunk.
	 * @param {Number} startPos Starting position, i.e. first children index.
	 * @return {void}
	 */
	private renderChunk(nodeSel: BaseSelection, startPos: number): void {
		let finalItem: number = startPos + this.cachedItemsLen;
		if (finalItem > this.totalRows) {
			finalItem = this.totalRows;
		}

		// Append all the new rows in a document fragment that we will later append to
		// the parent node
		const fragment: BaseSelection = create("div");
		for (
			let i: number = startPos;
			i < finalItem && i < this.totalRows;
			i += 1
		) {
			fragment.append(() => this.createRow(i));
		}

		const node = nodeSel.node();
		// Hide and mark obsolete nodes for deletion.
		const len: number = node.childNodes.length;
		for (let j: number = 0; j < len; j += 1) {
			(<HTMLElement>node.childNodes[j]).style.display = "none";
			(<HTMLElement>node.childNodes[j]).setAttribute("data-rm", "1");
		}

		node.appendChild(fragment.node());
		if (this.afterRender) {
			this.afterRender();
		}
	}

	private createRow(i: number): HTMLElement {
		let item: HTMLElement;
		if (this.generatorFn) {
			item = this.generatorFn(i);
		} else if (this.items) {
			if (typeof this.items[i] === "string") {
				const itemText: Text = document.createTextNode(<string>this.items[i]);
				item = document.createElement("div");
				item.style.height = `${this.itemHeight}px`;
				item.appendChild(itemText);
			} else {
				item = <HTMLElement>this.items[i];
			}
		}

		if (item) {
			item.classList.add("vrow");
			item.style.position = "absolute";
			item.style.top = `${i * this.itemHeight}px`;
		}

		return item;
	}
}
