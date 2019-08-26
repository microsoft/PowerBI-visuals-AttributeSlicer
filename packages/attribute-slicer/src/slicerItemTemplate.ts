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

import { ISlicerItem, ISlicerValueSegment } from "./interfaces";
import { prettyPrintValue as pretty } from "./Utils";
import { html } from "./Utils";
import { select, Selection } from "d3-selection";
import { hcl, HCLColor, rgb, RGBColor } from "d3-color";

const BASE_ITEM_TEMPLATE = () => html`
	<div style="white-space:nowrap" class="item" style="">
		<div
			style="margin-left: 5px;vertical-align:middle;height:100%"
			class="display-container"
		>
			<span style="" title="" class="category-container">
				<span class="text"></span>
			</span>
			<span style="" class="value-container">
				<span style="" class="value-fill"> </span>
			</span>
		</div>
	</div>
`;

const BASE_VALUE_SEGMENTS_TEMPLATE = () =>
	html`
		<span style="" title="" class=""></span>
	`;
const BASE_HIGHLIGHTS_TEMPLATE = () =>
	html`
		<span class="value-display-highlight" style=""></span>
	`;

/**
 * Returns an element for the given item
 */
export function slicerItemTemplate(
	item: ISlicerItem,
	sizes: { category: number; value: number },
	alignTextLeft?: boolean,
	showValueLabels?: boolean,
	itemTextColor?: string,
	textOverflow?: boolean,
): Selection<HTMLElement, {}, null, null> {
	const { text, valueSegments, renderedValue } = item;
	const itemUi = select(BASE_ITEM_TEMPLATE());

	// use jquery to html the match text to prevent xss
	itemUi.select(".text").text(pretty(text));

	itemUi
		.select(".category-container")
		.attr("title", pretty(text))
		.attr(
			"style",
			`display:inline-block;overflow:hidden;max-width:${sizes.category}%;${
				alignTextLeft ? "text-align:left;" : ""
			}color:${itemTextColor || "#000"}`,
		);

	itemUi
		.select(".value-container")
		.attr(
			"style",
			`display:inline-block;max-width:${sizes.value}%;height:100%`,
		);

	const fillEle = itemUi
		.select<HTMLElement>(".value-fill")
		.attr("style", `display:inline-block;width:${renderedValue}%;height:100%`);

	valueSegmentsTemplate(valueSegments, showValueLabels, textOverflow).forEach(
		n => {
			fillEle.append(() => n.node());
		},
	);

	return itemUi;
}

/**
 * Template string for the given valueSegments
 */
function valueSegmentsTemplate(
	valueSegments: ISlicerValueSegment[],
	showValueLabels: boolean,
	textOverflow: boolean,
): Selection<HTMLElement, {}, null, null>[] {
	return (valueSegments || [])
		.filter((n: ISlicerValueSegment) => n.width > 0)
		.map((s: ISlicerValueSegment) => {
			const { color, highlightWidth } = s;
			let backgroundColor: string = "";
			let fontColor: string = "#333";
			if (color) {
				backgroundColor = `${color}`;
				const d3Color: HCLColor = hcl(color);
				if (d3Color.l <= 60) {
					fontColor = "#ececec";
				}
			}

			// If we are highlighted at all, then make the background lighter so we can focus
			// on the highlighted
			if (typeof highlightWidth === "number") {
				const { r, g, b } = rgb(color);
				backgroundColor = `rgba(${r}, ${g}, ${b}, .2)`;
				fontColor = "#333";
			} else if (s.value && s.value < 0) {
				// If it is a negative value, then barbershop pole it
				const darker: RGBColor = rgb(color).darker();
				backgroundColor = `repeating-linear-gradient(45deg,${color},${color} 10px,${darker} 10px,${darker} 20px)`;
			}

			const displayValue: string | number = s.displayValue || s.value || "0";
			let barSpanClass: string = "value-display";
			let textSpanclass: string = showValueLabels
				? "always-display value"
				: "value";
			if (textOverflow) {
				barSpanClass += " overflow";
				textSpanclass += " overflow";
			}

			const ele = select(BASE_VALUE_SEGMENTS_TEMPLATE());
			ele
				.attr("title", (s.name ? `${s.name} - ` : "") + displayValue)
				.attr("class", barSpanClass)
				.attr(
					"style",
					`display:inline-block;width:${s.width}%;height:100%;position:relative;color:${fontColor};background:${backgroundColor}`,
				);

			const highlights = highlightsTemplate(s);
			if (highlights) {
				ele.append(() => highlights);
			}

			const textSpan = select(document.createElement("span"))
				.attr("class", textSpanclass)
				.text(displayValue);

			ele.append(() => textSpan.node());

			return ele;
		});
}

/**
 * The template string for the highlights
 */
function highlightsTemplate(
	valueSegment: ISlicerValueSegment,
): HTMLElement | void {
	const { highlightWidth, color } = valueSegment;
	if (typeof highlightWidth === "number") {
		return select(BASE_HIGHLIGHTS_TEMPLATE())
			.attr(
				"style",
				`top:0;left:0;bottom:0;width:${highlightWidth}%;position:absolute;${
					color ? `background-color:${color};` : ""
				}`,
			)
			.node();
	}
}
