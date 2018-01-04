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

import "./powerbi";
import {
    setting,
    boolSetting as bool,
    numberSetting as number,
    textSetting as text,
    HasSettings,
    ColoredObjectsSettings,
    coloredObjectsSettings,
    colorSetting as color,
} from "@essex/visual-settings";
import { type } from "../powerbi-visuals-utils";
import { IAttributeSlicerState, ListItem } from "./interfaces";
import { dataSupportsColorizedInstances } from "./dataConversion";
import { DEFAULT_STATE } from "@essex/attribute-slicer";

const ldget = require("lodash/get"); // tslint:disable-line

// Webpack defines this
declare var BUILD_VERSION: string;

/**
 * The set of settings loaded from powerbi
 */
export default class AttributeSlicerVisualState extends HasSettings implements IAttributeSlicerState {

    /**
     * The currently selected search text
     */
    @setting({
        name: "searchText",
        enumerable: false,
        parse(value, desc, dv) {
            const searchText: any = ldget(dv, "metadata.objects.general.searchText");
            if (!searchText) {
                // TODO: Remove this after a few release cycles, this is purely for legacy support
                const selfFilter: any = ldget(dv, "metadata.objects.general.selfFilter");
                if (selfFilter) {
                    const right = ldget(selfFilter.where(), "[0].condition.right");
                    return (right && right.value) || "";
                }
            }
            return searchText || "";
        },
    })
    public searchText?: string;

    /**
     * The list of selected items
     */
    @setting({
        name: "selection",
        displayName: "Selection",
        enumerable: false,
        config: {
            type: { text: {} },
        },
        parse: (v, d, dv) => parseSelectionFromPBI(dv),
        compose: (value, d) => convertSelectionToPBI(value),
    })
    public selectedItems?: {
        id: any;
        match: any;
        value: any;
        renderedValue?: any;
    }[];

    /**
     * Whether or not the slicer should show the values column
     */
    @setting({
        readOnly: true,
        parse: (v, d, dv) => ldget(dv, "categorical.values", []).length > 0,
        defaultValue: DEFAULT_STATE.showValues,
    })
    public showValues?: boolean;

    /**
     * Whether or not data supports search
     */
    @setting({
        readOnly: true,
        parse(v, d, dv) {
            const isSelfFilterEnabled = ldget(dv, "metadata.objects.general.selfFilterEnabled", false);
            return doesDataSupportSearch(dv) && !isSelfFilterEnabled;
        },
    })
    public searchSupported?: boolean;

    /**
     * If we are being rendered horizontally
     */
    @setting({
        persist: false,
        category: "Display",
        displayName: "Horizontal",
        description: "Display the attributes horizontally, rather than vertically",
        defaultValue: DEFAULT_STATE.horizontal,
    })
    public horizontal?: boolean;

    /**
     * The percentage based width of the value column 0 = hidden, 100 = whole screen
     */
    @setting({
        persist: false,
        category: "Display",
        displayName: "Value Width %",
        description: "The percentage of the width that the value column should take up.",
        defaultValue: DEFAULT_STATE.valueColumnWidth,
    })
    public valueColumnWidth?: number;


    /**
     * Hide Blank items
     */
    @bool({
        persist: false,
        category: "Display",
        displayName: "Hide Empty Items",
        description: "Hide empty / blank Items.",
        defaultValue: false,
    })
    public hideEmptyItems?: boolean;

    /**
     * The text size in pt
     */
    @setting({
        persist: false,
        displayName: "Text Size",
        description: "The size of the text",
        defaultValue: DEFAULT_STATE.textSize,
        parse: val => val ? type.PixelConverter.fromPointToPixel(parseFloat(val)) : DEFAULT_STATE.textSize,
        compose: val => type.PixelConverter.toPoint(val ? val : DEFAULT_STATE.textSize),
    })
    public textSize?: number;

   /**
    * The font color used to display item text
    */
   @color({
        persist: false,
        displayName: "Text Color",
        description: "Item text color.",
        defaultValue: DEFAULT_STATE.itemTextColor,
    })
    public itemTextColor?: string;

    /**
     * If we should left align the text
     */
     @setting({
        persist: false,
        displayName: "Text Align Left",
        description: "On to left align item text.",
        defaultValue: DEFAULT_STATE.leftAlignText,
    })
    public leftAlignText?: boolean;

    /**
     * If we should show the options area
     */
    @setting({
        persist: false,
        displayName: "Show options",
        description: "Should the search box and other options be shown.",
        defaultValue: DEFAULT_STATE.showOptions,
    })
    public showOptions?: boolean;

    /**
     * If we should show the search box
     */
    @setting({
        persist: false,
        displayName: "Show Search",
        description: "Show the search box.",
        defaultValue: DEFAULT_STATE.showSearch,
    })
    public showSearch?: boolean;

    /**
     * The display units to use when rendering values
     */
    @setting({
        persist: false,
        category: "Display",
        displayName: "Units",
        description: "The units to use when displaying values.",
        defaultValue: 0,
        config: {
            type: {
                formatting: {
                    labelDisplayUnits: true,
                },
            },
        },
    })
    public labelDisplayUnits?: number;

    /**
     * The precision of the numbers to render
     */
    @number({
        persist: false,
        category: "Display",
        displayName: "Precision",
        description: "The precision to use when displaying values.",
        defaultValue: 0,
    })
    public labelPrecision?: number;

    /**
     * If we should single select
     */
    @setting({
        persist: false,
        category: "Selection",
        displayName: "Single Select",
        description: "Only allow for one item to be selected at a time",
        defaultValue: DEFAULT_STATE.singleSelect,
    })
    public singleSelect?: boolean;

    /**
     * If brushMode is enabled
     */
    @setting({
        persist: false,
        category: "Selection",
        displayName: "Brush Mode",
        description: "Allow for the drag selecting of attributes",
        defaultValue: DEFAULT_STATE.brushMode,
    })
    public brushMode?: boolean;

    /**
     * If we should show the tokens
     */
    @setting({
        persist: false,
        category: "Selection",
        displayName: "Use Tokens",
        description: "Will show the selected attributes as tokens",
        defaultValue: DEFAULT_STATE.showSelections,
    })
    public showSelections?: boolean;

    /**
     * If the value displays should be always shown
     */
    @setting({
        persist: false,
        category: "Display",
        displayName: "Always On Values",
        description: "Display value labels.",
        defaultValue: DEFAULT_STATE.displayValueLabels,
    })
    public displayValueLabels?: boolean;

    /**
     * If the value text overflow should be visible
     */
    @setting({
        persist: false,
        category: "Display",
        displayName: "Overflow value text",
        description: "Allow value text to overflow the bar.",
        defaultValue: DEFAULT_STATE.overflowValueLabels,
    })
    public overflowValueLabels?: boolean;

    /**
     * The set of settings for the colored objects
     */
    @coloredObjectsSettings({
        persist: false,
        category: "Data Point",
        enumerable: (s, dv) => dataSupportsColorizedInstances(dv),
    })
    public colors: ColoredObjectsSettings;

    /**
     * If we are being rendered horizontally
     */
    @text({
        persist: false,
        category: "General",
        displayName: "Version",
        description: "The version of Attribute Slicer",
        compose: () => BUILD_VERSION,
    })
    public version?: string;

    /**
     * The scroll position of the visual
     */
    public scrollPosition: [number, number] = [0, 0];

    /**
     * Receives the new properties
     * @param newProps The properties to merge into state
     */
    public receive(newProps?: any): this {
        throw new Error("Not implemented");
    }
}

/**
 * Calculates whether or not the dataset supports search
 */
function doesDataSupportSearch(dv: powerbi.DataView) {
    "use strict";
    const source = ldget(dv, "categorical.categories[0].source");
    const metadataCols = ldget(dv, "metadata.columns");
    const metadataSource = metadataCols && metadataCols.filter((n: any) => n.roles && n.roles["Category"])[0];
    if (source && metadataSource) {
        return source && metadataSource && metadataSource.type.text && source.type.text;
    }
    return false;
}

/**
 * Loads the selection from PowerBI
 */
function parseSelectionFromPBI(dataView: powerbi.DataView): ListItem[] {
    "use strict";
    const objects = ldget(dataView, "metadata.objects");
    if (objects) {
        const selectedItems = ldget(objects, "general.selection");
        return selectedItems ? JSON.parse(selectedItems) : [];
    } else if (dataView) { // If we have a dataview, but we don't have any selection, then clear it
        return [];
    }
}

/**
 * Converts the given items into a format for PBI
 */
function convertSelectionToPBI(value: ListItem[]) {
    "use strict";
    if (value) {
        return JSON.stringify((value || []).map((n) => ({
            id: n.id,
            match: n.match,
            value: n.value,
            renderedValue: n.renderedValue,
        })));
    }
}

/**
 * Changes all nulls to undefined in an object graph
 * * Temporary *
 * @param obj The object to change null to undefined
 */
function nullToUndefined(obj: object) {
    "use strict";
    if (obj) {
        Object.keys(obj).forEach(key => {
            const val = obj[key];
            // Array
            if (val && val.forEach) {
                val.forEach(nullToUndefined);
            // pojo
            } else if (val === null) { // tslint:disable-line
                obj[key] = undefined;
            } else if (typeof val === "object") {
                nullToUndefined(val);
            }
        });
    }
}
