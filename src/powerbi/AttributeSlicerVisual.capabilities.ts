import { VisualBase } from "essex.powerbi.base";
import VisualDataRoleKind = powerbi.VisualDataRoleKind;
import StandardObjectProperties = powerbi.visuals.StandardObjectProperties;
import { DATA_WINDOW_SIZE } from "./AttributeSlicerVisual.defaults";

export default $.extend(true, {}, VisualBase.capabilities, {
        dataRoles: [
            {
                name: "Category",
                kind: VisualDataRoleKind.Grouping,
                displayName: "Category",
            }, {
                name: "Values",
                kind: VisualDataRoleKind.Measure,
                displayName: "Values",
            },
        ],
        dataViewMappings: [{
            conditions: [{ "Category": { max: 1, min: 0 }, "Values": { min: 0 }}],
            categorical: {
                categories: {
                    for: { in: "Category" },
                    dataReductionAlgorithm: { window: { count: DATA_WINDOW_SIZE } },
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
                displayName: "General",
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
                        displayName: "Text Size",
                        type: { numeric: true },
                    },
                    showOptions: {
                        displayName: "Show Options",
                        description: "Should the search box and other options be shown",
                        type: { bool: true },
                    },
                    selfFilter: {
                        type: { filter: { selfFilter: true } }
                    },
                    selfFilterEnabled: {
                        type: { operations: { searchEnabled: true } }
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
                    brushMode: {
                        displayName: "Brush Mode",
                        description: "Allow for the drag selecting of attributes",
                        type: { bool: true },
                    },
                    singleSelect: {
                        displayName: "Single Select",
                        description: "Only allow for a single selected",
                        type: { bool: true },
                    },
                    showSelections: {
                        displayName: "Use Tokens",
                        description: "Will show the selected attributes as tokens",
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
