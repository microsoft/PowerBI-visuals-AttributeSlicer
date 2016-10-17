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

import VisualBase from "essex.powerbi.base/dist/lib/VisualBase";
import VisualDataRoleKind = powerbi.VisualDataRoleKind;
import { SETTING_DESCRIPTORS } from "./interfaces";
import { DATA_WINDOW_SIZE } from "./AttributeSlicerVisual.defaults";
const log = require("debug")("AttributeSlicer::Capabilities"); // tslint:disable-line
import * as $ from "jquery";

const capabilities = $.extend(true, {}, VisualBase.capabilities, {
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
        }],
        // sort this crap by default
        sorting: {
            default: {},
        },
        objects: $.extend(true, {}, {
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
                        type: { text: {} },
                    },
                    selfFilter: {
                        type: { filter: { selfFilter: true } },
                    },
                    selfFilterEnabled: {
                        type: { operations: { searchEnabled: true } },
                    },
                },
            },
        }, buildObjects()),
    });

export default capabilities;
log("Attribute Slicer Capabilities: ", capabilities);

function buildObjects() {
    "use strict";
    const objects = {};
    Object.keys(SETTING_DESCRIPTORS).forEach(section => {
        const objProps = objects[section] = {
            properties: {},
        };
        const props = SETTING_DESCRIPTORS[section];
        Object.keys(props).forEach(propName => {
            if (propName === "displayName") {
                objProps[propName] = props[propName];
            } else {
                objProps.properties[propName] = props[propName];
            }
        });
    });
    return objects;
}
