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
var _this = this;
/* tslint:disable */
var VirtualList = require("./VirtualList");
/* tslint:enable */
var chai = require("chai");
var $ = require("jquery");
describe("VirtualList", function () {
    var parentEle;
    beforeEach(function () {
        parentEle = $("<div>");
    });
    describe("setDir", function () {
        var createInstance = function () {
            var items = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                items[_i] = arguments[_i];
            }
            var instance = new VirtualList({
                itemHeight: _this.fontSize * 2,
                afterRender: function () {
                    // whatever
                },
                generatorFn: function () { return $("<div>")[0]; },
            });
            instance.setItems(items);
            return { instance: instance, element: instance.container };
        };
        var SIMPLE_ITEMS = ["A", "B", "C"];
        it("should set the width/height correctly of the list display when horiz == false", function () {
            var _a = createInstance(SIMPLE_ITEMS), instance = _a.instance, element = _a.element;
            instance.setHeight(4000);
            instance.setDir(false);
            var listEle = element.find(".list-display");
            chai.expect(listEle.css("height")).to.be.equal("4000px");
        });
        it("should set the width/height correctly of the list display when horiz == true", function () {
            var _a = createInstance(SIMPLE_ITEMS), instance = _a.instance, element = _a.element;
            instance.setHeight(4000);
            instance.setDir(true);
            var listEle = element.find(".list-display");
            // The "width" of the list is the actual height of the list when in horizontal mode
            chai.expect(listEle.css("width")).to.be.equal("4000px");
        });
    });
});
