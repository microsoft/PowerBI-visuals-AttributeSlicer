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
import lodashGet from "lodash.get";
import { IColoredObject } from "../../interfaces";

export function parseColoredInstances(
	createBuilder: () => powerbiVisualsApi.visuals.ISelectionIdBuilder,
	dataView: powerbiVisualsApi.DataView,
	defaultColor: (idx: number) => string,
	objName: string,
	propName: string,
): IColoredObject[] {
	const catValues = <powerbiVisualsApi.DataViewValueColumns>(
		lodashGet(dataView, "categorical.values", [])
	);
	const values = (catValues && catValues.grouped && catValues.grouped()) || [];
	if (values && values.forEach) {
		return values.map((n, i) => {
			const objs = n.objects;
			const obj = objs && objs[objName];
			const prop = obj && obj[propName];
			const defaultValColor = defaultColor(i) || "#ccc";
			return {
				name: `${n.name || ""}`,
				color: lodashGet(prop, "solid.color", defaultValColor),
				identity: createBuilder()
					.withSeries(catValues, n)
					.createSelectionId(),
			};
		});
	}
}
