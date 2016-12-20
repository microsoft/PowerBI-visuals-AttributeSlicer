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
import { DATA_WINDOW_SIZE } from "./AttributeSlicerVisual.defaults";
import VisualState from "./state";
const log = require("debug")("AttributeSlicer::Capabilities"); // tslint:disable-line
import * as $ from "jquery";
import VisualDataRoleKind = powerbi.VisualDataRoleKind;

const capabilities = $.extend(true, {}, VisualBase.capabilities, {
    dataRoles: [
        {
            name: "Category",
            kind: VisualDataRoleKind.Grouping,
            displayName: "Items",
        }, {
            name: "Values",
            kind: VisualDataRoleKind.Measure,
            requiredTypes: [{ numeric: true }, { integer: true }],
            displayName: "With Values",
        }, {
            name: "Series",
            kind: VisualDataRoleKind.Grouping,
            displayName: "Segmented By",
        },
    ],
    dataViewMappings: [{
        conditions: [
            { "Category": { }, "Series": { max: 0 }},
            { "Category": { }, "Series": { max: 0 }, "Values": { max: 1, min: 0 }},
            { "Category": { }, "Series": { min: 1, max: 1 }, "Values": { max: 1, min: 1 }},
            { "Category": { }, "Series": { max: 0 }, "Values": { min: 0 }},
            { "Category": { }, "Series": { max: 1 }, "Values": { min: 0, max: 0 }},
        ],
        categorical: {
            categories: {
                for: { in: "Category" },
                dataReductionAlgorithm: { window: { count: DATA_WINDOW_SIZE } },
            },
            values: {
                group: {
                    by: "Series",
                    select: [{ for: { in: "Values" }}],
                    dataReductionAlgorithm:  { top: { count: 100 } },
                },
            },
            rowCount: { preferred: { min: 2 }, supported: { min: 0 } },
        },
    }],
    // sort this crap by default
    sorting: {
        default: {},
    },
    supportsHighlight: true,
    objects: $.extend(true, {}, VisualState.buildCapabilitiesObjects(), {
        general: {
            displayName: "General",
            properties: {
                selfFilterEnabled: {
                    type: { operations: { searchEnabled: true } },
                },
            },
        },
    }),
});

export default capabilities;
log("Attribute Slicer Capabilities: ", capabilities);
