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

import { SlicerItem, ISlicerValueSegment } from "./interfaces";
import { prettyPrintValue as pretty } from "./Utils";
import * as $ from "jquery";
import * as d3 from "d3";

/**
 * Returns an element for the given item
 */
export default function (item: SlicerItem, sizes: { category: number; value: number }, alignTextLeft?: boolean,
        showValueLabels?: boolean, itemTextColor?: string, textOverflow?: boolean) {
    "use strict";
    const { match, matchPrefix, matchSuffix, valueSegments, renderedValue } = item;
    const alignStyle = alignTextLeft ? "text-align:left;" : "";
    const itemFontColor = itemTextColor ? itemTextColor : "#000";
    const categoryStyle = `display:inline-block;overflow:hidden;max-width:${sizes.category}%;${alignStyle};color:${itemFontColor}`;
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
                    ${ valueSegmentsTemplate(valueSegments, showValueLabels, textOverflow) }
                    </span>
                </span>
            </div>
        </div>
    `.trim().replace(/\n/g, ""));
}

/**
 * Template string for the given valueSegments
 */
function valueSegmentsTemplate(valueSegments: ISlicerValueSegment[], showValueLabels: boolean, textOverflow: boolean) {
    "use strict";
    return (valueSegments || []).filter(n => n.width > 0).map(s => {
        const { color, highlightWidth } = s;
        let backgroundColor = "";
        let fontColor = "#333";
        if (color) {
            backgroundColor = `background-color:${color};`;
            const d3Color = d3.hcl(color);
            if (d3Color.l <= 60) {
                fontColor = "#ececec";
            }
        }

        // If we are highlighted at all, then make the background lighter so we can focus
        // on the highlighted
        if (typeof highlightWidth === "number") {
            const { r, g, b } = d3.rgb(color);
            backgroundColor = `background-color:rgba(${r}, ${g}, ${b}, .2)`;
            fontColor = "#333";
        } else if (s.value && s.value < 0) {

            // If it is a negative value, then barbershop pole it
            const darker = d3.rgb(color).darker();
            backgroundColor = `background:repeating-linear-gradient(45deg,${color},${color} 10px,${darker} 10px,${darker} 20px)`;
        }

        const displayValue = s.displayValue || s.value || "0";
        const style = `display:inline-block;width:${s.width}%;${backgroundColor};height:100%;position:relative;color:${fontColor}`;
        let barSpanClass = "value-display";
        let textSpanclass = showValueLabels ? "always-display value" : "value";
        if (textOverflow) {
            barSpanClass += " overflow";
            textSpanclass += " overflow";
        }
        return `
            <span style="${style}" title="${(s["name"] ? s["name"] + " - " : "") + displayValue}" class="${barSpanClass}" >
                ${ highlightsTemplate(s) }
                &nbsp;<span class="${textSpanclass}">${displayValue}</span>
            </span>
        `.trim().replace(/\n/g, "");
    }).join("");
}

/**
 * The template string for the highlights
 */
function highlightsTemplate(valueSegment: ISlicerValueSegment) {
    "use strict";
    const { highlightWidth, color } = valueSegment;
    if (typeof highlightWidth === "number") {
        let backgroundColor = "";
        if (color) {
            backgroundColor = `background-color:${color};`;
        }
        const style = `${backgroundColor}position:absolute;left:0;top:0;bottom:0;width:${highlightWidth}%;`;
        return `<span class="value-display-highlight" style="${style}"></span>`;
    }
    return "";
};
