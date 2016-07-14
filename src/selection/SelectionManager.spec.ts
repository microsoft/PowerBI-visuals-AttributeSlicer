import { default as SelectionManager, ISelectableItem } from "./SelectionManager";
import { expect } from "chai";

describe("SelectionManager", () => {
    function createInstance() {
        let instance = new SelectionManager();
        return { instance };
    }
    function createItem(name: string) {
        return {
            name: name,
            equals: (b: any) => name === b.name,
        };
    }

    function pressCTRL(instance: SelectionManager<any>) {
        instance.keyPressed({ ctrl: true });
    }

    function pressShift(instance: SelectionManager<any>) {
        instance.keyPressed({ shift: true });
    }

    function startBrush(instance: SelectionManager<any>, ...items: ISelectableItem<any>[]) {
        instance.startDrag();
        items.forEach(n => instance.itemHovered(n));
    }

    function performEndBrush(instance: SelectionManager<any>) {
        instance.endDrag();
    }

    function brush(instance: SelectionManager<any>, ...items: ISelectableItem<any>[]) {
        startBrush(instance, ...items);
        performEndBrush(instance);
    }

    function click(instance: SelectionManager<any>, ...items: ISelectableItem<any>[]) {
        items.forEach(n => instance.itemClicked(n));
    }

    it("should create", () => {
        createInstance();
    });
    describe("itemClicked", () => {
        it("should select a single item if an item is clicked on", () => {
            const { instance } = createInstance();
            const item = createItem("A");
            click(instance, item);
            expect(instance.selection).to.be.deep.equal([item]);
        });
        it("should deselect a single item if an item is clicked on twice", () => {
            const { instance } = createInstance();
            const item = createItem("A");
            click(instance, item, item);
            expect(instance.selection).to.be.deep.equal([]);
        });
        it("should select a deselect an item if an equivalent item is passed to the itemClicked", () => {
            const { instance } = createInstance();
            const item = createItem("A");
            const equivalent = createItem("A");
            click(instance, item, equivalent);
            expect(instance.selection).to.be.deep.equal([]);
        });
        it("should select a multiple items if two different items are clicked on", () => {
            const { instance } = createInstance();
            const item = createItem("A");
            const item2 = createItem("B");
            click(instance, item, item2);
            expect(instance.selection).to.be.deep.equal([item, item2]);
        });
        it("should select an item from a multiple selection", () => {
            const { instance } = createInstance();
            const item = createItem("A");
            const item2 = createItem("B");

            // Click 1, 2, then 1 again
            click(instance, item, item2, item);

            expect(instance.selection).to.be.deep.equal([item2]);
        });

        it("should select a range if the SHIFT key is used, with no initial selection", () => {
            const { instance } = createInstance();
            const item = createItem("A");
            const item2 = createItem("B");
            const item3 = createItem("C");

            instance.items = [item, item2, item3];

            pressShift(instance);

            click(instance, item, item3);

            expect(instance.selection).to.be.deep.equal([item, item2, item3]);
        });

        it("should select a range if the SHIFT key is used, with an initial selection", () => {
            const { instance } = createInstance();
            const item = createItem("A");
            const item2 = createItem("B");
            const item3 = createItem("C");

            instance.items = [item, item2, item3];

            click(instance, item);

            pressShift(instance);

            click(instance, item3);

            expect(instance.selection).to.be.deep.equal([item, item2, item3]);
        });

        it("should select the correct range when pivoting (SHIFT) around an item, down then up", () => {
            const { instance } = createInstance();
            const item = createItem("A");
            const item2 = createItem("B");
            const item3 = createItem("C");
            const item4 = createItem("D");

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
            const { instance } = createInstance();
            const item = createItem("A");
            const item2 = createItem("B");
            const item3 = createItem("C");
            const item4 = createItem("D");

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
            const { instance } = createInstance();
            const item = createItem("A");
            const item2 = createItem("B");
            const item3 = createItem("C");
            const item4 = createItem("D");

            instance.items = [item, item2, item3, item4];

            // Use starts shift selecting
            pressShift(instance);

            // Shift selects item 2, then the last item (item4)
            click(instance, item2);
            click(instance, item4);
            expect(instance.selection).to.be.deep.equal([item2, item3, item4]);

            // Shift selects the first item, now the selection should be between item2 and the first item (item)
            click(instance, item);
            expect(instance.selection).to.be.deep.equal([item, item2]);
        });

        describe("BrushMode: true", () => {
            const createBrushingInstance = () => {
                const all = createInstance();
                all.instance.brushMode = true;
                return all;
            };
            it("should add to the selection if the CTRL modifier is used", () => {
                const { instance } = createBrushingInstance();
                const item = createItem("A");
                const item2 = createItem("B");
                const item3 = createItem("C");

                // Initial brush selects 1 & 2
                brush(instance, item, item2);

                // User presses ctrl key
                pressCTRL(instance);

                // user clicks item 3
                click(instance, item3);

                expect(instance.selection).to.be.deep.equal([item, item2, item3]);
            });

            it("should reset the selection to the single item if the CTRL modifier is NOT used", () => {
                const { instance } = createBrushingInstance();
                const item = createItem("A");
                const item2 = createItem("B");
                const item3 = createItem("C");

                // Initial brush selects 1 & 2
                brush(instance, item, item2);

                // user clicks item 3 without CTRL
                click(instance, item3);

                expect(instance.selection).to.be.deep.equal([item3]);
            });

            it("should deselect the item if the same item is clicked twice with CTRL", () => {
                const { instance } = createBrushingInstance();
                const item = createItem("A");

                pressCTRL(instance);

                click(instance, item, item);

                expect(instance.selection).to.be.deep.equal([]);
            });

            it("should select a range if the SHIFT key is used, with no initial selection", () => {
                const { instance } = createBrushingInstance();
                const item = createItem("A");
                const item2 = createItem("B");
                const item3 = createItem("C");

                instance.items = [item, item2, item3];

                pressShift(instance);

                click(instance, item, item3);

                expect(instance.selection).to.be.deep.equal([item, item2, item3]);
            });

            it("should select a range if the SHIFT key is used, with an initial selection", () => {
                const { instance } = createBrushingInstance();
                const item = createItem("A");
                const item2 = createItem("B");
                const item3 = createItem("C");

                instance.items = [item, item2, item3];

                click(instance, item);

                pressShift(instance);

                click(instance, item3);

                expect(instance.selection).to.be.deep.equal([item, item2, item3]);
            });

            it("should select the correct range when pivoting around an item", () => {
                const { instance } = createBrushingInstance();
                const item = createItem("A");
                const item2 = createItem("B");
                const item3 = createItem("C");

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

            it("should select the last item that was dragged on, when singleSelect = true", () => {
                const { instance } = createBrushingInstance();
                const item = createItem("A");
                const item2 = createItem("B");
                const item3 = createItem("C");

                instance.singleSelect = true;

                brush(instance, item, item2, item3);

                expect(instance.selection).to.be.deep.equal([item3]);
            });
        });
    });

    describe("startDrag", () => {
        it("should set the 'dragging' flag to true", () => {
            const { instance } = createInstance();

            // We start the brushing action
            startBrush(instance);

            expect(instance.dragging).to.be.true;
        });
    });

    describe("endDrag", () => {
        it("should set the 'dragging' flag to false", () => {
            const { instance } = createInstance();

            // Brush nothing
            brush(instance);

            expect(instance.dragging).to.be.false;
        });
        it("should not change the selection if dragging in non brush mode", () => {
            const { instance } = createInstance();

            const item = createItem("A");
            const item2 = createItem("B");
            const item3 = createItem("C");

            instance.itemClicked(item);

            brush(instance, item2, item3);

            expect(instance.selection).to.be.deep.equal([item]);
        });
    });

    describe("itemHovered", () => {
        it("should NOT add to selection if brushmode === false", () => {
            const { instance } = createInstance();
            const item = createItem("A");
            instance.brushMode = false;
            instance.itemHovered(item);
            expect(instance.selection).to.be.deep.equal([]);
        });
        describe("BrushMode: true", () => {
            const createBrushingInstance = () => {
                const all = createInstance();
                all.instance.brushMode = true;
                return all;
            };

            it("should add to selection while dragging", () => {
                const { instance } = createBrushingInstance();
                const item = createItem("A");

                brush(instance, item);

                expect(instance.selection).to.be.deep.equal([item]);
            });
            it("should NOT add to selection while not dragging", () => {
                const { instance } = createBrushingInstance();
                const item = createItem("A");
                instance.itemHovered(item);
                expect(instance.selection).to.be.deep.equal([]);
            });
            it("should not add to selection if the same item is hovered twice", () => {
                const { instance } = createBrushingInstance();
                const item = createItem("A");

                brush(instance, item, item);

                expect(instance.selection).to.be.deep.equal([item]);
            });
            it("should add to selection if a the different item is hovered", () => {
                const { instance } = createBrushingInstance();
                const item = createItem("A");
                const item2 = createItem("B");

                brush(instance, item, item2);

                expect(instance.selection).to.be.deep.equal([item, item2]);
            });
            it("should add to selection if a different item is hovered", () => {
                const { instance } = createBrushingInstance();
                const item = createItem("A");
                const item2 = createItem("B");

                brush(instance, item, item2);

                expect(instance.selection).to.be.deep.equal([item, item2]);
            });
            it("should restart the selection when restarting a brushing operation", () => {
                const { instance } = createBrushingInstance();
                const item = createItem("A");
                const item2 = createItem("B");
                const item3 = createItem("C");

                // One brush motion
                brush(instance, item, item2);

                // Second brush motion
                brush(instance, item2, item3);

                expect(instance.selection).to.be.deep.equal([item2, item3]);
            });
            it("should NOT change the actual selection if enddrag is not called", () => {
                const { instance } = createBrushingInstance();
                const item = createItem("A");
                const item2 = createItem("B");

                // Started brushing, without finishing
                startBrush(instance, item, item2);

                expect(instance.selection).to.be.deep.equal([]);
            });
        });
    });

    describe("onSelectionChanged", () => {
        it ("should fire when selection is changed", () => {
            const item = createItem("A");
            let called = false;
            const instance = new SelectionManager((items) => {
                called = true;
                expect(items).to.be.deep.equal([item]);
            });
            instance.itemClicked(item);
            expect(called).to.be.true;
        });
    });
});
