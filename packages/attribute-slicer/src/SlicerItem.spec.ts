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

import template from "./SlicerItem.tmpl";
import { SlicerItem, ISlicerValueSegment } from "./interfaces";
import { expect } from "chai";
describe("SlicerItem", () => {
    const callTemplate = (match: string, matchPrefix?: string, matchSuffix?: string, valueSegments?: any) => {
        return template({
            id: match,
            match: match,
            matchPrefix: matchPrefix,
            matchSuffix: matchSuffix,
            valueSegments: valueSegments,
        } as any as SlicerItem, {
            category: 23,
            value: 77,
        });
    };
    const templateWithMatch = () => {
        return {
            element: callTemplate("HELLO"),
            match: "HELLO",
        };
    };
    const templateWithMatchAndPrefix = () => {
        return {
            element: callTemplate("HELLO", "PREFIX"),
            match: "HELLO",
            prefix: "PREFIX",
        };
    };
    const templateWithMatchAndSuffix = () => {
        return {
            element: callTemplate("HELLO", "", "SUFFIX"),
            match: "HELLO",
            suffix: "SUFFIX",
        };
    };
    const templateWithMatchAndSingleSegment = () => {
        const segments = [{
            value: 12,
            displayValue: 54,
            width: 30,
            color: "orange",
        }] as ISlicerValueSegment[];
        return {
            element: callTemplate("HELLO", "", "", segments),
            match: "HELLO",
            segments,
        };
    };
    const templateWithMatchAndSingleSegmentWithHighlights = () => {
        const segments = [{
            value: 12,
            displayValue: 54,
            width: 30,
            highlightWidth: 10,
            color: "red",
        }] as ISlicerValueSegment[];
        return {
            element: callTemplate("HELLO", "", "", segments),
            match: "HELLO",
            segments,
        };
    };
    const templateWithMatchAndMultipleSegments = () => {
        const segments = [{
            value: 12,
            displayValue: 54,
            width: 30,
            color: "orange",
        }, {
            value: 45,
            displayValue: 12,
            width: 54,
            color: "green",
        }] as ISlicerValueSegment[];
        return {
            element: callTemplate("HELLO", "", "", segments),
            match: "HELLO",
            segments,
        };
    };
    it("should display the match on an item with a match", () => {
        const { element, match } = templateWithMatch();
        expect(element.find(".match").text().replace(/ /g, "")).to.be.equal(match);
    });
    it("should display the match prefix on an item with a match and a match prefix", () => {
        const { element, match, prefix } = templateWithMatchAndPrefix();
        expect(element.text().replace(/ /g, "")).to.be.equal(prefix + match);
        expect(element.find(".matchPrefix").text().replace(/ /g, "")).to.be.equal(prefix);
    });
    it("should display the match suffix on an item with a match and a match suffix", () => {
        const { element, match, suffix } = templateWithMatchAndSuffix();
        expect(element.text().replace(/ /g, "")).to.be.equal(match + suffix);
        expect(element.find(".matchSuffix").text().replace(/ /g, "")).to.be.equal(suffix);
    });
    it("should display the correct widths of the category and value containers", () => {
        const element = callTemplate("HELLO");
        expect(element.find(".category-container").css("max-width")).to.be.deep.equal("23%"); // 23 is from `callTemplate`
        expect(element.find(".value-container").css("max-width")).to.be.deep.equal("77%"); // 23 is from `callTemplate`
    });
    it("should display a single segment's width correctly", () => {
        const { element, segments } = templateWithMatchAndSingleSegment();
        const result = element.find(".value-display").map((i: number, ele: any) => $(ele).css("width")).toArray();
        expect(result).to.be.deep.equal(segments.map(n => n.width + "%"));
    });
    it("should display a single segment's color correctly", () => {
        const { element, segments } = templateWithMatchAndSingleSegment();
        const result = element.find(".value-display").map((i: number, ele: any) => $(ele).css("backgroundColor")).toArray();
        expect(result).to.be.deep.equal(segments.map(n => n.color));
    });
    it("should display a single segment's displayValue correctly", () => {
        const { element, segments } = templateWithMatchAndSingleSegment();
        const result = element.find(".value-display").map((i: number, ele: any) => $(ele).text().replace(/\s/g, "")).toArray();
        expect(result).to.be.deep.equal(segments.map(n => n.displayValue + ""));
    });
    it("should display a multiple segment's width correctly", () => {
        const { element, segments } = templateWithMatchAndMultipleSegments();
        const result = element.find(".value-display").map((i: number, ele: any) => $(ele).css("width")).toArray();
        expect(result).to.be.deep.equal(segments.map(n => n.width + "%"));
    });
    it("should display a multiple segment's color correctly", () => {
        const { element, segments } = templateWithMatchAndMultipleSegments();
        const result = element.find(".value-display").map((i: number, ele: any) => $(ele).css("backgroundColor")).toArray();
        expect(result).to.be.deep.equal(segments.map(n => n.color));
    });
    it("should display a multiple segment's displayValue correctly", () => {
        const { element, segments } = templateWithMatchAndMultipleSegments();
        const result = element.find(".value-display").map((i: number, ele: any) => $(ele).text().replace(/\s/g, "")).toArray();
        expect(result).to.be.deep.equal(segments.map(n => n.displayValue + ""));
    });
    it("should display segment highlights correctly", () => {
        const { element } = templateWithMatchAndSingleSegmentWithHighlights();
        // background-color:rgba(${r}, ${g}, ${b}, .4)
        const result = element.find(".value-display").map((i: number, ele: any) => $(ele).css("backgroundColor")).toArray()[0];
        expect(result).to.be.deep.equal(`rgba(255, 0, 0, 0.2)`); // It lightens the main part, .2 opacity on red

        const highlightResult = element.find(".value-display-highlight")
            .map((i: number, ele: any) => $(ele).css("backgroundColor")).toArray()[0];
        expect(highlightResult).to.be.deep.equal("red");
    });
});
