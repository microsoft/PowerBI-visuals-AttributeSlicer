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

import {
    ListItem,
    IAttributeSlicerState,
} from "./interfaces";
import createPersistObjectBuilder from "./persistence";
import { buildSelfFilter, buildSQExprFromSerializedSelection } from "./expressions";
import { createItem } from "./dataConversion";
import data = powerbi.data;
import SelectionId = powerbi.visuals.SelectionId;
import { DEFAULT_VALUE_WIDTH, DEFAULT_TEXT_SIZE } from "../AttributeSlicer.defaults";
import PixelConverter = jsCommon.PixelConverter;

/* tslint:disable */
const stringify = require("json-stringify-safe");
const ldget = require("lodash.get");
/* tslint:enable */

/**
 * Parses the settings that are stored in powerbi
 */
export function buildStateFromPowerBI(dataView: powerbi.DataView): IAttributeSlicerState {
    "use strict";
    const objects = dataView && dataView.metadata && dataView.metadata.objects;
    const selfFilter = ldget(objects, "general.selfFilter", undefined);
    const newSearch: data.SemanticFilter = selfFilter;
    const whereItems = newSearch && newSearch.where();
    const contains = whereItems && whereItems.length > 0 && whereItems[0].condition as data.SQContainsExpr;
    const right = contains && contains.right as data.SQConstantExpr;
    const ptTextSize = ldget(objects, "general.textSize", undefined);
    const state: IAttributeSlicerState = {
        settings: {
            display: {
                labelDisplayUnits: ldget(objects, "display.labelDisplayUnits", 0),
                labelPrecision: ldget(objects, "display.labelPrecision", 0),
                valueColumnWidth: ldget(objects, "display.valueColumnWidth", DEFAULT_VALUE_WIDTH),
                horizontal: ldget(objects, "display.horizontal", false),
            },
            general: {
                showOptions: ldget(objects, "general.showOptions", true),
                showSearch:
                    // If the data supports searching, and it is enabled through the PBI UI
                    doesDataSupportSearch(dataView) &&
                    !ldget(objects, "general.selfFilterEnabled", false),
                showValues: ldget(dataView, "categorical.values", []).length > 0,
                textSize: ptTextSize ? PixelConverter.fromPointToPixel(parseFloat(ptTextSize)) : DEFAULT_TEXT_SIZE,
            },
            selection: {
                singleSelect:  ldget(objects, "selection.singleSelect", false),
                brushMode: ldget(objects, "selection.brushMode", false),
                showSelections: ldget(objects, "selection.showSelections", true),
            },
        },
        searchText: (right && right.value) || "",
    };
    state.selectedItems = parseSelectionFromPBI(dataView) || [];
    return state;
}


/**
 * Loads the selection from PowerBI
 */
function parseSelectionFromPBI(dataView: powerbi.DataView) {
    "use strict";
    const objects = dataView && dataView.metadata && dataView.metadata.objects;
    if (objects) {
        // HAX: Stupid crap to restore selection
        let condition = ldget(objects, "general.filter.whereItems[0].condition");
        let values = ldget(condition, "values");
        let args = ldget(condition, "args");
        let selectedItems: any[] = [];
        if (values && args && values.length && args.length) {
            const selectionItems: ListItem[] = JSON.parse(ldget(objects, "general.selection"));
            let sourceExpr = args[0];
            const selectionIds = values.map((n: any) => {
                return SelectionId.createWithId(powerbi.data.createDataViewScopeIdentity(
                    powerbi.data.SQExprBuilder.compare(data.QueryComparisonKind.Equal,
                        sourceExpr,
                        n[0]
                    )
                ));
            });
            selectedItems = <ListItem[]>selectionIds.map((n: powerbi.visuals.SelectionId, i: number) => {
                const slimItem = selectionItems[i];
                const item =
                    createItem(slimItem.match, slimItem.value, (n.getKey ? n.getKey() : n["key"]), n.getSelector(), slimItem.renderedValue);
                return item;
            });
        }
        return selectedItems;
    } else if (dataView) { // If we have a dataview, but we don't have any selection, then clear it
        return [];
    }
}

/**
 * Calculates whether or not the dataset supports search
 */
function doesDataSupportSearch(dv: powerbi.DataView) {
    "use strict";
    const source = ldget(dv, "categorical.categories[0].source");
    const metadataCols = ldget(dv, "metadata.columns");
    const metadataSource = metadataCols && metadataCols.filter((n: any) => n.roles["Category"])[0];
    if (source && metadataSource) {
        return source && metadataSource && metadataSource.type.text && source.type.text;
    }
    return false;
}

/**
 * Builds the appropriate persist objects to persist the given state to PBI
 */
export function buildPersistObjectsFromState(dataView: powerbi.DataView, state: IAttributeSlicerState) {
    "use strict";
    let persistBuilder = createPersistObjectBuilder();

    Object.keys(state.settings).forEach(settingSection => {
        const section = state.settings[settingSection];
        Object.keys(section).forEach(prop => {
            let value = section[prop];
            if (prop === "textSize") {
                value = PixelConverter.toPoint(value);
            }
            persistBuilder.persist(settingSection, prop, value);
        });
    });

    const filter = buildSelectionFilter(state);
    let selection: any = undefined;
    if (filter) {
        selection = stringify(state.selectedItems.map(n => {
            return {
                match: n.match,
                value: n.value,
                renderedValue: n.renderedValue,
            };
        }));
    }

    persistBuilder
        .persist("general", "filter", filter)
        .persist("general", "selection", selection)
        .persist("general", "selfFilter", buildSelfFilter(dataView, state.searchText));

    return persistBuilder.build();
}

/**
 * Gets a selection filter based on the given slice state
 */
function buildSelectionFilter(state: IAttributeSlicerState) {
    "use strict";
    let filter: data.SemanticFilter;
    if (state.selectedItems && state.selectedItems.length) {
        filter = data.Selector.filterFromSelector(state.selectedItems.map(n => {
            const newCompare = buildSQExprFromSerializedSelection(n.selector);
            return {
                data: [{
                    expr: newCompare,
                    key: n.selector.data[0].key,
                }],
            };
        }));
    }
    return filter;
}
