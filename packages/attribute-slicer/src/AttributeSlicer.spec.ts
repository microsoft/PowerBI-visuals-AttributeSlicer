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

import "../base/testSetup";

import { expect } from "chai";
import { AttributeSlicer } from "./AttributeSlicer";
import { SlicerItem } from "./interfaces";
import { prettyPrintValue } from "./Utils";
import itemTemplate from "./SlicerItem.tmpl";
import * as $ from "jquery";
import { Promise } from "es6-promise";
import * as _ from "lodash";

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

    const expectSearchBox = () => {
        return expect(parentEle.find(".searchbox").val());
    };

    const noop = function() /* tslint:disable */ {}; /* tslint:enable */;
    const createInstance = () => {
        let ele = $("<div>");
        let fakeVL: any = function() {
            this.container = $("<div>");
            this.setItems = function(items: any) {
                this.items = items;
            };
            this.setItemHeight = noop;
            this.setDir = (horizontal: boolean) => this.hoizontal = horizontal;
            this.setHeight = (height: number) => this.height = height;
            this.rerender = noop;
        };
        let vList = new fakeVL();
        parentEle.append(ele);
        let result = {
            instance: new AttributeSlicer(ele, {
                searchDebounce: 0,
            }, vList),
            element: ele,
            vlist: vList,
        };
        result.instance.dimensions = { width: 200, height: 400 };
        return result;
    };

    const createData = (...items: string[]) => {
        return items.map((n: string) => ({
            id: n,
            match: n,
            value: n,
            selected: false,
            equals: (b: any) => b.match === n,
        }));
    };

    const SIMPLE_DATA = createData("M", "m", "N", "n");
    const SIMPLE_DATA_SET_TWO = createData("O", "o", "P", "p");
    const SIMPLE_DATA_WITH_VALUES = createData("M", "m", "N", "n").map(n => {
        return $.extend(true, {
            equals: n.equals,
            value: n.match.charCodeAt(0),
            renderedValue: n.match.charCodeAt(0),
        }, n);
    });
    const SIMPLE_DATA_WITH_BLANKS = createData("A", "B", "", "C");

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
            expect(prettyPrintValue(0)).to.eq("0");
        });
        it ("should display '0' for '0'", () => {
            expect(prettyPrintValue("0")).to.eq("0");
        });
        it ("should display 'false' for false", () => {
            expect(prettyPrintValue(false)).to.eq("false");
        });
        it ("should display 'false' for 'false'", () => {
            expect(prettyPrintValue("false")).to.eq("false");
        });
        it ("should display '' for null", () => {
            expect(prettyPrintValue(/* tslint:disable */null/* tslint:enable */)).to.eq("");
        });
        it ("should display '' for undefined", () => {
            expect(prettyPrintValue(undefined)).to.eq("");
        });
        it ("should display '11/12/2013 12:12PM' for same date", () => {
            expect(prettyPrintValue(new Date(2013, 10, 12, 12, 12))).to.eq("11/12/2013 12:12PM");
        });
        it ("should display '1/2/2012 6:12AM' for same date", () => {
            expect(prettyPrintValue(new Date(2012, 0, 2, 6, 12))).to.eq("1/2/2012 6:12AM");
        });
    });

    describe("isMatch", () => {
        const matchTest = (text2: string, text1: string, expected: boolean, caseInsensitive = true) => {
            expect(AttributeSlicer.isMatch(<SlicerItem><any>{
                match: text1,
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
            instance.search("M");

            expect(vlist.items.map((n: any) => n.match)).to.be.deep.equal(["M", "m"]);
        });

        it("should show filtered data when caseInsensitive is false", () => {
            let { instance, vlist } = createInstance();
            instance.serverSideSearch = false;
            instance.data = SIMPLE_DATA;
            instance.caseInsensitive = false;
            instance.search("M");

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

    describe("search", () => {
        it("should set the search text box", () => {
            let { instance } = createInstance();
            instance.search("SOME SEARCH");
            expectSearchBox().to.eq("SOME SEARCH");
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

        // Because we can infinitely load, some items may not currently be visible (ie in the currently loaded dataset)
        it("should allow for selection of items which aren't in the current dataset", () => {
            const { instance } = createInstance();

            // We have 2 selected
            instance.selectedItems = SIMPLE_DATA.slice(1, 3);

            // Should both be selected
            expect(instance.selectedItems).to.deep.equal(SIMPLE_DATA.slice(1, 3));
        });
    });

    // const sizes = calcColumnSizes();

    describe("listItemFactory", () => {
        it("should not show values if values is 0", () => {
            const { instance } = createInstance();
            instance.data = SIMPLE_DATA_WITH_VALUES;

            const itemEle = itemTemplate(SIMPLE_DATA[0], { value: 0, category: 100 }, false);

            const actual = itemEle.find(".value-container").css("max-width");
            expect(actual).to.equal("0%");
        });

        it("should show an unusual value size", () => {
            const { instance } = createInstance();
            instance.data = SIMPLE_DATA_WITH_VALUES;

            const itemEle = itemTemplate(SIMPLE_DATA[0], { value: 12.34, category: 87.66 }, false);

            const actual = itemEle.find(".value-container").css("max-width");
            expect(actual).to.equal("12.34%");
        });

        it("should not show categories if values is 0", () => {
            const { instance } = createInstance();
            instance.data = SIMPLE_DATA_WITH_VALUES;

            const itemEle = itemTemplate(SIMPLE_DATA[0], { value: 100, category: 0 }, false);

            const actual = itemEle.find(".category-container").css("max-width");
            expect(actual).to.equal("0%");
        });

        it("should show an categories value size", () => {
            const { instance } = createInstance();
            instance.data = SIMPLE_DATA_WITH_VALUES;

            const itemEle = itemTemplate(SIMPLE_DATA[0], { value: 87.66, category: 12.34 }, false);

            const actual = itemEle.find(".category-container").css("max-width");
            expect(actual).to.equal("12.34%");
        });

        it("should show blank items by default", () => {
             const { instance, vlist } = createInstance();
             instance.data = SIMPLE_DATA_WITH_BLANKS;
             expect(vlist.items.length).to.equal(SIMPLE_DATA_WITH_BLANKS.length);
        });

        it("should hide blank items with option", () => {
             const { instance, vlist } = createInstance();
             instance.data = SIMPLE_DATA_WITH_BLANKS;
             instance.hideEmptyItems = true;
             expect(vlist.items.length).to.equal(SIMPLE_DATA_WITH_BLANKS.length - 1);
        });
    });


    describe("calcColumnSizes", () => {
        it("should not show values if showValues is false", () => {
            const { instance } = createInstance();
            instance.data = SIMPLE_DATA_WITH_VALUES;

            // Change it into an unusual number
            instance.valueWidthPercentage = 12.34;

            const actual = instance.calcColumnSizes();
            expect(actual.value).to.equal(0);
        });

        it("should adjust element width when valueWidthPercentage changes, and showValues=true", () => {
            const { instance } = createInstance();
            instance.data = SIMPLE_DATA_WITH_VALUES;

            // Change it into an unusual number
            instance.valueWidthPercentage = 12.34;
            instance.showValues = true;

            const actual = instance.calcColumnSizes();
            expect(actual.value).to.equal(12.34);
        });

        it("should adjust the category column to be full width when showValues is false", () => {
            const { instance } = createInstance();
            instance.data = SIMPLE_DATA_WITH_VALUES;

            // Change it into an unusual number, shouldn't affect the outcome
            instance.valueWidthPercentage = 12.34;

            const actual = instance.calcColumnSizes();
            expect(actual.category).to.equal(100);
        });

        it("should adjust the category column to be the remaining width from the value size", () => {
            const { instance } = createInstance();
            instance.data = SIMPLE_DATA_WITH_VALUES;

            // Change it into an unusual number, shouldn't affect the outcome
            instance.valueWidthPercentage = 12.34;
            instance.showValues = true;

            const actual = instance.calcColumnSizes();
            expect(actual.category).to.equal(87.66);
        });
    });

    describe("fontSize", () => {

        it("should visually update the text size, when the text size property is changed", () => {
            const { instance, element } = createInstance();
            instance.data = SIMPLE_DATA_WITH_VALUES;
            instance.fontSize = 123.4;

            const actual = element.find(".advanced-slicer").css("font-size");
            expect(actual).to.equal("123.4px");
        });
    });

    describe("valueWidthPercentage", () => {
        it("should default valueWidthPercentage to a reasonable value", () => {
            const { instance } = createInstance();
            expect(instance.valueWidthPercentage).to.be.gte(0).and.lte(100);
        });

        it("should default valueWidthPercentage to a reasonable value, if an invalid value is passed to it", () => {
            const { instance } = createInstance();
            instance.valueWidthPercentage = -1;
            expect(instance.valueWidthPercentage).to.be.gte(0).and.lte(100);

            instance.valueWidthPercentage = 1000000;
            expect(instance.valueWidthPercentage).to.be.gte(0).and.lte(100);
        });
    });

    describe("integration", () => {
        it("should reload the entire set of data if the clear button is clicked", (done) => {
            const { instance, element } = createInstance();
            instance.data = SIMPLE_DATA;
            instance.searchString = "WHATEVER";
            instance.serverSideSearch = true;

            let callCount = 0;
            instance.events.on("canLoadMoreData", (e: any, isSearch: boolean) => {
                if (callCount === 0) {
                    e.result = true;
                    // This is true because it is a search change that caused this
                    expect(isSearch).to.be.true;
                }
            });
            instance.events.on("loadMoreData", (e: any) => {
                callCount++;
                if (callCount === 1) {
                    // HACK: After some delay
                    setTimeout(() => {
                        expect(callCount).to.eq(1);
                        expect(instance.data).to.be.deep.equal(SIMPLE_DATA_SET_TWO);
                        done();
                    }, 50);
                    const def = $.Deferred();
                    e.result = def.promise();
                    def.resolve(SIMPLE_DATA_SET_TWO);
                }
            });

            element.find(".clear-all").click();
        });
        it("should set the search string to nothing if the clear button is clicked", () => {
            const { instance, element } = createInstance();
            instance.searchString = "Some Rando Search String";

            element.find(".clear-all").click();

            // The search string prop
            expect(instance.searchString).to.be.empty;

            // The actual search box
            expectSearchBox().to.be.empty;
        });

        // this happens if the user types in say "ABC" and lets that search, then starts searching again which starts
        // the debounce function, but then corrects back to the original string "ABC", so the search string has not actually changed
        it("should not rerequest (call the external search provider) with the same search text back to back", (done) => {
            const { instance } = createInstance();
            instance.serverSideSearch = true;
            let callCount = 0;
            instance.events.on("canLoadMoreData", (e: any) => {
                e.result = true;
            });
            instance.events.on("loadMoreData", () => {
                callCount++;
                if (callCount === 1) {
                    // HACK: After some delay
                    setTimeout(() => {
                        expect(callCount).to.eq(1);
                        done();
                    }, 50);
                }
            });
            instance.search("TEST");
            instance.search("TEST");
        });

        it("should attempt to load more data if scrolled to the bottom", (done) => {
            const { instance, vlist } = createInstance();
            instance.data = SIMPLE_DATA;

            instance.events.on("canLoadMoreData", (e: any) => {
                e.result = false;
                done(); // At least it asked
            });

            // Pretend we just infinitely scrolled
            const pretendItems = $("<div>").css({ height: 20000 });
            vlist.container.append(pretendItems);
            vlist.container[0].scrollTop = 20000;
            vlist.container.scroll();
        });

        it("should append data to the original dataset if scrolled to the bottom", (done) => {
            const { instance, vlist } = createInstance();
            instance.data = SIMPLE_DATA.slice(0);

            let once = false;
            instance.events.on("canLoadMoreData", (e: any) => {
                e.result = !once;
                once = true;
            });

            instance.events.on("loadMoreData", (result: any) => {
                result.result = new Promise(resolve => {
                    resolve(SIMPLE_DATA_SET_TWO.slice(0));
                    // Timeout to allow it to actually resolve
                    setTimeout(() => {
                        const expected = [].concat(SIMPLE_DATA).concat(SIMPLE_DATA_SET_TWO);
                        expect(instance.data).to.deep.equal(expected);
                        done();
                    }, 20);
                });
            });

            // Pretend we just infinitely scrolled
            const pretendItems = $("<div>").css({ height: 20000 });
            vlist.container.append(pretendItems);
            vlist.container[0].scrollTop = 20000;
            vlist.container.scroll();
        });

        it("should render horizontally when the horizontally flag is set", () => {
            const { element, instance, vlist } = createInstance();
            return new Promise(resolve => {
                vlist.setDir = (horiz: boolean) => {
                    // Make sure horizontally gets set on the list
                    expect(horiz).to.be.true;
                    resolve();
                };
                instance.renderHorizontal = true;

                // Make sure it sets itself.
                expect(instance.renderHorizontal).to.be.true;
                expect(element.is(".render-horizontal")).to.be.true;
            });
        });
        it("should NOT render horizontally when the horizontally flag is set to false", () => {
            const { element, instance, vlist } = createInstance();
            return new Promise(resolve => {
                vlist.setDir = (horiz: boolean) => {
                    // Make sure horizontally gets set on the list
                    expect(horiz).to.be.false;
                    resolve();
                };
                instance.renderHorizontal = false;

                // Make sure it sets itself.
                expect(instance.renderHorizontal).to.be.false;
                expect(element.is(".render-horizontal")).to.be.false;
            });
        });
        it("should adjust the item height when the font size changes", () => {
            const { instance, vlist } = createInstance();
            return new Promise(resolve => {
                const newFontSize = 24;
                vlist.setItemHeight = (height: number) => {
                    // * 2 because attributeslicer doubles the itemheight
                    expect(height).to.be.equal(newFontSize * 2);
                    resolve();
                };
                instance.fontSize = newFontSize;
                expect(instance.fontSize).to.be.equal(newFontSize);
            });
        });
        it("should adjust the font size of items when the font size changes", () => {
            const { instance, element } = createInstance();
            const newFontSize = 24;
            instance.fontSize = newFontSize;
            expect(element.find(".advanced-slicer").css("font-size")).to.be.equal(newFontSize + "px");
        });

        it("should show the selections if set to showSelections is true", () => {
            const { instance, element } = createInstance();
            const selItems = SIMPLE_DATA.slice(1, 2);
            instance.data = SIMPLE_DATA;

            // Make sure there are tokens for each selection
            instance.selectedItems = selItems.slice(0);
            expect(element.find(".token").map((i, ele) => $(ele).text()).toArray()).to.deep.equal(selItems.map(n => n.match));

            // Should have this class if true
            expect(element.is(".show-selections")).to.be.true;

            // Make sure when we clear the selection, there are no tokens left
            instance.selectedItems = [];
            expect(element.find(".token").map((i, ele) => $(ele).text()).toArray()).to.deep.equal([]);
        });

        it("should not show selection elements if showSelections is false", () => {
            const { instance, element } = createInstance();
            const selItems = SIMPLE_DATA.slice(1, 2);
            instance.data = SIMPLE_DATA;

            instance.showSelections = false;

            // Make sure there are tokens for each selection
            instance.selectedItems = selItems.slice(0);

            // Click on the token
            expect(element.is(".show-selections")).to.be.false;
        });

        it("should remove a selection if a selection element is clicked on", () => {
            const { instance, element } = createInstance();
            const selItems = SIMPLE_DATA.slice(1, 2);
            instance.data = SIMPLE_DATA;

            // Make sure there are tokens for each selection
            instance.selectedItems = selItems.slice(0);

            // Click on the token
            element.find(".token").click();

            expect(instance.selectedItems).to.be.deep.equal([]);
        });
    });

    describe("state", () => {
        it ("setting should update the value of 'renderHorizontal'", () => {
            const { instance, element } = createInstance();
            instance.state = <any>_.set({}, "horizontal", true);
            expect(instance.renderHorizontal).to.be.true;
            expect(element.is(".render-horizontal")).to.be.true;
        });
        it ("setting should return the value of 'renderHorizontal'", () => {
            const { instance } = createInstance();
            instance.renderHorizontal = true;
            expect(instance.state.horizontal).to.be.true;
        });

        it ("setting should update the value of 'renderHorizontal'", () => {
            const { instance } = createInstance();
            instance.state = <any>_.set({}, "horizontal", true);
            expect(instance.renderHorizontal).to.be.true;
        });
        it ("setting should return the value of 'renderHorizontal'", () => {
            const { instance } = createInstance();
            instance.renderHorizontal = true;
            expect(instance.state.horizontal).to.be.true;
        });
        it ("setting should update the value of 'valueColumnWidth'", () => {
            const { instance } = createInstance();
            instance.state = <any>_.set({}, "valueColumnWidth", 56.6);
            expect(instance.valueWidthPercentage).to.be.equal(56.6);
        });
        it ("setting should return the value of 'valueColumnWidth'", () => {
            const { instance } = createInstance();
            instance.valueWidthPercentage = 56.6;
            expect(instance.state.valueColumnWidth).to.be.equal(56.6);
        });

        it ("setting should update the value of 'textSize'", () => {
            const { instance } = createInstance();
            instance.state = <any>_.set({}, "textSize", 56.6);
            expect(instance.fontSize).to.be.equal(56.6);
        });
        it ("setting should return the value of 'textSize'", () => {
            const { instance } = createInstance();
            instance.fontSize = 56.6;
            expect(instance.state.textSize).to.be.equal(56.6);
        });
        it ("setting should update the value of 'showOptions'", () => {
            const { instance } = createInstance();
            instance.state = <any>_.set({}, "showOptions", false);
            expect(instance.showOptions).to.be.equal(false);
        });
        it ("setting should return the value of 'showOptions'", () => {
            const { instance } = createInstance();
            instance.showOptions = false;
            expect(instance.state.showOptions).to.be.equal(false);
        });
        it ("setting should update the value of 'showValues'", () => {
            const { instance } = createInstance();
            instance.state = <any>_.set({}, "showValues", false);
            expect(instance.showValues).to.be.equal(false);
        });
        it ("setting should return the value of 'showValues'", () => {
            const { instance } = createInstance();
            instance.showValues = false;
            expect(instance.state.showValues).to.be.equal(false);
        });
        it ("setting should update the value of 'showSearch'", () => {
            const { instance } = createInstance();
            instance.state = <any>_.set({}, "showSearch", false);
            expect(instance.showSearchBox).to.be.equal(false);
        });
        it ("setting should return the value of 'showSearch'", () => {
            const { instance } = createInstance();
            instance.showSearchBox = false;
            expect(instance.state.showSearch).to.be.equal(false);
        });

        it ("setting should update the value of 'showSelections'", () => {
            const { instance } = createInstance();
            instance.state = <any>_.set({}, "showSelections", false);
            expect(instance.showSelections).to.be.equal(false);
        });
        it ("setting should return the value of 'showSelections'", () => {
            const { instance } = createInstance();
            instance.showSelections = false;
            expect(instance.state.showSelections).to.be.equal(false);
        });

        it ("setting should update the value of 'singleSelect'", () => {
            const { instance } = createInstance();
            instance.state = <any>_.set({}, "singleSelect", true);
            expect(instance.singleSelect).to.be.equal(true);
        });
        it ("setting should return the value of 'singleSelect'", () => {
            const { instance } = createInstance();
            instance.singleSelect = true;
            expect(instance.state.singleSelect).to.be.equal(true);
        });

        it ("setting should update the value of 'brushSelectionMode'", () => {
            const { instance } = createInstance();
            instance.state = <any>_.set({}, "brushMode", true);
            expect(instance.brushSelectionMode).to.be.equal(true);
        });
        it ("setting should return the value of 'brushSelectionMode'", () => {
            const { instance } = createInstance();
            instance.brushSelectionMode = true;
            expect(instance.state.brushMode).to.be.equal(true);
        });

        it ("setting should update the value of 'searchString'", () => {
            const { instance } = createInstance();
            instance.state = <any>{ searchText: "HIDYHIDYHO" };
            expect(instance.searchString).to.be.equal("HIDYHIDYHO");
        });
        it ("setting should return the value of 'searchString'", () => {
            const { instance } = createInstance();
            instance.searchString = "HIDYHIDYHO";
            expect(instance.state.searchText).to.be.equal("HIDYHIDYHO");
        });

        const TEST_SELECTED_ITEMS = [{ id: "A" }, { id: "B" }];
        it ("setting should update the value of 'selectedItems'", () => {
            const { instance } = createInstance();
            instance.state = <any>{ selectedItems: TEST_SELECTED_ITEMS.slice(0) };
            expect(instance.selectedItems.map(n => ({ id: n.id }))).to.be.deep.equal(TEST_SELECTED_ITEMS);
        });
        it ("setting should return the value of 'selectedItems'", () => {
            const { instance } = createInstance();
            instance.selectedItems = <any>TEST_SELECTED_ITEMS.slice(0);
            expect(instance.state.selectedItems).to.be.deep.equal(TEST_SELECTED_ITEMS.slice(0));
        });

        it ("setting should return the value of 'alwaysShowValues'", () => {
            const { instance } = createInstance();
            instance.displayValueLabels = true;
            expect(instance.state.displayValueLabels).to.be.equal(true);
        });

        it ("setting should return the value of 'textColor'", () => {
            const { instance } = createInstance();
            instance.itemTextColor = "#333";
            expect(instance.state.itemTextColor).to.be.equal("#333");
        });

/*
            selectedItems: [],
            searchText: "",
            settings: {
            */
    });

    describe("UI", () => {
        it("should update the search string if the search box is changed", () => {
            const { instance, element } = createInstance();

            // Click on the token
            element.find(".searchbox")
                .val("TEST_SEARCH")
                .trigger("input");

            return new Promise(resolve => {
                setTimeout(() => {
                    expect(instance.searchString).to.be.equal("TEST_SEARCH");
                    resolve();
                }, 10); // Add a delay so it overcomes the search debounce
            });
        });
        it("should raise the load more data event if search box is changed", () => {
            const { instance, element } = createInstance();
            return new Promise(resolve => {

                // Setup stuff to say that we need search updates.
                instance.serverSideSearch = true;
                instance.events.on("canLoadMoreData", (result: any) => {
                    result.result = true;
                });
                instance.events.on("loadMoreData", () => {
                    expect(instance.searchString).to.be.equal("TEST_SEARCH");
                    resolve();
                });

                // Click on the token
                element.find(".searchbox")
                    .val("TEST_SEARCH")
                    .trigger("input");
            });
        });
    });

    /**
     * Ones not easily testable
     */
    it("should scroll correctly when the text size is very large");
    it("should scroll correctly when the text size is very small");
});
