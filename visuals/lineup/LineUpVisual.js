"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/// <reference path="../../base/references.d.ts"/>
var VisualBase_1 = require("../../base/VisualBase");
var Utils_1 = require("../../base/Utils");
var LineUp_1 = require("./LineUp");
var JSONDataProvider_1 = require("./providers/JSONDataProvider");
var SelectionId = powerbi.visuals.SelectionId;
var SelectionManager = powerbi.visuals.utility.SelectionManager;
var VisualDataRoleKind = powerbi.VisualDataRoleKind;
var colors = require("../../base/powerbi/colors");
var LineUpVisual = (function (_super) {
    __extends(LineUpVisual, _super);
    /**
     * The constructor for the visual
     */
    function LineUpVisual(noCss) {
        if (noCss === void 0) { noCss = false; }
        _super.call(this);
        /**
         * The font awesome resource
         */
        this.fontAwesome = {
            url: '//maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css',
            integrity: 'sha256-3dkvEK0WLHRJ7/Csr0BZjAWxERc5WH7bdeUya2aXxdU= sha512-+L4yy6FRcDGbXJ9mPG8MT' +
                '/3UCDzwR9gPeyFNMCtInsol++5m3bk2bXWKdZjvybmohrAsn3Ua5x8gfLnbE1YkOg==',
            crossorigin: "anonymous"
        };
        this.template = "\n        <div>\n            <div class=\"lineup\"></div>\n        </div>\n    ".trim().replace(/\n/g, '');
        /**
         * If css should be loaded or not
         */
        this.noCss = false;
        this.noCss = noCss;
    }
    /** This is called once when the visual is initialially created */
    LineUpVisual.prototype.init = function (options) {
        var _this = this;
        _super.prototype.init.call(this, options, this.template, true);
        this.host = options.host;
        // Temporary, because the popups will load outside of the iframe for some reason
        this.buildExternalCssLink(this.fontAwesome).then(function (ele) {
            _this.container.append($(ele));
        });
        this.selectionManager = new SelectionManager({
            hostServices: options.host
        });
        this.lineup = new LineUp_1.LineUp(this.element.find(".lineup"));
        this.lineup.events.on("selectionChanged", function (rows) { return _this.onSelectionChanged(rows); });
        this.lineup.events.on(LineUp_1.LineUp.EVENTS.FILTER_CHANGED, function (filter) { return _this.onFilterChanged(filter); });
        this.lineup.events.on(LineUp_1.LineUp.EVENTS.CLEAR_SELECTION, function () { return _this.onSelectionChanged(); });
        this.lineup.events.on("configurationChanged", function (config) {
            if (!_this.loadingData) {
                var objects = {
                    merge: [
                        {
                            objectName: "layout",
                            properties: {
                                "layout": JSON.stringify(config)
                            },
                            selector: undefined,
                        }
                    ]
                };
                _this.host.persistProperties(objects);
            }
        });
        this.dimensions = { width: options.viewport.width, height: options.viewport.height };
    };
    /** Update is called for data updates, resizes & formatting changes */
    LineUpVisual.prototype.update = function (options) {
        this.loadingData = true;
        _super.prototype.update.call(this, options);
        // Assume that data updates won't happen when resizing
        var newDims = { width: options.viewport.width, height: options.viewport.height };
        if (!_.isEqual(newDims, this.dimensions)) {
            this.dimensions = newDims;
        }
        else {
            // If we explicitly are loading more data OR If we had no data before, then data has been loaded
            this.waitingForMoreData = false;
            this.waitingForSort = false;
            this.dataView = options.dataViews[0];
            this.dataViewTable = this.dataView && this.dataView.table;
            this.checkSettingsChanged();
            this.checkDataChanged();
        }
        this.loadingData = false;
    };
    /**
     * Enumerates the instances for the objects that appear in the power bi panel
     */
    LineUpVisual.prototype.enumerateObjectInstances = function (options) {
        if (options.objectName === 'layout') {
            return [{
                    selector: null,
                    objectName: 'layout',
                    properties: {
                        layout: JSON.stringify(this.lineup.configuration)
                    }
                }];
        }
        return [{
                selector: null,
                objectName: options.objectName,
                properties: $.extend(true, {}, this.lineup.settings[options.objectName])
            }];
    };
    /**
     * Gets the css used for this element
     */
    LineUpVisual.prototype.getCss = function () {
        return this.noCss ? [] : _super.prototype.getCss.call(this).concat([require("!css!sass!./css/LineUp.scss"), require("!css!sass!./css/LineUpVisual.scss")]);
    };
    /**
    * Gets the external css paths used for this visualization
    */
    LineUpVisual.prototype.getExternalCssResources = function () {
        return _super.prototype.getExternalCssResources.call(this).concat(this.fontAwesome);
    };
    /**
     * Gets a lineup config from the data view
     */
    LineUpVisual.prototype.getConfigFromDataView = function () {
        var newColArr = this.dataViewTable.columns.slice(0).map(function (c) {
            return {
                label: c.displayName,
                column: c.displayName,
                type: c.type.numeric ? "number" : "string",
            };
        });
        var config = null;
        if (this.dataView.metadata && this.dataView.metadata.objects && this.dataView.metadata.objects['layout']) {
            var configStr = this.dataView.metadata.objects['layout']['layout'];
            if (configStr) {
                config = JSON.parse(configStr);
            }
        }
        if (!config) {
            config = {
                primaryKey: newColArr[0].label,
                columns: newColArr
            };
        }
        else {
            var newColNames = newColArr.map(function (c) { return c.column; });
            // Filter out any columns that don't exist anymore
            config.columns = config.columns.filter(function (c) {
                return newColNames.indexOf(c.column) >= 0;
            });
            // Sort contains a missing column
            if (config.sort && newColNames.indexOf(config.sort.column) < 0 && !config.sort.stack) {
                config.sort = undefined;
            }
            if (config.layout && config.layout['primary']) {
                var removedColumnFilter_1 = function (c) {
                    if (newColNames.indexOf(c.column) >= 0) {
                        return true;
                    }
                    if (c.children) {
                        c.children = c.children.filter(removedColumnFilter_1);
                        return c.children.length > 0;
                    }
                    return false;
                };
                config.layout['primary'] = config.layout['primary'].filter(removedColumnFilter_1);
            }
            Utils_1.default.listDiff(config.columns.slice(0), newColArr, {
                /**
                 * Returns true if item one equals item two
                 */
                equals: function (one, two) { return one.label === two.label; },
                /**
                 * Gets called when the given item was removed
                 */
                onRemove: function (item) {
                    for (var i = 0; i < config.columns.length; i++) {
                        if (config.columns[i].label === item.label) {
                            config.columns.splice(i, 1);
                            break;
                        }
                    }
                },
                /**
                 * Gets called when the given item was added
                 */
                onAdd: function (item) {
                    config.columns.push(item);
                    config.layout['primary'].push({
                        width: 100,
                        column: item.column,
                        type: item.type
                    });
                }
            });
        }
        return config;
    };
    /**
     * Converts the data from power bi to a data we can use
     */
    LineUpVisual.converter = function (view, config, selectedIds) {
        var data = [];
        if (view && view.table) {
            var table = view.table;
            table.rows.forEach(function (row, rowIndex) {
                var identity;
                var newId;
                if (view.categorical && view.categorical.categories.length) {
                    identity = view.categorical.categories[0].identity[rowIndex];
                    newId = SelectionId.createWithId(identity);
                }
                else {
                    newId = SelectionId.createNull();
                }
                // The below is busted > 100
                //var identity = SelectionId.createWithId(this.dataViewTable.identity[rowIndex]);
                var result = {
                    id: newId.key,
                    identity: newId,
                    equals: function (b) { return b.identity.equals(newId); },
                    filterExpr: identity && identity.expr,
                    selected: !!_.find(selectedIds, function (id) { return id.equals(newId); })
                };
                row.forEach(function (colInRow, i) {
                    result[table.columns[i].displayName] = colInRow;
                });
                data.push(result);
            });
        }
        return data;
    };
    /**
     * Event listener for when the visual data's changes
     */
    LineUpVisual.prototype.checkDataChanged = function () {
        var _this = this;
        if (this.dataViewTable) {
            var config = this.getConfigFromDataView();
            var newData = LineUpVisual.converter(this.dataView, config, this.selectionManager.getSelectionIds());
            var selectedRows = newData.filter(function (n) { return n.selected; });
            this.lineup.configuration = config;
            if (Utils_1.default.hasDataChanged(newData, this._data, function (a, b) { return a.identity.equals(b.identity); })) {
                this._data = newData;
                this.lineup.count = this._data.length;
                this.lineup.dataProvider = new MyDataProvider(newData, function () { return !!_this.dataView.metadata.segment; }, function () {
                    _this.waitingForMoreData = true;
                    _this.host.loadMoreData();
                }, function (sort) { return _this.onSorted(sort); }, function (filter) { return _this.onFilterChanged(filter); });
            }
            this.lineup.selection = selectedRows;
        }
    };
    /**
     * Listener for when the visual settings changed
     */
    LineUpVisual.prototype.checkSettingsChanged = function () {
        if (this.dataView) {
            // Store this to compare
            var oldSettings = $.extend(true, {}, this.lineup.settings);
            // Make sure we have the default values
            var updatedSettings = $.extend(true, {}, this.lineup.settings, LineUpVisual.VISUAL_DEFAULT_SETTINGS);
            // Copy over new values
            var newObjs = $.extend(true, {}, this.dataView.metadata.objects);
            if (newObjs) {
                for (var section in newObjs) {
                    var values = newObjs[section];
                    for (var prop in values) {
                        if (updatedSettings[section] && typeof (updatedSettings[section][prop]) !== "undefined") {
                            updatedSettings[section][prop] = values[prop];
                        }
                    }
                }
            }
            this.lineup.settings = updatedSettings;
        }
    };
    /**
     * Gets called when a filter is changed.
     */
    LineUpVisual.prototype.onFilterChanged = function (filter) {
        var mySettings = this.lineup.settings;
        if (mySettings.experimental && mySettings.experimental.serverSideFiltering) {
            return true;
        }
    };
    /**
     * Listens for lineup to be sorted
     */
    LineUpVisual.prototype.onSorted = function (sort) {
        var mySettings = this.lineup.settings;
        if (mySettings.experimental && mySettings.experimental.serverSideSorting) {
            var args = null;
            if (sort) {
                var pbiCol = this.dataViewTable.columns.filter(function (c) { return c.displayName === sort.column; })[0];
                var sortDescriptors = [{
                        queryName: pbiCol.queryName,
                        sortDirection: sort.asc ? 1 /* Ascending */ : 2 /* Descending */
                    }];
                args = {
                    sortDescriptors: sortDescriptors
                };
            }
            this.waitingForSort = true;
            this.host.onCustomSort(args);
            return true;
        }
    };
    /**
     * Selects the given rows
     */
    LineUpVisual.prototype.onSelectionChanged = function (rows) {
        var _this = this;
        var filter;
        var _a = this.lineup.settings.selection, singleSelect = _a.singleSelect, multiSelect = _a.multiSelect;
        if (singleSelect || multiSelect) {
            if (rows && rows.length) {
                var expr = rows[0].filterExpr;
                // If we are allowing multiSelect
                if (rows.length > 0 && multiSelect) {
                    rows.slice(1).forEach(function (r) {
                        expr = powerbi.data.SQExprBuilder.or(expr, r.filterExpr);
                    });
                }
                filter = powerbi.data.SemanticFilter.fromSQExpr(expr);
            }
            var objects = {
                merge: [
                    {
                        objectName: "general",
                        selector: undefined,
                        properties: {
                            "filter": filter
                        }
                    }
                ]
            };
            // rows are what are currently selected in lineup
            if (rows && rows.length) {
                var smSelectedIds = this.selectionManager.getSelectionIds();
                var unselectedRows = smSelectedIds.filter(function (n) {
                    return rows.filter(function (m) { return m.identity.equals(n); }).length === 0;
                });
                var newSelectedRows = rows.filter(function (n) {
                    return smSelectedIds.filter(function (m) { return m.equals(n.identity); }).length === 0;
                });
                // This should work, but there is a bug with selectionManager
                // newSelectedRows.concat(unselectedRows).forEach((r) => this.selectionManager.select(r.identity, true));
                // HACK
                this.selectionManager.clear();
                rows.forEach(function (r) { return _this.selectionManager.select(r.identity, true); });
            }
            else {
                this.selectionManager.clear();
            }
            this.host.persistProperties(objects);
        }
    };
    /**
     * The default settings for the visual
     */
    LineUpVisual.VISUAL_DEFAULT_SETTINGS = $.extend(true, {}, LineUp_1.LineUp.DEFAULT_SETTINGS, {
        presentation: {
            columnColors: function (idx) {
                return colors[idx % colors.length];
            }
        },
        experimental: {
            serverSideSorting: false,
            serverSideFiltering: false
        }
    });
    /**
     * The set of capabilities for the visual
     */
    LineUpVisual.capabilities = {
        dataRoles: [{
                name: 'Values',
                kind: VisualDataRoleKind.Grouping
            }],
        dataViewMappings: [{
                table: {
                    rows: {
                        for: { in: 'Values' },
                        dataReductionAlgorithm: { window: { count: 100 } }
                    },
                    rowCount: { preferred: { min: 1 } }
                }
            }],
        objects: {
            general: {
                displayName: powerbi.data.createDisplayNameGetter('Visual_General'),
                properties: {
                    // formatString: {
                    //     type: {
                    //         formatting: {
                    //             formatString: true
                    //         }
                    //     },
                    // },
                    // selected: {
                    //     type: { bool: true }
                    // },
                    filter: {
                        type: { filter: {} },
                        rule: {
                            output: {
                                property: 'selected',
                                selector: ['Values'],
                            }
                        }
                    },
                },
            },
            layout: {
                displayName: "Layout",
                properties: {
                    // formatString: {
                    //     type: {
                    //         formatting: {
                    //             formatString: true
                    //         }
                    //     },
                    // },
                    // selected: {
                    //     type: { bool: true }
                    // },
                    layout: {
                        displayName: "JSON Configuration",
                        type: { text: {} }
                    }
                }
            },
            selection: {
                displayName: "Selection",
                properties: {
                    singleSelect: {
                        displayName: "Single Select",
                        description: "If true, when a row is selected, other data is filtered",
                        type: { bool: true }
                    },
                    multiSelect: {
                        displayName: "Multi Select",
                        description: "If true, multiple rows can be selected",
                        type: { bool: true }
                    }
                }
            },
            presentation: {
                displayName: "Presentation",
                properties: {
                    stacked: {
                        displayName: "Stacked",
                        description: "If true, when columns are combined, the all columns will be displayed stacked",
                        type: { bool: true }
                    },
                    values: {
                        displayName: "Values",
                        description: "If the actual values should be displayed under the bars",
                        type: { bool: true }
                    },
                    histograms: {
                        displayName: "Histograms",
                        description: "Show histograms in the column headers",
                        type: { bool: true }
                    },
                    animation: {
                        displayName: "Animation",
                        description: "Should the grid be animated when sorting",
                        type: { bool: true }
                    },
                    tooltips: {
                        displayName: "Table tooltips",
                        description: "Should the grid show tooltips on hover of a row",
                        type: { bool: true }
                    }
                },
            },
            experimental: {
                displayName: "Experimental",
                properties: {
                    serverSideSorting: {
                        displayName: "Server Side Sorting",
                        description: "If true, lineup will use PowerBI services to sort the data, rather than doing it client side",
                        type: { bool: true }
                    } /*,
                    serverSideFiltering: {
                        displayName: "Server Side Filtering",
                        description: "If true, lineup will use PowerBI services to filter the data, rather than doing it client side",
                        type: { bool: true }
                    }*/
                }
            }
        },
        sorting: {
            custom: {}
        }
    };
    LineUpVisual = __decorate([
        Utils_1.Visual(require("./build.js").output.PowerBI)
    ], LineUpVisual);
    return LineUpVisual;
}(VisualBase_1.VisualBase));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LineUpVisual;
/**
 * The data provider for our lineup instance
 */
var MyDataProvider = (function (_super) {
    __extends(MyDataProvider, _super);
    function MyDataProvider(data, hasMoreData, onLoadMoreData, onSorted, onFiltered) {
        _super.call(this, data);
        this.sortChanged = false;
        this.filterChanged = false;
        this.onLoadMoreData = onLoadMoreData;
        this.onSorted = onSorted;
        this.onFiltered = onFiltered;
        this.hasMoreData = hasMoreData;
    }
    /**
     * Determines if the dataset can be queried again
     */
    MyDataProvider.prototype.canQuery = function (options) {
        // We are either loading our initial set, which of course you can query it, otherwise, see if there is more data available
        var canLoad = options.offset === 0 || this.hasMoreData();
        return new Promise(function (resolve) { return resolve(canLoad); });
    };
    /**
     * Runs a query against the server
     */
    MyDataProvider.prototype.query = function (options) {
        // If the sort/filter changes, don't do anything, allow our users to respond
        if (options.offset > 0 || this.sortChanged || this.filterChanged) {
            if (this.onLoadMoreData && options.offset > 0) {
                this.onLoadMoreData();
            }
            this.sortChanged = false;
            this.filterChanged = false;
            return new Promise(function (resolve) {
                // Leave those guys hanging
            });
        }
        return _super.prototype.query.call(this, options);
    };
    ;
    /**
     * Called when the data should be sorted
     */
    MyDataProvider.prototype.sort = function (sort) {
        this.sortChanged = this.onSorted(sort);
    };
    /**
     * Called when the data is filtered
     */
    MyDataProvider.prototype.filter = function (filter) {
        this.filterChanged = this.onFiltered(filter);
    };
    return MyDataProvider;
}(JSONDataProvider_1.JSONDataProvider));