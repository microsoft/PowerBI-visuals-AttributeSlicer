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
	IAttributeSlicerState,
	ISlicerItem,
	ISlicerValueSegment,
} from "@essex/attribute-slicer";

import powerbiVisualsApi from "powerbi-visuals-api";

export type ListItem = ISlicerItem;

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
	identity: powerbiVisualsApi.visuals.ISelectionId;

	/**
	 * The segment color
	 */
	color: string;
}
export type ISlicerItem = ISlicerItem;
export type IAttributeSlicerState = IAttributeSlicerState;
export type ISlicerValueSegment = ISlicerValueSegment;

/**
 * A set of modes used to indicate how an object should be colored
 */
export enum ColorMode {
	/**
	 * Gradient coloring should be used
	 */
	Gradient,

	/**
	 * Instance specific coloring should be used
	 */
	Instance,
}

/**
 * Represents a expression that has been serialized.
 */
export interface ISerializedExpr {
	serializedExpr: any;
}

/**
 * Indicates that a given object has a unique identity
 */
export interface HasIdentity {
	/**
	 * The identity of this object
	 */
	identity?: powerbiVisualsApi.visuals.ISelectionId;
}

/**
 * Represents an object that that has both a color and an identity.
 */
export interface IColoredObject extends HasIdentity {
	/**
	 * The name of the colored object
	 */
	name: string;

	/**
	 * The color of the object
	 */
	color: string;
}

/**
 * Interface represents the color related settings
 */
export interface IColorSettings {
	/**
	 * The mode of colorization
	 */
	colorMode: ColorMode;

	/**
	 * The gradient to use
	 */
	gradient: IGradient;

	/**
	 * The specific colors
	 */
	instanceColors: IColoredObject[];

	/**
	 * If true, the order of the bars will be reversed
	 */
	reverseOrder: boolean | undefined;

	/**
	 * Determines if this color settings is equal to another
	 */
	equals(other: IColorSettings): boolean;
}

/**
 * Contains all of the info necessary to create a gradient
 */
export interface IGradient {
	/**
	 * The start color for the gradient
	 */
	startColor: string | undefined;

	/**
	 * The end color of the gradient
	 */
	endColor: string | undefined;

	/**
	 * The start value of the gradient
	 */
	startValue: any;

	/**
	 * The end value of the gradient
	 */
	endValue: any;
}

/**
 * An item that has value segments
 */
export interface ItemWithValueSegments {
	/**
	 * The unique identifier for this item
	 */
	id: string;

	/**
	 * The name of the item
	 */
	match: any;

	/**
	 * The color of the item
	 */
	color?: string;

	/**
	 * The raw value of this item (the count of values in this item)
	 */
	value: any;

	/**
	 * Returns true if this == b
	 */
	equals: (b: ItemWithValueSegments) => boolean;

	/**
	 * The segments that make up this items value, the total of the widths must === 100
	 */
	valueSegments?: IValueSegment[];

	/**
	 * The percentage value that should be displayed (0 - 100)
	 */
	renderedValue?: number;
}

/**
 * An individual value segment
 */
export interface IValueSegment {
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
