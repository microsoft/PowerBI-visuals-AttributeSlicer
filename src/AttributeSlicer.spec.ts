import "../base/testSetup";

import { expect } from "chai";
import { AttributeSlicer } from "./AttributeSlicer";
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

    const createInstance = () => {
        let ele = $("<div>");
        let fakeVL: any = function() {
            this.container = $("<div>");
            this.setItems = function(items: any) {
                this.items = items;
            };
            this.rerender = function() /* tslint:disable */ {}; /* tslint:enable */
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
});
