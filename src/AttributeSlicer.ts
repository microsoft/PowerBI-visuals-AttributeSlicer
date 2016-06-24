import EventEmitter from "../base/EventEmitter";
import * as $ from "jquery";

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
                <div style="margin:0;padding:0;margin-top:5px;">
                <div class="selection-container">
                    <div class="selections">
                        <span class="clear-all">Clear All</span>
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
     * The template used to render list items
     */
    private listItemFactory = (item: SlicerItem) => {
        const { match, matchPrefix, matchSuffix, sections, value, renderedValue } = item;
        const pretty = AttributeSlicer.prettyPrintValue;
        const sizes = this.calcColumnSizes();
        const categoryStyle = `display:inline-block;overflow:hidden;max-width:${sizes.category}%`;
        return $(`
            <div style="white-space:nowrap" class="item">
                <label style="cursor:pointer">
                    <!--<input style="vertical-align:middle;cursor:pointer" type="checkbox">-->
                    <span style="margin-left: 5px;vertical-align:middle" class="display-container">
                        <span style="${categoryStyle}" title="${pretty(match)}" class="category-container">
                            <span class="matchPrefix">${pretty(matchPrefix)}</span>
                            <span class="match">${pretty(match)}</span>
                            <span class="matchSuffix">${pretty(matchSuffix)}</span>
                        </span>
                        <span style="display:inline-block;max-width:${sizes.value}%" class="value-container">
                            <span style="display:inline-block;width:${renderedValue}%">
                            ${
                                (sections || []).map(s => {
                                    let color = s.color;
                                    if (color) {
                                        color = `background-color:${color};`;
                                    }
                                    return `
                                        <span style="display:inline-block;width:${s.width}%;${color}" title="${s.value || "0"}" class="value-display">
                                            &nbsp;<span class="value">${s.value || "0"}</span>
                                        </span>
                                    `.trim().replace(/\n/g, "");
                                }).join("")
                            }
                            </span>
                        </span>
                    </span>
                </label>
            </div>
        `.trim().replace(/\n/g, ""));
    };

    /**
     * Constructor for the advanced slicer
     */
    constructor(element: JQuery, vlist?: any) {
        this.element = element;
        this.slicerEle = element.append($(AttributeSlicer.template)).find(".advanced-slicer");
        this.listEle = this.slicerEle.find(".list");
        this.virtualList = vlist || new VirtualList({
            itemHeight: 22,
            generatorFn: (i: number) => {
                const item: SlicerItem = this.virtualList.items[i];
                const ele = this.listItemFactory(item);
                ele.css({ height: "22px" });
                ele.data("item", item);
                return ele[0];
            },
        });

        this.virtualListEle = this.virtualList.container;
        this.virtualListEle.scroll(() => this.checkLoadMoreData());

        this.listEle.append(this.virtualListEle);

        this.selectionsEle = element.find(".selections");
        this.checkAllEle = element.find(".check-all").on("click", () => this.toggleSelectAll());
        this.clearAllEle = element.find(".clear-all").on("click", () => this.clearSelection());
        this.attachEvents();

        // these two are here because the devtools call init more than once
        this.loadingMoreData = true;
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
     * Setter for showing the selections area
     */
    public set showSelections(show: boolean) {
        this.element.toggleClass("show-selections", show);
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
        this._selectedItems = value;

        // HACK: They are all selected if it is the same length as our dataset
        let allChecked = value && value.length === this.data.length;
        let someChecked = value && value.length > 0 && !allChecked;

        this.syncItemVisiblity();

        if (value) {
            this.selectionsEle.find(".token").remove();
            value.map((v) => this.createSelectionToken(v)).forEach(n => n.insertBefore(this.element.find(".clear-all")));
        }

        this.updateListHeight();
        this.raiseSelectionChanged(this.selectedItems, oldSelection);

        this.checkAllEle.prop("checked", someChecked);
        this.checkAllEle.prop("indeterminate", someChecked);
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
            category: this.showValues ? remaining : 100
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
                let isVisible = !(!!this.selectedItems && this.selectedItems.filter(b => b.equals(item)).length > 0);

                // update the search
                if (isVisible && !this.serverSideSearch && this.searchString) {
                    isVisible = AttributeSlicer.isMatch(item, this.searchString, this.caseInsensitive);
                }
                return isVisible;
            });
        }
        this.virtualList.setItems(filteredData);
        if (this.virtualList) {
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
     * Updates the list height
     */
    private updateListHeight() {
        if (this.dimensions) {
            let slicerHeight = Math.floor(this.element.find(".slicer-options").height() - 10);
            let height = Math.floor(this.dimensions.height - slicerHeight) - 20;
            let width: number|string = "100%";
            this.listEle.css({ width: width, height: height });
                // .attr("dir", dir);
            this.virtualList.setHeight(height);
            this.virtualList.setDir(this.renderHorizontal);
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
            // let checkbox = $(evt.target);
            let ele = $((<HTMLElement>evt.target)).parents(".item");
            if (ele.length > 0) {
                let item: any = ele.data("item");
                this.selectedItems.push(item);
                this.selectedItems = this.selectedItems.slice(0);
                this.updateSelectAllButtonState();
            }
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
     * The sections that make up this items value, the total of the widths must === 100
     */
    sections?: ISlicerValueSection[];

    /**
     * The percentage value that should be displayed (0 - 100)
     * TODO: Better name, basically it is the value that should be displayed in the histogram
     */
    renderedValue?: number;
}

export interface ISlicerValueSection {
    /**
     * The raw value of the section
     */
    value: any;

    /**
     * The percentage width of this section
     */
    width: number;

    /** 
     * The color of this section
     */
    color: string;
}
