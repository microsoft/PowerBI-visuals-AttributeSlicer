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

/**
 * Represents an item in the slicer
 */
export interface SlicerItem {

    /**
     * The unique identifier for this item
     */
    id: string;

    /**
     * The actual match
     */
    match: any;

    matchPrefix?: any;
    matchSuffix?: any;

    /**
     * The color of the item
     */
    color?: string;

    /**
     * The raw value of this item
     */
    value: any;
    // selected: boolean;

    /**
     * Returns true if this == b
     */
    equals: (b: SlicerItem) => boolean;

    /**
     * Called when an item is created
     */
    onCreate?: (ele: JQuery) => void;

    /**
     * The segments that make up this items value, the total of the widths must === 100
     */
    valueSegments?: ISlicerValueSegment[];

    /**
     * The percentage value that should be displayed (0 - 100)
     * TODO: Better name, basically it is the value that should be displayed in the histogram
     */
    renderedValue?: number;
}

export interface ISlicerValueSegment {
    /**
     * The raw value of the segment
     */
    value: any;

    /**
     * The display value of the segment
     */
    displayValue: any;

    /**
     * The percentage width of this segment
     */
    width: number;

    /**
     * The percentage of the width which should be highlighted
     */
    highlightWidth?: number;

    /**
     * The color of this segment
     */
    color: string;
}

/**
 * Represents a serialized item
 */
export interface ISerializedItem {
    id: any;
    match: any;
    value: any;
    renderedValue?: any;
    selector: any;
}

/**
 * Represents the state of the attribute slicer
 */
export interface IAttributeSlicerState {
    /**
     * The currently selected search text
     */
    searchText?: string;

    /**
     * The list of selected items
     */
    selectedItems?: ISerializedItem[];

    /**
     * The text size in pt
     */
    textSize?: number;

    /**
     * The text color 
     */
    itemTextColor?: string;

    /**
     * If we should left align the text
     */
    leftAlignText?: boolean;

    /**
     * If we should show the options area
     */
    showOptions?: boolean;

    /**
     * If we should show the search box
     */
    showSearch?: boolean;

    /**
     * If we should show the values column
     */
    showValues?: boolean;

    /**
     * The percentage based width of the value column 0 = hidden, 100 = whole screen
     */
    valueColumnWidth?: number;

    /**
     * The display units to use when rendering values
     */
    labelDisplayUnits?: number;

    // TODO?: This are basically unused the the base slicer

    /**
     * The precision of the numbers to render
     */
    labelPrecision?: number;

    /**
     * If we are being rendered horizontally
     */
    horizontal?: boolean;

    /**
     * If we should single select
     */
    singleSelect?: boolean;

    /**
     * If brushMode is enabled
     */
    brushMode?: boolean;

    /**
     * If we should show the tokens
     */
    showSelections?: boolean;

    scrollPosition?: [number, number];

    /**
     * If we should always display values text
     */
    displayValueLabels?: boolean;

    /**
     * If we should allow value text to overflow and be visible
     */
    overflowValueLabels?: boolean;
}
