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

import {
	DEFAULT_STATE,
	DEFAULT_TEXT_SIZE,
	DEFAULT_VALUE_WIDTH,
	SEARCH_DEBOUNCE,
} from "./AttributeSlicer.defaults";
import { EventEmitter } from "./base/EventEmitter";
import {
	IAttributeSlicerState,
	IItemReference,
	ISlicerItem,
	BaseSelection,
} from "./interfaces";
import { VirtualList } from "./lib/VirtualList";
import { JQuerySelectionManager } from "./selection/JQuerySelectionManager";
import { slicerItemTemplate } from "./slicerItemTemplate";
import { prettyPrintValue as pretty, html, toggleElement } from "./Utils";
import lodashClonedeep from "lodash.clonedeep";
import lodashDebounce from "lodash.debounce";
import lodashGet from "lodash.get";
import lodashMerge from "lodash.merge";
import { select, create } from "d3-selection";
import * as d3Selection from "d3-selection";

interface IDimensions {
	width: number;
	height: number;
}

const naturalSort: (
	a: unknown,
	b: unknown,
) => number = require("javascript-natural-sort");

/**
 * Represents an advanced slicer to help slice through data
 */
export class AttributeSlicer {
	/**
	 * The selection manager to use
	 */
	private selectionManager: JQuerySelectionManager<IItemReference>;

	/**
	 * The slicer element
	 */
	private slicerEle: BaseSelection;

	/**
	 * The actual list element
	 */
	private listEle: BaseSelection;

	/**
	 * The clearAll element
	 */
	private clearAllEle: BaseSelection;

	/**
	 * The check all button
	 */
	private checkAllEle: BaseSelection;

	/**
	 * Our container element
	 */
	private element: BaseSelection;

	/**
	 * The data contained in this slicer
	 */
	private internalData: ISlicerItem[] = [];

	private internalEventEmitter: EventEmitter = new EventEmitter();

	/**
	 * Container for the selections
	 */
	private selectionsEle: BaseSelection;

	/**
	 * Stores the currently loading promise
	 */
	private loadPromise: PromiseLike<undefined | ISlicerItem[] | void> & {
		cancel?: boolean;
	};

	/**
	 * Whether or not we are loading the search box
	 */
	private loadingSearch: boolean = false;

	private virtualList: VirtualList;

	/**
	 * The virtual list element
	 */
	private virtualListEle: BaseSelection;

	/**
	 * Whether or not we are currently loading a state
	 */
	private loadingState: boolean = false;

	/**
	 * The number of milliseconds before running the search, after a user stops typing
	 */
	private searchDebounce: number = SEARCH_DEBOUNCE;

	/**
	 * Whether this component has been destroyed
	 */
	private destroyed: boolean = false;

	private internalItemTextColor: string = "#000";
	private internalLeftAlignText: boolean = false;
	private internalDisplayValueLables: boolean = false;
	private internalOverflowValueLabels: boolean = false;
	private internalShowOptions: boolean = true;
	private internalShowSearchBox: boolean = true;
	private internalServerSideSearch: boolean = true;
	private internalCaseInsentitive: boolean = true;
	private internalRenderHorizontal: boolean = false;
	private internalDimensions?: IDimensions;
	private internalValueWidthPercentage: number = DEFAULT_VALUE_WIDTH;
	private internalShowValues: boolean = false;
	private internalShowSelections: boolean = true;
	private internalFontSize: number = DEFAULT_TEXT_SIZE;
	private internalSearchString: string = "";
	private internalLoadingMoreData: boolean = false; // don't use this directly

	/**
	 * Updates the list height
	 */
	private updateListHeight: () => void = lodashDebounce(() => {
		if (!this.destroyed && this.dimensions) {
			const optionsHeight = (<HTMLElement>(
				this.element.select(".slicer-options").node()
			)).getBoundingClientRect().height;
			const height: number = this.dimensions.height - optionsHeight - 2;
			this.listEle.style("width", "100%");
			this.listEle.style("height", `${height}px`);
			// .attr("dir", dir);
			this.virtualList.setHeight(height);
			this.virtualList.setDir(this.renderHorizontal);
		}
	}, 50);

	private toggleLoadingClass: Function = lodashDebounce(() => {
		this.element.classed("loading", this.loadingMoreData);
	}, 100);

	/**
	 * Whether or not to left align item text
	 */
	public get leftAlignText(): boolean {
		return this.internalLeftAlignText;
	}

	/**
	 * Sets wheter or not to left align item text
	 */
	public set leftAlignText(value: boolean) {
		if (value !== this.internalLeftAlignText) {
			this.internalLeftAlignText = value;
			if (this.virtualList) {
				this.virtualList.rerender();
			}
		}
	}

	/**
	 * Whether or not to display values
	 */
	public get displayValueLabels(): boolean {
		return this.internalDisplayValueLables;
	}

	/**
	 * Sets wheter or not to display values
	 */
	public set displayValueLabels(value: boolean) {
		if (value !== this.internalDisplayValueLables) {
			this.internalDisplayValueLables = value;
			if (this.virtualList) {
				this.virtualList.rerender();
			}
		}
	}

	/**
	 * Wheter or not to set value text overflow to visible
	 */
	public get overflowValueLabels(): boolean {
		return this.internalOverflowValueLabels;
	}

	/**
	 * Sets wheter or not to use allow value text to overflow
	 */
	public set overflowValueLabels(shouldOverflow: boolean) {
		if (shouldOverflow !== this.internalOverflowValueLabels) {
			this.internalOverflowValueLabels = shouldOverflow;
			if (this.virtualList) {
				this.virtualList.rerender();
			}
		}
	}

	/**
	 * Font color used to display item text
	 */
	public get itemTextColor(): string {
		return this.internalItemTextColor;
	}

	/**
	 * Sets the font color used to display item text
	 */
	public set itemTextColor(color: string) {
		if (color !== this.internalItemTextColor) {
			this.internalItemTextColor = color;
			if (this.virtualList) {
				this.virtualList.rerender();
			}
		}
	}

	/**
	 * Constructor for the advanced slicer
	 */
	constructor(
		element: BaseSelection,
		config?: { searchDebounce?: number },
		vlist?: VirtualList,
	) {
		this.showSelections = true;
		element.append(
			() =>
				html`
					${require("raw-loader!./AttributeSlicer.tmpl.html").default}
				`,
		);
		this.element = element.select(".advanced-slicer");
		this.listEle = this.element.select(".list");
		this.searchDebounce = lodashGet(config, "searchDebounce", SEARCH_DEBOUNCE);
		this.virtualList =
			vlist ||
			new VirtualList({
				itemHeight: this.fontSize * 2,
				afterRender: () => {
					return this.selectionManager.refresh();
				},
				generatorFn: (i: number): HTMLElement => {
					const item: ISlicerItem = <ISlicerItem>this.virtualList.items[i];
					const ele = slicerItemTemplate(
						item,
						this.calcColumnSizes(),
						this.leftAlignText,
						this.displayValueLabels,
						this.itemTextColor,
						this.overflowValueLabels,
					);
					ele
						.style("height", `${this.virtualList.itemHeight - 4}px`)
						.style("padding-bottom", "2.5px")
						.style("padding-top", "2px")
						.datum(item);

					return ele.node();
				},
			});

		this.selectionManager = new JQuerySelectionManager<IItemReference>(
			(items: IItemReference[]): void => {
				this.syncSelectionTokens(items);
				this.raiseSelectionChanged(items);
			},
		);

		this.element.classed("show-selections", this.showSelections);

		// We should just pass this info into the constructor
		this.selectionManager.bindTo(
			this.listEle,
			"item",
			(ele: BaseSelection): IItemReference => ele.datum(),
			(i: IItemReference) =>
				<BaseSelection>this.listEle.selectAll(".item").filter(function() {
					const ele = this;
					return (<IItemReference>select(ele).datum()).id === i.id;
				}),
		);

		this.fontSize = this.fontSize;

		this.virtualListEle = this.virtualList.container;
		const emitScrollEvent: Function = lodashDebounce(
			(position: [number, number]) => {
				this.events.raiseEvent("scroll", position);
			},
			500,
		);
		this.virtualListEle.on("scroll.attribute-slicer", () => {
			const event = d3Selection.event;
			const position: [number, number] = [
				event.target.scrollTop,
				event.target.scrollLeft,
			];
			emitScrollEvent(position);
			this.checkLoadMoreData();
		});

		this.listEle.append(() => this.virtualListEle.node());

		this.selectionsEle = element.select(".selections");
		this.checkAllEle = <BaseSelection>(
			element
				.select(".check-all")
				.on("click.attribute-slicer", () => this.toggleSelectAll())
		);
		this.clearAllEle = <BaseSelection>(
			element.select(".clear-all").on("click.attribute-slicer", () => {
				this.search("");
				this.clearSelection();
			})
		);
		this.attachEvents();

		this.brushSelectionMode = false;

		// these two are here because the devtools call init more than once
		this.loadingMoreData = true;
	}

	public get scrollPosition(): [number, number] {
		const element: BaseSelection = this.virtualListEle;
		if (element) {
			return [element.node().scrollTop, element.node().scrollLeft];
		}

		return [0, 0];
	}

	public set scrollPosition(value: [number, number]) {
		const element: BaseSelection = this.virtualListEle;
		if (element) {
			element.node().scrollTop = value[0];
			element.node().scrollLeft = value[1];
		}
	}

	/**
	 * Builds the current state
	 */
	public get state(): IAttributeSlicerState {
		return {
			selectedItems: this.selectedItems.map(
				(n: ISlicerItem) => <ISlicerItem>lodashClonedeep(n),
			),
			searchText: this.searchString || "",
			labelDisplayUnits: 0,
			labelPrecision: 0,
			horizontal: this.renderHorizontal,
			valueColumnWidth: this.valueWidthPercentage,
			showSelections: this.showSelections,
			singleSelect: this.singleSelect,
			brushMode: this.brushSelectionMode,
			textSize: this.fontSize,
			leftAlignText: this.leftAlignText,
			showOptions: this.showOptions,
			showSearch: this.showSearchBox,
			searchSupported: this.showSearchBox,
			showValues: this.showValues,
			scrollPosition: this.scrollPosition,
			displayValueLabels: this.displayValueLabels,
			itemTextColor: this.itemTextColor,
			overflowValueLabels: this.overflowValueLabels,
		};
	}

	/**
	 * Loads our state from the given state
	 */
	public set state(state: IAttributeSlicerState) {
		this.loadingState = true;
		state = lodashMerge({}, lodashClonedeep(DEFAULT_STATE), state);
		this.singleSelect = state.singleSelect;
		this.brushSelectionMode = state.brushMode;
		this.showSelections = state.showSelections;
		this.showOptions = state.showOptions;
		this.showSearchBox = state.showSearch && state.searchSupported;
		this.showValues = state.showValues;
		const newSearchString: string = state.searchText;
		if (newSearchString !== this.searchString) {
			this.searchString = newSearchString;
		}
		this.fontSize = state.textSize;

		this.selectedItems = (state.selectedItems || []).map(
			(n: IItemReference) => {
				return lodashMerge({}, n);
			},
		);
		this.renderHorizontal = state.horizontal;
		this.valueWidthPercentage = state.valueColumnWidth;
		this.scrollPosition = state.scrollPosition;
		this.leftAlignText = state.leftAlignText;
		this.displayValueLabels = state.displayValueLabels;
		this.itemTextColor = state.itemTextColor;
		this.overflowValueLabels = state.overflowValueLabels;

		this.loadingState = false;
	}

	/**
	 * Setter for whether or not the slicer options should be shown
	 */
	public set showOptions(value: boolean) {
		this.internalShowOptions = value;
		this.syncUIVisibility();
	}

	/**
	 * Getter for showOptions
	 */
	public get showOptions(): boolean {
		return this.internalShowOptions;
	}

	/**
	 * Setter for whether or not the slicer search box should be shown
	 */
	public set showSearchBox(value: boolean) {
		this.internalShowSearchBox = value;
		this.syncUIVisibility();
	}

	/**
	 * Getter for showSearchBox
	 */
	public get showSearchBox(): boolean {
		return this.internalShowSearchBox;
	}

	/**
	 * Setter for server side search
	 */
	public set serverSideSearch(value: boolean) {
		this.internalServerSideSearch = value;
	}

	/**
	 * Getter for server side search
	 */
	public get serverSideSearch(): boolean {
		return this.internalServerSideSearch;
	}

	/**
	 * Setter for if the attribute slicer should be single select
	 */
	public set singleSelect(value: boolean) {
		if (value !== this.selectionManager.singleSelect) {
			this.selectionManager.singleSelect = value;
		}
	}

	/**
	 * Getter for single select
	 */
	public get singleSelect(): boolean {
		return this.selectionManager.singleSelect;
	}

	/**
	 * Setter for if the attribute slicer should use brush selection mode
	 */
	public set brushSelectionMode(value: boolean) {
		if (value !== this.selectionManager.brushMode) {
			this.selectionManager.brushMode = value;
			this.element.classed("brush-mode", value);
		}
	}

	/**
	 * Getter for should use brush selection mode
	 */
	public get brushSelectionMode(): boolean {
		return this.selectionManager.brushMode;
	}

	/**
	 * Gets whether or not the search is case insensitive
	 */
	public get caseInsensitive(): boolean {
		return this.internalCaseInsentitive;
	}

	/**
	 * Setter for case insensitive
	 */
	public set caseInsensitive(value: boolean) {
		this.internalCaseInsentitive = value;
		this.syncItemVisiblity();
	}

	/**
	 * Gets our event emitter
	 */
	public get events(): EventEmitter {
		return this.internalEventEmitter;
	}

	/**
	 * Whether or not to render horizontal
	 */
	public get renderHorizontal(): boolean {
		return this.internalRenderHorizontal;
	}

	/**
	 * Sets whether or not to render horizontal
	 */
	public set renderHorizontal(value: boolean) {
		if (value !== this.internalRenderHorizontal) {
			this.internalRenderHorizontal = value;
			this.element.classed("render-horizontal", value);
			this.updateListHeight();
		}
	}

	/**
	 * The actual dimensions
	 */
	public get dimensions(): IDimensions | undefined {
		return this.internalDimensions;
	}

	/**
	 * Sets the dimension of the slicer
	 */
	public set dimensions(dims: IDimensions) {
		this.internalDimensions = dims;
		this.updateListHeight();
	}

	/**
	 * Getter for the percentage width of the value column (10 - 100)
	 */
	public get valueWidthPercentage(): number {
		return this.internalValueWidthPercentage;
	}

	/**
	 * Setter for the percentage width of the value column (10 - 100)
	 */
	public set valueWidthPercentage(value: number) {
		value = value ? Math.max(Math.min(value, 100), 10) : DEFAULT_VALUE_WIDTH;
		if (value !== this.internalValueWidthPercentage) {
			this.internalValueWidthPercentage = value;
			this.resizeColumns();
		}
	}

	/**
	 * Setter for showing the values column
	 */
	public set showValues(show: boolean) {
		if (show !== this.internalShowValues) {
			this.internalShowValues = show;
			this.element.classed("has-values", show);
		}
	}

	/**
	 * Getter for show values
	 */
	public get showValues(): boolean {
		return this.internalShowValues;
	}

	/**
	 * Controls whether or not to show the selection tokens
	 */
	public get showSelections(): boolean {
		return this.internalShowSelections;
	}

	/**
	 * Setter for showing the selections area
	 */
	public set showSelections(show: boolean) {
		if (show !== this.internalShowSelections) {
			this.internalShowSelections = show;
			this.element.classed("show-selections", show);
			this.syncItemVisiblity();
		}
	}

	/**
	 * Gets whether or not we are showing the highlights
	 */
	public get showHighlight(): boolean {
		return this.element.classed("show-highlight");
	}

	/**
	 * Toggles whether or not to show highlights
	 */
	public set showHighlight(highlight: boolean) {
		this.element.classed("show-highlight", !!highlight);
	}

	/**
	 * Gets the data behind the slicer
	 */
	public get data(): ISlicerItem[] {
		return this.internalData;
	}

	/**
	 * Sets the slicer data
	 */
	public set data(newData: ISlicerItem[]) {
		// If the user is straight up just setting new data, then clear the selected item
		// Otherwise, we are appending from a search/page action, it doesn't make sense to clear it.
		if (!this.loadingMoreData) {
			this.selectedItems = [];
		}

		if (newData && newData.length) {
			// This forces a visibility change for the items (if necessary)
			this.search(this.searchString);
		}

		this.internalData = newData;
		this.selectionManager.items = newData;

		// Not necessary as performed in syncItemVisibility
		// this.virtualList.setItems(newData);

		this.syncItemVisiblity(true);
		this.updateSelectAllButtonState();

		// If this is just setting data, we are not currently in a load cycle
		// Justification: When you change case insensitive in PBI, it reloads the data, filtering it
		// and passing it to us. But that sometimes is not enough data ie start with 100 items,
		// after a filter you have 2, well we need more data to fill the screen, this accounts for that
		if (!this.loadingMoreData) {
			setTimeout(() => this.checkLoadMoreData(), 10);
		}

		// if some one sets the data, then clearly we are no longer loading data
		this.loadingMoreData = false;
	}

	/**
	 * Controls the size of the font
	 */
	public get fontSize(): number {
		return this.internalFontSize;
	}

	/**
	 * Setter for fontSize
	 */
	public set fontSize(value: number) {
		value = value || DEFAULT_TEXT_SIZE;
		if (value !== this.internalFontSize) {
			this.internalFontSize = value;
			this.element.style("font-size", `${this.internalFontSize}px`);
			if (this.virtualList) {
				this.virtualList.setItemHeight(this.internalFontSize * 2);
			}
		}
	}

	/**
	 * The list of selected items
	 */
	public get selectedItems(): IItemReference[] {
		return this.selectionManager.selection;
	}

	/**
	 * Sets the set of selected items
	 */
	public set selectedItems(value: IItemReference[]) {
		this.selectionManager.selection = value;
		this.syncSelectionTokens(value);
	}

	/**
	 * Gets the current serch value
	 */
	public get searchString(): string | undefined {
		return this.internalSearchString;
	}

	/**
	 * Gets the current serch value
	 */
	public set searchString(value: string) {
		value = value || "";
		if (value !== this.internalSearchString) {
			this.internalSearchString = value || "";

			this.loadingSearch = true;
			this.element.select(".searchbox").property("value", value);
			this.loadingSearch = false;
			this.syncUIVisibility(false);
		}
	}

	/**
	 * A boolean indicating whether or not the list is loading more data
	 */
	protected get loadingMoreData(): boolean {
		return this.internalLoadingMoreData;
	}

	/**
	 * Setter for loadingMoreData
	 */
	protected set loadingMoreData(value: boolean) {
		this.internalLoadingMoreData = value;
		// Little janky, but what this does is ensures that if we are loading,
		// to set the loading flag immediately.  We also want to remove the load
		// flag slowly, in case we are loading stuff a bunch (ie, scroll load)
		if (value) {
			this.element.classed("loading", true);
		}
		this.toggleLoadingClass();
	}

	/**
	 * Determines if the given slice item matches the given string value
	 */
	public static IS_MATCH(
		item: ISlicerItem,
		matchValue: string,
		caseInsensitive: boolean,
	): boolean {
		const searchStr: string = pretty(matchValue);
		const flags: string = caseInsensitive ? "i" : "";
		const regex: RegExp = new RegExp(
			AttributeSlicer.escapeRegExp(searchStr),
			flags,
		);

		return regex.test(pretty(item.text));
	}

	/**
	 * Escapes RegExp
	 */
	private static escapeRegExp(str: string): string {
		return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
	}

	/**
	 * Calculates the column sizes for both the value and category columns
	 */
	public calcColumnSizes(): { value: number; category: number } {
		const remaining: number = 100 - this.valueWidthPercentage;

		return {
			value: this.showValues ? this.valueWidthPercentage : 0,
			category: this.showValues ? remaining : 100,
		};
	}

	/**
	 * Destroys this attribute slicer
	 */
	public destroy(): void {
		this.destroyed = true;
		if (this.selectionManager) {
			this.selectionManager.destroy();
			this.selectionManager = undefined;
		}
		if (this.virtualList) {
			this.virtualList.destroy();
			this.virtualList = undefined;
		}
	}

	/**
	 * Performs a search
	 */
	public search(searchStr: string): void {
		// If the search string has not changed we don't need to query for more data
		if (this.searchString !== searchStr) {
			this.searchString = searchStr;
			if (this.serverSideSearch) {
				const prevLoadState: boolean = this.loadingMoreData;
				this.loadingMoreData = true;
				setTimeout(() => {
					if (!this.checkLoadMoreDataBasedOnSearch()) {
						this.loadingMoreData = prevLoadState;
					}
				}, 10);
			}
			this.raiseSearchPerformed(searchStr);
		}
		// this is required because when the list is done searching it
		// adds back in cached elements with selected flags
		this.syncItemVisiblity();
		this.element.classed("has-search", !!this.searchString);
	}

	/**
	 * Refreshes the display when data changes
	 */
	public refresh(): void {
		if (this.virtualList) {
			this.virtualList.rerender();
		}
	}

	/**j
	 * Sorts the slicer
	 */
	public sort(sortProp: string, desc?: boolean): void {
		this.data.sort((a: ISlicerItem, b: ISlicerItem) => {
			const sortVal: number = naturalSort(a[sortProp], b[sortProp]);

			return desc ? -1 * sortVal : sortVal;
		});
	}

	/**
	 * Listener for the list scrolling
	 */
	protected checkLoadMoreData(): void {
		const scrollElement: HTMLElement = this.virtualListEle.node();
		const sizeProp: string = this.renderHorizontal ? "Width" : "Height";
		const posProp: string = this.renderHorizontal ? "Left" : "Top";
		const scrollSize: number = scrollElement[`scroll${sizeProp}`];
		const scrollPos: number = scrollElement[`scroll${posProp}`];
		const shouldScrollLoad: boolean =
			scrollSize - (scrollPos + scrollElement[`client${sizeProp}`]) < 200;
		if (
			shouldScrollLoad &&
			!this.loadingMoreData &&
			this.raiseCanLoadMoreData()
		) {
			this.raiseLoadMoreData(false);
		}
	}

	/**
	 * Raises the search performed event
	 */
	protected raiseSearchPerformed(searchText: string): void {
		this.events.raiseEvent("searchPerformed", searchText);
	}

	/**
	 * Raises the event to load more data
	 */
	protected raiseLoadMoreData(isNewSearch: boolean): void {
		const item: { result?: PromiseLike<ISlicerItem[]> } = {};
		this.events.raiseEvent(
			"loadMoreData",
			item,
			isNewSearch,
			this.searchString,
		);
		if (item.result) {
			this.loadingMoreData = true;
			const promise: PromiseLike<void | ISlicerItem[]> & {
				cancel?: boolean;
			} = (this.loadPromise = item.result.then(
				(items: ISlicerItem[]) => {
					// if this promise hasn't been cancelled
					if (!promise || !promise.cancel) {
						this.loadPromise = undefined;
						if (isNewSearch) {
							this.data = items;
						} else {
							this.data = this.data.concat(items);
						}

						// make sure we don't need to load more after this,
						// in case it doesn't all fit on the screen
						setTimeout(() => {
							this.checkLoadMoreData();
							if (!this.loadPromise) {
								this.loadingMoreData = false;
							}
						}, 10);

						return items;
					}
				},
				() => {
					// If we are rejected,  we don't  need to clear the data,
					// this just means the retrieval for more data failed, leave the data
					// this.data = [];
					this.loadingMoreData = false;
				},
			));
		}
		this.loadingMoreData = false;
	}

	/**
	 * Raises the event 'can
	 * '
	 */
	protected raiseCanLoadMoreData(isSearch: boolean = false): boolean {
		const item: { result: boolean } = {
			result: false,
		};
		this.events.raiseEvent("canLoadMoreData", item, isSearch);

		return item.result;
	}

	/**
	 * Raises the selectionChanged event
	 */
	protected raiseSelectionChanged(newItems: IItemReference[]): void {
		this.events.raiseEvent("selectionChanged", newItems);
	}

	/**
	 * Resizes all of the visible columns
	 */
	private resizeColumns(): void {
		const sizes: {
			value: number;
			category: number;
		} = this.calcColumnSizes();
		this.element
			.select(".value-container")
			.style("max-width", `${sizes.value}%`);
		this.element
			.select(".category-container")
			.style("max-width", `${sizes.category}%`);
	}

	/**
	 * Syncs the tokens in the UI with the actual selection
	 */
	private syncSelectionTokens(items: IItemReference[]): void {
		// Important that these are always in sync, in case showSelections gets set to true
		if (items) {
			this.selectionsEle.selectAll(".token").remove();
			items
				.map((v: IItemReference) => this.createSelectionToken(v))
				.forEach((n: BaseSelection) => {
					this.selectionsEle.append(() => {
						return n.node();
					});
				});
		}

		// We don't need to do any of this if show selections is off
		if (this.showSelections) {
			this.syncItemVisiblity();
		}

		this.syncUIVisibility();
	}

	/**
	 * Syncs the item elements state with the current set of selected items and the search
	 */
	private syncItemVisiblity(forceLoad: boolean = false): void {
		let filteredData: ISlicerItem[] = [];
		if (this.data && this.data.length) {
			filteredData = this.data.filter((n: ISlicerItem, i: number) => {
				const item: ISlicerItem = this.data[i];
				let isVisible: boolean =
					!this.showSelections ||
					!(
						!!this.selectedItems &&
						this.selectedItems.filter((b: ISlicerItem) => b.id === item.id)
							.length > 0
					);

				// update the search
				if (isVisible && !this.serverSideSearch && this.searchString) {
					isVisible = AttributeSlicer.IS_MATCH(
						item,
						this.searchString,
						this.caseInsensitive,
					);
				}

				return isVisible;
			});
		}
		if (
			this.virtualList &&
			(forceLoad ||
				filteredData.length !== (this.virtualList.items || []).length)
		) {
			this.virtualList.setItems(filteredData);
			// this.virtualList.rerender();
		}
	}

	/**
	 * Syncs the UIs Visibility
	 */
	private syncUIVisibility(calcList: boolean = true): void {
		const hasSelection: boolean = !!(
			this.selectedItems && this.selectedItems.length
		);

		toggleElement(this.element.select(".slicer-options"), this.showOptions);
		toggleElement(this.element.select(".searchbox"), this.showSearchBox);
		toggleElement(
			this.element.select(".slicer-options"),
			this.showOptions && (this.showSearchBox || hasSelection),
		);
		toggleElement(this.clearAllEle, hasSelection || !!this.searchString);

		// If we are no longer showing the search box, hide the search string
		if (!this.showSearchBox) {
			this.searchString = "";
		}

		if (calcList) {
			this.updateListHeight();
		}
	}

	/**
	 * Toggle the select all state
	 */
	private toggleSelectAll(): void {
		const checked: boolean = this.checkAllEle.property("checked");
		if (!!checked) {
			this.selectedItems = this.internalData.slice(0);
		} else {
			this.selectedItems = [];
		}
	}

	/**
	 * Creates a new selection token element
	 */
	private createSelectionToken(v: IItemReference): BaseSelection {
		const newEle: BaseSelection = create("div");
		const text: string = pretty(v.text);
		newEle
			.classed("token", true)
			.attr("title", text)
			.datum(v)
			.on("click.attribute-slicer", () => {
				newEle.remove();
				const item: IItemReference = this.selectedItems.filter(
					(n: IItemReference) => n.id === v.id,
				)[0];
				const newSel: IItemReference[] = this.selectedItems.slice(0);
				newSel.splice(newSel.indexOf(item), 1);
				this.selectedItems = newSel;
			})
			.text(text);

		return newEle;
	}

	/**
	 * Clears the selection
	 */
	private clearSelection(): void {
		this.selectedItems = [];
	}

	/**
	 * Updates the select all button state to match the data
	 */
	private updateSelectAllButtonState(): void {
		this.checkAllEle.property(
			"indeterminate",
			this.selectedItems.length > 0 &&
				this.internalData.length !== this.selectedItems.length,
		);
		this.checkAllEle.property("checked", this.selectedItems.length > 0);
	}

	/**
	 * Attaches all the necessary events
	 */
	private attachEvents(): void {
		const searchDebounced: Function = lodashDebounce(
			() => this.search(this.getSearchStringFromElement()),
			this.searchDebounce,
		);

		this.element.select(".searchbox").on("input.attribute-slicer", () => {
			if (!this.loadingSearch) {
				searchDebounced();
			}
		});

		this.listEle.on("click.attribute-slicer", () => {
			const evt = d3Selection.event;
			evt.stopImmediatePropagation();
			evt.stopPropagation();
		});
	}

	/**
	 * Gets the search string from the search box
	 */
	private getSearchStringFromElement(): string {
		return this.element.select(".searchbox").property("value") || "";
	}

	/**
	 * Loads more data based on search
	 * @param force Force the loading of new data, if it can
	 */
	private checkLoadMoreDataBasedOnSearch(): boolean {
		// only need to load if:
		// 1. There is more data. 2. There is not too much stuff on the screen (not causing a scroll)
		if (this.raiseCanLoadMoreData(true)) {
			if (this.loadPromise) {
				this.loadPromise.cancel = true;
			}
			// we're not currently loading data, cause we cancelled
			this.loadingMoreData = false;
			this.raiseLoadMoreData(true);

			return true;
		}
	}
}
