/*
 * MIT License
 *
 * Copyright (c) 2016 Microsoft
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

import { default as calculateSegmentData } from "./calculateSegments";
import powerbiVisualsApi from "powerbi-visuals-api";

import {
	IColorSettings,
	ItemWithValueSegments,
	ColorMode,
	IValueSegment,
	IColoredObject,
} from "../interfaces";
import ISelectionIdBuilder = powerbiVisualsApi.visuals.ISelectionIdBuilder;
import PrimitiveValue = powerbiVisualsApi.PrimitiveValue;

import lodashGet from "lodash.get";
import colors from "./colors";

/**
 * Converts the dataView into a set of items that have a name, and a set of value segments.
 * Value segments being the grouped values from the dataView mapped to a color
 * *Note* This will only work with dataViews/dataViewMappings configured a certain way
 * @param dataView The dataView to convert
 * @param onCreateItem A function that gets called when an item is created
 * @param settings The color settings to use when converting
 */
export function convertItemsWithSegments(
	dataView: powerbiVisualsApi.DataView,
	onCreateItem: any,
	settings?: IColorSettings,
	createIdBuilder?: () => ISelectionIdBuilder,
) {
	"use strict";
	let items: ItemWithValueSegments[];
	const dvCats = lodashGet(dataView, "categorical.categories");
	const categories = <PrimitiveValue[]>(
		lodashGet(dataView, "categorical.categories[0].values")
	);
	const values = lodashGet(dataView, "categorical.values");
	if (categories) {
		settings = <any>settings || {};

		// Whether or not the gradient coloring mode should be used
		const shouldUseGradient = settings.colorMode === ColorMode.Gradient;

		// We should only add gradients if the data supports gradients, and the user has gradients enabled
		const shouldAddGradients =
			dataSupportsGradients(dataView) && shouldUseGradient;

		// If the data supports default color, then use id.
		const defaultColor = dataSupportsDefaultColor(dataView)
			? colors[0]
			: undefined;

		// We should only colorize instances if the data supports colorized instances and the user isn't
		// trying to use gradients
		const shouldAddInstanceColors =
			dataSupportsColorizedInstances(dataView) && !shouldUseGradient;

		// Calculate the segments
		// Segment info is the list of segments that each row should contain, with the colors of the segements.
		// i.e. [<Sum of Id: Color Blue>, <Average Grade: Color Red>]
		const segmentInfo = calculateSegmentData(
			values,
			defaultColor,
			shouldAddGradients ? settings.gradient : undefined,
			shouldAddInstanceColors ? settings.instanceColors : undefined,
		);

		// Iterate through each of the rows (or categories)
		items = categories.map((category, rowIdx) => {
			const id = createIdBuilder
				? createIdBuilder()
						.withCategory(dvCats[0], rowIdx)
						.createSelectionId()
				: rowIdx;
			let rowTotal = 0;
			let segments: any;

			// If we have bars
			if (values) {
				const segmentData = createSegments(values, segmentInfo, rowIdx);
				segments = segmentData.segments;
				rowTotal = segmentData.total;
				if (settings && settings.reverseOrder) {
					segments.reverse();
				}
			}
			const item = onCreateItem(dvCats, rowIdx, rowTotal, id, segments);
			item.valueSegments = segments;
			return item;
		});

		// Computes the rendered values for each of the items
		computeRenderedValues(items);

		return { items, segmentInfo };
	}
}

/**
 * Computes the rendered values for the given set of items
 * @param items The set of items to compute for
 */
export function computeRenderedValues(items: ItemWithValueSegments[]) {
	"use strict";
	if (items && items.length) {
		const range = computeRange(items);
		let maxWidth = 0;
		items.forEach(item => {
			const segments = item.valueSegments || [];
			let rowWidth = 0;
			segments.forEach((segment, segmentIdx) => {
				segment.width =
					(Math.abs(segment.value) / range.max / segments.length) * 100;
				rowWidth += segment.width;
			});
			if (rowWidth > maxWidth) {
				maxWidth = rowWidth;
			}
		});
		if (maxWidth > 0) {
			items.forEach(item => {
				item.renderedValue = 100 * (100 / maxWidth);
			});
		}
	}
}

/**
 * Computes the range of all of the value segments
 */
function computeRange(items: ItemWithValueSegments[]) {
	"use strict";
	// const segmentDomains: IDomain[] = [];
	let max = 0;
	if (items && items.length) {
		items.forEach(item => {
			(item.valueSegments || []).forEach((segment, colIdx) => {
				const segmentValue = segment.value;
				if (typeof segmentValue === "number") {
					const absVal = Math.abs(segmentValue);
					if (absVal > max) {
						max = absVal;
					}
				}
			});
		});
	}
	return { min: 0, max };
}

/**
 * True if the given dataview supports multiple value segments
 * @param dv The dataView to check
 */
export function dataSupportsValueSegments(dv: powerbiVisualsApi.DataView) {
	"use strict";
	return lodashGet(dv, "categorical.values.length", 0) > 0;
}

/**
 * Returns true if the data supports default colors
 * @param dv The dataView to check
 */
export function dataSupportsDefaultColor(dv: powerbiVisualsApi.DataView) {
	"use strict";

	// Default color only works on a single value instance
	if (dataSupportsValueSegments(dv)) {
		return lodashGet(dv, "categorical.values.length", 0) === 1;
	}

	return false;
}

/**
 * Returns true if gradients can be used with the data
 * @param dv The dataView to check
 */
export function dataSupportsGradients(dv: powerbiVisualsApi.DataView) {
	"use strict";

	// We can use gradients on ANY data that has more than one value, otherwise it doesn't make sense
	if (dataSupportsValueSegments(dv)) {
		return lodashGet(dv, "categorical.values.length", 0) > 0;
	}
	return false;
}

/**
 * Returns true if individiual instances of the dataset can be uniquely colored
 * @param dv The dataView to check
 */
export function dataSupportsColorizedInstances(dv: powerbiVisualsApi.DataView) {
	"use strict";

	// If there are no value segments, then there is definitely going to be no instances
	if (dataSupportsValueSegments(dv) && dv.categorical.values.grouped) {
		// We can uniquely color items that have an identity associated with it
		const grouped = dv.categorical.values.grouped();
		return grouped.filter(n => !!n.identity).length > 0;
	}
	return false;
}

/**
 * Creates segments for the given values, and the information on how the value is segmented
 * @param columns The columns to create segment for
 * @param segmentData The data for the segments
 * @param rowIdx The row to generate the segment for
 */
function createSegments(
	columns: powerbiVisualsApi.DataViewValueColumns,
	segmentData: IColoredObject[],
	rowIdx: number,
) {
	"use strict";
	let total = 0;
	const segments = segmentData.map((si, colIdx) => {
		const highlights = columns[colIdx].highlights || [];
		const highlight = highlights[rowIdx];
		const segmentValue = columns[colIdx].values[rowIdx];
		if (typeof segmentValue === "number") {
			total += segmentValue;
		}

		const { color, name } = si;

		// There is some sort of highlighting going on
		const segment = <IValueSegment>{
			name,
			color,
			value: segmentValue,
			displayValue: segmentValue,
			width: 0,
		};

		if (highlights && highlights.length) {
			let highlightWidth = 0;
			if (segmentValue && typeof segmentValue === "number" && highlight) {
				highlightWidth = (<number>highlight / segmentValue) * 100;
			}
			segment.highlightWidth = highlightWidth;
		}

		return segment;
	});
	return { segments, total };
}

/**
 * Represents a domain of some value
 */
export interface IDomain {
	min: number;
	max: number;
}
