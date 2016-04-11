/// <reference path="../base/powerbi/references.d.ts"/>
import { AttributeSlicer as AttributeSlicerImpl, SlicerItem } from "./AttributeSlicer";
import { VisualBase } from "../base/powerbi/VisualBase";
import { default as Utils, Visual } from "../base/powerbi/Utils";
import IVisual = powerbi.IVisual;
import IVisualHostServices = powerbi.IVisualHostServices;
import VisualCapabilities = powerbi.VisualCapabilities;
import DataView = powerbi.DataView;
import SelectionId = powerbi.visuals.SelectionId;
import VisualDataRoleKind = powerbi.VisualDataRoleKind;
import data = powerbi.data;
import SelectableDataPoint = powerbi.visuals.SelectableDataPoint;
import SelectionManager = powerbi.visuals.utility.SelectionManager;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;

@Visual(require("./build").output.PowerBI)
export default class AttributeSlicer extends VisualBase implements IVisual {

    /**
     * The set of capabilities for the visual
     */
    public static capabilities: VisualCapabilities = $.extend(true, {}, VisualBase.capabilities, {
        dataRoles: [
            {
                name: "Category",
                kind: VisualDataRoleKind.Grouping,
                displayName: powerbi.data.createDisplayNameGetter("Role_DisplayName_Field"),
                description: data.createDisplayNameGetter("Role_DisplayName_FieldDescription"),
            }, {
                name: "Values",
                kind: VisualDataRoleKind.Measure,
            },
        ],
        dataViewMappings: [{
            conditions: [{ "Category": { max: 1, min: 0 }, "Values": { max: 1, min: 0 }}],
            categorical: {
                categories: {
                    for: { in: "Category" },
                    dataReductionAlgorithm: { window: { count: 500 } },
                },
                values: {
                    select: [{ bind: { to: "Values" } }]
                },
                includeEmptyGroups: true,
            },
        }, ],
        // sort this crap by default
        sorting: {
            default: {}
        },
        objects: {
            general: {
                displayName: data.createDisplayNameGetter("Visual_General"),
                properties: {
                    filter: {
                        type: { filter: {} },
                        rule: {
                            output: {
                                property: "selected",
                                selector: ["Values"],
                            },
                        },
                    },
                },
            },
            data: {
                displayName: "Data",
                properties: {
                    limit: {
                        displayName: "Max number of items",
                        description: "The maximum number of items to load from PowerBI",
                        type: { numeric: true },
                    },
                },
            },
            search: {
                displayName: "Search",
                properties: {
                    caseInsensitive: {
                        displayName: "Case Insensitive",
                        type: { bool: true },
                    },
                },
            },
            /*,
            sorting: {
                displayName: "Sorting",
                properties: {
                    byHistogram: {
                        type: { bool: true }
                    },
                    byName: {
                        type: { bool: true }
                    }
                }
            }*/
        },
    });

    /**
     * The max number of items to load from PBI
     */
    private static DEFAULT_MAX_NUMBER_OF_ITEMS: number = 10000;

    /**
     * The current dataView
     */
    private dataView: DataView;

    /**
     * The host of the visual
     */
    private host: IVisualHostServices;

    /**
     * The selection manager
     */
    private selectionManager: SelectionManager;

    /**
     * My AttributeSlicer
     */
    private mySlicer: AttributeSlicerImpl;

    private loadDeferred: JQueryDeferred<SlicerItem[]>;

    /**
     * The current category that the user added
     */
    private currentCategory: any;

    /**
     * Whether or not we are currently loading data
     */
    private loadingData = false;

    /*
     * The current set of cacheddata
     */
    private data: SlicerItem[];

    /**
     * The number of items to load from PBI
     */
    private maxNumberOfItems: number = AttributeSlicer.DEFAULT_MAX_NUMBER_OF_ITEMS;

    /**
     * Updates the data filter based on the selection
     */
    private onSelectionChanged = _.debounce(
        (selectedItems: ListItem[]) => {
            this.selectionManager.clear();
            selectedItems.forEach((item) => {
                this.selectionManager.select(item.identity, true);
            });
            this.updateSelectionFilter();
        },
        100);

    /**
     * Converts the given dataview into a list of listitems
     */
    public static converter(dataView: DataView): ListItem[] {
        let converted: ListItem[];
        let categorical = dataView && dataView.categorical;
        let values: any[] = [];
        if (categorical && categorical.values && categorical.values.length) {
            values = categorical.values[0].values;
        }
        let maxValue = 0;
        if (categorical && categorical.categories && categorical.categories.length > 0) {
            converted = <any>categorical.categories[0].values.map((category, i) => {
                let id = SelectionId.createWithId(categorical.categories[0].identity[i]);
                let item = {
                    match: category,
                    identity: id,
                    selected: false,
                    value: values[i] || 0,
                    renderedValue: <any>undefined,
                    equals: (b: { identity: any }) => id.equals((<ListItem>b).identity),
                };
                if (item.value > maxValue) {
                    maxValue = item.value;
                }
                return item;
            });
            converted.forEach((c) => {
                c.renderedValue = c.value ? (c.value / maxValue) * 100 : undefined;
            });
        }
        return converted;
    }

    /**
     * Called when the visual is being initialized
     */
    public init(options: powerbi.VisualInitOptions): void {
        super.init(options, "<div></div>");
        this.host = options.host;
        this.mySlicer = new AttributeSlicerImpl(this.element);
        this.mySlicer.serverSideSearch = true;
        this.mySlicer.showSelections = true;
        this.selectionManager = new SelectionManager({ hostServices: this.host });
        this.mySlicer.events.on("loadMoreData", (item: any, isSearch: boolean) => this.onLoadMoreData(item, isSearch));
        this.mySlicer.events.on("canLoadMoreData", (item: any, isSearch: boolean) => {
            return item.result = isSearch || (this.maxNumberOfItems > this.data.length && !!this.dataView.metadata.segment);
        });
        this.mySlicer.events.on("selectionChanged", (newItems: ListItem[], oldItems: ListItem[]) => {
            if (!this.loadingData) {
                this.onSelectionChanged(newItems);
            }
        });
    }

    /**
     * Called when the visual is being updated
     */
    public update(options: powerbi.VisualUpdateOptions) {
        super.update(options);

        // Make sure the slicer has some sort of dimensions
        if (!this.mySlicer.dimensions) {
            this.mySlicer.dimensions = options.viewport;
        }

        // Assume that if the dimensions have changed, that thats it.
        if (this.mySlicer.dimensions.height !== options.viewport.height ||
            this.mySlicer.dimensions.width !== options.viewport.width) {
            this.mySlicer.dimensions = options.viewport;
        } else {
            this.loadingData = true;
            this.dataView = options.dataViews && options.dataViews[0];
            if (this.dataView) {
                const categorical = this.dataView && this.dataView.categorical;
                const categories = categorical && categorical.categories;
                const hasCategories = !!(categories && categories.length > 0);
                const catName = hasCategories && categorical.categories[0].source.queryName;
                const objects = this.dataView.metadata.objects;

                // sync search option
                if (objects && objects["search"]) {
                    this.mySlicer.caseInsensitive = !!objects["search"]["caseInsensitive"];
                }

                // sync search option
                if (objects && objects["data"]) {
                    this.maxNumberOfItems = objects["data"]["limit"];
                }

                // Default the number if necessary
                const currMax = this.maxNumberOfItems;
                this.maxNumberOfItems = !!currMax && currMax > 0 ? currMax : AttributeSlicer.DEFAULT_MAX_NUMBER_OF_ITEMS;

                // if the user has changed the categories, then selection is done for
                if (!hasCategories || this.currentCategory !== categorical.categories[0].source.queryName) {
                    this.mySlicer.selectedItems = [];
                }

                this.currentCategory = catName;

                const prevLength = this.data ? this.data.length : 0;
                this.data = AttributeSlicer.converter(this.dataView).slice(0, this.maxNumberOfItems);

                // If we are appending data for the attribute slicer
                if (this.loadDeferred && this.mySlicer.data) {
                    // Only add newly filtered data
                    const filteredData = this.getFilteredDataBasedOnSearch(this.data.slice(prevLength));

                    // we only need to give it the new items
                    this.loadDeferred.resolve(filteredData);
                    delete this.loadDeferred;
                } else {
                    const filteredData = this.getFilteredDataBasedOnSearch(this.data);
                    if (this.data &&
                        Utils.hasDataChanged(
                            filteredData.slice(0),
                            this.mySlicer.data,
                            (a, b) => a.match === b.match && a.renderedValue === b.renderedValue)) {
                        this.mySlicer.data = filteredData;
                    } else if (!filteredData || filteredData.length === 0) {
                        this.mySlicer.data = [];
                    }
                }

                this.mySlicer.showValues = !!categorical && !!categorical.values && categorical.values.length > 0;
                let sortedColumns = this.dataView.metadata.columns.filter((c) => !!c.sort);
                if (sortedColumns.length) {
                    let lastColumn = sortedColumns[sortedColumns.length - 1];
                    this.mySlicer.sort(sortedColumns[sortedColumns.length - 1].roles["Category"] ? "match" : "value", /* tslint:disable */lastColumn.sort != 1/* tslint:enable */);
                }

                let selectedIds = this.selectionManager.getSelectionIds() || [];
                this.mySlicer.selectedItems = this.mySlicer.data.filter((n: ListItem) => {
                    return !!_.find(selectedIds, (oId) => oId.equals(n.identity));
                });
            } else {
                this.mySlicer.data = [];
                this.mySlicer.selectedItems = [];
            }
            this.loadingData = false;
        }
    }

    /**
     * Enumerates the instances for the objects that appear in the power bi panel
     */
    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] {
        let instances = super.enumerateObjectInstances(options) || [{
            /*tslint:disable */selector: null/* tslint:enable */,
            objectName: options.objectName,
            properties: {},
        }, ];
        if (options.objectName === "search") {
            instances[0].properties["caseInsensitive"] = this.mySlicer.caseInsensitive;
        }
        if (options.objectName === "data") {
            instances[0].properties["limit"] = this.maxNumberOfItems;
        }
        return instances;
    }

    /**
     * Returns an array containing a filtered set of data based on the search string
     */
    public getFilteredDataBasedOnSearch(data: SlicerItem[]) {
        data = data || [];
        if (this.mySlicer.searchString) {
            const search = this.mySlicer.searchString;
            const ci = this.mySlicer.caseInsensitive;
            data = data.filter(n => AttributeSlicerImpl.isMatch(n, search, ci));
        }
        return data;
    }

    /**
     * Gets the inline css used for this element
     */
    protected getCss(): string[] {
        return super.getCss().concat([require("!css!sass!./css/AttributeSlicerVisual.scss")]);
    }

    /**
     * Listener for when loading more data
     */
    private onLoadMoreData(item: any, isSearch: boolean) {
        if (isSearch && this.data && this.data.length) {
            let defer = $.Deferred();
            defer.resolve(this.getFilteredDataBasedOnSearch(this.data));
            item.result = defer.promise();
        } else if (this.maxNumberOfItems > this.data.length && this.dataView.metadata.segment) {
            let alreadyLoading = !!this.loadDeferred;
            if (this.loadDeferred) {
                this.loadDeferred.reject();
            }

            this.loadDeferred = $.Deferred();
            item.result = this.loadDeferred.promise();
            if (!alreadyLoading) {
                this.host.loadMoreData();
            }
        }
    }

    /**
     * Updates the data filter based on the selection
     */
    private updateSelectionFilter() {
        let filter: data.SemanticFilter;
        if (this.selectionManager.hasSelection()) {
            let selectors = this.selectionManager.getSelectionIds().map((id) => id.getSelector());
            filter = data.Selector.filterFromSelector(selectors);
        }

        let objects: powerbi.VisualObjectInstancesToPersist = { };
        if (filter) {
            $.extend(objects, {
                merge: [
                    <powerbi.VisualObjectInstance>{
                        objectName: "general",
                        selector: undefined,
                        properties: {
                            "filter": filter
                        },
                    },
                ],
            });
        } else {
            $.extend(objects, {
                remove: [
                    <powerbi.VisualObjectInstance>{
                        objectName: "general",
                        selector: undefined,
                        properties: {
                            "filter": filter
                        },
                    },
                ],
            });
        }

        this.host.persistProperties(objects);
    }
}

/**
 * Represents a list item
 */
/* tslint:disable */
export interface ListItem extends SlicerItem, SelectableDataPoint {}
