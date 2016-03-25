require("../base/testSetup");

import { expect } from "chai";
import { AttributeSlicer } from "./AttributeSlicer";
import * as $ from "jquery";

describe("AttributeSlicer", () => {
    var parentEle;
    beforeEach(() => {
        global['$'] = require("jquery");
        global['d3'] = require("d3");
        global['_'] = require("underscore");
        parentEle = $('<div></div>');
    });

    afterEach(() => {
        if (parentEle) {
            parentEle.remove();
        }
        parentEle = null;
    });

    var createInstance = () => {
        let ele = $('<div>');
        parentEle.append(ele);
        var result = {
            instance: new AttributeSlicer(ele),
            element: ele
        };
        return result;
    };

    const createData = (...items) => {
        return items.map(n => ({
            match: n,
            value: n,
            selected: false,
            equals: b => b.match === n
        }));
    };

    const SIMPLE_DATA = createData('M', 'm', 'N', 'n');

    it("should load", () => {
        createInstance();
    });

    describe("data", () => {
        it("should show data", () => {
            let { instance, element } = createInstance();
            instance.data = SIMPLE_DATA;
            const itemEles = element.find(".item");
            expect(itemEles.length).to.eq(SIMPLE_DATA.length);
            const resultText = itemEles.map((n, ele) => $(ele).text().trim()).toArray();
            expect(resultText).to.be.deep.equal(SIMPLE_DATA.map(n => n.match));
        });
    });

    const getVisibleItems = (element) => element.find(".item").filter((i, ele) => ele['style'].display !== "none");

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
            expect(resultText).to.be.deep.equal(['M', 'm']);
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
            expect(resultText).to.be.deep.equal(['M']);
        });
    });

    it("should set case in")

    describe("serverSideSearch", () => {
        it("should return the property when set", () => {
            let { instance } = createInstance();
            instance.serverSideSearch = true;
            expect(instance.serverSideSearch).to.eq(true);
        });
    });
});
