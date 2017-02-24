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
import { ISlicerColumnMappings, OfficeSlicerItem } from "./models";
import { AggregationType } from "@essex/office-core";
export default function converter(columns: string[], rows: any[][], indexes: ISlicerColumnMappings) {
    const itemMap = {};
    const data: OfficeSlicerItem[] = [];
    const agg = (indexes.value && indexes.value.aggregation);
    let nonNumeric = false;
    let max: number;
    let min: number;
    rows.forEach((n, i) => {
        let val: string = n[indexes.category.index];
        val = typeof val === undefined ? "(Blank)" : val + "";
        val.split(",").forEach(category => {
            const id = i + "";
            let item: OfficeSlicerItem = itemMap[category];
            if (!item) {
                item = {
                    id,
                    match: category,
                    value: undefined,
                    equals: (b: any) => b.id === id,
                    aggregations: {
                        count: 0,
                        min: undefined,
                        max: undefined,
                        sum: undefined,
                        avg: undefined,
                    },
                }
                itemMap[category] = item;
                data.push(item);
            }
            if (indexes.value !== undefined) {
                const rawValue = n[indexes.value.index];
                const parsedValue = parseFloat(rawValue);
                if (typeof item.value === "undefined") {
                    item.value = 0;
                }
                if (!isNaN(parsedValue) && typeof parsedValue !== undefined) {
                    item.value = parsedValue;

                    item.aggregations.sum = (item.aggregations.sum || 0) + parsedValue;
                    item.aggregations.count = (item.aggregations.count || 0) + 1;

                    const oldMax = item.aggregations.max;
                    if (oldMax === undefined || oldMax < parsedValue) {
                        item.aggregations.max = parsedValue;
                    }

                    const oldMin = item.aggregations.min;
                    if (oldMin === undefined || oldMin > parsedValue) {
                        item.aggregations.min = parsedValue;
                    }
                } else {
                    nonNumeric = true;
                }
            }

        });
    });
    let aggType: AggregationType = agg ? agg.type : (nonNumeric ? AggregationType.Count : AggregationType.Avg);
    data.forEach(n => {
        if (n.value !== undefined) {

            // Compute the average
            if (n.aggregations.count > 0) {
                n.aggregations.avg = (n.aggregations.sum || 0) / n.aggregations.count;
            }

            let showAsFixed = false;
            if (aggType === AggregationType.Count) {
                n.value = n.aggregations.count;
            }
            if (aggType === AggregationType.Sum) {
                n.value = n.aggregations.sum;
            }
            if (aggType === AggregationType.Max) {
                n.value = n.aggregations.max;
            }
            if (aggType === AggregationType.Min) {
                n.value = n.aggregations.min;
            }
            if (aggType === AggregationType.Avg) {
                n.value = n.aggregations.avg;
                showAsFixed = true;
            }

            n.valueSegments = [{
                value: n.value,
                displayValue: showAsFixed ? n.value.toFixed(2) : n.value,
                width: 100,
                color: n.value < 0 ? "#e81123" : "#0078d7",
            }];

            if (max === undefined || n.value > max) {
                max = n.value;
            }
            if (min === undefined || n.value < min) {
                min = n.value;
            }
        }
    });
    const range = max - min;
    data.forEach(n => {
        let renderedValue = 100;
        if (range > 0) {
            const offset = 10;//min > 0 ? 10 : 0;
            renderedValue = (((n.value - min) / range) * (100 - offset)) + offset;
        }
        n.renderedValue = renderedValue;
    });
    return data;
}
