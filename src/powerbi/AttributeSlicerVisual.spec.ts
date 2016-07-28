import { Utils } from "essex.powerbi.base/spec/visualHelpers";
import * as $ from "jquery";
import { expect } from "chai";
/* tslint:disable */
$.extend(true, global["powerbi"], {
    visuals: {
        StandardObjectProperties: {},
        valueFormatter: { 
            create: () => {
                return {
                    format: () => {}
                };
            }
        },
        SelectionId: {
            createWithId: () => {}
        },
    },
});
global["jsCommon"] = {};
/* tslint:enable */
import AttributeSlicerVisual from "./AttributeSlicerVisual";
import { AttributeSlicer } from "../AttributeSlicer";

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

    /**
     * Creates an instance of AttributeSlicerVisual
     */
    function createInstance() {
        const initOptions = Utils.createFakeInitOptions();
        const instance = new AttributeSlicerVisual(true);
        const attributeSlicer = {

        } as AttributeSlicer;
        instance["createAttributeSlicer"] = (element: JQuery) => attributeSlicer;
        instance.init(initOptions);
        return {
            element: initOptions.element,
            instance,
            attributeSlicer,
        };
    }

    /** 
     * Creates update options with the given categories 
     */
    function createUpdateOptionsWithCategoryValues(categories: any[], categoryName: string) {
        return <powerbi.VisualUpdateOptions><any>{
            viewport: {
                width: 100,
                height: 100,
            },
            dataViews: [{
                table: {
                    identity: []
                },
                categorical: {
                    categories: [{
                        source: {
                            queryName: categoryName,
                            type: {},
                        },
                        values: categories.slice(0),
                    }, ],
                },
            }, ],
        };
    }

    it ("should init", () => {
        createInstance();
    });

    it("should load only categories if that is all that is passed in via PBI", () => {
        const { instance, attributeSlicer } = createInstance();
        const fakeCats = ["CAT_1", "CAT_2"];
        const update = createUpdateOptionsWithCategoryValues(fakeCats, "SOME_CATEGORY_NAME");
        instance.update(update);

        // Make sure the data was passed correctly to attribute slicer
        expect(attributeSlicer.data.map(n => n.match)).to.be.deep.equal(fakeCats);
    });

    it("should clear the selection when the categories are changed", () => {
        const { instance, attributeSlicer } = createInstance();
        const categories = ["CAT_1", "CAT_2"];
        const update = createUpdateOptionsWithCategoryValues(categories, "SOME_CATEGORY_NAME");
        instance.update(update);

        // Set our fake selected items
        attributeSlicer.selectedItems = <any>[{ match: "WHATEVER" }];

        const anotherUpdate = createUpdateOptionsWithCategoryValues(categories, "SOME_OTHER_CATEGORY");
        instance.update(anotherUpdate);

        // Make sure there is no more selected items
        expect(attributeSlicer.selectedItems).to.be.empty;
    });

    it("should clear the search when the categories are changed", () => {
        const { instance, attributeSlicer } = createInstance();
        const categories = ["CAT_1", "CAT_2"];
        const update = createUpdateOptionsWithCategoryValues(categories, "SOME_CATEGORY_NAME");
        instance.update(update);

        // Set our fake selected items
        attributeSlicer.searchString = "SOME SEARCH STRING";

        const anotherUpdate = createUpdateOptionsWithCategoryValues(categories, "SOME_OTHER_CATEGORY");
        instance.update(anotherUpdate);

        // Make sure there is no more search string
        expect(attributeSlicer.searchString).to.be.empty;
    });



    it("should restore selection after a refresh");

    it("should restore selection after a page change");
    it("should clear selection when the category field is changed in PBI");
    it("should show values if there is a values field passed into PBI");
    it("should show different colors per column when multiple values fields are added to the values section");
    it("should not clear selection when the value field is changed in PBI");
    it("should not clear selection if search is changed");
    it("should not clear selection when just settings are changed.");
    it("should adjust the width of the value column, when the PBI config changes");
    it("should not clear the selection if two searches are performed in quick succession, while the first is running");
    // it("should not crash when you search for something, then change the maxNumberOfItems setting");
    it("should go to horizontal view mode, when selected in PBI");
    it("should retain horizontal view mode, after switching pages (in DESKTOP)");
    it("should scroll properly in horizontal view mode");
    it("should load additional data properly in horizontal view mode");
    it("should go to vertical view mode, when selected in PBI");
    it("should not lose selection when toggling caseInsensitivity");

    // ie. Search for Microsof then Microsoft, the service will return the same data
    it("should not get into an infinite loop if the data doesn't change");

    it ("should support searching numerical columns (when a numerical column is the category)");
    it ("should support searching date columns (when a date column is the category)");
    it ("should clear the search when switching column types");

    // Additional info, we were getting weird issues with infinite loops/selection when there were multiple slicers.
    // What was happening was, when one slicer received the update call from PBI, it would clear the selection manager 
    // (which itself tells PBI that data has changed), which then triggered an update on the other slicer, which would then clear
    // the selection manager which would force the update of the other slicer...so on.
    // it("should not clear the selection manager, when loading selection from the dataView");
});
