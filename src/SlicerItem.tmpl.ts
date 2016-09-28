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

import { SlicerItem } from "./interfaces";
import { prettyPrintValue as pretty } from "./Utils";

/**
 * Returns an element for the given item
 */
export default function (item: SlicerItem, sizes: { category: number; value: number }) {
    "use strict";
    const { match, matchPrefix, matchSuffix, sections, renderedValue } = item;
    const categoryStyle = `display:inline-block;overflow:hidden;max-width:${sizes.category}%`;
    return $(`
        <div style="white-space:nowrap" class="item" style="cursor:pointer">
            <div style="margin-left: 5px;vertical-align:middle;height:100%" class="display-container">
                <span style="${categoryStyle}" title="${pretty(match)}" class="category-container">
                    <span class="matchPrefix">${pretty(matchPrefix)}</span>
                    <span class="match">${pretty(match)}</span>
                    <span class="matchSuffix">${pretty(matchSuffix)}</span>
                </span>
                <span style="display:inline-block;max-width:${sizes.value}%;height:100%" class="value-container">
                    <span style="display:inline-block;width:${renderedValue}%;height:100%">
                    ${
                        (sections || []).map(s => {
                            let color = s.color;
                            if (color) {
                                color = `background-color:${color};`;
                            }
                            const displayValue = s.displayValue || s.value || "0";
                            const style = `display:inline-block;width:${s.width}%;${color};height:100%`;
                            return `
                                <span style="${style}" title="${displayValue}" class="value-display">
                                    &nbsp;<span class="value">${displayValue}</span>
                                </span>
                            `.trim().replace(/\n/g, "");
                        }).join("")
                    }
                    </span>
                </span>
            </div>
        </div>
    `.trim().replace(/\n/g, ""));
}

