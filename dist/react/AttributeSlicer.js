(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("jQuery"), require("React"), require("ReactDOM"));
	else if(typeof define === 'function' && define.amd)
		define(["jQuery", "React", "ReactDOM"], factory);
	else {
		var a = typeof exports === 'object' ? factory(require("jQuery"), require("React"), require("ReactDOM")) : factory(root["jQuery"], root["React"], root["ReactDOM"]);
		for(var i in a) (typeof exports === 'object' ? exports : root)[i] = a[i];
	}
})(this, function(__WEBPACK_EXTERNAL_MODULE_1__, __WEBPACK_EXTERNAL_MODULE_5__, __WEBPACK_EXTERNAL_MODULE_6__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var React = __webpack_require__(5);
	var ReactDOM = __webpack_require__(6);
	var $ = __webpack_require__(1);
	var AttributeSlicer_1 = __webpack_require__(4);
	;
	/**
	 * Thin wrapper around LineUp
	 */
	var AttributeSlicer = (function (_super) {
	    __extends(AttributeSlicer, _super);
	    function AttributeSlicer() {
	        _super.apply(this, arguments);
	    }
	    AttributeSlicer.prototype.componentDidMount = function () {
	        this.node = ReactDOM.findDOMNode(this);
	        this.mySlicer = new AttributeSlicer_1.AttributeSlicer($(this.node));
	        this.attachEvents();
	        this.renderContent();
	    };
	    AttributeSlicer.prototype.componentWillReceiveProps = function (newProps) {
	        this.renderContent(newProps);
	    };
	    /**
	     * Renders this component
	     */
	    AttributeSlicer.prototype.render = function () {
	        return React.createElement("div", {className: "advanced-slicer-container", style: { width: "100%", height: "100%" }});
	    };
	    /**
	     * Attaches events to the slicer
	     */
	    AttributeSlicer.prototype.attachEvents = function () {
	        var _this = this;
	        var guardedEventer = function (evtName) {
	            return function () {
	                var args = [];
	                for (var _i = 0; _i < arguments.length; _i++) {
	                    args[_i - 0] = arguments[_i];
	                }
	                if (_this.props[evtName]) {
	                    _this.props[evtName].apply(_this, args);
	                }
	            };
	        };
	        this.mySlicer.events.on("loadMoreData", guardedEventer("onLoadMoreData"));
	        this.mySlicer.events.on("canLoadMoreData", guardedEventer("onCanLoadMoreData"));
	        this.mySlicer.events.on("selectionChanged", guardedEventer("onSelectionChanged"));
	    };
	    AttributeSlicer.prototype.renderContent = function (props) {
	        // if called from `componentWillReceiveProps`, then we use the new
	        // props, otherwise use what we already have.
	        props = props || this.props;
	        this.mySlicer.showHighlight = props.showHighlight;
	        this.mySlicer.showValues = props.showValues;
	        this.mySlicer.showSelections = props.showSelections;
	        this.mySlicer.serverSideSearch = props.serverSideSearch;
	        this.mySlicer.data = props.data;
	    };
	    return AttributeSlicer;
	}(React.Component));
	exports.AttributeSlicer = AttributeSlicer;


/***/ },
/* 1 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_1__;

/***/ },
/* 2 */
/***/ function(module, exports) {

	/*
	 * Natural Sort algorithm for Javascript - Version 0.7 - Released under MIT license
	 * Author: Jim Palmer (based on chunking idea from Dave Koelle)
	 */
	/*jshint unused:false */
	'use strict';

	module.exports = function naturalSort(a, b) {
		"use strict";
		var re = /(^([+\-]?(?:0|[1-9]\d*)(?:\.\d*)?(?:[eE][+\-]?\d+)?)?$|^0x[0-9a-f]+$|\d+)/gi,
		    sre = /(^[ ]*|[ ]*$)/g,
		    dre = /(^([\w ]+,?[\w ]+)?[\w ]+,?[\w ]+\d+:\d+(:\d+)?[\w ]?|^\d{1,4}[\/\-]\d{1,4}[\/\-]\d{1,4}|^\w+, \w+ \d+, \d{4})/,
		    hre = /^0x[0-9a-f]+$/i,
		    ore = /^0/,
		    i = function i(s) {
			return naturalSort.insensitive && ('' + s).toLowerCase() || '' + s;
		},
		   
		// convert all to strings strip whitespace
		x = i(a).replace(sre, '') || '',
		    y = i(b).replace(sre, '') || '',
		   
		// chunk/tokenize
		xN = x.replace(re, '\0$1\0').replace(/\0$/, '').replace(/^\0/, '').split('\0'),
		    yN = y.replace(re, '\0$1\0').replace(/\0$/, '').replace(/^\0/, '').split('\0'),
		   
		// numeric, hex or date detection
		xD = parseInt(x.match(hre), 16) || xN.length !== 1 && x.match(dre) && Date.parse(x),
		    yD = parseInt(y.match(hre), 16) || xD && y.match(dre) && Date.parse(y) || null,
		    oFxNcL,
		    oFyNcL;
		// first try and sort Hex codes or Dates
		if (yD) {
			if (xD < yD) {
				return -1;
			} else if (xD > yD) {
				return 1;
			}
		}
		// natural sorting through split numeric strings and default strings
		for (var cLoc = 0, numS = Math.max(xN.length, yN.length); cLoc < numS; cLoc++) {
			// find floats not starting with '0', string or 0 if not defined (Clint Priest)
			oFxNcL = !(xN[cLoc] || '').match(ore) && parseFloat(xN[cLoc]) || xN[cLoc] || 0;
			oFyNcL = !(yN[cLoc] || '').match(ore) && parseFloat(yN[cLoc]) || yN[cLoc] || 0;
			// handle numeric vs string comparison - number < string - (Kyle Adams)
			if (isNaN(oFxNcL) !== isNaN(oFyNcL)) {
				return isNaN(oFxNcL) ? 1 : -1;
			}
			// rely on string comparison if different types - i.e. '02' < 2 != '02' < '2'
			else if (typeof oFxNcL !== typeof oFyNcL) {
					oFxNcL += '';
					oFyNcL += '';
				}
			if (oFxNcL < oFyNcL) {
				return -1;
			}
			if (oFxNcL > oFyNcL) {
				return 1;
			}
		}
		return 0;
	};

/***/ },
/* 3 */
/***/ function(module, exports) {

	"use strict";
	/**
	 * A mixin that adds support for event emitting
	 */
	var EventEmitter = (function () {
	    function EventEmitter() {
	        this.listeners = {};
	    }
	    /**
	     * Adds an event listener for the given event
	     */
	    EventEmitter.prototype.on = function (name, handler) {
	        var _this = this;
	        var listeners = this.listeners[name] = this.listeners[name] || [];
	        listeners.push(handler);
	        return {
	            destroy: function () {
	                _this.off(name, handler);
	            }
	        };
	    };
	    /**
	     * Removes an event listener for the given event
	     */
	    EventEmitter.prototype.off = function (name, handler) {
	        var listeners = this.listeners[name];
	        if (listeners) {
	            var idx = listeners.indexOf(handler);
	            if (idx >= 0) {
	                listeners.splice(idx, 1);
	            }
	        }
	    };
	    /**
	     * Raises the given event
	     */
	    /*protected*/ EventEmitter.prototype.raiseEvent = function (name) {
	        var _this = this;
	        var args = [];
	        for (var _i = 1; _i < arguments.length; _i++) {
	            args[_i - 1] = arguments[_i];
	        }
	        var listeners = this.listeners[name];
	        if (listeners) {
	            listeners.forEach(function (l) {
	                l.apply(_this, args);
	            });
	        }
	    };
	    return EventEmitter;
	}());
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = EventEmitter;


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var EventEmitter_1 = __webpack_require__(3);
	var $ = __webpack_require__(1);
	var naturalSort = __webpack_require__(2);
	/**
	 * Represents an advanced slicer to help slice through data
	 */
	var AttributeSlicer = (function () {
	    /**
	     * Constructor for the advanced slicer
	     */
	    function AttributeSlicer(element) {
	        var _this = this;
	        /**
	         * The data contained in this slicer
	         */
	        this._data = [];
	        /**
	         * Our event emitter
	         */
	        this._eventEmitter = new EventEmitter_1.default();
	        /**
	         * Whether or not we are loading the search box
	         */
	        this.loadingSearch = false;
	        /**
	         * Setter for server side search
	         */
	        this._serverSideSearch = true;
	        /**
	         * Gets whether or not the search is case insensitive
	         */
	        this._caseInsentitive = true;
	        /**
	         * The list of selected items
	         */
	        this._selectedItems = [];
	        /**
	         * A boolean indicating whether or not the list is loading more data
	         */
	        this._loadingMoreData = false; // Don't use this directly
	        this.element = element;
	        this.listContainer = element.append($(AttributeSlicer.template)).find(".advanced-slicer");
	        this.listEle = this.listContainer.find(".list");
	        this.listEle.scroll(function () { return _this.checkLoadMoreData(); });
	        this.selectionsEle = element.find(".selections");
	        this.checkAllEle = element.find(".check-all").on("click", function () { return _this.toggleSelectAll(); });
	        this.clearAllEle = element.find(".clear-all").on("click", function () { return _this.clearSelection(); });
	        this.attachEvents();
	        // These two are here because the devtools call init more than once
	        this.loadingMoreData = true;
	    }
	    Object.defineProperty(AttributeSlicer.prototype, "serverSideSearch", {
	        /**
	         * Getter for server side search
	         */
	        get: function () {
	            return this._serverSideSearch;
	        },
	        set: function (value) {
	            this._serverSideSearch = value;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(AttributeSlicer.prototype, "caseInsensitive", {
	        get: function () {
	            return this._caseInsentitive;
	        },
	        /**
	         * Setter for case insensitive
	         */
	        set: function (value) {
	            this._caseInsentitive = value;
	            this.syncItemVisiblity();
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(AttributeSlicer.prototype, "events", {
	        /**
	         * Gets our event emitter
	         */
	        get: function () {
	            return this._eventEmitter;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(AttributeSlicer.prototype, "dimensions", {
	        /**
	         * Sets the dimension of the slicer
	         */
	        set: function (dims) {
	            this.listEle.find(".display-container").css({ width: "100%" });
	            this.listEle.css({ width: "100%", height: dims.height - this.element.find(".slicer-options").height() - 10 });
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(AttributeSlicer.prototype, "showValues", {
	        /**
	         * Setter for showing the values column
	         */
	        set: function (show) {
	            this.element.toggleClass("has-values", show);
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(AttributeSlicer.prototype, "showSelections", {
	        /**
	         * Setter for showing the selections area
	         */
	        set: function (show) {
	            this.element.toggleClass("show-selections", show);
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(AttributeSlicer.prototype, "showHighlight", {
	        /**
	         * Gets whether or not we are showing the highlights
	         */
	        get: function () {
	            return this.element.hasClass("show-highlight");
	        },
	        /**
	         * Toggles whether or not to show highlights
	         */
	        set: function (highlight) {
	            this.element.toggleClass("show-highlight", !!highlight);
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(AttributeSlicer.prototype, "data", {
	        /**
	         * Gets the data behind the slicer
	         */
	        get: function () {
	            return this._data;
	        },
	        /**
	         * Sets the slicer data
	         */
	        set: function (newData) {
	            this.listEle.empty();
	            // If some one sets the data, then clearly we are no longer loading data
	            this.loadingMoreData = false;
	            if (newData && newData.length) {
	                this.listEle.append(newData.map(function (item) {
	                    var ele = AttributeSlicer.listItemFactory(item.matchPrefix, item.match, item.matchSuffix);
	                    var renderedValue = item.renderedValue;
	                    if (renderedValue) {
	                        var valueDisplayEle = ele.find(".value-display");
	                        valueDisplayEle.css({ width: (renderedValue + "%") });
	                        valueDisplayEle.find(".value").html('' + item.value);
	                    }
	                    ele[item.selected ? "hide" : "show"].call(ele);
	                    ele.find("input").prop('checked', item.selected);
	                    ele.data("item", item);
	                    return ele;
	                }));
	                this.loadingSearch = true;
	                this.element.find(".searchbox").val(this.searchString);
	                this.loadingSearch = false;
	            }
	            this._data = newData;
	            this.updateSelectAllButtonState();
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(AttributeSlicer.prototype, "selectedItems", {
	        get: function () {
	            return this._selectedItems;
	        },
	        /**
	         * Sets the set of selected items
	         */
	        set: function (value) {
	            var _this = this;
	            var oldSelection = this.selectedItems.slice(0);
	            this._selectedItems = value;
	            // HACK: They are all selected if it is the same length as our dataset
	            var allChecked = value && value.length === this.data.length;
	            var someChecked = value && value.length > 0 && !allChecked;
	            this.syncItemVisiblity();
	            if (value) {
	                this.selectionsEle.find(".token").remove();
	                value.map(function (v) { return _this.createSelectionToken(v); }).forEach(function (n) { return n.insertBefore(_this.element.find(".clear-all")); });
	            }
	            this.raiseSelectionChanged(this.selectedItems, oldSelection);
	            this.checkAllEle.prop("checked", someChecked);
	            this.checkAllEle.prop('indeterminate', someChecked);
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(AttributeSlicer.prototype, "searchString", {
	        /**
	         * Gets the current serch value
	         */
	        get: function () {
	            return this.element.find(".searchbox").val();
	        },
	        /**
	         * Gets the current serch value
	         */
	        set: function (value) {
	            this.element.find(".searchbox").val(value);
	            this.handleSearchChanged();
	        },
	        enumerable: true,
	        configurable: true
	    });
	    /**j
	     * Sorts the slicer
	     */
	    AttributeSlicer.prototype.sort = function (toSort, desc) {
	        this.data.sort(function (a, b) {
	            var sortVal = naturalSort(a[toSort], b[toSort]);
	            return desc ? -1 * sortVal : sortVal;
	        });
	    };
	    Object.defineProperty(AttributeSlicer.prototype, "loadingMoreData", {
	        get: function () {
	            return this._loadingMoreData;
	        },
	        /**
	         * Setter for loadingMoreData
	         */
	        set: function (value) {
	            this._loadingMoreData = value;
	            this.element.toggleClass("loading", value);
	        },
	        enumerable: true,
	        configurable: true
	    });
	    /**
	     * Syncs the item elements state with the current set of selected items and the search
	     */
	    AttributeSlicer.prototype.syncItemVisiblity = function () {
	        var _this = this;
	        var value = this.selectedItems;
	        var eles = this.element.find(".item");
	        var me = this;
	        var isMatch = function (item, value) {
	            var regex = new RegExp(value, _this.caseInsensitive ? "i" : "");
	            var pretty = function (val) { return ((val || "") + ""); };
	            return regex.test(pretty(item.match)) || regex.test(pretty(item.matchPrefix)) || regex.test(pretty(item.matchSuffix));
	        };
	        eles.each(function () {
	            var item = $(this).data("item");
	            var isVisible = !(!!value && value.filter(function (b) { return b.equals(item); }).length > 0);
	            // Update the search
	            if (isVisible && !me.serverSideSearch && me.searchString) {
	                isVisible = isMatch(item, me.searchString);
	            }
	            $(this).toggle(isVisible);
	        });
	    };
	    /**
	     * Toggle the select all state
	     */
	    AttributeSlicer.prototype.toggleSelectAll = function () {
	        var checked = this.checkAllEle.prop('checked');
	        if (!!checked) {
	            this.selectedItems = this._data.slice(0);
	        }
	        else {
	            this.selectedItems = [];
	        }
	    };
	    /**
	     * Creates a new selection token element
	     */
	    AttributeSlicer.prototype.createSelectionToken = function (v) {
	        var _this = this;
	        var newEle = $('<div/>');
	        var text = (v.matchPrefix || "") + v.match + (v.matchSuffix || "");
	        newEle
	            .addClass("token")
	            .attr("title", text)
	            .data("item", v)
	            .on("click", function () {
	            newEle.remove();
	            var item = _this.selectedItems.filter(function (n) { return n.equals(v); })[0];
	            _this.selectedItems.splice(_this.selectedItems.indexOf(item), 1);
	            _this.selectedItems = _this.selectedItems.slice(0);
	        })
	            .text(text);
	        return newEle;
	    };
	    /**
	     * Clears the selection
	     */
	    AttributeSlicer.prototype.clearSelection = function () {
	        this.selectedItems = [];
	    };
	    /**
	     * Updates the select all button state to match the data
	     */
	    AttributeSlicer.prototype.updateSelectAllButtonState = function () {
	        this.checkAllEle.prop('indeterminate', this.selectedItems.length > 0 && this._data.length !== this.selectedItems.length);
	        this.checkAllEle.prop('checked', this.selectedItems.length > 0);
	    };
	    /**
	     * Attaches all the necessary events
	     */
	    AttributeSlicer.prototype.attachEvents = function () {
	        var _this = this;
	        this.element.find(".searchbox").on("input", _.debounce(function () {
	            if (!_this.loadingSearch) {
	                _this.handleSearchChanged();
	            }
	        }, AttributeSlicer.SEARCH_DEBOUNCE));
	        this.listEle.on("click", function (evt) {
	            // var checkbox = $(evt.target);
	            var ele = $(evt.target).parents(".item");
	            if (ele.length > 0) {
	                var item = ele.data("item");
	                _this.selectedItems.push(item);
	                _this.selectedItems = _this.selectedItems.slice(0);
	                _this.updateSelectAllButtonState();
	            }
	            evt.stopImmediatePropagation();
	            evt.stopPropagation();
	        });
	    };
	    /**
	     * Handles when the search is changed
	     */
	    AttributeSlicer.prototype.handleSearchChanged = function () {
	        var _this = this;
	        if (this.serverSideSearch) {
	            setTimeout(function () { return _this.checkLoadMoreDataBasedOnSearch(); }, 10);
	        }
	        // this is required because when the list is done searching it adds back in cached elements with selected flags
	        this.syncItemVisiblity();
	        this.element.toggleClass("has-search", !!this.searchString);
	    };
	    /**
	     * Loads more data based on search
	     * @param force Force the loading of new data, if it can
	     */
	    AttributeSlicer.prototype.checkLoadMoreDataBasedOnSearch = function () {
	        // Only need to load if:
	        // 1. There is more data. 2. There is not too much stuff on the screen (not causing a scroll)
	        if (this.raiseCanLoadMoreData(true)) {
	            if (this.loadPromise) {
	                this.loadPromise['cancel'] = true;
	            }
	            // We're not currently loading data, cause we cancelled
	            this.loadingMoreData = false;
	            this.raiseLoadMoreData(true);
	        }
	    };
	    /**
	     * Listener for the list scrolling
	     */
	    AttributeSlicer.prototype.checkLoadMoreData = function () {
	        var scrollElement = this.listEle[0];
	        var scrollHeight = scrollElement.scrollHeight;
	        var top = scrollElement.scrollTop;
	        var shouldScrollLoad = scrollHeight - (top + scrollElement.clientHeight) < 200 && scrollHeight >= 200;
	        if (shouldScrollLoad && !this.loadingMoreData && this.raiseCanLoadMoreData()) {
	            this.raiseLoadMoreData(false);
	        }
	    };
	    /**
	     * Raises the event to load more data
	     */
	    AttributeSlicer.prototype.raiseLoadMoreData = function (isNewSearch) {
	        var _this = this;
	        var item = {};
	        this.events.raiseEvent("loadMoreData", item, isNewSearch, this.searchString);
	        if (item.result) {
	            this.loadingMoreData = true;
	            var promise_1 = this.loadPromise = item.result.then(function (items) {
	                // If this promise hasn't been cancelled
	                if (!promise_1['cancel']) {
	                    _this.loadingMoreData = false;
	                    _this.loadPromise = undefined;
	                    if (isNewSearch) {
	                        _this.data = items;
	                    }
	                    else {
	                        _this.data = _this.data.concat(items);
	                    }
	                    // Make sure we don't need to load more after this, in case it doesn't all fit on the screen
	                    setTimeout(function () { return _this.checkLoadMoreData(); }, 10);
	                    return items;
	                }
	            }, function () {
	                _this.data = [];
	                _this.loadingMoreData = false;
	            });
	            return promise_1;
	        }
	    };
	    /**
	     * Raises the event 'can
	     * '
	     */
	    AttributeSlicer.prototype.raiseCanLoadMoreData = function (isSearch) {
	        if (isSearch === void 0) { isSearch = false; }
	        var item = {
	            result: false
	        };
	        this.events.raiseEvent('canLoadMoreData', item, isSearch);
	        return item.result;
	    };
	    /**
	     * Raises the selectionChanged event
	     */
	    AttributeSlicer.prototype.raiseSelectionChanged = function (newItems, oldItems) {
	        this.events.raiseEvent('selectionChanged', newItems, oldItems);
	    };
	    /**
	     * The number of milliseconds before running the search, after a user stops typing.
	     */
	    AttributeSlicer.SEARCH_DEBOUNCE = 500;
	    /**
	     * The template for this visual
	     */
	    AttributeSlicer.template = "\n        <div class=\"advanced-slicer\">\n            <div class=\"slicer-options\">\n                <input class=\"searchbox\" placeholder=\"Search\" />\n                <div style=\"margin:0;padding:0;margin-top:5px;\">\n                <div class=\"selection-container\">\n                    <div class=\"selections\">\n                        <span class=\"clear-all\">Clear All</span>\n                    </div>\n                </div>\n                <!-- Disabled -->\n                <label style=\"display:none;vertical-align:middle\"><input class=\"check-all\" type=\"checkbox\" style=\"margin-right:5px;vertical-align:middle\"/>&nbsp;Select All</label>\n                </div>\n                <hr/>\n            </div>\n            <div class=\"list\" style=\"overflow:hidden;overflow-y:auto\"></div>\n            <div class='load-spinner' style='transform:scale(0.6);'><div>\n        </div>\n    ".trim().replace(/\n/g, '');
	    /**
	     * The template used to render list items
	     */
	    AttributeSlicer.listItemFactory = function (matchPrefix, match, matchSuffix) {
	        return $(("\n            <div style=\"white-space:nowrap\" class=\"item\">\n                <label style=\"cursor:pointer\">\n                    <!--<input style=\"vertical-align:middle;cursor:pointer\" type=\"checkbox\">-->\n                    <span style=\"margin-left: 5px;vertical-align:middle\" class=\"display-container\">\n                        <span style=\"display:inline-block;overflow:hidden\" class=\"category-container\">\n                            <span class=\"matchPrefix\">" + (matchPrefix || "") + "</span>\n                            <span class=\"match\">" + (match || "") + "</span>\n                            <span class=\"matchSuffix\">" + (matchSuffix || "") + "</span>\n                        </span>\n                        <span style=\"display:inline-block\" class=\"value-container\">\n                            <span style=\"display:inline-block;width:0px\" class=\"value-display\">&nbsp;<span class=\"value\"></span></span>\n                        </span>\n                    </span>\n                </label>\n            </div>\n        ").trim().replace(/\n/g, ''));
	    };
	    return AttributeSlicer;
	}());
	exports.AttributeSlicer = AttributeSlicer;


/***/ },
/* 5 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_5__;

/***/ },
/* 6 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_6__;

/***/ }
/******/ ])
});
;