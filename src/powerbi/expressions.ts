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

import data = powerbi.data;

/**
 * Builds a self filter from the given search string
 */
export function buildSelfFilter(dataView: powerbi.DataView, searchText: string) {
    "use strict";
    let filterExpr: data.SQExpr;
    let filter: data.SemanticFilter;
    if (dataView) {
        const source = dataView.categorical.categories[0].source;
        const sourceType = source.type;
        // Only support "contains" with text columns
        // if (sourceType.extendedType === powerbi.ValueType.fromDescriptor({ text: true }).extendedType) {
        if (searchText) {
            if (sourceType.text) {
                let containsTextExpr = data.SQExprBuilder.text(searchText);
                filterExpr = data.SQExprBuilder.contains(<any>source["expr"], containsTextExpr);
            } else {
                let rightExpr: data.SQExpr;
                if (sourceType.numeric) {
                    rightExpr = data.SQExprBuilder.typedConstant(parseFloat(searchText), sourceType);
                } else if (sourceType.bool) {
                    rightExpr = data.SQExprBuilder.boolean(searchText === "1" || searchText === "true");
                }
                if (rightExpr) {
                    filterExpr = data.SQExprBuilder.equal(<any>source["expr"], rightExpr);
                }
            }
        }
        if (filterExpr) {
            filter = data.SemanticFilter.fromSQExpr(filterExpr);
        }
    }
    return filter;
}

/**
 * Builds a SQExpr from a serialized version of a selected item
 */
export function buildSQExprFromSerializedSelection(n: data.Selector) {
    "use strict";
    const firstItem = n.data[0] as powerbi.DataViewScopeIdentity;
    const compareExpr = (firstItem.expr || firstItem["_expr"]) as powerbi.data.SQCompareExpr;
    const left = compareExpr.left as powerbi.data.SQColumnRefExpr;
    const leftEntity = left.source as powerbi.data.SQEntityExpr;
    const right = compareExpr.right as powerbi.data.SQConstantExpr;

    // Create the OO version
    const newRight =
        new powerbi.data.SQConstantExpr(powerbi.ValueType.fromDescriptor(right.type), right.value, right.valueEncoded);
    const newLeftEntity = new powerbi.data.SQEntityExpr(leftEntity.schema, leftEntity.entity, leftEntity.variable);
    const newLeft = new powerbi.data.SQColumnRefExpr(newLeftEntity, left.ref);
    const newCompare = new powerbi.data.SQCompareExpr(compareExpr.comparison, newLeft, newRight);
    return newCompare;
}
