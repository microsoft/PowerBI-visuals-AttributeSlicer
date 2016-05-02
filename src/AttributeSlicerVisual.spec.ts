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
    it("should clear selection when the category field is changed in PBI");
    it("should not clear selection when the value field is changed in PBI");
    it("should not clear selection if search is changed");
    it("should not clear selection when just settings are changed.");
    it("should adjust the width of the value column, when the PBI config changes");
    it("should show values if there is a values field passed into PBI");
    it("should not clear the selection if two searches are performed in quick succession, while the first is running");
    it("should not crash when you search for something, then change the maxNumberOfItems setting");

    // Additional info, we were getting weird issues with infinite loops/selection when there were multiple slicers.
    // What was happening was, when one slicer received the update call from PBI, it would clear the selection manager 
    // (which itself tells PBI that data has changed), which then triggered an update on the other slicer, which would then clear
    // the selection manager which would force the update of the other slicer...so on.
    it("should not clear the selection manager, when loading selection from the dataView");
});
