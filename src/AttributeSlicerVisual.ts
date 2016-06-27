/* tslint:disable */
import { logger, updateTypeGetter, UpdateType } from "essex.powerbi.base";
const colors = require("essex.powerbi.base/src/colors").full;

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
import StandardObjectProperties = powerbi.visuals.StandardObjectProperties;
import IValueFormatter = powerbi.visuals.IValueFormatter;
import valueFormatterFactory = powerbi.visuals.valueFormatter.create;
import TooltipEnabledDataPoint = powerbi.visuals.TooltipEnabledDataPoint;
import PixelConverter = jsCommon.PixelConverter;
// import TooltipManager = powerbi.visuals.TooltipManager;

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
                displayName: "Category",
            }, {
                name: "Values",
                kind: VisualDataRoleKind.Measure,
                displayName: "Value",
            },
        ],
        dataViewMappings: [{
            conditions: [{ "Category": { max: 1, min: 0 }, "Values": { min: 0 }}],
            categorical: {
                categories: {
                    for: { in: "Category" },
                    dataReductionAlgorithm: { window: { count: AttributeSlicer.DATA_WINDOW_SIZE } },
                },
                values: {
                    select: [{ for: { in: "Values" }}],
                    dataReductionAlgorithm: { top: {} },
                },
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
                    // formatString: StandardObjectProperties.formatString,
                    selection: {
                        type: { text: {} }
                    },
                    textSize: {
                        displayName: data.createDisplayNameGetter("Visual_TextSize"),
                        type: { numeric: true }
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
                    horizontal: {
                        displayName: "Horizontal",
                        description: "Display the attributes horizontally, rather than vertically",
                        type: { bool: true },
                    },
                    labelDisplayUnits: StandardObjectProperties.labelDisplayUnits,
                    labelPrecision: StandardObjectProperties.labelPrecision,
                },
            },
            selection: {
                displayName: "Selection",
                properties: {
                    singleSelect: {
                        displayName: "Single Select",
                        description: "Only allow for a single selected",
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
     * The display units for the values
     */
    private labelDisplayUnits = 0;

    /**
     * The precision to use with the values
     */
    private labelPrecision: number;

    /**
     * Constructor
     */
    constructor() {
        super();

        // Tell base we should not load sandboxed
        VisualBase.DEFAULT_SANDBOX_ENABLED = false;
    }

    /**
     * Converts the given dataview into a list of listitems
     */
    public static converter(dataView: DataView, formatter: IValueFormatter): ListItem[] {
        let converted: ListItem[];
        const categorical = dataView && dataView.categorical;
        const categories = categorical && categorical.categories;
        const values = categorical && categorical.values;
        let maxValue = 0;
        if (categories && categories.length && categories[0].values) {
            converted = categories[0].values.map((category, catIdx) => {
                let id = SelectionId.createWithId(dataView.table.identity[catIdx]);
                let total = 0;
                let sections: any;
                if (values) {
                    sections = values.map((v, j) => {
                        const value = v.values[catIdx];
                        total += value;
                        return {
                            color: colors[j] || "#ccc",
                            value: value,
                            displayValue: formatter.format(value),
                            width: 0,
                        };
                    });
                    sections.forEach((s: any) => {
                        s.width = (s.value / total) * 100;
                    });
                }
                let item =
                    AttributeSlicer.createItem(
                        category,
                        total,
                        id,
                        undefined,
                        "#ccc");
                // item.onCreate = (ele: JQuery) => {
                //     TooltipManager.addTooltip(d3.select(ele[0]), (te) => item.tooltipInfo);
                // };
                item.tooltipInfo = (sections || []).map((n: any, j: number) => {
                    return {
                        displayName: values[j].source.displayName,
                        value: n.displayValue,
                    };
                });
                item.sections = sections;
                if (item.value > maxValue) {
                    maxValue = item.value;
                }
                return item as any;
            });
            converted.forEach((c) => {
                c.renderedValue = c.value ? (c.value / maxValue) * 100 : undefined;
            });
            return converted;
        }
        return converted;
    }

    /**
     * Creates an item
     */
    public static createItem(category: string, value: any, id: SelectionId, renderedValue?: any, color = ""): ListItem {
        return {
            match: category,
            identity: id,
            selected: false,
            color: color,
            value: value || 0,
            renderedValue: renderedValue,
            equals: (b: ListItem) => id.equals((<ListItem>b).identity),
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
                let forceDataLoad = false;
                if ((updateType & UpdateType.Settings) === UpdateType.Settings) {
                    // We need to reload the data if the case insensitivity changes (this filters the data and sends it to the slicer)
                    const changes = this.loadSettingsFromPowerBI(dv);
                    forceDataLoad = changes.caseInsensitive;

                    // If the displayUnits or precision changed, and we don't have a data update,
                    // then we need to manually refresh the renderedValue of the items
                    if ((changes.displayUnits || changes.precision) &&
                        (updateType & UpdateType.Data) !== UpdateType.Data &&
                        this.mySlicer.data &&
                        this.mySlicer.data.length) {
                        const formatter = this.createValueFormatter();
                        this.mySlicer.data.forEach(n => {
                            (n.sections || []).forEach(s => {
                                s.displayValue = formatter.format(s.value);
                            });
                        });
                        this.mySlicer.refresh();
                    }

                    // If we went from multiple to single, then update the selection filter accordingly
                    if (this.mySlicer.singleSelect && changes.singleSelect) {
                        // Let it know that selection has changed, eventually
                        // Normally would do a return; after this, but there are circumstances in which this may cause other issues
                        // ie. If data hasn't been loaded in the first place, then on the next update there will be no data changes
                        // according to our change detector
                        // OR if the selection hasn't actually changed, and we short circuit it, the data won't have a chance to load.
                        // I guess it's safer/easier to do this than to think of all the possible issues doing it the other way.
                        this.onSelectionChanged(this.mySlicer.selectedItems as ListItem[]);
                    }
                }

                // We should show values if there are actually values
                // IMPORTANT: This stays before loadDataFromPowerBI, otherwise the values don't display
                const categorical = dv && dv.categorical;
                this.mySlicer.showValues = !!categorical && !!categorical.values && categorical.values.length > 0;

                if (forceDataLoad || (updateType & UpdateType.Data) === UpdateType.Data) {
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
        const instance = instances[0];
        const props = instance.properties;
        if (options.objectName === "general") {
            _.merge(props, {
                textSize: PixelConverter.toPoint(this.mySlicer.fontSize)
            });
        } else if (options.objectName === "search") {
            _.merge(props, {
                caseInsensitive: this.mySlicer.caseInsensitive,
                limit: this.maxNumberOfItems,
            });
        } else if (options.objectName === "display") {
            _.merge(props, {
                valueColumnWidth: this.mySlicer.valueWidthPercentage,
                horizontal: this.mySlicer.renderHorizontal,
                labelDisplayUnits: this.labelDisplayUnits,
                labelPrecision: this.labelPrecision,
            });
        } else if (options.objectName === "selection") {
            _.merge(props, {
                singleSelect: this.mySlicer.singleSelect
            });
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
     * Creates a value formatter from the current set of options
     */
    private createValueFormatter() {
        return valueFormatterFactory({
            value: this.labelDisplayUnits,
            format: "0",
            precision: this.labelPrecision,
        });
    }

    /**
     * Loads the data from the dataview
     */
    private loadDataFromPowerBI(dataView: powerbi.DataView) {
        log("Loading data from PBI");
        this.data = AttributeSlicer.converter(dataView, this.createValueFormatter()) || [];
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
        const s = this.mySlicer;
        const objects = dataView && dataView.metadata && dataView.metadata.objects;

        const caseInsensitive =
            s.caseInsensitive !== (s.caseInsensitive = this.syncSettingWithPBI(objects, "search", "caseInsensitive", true));
        const displayUnits =
            this.labelDisplayUnits !== (this.labelDisplayUnits = this.syncSettingWithPBI(objects, "display", "labelDisplayUnits", 0));
        const precision =
            this.labelPrecision !== (this.labelPrecision = this.syncSettingWithPBI(objects, "display", "labelPrecision", 0));
        const singleSelect =
            s.singleSelect !== (s.singleSelect = this.syncSettingWithPBI(objects, "selection", "singleSelect", false));

        const size = AttributeSlicer.DATA_WINDOW_SIZE;
        this.maxNumberOfItems = this.syncSettingWithPBI(objects, "search", "limit", AttributeSlicer.DEFAULT_MAX_NUMBER_OF_ITEMS);
        this.maxNumberOfItems = Math.ceil(Math.max(this.maxNumberOfItems, size) / size) * size;
        this.mySlicer.valueWidthPercentage = this.syncSettingWithPBI(objects, "display", "valueColumnWidth", undefined);
        this.mySlicer.renderHorizontal = this.syncSettingWithPBI(objects, "display", "horizontal", false);
        let pxSize = this.syncSettingWithPBI(objects, "general", "textSize", undefined);
        if (pxSize) {
            pxSize = PixelConverter.fromPointToPixel(pxSize);
        }
        this.mySlicer.fontSize = pxSize;
        return { caseInsensitive, displayUnits, precision, singleSelect };
    }

    /**
     * Loads the sort from powerbi 
     */
    private loadSortFromPowerBI(dataView: powerbi.DataView) {
        const metadata = dataView && dataView.metadata;
        let sortedColumns = metadata.columns.filter((c) => !!c.sort);
        if (sortedColumns.length) {
            let lastColumn = sortedColumns[sortedColumns.length - 1];
            this.mySlicer.sort(
               sortedColumns[sortedColumns.length - 1].roles["Category"] ? "match" : "value", 
               /* tslint:disable */lastColumn.sort != 1/* tslint:enable */);
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
export interface ListItem extends SlicerItem, SelectableDataPoint, TooltipEnabledDataPoint {}
