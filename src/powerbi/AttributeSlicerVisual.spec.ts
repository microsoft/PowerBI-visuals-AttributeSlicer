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
    data: {
        QueryComparisonKind: {
            Equal: "Equal"
        },
        createDataViewScopeIdentity: (expr: any) => ({ expr: expr }),
        SQExprBuilder: {
            compare: () => {}
        }
    }
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
    function createOptionsWithCategories(categories: any[], categoryName: string) {
        return <powerbi.VisualUpdateOptions><any>{
            viewport: {
                width: 100,
                height: 100,
            },
            dataViews: [{
                categorical: {
                    categories: [{
                        identity: [],
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

    /** 
     * Creates update options with the given categories 
     */
    function createOptionsWithCategoriesAndValues(categories: any[], categoryName: string, values: any[][], valueName: string) {
        return <powerbi.VisualUpdateOptions><any>{
            viewport: {
                width: 100,
                height: 100,
            },
            dataViews: [{
                categorical: {
                    categories: [{
                        identity: [],
                        source: {
                            queryName: categoryName,
                            type: {},
                        },
                        values: categories.slice(0),
                    }, ],
                    values: values.map(n => ({
                        source: {
                            displayName: valueName
                        },
                        values: n[0],
                    })),
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
        const update = createOptionsWithCategories(fakeCats, "SOME_CATEGORY_NAME");
        instance.update(update);

        // Make sure the data was passed correctly to attribute slicer
        expect(attributeSlicer.data.map(n => n.match)).to.be.deep.equal(fakeCats);
    });

    it("should clear the selection when the categories are changed", () => {
        const { instance, attributeSlicer } = createInstance();
        const categories = ["CAT_1", "CAT_2"];
        const update = createOptionsWithCategories(categories, "SOME_CATEGORY_NAME");
        instance.update(update);

        // Set our fake selected items
        attributeSlicer.selectedItems = <any>[{ match: "WHATEVER" }];

        const anotherUpdate = createOptionsWithCategories(categories, "SOME_OTHER_CATEGORY");
        instance.update(anotherUpdate);

        // Make sure there is no more selected items
        expect(attributeSlicer.selectedItems).to.be.empty;
    });

    it("should clear the search when the categories are changed", () => {
        const { instance, attributeSlicer } = createInstance();
        const categories = ["CAT_1", "CAT_2"];
        const update = createOptionsWithCategories(categories, "SOME_CATEGORY_NAME");
        instance.update(update);

        // Set our fake selected items
        attributeSlicer.searchString = "SOME SEARCH STRING";

        const anotherUpdate = createOptionsWithCategories(categories, "SOME_OTHER_CATEGORY");
        instance.update(anotherUpdate);

        // Make sure there is no more search string
        expect(attributeSlicer.searchString).to.be.empty;
    });

    function performBasicUpdate(instance: AttributeSlicerVisual) {
        const fakeCats = ["CAT_1", "CAT_2"];
        const update = createOptionsWithCategories(fakeCats, "SOME_CATEGORY_NAME");
        instance.update(update);
    }

    function performSelectionUpdate(instance: AttributeSlicerVisual) {
        const metadata = $.extend(true, {}, require("./test_data/selectionMetadata.json"));
        const categories = ["CAT_1", "CAT_2"];
        const update = createOptionsWithCategories(categories, "SOME_CATEGORY_NAME");
        update.dataViews[0].metadata = <any>{
            objects: metadata
        };
        instance.update(update);
    }

    function performValueUpdate(instance: AttributeSlicerVisual) {
        const fakeCats = ["CAT_1", "CAT_2"];
        const values = [[1, 2], [2, 3]]; // Values for each category
        const update = createOptionsWithCategoriesAndValues(fakeCats, "SOME_CATEGORY_NAME", values, "VALUE_NAME");
        instance.update(update);
    }

    function performValueUpdateWithSelections(instance: AttributeSlicerVisual) {
        const fakeCats = ["CAT_1", "CAT_2"];
        const values = [[1, 2], [2, 3]]; // Values for each category
        const update = createOptionsWithCategoriesAndValues(fakeCats, "SOME_CATEGORY_NAME", values, "VALUE_NAME");
        const metadata = require("./test_data/selectionMetadata.json");
        update.dataViews[0].metadata = <any>{
            objects: metadata
        };
        instance.update(update);
    }

    function performMetadataUpdateWithSelections(instance: AttributeSlicerVisual, addlMetadata: any) {
        const metadata = $.extend(true, {}, require("./test_data/selectionMetadata.json"));
        const categories = ["CAT_1", "CAT_2"];
        const update = createOptionsWithCategories(categories, "SOME_CATEGORY_NAME");
        update.dataViews[0].metadata = <any>$.extend(true, {
            objects: metadata
        }, {
            objects: addlMetadata
        });
        instance.update(update);
    }

    it("should restore selection from PBI", () => {
        const { instance, attributeSlicer } = createInstance();

        performSelectionUpdate(instance);

        expect(attributeSlicer.selectedItems).to.not.be.empty;
    });

    it("should restore selection after a refresh", () => {
        const { instance, attributeSlicer } = createInstance();

        performSelectionUpdate(instance);

        const selectedItems = attributeSlicer.selectedItems.slice(0);

        // A refresh is the same update twice
        performSelectionUpdate(instance);

        expect(attributeSlicer.selectedItems.map(n => n.match)).to.be.deep.equal(selectedItems.map(n => n.match));
    });

    it("should clear selection when the category field is changed in PBI", () => {
        const { instance, attributeSlicer } = createInstance();

        performSelectionUpdate(instance);

        // Switch up the categories
        const categories = ["CAT_1_DIFFERENT", "CAT_2_DIFFERENT"];
        const update = createOptionsWithCategories(categories, "SOME_OTHER_CATEGORY");

        instance.update(update);

        expect(attributeSlicer.selectedItems).to.be.empty;
    });

    it("should not show values if there is no values field passed into PBI", () => {
        const { instance, attributeSlicer } = createInstance();

        performBasicUpdate(instance);

        expect(attributeSlicer.showValues).to.be.false;
    });

    it("should show values if there is a values field passed into PBI", () => {
        const { instance, attributeSlicer } = createInstance();

        performValueUpdate(instance);

        expect(attributeSlicer.showValues).to.be.true;
    });

    it("should not clear selection when the value field is changed in PBI", () => {
        const { instance, attributeSlicer } = createInstance();

        performSelectionUpdate(instance);

        const selectedItems = attributeSlicer.selectedItems.slice(0);

        performValueUpdateWithSelections(instance);

        expect(attributeSlicer.selectedItems.map(n => n.match)).to.be.deep.equal(selectedItems.map(n => n.match));
    });

    it ("should clear the search when switching column types", () => {
        const { instance, attributeSlicer } = createInstance();

        attributeSlicer.searchString = "TEST_SEARCH";

        const categories = ["CAT_1_DIFFERENT", "CAT_2_DIFFERENT"];
        const update = createOptionsWithCategories(categories, "SOME_OTHER_CATEGORY");
        instance.update(update);

        expect(attributeSlicer.searchString).to.be.equal("");
    });

    it("should not clear the search string when the value field is changed in PBI", () => {
        const { instance, attributeSlicer } = createInstance();

        performBasicUpdate(instance);

        attributeSlicer.searchString = "TEST_SEARCH";

        // TODO: Temporary workaround
        instance["doesDataSupportSearch"] = () => true;

        performValueUpdate(instance);

        expect(attributeSlicer.searchString).to.be.equal("TEST_SEARCH");
    });

    it("should not clear the selection when just settings are changed", () => {
        const { instance, attributeSlicer } = createInstance();

        performSelectionUpdate(instance);

        const selectedItems = attributeSlicer.selectedItems.slice(0);

        performMetadataUpdateWithSelections(instance, {
            display: {
                horizontal: true
            },
        });

        expect(attributeSlicer.selectedItems.map(n => n.match)).to.be.deep.equal(selectedItems.map(n => n.match));
        expect(attributeSlicer.renderHorizontal).to.be.true;
    });

    it("should initially load horizontal setting", () => {
        const { instance, attributeSlicer } = createInstance();

        performMetadataUpdateWithSelections(instance, {
            display: {
                horizontal: true
            },
        });
        expect(attributeSlicer.renderHorizontal).to.be.true;
        expect(attributeSlicer.selectedItems.length).to.be.greaterThan(0);
    });

    it("should not clear selection if search is changed");
    it("should restore selection after a page change");
    it("should show different colors per column when multiple values fields are added to the values section");
    it("should adjust the width of the value column, when the PBI config changes");
    it("should not clear the selection if two searches are performed in quick succession, while the first is running");
    // it("should not crash when you search for something, then change the maxNumberOfItems setting");
    it("should retain horizontal view mode, after switching pages (in DESKTOP)");
    it("should scroll properly in horizontal view mode");
    it("should load additional data properly in horizontal view mode");
    it("should go to vertical view mode, when selected in PBI");
    // it("should not lose selection when toggling caseInsensitivity");

    // ie. Search for Microsof then Microsoft, the service will return the same data
    it("should not get into an infinite loop if the data doesn't change");

    // it ("should support searching numerical columns (when a numerical column is the category)");
    // it ("should NOT support searching date columns (when a date column is the category)");

    // Additional info, we were getting weird issues with infinite loops/selection when there were multiple slicers.
    // What was happening was, when one slicer received the update call from PBI, it would clear the selection manager 
    // (which itself tells PBI that data has changed), which then triggered an update on the other slicer, which would then clear
    // the selection manager which would force the update of the other slicer...so on.
    // it("should not clear the selection manager, when loading selection from the dataView");
});
