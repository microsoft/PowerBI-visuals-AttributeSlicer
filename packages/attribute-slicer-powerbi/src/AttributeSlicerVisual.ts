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
import "regenerator-runtime/runtime";

import "core-js/stable";

/**
 * Attribute slicer visual
 */
import {
	AttributeSlicer as AttributeSlicerImpl,
	IItemReference,
	isStateEqual,
} from "@essex/attribute-slicer";
import { converter } from "./dataConversion";
import { createValueFormatter } from "./formatting";
import {
	IAttributeSlicerVisualData,
	ISlicerItem,
	ListItem,
	IValueSegment,
} from "./interfaces";

// tslint:disable-next-line:import-name
import AttributeSlicerVisualState from "./state";
import lodashForown from "lodash.forown";
import lodashGet from "lodash.get";
import lodashIsequal from "lodash.isequal";
import powerbiVisualsApi from "powerbi-visuals-api";
import { valueFormatter } from "powerbi-visuals-utils-formattingutils";
import { create, select, Selection } from "d3-selection";
import debug from "debug";

const log = debug("essex.widget.AttributeSlicerVisual");
import "./css/AttributeSlicerVisual.less";

import { computeRenderedValues } from "./visual-utils/convertItemsWithSegments";
import buildContainsFilter from "./visual-utils/buildContainsFilter";
import { BasicFilter, AdvancedFilter } from "powerbi-models";
import buildColumnTarget from "./visual-utils/buildColumnTarget";

import VisualUpdateOptions = powerbiVisualsApi.extensibility.visual.VisualUpdateOptions;
import VisualUpdateType = powerbiVisualsApi.VisualUpdateType;
import DataView = powerbiVisualsApi.DataView;
import IValueFormatter = valueFormatter.IValueFormatter;
import IVisualEventService = powerbiVisualsApi.extensibility.IVisualEventService;

export class AttributeSlicerVisual
	implements powerbiVisualsApi.extensibility.visual.IVisual {
	private events: IVisualEventService;

	/**
	 * My AttributeSlicer
	 */
	protected mySlicer: AttributeSlicerImpl;

	/**
	 * The current dataView
	 */
	private dataView: powerbiVisualsApi.DataView;

	/**
	 * The host of the visual
	 */
	private host: powerbiVisualsApi.extensibility.visual.IVisualHost;

	/**
	 * The visuals element
	 */
	private element: Selection<HTMLDivElement, undefined, null, undefined>;

	/**
	 * The deferred used for loading additional data into attribute slicer
	 */
	private loadDeferred: PromiseLike<ISlicerItem[]> & {
		search?: boolean;
		resolve: (items: ListItem[]) => any;
	};

	/**
	 * The current category that the user added
	 */
	private currentCategory: unknown;

	/*
	 * The current set of cacheddata
	 */
	private data: IAttributeSlicerVisualData;

	/**
	 * The selection manager for PBI
	 */
	private selectionManager: powerbiVisualsApi.extensibility.ISelectionManager;

	/**
	 * The current state of this visual
	 */
	private state: AttributeSlicerVisualState;

	/**
	 * Whether or not we are currently handling an update call
	 */
	private isHandlingUpdate: boolean;

	private dims?: { width: number; height: number };

	/**
	 * Constructor
	 */
	constructor(
		options: powerbiVisualsApi.extensibility.visual.VisualConstructorOptions,
	) {
		this.state = AttributeSlicerVisualState.CREATE();
		this.host = options.host;
		this.element = create("div");
		this.events = this.host.eventService;

		// Add to the container
		options.element.appendChild(this.element.node());

		this.selectionManager = this.host.createSelectionManager();

		const slicerEle = this.element.append("div");
		const mySlicer: AttributeSlicerImpl = new AttributeSlicerImpl(slicerEle);
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
	 * Update function for when the visual updates in any way
	 * @param options The update options
	 * @param type The optional update type being passed to update
	 */
	public update(options: VisualUpdateOptions): void {
		this.events.renderingStarted(options);

		this.isHandlingUpdate = true;

		const isAllUpdate = options.type === VisualUpdateType.All;
		const isResizeUpdate =
			!this.dims ||
			this.dims.height !== options.viewport.height ||
			this.dims.width !== options.viewport.width;
		const isDataUpdate = options.type === VisualUpdateType.Data || isAllUpdate;
		try {
			if (isResizeUpdate) {
				this.dims = options.viewport;
				this.mySlicer.dimensions = options.viewport;
			}

			// We should ALWAYS have a dataView, if we do not, PBI has not loaded yet
			const dv: DataView | undefined = (this.dataView =
				options.dataViews && options.dataViews[0]);

			// For some reason, there are situations in where you have a dataView, but it is missing data!
			if (dv && dv.categorical) {
				const newState: AttributeSlicerVisualState = AttributeSlicerVisualState.CREATE_FROM_POWERBI(
					dv,
					() => this.host.createSelectionIdBuilder(),
				);
				this.loadDataFromVisualUpdate(isDataUpdate, dv, newState);

				// The old state passed in the params, is the old *cached* version,
				// so if we change the state ourselves, then oldState will not actually
				// reflect the correct old state. Since the other one is cached.
				if (!isStateEqual(newState, this.state)) {
					const oldState: AttributeSlicerVisualState = this.state;
					this.state = newState;
					this.mySlicer.state = newState;

					const { labelPrecision, labelDisplayUnits } = this.state;
					if ((labelPrecision || labelDisplayUnits) && this.mySlicer.data) {
						const formatter: IValueFormatter = createValueFormatter(
							labelDisplayUnits,
							labelPrecision,
						);

						// Update the display values in the datas
						this.mySlicer.data.forEach((n: ISlicerItem) => {
							(n.valueSegments || []).forEach((segment: IValueSegment) => {
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
						this.mySlicer.selectedItems = (
							this.state.selectedItems || []
						).slice(0); // make a copy
					}
					this.mySlicer.scrollPosition = newState.scrollPosition;
				}
			}
		} finally {
			this.isHandlingUpdate = false;
			this.events.renderingFinished(options);
		}
	}

	/**
	 * Enumerates the instances for the objects that appear in the power bi panel
	 */
	public enumerateObjectInstances(
		options: powerbiVisualsApi.EnumerateVisualObjectInstancesOptions,
	): powerbiVisualsApi.VisualObjectInstanceEnumeration {
		return this.state.buildEnumerationObjects(
			options.objectName,
			this.dataView,
			false,
		);
	}

	/**
	 * Gets called when PBI destroys this visual
	 */
	public destroy(): void {
		if (this.mySlicer) {
			this.mySlicer.destroy();
		}
	}

	/**
	 * Checks whether or not to load data from the dataView
	 */
	private loadDataFromVisualUpdate(
		isDataLoad: boolean,
		dv: powerbiVisualsApi.DataView,
		pbiState: AttributeSlicerVisualState,
	) {
		// Load data if the data has definitely changed, sometimes however it hasn't actually changed
		// ie search for Microsof then Microsoft
		if (dv) {
			if (this.shouldLoadDataIntoSlicer(pbiState, isDataLoad)) {
				const data = this.convertData(dv, pbiState);
				log("Loading data from PBI");

				this.data = data;
				const filteredData = this.data.items.slice(0);

				// If we are appending data for the attribute slicer
				if (
					this.loadDeferred &&
					this.mySlicer.data &&
					!this.loadDeferred.search
				) {
					// we only need to give it the new items
					this.loadDeferred.resolve(
						filteredData.slice(this.mySlicer.data.length),
					);
					delete this.loadDeferred;

					// Recompute the rendered values, cause otherwise only half will have the updated values
					// because the min/max of all the columns change when new data is added.
					computeRenderedValues(<any>this.mySlicer.data);

					this.mySlicer.refresh();
				} else {
					this.mySlicer.data = filteredData;

					// Restore selection
					this.mySlicer.selectedItems = (pbiState.selectedItems || []).slice(0); // Make a copy

					delete this.loadDeferred;
				}

				const columnNames: string[] = [];
				lodashForown(
					lodashGet(dv, "categorical.categories"),
					(value, key: any) => {
						columnNames.push(value.source.queryName);
					},
				);

				// Only clear selection IF
				// We've already loaded a dataset, and the user has changed the dataset to something else
				if (
					this.currentCategory &&
					!lodashIsequal(this.currentCategory, columnNames)
				) {
					// This will really be undefined behaviour for pbi-stateful
					// because this indicates the user changed datasets
					if (!lodashIsequal(pbiState.selectedItems, [])) {
						log("Clearing Selection, Categories Changed");
						pbiState.selectedItems = [];
						this.onSelectionChanged([]);
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
	private convertData(
		dv: powerbiVisualsApi.DataView,
		state: AttributeSlicerVisualState,
	) {
		const { labelDisplayUnits, labelPrecision } = state;
		let formatter: any;
		if (labelDisplayUnits || labelPrecision) {
			formatter = createValueFormatter(labelDisplayUnits, labelPrecision);
		}
		if (state.hideEmptyItems) {
			this.zeroEmptyItems(dv);
		}

		const createSelectionIdBuilder = this.host.createSelectionIdBuilder
			? () => this.host.createSelectionIdBuilder()
			: undefined;
		const listItems = converter(
			dv,
			formatter,
			undefined,
			state.colors,
			createSelectionIdBuilder,
		);
		if (state.hideEmptyItems) {
			listItems.items = listItems.items.filter(
				item => item.text && item.text.trim() !== "",
			);
		}
		return listItems || { items: [], segmentInfo: [] };
	}

	/**
	 * Zero out values for blank categories so they won't affect
	 * value bar width calculations.
	 * @param dv
	 */
	private zeroEmptyItems(dv: powerbiVisualsApi.DataView) {
		const categories = dv.categorical.categories[0].values;
		for (let i = 0; i < categories.length; i++) {
			if (!categories[i] || categories[i].toString().trim().length === 0) {
				for (const dataColumn of dv.categorical.values) {
					if (dataColumn.values && dataColumn.values[i]) {
						dataColumn.values[i] = 0;
					}
				}
			}
		}
	}

	/**
	 * Listener for when the selection changes
	 */
	private onSelectionChanged(selectedItems: IItemReference[]) {
		if (!this.isHandlingUpdate) {
			log("onSelectionChanged");
			const newIds = (selectedItems || []).map(n => n.id).sort();
			const oldIds = (this.state.selectedItems || []).map(n => n.id).sort();
			let hasChanges = newIds.length !== oldIds.length;
			if (!hasChanges) {
				hasChanges = newIds.some((ni, i) => newIds[i] !== oldIds[i]);
			}
			if (hasChanges) {
				this.state.selectedItems = selectedItems;

				const filter = this.buildFilter();
				this.applyFilter(filter, "filter");
			}
		}
	}

	/**
	 * Listener for searches being performed
	 */
	private onSearchPerformed(searchText: string) {
		if (searchText !== this.state.searchText) {
			this.state.searchText = searchText;

			const filter = buildContainsFilter(
				this.dataView.categorical.categories[0].source,
				this.mySlicer.searchString,
			);
			this.applyFilter(filter, "selfFilter");
		}
	}

	/**
	 * Listener for can load more data
	 */
	private onCanLoadMoreData(item: any, isSearch: boolean) {
		return (item.result =
			!!this.dataView && (isSearch || !!this.dataView.metadata.segment));
	}

	/**
	 * Listener for when loading more data
	 */
	private onLoadMoreData(item: any, isSearch: boolean) {
		if (isSearch) {
			// Set up the load deferred, and load more data
			let promiseResolve: any;

			// This is resolved later
			// tslint:disable-next-line:promise-must-complete
			const promise = <any>new Promise(resolve => {
				promiseResolve = resolve;
			});
			promise.resolve = promiseResolve;
			promise.search = true;
			this.loadDeferred = promise;
			item.result = promise;
		}
	}

	/**
	 * Applies the given filter
	 * @param filter The filter to apply
	 * @param propertyName The property name within the pbi's objects for the filter
	 */
	private applyFilter(
		filter: BasicFilter | AdvancedFilter,
		propertyName: string,
	) {
		// We at least need to have a filter object
		let hasConditions = false;
		if (filter) {
			if ("values" in filter) {
				hasConditions = filter.values.length > 0;
			} else if (filter.conditions) {
				hasConditions = filter.conditions.length > 0;
			}
		}
		const action = hasConditions
			? powerbiVisualsApi.FilterAction.merge
			: powerbiVisualsApi.FilterAction.remove;
		let applied = false;
		if (!applied) {
			applied = true;
			this.host.applyJsonFilter(filter, "general", propertyName, action);
		}
	}

	/**
	 * Builds a filter to filter to the current set of selected nodes
	 */
	private buildFilter() {
		const state = this.state;
		const selItems = state.selectedItems || [];
		const categories: powerbiVisualsApi.DataViewCategoricalColumn = this
			.dataView.categorical.categories[0];
		const source = categories.source;
		return new BasicFilter(
			buildColumnTarget(source),
			"In",
			selItems.map(n =>
				source.type && source.type.numeric ? parseFloat(n.text) : n.text,
			),
		);
	}

	/**
	 * A function used to determine whether or not a data update should be performed
	 */
	private shouldLoadDataIntoSlicer(
		pbiState: AttributeSlicerVisualState,
		isDataLoad: boolean,
	) {
		// If there is a new dataset from PBI
		return (
			isDataLoad ||
			// If attribute slicer requested more data, but the data actually hasn't changed
			// (ie, if you search for Microsof then Microsoft, most likely will return the same dataset)
			this.loadDeferred
		);
	}
}
