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

import { IAttributeSlicerState, ISlicerItem } from "./interfaces";
import lodashIsequal from "lodash.isequal";
import lodashOmit from "lodash.omit";
import { Selection } from "d3-selection";

/**
 * Pretty prints a value
 */
export function prettyPrintValue(val: unknown): string {
	// Date check
	if (val && (<Date>val).toISOString) {
		const dateVal: Date = <Date>val;
		const month: number = dateVal.getMonth();
		const date: number = dateVal.getDate();
		const year: number = dateVal.getFullYear();
		const hours: number = dateVal.getHours();
		const minutes: number = dateVal.getMinutes();
		const amPm: string = hours >= 12 ? "PM" : "AM";

		return `${month + 1}/${date}/${year} ${hours}:${minutes}${amPm}`;
	}

	return val === null || val === undefined ? "" : `${val}`;
}

/**
 * A utility method to create a slicer item
 */
export function createItem(
	category: string,
	value: undefined | null | string | number | Date,
	id: string,
	renderedValue?: number | string,
	color: string = "",
): ISlicerItem {
	return {
		id,
		text: category,
		color,
		value: value || 0,
		renderedValue,
	};
}

const OMITTED_EQUALITY_PROPS: string[] = ["selectedItems", "searchText"];

/**
 * Returns true if the two given states are equal
 */
export function isStateEqual(
	state: IAttributeSlicerState,
	stateTwo: IAttributeSlicerState,
): boolean {
	const s1: IAttributeSlicerState =
		state && state.toJSONObject ? state.toJSONObject() : state;
	const s2: IAttributeSlicerState =
		stateTwo && stateTwo.toJSONObject ? stateTwo.toJSONObject() : stateTwo;

	return (
		lodashIsequal(s1 && s1.searchText, s2 && s2.searchText) &&
		lodashIsequal(
			lodashOmit(s1, OMITTED_EQUALITY_PROPS),
			lodashOmit(s2, OMITTED_EQUALITY_PROPS),
		) &&
		areItemsEqual(s1 && s1.selectedItems, s2 && s2.selectedItems)
	);
}

/**
 * Returns true if the given sets of items are not equal
 */
function areItemsEqual(
	items1: { id: string }[],
	items2: { id: string }[],
): boolean {
	if (items1 === items2) {
		return true;
	}

	if (items1 && items2 && items1.length === items2.length) {
		return (
			items1.filter((n: { id: string }, i: number) => n.id !== items2[i].id)
				.length === 0
		);
	}

	return false;
}

// /**
//  * Creates a fluent dom interface
//  */
// export function fluentDom(root?: HTMLElement|string) {
// 	let rootEle: HTMLElement
// 	if (root) {
// 		if ((<HTMLElement>root).setAttribute) {
// 			rootEle = <HTMLElement>root
// 		} else {
// 			rootEle = document.createElement(`${root}`)
// 		}
// 	} else {
// 		rootEle = document.createElement('div')
// 	}
// 	const builder = {
// 		append(...eles: HTMLElement[]) {
// 			eles.forEach(ele => rootEle.appendChild(ele))
// 			return builder
// 		},
// 		attr(name: string, value: string) {
// 			rootEle.setAttribute(name, value)
// 			return builder
// 		},
// 		text(text: any) {
// 			rootEle.appendChild(document.createTextNode(text))
// 			return builder
// 		},
// 		css(props: any) {
// 			Object.keys(props || {}).forEach((propName) => {
// 				rootEle.style[propName] = props[propName]
// 			})
// 			return builder
// 		},
// 		find(selector: string) {
// 			return fluentDom(<HTMLElement>rootEle.querySelector(selector))
// 		},
// 		parent() {
// 			return fluentDom(rootEle.parentElement)
// 		},
// 		node() {
// 			return rootEle
// 		}
// 	}
// 	return builder
// }

/**
 * Quick HTML template function
 */
export function html(str: TemplateStringsArray, arg?: string) {
	const container = document.createElement("div");

	if (arg && str[0].trim().length > 0) {
		// this handles the case where the user does
		// html`<div>${value}</div>`
		// but allows html`${value}`
		throw new Error("HTML strings should not inject variables");
	}

	// They can only use this function if they don't dynamically construct the html string
	// tslint:disable-next-line:no-inner-html
	container.innerHTML = (str[0] + (arg || "")).trim().replace(/\n/g, "");
	return <HTMLElement>container.firstChild;
}

/**
 * Toggles the given element visibility
 */
export function toggleElement(
	element: Selection<HTMLElement, any, any, any>,
	toggled?: boolean,
) {
	const currentDisplay = element.style("display") || "";
	if (toggled === undefined) {
		const isVisible = currentDisplay && currentDisplay !== "none";
		toggled = !isVisible;
	}

	element.style("display", toggled ? null : "none");
	if (toggled || (toggled === undefined && currentDisplay !== undefined)) {
		element.style("display", null);
	} else {
		element.style("display", "none");
	}
}
