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

import { SlicerItem } from "../interfaces";
import SelectableDataPoint = powerbi.visuals.SelectableDataPoint;
import TooltipEnabledDataPoint = powerbi.visuals.TooltipEnabledDataPoint;

/**
 * Represents a list item
 */
/* tslint:disable */
export interface ListItem extends SlicerItem, SelectableDataPoint, TooltipEnabledDataPoint { }

/**
 * The settings that are in one way or another stored in powerbi
 */
export interface ISettings {
    labelDisplayUnits: number;
    labelPrecision: number;
    singleSelect: boolean;
    brushSelectionMode: boolean;
    showSelections: boolean;
    showOptions: boolean;
    valueWidthPercentage: number;
    renderHorizontal: boolean;
    textSize: number;
    searchString: string;
}

/**
 * Represents slicer data
 */
export interface ISlicerVisualData {
    /**
     * The actual dataset
     */
    data: SlicerItem[];

    /**
     * Metadata which describes the data
     */
    metadata: { 
        /**
         * The name of the category column
         */
        categoryColumnName: string;

        /**
         * Whether or not there is even categories
         */
        hasCategories: boolean;
    };
};

export type SlicerItem = SlicerItem;
