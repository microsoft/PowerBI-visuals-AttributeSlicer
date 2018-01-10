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

import { SlicerItem, IAttributeSlicerState } from './interfaces';
import * as _ from 'lodash';

/**
 * Pretty prints a value
 */
export function prettyPrintValue(val: any) {
  'use strict';
  // Date check
  if (val && val.toISOString) {
    const dateVal = <Date>val;
    return (
      dateVal.getMonth() +
      1 +
      '/' +
      dateVal.getDate() +
      '/' +
      dateVal.getFullYear() +
      ' ' +
      dateVal.getHours() +
      ':' +
      dateVal.getMinutes() +
      (dateVal.getHours() >= 12 ? 'PM' : 'AM')
    );
  }
  return /* tslint:disable */ val === null /* tslint:enable */ ||
    val === undefined
    ? ''
    : val + '';
}

/**
 * A utility method to create a slicer item
 */
export function createItem(
  category: string,
  value: any,
  id: string,
  renderedValue?: any,
  color = '',
): SlicerItem {
  'use strict';
  return {
    id,
    match: category,
    color,
    value: value || 0,
    renderedValue,
    equals: (b: SlicerItem) => id === b.id,
  };
}

const OMITTED_EQUALITY_PROPS = ['selectedItems', 'searchText'];

/**
 * Returns true if the two given states are equal
 */
export function isStateEqual(
  state: IAttributeSlicerState,
  stateTwo: IAttributeSlicerState,
) {
  'use strict';
  // TODO: Cheat
  const s1 = state && state['toJSONObject'] ? state['toJSONObject']() : state;
  const s2 =
    stateTwo && stateTwo['toJSONObject']
      ? stateTwo['toJSONObject']()
      : stateTwo;
  return (
    _.isEqual(s1 && s1.searchText, s2 && s2.searchText) &&
    _.isEqual(
      _.omit(s1, OMITTED_EQUALITY_PROPS),
      _.omit(s2, OMITTED_EQUALITY_PROPS),
    ) &&
    areItemsEqual(s1 && s1.selectedItems, s2 && s2.selectedItems)
  );
}

/**
 * Returns true if the given sets of items are not equal
 */
function areItemsEqual(items1: { id: string }[], items2: { id: string }[]) {
  'use strict';
  if (items1 === items2) {
    return true;
  }
  if (items1 && items2 && items1.length === items2.length) {
    return items1.filter((n, i) => n.id !== items2[i].id).length === 0;
  }
  return false;
}
