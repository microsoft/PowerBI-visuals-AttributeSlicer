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

import EventEmitter from "../base/EventEmitter";
import * as $ from "jquery";
import * as _ from "lodash";
import JQuerySelectionManager from "./selection/JQuerySelectionManager";
import { SlicerItem, IAttributeSlicerState } from "./interfaces";
import { prettyPrintValue as pretty } from "./Utils";
import itemTemplate from "./SlicerItem.tmpl";
import { SEARCH_DEBOUNCE, DEFAULT_VALUE_WIDTH, DEFAULT_TEXT_SIZE, DEFAULT_STATE } from "./AttributeSlicer.defaults";

/* tslint:disable */
const naturalSort = require("javascript-natural-sort");
const VirtualList = require("./lib/VirtualList");
const log = require("debug")("essex.widget.AttributeSlicer");
const ldget = require("lodash/get");
/* tslint:enable */

/**
 * Represents an advanced slicer to help slice through data
 */
export class AttributeSlicer {

    /**
     * The template for this visual
     */
    private static template = require("./AttributeSlicer.tmpl.html");

    /**
     * The selection manager to use
     */
    private selectionManager: JQuerySelectionManager<SlicerItem>;

    /**
     * The slicer element
     */
    private slicerEle: JQuery;

    /**
     * The actual list element
     */
    private listEle: JQuery;

    /**
     * The clearAll element
     */
    private clearAllEle: JQuery;

    /**
     * The check all button
     */
    private checkAllEle: JQuery;

    /**
     * Our container element
     */
    private element: JQuery;

    /**
     * The data contained in this slicer
     */
    private _data: SlicerItem[] = [];

    /**
     * Our event emitter
     */
    private _eventEmitter: EventEmitter = new EventEmitter();

    /**
     * Container for the selections
     */
    private selectionsEle: JQuery;

    /**
     * Stores the currently loading promise
     */
    private loadPromise: PromiseLike<any>;

    /**
     * Whether or not we are loading the search box
     */
    private loadingSearch = false;

    /**
     * The virtual list
     */
    private virtualList: any;

    /**
     * The virtual list element
     */
    private virtualListEle: JQuery;

    /**
     * Whether or not we are currently loading a state
     */
    private loadingState = false;

    /**
     * The number of milliseconds before running the search, after a user stops typing
     */
    private searchDebounce = SEARCH_DEBOUNCE;

    /**
     * Whether this component has been destroyed
     */
    private destroyed = false;

    /**
     * Whether or not to left align item text
     */
    private _leftAlignText = false;
    public get leftAlignText() {
        return this._leftAlignText;
    }

    /**
     * Sets wheter or not to left align item text
     */
    public set leftAlignText(value: boolean){
        if (value !== this._leftAlignText) {
            this._leftAlignText = value;
            if (this.virtualList) {
                this.virtualList.rerender();
            }
        }
    }


    /**
     * Whether or not to display values
     */
    private _displayValueLables = false;
    public get displayValueLabels() {
        return this._displayValueLables;
    }

    /**
     * Sets wheter or not to display values
     */
    public set displayValueLabels(value: boolean){
        if (value !== this._displayValueLables) {
            this._displayValueLables = value;
            if (this.virtualList) {
                this.virtualList.rerender();
            }
        }
    }

    /**
     * Wheter or not to set value text overflow to visible
     */
    private _overflowValueLabels = false;
    public get overflowValueLabels() {
        return this._overflowValueLabels;
    }

    /**
     * Sets wheter or not to use allow value text to overflow
     */
    public set overflowValueLabels(shouldOverflow: boolean) {
        if (shouldOverflow !== this._overflowValueLabels) {
            this._overflowValueLabels = shouldOverflow;
            if (this.virtualList) {
                this.virtualList.rerender();
            }
        }
    }

    /**
     * Font color used to display item text
     */
    private _itemTextColor = "#000";
    public get itemTextColor() {
        return this._itemTextColor;
    }

    /**
     * Sets the font color used to display item text
     */
    public set itemTextColor(color: string){
        if (color !== this._itemTextColor) {
            this._itemTextColor = color;
            if (this.virtualList) {
                this.virtualList.rerender();
            }
        }
    }

    /**
     * Updates the list height
     */
    private updateListHeight = _.debounce(() => {
        if (!this.destroyed && this.dimensions) {
            let height = (this.dimensions.height - (this.listEle.offset().top - this.element.offset().top)) - 2;
            let width: number|string = "100%";
            this.listEle.css({ width: width, height: height });
                // .attr("dir", dir);
            this.virtualList.setHeight(height);
            this.virtualList.setDir(this.renderHorizontal);
        }
    }, 50);

    /**
     * Constructor for the advanced slicer
     */
    constructor(element: JQuery, config?: { searchDebounce?: number }, vlist?: any) {
        this.element = element;
        this.showSelections = true;
        this.slicerEle = element.append($(AttributeSlicer.template)).find(".advanced-slicer");
        this.listEle = this.slicerEle.find(".list");
        this.searchDebounce = ldget(config, "searchDebounce", SEARCH_DEBOUNCE);
        this.virtualList = vlist || new VirtualList({
            itemHeight: this.fontSize * 2,
            afterRender: () => this.selectionManager.refresh(),
            generatorFn: (i: number) => {
                const item: SlicerItem = this.virtualList.items[i];
                const ele = itemTemplate(item, this.calcColumnSizes(), this.leftAlignText,
                    this.displayValueLabels, this.itemTextColor, this.overflowValueLabels);
                ele
                    .css({ height: `${this.virtualList.itemHeight - 4}px`, paddingBottom: "2.5px", paddingTop: "2px" })
                    .data("item", item);
                if (item.onCreate) {
                    item.onCreate(ele);
                }
                return ele[0];
            },
        });
        this.selectionManager = new JQuerySelectionManager<SlicerItem>((items) => {
            this.syncSelectionTokens(items);
            this.raiseSelectionChanged(items);
        });

        this.element.toggleClass("show-selections", this.showSelections);

        // We should just pass this info into the constructor
        this.selectionManager.bindTo(
            this.listEle,
            ".item",
            (ele) => ele.data("item"),
            (i) => this.listEle.find(".item").filter((idx, ele) => $(ele).data("item").id === i.id));

        this.fontSize = this.fontSize;

        this.virtualListEle = this.virtualList.container;
        const emitScrollEvent = _.debounce((position: [number, number]) => {
            this.events.raiseEvent("scroll", position);
        }, 500) as any;
        this.virtualListEle.scroll((event: any) => {
            const position = [event.target.scrollTop, event.target.scrollLeft];
            emitScrollEvent(position);
            this.checkLoadMoreData();
        });

        this.listEle.append(this.virtualListEle);

        this.selectionsEle = element.find(".selections");
        this.checkAllEle = element.find(".check-all").on("click", () => this.toggleSelectAll());
        this.clearAllEle = element.find(".clear-all").on("click", () => {
            this.search("");
            this.clearSelection();
        });
        this.attachEvents();

        this.brushSelectionMode = false;

        // these two are here because the devtools call init more than once
        this.loadingMoreData = true;
    }

    /**
     * Builds the current state
     */
    public get state(): IAttributeSlicerState {
        return {
            selectedItems: this.selectedItems.map(n => <any>_.cloneDeep(n)),
            searchText: this.searchString || "",
            labelDisplayUnits: 0,
            labelPrecision: 0,
            horizontal: this.renderHorizontal,
            valueColumnWidth: this.valueWidthPercentage,
            showSelections: this.showSelections,
            singleSelect: this.singleSelect,
            brushMode: this.brushSelectionMode,
            // TODO: textSize: PixelConverter.toPoint(this.mySlicer.fontSize),
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

    public get scrollPosition(): [number, number] {
        const element = this.virtualListEle;
        if (element) {
            return [element.scrollTop(), element.scrollLeft()];
        } else {
            return [0, 0];
        }
    }

    public set scrollPosition(value: [number, number]) {
        const element = this.virtualListEle;
        if (element) {
            element.scrollTop(value[0]);
            element.scrollLeft(value[1]);
        }
    }

    /**
     * Loads our state from the given state
     */
    public set state(state: IAttributeSlicerState) {
        this.loadingState = true;
        state = _.merge({}, _.cloneDeep(DEFAULT_STATE), state);
        const s = this;
        // const displayUnits = this.labelDisplayUnits !== (this.labelDisplayUnits = settings.display.labelDisplayUnits);
        // const precision = this.labelPrecision !== (this.labelPrecision = settings.display.labelPrecision);
        s.singleSelect = state.singleSelect;
        s.brushSelectionMode = state.brushMode;
        s.showSelections = state.showSelections;
        s.showOptions = state.showOptions;
        s.showSearchBox = state.showSearch && state.searchSupported;
        s.showValues = state.showValues;
        const newSearchString = state.searchText;
        let searchString = false;
        if (newSearchString !== s.searchString) {
            searchString = true;
            s.searchString = newSearchString;
        }
        s.fontSize = state.textSize;

        this.selectedItems = (state.selectedItems || []).map(n => {
            return _.merge({}, n, {
                equals: (m: SlicerItem) => m.id === n.id,
            });
        });
        s.renderHorizontal = state.horizontal;
        s.valueWidthPercentage = state.valueColumnWidth;
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
    private _showOptions = true; // tslint:disable-line
    public set showOptions(value: boolean) {
        this._showOptions = value;
        this.syncUIVisibility();
    }

    /**
     * Getter for showOptions
     */
    public get showOptions() {
        return this._showOptions;
    }

    /**
     * Setter for whether or not the slicer search box should be shown
     */
    private _showSearchBox = true;
    public set showSearchBox(value: boolean) {
        this._showSearchBox = value;
        this.syncUIVisibility();
    }

    /**
     * Getter for showSearchBox
     */
    public get showSearchBox() {
        return this._showSearchBox;
    }

    /**
     * Setter for server side search
     */
    private _serverSideSearch = true;
    public set serverSideSearch(value: boolean) {
        this._serverSideSearch = value;
    }

    /**
     * Getter for server side search
     */
    public get serverSideSearch() {
        return this._serverSideSearch;
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
    public get singleSelect() {
        return this.selectionManager.singleSelect;
    }

    /**
     * Setter for if the attribute slicer should use brush selection mode
     */
    public set brushSelectionMode(value: boolean) {
        if (value !== this.selectionManager.brushMode) {
            this.selectionManager.brushMode = value;
            this.element.toggleClass("brush-mode", value);
        }
    }

    /**
     * Getter for should use brush selection mode
     */
    public get brushSelectionMode() {
        return this.selectionManager.brushMode;
    }

    /**
     * Gets whether or not the search is case insensitive
     */
    private _caseInsentitive = true;
    public get caseInsensitive() {
        return this._caseInsentitive;
    }

    /**
     * Setter for case insensitive
     */
    public set caseInsensitive(value: boolean) {
        this._caseInsentitive = value;
        this.syncItemVisiblity();
    }

    /**
     * Gets our event emitter
     */
    public get events() {
        return this._eventEmitter;
    }

    /**
     * Whether or not to render horizontal
     */
    private _renderHorizontal = false;
    public get renderHorizontal() {
        return this._renderHorizontal;
    }

    /**
     * Sets whether or not to render horizontal
     */
    public set renderHorizontal(value: boolean) {
        if (value !== this._renderHorizontal) {
            this._renderHorizontal = value;
            this.element.toggleClass("render-horizontal", value);
            this.updateListHeight();
        }
    }

    /**
     * The actual dimensions
     */
    private _dimensions: { width: number; height: number };
    public get dimensions() {
        return this._dimensions;
    }

    /**
     * Sets the dimension of the slicer
     */
    public set dimensions(dims: { width: number; height: number }) {
        this._dimensions = dims;
        this.updateListHeight();
    }

    /**
     * Getter for the percentage width of the value column (10 - 100)
     */
    public get valueWidthPercentage() {
        return this._valueWidthPercentage;
    }

    /**
     * Setter for the percentage width of the value column (10 - 100)
     */
    private _valueWidthPercentage: number = DEFAULT_VALUE_WIDTH;
    public set valueWidthPercentage(value: number) {
        value = value ? Math.max(Math.min(value, 100), 10) : DEFAULT_VALUE_WIDTH;
        if (value !== this._valueWidthPercentage) {
            this._valueWidthPercentage = value;
            this.resizeColumns();
        }
    }

    /**
     * Setter for showing the values column
     */
    private _showValues = false;
    public set showValues(show: boolean) {
        if (show !== this._showValues) {
            this._showValues = show;
            this.element.toggleClass("has-values", show);
        }
    }

    /**
     * Getter for show values
     */
    public get showValues(): boolean {
        return this._showValues;
    }

    /**
     * Controls whether or not to show the selection tokens
     */
    private _showSelections = true;
    public get showSelections() {
        return this._showSelections;
    }

    /**
     * Setter for showing the selections area
     */
    public set showSelections(show: boolean) {
        if (show !== this._showSelections) {
            this._showSelections = show;
            this.element.toggleClass("show-selections", show);
            this.syncItemVisiblity();
        }
    }

    /**
     * Gets whether or not we are showing the highlights
     */
    public get showHighlight() {
        return this.element.hasClass("show-highlight");
    }

    /**
     * Toggles whether or not to show highlights
     */
    public set showHighlight(highlight: boolean) {
        this.element.toggleClass("show-highlight", !!highlight);
    }

    /**
     * Gets the data behind the slicer
     */
    public get data() {
        return this._data;
    }

    /**
     * Sets the slicer data
     */
    public set data(newData: SlicerItem[]) {

        // If the user is straight up just setting new data, then clear the selected item
        // Otherwise, we are appending from a search/page action, it doesn't make sense to clear it.
        if (!this.loadingMoreData) {
            this.selectedItems = [];
        }

        if (newData && newData.length) {
            this.search(this.searchString); // This forces a visibility change for the items (if necessary)
        }

        this._data = newData;
        this.selectionManager.items = newData;

        // Not necessary as performed in syncItemVisibility
        // this.virtualList.setItems(newData);

        this.syncItemVisiblity(true);
        this.updateSelectAllButtonState();

        // If this is just setting data, we are not currently in a load cycle
        // Justification: When you change case insensitive in PBI, it reloads the data, filtering it and passing it to us
        // But, that sometimes is not enough data ie start with 100 items, after a filter you have 2,
        // well we need more data to fill the screen, this accounts for that
        if (!this.loadingMoreData) {
            setTimeout(() => this.checkLoadMoreData(), 10);
        }

        // if some one sets the data, then clearly we are no longer loading data
        this.loadingMoreData = false;
    }

    /**
     * Controls the size of the font
     */
    private _fontSize: number = DEFAULT_TEXT_SIZE; // 12 px
    public get fontSize() {
        return this._fontSize;
    }

    /**
     * Setter for fontSize
     */
    public set fontSize(value: number) {
        value = value || DEFAULT_TEXT_SIZE;
        if (value !== this._fontSize) {
            this._fontSize = value;
            this.slicerEle.css({
                fontSize: this._fontSize + "px",
            });
            if (this.virtualList) {
                this.virtualList.setItemHeight(this._fontSize * 2);
            }
        }
    }

    /**
     * The list of selected items
     */
    public get selectedItems(): SlicerItem[] {
        return this.selectionManager.selection;
    }

    /**
     * Sets the set of selected items
     */
    public set selectedItems (value: SlicerItem[]) {
        this.selectionManager.selection = value;
        this.syncSelectionTokens(value);
    }

    /**
     * Gets the current serch value
     */
    private _searchString: string = "";
    public get searchString() {
        return this._searchString;
    }

    /**
     * Gets the current serch value
     */
    public set searchString(value: string) {
        value = value || "";
        if (value !== this._searchString) {
            this._searchString = value || "";

            this.loadingSearch = true;
            this.element.find(".searchbox").val(value);
            this.loadingSearch = false;
            this.syncUIVisibility(false);
        }
    }

    /**
     * A boolean indicating whether or not the list is loading more data
     */
    private _loadingMoreData = false; // don't use this directly
    protected get loadingMoreData() {
        return this._loadingMoreData;
    }

    /**
     * Setter for loadingMoreData
     */
    private _toggleClass = _.debounce(() => this.element.toggleClass("loading", this.loadingMoreData), 100);
    protected set loadingMoreData(value: boolean) {
        this._loadingMoreData = value;
        // Little janky, but what this does is ensures that if we are loading, to set the loading flag immediately.
        // We also want to remove the load flag slowly, in case we are loading stuff a bunch (ie, scroll load)
        if (value) {
            this.element.addClass("loading");
        }
        this._toggleClass();
    }

    /**
     * Determines if the given slice item matches the given string value
     */
    public static isMatch(item: SlicerItem, matchValue: string, caseInsensitive: boolean) {
        const searchStr = pretty(matchValue);
        const flags = caseInsensitive ? "i" : "";
        let regex = new RegExp(AttributeSlicer.escapeRegExp(searchStr), flags);
        return regex.test(pretty(item.match)) || regex.test(pretty(item.matchPrefix)) || regex.test(pretty(item.matchSuffix));
    }

    /**
     * Escapes RegExp
     */
    private static escapeRegExp(str: string) {
        return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    }

    /**
     * Calculates the column sizes for both the value and category columns
     */
    public calcColumnSizes() {
        let remaining = 100 - this.valueWidthPercentage;
        return {
            value: this.showValues ? this.valueWidthPercentage : 0,
            category: this.showValues ? remaining : 100,
        };
    }

    /**
     * Destroys this attribute slicer
     */
    public destroy() {
        this.destroyed = true;
        if (this.selectionManager) {
            this.selectionManager.destroy();
        }
    }

    /**
     * Performs a search
     */
    public search(searchStr: string) {
        // If the search string has not changed we don't need to query for more data
        if (this.searchString !== searchStr) {
            this.searchString = searchStr;
            if (this.serverSideSearch) {
                const prevLoadState = this.loadingMoreData;
                this.loadingMoreData = true;
                setTimeout(() => {
                    if (!this.checkLoadMoreDataBasedOnSearch()) {
                        this.loadingMoreData = prevLoadState;
                    }
                }, 10);
            }
            this.raiseSearchPerformed(searchStr);
        }
        // this is required because when the list is done searching it adds back in cached elements with selected flags
        this.syncItemVisiblity();
        this.element.toggleClass("has-search", !!this.searchString);
    }

    /**
     * Refreshes the display when data changes
     */
    public refresh() {
        if (this.virtualList) {
            this.virtualList.rerender();
        }
    }

    /**j
     * Sorts the slicer
     */
    public sort(toSort: string, desc?: boolean) {
        this.data.sort((a, b) => {
            const sortVal = naturalSort((<any>a)[toSort], (<any>b)[toSort]);
            return desc ? -1 * sortVal : sortVal;
        });
    }

    /**
     * Listener for the list scrolling
     */
    protected checkLoadMoreData() {
        const scrollElement = this.virtualListEle[0];
        const sizeProp = this.renderHorizontal ? "Width" : "Height";
        const posProp = this.renderHorizontal ? "Left" : "Top";
        const scrollSize = scrollElement["scroll" + sizeProp];
        const scrollPos = scrollElement["scroll" + posProp];
        const shouldScrollLoad = scrollSize - (scrollPos + scrollElement["client" + sizeProp]) < 200;
        if (shouldScrollLoad && !this.loadingMoreData && this.raiseCanLoadMoreData()) {
            this.raiseLoadMoreData(false);
        }
    }

    /**
     * Raises the search performed event
     */
    protected raiseSearchPerformed(searchText: string) {
        this.events.raiseEvent("searchPerformed", searchText);
    }

    /**
     * Raises the event to load more data
     */
    protected raiseLoadMoreData(isNewSearch: boolean): PromiseLike<SlicerItem[]> {
        let item: { result?: PromiseLike<SlicerItem[]> } = { };
        this.events.raiseEvent("loadMoreData", item, isNewSearch, this.searchString);
        if (item.result) {
            this.loadingMoreData = true;
            let promise = this.loadPromise = item.result.then((items) => {
                // if this promise hasn't been cancelled
                if (!promise || !promise["cancel"]) {
                    this.loadPromise = undefined;
                    if (isNewSearch) {
                        this.data = items;
                    } else {
                        this.data = this.data.concat(items);
                    }

                    // make sure we don't need to load more after this, in case it doesn't all fit on the screen
                    setTimeout(() => {
                        this.checkLoadMoreData();
                        if (!this.loadPromise) {
                            this.loadingMoreData = false;
                        }
                    }, 10);
                    return items;
                }
            }, () => {
                // If we are rejected,  we don't  need to clear the data,
                // this just means the retrieval for more data failed, leave the data
                // this.data = [];
                this.loadingMoreData = false;
            });
            return promise;
        }  else {
            this.loadingMoreData = false;
        }
    }

    /**
     * Raises the event 'can
     * '
     */
    protected raiseCanLoadMoreData(isSearch: boolean = false): boolean {
        let item = {
            result: false,
        };
        this.events.raiseEvent("canLoadMoreData", item, isSearch);
        return item.result;
    }

    /**
     * Raises the selectionChanged event
     */
    protected raiseSelectionChanged(newItems: SlicerItem[]) {
        this.events.raiseEvent("selectionChanged", newItems);
    }

    /**
     * Resizes all of the visible columns
     */
    private resizeColumns() {
        let sizes = this.calcColumnSizes();
        this.element.find(".value-container").css({
            maxWidth: sizes.value + "%",
        });
        this.element.find(".category-container").css({
            maxWidth: sizes.category + "%",
        });
    }

    /**
     * Syncs the tokens in the UI with the actual selection
     */
    private syncSelectionTokens(items: SlicerItem[]) {

        // Important that these are always in sync, in case showSelections gets set to true
        if (items) {
            this.selectionsEle.find(".token").remove();
            items.map((v) => this.createSelectionToken(v)).forEach(n => n.appendTo(this.element.find(".selections")));
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
    private syncItemVisiblity(forceLoad = false) {
        let filteredData: SlicerItem[] = [];
        if (this.data &&  this.data.length) {
            filteredData = this.data.filter((n, i) => {
                const item = this.data[i];
                let isVisible =
                    !this.showSelections || !(!!this.selectedItems && this.selectedItems.filter(b => b.equals(item)).length > 0);

                // update the search
                if (isVisible && !this.serverSideSearch && this.searchString) {
                    isVisible = AttributeSlicer.isMatch(item, this.searchString, this.caseInsensitive);
                }

                return isVisible;
            });
        }
        if (this.virtualList && (forceLoad || filteredData.length !== (this.virtualList.items || []).length)) {
            this.virtualList.setItems(filteredData);
            // this.virtualList.rerender();
        }
    }

    /**
     * Syncs the UIs Visibility
     */
    private syncUIVisibility(calcList = true) {
        const hasSelection = !!(this.selectedItems && this.selectedItems.length);

        this.element.find(".slicer-options").toggle(this.showOptions);
        this.element.find(".searchbox").toggle(this.showSearchBox);
        this.element.find(".slicer-options").toggle(this.showOptions && (this.showSearchBox || hasSelection));
        this.clearAllEle.toggle(hasSelection || !!this.searchString);

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
    private toggleSelectAll() {
        let checked = this.checkAllEle.prop("checked");
        if (!!checked) {
            this.selectedItems = this._data.slice(0);
        } else {
            this.selectedItems = [];
        }
    }

    /**
     * Creates a new selection token element
     */
    private createSelectionToken(v: SlicerItem): JQuery {
        const newEle = $("<div/>");
        const text = pretty(v.matchPrefix) + pretty(v.match) + pretty(v.matchSuffix);
        newEle
            .addClass("token")
            .attr("title", text)
            .data("item", v)
            .on("click", () => {
                newEle.remove();
                let item = this.selectedItems.filter(n => n.equals(v))[0];
                const newSel = this.selectedItems.slice(0);
                newSel.splice(newSel.indexOf(item), 1);
                this.selectedItems = newSel;
            })
            .text(text);
        return newEle;
    }

    /**
     * Clears the selection
     */
    private clearSelection() {
        this.selectedItems = [];
    }

    /**
     * Updates the select all button state to match the data
     */
    private updateSelectAllButtonState() {
        this.checkAllEle.prop("indeterminate", this.selectedItems.length > 0 && this._data.length !== this.selectedItems.length);
        this.checkAllEle.prop("checked", this.selectedItems.length > 0);
    }

    /**
     * Attaches all the necessary events
     */
    private attachEvents() {
        const searchDebounced =
            _.debounce(() => this.search(this.getSearchStringFromElement()), this.searchDebounce);

        this.element.find(".searchbox").on("input", () => {
            if (!this.loadingSearch) {
                searchDebounced();
            }
        });

        this.listEle.on("click", (evt) => {
            evt.stopImmediatePropagation();
            evt.stopPropagation();
        });
    }

    /**
     * Gets the search string from the search box
     */
    private getSearchStringFromElement() {
        return this.element.find(".searchbox").val() || "";
    }

    /**
     * Loads more data based on search
     * @param force Force the loading of new data, if it can
     */
    private checkLoadMoreDataBasedOnSearch() {
        // only need to load if:
        // 1. There is more data. 2. There is not too much stuff on the screen (not causing a scroll)
        if (/*!this.loadingMoreData && */this.raiseCanLoadMoreData(true)) {
            if (this.loadPromise) {
                this.loadPromise["cancel"] = true;
            }
            // we're not currently loading data, cause we cancelled
            this.loadingMoreData = false;
            this.raiseLoadMoreData(true);
            return true;
        }
    }
}
