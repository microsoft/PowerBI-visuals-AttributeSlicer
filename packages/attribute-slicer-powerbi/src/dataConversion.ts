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

import * as PBIBase from "@essex/pbi-base"; // tslint:disable-line
import { ListItem, IAttributeSlicerVisualData, ISlicerValueSegment } from "./interfaces";
import { ISerializedItem } from "@essex/attribute-slicer";
import "powerbi-visuals/lib/powerbi-visuals";
import IValueFormatter = powerbi.visuals.IValueFormatter;
import DataView = powerbi.DataView;
import { createValueFormatter, createCategoryFormatter } from "./formatting";
import { serializeSelectors, IColorSettings, convertItemsWithSegments } from "@essex/pbi-base";
const ldget = require("lodash/get"); //tslint:disable-line

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

    return convertItemsWithSegments(
        dataView,
        (segment: ISlicerValueSegment) => {
            segment.displayValue = valueFormatter.format(segment.value);
            return segment;
        },
        (dvCats: any, catIdx: number, total: number, id: powerbi.visuals.SelectionId) => {
            const item =
                createItem(
                    buildCategoryDisplay(dvCats, catIdx, categoryFormatter),
                    total,
                    id.getKey(),
                    id.getSelector(),
                    undefined,
                    "#ccc");
            return item;

        // TOOD: This logic should move to pbi base
    }, dataSupportsColorizedInstances(dataView) ? settings : undefined) as IAttributeSlicerVisualData;
}

/**
 * Builds the display string for the given category
 */
export function buildCategoryDisplay(cats: powerbi.DataViewCategoryColumn[], catIdx: number, categoryFormatter?: IValueFormatter): string {
    "use strict";
    return (cats || []).map(n => {
        const category = n.values[catIdx];
        return (categoryFormatter ? categoryFormatter.format(category) : category as any);
    }).join(" - ");
}

/**
 * Creates an item from a serialized item
 */
export function createItemFromSerializedItem(item: ISerializedItem) {
    "use strict";
    if (item) {
        return createItem(item.match, item.value, item.id, item.selector, item.renderedValue, undefined, true);
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
    color = "",
    noSerialize = false): ListItem {
    "use strict";
    return {
        id: id,
        match: category,
        color: color,
        value: value || 0,
        renderedValue: renderedValue,
        selector: noSerialize ? selector : serializeSelectors([selector])[0],
        equals: (b: ListItem) => id === b.id,
    };
}

export type IConversionSettings = IColorSettings & { reverseBars?: boolean };

/**
 * True if the given dataview supports multiple value segments
 */
export function dataSupportsValueSegments(dv: powerbi.DataView) {
    "use strict";
    return ldget(dv, "categorical.values.length", 0) > 0;
}

/**
 * Returns true if individiual instances of the dataset can be uniquely colored
 */
export function dataSupportsColorizedInstances(dv: powerbi.DataView) {
    "use strict";

    // If there are no value segments, then there is definitely going to be no instances
    if (dataSupportsValueSegments(dv)) {
        // We can uniquely color items that have an identity associated with it
        const grouped = dv.categorical.values.grouped();
        return grouped.filter(n => !!n.identity).length > 0;
    }
    return false;
}
