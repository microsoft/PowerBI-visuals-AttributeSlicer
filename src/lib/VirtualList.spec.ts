"use strict";
/* tslint:disable */
const VirtualList = require("./VirtualList");
/* tslint:enable */
import * as chai from "chai";
describe("VirtualList", () => {
    let parentEle: JQuery;
    beforeEach(() => {
        parentEle = $("<div>");
    });
    describe("setDir", () => {
        const createInstance = (...items: any[]) => {
            const instance = new VirtualList({
                itemHeight: this.fontSize * 2,
                afterRender: () => {
                    // whatever
                },
                generatorFn: () => $("<div>")[0],
            });
            instance.setItems(items);
            return { instance: instance, element: instance.container };
        };
        const SIMPLE_ITEMS = ["A", "B", "C"];
        it("should set the width/height correctly of the list display when horiz == false", () => {
            const { instance, element } = createInstance(SIMPLE_ITEMS);
            instance.setHeight(4000);
            instance.setDir(false);
            const listEle = element.find(".list-display");
            chai.expect(listEle.css("height")).to.be.equal("4000px");
        });
        it("should set the width/height correctly of the list display when horiz == true", () => {
            const { instance, element } = createInstance(SIMPLE_ITEMS);
            instance.setHeight(4000);
            instance.setDir(true);
            const listEle = element.find(".list-display");

            // The "width" of the list is the actual height of the list when in horizontal mode
            chai.expect(listEle.css("width")).to.be.equal("4000px");
        });
    });
});
