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

import IValueFormatter = powerbi.visuals.IValueFormatter;
import valueFormatterFactory = powerbi.visuals.valueFormatter.create;

/**
 * Creates a value formatter from the current set of options
 */
export function createValueFormatter(displayUnits = 0, precision = 0) {
    "use strict";
    return valueFormatterFactory({
        value: displayUnits,
        format: "0",
        precision: precision,
    });
}

/**
 * Creates a formatter capable of formatting the categories (or undefined) if not necessary
 */
export function createCategoryFormatter(dataView: powerbi.DataView) {
    "use strict";
    let formatter: IValueFormatter;
    let cats = dataView && dataView.categorical && dataView.categorical.categories;
    if (cats && cats.length && cats[0].source.type.dateTime) {
        let min: Date;
        let max: Date;
        cats[0].values.forEach(n => {
            if (typeof min === "undefined" || min > n) {
                min = new Date(n.valueOf());
            }
            if (typeof max === "undefined" || max < n) {
                max = new Date(n.valueOf());
            }
        });
        if (min && max) {
            formatter = valueFormatterFactory({
                value: min,
                value2: max,
                format: cats[0].source.format || "0",
            });
        }
    }
    return formatter;
}
