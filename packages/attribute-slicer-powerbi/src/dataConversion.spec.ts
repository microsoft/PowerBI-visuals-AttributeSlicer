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

/**
 * Tests for dataConverion
 */

import { converter as convert } from "./dataConversion";
import {
	IAttributeSlicerSegmentInfo,
	IAttributeSlicerVisualData,
	ISlicerItem,
	ISlicerValueSegment,
	IColorSettings,
	IValueSegment,
} from "./interfaces";
// tslint:disable-next-line:import-name
import State from "./state";
import categoriesAndValues from "./test_data/categoriesAndValues";
import categoriesAndValuesWithSeries from "./test_data/categoriesAndValuesWithSeries";
import categoriesOnly from "./test_data/categoriesOnly";
import { expect } from "chai";
import powerbiVisualsApi from "powerbi-visuals-api";
import { MockIVisualHost } from "powerbi-visuals-utils-testutils";
import DataView = powerbiVisualsApi.DataView;

describe("dataConversion", () => {
	describe("convert", () => {
		describe("data with only categories", () => {
			it("should convert the categories correctly", () => {
				const { options, categories } = categoriesOnly();
				const converted: IAttributeSlicerVisualData = convert(
					options.dataViews[0],
				);
				const catNames: string[] = converted.items.map(
					(n: ISlicerItem) => n.text,
				);
				expect(catNames).to.be.deep.equal(categories);
			});
			it("should convert the segment infos values correctly", () => {
				const { options } = categoriesOnly();
				const converted: IAttributeSlicerVisualData = convert(
					options.dataViews[0],
				);

				// There are no segments because only "Categories" has been given to the converter
				expect(converted.segmentInfo).to.be.empty;
			});
			it("should convert the items correctly", () => {
				const { options } = categoriesOnly();
				const converted: IAttributeSlicerVisualData = convert(
					options.dataViews[0],
				);

				converted.items.forEach((n: ISlicerItem) => {
					expect(n.color).to.be.equal("#ccc"); // The default color
					expect(n.id).to.not.be.eq(undefined, "Id should be defined");

					// None of the items should have any of the below since there is no value data
					expect(n.value).to.be.oneOf([0, undefined]);
					expect(n.renderedValue).to.be.oneOf([0, undefined]);
					expect(n.valueSegments).to.be.oneOf([0, undefined]);
				});
			});
		});
		describe("data with categories and values (no series)", () => {
			it("should convert the categories correctly", () => {
				const { options, categories } = categoriesAndValues();
				const converted: IAttributeSlicerVisualData = convert(
					options.dataViews[0],
				);
				const catNames: string[] = converted.items.map(
					(n: ISlicerItem) => n.text,
				);
				expect(catNames).to.be.deep.equal(categories);
			});
			it("should convert the items values correctly", () => {
				const { options, values } = categoriesAndValues();
				const converted: IAttributeSlicerVisualData = convert(
					options.dataViews[0],
				);

				converted.items.forEach((n: ISlicerItem, i: number) => {
					// The "value" property is the total of its child values
					// Something that is pretty darn close to the number
					expect(n.value).to.be.closeTo(values[i].total, 0.2);
				});
			});
			it("should convert the items renderedValue correctly", () => {
				const { options, values } = categoriesAndValues();
				const converted: IAttributeSlicerVisualData = convert(
					options.dataViews[0],
				);
				converted.items.forEach((n: ISlicerItem, i: number) => {
					// The "value" property is the total of its child values
					// Something that is pretty darn close to the number
					expect(n.renderedValue).to.be.closeTo(values[i].renderedValue, 0.2);
				});
			});
			it("should convert the items segment widths correctly", () => {
				const { options, values } = categoriesAndValues();
				const converted: IAttributeSlicerVisualData = convert(
					options.dataViews[0],
				);
				converted.items
					.map((n: ISlicerItem) => n.valueSegments)
					.forEach((n: ISlicerValueSegment[], i: number) => {
						// The segmentWidths should be close
						const segmentWidths: number[] = n.map(
							(m: ISlicerValueSegment) => m.width,
						);
						segmentWidths.forEach((m: number, j: number) => {
							expect(m).to.be.closeTo(values[i].segments[j].width, 0.2);
						});
					});
			});
			it("should convert the items segment colors correctly", () => {
				const { options, values } = categoriesAndValues();
				const settings: unknown = State.CREATE_FROM_POWERBI<State>(
					options.dataViews[0],
					new MockIVisualHost().createSelectionIdBuilder,
				).colors;
				const converted: IAttributeSlicerVisualData = convert(
					options.dataViews[0],
					undefined,
					undefined,
					<IColorSettings>settings,
				);
				converted.items
					.map((n: ISlicerItem) => n.valueSegments)
					.forEach((n: ISlicerValueSegment[], i: number) => {
						// The segmentColors should be close
						const segmentColors: string[] = n.map(
							(m: ISlicerValueSegment) => m.color,
						);
						segmentColors.forEach((m: string, j: number) => {
							expect(m).to.be.equal(values[i].segments[j].color);
						});
					});
			});
			it("should convert the segment infos values correctly", () => {
				const { options, segmentInfos } = categoriesAndValues();
				const converted: IAttributeSlicerVisualData = convert(
					options.dataViews[0],
				);

				// There are no segments because only "Categories" has been given to the converter
				expect(converted.segmentInfo).to.be.deep.equal(segmentInfos);
			});
			it("should convert the items correctly", () => {
				const { options } = categoriesAndValues();
				const converted: IAttributeSlicerVisualData = convert(
					options.dataViews[0],
				);

				converted.items.forEach((n: ISlicerItem) => {
					expect(n.color).to.be.equal("#ccc"); // The default color
					expect(n.id).to.not.be.eq(undefined, "id should not be undefined");

					// None of the items should have any of the below since there is no value data
					expect(n.value, "Value must not be empty").to.not.be.undefined.and.to
						.not.be.null;
					expect(n.renderedValue, "Rendered value must not be empty").to.not.be
						.undefined.and.to.not.be.null;
					expect(n.valueSegments, "Value segments must not be empty").to.not.be
						.undefined.and.to.not.be.null;
				});
			});
		});
		describe("data with categories and values with series", () => {
			it("should convert the categories correctly", () => {
				const { options, expected } = categoriesAndValuesWithSeries();
				const converted: IAttributeSlicerVisualData = convert(
					options.dataViews[0],
				);
				expect(
					converted.items.map((n: ISlicerItem) => n.text),
				).to.be.deep.equal(expected.items.map((n: ISlicerItem) => n.text));
			});
			it("should convert the items values correctly", () => {
				const { options, expected } = categoriesAndValuesWithSeries();
				const converted: IAttributeSlicerVisualData = convert(
					options.dataViews[0],
				);
				converted.items.forEach((n: ISlicerItem, i: number) => {
					// The "value" property is the total of its child values
					// Something that is pretty darn close to the number
					expect(n.value).to.be.closeTo(<number>expected.items[i].value, 0.2);
				});
			});
			it("should convert the items renderedValue correctly", () => {
				const { options, expected } = categoriesAndValuesWithSeries();
				const converted: IAttributeSlicerVisualData = convert(
					options.dataViews[0],
				);
				converted.items.forEach((n: ISlicerItem, i: number) => {
					// The "value" property is the total of its child values
					// Something that is pretty darn close to the number
					expect(n.renderedValue).to.be.closeTo(
						<number>expected.items[i].renderedValue,
						0.2,
					);
				});
			});
			it("should convert the items segment widths correctly", () => {
				const { options, expected } = categoriesAndValuesWithSeries();
				const converted: IAttributeSlicerVisualData = convert(
					options.dataViews[0],
				);
				converted.items
					.map((n: ISlicerItem) => n.valueSegments)
					.forEach((n: IValueSegment[], i: number) => {
						// The segmentWidths should be close
						const segmentWidths: number[] = n.map(
							(m: IValueSegment) => m.width,
						);
						segmentWidths.forEach((m: number, j: number) => {
							expect(m).to.be.closeTo(
								expected.items[i].valueSegments[j].width,
								0.2,
							);
						});
					});
			});
			it("should convert the items segment colors correctly", () => {
				const { options, expected } = categoriesAndValuesWithSeries();
				const settings: unknown = State.CREATE_FROM_POWERBI<State>(
					options.dataViews[0],
					new MockIVisualHost().createSelectionIdBuilder,
				).colors;

				const converted: IAttributeSlicerVisualData = convert(
					options.dataViews[0],
					undefined,
					undefined,
					<IColorSettings>settings,
				);
				converted.items
					.map((n: ISlicerItem) => n.valueSegments)
					.forEach((n: ISlicerValueSegment[], i: number) => {
						// The segmentColors should be close
						const segmentColors: string[] = n.map(
							(m: ISlicerValueSegment) => m.color,
						);
						expect(segmentColors.length).to.be.equal(
							expected.segmentInfo.length,
						);
						segmentColors.forEach((m: string, j: number) => {
							expect(m).to.be.equal(expected.items[i].valueSegments[j].color);
						});
					});
			});
			it("should convert the segment infos names correctly", () => {
				const { options, expected } = categoriesAndValuesWithSeries();
				const converted: IAttributeSlicerVisualData = convert(
					options.dataViews[0],
				);

				// There are no segments because only "Categories" has been given to the converter
				expect(
					converted.segmentInfo.map((n: IAttributeSlicerSegmentInfo) => n.name),
				).to.be.deep.equal(
					expected.segmentInfo.map((n: IAttributeSlicerSegmentInfo) => n.name),
				);
			});
			it("should convert the segment infos colors correctly", () => {
				const { options, expected } = categoriesAndValuesWithSeries();
				const settings: unknown = State.CREATE_FROM_POWERBI<State>(
					options.dataViews[0],
					new MockIVisualHost().createSelectionIdBuilder,
				).colors;
				const converted: IAttributeSlicerVisualData = convert(
					options.dataViews[0],
					undefined,
					undefined,
					<IColorSettings>settings,
				);

				// There are no segments because only "Categories" has been given to the converter
				expect(
					converted.segmentInfo.map(
						(n: IAttributeSlicerSegmentInfo) => n.color,
					),
				).to.be.deep.equal(
					expected.segmentInfo.map((n: IAttributeSlicerSegmentInfo) => n.color),
				);
			});
			it("should convert the items correctly", () => {
				const { options } = categoriesAndValuesWithSeries();
				const converted: IAttributeSlicerVisualData = convert(
					options.dataViews[0],
				);

				converted.items.forEach((n: ISlicerItem) => {
					expect(n.color).to.be.equal("#ccc"); // The default color
					expect(n.id).to.not.be.eq(undefined, "Id should be defined");

					// None of the items should have any of the below since there is no value data
					expect(n.value, "Value must not be empty").to.not.be.undefined.and.to
						.not.be.null;
					expect(n.renderedValue, "Rendered value must not be empty").to.not.be
						.undefined.and.to.not.be.null;
					expect(n.valueSegments, "Value segments must not be empty").to.not.be
						.undefined.and.to.not.be.null;
				});
			});
		});

		it("should not crash if passed a dataView with no categorical information", () => {
			convert(<DataView>(<unknown>{}));
		});
	});
});
