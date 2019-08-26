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

import { IGradient } from "../interfaces";
import powerbiVisualsApi from "powerbi-visuals-api";
import colors from "./colors";
import { scaleLinear, ScaleLinear } from "d3-scale";
import { interpolateRgb } from "d3-interpolate";
import { min, max } from "d3-array";

/**
 * A utility method that takes a dataView, and breaks down the values into named segments with colors
 * Colorizing prority: "#ccc" < defaultColor < gradient < segmentColors
 * @param columns The set of columns in the dataView
 * @param defaultColor The default color to use
 * @param gradient The gradient to use
 * @param segmentColors The colors for the individual instances of segments to use
 */
export default function calculateSegments(
	columns: powerbiVisualsApi.DataViewValueColumns,
	defaultColor?: string,
	gradient?: IGradient, // The gradient used to color the individual segments
	segmentColors?: { color: string; identity?: any }[],
) {
	// The colors for each segment
	"use strict";
	let segmentInfo: { name: any; identity?: any }[] = [];
	if (columns && columns.length) {
		const isSeriesData = !!(columns.source && columns.source.roles["Series"]);
		segmentInfo = isSeriesData
			? <any>columns.grouped()
			: columns.map((n, i) => ({
					name: i + 1 + "",
					identity: n.identity,
			  }));
	}

	let gradientScale: ScaleLinear<string, number>;
	if (gradient) {
		const { startValue, endValue, startColor, endColor } = gradient;
		const minValue =
			startValue !== undefined ? startValue : min(segmentInfo.map(n => n.name));
		const maxValue =
			endValue !== undefined ? endValue : max(segmentInfo.map(n => n.name));
		gradientScale = scaleLinear<string, number>()
			.domain([
				isNaN(minValue) ? 0 : minValue,
				isNaN(maxValue) ? segmentInfo.length - 1 : maxValue,
			])
			.interpolate(<any>interpolateRgb)
			.range([startColor, endColor]);
	}

	return segmentInfo
		.sort((a, b) => {
			if ((!a && b) || a.name < b.name) {
				return -1;
			} else if ((a && !b) || a.name > b.name) {
				return 1;
			}
			return 0;
		})
		.map((si, i) => {
			const { name, identity } = si;
			let color = colors[i];
			if (segmentColors && segmentColors[i]) {
				color = segmentColors[i].color;
			} else if (gradientScale) {
				color = <any>gradientScale(isNaN(name) ? i : name);
			} else {
				color = defaultColor || colors[i];
			}
			color = color || "#ccc";
			return {
				name,
				identity,
				color,
			};
		});
}
