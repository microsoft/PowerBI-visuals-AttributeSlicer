import EventEmitter from "../base/EventEmitter";
import * as $ from "jquery";
import * as _ from "lodash";

/* tslint:disable */
const naturalSort = require("javascript-natural-sort");
const VirtualList = require("./lib/VirtualList");
/* tslint:enable */

/**
 * Represents an advanced slicer to help slice through data
 */
export class AttributeSlicer {

    /**
     * The number of milliseconds before running the search, after a user stops typing.
     */
    private static SEARCH_DEBOUNCE = 500;

    /**
     * The value column default width
     */
    private static DEFAULT_VALUE_WIDTH = 66;

    /**
     * The template for this visual
     */
    private static template = `
        <div class="advanced-slicer">
            <div class="slicer-options">
                <input class="searchbox" placeholder="Search" />
                <span class="clear-all">Clear All</span>
                <div style="margin:0;padding:0;margin-top:5px;">
                <div class="selection-container">
                    <div class="selections">
                    </div>
                </div>
                <!-- Disabled -->
                <label style="display:none;vertical-align:middle">
                    <input class="check-all" type="checkbox" style="margin-right:5px;vertical-align:middle"/>&nbsp;Select All
                </label>
                </div>
                <hr/>
            </div>
            <div class="list">
                <div class='load-spinner'><div>
            </div>
        </div>
    `.trim().replace(/\n/g, "");

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
    private virtualListEle: any;

    /**
     * The items that are in the processes of being selected by the user
     */
    private selectionModeItems: SlicerItem[] = [];

    /**
     * The template used to render list items
     */
    private listItemFactory = (item: SlicerItem) => {
        const { match, matchPrefix, matchSuffix, sections, renderedValue } = item;
        const pretty = AttributeSlicer.prettyPrintValue;
        const sizes = this.calcColumnSizes();
        const categoryStyle = `display:inline-block;overflow:hidden;max-width:${sizes.category}%`;
        return $(`
            <div style="white-space:nowrap" class="item" style="cursor:pointer">
                <div style="margin-left: 5px;vertical-align:middle;height:100%" class="display-container">
                    <span style="${categoryStyle}" title="${pretty(match)}" class="category-container">
                        <span class="matchPrefix">${pretty(matchPrefix)}</span>
                        <span class="match">${pretty(match)}</span>
                        <span class="matchSuffix">${pretty(matchSuffix)}</span>
                    </span>
                    <span style="display:inline-block;max-width:${sizes.value}%;height:100%" class="value-container">
                        <span style="display:inline-block;width:${renderedValue}%;height:100%">
                        ${
                            (sections || []).map(s => {
                                let color = s.color;
                                if (color) {
                                    color = `background-color:${color};`;
                                }
                                const displayValue = s.displayValue || s.value || "0";
                                const style = `display:inline-block;width:${s.width}%;${color};height:100%`;
                                return `
                                    <span style="${style}" title="${displayValue}" class="value-display">
                                        &nbsp;<span class="value">${displayValue}</span>
                                    </span>
                                `.trim().replace(/\n/g, "");
                            }).join("")
                        }
                        </span>
                    </span>
                </div>
            </div>
        `.trim().replace(/\n/g, ""));
    };

    /**
     * Updates the list height
     */
    private updateListHeight = _.debounce(() => {
        if (this.dimensions) {
            let slicerHeight = Math.floor(this.element.find(".slicer-options").height() - 10);
            let height = Math.floor(this.dimensions.height - slicerHeight) - 20;
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
    constructor(element: JQuery, vlist?: any) {
        this.element = element;
        this.showSelections = true;
        this.slicerEle = element.append($(AttributeSlicer.template)).find(".advanced-slicer");
        this.listEle = this.slicerEle.find(".list");
        this.virtualList = vlist || new VirtualList({
            itemHeight: this.fontSize * 2,
            generatorFn: (i: number) => {
                const item: SlicerItem = this.virtualList.items[i];
                const ele = this.listItemFactory(item);
                ele.css({ height: `${this.virtualList.itemHeight - 4}px`, paddingBottom: "2.5px", paddingTop: "2px" });
                ele.on("mousedown", (e) => {
                    e.stopPropagation();
                    this.selectionMode = true;
                    this.selectionModeSelectItem(item);
                });
                ele.on("mouseover mouseenter", () => {
                    if (this.brushSelectionMode) {
                        this.selectionModeSelectItem(item);
                    }
                });
                ele.on("mouseup", () => {
                    this.selectionMode = false;
                });
                ele.data("item", item);
                if (item.onCreate) {
                    item.onCreate(ele);
                }
                // If we are selected
                ele.toggleClass("selected-slicer-item",
                    this.selectedItems.filter(n => n.equals(item)).length > 0 ||
                    this.selectionModeItems.filter(n => n.equals(item)).length > 0);
                item.$element = ele;
                return ele[0];
            },
        });
        this.fontSize = this.fontSize;

        this.virtualListEle = this.virtualList.container;
        this.virtualListEle.scroll(() => this.checkLoadMoreData());
        this.virtualListEle.on("mouseleave", () => {
            this.selectionMode = false;
        });

        this.listEle.append(this.virtualListEle);

        this.selectionsEle = element.find(".selections");

        const searchBox = element.find(".searchbox");

        // HAX: I am a strong, independent element and I don't need no framework tellin me how much focus I can have
        searchBox.on("mousedown mouseup click focus blur input pointerdown pointerup", e => e.stopPropagation());

        this.checkAllEle = element.find(".check-all").on("click", () => this.toggleSelectAll());
        this.clearAllEle = element.find(".clear-all").on("click", () => {
            this.searchString = "";
            this.clearSelection();
        });
        this.attachEvents();

        this.brushSelectionMode = false;

        // these two are here because the devtools call init more than once
        this.loadingMoreData = true;
    }

    /**
     * Selection mode is the mode in which the user can pre-select 1 or more items without affecting the userlying 
     * selectedItems array, until they leave selection mode
     */
    private _selectionMode = false;
    public get selectionMode() { return this._selectionMode; }

    /**
     * Setter for is in selection mode
     */
    public set selectionMode(value: boolean) {
        const wasBrushing = this._selectionMode;
        this._selectionMode = value;

        // If we were brushing, but we are not now
        if (wasBrushing && !this._selectionMode && this.selectionModeItems.length) {
            let final: SlicerItem[] = this.selectionModeItems.slice(0);
            if (!this.brushSelectionMode) {
                final = this.selectionModeItems.slice(0);
                let filtered = this.selectedItems.filter(n => {
                    // If we reselected a brushed item
                    const idx = _.findIndex(final, m => m.equals(n));
                    if (idx >= 0) {
                        final.splice(idx, 1);
                        return false;
                    }
                    return true;
                });
                final = filtered.concat(final);
            // User only selected a single item this item
            } else if (final.length === 1 && this.selectedItems.length === 1) {
                const idx = _.findIndex(this.selectedItems, m => m.equals(final[0]));
                // If the user has only selected a single item, and it is a selected item, then nuke it
                if (idx >= 0) {
                    final = this.selectedItems;
                    final.splice(idx, 1);
                }
            }
            this.selectedItems = final;
            this.selectionModeItems = [];
        } else if (value) {
            this.element.find(".item").removeClass("selected-slicer-item");
        }
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
    private _singleSelect = true;
    public set singleSelect(value: boolean) {
        this._singleSelect = value;

        // Cheat, reset it
        this.selectedItems = this.selectedItems.slice(0);
    }

    /**
     * Getter for single select
     */
    public get singleSelect() {
        return this._singleSelect;
    }

    /**
     * Setter for if the attribute slicer should use brush selection mode
     */
    private _brushSelectionMode = true;
    public set brushSelectionMode(value: boolean) {
        this._brushSelectionMode = value;
        this.element.toggleClass("brush-mode", value);
    }

    /**
     * Getter for should use brush selection mode
     */
    public get brushSelectionMode() {
        return this._brushSelectionMode;
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
        this._renderHorizontal = value;
        this.element.toggleClass("render-horizontal", value);
        this.updateListHeight();
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
    private _valueWidthPercentage: number = AttributeSlicer.DEFAULT_VALUE_WIDTH;
    public set valueWidthPercentage(value: number) {
        value = value ? Math.max(Math.min(value, 100), 10) : AttributeSlicer.DEFAULT_VALUE_WIDTH;
        this._valueWidthPercentage = value;
        this.resizeColumns();
    }

    /**
     * Setter for showing the values column
     */
    private _showValues = false;
    public set showValues(show: boolean) {
        this._showValues = show;
        this.element.toggleClass("has-values", show);
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
        this._showSelections = show;
        this.element.toggleClass("show-selections", show);
        this.syncItemVisiblity();
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
            this.loadingSearch = true;
            this.element.find(".searchbox").val(this.searchString);
            this.loadingSearch = false;
        }

        this._data = newData;

        this.virtualList.setItems(newData);

        this.syncItemVisiblity();
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
    private _fontSize: number = 12; // 12 px
    public get fontSize() {
        return this._fontSize;
    }

    /**
     * Setter for fontSize
     */
    public set fontSize(value: number) {
        this._fontSize = value || 12;
        this.slicerEle.css({
            fontSize: this._fontSize + "px"
        });
        if (this.virtualList) {
            this.virtualList.setItemHeight(this._fontSize * 2);
        }
    }

    /**
     * The list of selected items
     */
    private _selectedItems: SlicerItem[] = [];
    public get selectedItems(): SlicerItem[] {
        return this._selectedItems;
    }

    /**
     * Sets the set of selected items
     */
    public set selectedItems (value: SlicerItem[]) {
        let oldSelection = this.selectedItems.slice(0);
        if (this.singleSelect && value && value.length > 1) {
            // Create an array with only the last item added
            value = [value[value.length - 1]];
        }
        this._selectedItems = value;
        this.data.forEach(n => {
            this.getElementForItem(n)
                .toggleClass("selected-slicer-item", value.filter(m => m.equals(n)).length > 0);
        });

        // Important that these are always in sync, in case showSelections gets set to true
        if (value) {
            this.selectionsEle.find(".token").remove();
            value.map((v) => this.createSelectionToken(v)).forEach(n => n.appendTo(this.element.find(".selections")));
        }

        // We don't need to do any of this if show selections is off
        if (this.showSelections) {
            this.syncItemVisiblity();

            this.updateListHeight();
        }
        this.raiseSelectionChanged(this.selectedItems, oldSelection);

        // // HACK: They are all selected if it is the same length as our dataset
        // let allChecked = value && value.length === this.data.length;
        // let someChecked = value && value.length > 0 && !allChecked;
        // this.checkAllEle.prop("checked", someChecked);
        // this.checkAllEle.prop("indeterminate", someChecked);
    }

    /**
     * Gets the current serch value
     */
    public get searchString() {
        return this.element.find(".searchbox").val();
    }

    /**
     * Gets the current serch value
     */
    public set searchString(value: string) {
        this.element.find(".searchbox").val(value);
        this.handleSearchChanged();
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
     * Pretty prints a value
     */
    public static prettyPrintValue (val: any) {
        // Date check
        if (val && val.toISOString) {
            let dateVal = <Date>val;
            return (dateVal.getMonth() + 1) + "/" +
                    dateVal.getDate() + "/" +
                    dateVal.getFullYear() + " " +
                    dateVal.getHours() + ":" + dateVal.getMinutes() + (dateVal.getHours() >= 12 ? "PM" : "AM");
        }
        return /* tslint:disable */ val === null /* tslint:enable */|| val === undefined ? "" : val + "";
    }

    /**
     * Determines if the given slice item matches the given string value
     */
    public static isMatch(item: SlicerItem, matchValue: string, caseInsensitive: boolean) {
        const pretty = AttributeSlicer.prettyPrintValue;
        const searchStr = pretty(matchValue);
        const flags = caseInsensitive ? "i" : "";
        let regex = new RegExp(AttributeSlicer.escapeRegExp(searchStr), flags);
        // if (searchStr.indexOf("#R:") === 0) {
        //     try {
        //         regex = new RegExp(searchStr.substring(3), flags);
        //     } catch (e) { }
        // }
        return regex.test(pretty(item.match)) || regex.test(pretty(item.matchPrefix)) || regex.test(pretty(item.matchSuffix));
    }

    /**
     * Escapes RegExp
     */
    private static escapeRegExp(str: string) {
        return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
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
     * Selects an item in selection mode
     */
    public selectionModeSelectItem(item: SlicerItem) {
        // If we haven't already brushed this item
        if (this.selectionMode && this.selectionModeItems.filter(n => n.equals(item)).length === 0) {
            this.selectionModeItems.push(item);
            const ele = this.getElementForItem(item);
            ele.toggleClass("selected-slicer-item");
        }
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
            result: false
        };
        this.events.raiseEvent("canLoadMoreData", item, isSearch);
        return item.result;
    }

    /**
     * Raises the selectionChanged event
     */
    protected raiseSelectionChanged(newItems: SlicerItem[], oldItems: SlicerItem[]) {
        this.events.raiseEvent("selectionChanged", newItems, oldItems);
    }

    /**
     * Returns the correct element for the given item
     */
    private getElementForItem(item: SlicerItem) {
        return $(item.$element);//this.element.find(".item").filter((n, ele) => $(ele).data("item").equals(item));
    }

    /**
     * Resizes all of the visible columns
     */
    private resizeColumns() {
        let sizes = this.calcColumnSizes();
        this.element.find(".value-container").css({
            maxWidth: sizes.value + "%"
        });
        this.element.find(".category-container").css({
            maxWidth: sizes.category + "%"
        });
    }

    /**
     * Calculates the column sizes for both the value and category columns
     */
    private calcColumnSizes() {
        let remaining = 100 - this.valueWidthPercentage;
        return {
            value: this.showValues ? this.valueWidthPercentage : 0,
            category: this.showValues ? remaining : 100,
        };
    }

    /**
     * Syncs the item elements state with the current set of selected items and the search
     */
    private syncItemVisiblity() {
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
        if (this.virtualList) {
            this.virtualList.setItems(filteredData);
            this.virtualList.rerender();
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
        const pretty = AttributeSlicer.prettyPrintValue;
        const text = pretty(v.matchPrefix) + pretty(v.match) + pretty(v.matchSuffix);
        newEle
            .addClass("token")
            .attr("title", text)
            .data("item", v)
            .on("click", () => {
                newEle.remove();
                let item = this.selectedItems.filter(n => n.equals(v))[0];
                this.selectedItems.splice(this.selectedItems.indexOf(item), 1);
                this.selectedItems = this.selectedItems.slice(0);
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
        this.element.find(".searchbox").on("input", _.debounce(() => {
            if (!this.loadingSearch) {
                this.handleSearchChanged();
            }
        }, AttributeSlicer.SEARCH_DEBOUNCE));

        this.listEle.on("click", (evt) => {
            evt.stopImmediatePropagation();
            evt.stopPropagation();
        });
    }

    /**
     * Handles when the search is changed
     */
    private handleSearchChanged() {
        if (this.serverSideSearch) {
            setTimeout(() => this.checkLoadMoreDataBasedOnSearch(), 10);
        }
        // this is required because when the list is done searching it adds back in cached elements with selected flags
        this.syncItemVisiblity();
        this.element.toggleClass("has-search", !!this.searchString);
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
        }
    }
}

/**
 * Represents an item in the slicer
 */
export interface SlicerItem {
    /**
     * The actual match
     */
    match: any;

    matchPrefix?: any;
    matchSuffix?: any;

    /**
     * The color of the item
     */
    color?: string;

    /**
     * The raw value of this item
     */
    value: any;
    // selected: boolean;

    /**
     * Returns true if this == b
     */
    equals: (b: SlicerItem) => boolean;

    /**
     * Called when an item is created
     */
    onCreate?: (ele: JQuery) => void;

    /**
     * The sections that make up this items value, the total of the widths must === 100
     */
    sections?: ISlicerValueSection[];

    /**
     * The percentage value that should be displayed (0 - 100)
     * TODO: Better name, basically it is the value that should be displayed in the histogram
     */
    renderedValue?: number;

    // Special property for Attribute Slicer to optimize lookup
    $element?: JQuery;
}

export interface ISlicerValueSection {
    /**
     * The raw value of the section
     */
    value: any;

    /**
     * The display value of the section
     */
    displayValue: any;

    /**
     * The percentage width of this section
     */
    width: number;

    /**
     * The color of this section
     */
    color: string;
}
