import "../base/testSetup";
import * as $ from "jquery";

describe("AttributeSlicerVisual", () => {
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
    it("should restore selection after a refresh");
    it("should restore selection after a page change");
    it("should clear selection when a field is changed in PBI");
    it("should not clear selection if search is changed");
});
