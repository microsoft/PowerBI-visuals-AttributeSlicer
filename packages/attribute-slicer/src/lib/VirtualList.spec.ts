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
 * VirtualList tests
 */
import { VirtualList } from "./VirtualList";
import * as chai from "chai";
import { Selection, create } from "d3-selection";

const SIMPLE_ITEMS: string[] = ["A", "B", "C"];

describe("VirtualList", () => {
	let parentEle: Selection<HTMLElement, {}, null, null>;
	beforeEach(() => {
		parentEle = create("div");
	});
	describe("genratorFn", () => {
		it("should call with correct 'this' context", () => {
			const fakeThis = {};
			function fakeGeneratorFn() {
				chai.expect(this).to.be.equal(fakeThis);
			}
			const instance: VirtualList = new VirtualList({
				itemHeight: 12,
				afterRender: (): void => {
					// whatever
				},
				generatorFn: fakeGeneratorFn.bind(fakeThis),
			});
			instance.setItems(SIMPLE_ITEMS);
		});
	});
	describe("setDir", () => {
		function createInstance(
			...items: unknown[]
		): {
			instance: VirtualList;
			element: Selection<HTMLElement, {}, null, null>;
		} {
			const instance: VirtualList = new VirtualList({
				itemHeight: 12,
				afterRender: (): void => {
					// whatever
				},
				generatorFn: (): HTMLElement => create("div").node(),
			});
			instance.setItems(items);

			return { instance, element: instance.container };
		}

		it("should set the width/height correctly of the list display when horiz == false", () => {
			const { instance, element } = createInstance(SIMPLE_ITEMS);
			instance.setHeight(4000);
			instance.setDir(false);
			const listEle = element.select(".list-display");
			chai.expect(listEle.style("height")).to.be.equal("4000px");
		});
		it("should set the width/height correctly of the list display when horiz == true", () => {
			const { instance, element } = createInstance(SIMPLE_ITEMS);
			instance.setHeight(4000);
			instance.setDir(true);
			const listEle = element.select(".list-display");

			// The "width" of the list is the actual height of the list when in horizontal mode
			chai.expect(listEle.style("width")).to.be.equal("4000px");
		});
	});
});
