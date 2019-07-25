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

import { IFilterColumnTarget } from "powerbi-models";
import powerbiVisualsApi from "powerbi-visuals-api";

/**
 * Builds a filter column target for use with the AdvancedFilter API
 * @param source The column to create a filter target for
 */
export default function buildColumnTarget(
	source: powerbiVisualsApi.DataViewMetadataColumn,
): IFilterColumnTarget {
	"use strict";
	if (source) {
		const categoryExpr: any = source && source.expr ? <any>source.expr : null;

		// A lot of this code is based on timeline: https://github.com/Microsoft/powerbi-visuals-timeline/blob/master/src/visual.ts#L950-L958
		// but some extra checks have been added to catch edge cases.

		// I'm not sure when this case happens, but I believe it is an heirarchy, but I took this from PowerBI-visuals-timeline
		const argArg = categoryExpr && categoryExpr.arg && categoryExpr.arg.arg;

		// This gets the table name from the heirarchy
		const argEntity = argArg && argArg.entity;

		// This gets the column off of the heirarchy
		const argProp = argArg && argArg.property;

		const {
			// This one will differ from source.displayName when the user creates a "heirarchy"
			// and then drags one of the columns to the visual, but sometimes the arg from above is there too
			// who knows
			level,

			// This one will differ from source.displayName when the user renames the
			// column explicitly bound to a specific visual...NOT at the global level
			// just for each visual on their fields pane, they can rename the field there.
			ref,
		} = categoryExpr || <any>{};

		// The table off of the expression that represents the field
		const exprSourceEntity =
			categoryExpr && categoryExpr.source && categoryExpr.source.entity;

		// ?
		const queryName = source.queryName.substring(
			0,
			source.queryName.indexOf("."),
		);

		const table = argEntity || exprSourceEntity || queryName;
		const column = argProp || ref || level || source.displayName;

		// source.queryName contains wrong table name in case when table was renamed! source.expr.source.entity contains correct table name.
		// source.displayName contains wrong column name in case when Hierarchy mode of showing date was chosen
		return {
			table,
			column,
		};
	}
}
