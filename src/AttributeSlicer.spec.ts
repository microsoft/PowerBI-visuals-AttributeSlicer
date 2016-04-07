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
        parentEle.append(ele);
        let result = {
            instance: new AttributeSlicer(ele),
            element: ele,
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
            let { instance, element } = createInstance();
            instance.data = SIMPLE_DATA;
            const itemEles = element.find(".item");
            expect(itemEles.length).to.eq(SIMPLE_DATA.length);
            const resultText = itemEles.map((i: number, ele: Element) => $(ele).text().trim()).toArray();
            expect(resultText).to.be.deep.equal(SIMPLE_DATA.map(n => n.match));
        });
    });

    const getVisibleItems = (element: JQuery) => {
        return element.find(".item").filter((i: number, ele: HTMLElement) => ele.style.display !== "none");
    };

    describe("case insensitivity", () => {

        it("should set when set", () => {
            let { instance } = createInstance();
            instance.caseInsensitive = false;
            expect(instance.caseInsensitive).to.be.false;
        });

        it("should show filtered data when caseInsensitive is true", () => {
            let { instance, element } = createInstance();
            instance.serverSideSearch = false;
            instance.data = SIMPLE_DATA;
            instance.searchString = "M";

            const itemEles = getVisibleItems(element);
            expect(itemEles.length).to.eq(2);
            const resultText = itemEles.map((n, ele) => $(ele).text().trim()).toArray();
            expect(resultText).to.be.deep.equal(["M", "m"]);
        });

        it("should show filtered data when caseInsensitive is false", () => {
            let { instance, element } = createInstance();
            instance.serverSideSearch = false;
            instance.data = SIMPLE_DATA;
            instance.caseInsensitive = false;
            instance.searchString = "M";

            const itemEles = getVisibleItems(element);
            expect(itemEles.length).to.eq(1);
            const resultText = itemEles.map((n, ele) => $(ele).text().trim()).toArray();
            expect(resultText).to.be.deep.equal(["M"]);
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
