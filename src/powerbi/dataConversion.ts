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

import { ListItem, IAttributeSlicerVisualData, IColorSettings, ISlicerValueSegment } from "./interfaces";
import IValueFormatter = powerbi.visuals.IValueFormatter;
import SelectionId = powerbi.visuals.SelectionId;
import DataView = powerbi.DataView;
import { createValueFormatter, createCategoryFormatter } from "./formatting";
import * as d3 from "d3";

/* tslint:disable */
const { colors } = require("essex.powerbi.base");
const { full } = colors;
const ldget = require("lodash/get");
/* tslint:enable */

const pathFinder = /return\s+([\w\.\_\d\[\]]+)/;
function get<T, J>(obj: T, getter: (obj: T) => J, defaultValue?: any): J {
    "use strict";
    const path = pathFinder.exec(getter.toString())[1];
    return ldget(obj, path.split(".").slice(1).join("."), defaultValue) as J;
}

/**
 * Converts the given dataview into a list of listitems
 */
export default function converter(
    dataView: DataView,
    valueFormatter?: IValueFormatter,
    categoryFormatter?: IValueFormatter,
    settings?: IColorSettings): IAttributeSlicerVisualData {
    "use strict";
    if (!valueFormatter) {
        valueFormatter = createValueFormatter();
    }
    if (!categoryFormatter) {
        categoryFormatter = createCategoryFormatter(dataView);
    }
    let items: ListItem[];
    const categories = get(dataView, x => x.categorical.categories[0].values);
    const identities = get(dataView, x => x.categorical.categories[0].identity);
    const values = get(dataView, x => x.categorical.values);
    if (categories) {
        const segmentInfo = calculateSegmentInfo(values, settings);
        items = categories.map((category, catIdx) => {
            let id = SelectionId.createWithId(identities[catIdx]);
            let total = 0;
            let segments: any;
            if (values) {
                const result = createSegments(values, segmentInfo, catIdx, valueFormatter);
                total = result.total;
                segments = result.segments;

                if (settings && settings.reverseOrder) {
                    segments.reverse();
                }
            }
            const item =
                createItem(
                    categoryFormatter ? categoryFormatter.format(category) : category as any,
                    total,
                    id.getKey(),
                    id.getSelector(),
                    undefined,
                    "#ccc");
            item.valueSegments = segments;
            return item;
        });

        // Computes the rendered values for each of the items
        computeRenderedValues(items);

        return { items, segmentInfo };
    }
}

/**
 * A utility method to create a slicer item
 */
export function createItem(
    category: string,
    value: any,
    id: string,
    selector: powerbi.data.Selector,
    renderedValue?: any,
    color = ""): ListItem {
    "use strict";
    return {
        id: id,
        match: category,
        color: color,
        value: value || 0,
        renderedValue: renderedValue,
        selector: selector,
        equals: (b: ListItem) => id === b.id,
    };
}

/**
 * Computes the rendered values for the given set of items
 */
export function computeRenderedValues(items: ListItem[], minMax?: { min: number, max: number; }) {
    "use strict";
    const { min, max } = minMax || computeMinMaxes(items);
    const range = max - min;
    items.forEach((c) => {
        if (c.value) {
            let renderedValue = 100;
            if (range > 0) {
                const offset = min > 0 ? 10 : 0;
                renderedValue = (((c.value - min) / range) * (100 - offset)) + offset;
            }
            c.renderedValue = renderedValue;
        }
    });
}

/**
 * Computes the minimum and maximum values for the given set of items
 */
export function computeMinMaxes(items: ListItem[]) {
    "use strict";
    let maxValue: number;
    let minValue: number;
    items.forEach((c) => {
        if (typeof maxValue === "undefined" || c.value > maxValue) {
            maxValue = c.value;
        }
        if (typeof minValue === "undefined" || c.value < minValue) {
            minValue = c.value;
        }
    });
    return {
        min: minValue,
        max: maxValue,
    };
}

/**
 * True if the given dataview supports multiple value segments
 */
export function dataSupportsValueSegments(dv: powerbi.DataView) {
    "use strict";
    return ldget(dv, "categorical.values.length", 0) > 1;
}

/**
 * Creates segments for the given values, and the information on how the value is segmented
 */
function createSegments(
    values: powerbi.DataViewValueColumns,
    segmentInfos: { name: string, identity: any; color: string }[],
    column: number,
    valueFormatter: IValueFormatter) {
    "use strict";
    let total = 0;
    const segments = segmentInfos.map((segmentInfo, j) => {
        // Highlight here is a numerical value, the # of highlighted items in the total
        const highlights = (values[j].highlights || []);
        const highlight = highlights[column];
        const value = values[j].values[column];
        if (typeof value === "number") {
            total += <number>value;
        }
        const { color, name } = segmentInfo;

        // There is some sort of highlighting going on
        const segment = {
            name: name,
            color: color,
            value: value,
            displayValue: valueFormatter.format(value),
            width: 0,
        } as ISlicerValueSegment;

        if (highlights && highlights.length) {
            let highlightWidth = 0;
            if (value && typeof value === "number" && highlight) {
                highlightWidth = (<number>highlight / value) * 100;
            }
            segment.highlightWidth = highlightWidth;
        }

        return segment;
    });
    segments.forEach((s: any) => {
        s.width = (s.value / total) * 100;
    });
    return { segments, total };
}

/**
 * Calculates the segments that are required to represent the pbi values
 */
function calculateSegmentInfo(values: powerbi.DataViewValueColumns, settings: IColorSettings) {
    "use strict";
    let segmentInfo: { name: any, identity: any }[] = [];
    let segmentValues: number[] = [];
    if (values && values.length) {
        // If a column has the "Series" role, then we have series data
        const isSeriesData = !!(values.source && values.source.roles["Series"]);
        segmentInfo = isSeriesData ?
            <any>values.grouped() :
            values.map((n, i) => ({ name: (i + 1) + "", identity: n.identity }));
        segmentValues = segmentInfo.map(n => parseFloat(n.name));
    }

    let gradientScale: d3.scale.Linear<number, number>;
    if (settings && settings.useGradient) {
        const min = d3.min(segmentValues);
        const max =  d3.max(segmentValues);
        const finalMin = ldget(settings, "startValue", min);
        const finalMax = ldget(settings, "endValue", max);
        const finalStartColor = ldget(settings, "startColor", "#bac2ff");
        const finalEndColor = ldget(settings, "endColor", "#0229bf");
        gradientScale = d3.scale.linear()
            .domain([finalMin, finalMax])
            .interpolate(d3.interpolateRgb as any)
            .range([finalStartColor, finalEndColor] as any);
    }
    return _.sortBy(segmentInfo, ["name"]).map((v, j) => {
        let color = full[j] || "#ccc";
        if (gradientScale) {
            color = gradientScale(parseFloat(v.name));
        }
        // Use the instance color if we are not using a gradient.
        color = !gradientScale ? ldget(v, "objects.dataPoint.fill.solid.color", color) : color;
        return {
            name: v.name as string,
            identity: v.identity,
            color: color,
        };
    });
}
