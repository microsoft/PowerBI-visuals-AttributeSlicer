/**
 * The MIT License (MIT)
 *
 * Copyright (C) 2013 Sergi Mansilla
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the 'Software'), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

'use strict';

var $ = require("jquery");

/**
 * Creates a virtually-rendered scrollable list.
 * @param {object} config
 * @constructor
 */
function VirtualList(config) {
  var width = (config && config.w + 'px') || '100%';
  var height = (config && config.h + 'px') || '100%';
  var itemHeight = this.itemHeight = config.itemHeight;

  this.generatorFn = config.generatorFn;

  var scroller = VirtualList.createScroller(0);
  this.scroller = scroller;
  this.container = VirtualList.createContainer(width, height);
  this.container.append(scroller);

//   var screenItemsLen = Math.ceil(config.h / itemHeight);
//   // Cache 4 times the number of items that fit in the container viewport
//   this.cachedItemsLen = screenItemsLen * 3;

  var self = this;

  // As soon as scrolling has stopped, this interval asynchronouslyremoves all
  // the nodes that are not used anymore
  this.rmNodeInterval = setInterval(function() {
    if (Date.now() - this.lastScrolled > 100) {
      var badNodes = self.container.find('[data-rm]');
      if (badNodes.length) {
          badNodes.remove();
      }
    }
  }.bind(this), 300);

  var onScroll = function(e) {
    var scrollTop = e.target.scrollTop; // Triggers reflow
    if (!this.lastRepaintY || Math.abs(scrollTop - this.lastRepaintY) > this.maxBuffer) {
      var first = parseInt(scrollTop / itemHeight) - this.screenItemsLen;
      self._renderChunk(self.container, first < 0 ? 0 : first);
      this.lastRepaintY = scrollTop;
    }

    this.lastScrolled = Date.now();
    e.preventDefault && e.preventDefault();
  }.bind(this);

  this.container.on('scroll', onScroll.bind(this));
}

VirtualList.prototype.setHeight = function (height) {
    var screenItemsLen = this.screenItemsLen = Math.ceil(height / this.itemHeight);
    // Cache 4 times the number of items that fit in the container viewport
    this.cachedItemsLen = screenItemsLen * 3;
    this.maxBuffer = screenItemsLen * this.itemHeight;
    
    this.lastRepaintY = undefined;
    if (this.items) {
        var first = parseInt(this.container[0].scrollTop / this.itemHeight) - this.screenItemsLen;
        this._renderChunk(this.container, first < 0 ? 0 : first);
    }
};

VirtualList.prototype.setItems = function (items) {
    this.items = items;
    this.totalRows = (items && items.length);
    this.scroller.css({ height: (this.itemHeight * this.totalRows) + "px" });
    this.lastRepaintY = undefined;
    this._renderChunk(this.container, 0);
};

VirtualList.prototype.createRow = function(i) {
  var item;
  if (this.generatorFn)
    item = this.generatorFn(i);
  else if (this.items) {
    if (typeof this.items[i] === 'string') {
      var itemText = document.createTextNode(this.items[i]);
      item = document.createElement('div');
      item.style.height = this.itemHeight + 'px';
      item.appendChild(itemText);
    } else {
      item = this.items[i];
    }
  }
  
  if (item) {
    item.classList.add('vrow');
    item.style.position = 'absolute';
    item.style.top = (i * this.itemHeight) + 'px';
  }
  return item;
};

VirtualList.prototype.rerender = function() {
    var first = parseInt(this.container[0].scrollTop / this.itemHeight) - this.screenItemsLen;
    this._renderChunk(this.container, first < 0 ? 0 : first);
    this.lastScrolled = 0;
};

/**
 * Renders a particular, consecutive chunk of the total rows in the list. To
 * keep acceleration while scrolling, we mark the nodes that are candidate for
 * deletion instead of deleting them right away, which would suddenly stop the
 * acceleration. We delete them once scrolling has finished.
 *
 * @param {Node} node Parent node where we want to append the children chunk.
 * @param {Number} from Starting position, i.e. first children index.
 * @return {void}
 */
VirtualList.prototype._renderChunk = function(node, from) {
  var finalItem = from + this.cachedItemsLen;
  if (finalItem > this.totalRows)
    finalItem = this.totalRows;

  // Append all the new rows in a document fragment that we will later append to
  // the parent node
  var fragment = $("<div>");
  for (var i = from; i < finalItem && i < this.totalRows; i++) {
    var row = this.createRow(i);
    fragment.append(row);
  }

  // Hide and mark obsolete nodes for deletion.
  for (var j = 1, l = node[0].childNodes.length; j < l; j++) {
    node[0].childNodes[j].style.display = 'none';
    node[0].childNodes[j].setAttribute('data-rm', '1');
  }
  node.append(fragment);
};

VirtualList.createContainer = function(w, h) {
    var ele = $('<div>');
    ele.addClass("virtual-list");
    ele.css({
        width: "100%",
        height: "100%",
        overflow: 'hidden',
        overflowY: "auto",
        position: 'relative',
        padding: 0
    }); 
    return ele;
};

VirtualList.createScroller = function(h) {
    var ele = $('<div>');   
    ele.addClass("vlist-scroller");
    ele.css({
        opacity: 0,
        position: 'absolute',
        top: 0,
        left: 0,
        width: '1px',
        height: h + 'px',
    });
    return ele;
};

module.exports = VirtualList;