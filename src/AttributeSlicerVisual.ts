/* tslint:disable */
import { logger, updateTypeGetter, UpdateType } from "essex.powerbi.base";

const log = logger("essex:widget:AttributeSlicerVisual");
/* tslint:enable */

import { AttributeSlicer as AttributeSlicerImpl, SlicerItem } from "./AttributeSlicer";
import { VisualBase, Visual } from "essex.powerbi.base";
import * as _ from "lodash";
import IVisual = powerbi.IVisual;
import IVisualHostServices = powerbi.IVisualHostServices;
import VisualCapabilities = powerbi.VisualCapabilities;
import DataView = powerbi.DataView;
import SelectionId = powerbi.visuals.SelectionId;
import VisualDataRoleKind = powerbi.VisualDataRoleKind;
import data = powerbi.data;
import SelectableDataPoint = powerbi.visuals.SelectableDataPoint;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;

@Visual(require("./build").output.PowerBI)
export default class AttributeSlicer extends VisualBase implements IVisual {

    /**
     * The number of items to load from PBI at any one time
     */
    public static DATA_WINDOW_SIZE = 500;

    /**
     * The set of capabilities for the visual
     */
    public static capabilities: VisualCapabilities = $.extend(true, {}, VisualBase.capabilities, {
        dataRoles: [
            {
                name: "Category",
                kind: VisualDataRoleKind.Grouping,
                displayName: "Category"
            }, {
                name: "Values",
                kind: VisualDataRoleKind.Measure,
                displayName: "Values"
            },
        ],
        dataViewMappings: [{
            conditions: [{ "Category": { max: 1, min: 0 }, "Values": { max: 1, min: 0 }}],
            categorical: {
                categories: {
                    for: { in: "Category" },
                    dataReductionAlgorithm: { window: { count: AttributeSlicer.DATA_WINDOW_SIZE } },
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
                    selection: {
                        type: { text: {} }
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
                    limit: {
                        displayName: "Search Limit",
                        description:
                            `The maximum number of items to search in PowerBI. (increments of ${AttributeSlicer.DATA_WINDOW_SIZE})`,
                        type: { numeric: true },
                    },
                },
            },
            display: {
                displayName: "Display",
                properties: {
                    valueColumnWidth: {
                        displayName: "Value Width %",
                        description: "The percentage of the width that the value column should take up.",
                        type: { numeric: true },
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
            log("onSelectionChanged");
            this.updateSelectionFilter(selectedItems);
        },
        100);

    /**
     * Getter for the update type
     */
    private updateType = updateTypeGetter(this);

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
                let item = AttributeSlicer.createItem(category, values[i], id);
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
     * Creates an item
     */
    public static createItem(category: string, value: any, id: SelectionId, renderedValue?: any) {
        return {
            match: category,
            identity: id,
            selected: false,
            value: value || 0,
            renderedValue: renderedValue,
            equals: (b: { identity: any }) => id.equals((<ListItem>b).identity),
        };
    }

    /**
     * Called when the visual is being initialized
     */
    public init(options: powerbi.VisualInitOptions): void {
        super.init(options, `<div></div>`.trim());
        this.host = options.host;
        this.mySlicer = new AttributeSlicerImpl(this.element);
        this.mySlicer.serverSideSearch = true;
        this.mySlicer.showSelections = true;
        this.mySlicer.events.on("loadMoreData", (item: any, isSearch: boolean) => this.onLoadMoreData(item, isSearch));
        this.mySlicer.events.on("canLoadMoreData", (item: any, isSearch: boolean) => {
            return item.result = isSearch || (this.maxNumberOfItems > this.data.length && !!this.dataView.metadata.segment);
        });
        this.mySlicer.events.on("selectionChanged", (newItems: ListItem[], oldItems: ListItem[]) => {
            if (!this.loadingData) {
                this.onSelectionChanged(newItems);
            }
        });

        log("Loading Custom Sandbox: ", this.sandboxed);
    }

    /**
     * Called when the visual is being updated
     */
    public update(options: powerbi.VisualUpdateOptions) {
        const updateType = this.updateType();
        super.update(options);

        // Make sure the slicer has some sort of dimensions
        if (!this.mySlicer.dimensions) {
            this.mySlicer.dimensions = options.viewport;
        }

        if ((updateType & UpdateType.Resize) === UpdateType.Resize) {
            this.mySlicer.dimensions = options.viewport;
        } else {
            this.loadingData = true;
            const dv = this.dataView = options.dataViews && options.dataViews[0];
            if (dv) {
                if ((updateType & UpdateType.Settings) === UpdateType.Settings) {
                    this.loadSettingsFromPowerBI(dv);
                }

                // We should show values if there are actually values
                // IMPORTANT: This stays before loadDataFromPowerBI, otherwise the values don't display
                const categorical = dv && dv.categorical;
                this.mySlicer.showValues = !!categorical && !!categorical.values && categorical.values.length > 0;

                if ((updateType & UpdateType.Data) === UpdateType.Data) {
                    this.loadDataFromPowerBI(dv);
                }
                this.loadSortFromPowerBI(dv);
                this.loadSelectionFromPowerBI(dv);
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
            instances[0].properties["limit"] = this.maxNumberOfItems;
        }
        if (options.objectName === "display") {
            instances[0].properties["valueColumnWidth"] = this.mySlicer.valueWidthPercentage;
        }
        return instances;
    }

    /**
     * Returns an array containing a filtered set of data based on the search string
     */
    public getFilteredDataBasedOnSearch(data: ListItem[]|SlicerItem[]): ListItem[] {
        data = data || [];
        if (this.mySlicer.searchString) {
            const search = this.mySlicer.searchString;
            const ci = this.mySlicer.caseInsensitive;
            data = data.filter(n => AttributeSlicerImpl.isMatch(n, search, ci));
        }
        return <ListItem[]>data;
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
                log("Loading more data");
            }
        }
    }

    /**
     * Loads the data from the dataview
     */
    private loadDataFromPowerBI(dataView: powerbi.DataView) {
        log("Loading data from PBI");
        this.data = AttributeSlicer.converter(dataView) || [];
        let filteredData = this.getFilteredDataBasedOnSearch(this.data.slice(0));

        // If we are appending data for the attribute slicer
        if (this.loadDeferred && this.mySlicer.data) {
            // we only need to give it the new items
            this.loadDeferred.resolve(filteredData.slice(this.mySlicer.data.length));
            delete this.loadDeferred;
        } else {
            this.mySlicer.data = filteredData;
        }

        // Default the number if necessary 
        const categorical = dataView.categorical;
        const categories = categorical && categorical.categories;
        const hasCategories = !!(categories && categories.length > 0);
        const catName = hasCategories && categorical.categories[0].source.queryName;

        // if the user has changed the categories, then selection is done for
        if (!hasCategories || (this.currentCategory && this.currentCategory !== categorical.categories[0].source.queryName)) {
            log("Clearing Selection, Categories Changed");
            this.mySlicer.selectedItems = [];
            this.updateSelectionFilter([]);
        }

        this.currentCategory = catName;
    }

    /**
     * Returns true if item1 is basically equal to item2
     */
    private areBasicallyEqual(item1: ListItem|SlicerItem, item2: ListItem|SlicerItem) {
        let clone1: ListItem = $.extend(true, {}, item1);
        let clone2: ListItem = $.extend(true, {}, item2);
        return item1 && item2 &&
               clone1.identity.equals(clone2.identity) &&
               clone2.value === clone2.value &&
               clone1.renderedValue === clone2.renderedValue;
    }

    /**
     * Loads the selection from PowerBI
     */
    private loadSelectionFromPowerBI(dataView: powerbi.DataView) {
        const objects = dataView && dataView.metadata && dataView.metadata.objects;
        if (objects) {
            // HAX: Stupid crap to restore selection
            let filter = objects["general"] && objects["general"]["filter"];
            let whereItems = filter && filter.whereItems;
            let condition = whereItems && whereItems[0] && whereItems[0].condition;
            let values = condition && condition.values;
            let args = condition && condition.args;
            if (values && args && values.length && args.length) {
                const selectionItems: ListItem[] = JSON.parse(objects["general"]["selection"]);
                let sourceExpr = filter.whereItems[0].condition.args[0];
                const selectionIds = values.map((n: any) => {
                    return SelectionId.createWithId(powerbi.data.createDataViewScopeIdentity(
                        powerbi.data.SQExprBuilder.compare(data.QueryComparisonKind.Equal,
                            sourceExpr,
                            n[0]
                        )
                    ));
                });
                this.mySlicer.selectedItems = <any>selectionIds.map((n: any, i: number) => {
                    const slimItem = selectionItems[i];
                    return AttributeSlicer.createItem(slimItem.match, slimItem.value, n, slimItem.renderedValue);
                });
            }
        }
    }

    /**
     * Return the value if not undefined/null otherwise returns the default value
     */
    private getOrDefault(value: any, def: any) {
        /* tslint:disable */
        return value === null || typeof value === "undefined" ? def : value;
        /* tslint:enable */
    }

    /**
     * Synchronizes the given
     */
    private syncSettingWithPBI(objects: any, objectName: string, property: string, def: any) {
        if (objects && objects[objectName]) {
            return this.getOrDefault(objects[objectName][property], def);
        }
        return def;
    }

    /**
     * Loads our settings from the powerbi objects
     */
    private loadSettingsFromPowerBI(dataView: powerbi.DataView) {
        const objects = dataView && dataView.metadata && dataView.metadata.objects;
        this.mySlicer.caseInsensitive = this.syncSettingWithPBI(objects, "search", "caseInsensitive", true);

        const size = AttributeSlicer.DATA_WINDOW_SIZE;
        this.maxNumberOfItems = this.syncSettingWithPBI(objects, "search", "limit", AttributeSlicer.DEFAULT_MAX_NUMBER_OF_ITEMS);
        this.maxNumberOfItems = Math.ceil(Math.max(this.maxNumberOfItems, size) / size) * size;
        this.mySlicer.valueWidthPercentage = this.syncSettingWithPBI(objects, "display", "valueColumnWidth", undefined);
    }

    /**
     * Loads the sort from powerbi 
     */
    private loadSortFromPowerBI(dataView: powerbi.DataView) {
        const metadata = dataView && dataView.metadata;
        let sortedColumns = metadata.columns.filter((c) => !!c.sort);
        if (sortedColumns.length) {
            let lastColumn = sortedColumns[sortedColumns.length - 1];
            this.mySlicer.sort(sortedColumns[sortedColumns.length - 1].roles["Category"] ? "match" : "value", /* tslint:disable */lastColumn.sort != 1/* tslint:enable */);
        }
    }

    /**
     * Updates the data filter based on the selection
     */
    private updateSelectionFilter(items: ListItem[]) {
        log("updateSelectionFilter");
        let filter: data.SemanticFilter;
        if (items && items.length) {
            let selectors = items.map(n => n.identity.getSelector());
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
                    <powerbi.VisualObjectInstance>{
                        objectName: "general",
                        selector: undefined,
                        properties: {
                            "selection": JSON.stringify(items.map(n => ({
                                match: n.match,
                                value: n.value,
                                renderedValue: n.renderedValue,
                            }))),
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
                    <powerbi.VisualObjectInstance>{
                        objectName: "general",
                        selector: undefined,
                        properties: {
                            "selection": undefined
                        },
                    },
                ],
            });
        }

        this.host.persistProperties(objects);
        // Stolen from PBI's timeline
        this.host.onSelect({ data: [] });
    }
}

/**
 * Represents a list item
 */
/* tslint:disable */
export interface ListItem extends SlicerItem, SelectableDataPoint {}
