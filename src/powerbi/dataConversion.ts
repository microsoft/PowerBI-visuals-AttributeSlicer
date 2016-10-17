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

import { ListItem } from "./interfaces";
import IValueFormatter = powerbi.visuals.IValueFormatter;
import SelectionId = powerbi.visuals.SelectionId;
import DataView = powerbi.DataView;
import { createValueFormatter, createCategoryFormatter } from "./formatting";

/* tslint:disable */
const { colors } = require("essex.powerbi.base");
const { full } = colors;
/* tslint:enable */

/**
 * Converts the given dataview into a list of listitems
 */
export default function converter(
    dataView: DataView,
    valueFormatter?: IValueFormatter,
    categoryFormatter?: IValueFormatter): ListItem[] {
    "use strict";
    if (!valueFormatter) {
        valueFormatter = createValueFormatter();
    }
    if (!categoryFormatter) {
        categoryFormatter = createCategoryFormatter(dataView);
    }
    let converted: ListItem[];
    const categorical = dataView && dataView.categorical;
    const categories = categorical && categorical.categories;
    const values = categorical && categorical.values;
    let maxValue: number;
    let minValue: number;
    if (categories && categories.length && categories[0].values) {
        converted = categories[0].values.map((category, catIdx) => {
            let id = SelectionId.createWithId(categories[0].identity[catIdx]);
            let total = 0;
            let sections: any;
            if (values) {
                sections = values.map((v, j) => {
                    const value = v.values[catIdx];
                    if (typeof value === "number") {
                        total += <number>value;
                    }
                    return {
                        color: colors[j] || "#ccc",
                        value: value,
                        displayValue: valueFormatter.format(value),
                        width: 0,
                    };
                });
                sections.forEach((s: any) => {
                    s.width = (s.value / total) * 100;
                });
            }
            const item =
                createItem(
                    categoryFormatter ? categoryFormatter.format(category) : category as any,
                    total,
                    id.getKey(),
                    id.getSelector(),
                    undefined,
                    "#ccc");
            item.sections = sections;
            if (typeof maxValue === "undefined" || item.value > maxValue) {
                maxValue = item.value;
            }
            if (typeof minValue === "undefined" || item.value < minValue) {
                minValue = item.value;
            }
            return item as any;
        });
        converted.forEach((c) => {
            c.renderedValue = c.value ? ((c.value - minValue) / (maxValue - minValue)) * 100 : undefined;
        });
        return converted;
    }
    return converted;
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
