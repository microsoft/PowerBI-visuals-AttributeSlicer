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
import { AggregationType, IAggregation, IDataResult } from "@essex/office-core";
export default function converter(parsedData: IDataResult<{ category: any; value: any}>) {
    const data: OfficeSlicerItem[] = [];
    let nonNumeric = false;
    let max: number;
    let min: number;
    parsedData.data.forEach((n, i) => {
        let category: string = n.category;
        const id = i + "";
        let item: OfficeSlicerItem  = {
            id,
            match: category,
            value: n.value,
            equals: (b: any) => b.id === id,
        }
        data.push(item);

        item.valueSegments = [{
            value: n.value,
            displayValue: n.value,
            width: 100,
            color: n.value < 0 ? "#e81123" : "#0078d7",
        }];

        if (max === undefined || item.value > max) {
            max = item.value;
        }
        if (min === undefined || item.value < min) {
            min = item.value;
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
