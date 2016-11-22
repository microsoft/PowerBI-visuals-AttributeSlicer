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
} from "essex.powerbi.base";
import { publishReplace, publishChange } from "pbi-stateful/src/stateful";
import { StatefulVisual } from "pbi-stateful/src/StatefulVisual";

import * as _ from "lodash";
import * as $ from "jquery";
const ldget = require("lodash.get");
import IVisualHostServices = powerbi.IVisualHostServices;
import DataView = powerbi.DataView;
import data = powerbi.data;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import PixelConverter = jsCommon.PixelConverter;

import { isStateEqual } from "../Utils";
import { default as converter, createItemFromSerializedItem } from "./dataConversion";
import capabilitiesData from "./AttributeSlicerVisual.capabilities";
import { createValueFormatter } from "./formatting";
import { ListItem, SlicerItem, IAttributeSlicerVisualData } from "./interfaces";
import { default as VisualState, calcStateDifferences } from "./state";
import { IAttributeSlicerState } from "../interfaces";
import { AttributeSlicer as AttributeSlicerImpl } from "../AttributeSlicer";
import SelectionManager = powerbi.visuals.utility.SelectionManager;
const log = logger("essex.widget.AttributeSlicerVisual");
const CUSTOM_CSS_MODULE = require("!css!sass!./css/AttributeSlicerVisual.scss");
const stringify = require("json-stringify-safe");

/* tslint:enable */

// PBI Swallows these
const EVENTS_TO_IGNORE = "mousedown mouseup click focus blur input pointerdown pointerup touchstart touchmove touchdown";

function hashString(input: string): number {
  "use strict";
  let hash = 0;
  if (input.length === 0) {
    return hash;
  }
  for (let i = 0, len = input.length; i < len; i++) {
    const chr   = input.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  log("Attribute Slicer Hashing [%s] => %s", input, hash);
  return hash;
}

@Visual(require("../build").output.PowerBI)
@receiveDimensions
@capabilities(capabilitiesData)
@receiveUpdateType(<any>{
    checkHighlights: true,
    ignoreCategoryOrder: false,
})
export default class AttributeSlicer extends StatefulVisual<IAttributeSlicerState> {

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
    private _internalState: VisualState;

    /**
     * Constructor
     */
    constructor(noCss = false) {
        super("Attribute Slicer", noCss);

        const className = CUSTOM_CSS_MODULE && CUSTOM_CSS_MODULE.locals && CUSTOM_CSS_MODULE.locals.className;
        if (className) {
            this.element.addClass(className);
        }

        // HACK: PowerBI Swallows these events unless we prevent propagation upwards
        this.element.on(EVENTS_TO_IGNORE, (e: any) => e.stopPropagation());
        this._internalState = VisualState.create() as VisualState;
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
    public onInit(options: powerbi.VisualInitOptions): void {
        this.host = options.host;
        this.selectionManager = new SelectionManager({
            hostServices: this.host,
        });
        this.propertyPersister = createPropertyPersister(this.host, 100);

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
    public onUpdate(options: powerbi.VisualUpdateOptions, updateType: UpdateType) {
        log("Update", options);

        // We should ALWAYS have a dataView, if we do not, PBI has not loaded yet
        const dv = this.dataView = options.dataViews && options.dataViews[0];
        if (dv) {
            const newState = this._internalState.receiveFromPBI(dv);
            this.loadDataFromVisualUpdate(updateType, options.type, dv, newState);
            this.loadStateFromVisualUpdate(newState, updateType);
        }
    }

    /**
     * Sets the given state into the attribute slicer
     */
    public onSetState(state: IAttributeSlicerState) {
        log("setstate ", state);

        // The old state passed in the params, is the old *cached* version, so if we change the state ourselves
        // Then oldState will not actually reflect the correct old state.
        // Since the other one is cached.
        if (!isStateEqual(state, this._internalState)) {
            state = _.cloneDeep(state);

            const oldState = this._internalState;

            // Set the state on the slicer
            this._internalState = this._internalState.receive(state);
            this.mySlicer.state = this._internalState;

            const { labelPrecision, labelDisplayUnits } = this._internalState;
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
            if (!oldState.colors.equals(this._internalState.colors)) {
                this.data = converter(this.dataView, undefined, undefined, this._internalState.colors);
                this.mySlicer.data = this.data.items;
                this.mySlicer.selectedItems = this._internalState.selectedItems.map(createItemFromSerializedItem);
            }

            this.mySlicer.scrollPosition = state.scrollPosition;
            this.writeCurrentStateToPBI();
        }
    }

    /**
     * Enumerates the instances for the objects that appear in the power bi panel
     */
    protected handleEnumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): powerbi.VisualObjectInstanceEnumeration {
        let instances = (super.handleEnumerateObjectInstances(options) || []) as VisualObjectInstance[];
        let builtObjects = this._internalState.buildEnumerationObjects(options.objectName, this.dataView, false);
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

    public areEqual(state1: IAttributeSlicerState, state2: IAttributeSlicerState): boolean {
        const s1Val = state1 && _.omit(state1, ["scrollPosition"]);
        const s2Val = state2 && _.omit(state2, ["scrollPosition"]);
        const result = isStateEqual(s1Val, s2Val);
        log("areEqual?::%s", result, state1, state2);
        return result;
    }

    public getHashCode(state: IAttributeSlicerState): number {
        if (!state) {
            return 0;
        }
        const toCompare = JSON.parse(stringify(state)) as IAttributeSlicerState;
         // Just get the id for comparison, the other stuff is basically computed
        toCompare.selectedItems = (toCompare.selectedItems || []).map(n => n.id);

        const orderedKeys = Object.keys(_.omit(toCompare, ["showSearch", "showValues", "scrollPosition"])).sort();
        const orderedPayload = orderedKeys.map((k) => {
            const value = stringify(toCompare[k]);
            return `${k}:${value}`;
        }).join(",");
        return hashString(orderedPayload);
    }

    /**
     * Gets the inline css used for this element
     */
    protected getCustomCssModules(): any[] {
        return [CUSTOM_CSS_MODULE];
    }

    /**
     * Generates a new state from the slicer state and the visual state
     */
    protected generateState() {
        const finalState = _.merge<IAttributeSlicerState>({},
            _.omit(this._internalState, "selectedItems"),
            _.omit(this.mySlicer.state, "selectedItems"));

        // Merge works weird on arrays
        finalState.selectedItems = _.cloneDeep(ldget(this.mySlicer, "state.selectedItems", []));

        this._internalState = this._internalState.receive(finalState);

        return this._internalState;
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

                const columnName = ldget(dv, "categorical.categories[0].source.queryName");

                // if the user has changed the categories, then selection is done for
                if (!columnName ||
                    (this.currentCategory && this.currentCategory !== columnName)) {
                    // This will really be undefined behaviour for pbi-stateful because this indicates the user changed datasets
                    log("Clearing Selection, Categories Changed");
                    pbiState.selectedItems = [];
                    pbiState.searchText = "";
                }

                this.currentCategory = columnName;
            }
        } else {
            this.mySlicer.data = [];
            pbiState.selectedItems = [];
        }
    }

    /**
     * Loads the given state from a visual update
     */
    private loadStateFromVisualUpdate(newState: VisualState, updateType: UpdateType) {

        // If the state has changed, then synchronize our state with it.
        if (!isStateEqual(this._internalState, newState)) {

            const differences: string[] =
                calcStateDifferences(this._internalState, newState)
                    .filter(n =>
                        n !== "searchText" &&
                        n !== "Selection" &&
                        n !== "showValues" &&
                        n !== "showSearch"); // These aren't really settings

            // New state has changed, so update the slicer
            log("PBI has changed, updating state");

            // The use of "state" here is important, because we want to load our internal state from this state
            this.state = VisualState.create(newState).toJSONObject();

            // If there are any settings updates
            if (differences.length && (updateType & UpdateType.Settings) === UpdateType.Settings) {
                const name = `Updated Settings ${ differences.length ? ": " + differences.join(", ") : "" }`;
                // ctrevino - Publishing a state change here causes invisible states to pop in with multiple visuals.
                (updateType === UpdateType.Settings ? publishChange : publishReplace)(this, name, newState);
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
            this.syncStateAndPublishChange(text);
            this.writeCurrentStateToPBI();
        },
    100);

    /**
     * Listener for when the selection changes
     */
    private onSelectionChanged(newItems: ListItem[]) {
        if (!this.isHandlingSetState && !this.isHandlingUpdate) {
            this._onSelectionChangedDebounced(newItems);
        }
    }

    /**
     * Listener for searches being performed
     */
    private onSearchPerformed(searchText: string) {
        if (!this.isHandlingSetState) {
            const text = searchText && searchText.length ? `Search for "${searchText}"` : "Clear Search";
            this.syncStateAndPublishChange(text);
        }
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
     * Sets the given state and calls publishChange to announce the change that caused this state
     */
    private syncStateAndPublishChange(text: string) {
        this.state = this.generateState().toJSONObject();
        const scrollPosition = this.mySlicer.scrollPosition;
        this._internalState = this._internalState.receive({ scrollPosition });
        publishChange(this, text, this._internalState);
    }

    /**
     * Syncs the given state back to PBI
     */
    private writeCurrentStateToPBI() {
        const state = this._internalState;
        log("AttributeSlicer loading state into PBI", state);
        if (state && this.host) {
            // Restoring selection into PBI
            this.selectionManager.clear();
            const ids = getSelectionIdsFromSelectors((state.selectedItems || []).map(n => n.selector));
            ids.forEach(n => {
                this.selectionManager.select(n, true);
            });
            this.propertyPersister.persist(false, state.buildPersistObjects(this.dataView, true));
        }
    }
}
