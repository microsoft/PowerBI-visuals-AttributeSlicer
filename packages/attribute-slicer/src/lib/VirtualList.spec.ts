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

'use strict';
/* tslint:disable */
const VirtualList = require('./VirtualList');
/* tslint:enable */
import * as chai from 'chai';
import * as $ from 'jquery';
describe('VirtualList', () => {
  let parentEle: JQuery;
  beforeEach(() => {
    parentEle = $('<div>');
  });
  describe('setDir', () => {
    const createInstance = (...items: any[]) => {
      const instance = new VirtualList({
        itemHeight: this.fontSize * 2,
        afterRender: () => {
          // whatever
        },
        generatorFn: () => $('<div>')[0],
      });
      instance.setItems(items);
      return { instance, element: instance.container };
    };
    const SIMPLE_ITEMS = ['A', 'B', 'C'];
    it('should set the width/height correctly of the list display when horiz == false', () => {
      const { instance, element } = createInstance(SIMPLE_ITEMS);
      instance.setHeight(4000);
      instance.setDir(false);
      const listEle = element.find('.list-display');
      chai.expect(listEle.css('height')).to.be.equal('4000px');
    });
    it('should set the width/height correctly of the list display when horiz == true', () => {
      const { instance, element } = createInstance(SIMPLE_ITEMS);
      instance.setHeight(4000);
      instance.setDir(true);
      const listEle = element.find('.list-display');

      // The "width" of the list is the actual height of the list when in horizontal mode
      chai.expect(listEle.css('width')).to.be.equal('4000px');
    });
  });
});
