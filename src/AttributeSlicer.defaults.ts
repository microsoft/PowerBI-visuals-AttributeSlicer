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

import { IAttributeSlicerState } from "./interfaces";
/**
 * The number of milliseconds before running the search, after a user stops typing.
 */
export const SEARCH_DEBOUNCE = 500;

/**
 * The value column default width
 */
export const DEFAULT_VALUE_WIDTH = 66;

/**
 * The value default text size
 */
export const DEFAULT_TEXT_SIZE = 12;

/**
 * Gets a default state of the slicer
 */
export const DEFAULT_STATE: IAttributeSlicerState = {
    selectedItems: [],
    searchText: "",
    labelDisplayUnits: 0,
    labelPrecision: 0,
    horizontal: false,
    valueColumnWidth: DEFAULT_VALUE_WIDTH,
    showSelections: true,
    singleSelect: false,
    brushMode: false,
    textSize: DEFAULT_TEXT_SIZE,
    showOptions: true,
    showSearch: true,
    showValues: true,
};
