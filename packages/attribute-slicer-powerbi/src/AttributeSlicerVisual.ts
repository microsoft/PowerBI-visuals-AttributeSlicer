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

/* tslint:disable */
import {
    createPersistObjectBuilder,
    buildContainsFilter,
    logger,
    capabilities,
    PropertyPersister,
    createPropertyPersister,
    Visual,
    UpdateType,
    receiveUpdateType,
    IDimensions,
    receiveDimensions,
    IReceiveDimensions,
    getSelectionIdsFromSelectors,
    getSetting,
    computeRenderedValues,
    VisualBase,
} from "@essex/pbi-base";
import { publishReplace, publishChange } from "@essex/pbi-stateful/lib/stateful";
import * as _ from "lodash";
import * as $ from "jquery";
const ldget = require("lodash.get");
import IVisualHostServices = powerbi.IVisualHostServices;
import DataView = powerbi.DataView;
import data = powerbi.data;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import PixelConverter = jsCommon.PixelConverter;

import { isStateEqual, IAttributeSlicerState, AttributeSlicer as AttributeSlicerImpl } from "@essex/attribute-slicer";
import { default as converter, createItemFromSerializedItem } from "./dataConversion";
import capabilitiesData from "./AttributeSlicerVisual.capabilities";
import { createValueFormatter } from "./formatting";
import { ListItem, SlicerItem, IAttributeSlicerVisualData } from "./interfaces";
import { default as VisualState, calcStateDifferences } from "./state";
import SelectionManager = powerbi.visuals.utility.SelectionManager;
const log = logger("essex.widget.AttributeSlicerVisual");
const CUSTOM_CSS_MODULE = require("!css!sass!./css/AttributeSlicerVisual.scss");
const stringify = require("json-stringify-safe");

/* tslint:enable */

// PBI Swallows these
const EVENTS_TO_IGNORE = "mousedown mouseup click focus blur input pointerdown pointerup touchstart touchmove touchdown";

@Visual(require("./build").output.PowerBI)
@receiveDimensions
@capabilities(capabilitiesData)
@receiveUpdateType(<any>{
    checkHighlights: true,
    ignoreCategoryOrder: false,
})
export default class AttributeSlicer extends VisualBase {

    /**
     * My AttributeSlicer
     */
    protected mySlicer: AttributeSlicerImpl;

    /**
     * The current dataView
     */
    private dataView: DataView;

    /**
     * The host of the visual
     */
    private host: IVisualHostServices;

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
    private selectionManager: SelectionManager;

    /**
     * The current state of this visual
     */
    private state: VisualState;

    /**
     * Whether or not we are currently handling an update call
     */
    private isHandlingUpdate: boolean;

    /**
     * Constructor
     */
    constructor(noCss = false) {
        super("Attribute Slicer", noCss);
        this.state = VisualState.create() as VisualState;
    }

    /**
     * Gets the template associated with the visual
     */
    public get template() {
        return "<div></div>";
    }

    /**
     * Called when the visual is being initialized
     */
    public init(options: powerbi.VisualInitOptions): void {
        super.init(options);
        this.host = options.host;
        this.selectionManager = new SelectionManager({
            hostServices: this.host,
        });
        this.propertyPersister = createPropertyPersister(this.host, 100);

        const className = CUSTOM_CSS_MODULE && CUSTOM_CSS_MODULE.locals && CUSTOM_CSS_MODULE.locals.className;
        if (className) {
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
     * Called when the visual is being updated
     */
    public updateWithType(options: powerbi.VisualUpdateOptions, updateType: UpdateType) {
        super.updateWithType(options, updateType);

        this.isHandlingUpdate = true;
        try {
            log("Update", options);

            if (updateType === UpdateType.Resize) {
                this.setDimensions(options.viewport);
            }

            // We should ALWAYS have a dataView, if we do not, PBI has not loaded yet
            const dv = this.dataView = options.dataViews && options.dataViews[0];
            if (dv) {
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
                        this.data = converter(this.dataView, undefined, undefined, this.state.colors);
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
    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): powerbi.VisualObjectInstanceEnumeration {
        let instances = (super.enumerateObjectInstances(options) || []) as VisualObjectInstance[];
        let builtObjects = this.state.buildEnumerationObjects(options.objectName, this.dataView, false);
        return instances.concat(builtObjects);
    }

    /**
     * Gets called when PBI destroys this visual
     */
    public destroy() {
        super.destroy();
        if (this.mySlicer) {
            this.mySlicer.destroy();
        }
    }

    /**
     * Gets the inline css used for this element
     */
    protected getCss(): any[] {
        return super.getCss().concat([CUSTOM_CSS_MODULE + ""]);
    }

    /**
     * Checks whether or not to load data from the dataView
     */
    private loadDataFromVisualUpdate(
        updateType: UpdateType,
        pbiUpdateType: powerbi.VisualUpdateType,
        dv: DataView,
        pbiState: VisualState) {
        // Load data if the data has definitely changed, sometimes however it hasn't actually changed
        // ie search for Microsof then Microsoft
        if (dv) {
            if (this.shouldLoadDataIntoSlicer(updateType, pbiState, pbiUpdateType)) {
                const data = converter(dv, undefined, undefined, pbiState.colors);

                log("Loading data from PBI");

                this.data = data || { items: [], segmentInfo: [] };
                let filteredData = this.data.items.slice(0);

                // If we are appending data for the attribute slicer
                if (this.loadDeferred && this.mySlicer.data && !this.loadDeferred["search"]) {
                    // we only need to give it the new items
                    this.loadDeferred.resolve(filteredData.slice(this.mySlicer.data.length));
                    delete this.loadDeferred;

                    // Recompute the rendered values, cause otherwise only half will have the updated values
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
                    log("Clearing Selection, Categories Changed");
                    if (!_.isEqual(pbiState.selectedItems, [])) {
                        pbiState.selectedItems = [];
                        this._onSelectionChangedDebounced([]);
                    }
                    pbiState.searchText = "";
                }

                this.currentCategory = columnNames;
            }
        } else {
            this.mySlicer.data = [];
            pbiState.selectedItems = [];
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
        if (isSearch) {
            // Set the search filter on PBI
            const builder = createPersistObjectBuilder();
            const filter = buildContainsFilter(ldget(this.dataView, "categorical.categories[0].source"), this.mySlicer.searchString);
            builder.persist("general", "selfFilter", filter);
            this.propertyPersister.persist(false, builder.build());

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
                this.host.loadMoreData();
                log("Loading more data");
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
        const scrollPosition = this.mySlicer.scrollPosition;
        this.state = this.state.receive({ scrollPosition });

        const state = this.state;
        log("AttributeSlicer loading state into PBI", state);
        if (state && this.host) {
            // Restoring selection into PBI
            const highlight = false;
            let objects: powerbi.VisualObjectInstancesToPersist = state.buildPersistObjects(this.dataView, true);
            let selection = false;
            const ids = getSelectionIdsFromSelectors((state.selectedItems || []).map(n => n.selector));
            if (highlight) {
                const currentlySelIds = this.selectionManager.getSelectionIds() || [];
                const toSelect = ids.filter(n => !currentlySelIds.some(m => m.equals(n)));
                const toDeselect = currentlySelIds.filter(n => !ids.some(m => m.equals(n)));
                toSelect.concat(toDeselect).forEach(n => {
                    this.selectionManager.select(n, true);
                });
            } else {
                selection = true;
                let filter: any;
                if (ids && ids.length) {
                    let selectors = ids.map(n => n.getSelector());
                    filter = data.Selector.filterFromSelector(selectors);
                }
                let operation = filter ? "merge" : "remove";
                const opObjs = objects[operation] = objects[operation] || [];
                opObjs.push(<powerbi.VisualObjectInstance>{
                    objectName: "general",
                    selector: undefined,
                    properties: {
                        filter,
                    },
                });
            }

            this.propertyPersister.persist(selection, objects);
        }
    }
}
