import "../base/testSetup";

import { expect } from "chai";
import { AttributeSlicer, SlicerItem } from "./AttributeSlicer";
import * as $ from "jquery";

describe("AttributeSlicer", () => {
    let parentEle: JQuery;
    beforeEach(() => {
        parentEle = $("<div></div>");
    });

    afterEach(() => {
        if (parentEle) {
            parentEle.remove();
        }
        parentEle = undefined;
    });

    const noop = function() /* tslint:disable */ {}; /* tslint:enable */;
    const createInstance = () => {
        let ele = $("<div>");
        let fakeVL: any = function() {
            this.container = $("<div>");
            this.setItems = function(items: any) {
                this.items = items;
            };
            this.setItemHeight = noop;
            this.rerender = noop;
        };
        let vList = new fakeVL();
        parentEle.append(ele);
        let result = {
            instance: new AttributeSlicer(ele, vList),
            element: ele,
            vlist: vList,
        };
        return result;
    };

    const createData = (...items: string[]) => {
        return items.map((n: string) => ({
            match: n,
            value: n,
            selected: false,
            equals: (b: any) => b.match === n,
        }));
    };

    const SIMPLE_DATA = createData("M", "m", "N", "n");

    it("should load", () => {
        createInstance();
    });

    describe("data", () => {
        it("should show data", () => {
            let { instance, vlist } = createInstance();
            instance.data = SIMPLE_DATA;
            expect(vlist.items.length).to.eq(SIMPLE_DATA.length);
            expect(vlist.items).to.be.deep.equal(SIMPLE_DATA);
        });
        it ("should clear selection when the data is changed", () => {
            let { instance } = createInstance();
            instance.data = SIMPLE_DATA;
            instance.selectedItems = SIMPLE_DATA.slice(1, 3);
            instance.data = createData("B", "C");
            expect(instance.selectedItems).to.deep.equal([]);
        });
    });


    describe("prettyPrintValue", () => {
        it ("should display '0' for 0", () => {
            expect(AttributeSlicer.prettyPrintValue(0)).to.eq("0");
        });
        it ("should display '0' for '0'", () => {
            expect(AttributeSlicer.prettyPrintValue("0")).to.eq("0");
        });
        it ("should display 'false' for false", () => {
            expect(AttributeSlicer.prettyPrintValue(false)).to.eq("false");
        });
        it ("should display 'false' for 'false'", () => {
            expect(AttributeSlicer.prettyPrintValue("false")).to.eq("false");
        });
        it ("should display '' for null", () => {
            expect(AttributeSlicer.prettyPrintValue(/* tslint:disable */null/* tslint:enable */)).to.eq("");
        });
        it ("should display '' for undefined", () => {
            expect(AttributeSlicer.prettyPrintValue(undefined)).to.eq("");
        });
        it ("should display '11/12/2013 12:12PM' for same date", () => {
            expect(AttributeSlicer.prettyPrintValue(new Date(2013, 10, 12, 12, 12))).to.eq("11/12/2013 12:12PM");
        });
        it ("should display '1/2/2012 6:12AM' for same date", () => {
            expect(AttributeSlicer.prettyPrintValue(new Date(2012, 0, 2, 6, 12))).to.eq("1/2/2012 6:12AM");
        });
    });

    describe("isMatch", () => {
        const matchTest = (text2: string, text1: string, expected: boolean, caseInsensitive = true) => {
            expect(AttributeSlicer.isMatch(<SlicerItem><any>{
                match: text1
            }, text2, caseInsensitive)).to.be.equal(expected);
        };
        it("return true with search 'Hello', and item 'Hello' and caseInsensitive = true", () => matchTest("Hello", "Hello", true));
        it("return true with search 'hello', and item 'Hello' and caseInsensitive = true", () => matchTest("hello", "Hello", true));
        it("return true with search 'hel', and item 'Hello' and caseInsensitive = true", () => matchTest("hel", "Hello", true));
        it("return true with search 'Hello', and item 'Hello' and caseInsensitive = false", () => matchTest("Hello", "Hello", true, false));
        it("return true with search '', and  item'Hello' and caseInsensitive = true", () => matchTest("", "Hello", true, true));
        it("return true with search undefined, and 'Hello' and caseInsensitive = true", () => matchTest(undefined, "Hello", true, true));
        it("return false with search 'Hello2', and item 'Hello' and caseInsensitive = true", () =>
            matchTest("Hello2", "Hello", false, true));
        it("return false with search 'hello', and item 'Hello' and caseInsensitive = false", () =>
            matchTest("hello", "Hello", false, false));
        it("return true with search undefined, and item undefined and caseInsensitive = true", () =>
            matchTest(undefined, undefined, true, true)
        );
        it("return true with search undefined, and item '' and caseInsensitive = true", () => matchTest(undefined, "", true, true));
    });

    describe("case insensitivity", () => {

        it("should set when set", () => {
            let { instance } = createInstance();
            instance.caseInsensitive = false;
            expect(instance.caseInsensitive).to.be.false;
        });

        it("should show filtered data when caseInsensitive is true", () => {
            let { instance, vlist } = createInstance();
            instance.serverSideSearch = false;
            instance.data = SIMPLE_DATA;
            instance.searchString = "M";

            expect(vlist.items.map((n: any) => n.match)).to.be.deep.equal(["M", "m"]);
        });

        it("should show filtered data when caseInsensitive is false", () => {
            let { instance, vlist } = createInstance();
            instance.serverSideSearch = false;
            instance.data = SIMPLE_DATA;
            instance.caseInsensitive = false;
            instance.searchString = "M";

            expect(vlist.items.map((n: any) => n.match)).to.be.deep.equal(["M"]);
        });
    });

    describe("serverSideSearch", () => {
        it("should return the property when set", () => {
            let { instance } = createInstance();
            instance.serverSideSearch = true;
            expect(instance.serverSideSearch).to.eq(true);
        });
    });

    describe("singleSelect", () => {
        it("should allow for selection initially", () => {
            const { instance } = createInstance();
            instance.data = SIMPLE_DATA;
            instance.singleSelect = true;
            instance.selectedItems = SIMPLE_DATA.slice(1, 2);
            expect(instance.selectedItems).to.deep.equal([SIMPLE_DATA[1]]);
        });

        it("should not remove a singlely selected item, after set to true", () => {
            const { instance } = createInstance();
            instance.data = SIMPLE_DATA;
            instance.selectedItems = SIMPLE_DATA.slice(1, 2);
            instance.singleSelect = true;
            expect(instance.selectedItems).to.deep.equal([SIMPLE_DATA[1]]);
        });

        it("should remove all selectedItems except the most recent when switching from multi to single selection", () => {
            const { instance } = createInstance();
            instance.data = SIMPLE_DATA;

            // We have 3 selected
            instance.selectedItems = SIMPLE_DATA.slice(1, 4);

            // Switch to single selection mode
            instance.singleSelect = true;

            // Should be only 1 selected item, the last one
            expect(instance.selectedItems).to.deep.equal([SIMPLE_DATA[3]]);
        });

        it("should work with no selection", () => {
            const { instance } = createInstance();
            instance.data = SIMPLE_DATA;

            // Switch to single selection mode
            instance.singleSelect = true;

            // Should be only 1 selected item, the last one
            expect(instance.selectedItems).to.deep.equal([]);
        });

        it("should allow for multiple selection if changed from true to false", () => {
            const { instance } = createInstance();
            instance.data = SIMPLE_DATA;

            // Switch to single selection mode
            instance.singleSelect = true;

            // We have 1 selected
            instance.selectedItems = SIMPLE_DATA.slice(1, 2);

            // Switch to mutli selection mode
            instance.singleSelect = false;

            // We have 2 selected
            instance.selectedItems = SIMPLE_DATA.slice(1, 3);

            // Should both be selected
            expect(instance.selectedItems).to.deep.equal(SIMPLE_DATA.slice(1, 3));
        });
    });

    it("should adjust element width when valueWidthPercentage changes");
    it("should default valueWidthPercentage to a reasonable value");
    it("should default valueWidthPercentage to a reasonable value when the value passed to valueWidthPercentage is invalid");
    it("should adjust the category column to be full width when showValues is false");
    it("should visually update the text size, when the text size property is changed");
    it("should scroll correctly when the text size is very large");
    it("should scroll correctly when the text size is very small");
});
