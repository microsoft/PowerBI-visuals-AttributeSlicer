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

import { ColorMode } from "../../interfaces";

// This rule is disabled because DataViewObjectParser needs to see these properties
// If they aren't explicitly initialized, then they don't show up for DataViewObjectParser
// tslint:disable:no-unnecessary-field-initialization
export default class DataPoint {
	/**
	 * The mode of colorization to use
	 */
	public colorMode?: ColorMode = undefined;

	/**
	 * If the order of the bars should be reversed
	 */
	public reverseOrder?: boolean = undefined;

	/**
	 * The start color for the gradient
	 */
	public startColor?: string = undefined;

	/**
	 * The end color for the gradient
	 */
	public endColor?: string = undefined;

	/**
	 * The start value of the gradient
	 */
	public startValue?: number = undefined;

	/**
	 * The end value of the gradient
	 */
	public endValue?: number = undefined;
}
