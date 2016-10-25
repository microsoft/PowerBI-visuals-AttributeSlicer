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

"use strict";
require("essex.powerbi.base/dist/spec/visualHelpers"); // tslint:disable-line
import { UpdateType } from "essex.powerbi.base";
import * as $ from "jquery";
import { expect } from "chai";
import { AttributeSlicer } from "../AttributeSlicer";

import VisualUpdateOptions = powerbi.VisualUpdateOptions;

// global["powerbi"] = {};

/* tslint:disable */
$.extend(true, global["powerbi"], {
    VisualUpdateType: {},
    visuals: {
        StandardObjectProperties: {
            fill: {}
        },
        valueFormatter: {
            create: function () {
                return {
                    format: function () { }
                };
            }
        },
        SelectionId: {
            createWithId: function () {
                return {
                    getKey() {
                        return 1;
                    },
                    getSelector() {
                        return 1;
                    },
                };
            }
        },
    },
    data: {
        QueryComparisonKind: {
            Equal: "Equal"
        },
        createDataViewScopeIdentity: (expr: any) => ({ expr: expr }),
        SQExprBuilder: {
            compare: () => { }
        }
    }
});
global["jsCommon"] = {
    PixelConverter: {
        toPoint: function (value: any) { return value; }
    }
};
/* tslint:enable */
import AttributeSlicerVisual from "./AttributeSlicerVisual";
describe("AttributeSlicerVisual", function () {
    let parentEle: JQuery;
    beforeEach(function () {
        parentEle = $("<div></div>");
    });
    afterEach(function () {
        if (parentEle) {
            parentEle.remove();
        }
        parentEle = undefined;
    });
    /**
     * Creates an instance of AttributeSlicerVisual
     */
    function createInstance() {
        let initOptions = {
            element: parentEle,
            viewport: {
                width: 500,
                height: 500,
            },
        } as any;
        let instance = new AttributeSlicerVisual(true);
        let attributeSlicer = {};
        instance.init(initOptions);
        instance["mySlicer"] = <any>attributeSlicer;
        return {
            element: initOptions.element,
            instance: instance,
            attributeSlicer: <AttributeSlicer>attributeSlicer,
        };
    }
    /**
     * Creates update options with the given categories
     */
    function createOptionsWithCategories(categories: any, categoryName: string) {
        return <VisualUpdateOptions><any>{
            viewport: {
                width: 100,
                height: 100,
            },
            dataViews: [{
                metadata: {
                    columns: [{
                        identity: <any>[],
                        source: {
                            queryName: categoryName,
                            type: { text: true },
                        },
                        roles: {
                            Category: true,
                        },
                        type: { text: true },
                    }],
                },
                categorical: {
                    categories: [{
                        identity: <any>[],
                        source: {
                            queryName: categoryName,
                            type: { text: true },
                        },
                        values: categories.slice(0),
                    }],
                },
            }],
        };
    }

    /**
     * Creates update options with the given categories
     */
    function createOptionsWithCategoriesAndValues(categories: any[], categoryName: string, values: any[][], valueName: string) {
        "use strict";
        const mappedValues = values.map(n => ({
            source: {
                displayName: valueName,
                type: {},
            },
            values: n[0],
        }));
        return <powerbi.VisualUpdateOptions><any>{
            viewport: {
                width: 100,
                height: 100,
            },
            dataViews: [{
                metadata: {
                    columns: [{
                        identity: <any>[],
                        source: {
                            queryName: categoryName,
                            type: { text: true },
                        },
                        roles: {
                            Category: true,
                        },
                        type: { text: true },
                    }, {
                        identity: <any>[],
                        source: {
                            queryName: valueName,
                            type: {},
                        },
                        roles: {
                            Values: true,
                        },
                        type: {},
                    }],
                },
                categorical: {
                    categories: [{
                        identity: [],
                        source: {
                            queryName: categoryName,
                            type: { text: true },
                        },
                        values: categories.slice(0),
                    }],
                    values: $.extend(mappedValues, {
                        grouped: () => mappedValues,
                    }),
                },
            }],
        };
    }

    it("should init", function () {
        createInstance();
    });
    it("should load only categories if that is all that is passed in via PBI", function () {
        const { instance, attributeSlicer } = createInstance();
        let fakeCats = ["CAT_1", "CAT_2"];
        let update = createOptionsWithCategories(fakeCats, "SOME_CATEGORY_NAME");
        instance.onUpdate(update, UpdateType.Data);
        // Make sure the data was passed correctly to attribute slicer
        expect(attributeSlicer.data.map(function (n) { return n.match; })).to.be.deep.equal(fakeCats);
    });
    it("should clear the selection when the categories are changed", function () {
        const { instance, attributeSlicer } = createInstance();
        let categories = ["CAT_1", "CAT_2"];
        let update = createOptionsWithCategories(categories, "SOME_CATEGORY_NAME");
        instance.onUpdate(update, UpdateType.Data);
        delete instance["_state"];
        // Set our fake selected items
        attributeSlicer.state = <any>{ selectedItems: [{ match: "WHATEVER" }] };
        let anotherUpdate = createOptionsWithCategories(categories, "SOME_OTHER_CATEGORY");
        instance.onUpdate(anotherUpdate, UpdateType.Data);
        // Make sure there is no more selected items
        expect(attributeSlicer.state.selectedItems).to.be.empty;
    });
    it("should clear the search when the categories are changed", function () {
        const { instance, attributeSlicer } = createInstance();
        let categories = ["CAT_1", "CAT_2"];
        let update = createOptionsWithCategories(categories, "SOME_CATEGORY_NAME");
        instance.onUpdate(update, UpdateType.Data);
        // delete instance["_state"];
        // Set our fake selected items
        attributeSlicer.state = <any>{ searchText: "SOME SEARCH STRING" };
        // instance["settings"].searchText = "SOME SEARCH STRING";
        let anotherUpdate = createOptionsWithCategories(categories, "SOME_OTHER_CATEGORY");
        instance.onUpdate(anotherUpdate, UpdateType.Data);
        // Make sure there is no more search string
        expect(attributeSlicer.state.searchText).to.be.empty;
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
            objects: metadata,
            columns: update.dataViews[0].metadata.columns,
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
            objects: metadata,
            columns: update.dataViews[0].metadata.columns,
        };
        instance.update(update);
    }

    function performMetadataUpdateWithSelections(instance: AttributeSlicerVisual, addlMetadata: any) {
        const metadata = $.extend(true, {}, require("./test_data/selectionMetadata.json"));
        const categories = ["CAT_1", "CAT_2"];
        const update = createOptionsWithCategories(categories, "SOME_CATEGORY_NAME");
        update.dataViews[0].metadata = <any>$.extend(true, {
            objects: metadata,
            columns: update.dataViews[0].metadata.columns,
        }, {
            objects: addlMetadata,
        });
        instance.update(update);
    }

    function createSearchTextPBIObjects(text: string) {
        return {
            general: {
                selfFilter: {
                    where: () => {
                        return [{
                            condition: {
                                right: {
                                    value: text,
                                },
                            },
                        }];
                    },
                },
            },
        };
    }

    it("should restore selection from PBI", () => {
        const { instance, attributeSlicer } = createInstance();

        performSelectionUpdate(instance);

        expect(attributeSlicer.state.selectedItems).to.not.be.empty;
    });

    it("should restore selection after a refresh", () => {
        const { instance, attributeSlicer } = createInstance();

        performSelectionUpdate(instance);

        const selectedItems = attributeSlicer.selectedItems.slice(0);

        // A refresh is the same update twice
        performSelectionUpdate(instance);

        expect(attributeSlicer.state.selectedItems.map(n => n.match)).to.be.deep.equal(selectedItems.map(n => n.match));
    });

    it("should clear selection when the category field is changed in PBI", () => {
        const { instance, attributeSlicer } = createInstance();

        performSelectionUpdate(instance);

        // Switch up the categories
        const categories = ["CAT_1_DIFFERENT", "CAT_2_DIFFERENT"];
        const update = createOptionsWithCategories(categories, "SOME_OTHER_CATEGORY");

        instance.update(update);

        expect(attributeSlicer.state.selectedItems).to.be.empty;
    });

    it("should not show values if there is no values field passed into PBI", () => {
        const { instance, attributeSlicer } = createInstance();

        performBasicUpdate(instance);

        expect(attributeSlicer.state.showValues).to.be.false;
    });

    it("should show values if there is a values field passed into PBI", () => {
        const { instance, attributeSlicer } = createInstance();

        performValueUpdate(instance);

        expect(attributeSlicer.state.showValues).to.be.true;
    });

    it("should not clear selection when the value field is changed in PBI", () => {
        const { instance, attributeSlicer } = createInstance();

        performSelectionUpdate(instance);

        const selectedItems = attributeSlicer.state.selectedItems.slice(0);

        performValueUpdateWithSelections(instance);

        expect(attributeSlicer.state.selectedItems.map(n => n.match)).to.be.deep.equal(selectedItems.map(n => n.match));
    });

    it("should clear the search when switching column types", () => {
        const { instance, attributeSlicer } = createInstance();

        attributeSlicer.state = <any>{
            searchText: "TEST_SEARCH",
        };

        const categories = ["CAT_1_DIFFERENT", "CAT_2_DIFFERENT"];
        const update = createOptionsWithCategories(categories, "SOME_OTHER_CATEGORY");
        instance.update(update);

        expect(attributeSlicer.state.searchText).to.be.equal("");
    });

    it("should not clear the search string when the value field is changed in PBI", () => {
        const { instance, attributeSlicer } = createInstance();

        performBasicUpdate(instance);
        attributeSlicer.state = <any>{
            searchText: "TEST_SEARCH",
        };

        // performValueUpdate(instance);
        const fakeCats = ["CAT_1", "CAT_2"];
        const values = [[1, 2], [2, 3]]; // Values for each category
        const update = createOptionsWithCategoriesAndValues(fakeCats, "SOME_CATEGORY_NAME", values, "VALUE_NAME");
        update.dataViews[0].metadata.objects = createSearchTextPBIObjects("TEST_SEARCH");
        instance.update(update);

        expect(attributeSlicer.state.searchText).to.be.equal("TEST_SEARCH");
    });

    it("should not clear the selection when just settings are changed", () => {
        const { instance, attributeSlicer } = createInstance();

        performSelectionUpdate(instance);

        const selectedItems = attributeSlicer.state.selectedItems.slice(0);

        performMetadataUpdateWithSelections(instance, {
            display: {
                horizontal: true,
            },
        });

        expect(attributeSlicer.state.selectedItems.map(n => n.match)).to.be.deep.equal(selectedItems.map(n => n.match));
        expect(attributeSlicer.state.horizontal).to.be.true;
    });

    it("should initially load horizontal setting", () => {
        const { instance, attributeSlicer } = createInstance();

        performMetadataUpdateWithSelections(instance, {
            display: {
                horizontal: true,
            },
        });
        expect(attributeSlicer.state.horizontal).to.be.true;
        expect(attributeSlicer.state.selectedItems.length).to.be.greaterThan(0);
    });

    it("should not clear selection if search is changed");

    it("should restore selection after a refresh");
    it("should restore selection after a page change");
    it("should clear selection when the category field is changed in PBI");
    it("should show values if there is a values field passed into PBI");
    it("should show different colors per column when multiple values fields are added to the values segment");
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
    // it("should not lose selection when toggling caseInsensitivity");
    // ie. Search for Microsof then Microsoft, the service will return the same data
    it("should not get into an infinite loop if the data doesn't change");
    it("should support searching numerical columns (when a numerical column is the category)");
    it("should NOT support searching date columns (when a date column is the category)");
    it("should clear the search when switching column types");
    // Additional info, we were getting weird issues with infinite loops/selection when there were multiple slicers.
    // What was happening was, when one slicer received the update call from PBI, it would clear the selection manager 
    // (which itself tells PBI that data has changed), which then triggered an update on the other slicer, which would then clear
    // the selection manager which would force the update of the other slicer...so on.
    // it("should not clear the selection manager, when loading selection from the dataView");
});
