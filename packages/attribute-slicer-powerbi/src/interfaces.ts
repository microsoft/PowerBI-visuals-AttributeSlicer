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

import { SlicerItem, IAttributeSlicerState, ISlicerValueSegment } from "@essex/attribute-slicer";
import TooltipEnabledDataPoint = powerbi.visuals.TooltipEnabledDataPoint;

/**
 * Represents a list item
 */
/* tslint:disable */
export interface ListItem extends SlicerItem, TooltipEnabledDataPoint {
    // The unique selector for this item
    selector: powerbi.data.Selector;
}

/**
 * Represents attribute slicer visual data
 */
export interface IAttributeSlicerVisualData {
    /**
     * The attribute slicer items
    */
    items: ListItem[];

    /**
     * The value segment info for each of the items values
     */
    segmentInfo: IAttributeSlicerSegmentInfo[];
}

/**
 * An interface describing the segments of value data coming into the attribute slicer
 */
export interface IAttributeSlicerSegmentInfo {
    /**
     * The name of the segment
     */
    name: string;

    /**
     * The unique identity of this segment
     */
    identity: powerbi.DataViewScopeIdentity;

    /**
     * The segment color
     */
    color: string
}
export type SlicerItem = SlicerItem;
export type IAttributeSlicerState = IAttributeSlicerState;
export type ISlicerValueSegment = ISlicerValueSegment;
