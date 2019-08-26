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

import { ISelectableItem, SelectionManager } from "./SelectionManager";
import { expect } from "chai";

interface ITestItem extends ISelectableItem<{}> {
	name: string;
}

describe("SelectionManager", () => {
	function createInstance(): SelectionManager<ITestItem> {
		return new SelectionManager<ITestItem>();
	}

	function createBrushingInstance(): SelectionManager<ITestItem> {
		const all: SelectionManager<ITestItem> = createInstance();
		all.brushMode = true;

		return all;
	}

	function createItem(name: string): ITestItem {
		return {
			id: name,
			name,
		};
	}
	function createItems(...names: string[]): ITestItem[] {
		return names.map(createItem);
	}

	function pressCTRL(instance: SelectionManager<ITestItem>): void {
		instance.keyPressed({ ctrl: true });
	}

	function pressShift(instance: SelectionManager<ITestItem>): void {
		instance.keyPressed({ shift: true });
	}

	function startBrush(
		instance: SelectionManager<ITestItem>,
		...items: ITestItem[]
	): void {
		instance.startDrag();
		items.forEach((n: ITestItem) => instance.itemHovered(n));
	}

	function performEndBrush(instance: SelectionManager<ITestItem>): void {
		instance.endDrag();
	}

	function brush(
		instance: SelectionManager<ITestItem>,
		...items: ITestItem[]
	): void {
		startBrush(instance, ...items);
		performEndBrush(instance);
	}

	function click(
		instance: SelectionManager<ITestItem>,
		...items: ITestItem[]
	): void {
		items.forEach((n: ITestItem) => instance.itemClicked(n));
	}

	it("should create", () => {
		createInstance();
	});
	describe("itemClicked", () => {
		it("should select a single item if an item is clicked on", () => {
			const instance: SelectionManager<ITestItem> = createInstance();
			const item: ITestItem = createItem("A");
			click(instance, item);
			expect(instance.selection).to.be.deep.equal([item]);
		});
		it("should deselect a single item if an item is clicked on twice", () => {
			const instance: SelectionManager<ITestItem> = createInstance();
			const item: ITestItem = createItem("A");
			click(instance, item, item);
			expect(instance.selection).to.be.deep.equal([]);
		});
		it("should select a deselect an item if an equivalent item is passed to the itemClicked", () => {
			const instance: SelectionManager<ITestItem> = createInstance();
			const item: ITestItem = createItem("A");
			const equivalent: ITestItem = createItem("A");
			click(instance, item, equivalent);
			expect(instance.selection).to.be.deep.equal([]);
		});
		it("should select a multiple items if two different items are clicked on", () => {
			const instance: SelectionManager<ITestItem> = createInstance();
			const item: ITestItem = createItem("A");
			const item2: ITestItem = createItem("B");
			click(instance, item, item2);
			expect(instance.selection).to.be.deep.equal([item, item2]);
		});
		it("should select an item from a multiple selection", () => {
			const instance: SelectionManager<ITestItem> = createInstance();
			const item: ITestItem = createItem("A");
			const item2: ITestItem = createItem("B");

			// Click 1, 2, then 1 again
			click(instance, item, item2, item);

			expect(instance.selection).to.be.deep.equal([item2]);
		});

		it("should select a range if the SHIFT key is used, with no initial selection", () => {
			const instance: SelectionManager<ITestItem> = createInstance();
			const item: ITestItem = createItem("A");
			const item2: ITestItem = createItem("B");
			const item3: ITestItem = createItem("C");

			instance.items = [item, item2, item3];

			pressShift(instance);

			click(instance, item, item3);

			expect(instance.selection).to.be.deep.equal([item, item2, item3]);
		});

		it("should select a range if the SHIFT key is used, with an initial selection", () => {
			const instance: SelectionManager<ITestItem> = createInstance();
			const item: ITestItem = createItem("A");
			const item2: ITestItem = createItem("B");
			const item3: ITestItem = createItem("C");

			instance.items = [item, item2, item3];

			click(instance, item);

			pressShift(instance);

			click(instance, item3);

			expect(instance.selection).to.be.deep.equal([item, item2, item3]);
		});

		it("should select the correct range when pivoting (SHIFT) around an item, down then up", () => {
			const instance: SelectionManager<ITestItem> = createInstance();
			const item: ITestItem = createItem("A");
			const item2: ITestItem = createItem("B");
			const item3: ITestItem = createItem("C");
			const item4: ITestItem = createItem("D");

			instance.items = [item, item2, item3, item4];

			// Select the pivot point for the shift select
			click(instance, item3);

			// Use starts shift selecting
			pressShift(instance);

			// Clicks down (without letting shift go)
			click(instance, item4);

			// Click up (without letting shift go)
			click(instance, item);

			expect(instance.selection).to.be.deep.equal([item, item2, item3]);
		});

		it("should select the correct range when pivoting (SHIFT) around an item, up then down", () => {
			const instance: SelectionManager<ITestItem> = createInstance();
			const item: ITestItem = createItem("A");
			const item2: ITestItem = createItem("B");
			const item3: ITestItem = createItem("C");
			const item4: ITestItem = createItem("D");

			instance.items = [item, item2, item3, item4];

			// Select the pivot point for the shift select
			click(instance, item3);

			// Use starts shift selecting
			pressShift(instance);

			// Clicks up (without letting shift go)
			click(instance, item);

			// Click down (without letting shift go)
			click(instance, item4);

			expect(instance.selection).to.be.deep.equal([item3, item4]);
		});

		it("should select the correct range when pivoting (SHIFT) around an item, and the user didn't initially select an item", () => {
			const instance: SelectionManager<ITestItem> = createInstance();
			const item: ITestItem = createItem("A");
			const item2: ITestItem = createItem("B");
			const item3: ITestItem = createItem("C");
			const item4: ITestItem = createItem("D");

			instance.items = [item, item2, item3, item4];

			// Use starts shift selecting
			pressShift(instance);

			// Shift selects item 2, then the last item (item4)
			click(instance, item2);
			click(instance, item4);
			expect(instance.selection).to.be.deep.equal([item2, item3, item4]);

			// Shift selects the first item, now the selection should be
			// between item2 and the first item (item)
			click(instance, item);
			expect(instance.selection).to.be.deep.equal([item, item2]);
		});

		describe("BrushMode: true", () => {
			it("should add to the selection if the CTRL modifier is used with click", () => {
				const instance: SelectionManager<ITestItem> = createBrushingInstance();
				const item: ITestItem = createItem("A");
				const item2: ITestItem = createItem("B");
				const item3: ITestItem = createItem("C");

				// Initial brush selects 1 & 2
				brush(instance, item, item2);

				// User presses ctrl key
				pressCTRL(instance);

				// user clicks item 3
				click(instance, item3);

				expect(instance.selection).to.be.deep.equal([item, item2, item3]);
			});

			it("should add to the selection if the CTRL modifier is used with brush", () => {
				const instance: SelectionManager<ITestItem> = createBrushingInstance();
				const item: ITestItem = createItem("A");
				const item2: ITestItem = createItem("B");
				const item3: ITestItem = createItem("C");

				// user clicks item 3
				click(instance, item);

				// User presses ctrl key
				pressCTRL(instance);

				// Initial brush selects 1 & 2
				brush(instance, item2, item3);
				expect(instance.selection).to.be.deep.equal([item2, item3, item]);
			});

			it("should reset the selection if the CTRL modifier is NOT used with brush", () => {
				const instance: SelectionManager<ITestItem> = createBrushingInstance();
				const item: ITestItem = createItem("A");
				const item2: ITestItem = createItem("B");
				const item3: ITestItem = createItem("C");

				// user clicks item 3
				click(instance, item);

				// Initial brush selects 1 & 2
				brush(instance, item2, item3);
				expect(instance.selection).to.be.deep.equal([item2, item3]);
			});

			it("should reset the selection to the single item if the CTRL modifier is NOT used", () => {
				const instance: SelectionManager<ITestItem> = createBrushingInstance();
				const item: ITestItem = createItem("A");
				const item2: ITestItem = createItem("B");
				const item3: ITestItem = createItem("C");

				// Initial brush selects 1 & 2
				brush(instance, item, item2);

				// user clicks item 3 without CTRL
				click(instance, item3);

				expect(instance.selection).to.be.deep.equal([item3]);
			});

			it("should deselect the item if the same item is clicked twice with CTRL", () => {
				const instance: SelectionManager<ITestItem> = createBrushingInstance();
				const item: ITestItem = createItem("A");

				pressCTRL(instance);

				click(instance, item, item);

				expect(instance.selection).to.be.deep.equal([]);
			});

			it("should select a range if the SHIFT key is used, with no initial selection", () => {
				const instance: SelectionManager<ITestItem> = createBrushingInstance();
				const item: ITestItem = createItem("A");
				const item2: ITestItem = createItem("B");
				const item3: ITestItem = createItem("C");

				instance.items = [item, item2, item3];

				pressShift(instance);

				click(instance, item, item3);

				expect(instance.selection).to.be.deep.equal([item, item2, item3]);
			});

			it("should select a range if the SHIFT key is used, with an initial selection", () => {
				const instance: SelectionManager<ITestItem> = createBrushingInstance();
				const item: ITestItem = createItem("A");
				const item2: ITestItem = createItem("B");
				const item3: ITestItem = createItem("C");

				instance.items = [item, item2, item3];

				click(instance, item);

				pressShift(instance);

				click(instance, item3);

				expect(instance.selection).to.be.deep.equal([item, item2, item3]);
			});

			it("should select the correct range when pivoting around an item", () => {
				const instance: SelectionManager<ITestItem> = createBrushingInstance();
				const item: ITestItem = createItem("A");
				const item2: ITestItem = createItem("B");
				const item3: ITestItem = createItem("C");

				instance.items = [item, item2, item3];

				// Select the pivot point for the shift select
				click(instance, item2);

				// Use starts shift selecting
				pressShift(instance);

				// Clicks up (without letting shift go)
				click(instance, item2, item);

				// Click down (without letting shift go)
				click(instance, item2, item3);

				expect(instance.selection).to.be.deep.equal([item2, item3]);
			});

			it("should deselect a single item, if that item is already selected and clicked on", () => {
				const instance: SelectionManager<ITestItem> = createBrushingInstance();
				const item: ITestItem = createItem("A");

				instance.singleSelect = true;

				brush(instance, item);

				click(instance, item);

				expect(instance.selection).to.be.deep.equal([]);
			});

			it("should select the last item that was dragged on, when singleSelect = true", () => {
				const instance: SelectionManager<ITestItem> = createBrushingInstance();
				const item: ITestItem = createItem("A");
				const item2: ITestItem = createItem("B");
				const item3: ITestItem = createItem("C");

				instance.singleSelect = true;

				brush(instance, item, item2, item3);

				expect(instance.selection).to.be.deep.equal([item3]);
			});

			it("should select missing items if the user brushes too fast (small amount)", () => {
				const instance: SelectionManager<ITestItem> = createBrushingInstance();
				const item: ITestItem = createItem("A");
				const item2: ITestItem = createItem("B");
				const item3: ITestItem = createItem("C");

				instance.items = [item, item2, item3];

				// Brushes first and last item, so, item2 was missing
				brush(instance, item3, item);

				expect(instance.selection).to.be.deep.equal([item, item2, item3]);
			});

			it("should select missing items if the user brushes too fast (large amount)", () => {
				const instance: SelectionManager<ITestItem> = createBrushingInstance();
				const items: ITestItem[] = createItems(
					"A",
					"B",
					"C",
					"D",
					"E",
					"F",
					"G",
					"H",
				);

				instance.items = items;

				// Brush between a non contiguous section
				brush(instance, items[4], items[1]);

				// 5 because it doesn't include 4 into the index
				expect(instance.selection).to.be.deep.equal(items.slice(1, 5));
			});
		});
	});

	describe("startDrag", () => {
		it("should set the 'dragging' flag to true", () => {
			const instance: SelectionManager<ITestItem> = createInstance();

			// We start the brushing action
			startBrush(instance);

			expect(instance.dragging).to.be.eq(
				true,
				"dragging is not true, when it should be",
			);
		});
	});

	describe("endDrag", () => {
		it("should set the 'dragging' flag to false", () => {
			const instance: SelectionManager<ITestItem> = createInstance();

			// Brush nothing
			brush(instance);

			expect(instance.dragging).to.be.eq(
				false,
				"dragging is true, when it shouldn't be",
			);
		});
		it("should not change the selection if dragging in non brush mode", () => {
			const instance: SelectionManager<ITestItem> = createInstance();

			const item: ITestItem = createItem("A");
			const item2: ITestItem = createItem("B");
			const item3: ITestItem = createItem("C");

			instance.itemClicked(item);

			brush(instance, item2, item3);

			expect(instance.selection).to.be.deep.equal([item]);
		});
	});

	describe("itemHovered", () => {
		it("should NOT add to selection if brushmode === false", () => {
			const instance: SelectionManager<ITestItem> = createInstance();
			const item: ITestItem = createItem("A");
			instance.brushMode = false;
			instance.itemHovered(item);
			expect(instance.selection).to.be.deep.equal([]);
		});
		describe("BrushMode: true", () => {
			it("should add to selection while dragging", () => {
				const instance: SelectionManager<ITestItem> = createBrushingInstance();
				const item: ITestItem = createItem("A");

				brush(instance, item);

				expect(instance.selection).to.be.deep.equal([item]);
			});
			it("should NOT add to selection while not dragging", () => {
				const instance: SelectionManager<ITestItem> = createBrushingInstance();
				const item: ITestItem = createItem("A");
				instance.itemHovered(item);
				expect(instance.selection).to.be.deep.equal([]);
			});
			it("should not add to selection if the same item is hovered twice", () => {
				const instance: SelectionManager<ITestItem> = createBrushingInstance();
				const item: ITestItem = createItem("A");

				brush(instance, item, item);

				expect(instance.selection).to.be.deep.equal([item]);
			});
			it("should add to selection if a the different item is hovered", () => {
				const instance: SelectionManager<ITestItem> = createBrushingInstance();
				const item: ITestItem = createItem("A");
				const item2: ITestItem = createItem("B");

				brush(instance, item, item2);

				expect(instance.selection).to.be.deep.equal([item, item2]);
			});
			it("should add to selection if a different item is hovered", () => {
				const instance: SelectionManager<ITestItem> = createBrushingInstance();
				const item: ITestItem = createItem("A");
				const item2: ITestItem = createItem("B");

				brush(instance, item, item2);

				expect(instance.selection).to.be.deep.equal([item, item2]);
			});
			it("should restart the selection when restarting a brushing operation", () => {
				const instance: SelectionManager<ITestItem> = createBrushingInstance();
				const item: ITestItem = createItem("A");
				const item2: ITestItem = createItem("B");
				const item3: ITestItem = createItem("C");

				// One brush motion
				brush(instance, item, item2);

				// Second brush motion
				brush(instance, item2, item3);

				expect(instance.selection).to.be.deep.equal([item2, item3]);
			});
			it("should NOT change the actual selection if enddrag is not called", () => {
				const instance: SelectionManager<ITestItem> = createBrushingInstance();
				const item: ITestItem = createItem("A");
				const item2: ITestItem = createItem("B");

				// Started brushing, without finishing
				startBrush(instance, item, item2);

				expect(instance.selection).to.be.deep.equal([]);
			});
			it("should remove from selection when dragging back", () => {
				const instance: SelectionManager<ITestItem> = createBrushingInstance();
				const items: ITestItem[] = createItems("A", "B", "C");
				instance.items = items;
				brush(instance, items[0], items[1], items[2], items[1]);

				expect(instance.selection).to.be.deep.equal(items.slice(0, 2));
			});
		});
	});

	describe("onSelectionChanged", () => {
		it("should fire when selection is changed", () => {
			const item: ITestItem = createItem("A");
			let called: boolean = false;
			const instance: SelectionManager<ITestItem> = new SelectionManager(
				(items: ITestItem[]): void => {
					called = true;
					expect(items).to.be.deep.equal([item]);
				},
			);
			instance.itemClicked(item);
			expect(called).to.be.eq(
				true,
				"Selection change was not fired when the item was clicked on",
			);
		});
	});
});
