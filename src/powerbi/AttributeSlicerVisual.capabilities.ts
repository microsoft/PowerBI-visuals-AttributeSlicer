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
