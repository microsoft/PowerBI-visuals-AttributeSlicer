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
 * Test class for SlicerItem
 */

import { ISlicerItem, ISlicerValueSegment, BaseSelection } from "./interfaces";
import { slicerItemTemplate } from "./slicerItemTemplate";
import { expect } from "chai";
import { select } from "d3-selection";
describe("SlicerItem", () => {
	function callTemplate(
		text: string,
		valueSegments?: ISlicerValueSegment[],
		alignTextLeft?: boolean,
		showValueLabels?: boolean,
		itemTextColor?: string,
	): BaseSelection {
		return slicerItemTemplate(
			<ISlicerItem>{
				id: text,
				text,
				valueSegments,
			},
			{
				category: 23,
				value: 77,
			},
			alignTextLeft,
			showValueLabels,
			itemTextColor,
		);
	}

	function templateWithMatch(): { element: BaseSelection; text: string } {
		return {
			element: callTemplate("HELLO"),
			text: "HELLO",
		};
	}

	function templateWithMatchAndSingleSegment(): {
		element: BaseSelection;
		text: string;
		segments: ISlicerValueSegment[];
	} {
		const segments: ISlicerValueSegment[] = [
			{
				value: 12,
				displayValue: 54,
				width: 30,
				color: "orange",
			},
		];

		return {
			element: callTemplate("HELLO", segments),
			text: "HELLO",
			segments,
		};
	}

	function templateWithMatchAndSingleSegmentWithHighlights(): {
		element: BaseSelection;
		text: string;
		segments: ISlicerValueSegment[];
	} {
		const segments: ISlicerValueSegment[] = [
			{
				value: 12,
				displayValue: 54,
				width: 30,
				highlightWidth: 10,
				color: "red",
			},
		];

		return {
			element: callTemplate("HELLO", segments),
			text: "HELLO",
			segments,
		};
	}

	function templateWithMatchAndMultipleSegments(): {
		element: BaseSelection;
		text: string;
		segments: ISlicerValueSegment[];
	} {
		const segments: ISlicerValueSegment[] = [
			{
				value: 12,
				displayValue: 54,
				width: 30,
				color: "orange",
			},
			{
				value: 45,
				displayValue: 12,
				width: 54,
				color: "green",
			},
		];

		return {
			element: callTemplate("HELLO", segments),
			text: "HELLO",
			segments,
		};
	}
	function templateWithMatchAndFormatOptions(
		leftAlign: boolean,
		showValues?: boolean,
		textColor?: string,
	): { element: BaseSelection; text: string } {
		const segments: ISlicerValueSegment[] = [
			{
				value: 12,
				displayValue: 54,
				width: 30,
				highlightWidth: 10,
				color: "red",
			},
		];

		return {
			element: callTemplate(
				"HELLO",
				segments,
				leftAlign,
				showValues,
				textColor,
			),
			text: "HELLO",
		};
	}

	function templateWithMatchScriptTag(): {
		element: BaseSelection;
		html: string;
	} {
		return {
			element: callTemplate("<script>Hello</script>"),
			html: "&lt;script&gt;Hello&lt;/script&gt;",
		};
	}

	it("should display the text on an item with a text", () => {
		const { element, text } = templateWithMatch();
		expect(
			element
				.select(".text")
				.text()
				.replace(/ /g, ""),
		).to.be.equal(text);
	});
	it("should display the correct widths of the category and value containers", () => {
		const element = callTemplate("HELLO");
		expect(
			element.select(".category-container").style("max-width"),
		).to.be.deep.equal("23%"); // 23 is from `callTemplate`
		expect(
			element.select(".value-container").style("max-width"),
		).to.be.deep.equal("77%"); // 23 is from `callTemplate`
	});
	it("should display a single segment's width correctly", () => {
		const { element, segments } = templateWithMatchAndSingleSegment();
		const result = element
			.selectAll(".value-display")
			.nodes()
			.map((ele: HTMLElement) => select(ele).style("width"));
		expect(result).to.be.deep.equal(
			segments.map((n: ISlicerValueSegment): string => `${n.width}%`),
		);
	});
	it("should display a single segment's color correctly", () => {
		const { element, segments } = templateWithMatchAndSingleSegment();
		const result = element
			.selectAll(".value-display")
			.nodes()
			.map((ele: HTMLElement) => select(ele).style("background-color"));
		expect(result).to.be.deep.equal(
			segments.map((n: ISlicerValueSegment): string => n.color),
		);
	});
	it("should display a single segment's displayValue correctly", () => {
		const { element, segments } = templateWithMatchAndSingleSegment();
		const result = element
			.selectAll(".value-display")
			.nodes()
			.map((ele: HTMLElement) =>
				select(ele)
					.text()
					.replace(/\s/g, ""),
			);
		expect(result).to.be.deep.equal(
			segments.map((n: ISlicerValueSegment) => `${n.displayValue}`),
		);
	});
	it("should display a multiple segment's width correctly", () => {
		const { element, segments } = templateWithMatchAndMultipleSegments();
		const result = element
			.selectAll(".value-display")
			.nodes()
			.map((ele: HTMLElement) => select(ele).style("width"));
		expect(result).to.be.deep.equal(
			segments.map((n: ISlicerValueSegment) => `${n.width}%`),
		);
	});
	it("should display a multiple segment's color correctly", () => {
		const { element, segments } = templateWithMatchAndMultipleSegments();
		const result = element
			.selectAll(".value-display")
			.nodes()
			.map((ele: HTMLElement) => select(ele).style("background-color"));
		expect(result).to.be.deep.equal(
			segments.map((n: ISlicerValueSegment) => n.color),
		);
	});
	it("should display a multiple segment's displayValue correctly", () => {
		const { element, segments } = templateWithMatchAndMultipleSegments();
		const result = element
			.selectAll(".value-display")
			.nodes()
			.map((ele: HTMLElement) =>
				select(ele)
					.text()
					.replace(/\s/g, ""),
			);
		expect(result).to.be.deep.equal(
			segments.map((n: ISlicerValueSegment) => `${n.displayValue}`),
		);
	});
	it("should display segment highlights correctly", () => {
		const { element } = templateWithMatchAndSingleSegmentWithHighlights();
		// background-color:rgba(${r}, ${g}, ${b}, .4)
		const result = element
			.selectAll(".value-display")
			.nodes()
			.map(ele => select(ele).style("background-color"))[0];

		// It lightens the main part, .2 opacity on red
		expect(result).to.be.deep.equal("rgba(255, 0, 0, 0.2)");

		const highlightResult = element
			.selectAll(".value-display-highlight")
			.nodes()
			.map((ele: HTMLElement) => select(ele).style("background-color"))[0];
		expect(highlightResult).to.be.deep.equal("red");
	});
	it("should not align items left when alignTextLeft is false", () => {
		const { element } = templateWithMatchAndFormatOptions(false);
		expect(
			element.select(".category-container").style("text-align"),
		).to.be.equal("");
	});
	it("should align items left when alignTextLeft is true", () => {
		const { element } = templateWithMatchAndFormatOptions(true);
		expect(
			element.select(".category-container").style("text-align"),
		).to.be.equal("left");
	});
	it("should not add always-display class to value labels when showValueLabels is false", () => {
		const { element } = templateWithMatchAndFormatOptions(false, false);
		expect(element.select(".value").classed("always-display")).to.be.equal(
			false,
			"Has always-display class, it shouldn't",
		);
	});
	it("should add always-display class to value labels when showValueLabels is true", () => {
		const { element } = templateWithMatchAndFormatOptions(false, true);
		expect(element.select(".value").classed("always-display")).to.be.equal(
			true,
			"Doesn't have always-display class, it should",
		);
	});
	it("should use the default font color if none is specified", () => {
		const { element } = templateWithMatchAndFormatOptions(false, false);
		expect(element.select(".category-container").style("color")).to.be.equal(
			"rgb(0, 0, 0)",
		);
	});
	it("should use the font color specified", () => {
		const { element } = templateWithMatchAndFormatOptions(false, false, "#333");
		expect(element.select(".category-container").style("color")).to.be.equal(
			"rgb(51, 51, 51)",
		);
	});
	it("should html decode text text", () => {
		const { element, html } = templateWithMatchScriptTag();
		expect(element.select(".text").html()).to.be.equal(html);
	});
});
