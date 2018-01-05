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
    logger,
    PropertyPersister,
    createPropertyPersister,
    UpdateType,
    receiveDimensions,
    calcUpdateType,
    computeRenderedValues,
    buildContainsFilter,
} from "@essex/visual-utils";
import "./powerbi";
import * as _ from "lodash";
import * as $ from "jquery";
import { isStateEqual, AttributeSlicer as AttributeSlicerImpl } from "@essex/attribute-slicer";
import { default as converter, createItemFromSerializedItem } from "./dataConversion";
import { createValueFormatter } from "./formatting";
import { ListItem, SlicerItem, IAttributeSlicerVisualData } from "./interfaces";
import { default as VisualState } from "./state";
import * as models from "powerbi-models";

/* tslint:disable */
const ldget = require("lodash.get");
const log = logger("essex.widget.AttributeSlicerVisual");
const CUSTOM_CSS_MODULE = require("!css-loader!sass-loader!./css/AttributeSlicerVisual.scss");
const stringify = require("json-stringify-safe");
/* tslint:enable */

// // PBI Swallows these
const EVENTS_TO_IGNORE = "mousedown mouseup click focus blur input pointerdown pointerup touchstart touchmove touchdown";

@receiveDimensions
export default class AttributeSlicer implements powerbi.extensibility.visual.IVisual {

    /**
     * My AttributeSlicer
     */
    protected mySlicer: AttributeSlicerImpl;

    /**
     * A callback after an update has happened
     */
    private onNextUpdate: () => any;

    /**
     * The current dataView
     */
    private dataView: powerbi.DataView;

    /**
     * The host of the visual
     */
    private host: powerbi.extensibility.visual.IVisualHost;

    /**
     * The visuals element
     */
    private element: JQuery;

    /**
     * The deferred used for loading additional data into attribute slicer
     */
    private loadDeferred: JQueryDeferred<SlicerItem[]>;

    /**
     * The current category that the user added
     */
    private currentCategory: any;

    /*
     * The current set of cacheddata
     */
    private data: IAttributeSlicerVisualData;

    /**
     * A property persister
     */
    private propertyPersister: PropertyPersister;

    /**
     * The selection manager for PBI
     */
    private selectionManager: powerbi.extensibility.ISelectionManager;

    /**
     * The current state of this visual
     */
    private state: VisualState;

    /**
     * Whether or not we are currently handling an update call
     */
    private isHandlingUpdate: boolean;

    /**
     * The previous update options
     */
    private prevUpdateOptions: powerbi.extensibility.visual.VisualUpdateOptions;

    /**
     * Constructor
     */
    constructor(options: powerbi.extensibility.visual.VisualConstructorOptions, noCss = false) {
        this.state = VisualState.create() as VisualState;
        this.host = options.host;
        this.element = $("<div></div>");

        // Add to the container
        options.element.appendChild(this.element[0]);

        this.selectionManager = this.host.createSelectionManager();
        this.propertyPersister = createPropertyPersister(this.host, 100);

        const className = CUSTOM_CSS_MODULE && CUSTOM_CSS_MODULE.locals && CUSTOM_CSS_MODULE.locals.className;
        if (className) {
            $(options.element).append($("<st" + "yle>" + CUSTOM_CSS_MODULE + "</st" + "yle>"));
            this.element.addClass(className);
        }

        // HACK: PowerBI Swallows these events unless we prevent propagation upwards
        this.element.on(EVENTS_TO_IGNORE, (e: any) => e.stopPropagation());

        const slicerEle = $("<div>");
        this.element.append(slicerEle);
        const mySlicer = new AttributeSlicerImpl(slicerEle);
        mySlicer.serverSideSearch = true;
        mySlicer.events.on("loadMoreData", this.onLoadMoreData.bind(this));
        mySlicer.events.on("canLoadMoreData", this.onCanLoadMoreData.bind(this));
        mySlicer.events.on("selectionChanged", this.onSelectionChanged.bind(this));
        mySlicer.events.on("searchPerformed", this.onSearchPerformed.bind(this));

        // Hide the searchbox by default
        mySlicer.showSearchBox = false;
        this.mySlicer = mySlicer;
    }

    /**
     * Called when the dimensions of the visual have changed
     */
    public setDimensions(value: {width: number, height: number}) {
        if (this.mySlicer) {
            this.mySlicer.dimensions = value;
        }
    }

    /**
     * Update function for when the visual updates in any way
     * @param options The update options
     * @param type The optional update type being passed to update
     */
    public update(options: powerbi.extensibility.visual.VisualUpdateOptions, type?: UpdateType) {
        // Do the callback
        if (this.onNextUpdate) { this.onNextUpdate(); }

        this.isHandlingUpdate = true;
        const updateType = type !== undefined ? type : calcUpdateType(this.prevUpdateOptions, options);
        this.prevUpdateOptions = options;
        try {
            log("Update", options);

            if (updateType === UpdateType.Resize) {
                this.setDimensions(options.viewport);
            }

            // We should ALWAYS have a dataView, if we do not, PBI has not loaded yet
            const dv = this.dataView = options.dataViews && options.dataViews[0];

            // For some reason, there are situations in where you have a dataView, but it is missing data!
            if (dv && dv.categorical) {
                const newState = <VisualState>VisualState.createFromPBI(dv);
                this.loadDataFromVisualUpdate(updateType, options.type, dv, newState);

                // The old state passed in the params, is the old *cached* version, so if we change the state ourselves
                // Then oldState will not actually reflect the correct old state.
                // Since the other one is cached.
                if (!isStateEqual(newState, this.state)) {
                    const oldState = this.state;

                    this.state = newState;
                    this.mySlicer.state = this.state;

                    const { labelPrecision, labelDisplayUnits } = this.state;
                    if ((labelPrecision || labelDisplayUnits) && this.mySlicer.data) {
                        const formatter = createValueFormatter(labelDisplayUnits, labelPrecision);

                        // Update the display values in the datas
                        this.mySlicer.data.forEach(n => {
                            (n.valueSegments || []).forEach(segment => {
                                segment.displayValue = formatter.format(segment.value);
                            });
                        });

                        // Tell the slicer to repaint
                        this.mySlicer.refresh();
                    }

                    // The colors have changed, so we need to reload data
                    if (!oldState.colors.equals(newState.colors)) {
                        this.data = this.convertData(dv, this.state);
                        this.mySlicer.data = this.data.items;
                        this.mySlicer.selectedItems = this.state.selectedItems.map(createItemFromSerializedItem);
                    }
                    this.mySlicer.scrollPosition = newState.scrollPosition;
                }
            }
        } finally {
            this.isHandlingUpdate = false;
        }
    }

    /**
     * Enumerates the instances for the objects that appear in the power bi panel
     */
    public enumerateObjectInstances(options: powerbi.EnumerateVisualObjectInstancesOptions): powerbi.VisualObjectInstanceEnumeration {
        let instances = [] as powerbi.VisualObjectInstance[];
        let builtObjects = this.state.buildEnumerationObjects(options.objectName, this.dataView, false);
        return instances.concat(builtObjects);
    }

    /**
     * Gets called when PBI destroys this visual
     */
    public destroy() {
        if (this.mySlicer) {
            this.mySlicer.destroy();
        }
    }

    /**
     * Checks whether or not to load data from the dataView
     */
    private loadDataFromVisualUpdate(
        updateType: UpdateType,
        pbiUpdateType: powerbi.VisualUpdateType,
        dv: powerbi.DataView,
        pbiState: VisualState) {
        // Load data if the data has definitely changed, sometimes however it hasn't actually changed
        // ie search for Microsof then Microsoft
        if (dv) {
            if (this.shouldLoadDataIntoSlicer(updateType, pbiState, pbiUpdateType)) {
                const data = this.convertData(dv, pbiState);
                log("Loading data from PBI");

                this.data = data || { items: [], segmentInfo: [] };
                let filteredData = this.data.items.slice(0);

                // If we are appending data for the attribute slicer
                if (this.loadDeferred && this.mySlicer.data && !this.loadDeferred["search"]) {
                    // we only need to give it the new items
                    this.loadDeferred.resolve(filteredData.slice(this.mySlicer.data.length));
                    delete this.loadDeferred;

                    // Recompute the rendered values, cause otherwise only half will have the updated values
                    // because the min/max of all the columns change when new data is added.
                    computeRenderedValues(this.mySlicer.data as ListItem[]);

                    this.mySlicer.refresh();
                } else {
                    this.mySlicer.data = filteredData;

                    // Restore selection
                    this.mySlicer.selectedItems = (pbiState.selectedItems || []).map(createItemFromSerializedItem);

                    delete this.loadDeferred;
                }

                const columnNames: Array<String> = [];
                _.forOwn(ldget(dv, "categorical.categories"), (value, key: any) => {
                    columnNames.push(value.source.queryName);
                });

                // Only clear selection IF
                // We've already loaded a dataset, and the user has changed the dataset to something else
                if (this.currentCategory && !_.isEqual(this.currentCategory, columnNames))  {
                    // This will really be undefined behaviour for pbi-stateful because this indicates the user changed datasets
                    if (!_.isEqual(pbiState.selectedItems, [])) {
                        log("Clearing Selection, Categories Changed");
                        pbiState.selectedItems = [];
                        this._onSelectionChangedDebounced([]);
                    }
                    if (pbiState.searchText !== "") {
                        log("Clearing Search, Categories Changed");
                        pbiState.searchText = "";
                        this.onSearchPerformed("");
                    }
                }

                this.currentCategory = columnNames;
            }
        } else {
            this.mySlicer.data = [];
            pbiState.selectedItems = [];
        }
    }

    /**
     * Converts the data from the dataview into a format that the slicer can consume
     * @param dv The dataview to load the data from
     * @param state The current state
     */
    private convertData(dv: powerbi.DataView, state: VisualState) {
        const { labelDisplayUnits, labelPrecision } = state;
        let formatter: any;
        if (labelDisplayUnits || labelPrecision) {
            formatter = createValueFormatter(labelDisplayUnits, labelPrecision);
        }
        if (state.hideEmptyItems) {
            this.zeroEmptyItems(dv);
        }

        const createSelectionIdBuilder = this.host.createSelectionIdBuilder ? () => this.host.createSelectionIdBuilder() : undefined;
        const listItems = converter(dv, formatter, undefined, state.colors, createSelectionIdBuilder);
        if (state.hideEmptyItems) {
            listItems.items = listItems.items.filter(item => item.match && item.match.trim() !== "");
        }
        return listItems;
    }

    /**
     * Zero out values for blank categories so they won't affect
     * value bar width calculations.
     * @param dv
     */
    private zeroEmptyItems(dv: powerbi.DataView) {
        let categories = dv.categorical.categories[0].values;
        for (let i in categories) {
            if (!categories[i] || categories[i].toString().trim().length === 0) {
                for (let dataColumn of dv.categorical.values) {
                    if (dataColumn.values && dataColumn.values[i]) {
                        dataColumn.values[i] = 0;
                    }
                }
            }
        }
    }

    /* tslint:disable */
    /**
     * The debounced version of the selection changed
     */
    private _onSelectionChangedDebounced = _.debounce( /* tslint:enable */
        (selectedItems: ListItem[]) => {
            log("onSelectionChanged");
            const selection = selectedItems.map(n => n.match).join(", ");
            const text = selection && selection.length ? `Select ${selection}` : "Clear Selection";
            this.state.selectedItems = selectedItems;
            this.writeStateToPBI(text);
        },
    100);

    /**
     * Listener for when the selection changes
     */
    private onSelectionChanged(newItems: ListItem[]) {
        if (!this.isHandlingUpdate) {
            this._onSelectionChangedDebounced(newItems);
        }
    }

    /**
     * Listener for searches being performed
     */
    private onSearchPerformed(searchText: string) {
        const text = searchText && searchText.length ? `Search for "${searchText}"` : "Clear Search";
        this.state.searchText = searchText;
        this.writeStateToPBI(text);
    }

    /**
     * Listener for can load more data
     */
    private onCanLoadMoreData(item: any, isSearch: boolean) {
        return item.result = !!this.dataView && (isSearch || !!this.dataView.metadata.segment);
    }

    /**
     * Listener for when loading more data
     */
    private onLoadMoreData(item: any, isSearch: boolean) {
        const loadMoreData = () => {
            if (this.host["loadMoreData"]) {
                this.host["loadMoreData"]();
            } else {
                const selManagerHost = this.selectionManager && this.selectionManager["hostServices"];
                if (selManagerHost && selManagerHost.loadMoreData) {
                    selManagerHost.loadMoreData();
                }
            }
        };

        if (isSearch) {
            // Set the search filter on PBI
            const filter = buildContainsFilter(this.dataView.categorical.categories[0].source, this.mySlicer.searchString);
            const hasFilter = filter && filter.conditions.length > 0;
            this.state.searchText = this.mySlicer.searchString;

            let objects: powerbi.VisualObjectInstancesToPersist = this.state.buildPersistObjects(this.dataView, true);
            this.host.applyJsonFilter(
                hasFilter ? filter : null, // tslint:disable-line
                "general",
                "selfFilter",
                hasFilter ? powerbi.FilterAction.merge : powerbi.FilterAction.remove);

            this.host.persistProperties(objects);

            // Set up the load deferred, and load more data
            this.loadDeferred = $.Deferred();

            // Let the loader know that it is a search
            this.loadDeferred["search"] = true;
            item.result = this.loadDeferred.promise();
        } else if (this.dataView.metadata.segment) {
            let alreadyLoading = !!this.loadDeferred;
            if (this.loadDeferred) {
                this.loadDeferred.reject();
            }

            this.loadDeferred = $.Deferred();
            item.result = this.loadDeferred.promise();
            if (!alreadyLoading) {
                log("Loading more data");
                loadMoreData();
            }
        }
    }

    /**
     * A function used to determine whether or not a data update should be performed
     */
    private shouldLoadDataIntoSlicer(updateType: UpdateType, pbiState: VisualState, pbiUpdateType: powerbi.VisualUpdateType) {
        const isDataLoad = (updateType & UpdateType.Data) === UpdateType.Data;
        // If there is a new dataset from PBI
        return (isDataLoad ||
                // If attribute slicer requested more data, but the data actually hasn't changed
                // (ie, if you search for Microsof then Microsoft, most likely will return the same dataset)
                this.loadDeferred);
    }

    /**
     * Writes our current state back to powerbi.
     */
    private writeStateToPBI(text: string) {
        this.state.scrollPosition = this.mySlicer.scrollPosition;

        const state = this.state;
        log("AttributeSlicer loading state into PBI", state);
        if (state && this.host) {
            // Restoring selection into PBI
            let objects: powerbi.VisualObjectInstancesToPersist = state.buildPersistObjects(this.dataView, true);
            const selItems = state.selectedItems || [];
            const categories: powerbi.DataViewCategoricalColumn = this.dataView.categorical.categories[0];
            const target: models.IFilterColumnTarget = {
                table: categories.source.queryName.substr(0, categories.source.queryName.indexOf(".")),
                column: categories.source.displayName,
            };

            const filter = new models.BasicFilter(
                target,
                "In",
                selItems.map(n => n.match)
            );

            // The *only* reason this is necessary is because for some reason when
            // we do persistProperties & applyJsonFilter back to back, it was causing
            // the data within attribute slicer to switch out with data that is later in the data set
            // kind of like if a loadMoreData was called after the applyJsonFilter
            let triggered = false;
            const applyFilter = this.onNextUpdate = () => {
                delete this.onNextUpdate;
                if (!triggered) {
                    triggered = true;
                    const action = selItems.length > 0 ? powerbi.FilterAction.merge : powerbi.FilterAction.remove;
                    this.host.applyJsonFilter(filter, "general", "filter", action);
                }
            };

            // Persist those properties, which should initiate an update call
            this.host.persistProperties(objects);

            // Auto trigger if not already run
            setTimeout(() => applyFilter, 200);
        }
    }
}
