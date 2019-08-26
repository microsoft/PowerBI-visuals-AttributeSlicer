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

import powerbiVisualsApi from "powerbi-visuals-api";

import DataView = powerbiVisualsApi.DataView;
import DataViewMetadataColumn = powerbiVisualsApi.DataViewMetadataColumn;
import DataViewValueColumns = powerbiVisualsApi.DataViewValueColumns;
import DataViewValueColumnGroup = powerbiVisualsApi.DataViewValueColumnGroup;
import DataViewCategoryColumn = powerbiVisualsApi.DataViewCategoryColumn;
import PrimitiveValue = powerbiVisualsApi.PrimitiveValue;

import { createCategoryFormatter, createValueFormatter } from "./formatting";
import {
	IAttributeSlicerVisualData,
	ISlicerItem,
	ListItem,
	IColorSettings,
	IValueSegment,
	ItemWithValueSegments,
} from "./interfaces";
import { valueFormatter } from "powerbi-visuals-utils-formattingutils";
const HEX_COLOR_REGEX: RegExp = /#[0-9A-F]{3,6}/;
const RGB_COLOR_REGEX: RegExp = /rgba?\s*\(\s*[\d\.]+\s*,\s*[\d\.]+\s*,\s*[\d\.]+\s*(,\s*[\d\.]+\s*)?\)/;
import lodashGet from "lodash.get";
import IValueFormatter = valueFormatter.IValueFormatter;
import { convertItemsWithSegments } from "./visual-utils/convertItemsWithSegments";

/**
 * Converts the given dataview into a list of listitems
 */
export function converter(
	dataView: DataView,
	valFormat?: IValueFormatter,
	catFormat?: IValueFormatter,
	settings?: IColorSettings,
	createIdBuilder?: () => powerbiVisualsApi.visuals.ISelectionIdBuilder,
): IAttributeSlicerVisualData {
	if (dataView && dataView.categorical) {
		if (!valFormat) {
			valFormat = createValueFormatter();
		}
		if (!catFormat) {
			catFormat = createCategoryFormatter(dataView);
		}

		const segmentColors: {
			[key: string]: string;
		} = calculateSegmentColorsFromData(dataView);

		return <IAttributeSlicerVisualData>(<unknown>convertItemsWithSegments(
			dataView,
			(
				dvCats: DataViewCategoryColumn[],
				catIdx: number,
				total: number,
				selectionid: powerbiVisualsApi.visuals.ISelectionId,
				valueSegments: IValueSegment[],
			) => {
				const item: ISlicerItem = createItem(
					buildCategoryDisplay(dvCats, catIdx, catFormat),
					total,
					`${dvCats[0].values[catIdx]}`,
					undefined,
					"#ccc",
				);
				(valueSegments || []).forEach((segment: IValueSegment, i: number) => {
					// Update the segments color to the ones pulled from the data, if it exists
					segment.color = segmentColors[i] || segment.color;
					segment.displayValue = valFormat.format(segment.value);
				});

				return <ItemWithValueSegments>(<unknown>item);
			},
			dataSupportsColorizedInstances(dataView) ? settings : undefined,
			createIdBuilder,
		));
	}
}

/**
 * Gets a map of segment indexes to colors, maps the "colored by" segments to colors
 * @param dataView The dataView to get the colors from
 */
export function calculateSegmentColorsFromData(
	dataView: DataView,
): { [key: string]: string } {
	const values: DataViewValueColumns = dataView.categorical.values;

	// Sometimes the segments have RGB names, use them as colors
	const groups: DataViewValueColumnGroup[] = values && values.grouped && values.grouped();
	const segmentColors: { [key: string]: string } = {};

	// If the segment by is a color segment
	if (
		dataView.metadata.columns.filter(
			(n: DataViewMetadataColumn) => n.roles && n.roles.Color,
		).length >= 0 &&
		groups
	) {
		groups.forEach((n: DataViewValueColumnGroup, i: number) => {
			const name: string = `${n.name || ""}`;
			if (name && (HEX_COLOR_REGEX.test(name) || RGB_COLOR_REGEX.test(name))) {
				segmentColors[i] = name;
			}
		});
	}

	return segmentColors;
}

/**
 * Builds the display string for the given category
 */
export function buildCategoryDisplay(
	cats: DataViewCategoryColumn[],
	catIdx: number,
	categoryFormatter?: valueFormatter.IValueFormatter,
): string {
	return (cats || [])
		.map((n: DataViewCategoryColumn) => {
			const category: PrimitiveValue = n.values[catIdx];

			return categoryFormatter ? categoryFormatter.format(category) : category;
		})
		.join(" - ");
}

/**
 * A utility method to create a slicer item
 */
export function createItem(
	category: string,
	value: string | number | Date,
	id: string,
	renderedValue?: string | number,
	color: string = "",
): ListItem {
	return {
		id,
		text: category,
		color,
		value: value || 0,
		renderedValue,
	};
}

export type IConversionSettings = IColorSettings & { reverseBars?: boolean };

/**
 * True if the given dataview supports multiple value segments
 */
export function dataSupportsValueSegments(dv: DataView): boolean {
	return lodashGet(dv, "categorical.values.length", 0) > 0;
}

/**
 * Returns true if individiual instances of the dataset can be uniquely colored
 */
export function dataSupportsColorizedInstances(dv: DataView): boolean {
	// If there are no value segments, then there is definitely going to be no instances
	if (dataSupportsValueSegments(dv)) {
		// We can uniquely color items that have an identity associated with it
		const grouped: DataViewValueColumnGroup[] = dv.categorical.values.grouped();

		return (
			grouped.filter((n: DataViewValueColumnGroup) => !!n.identity).length > 0
		);
	}

	return false;
}
