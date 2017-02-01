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

import { IDataRequirements, IRequirementColumnIndexMappings } from "./models";

/**
 * Finds tables that can potentially be used as a data source for the attribute slicer
 */
export async function findCandidateTables(dataRequirements: IDataRequirements) {
    const tables = await getActiveTables();
    const mappedTables = await Promise.all(tables.map(async function (table) {
        return assessTableSuitability(table, dataRequirements);
    }));
    return mappedTables
        .filter(n => n.valid) // Remove invalid tables
        .sort((a, b) => a.quality - b.quality); // Sort it by the quality of the matches
}

/**
 * Calculates the suitability of the given table meeting the given data requirements
 * @param table The table to check
 * @param dataRequirements The data requirements to use the validate the table
 */
export async function assessTableSuitability(table: Excel.Table, dataRequirements: IDataRequirements) {
    const columns = await getTableColumns(table);
    const colInfo = {
        table,
        valid: false,
        quality: 0,
        columnIndexes: {} as IRequirementColumnIndexMappings,
    };
    const matches =
        dataRequirements.fields.map(requirement => {
            const matches = columns.map((column, idx) => {
                const match = requirement.isMatch(column.name, table, column, idx);
                return {
                    quality: match && match.quality,
                    requirement,
                    idx,
                };
            })
            .filter(n => !!n.quality)

            // Sort by the quality of the column for the requirement
            .sort((a, b) => a.quality - b.quality)

            // Get the best quality column for the job
            .reverse();

            const matching = matches[0];
            if (matching) {
                colInfo.columnIndexes[matching.requirement.name] = matching.idx;
                colInfo.quality++;
            }
        });

    // It is valid if we have a column for all *required* columns
    colInfo.valid = dataRequirements.fields.every(n => !n.required || colInfo.columnIndexes.hasOwnProperty(n.name));
    return colInfo;
}

/**
 * Returns the tables on the current sheet
 */
export async function getActiveTables() {
    return new Promise<Excel.Table[]>((resolve, reject) => {
        // If excel is defined, then we're good
        if (window["Excel"]) {
            Excel.run(async function(ctx) {
                const activeSheet = ctx.workbook.worksheets.getActiveWorksheet();
                const tables = activeSheet.tables;
                tables.load("name");
                activeSheet.load("name");
                tables.load("items");

                // Let excel load the name properties
                await sync(ctx);

                resolve(tables.items);
            })
            .catch(reject);
        } else {
            reject("Not running in Excel!");
        }
    });
}

/**
 * Retrieves the columns for the given table
 * @param table The table to get the columns for
 */
export async function getTableColumns(table: Excel.Table) {
    return new Promise<Excel.TableColumn[]>((resolve, reject) => {
        // If excel is defined, then we're good
        if (window["Excel"]) {
            Excel.run(async function(ctx) {
                table.columns.load("items");
                await sync(ctx);
                table.columns.items.forEach(async function(col) {
                    col.load("name");
                    col.load("index");
                });
                await sync(ctx);
                resolve(table.columns.items);
            })
            .catch(reject);
        } else {
            reject("Not running in Excel!");
        }
    });
}

/**
 * Retrieves the table for the given binding
 * @param binding The binding to retrieve the table for
 */
export async function getTableForBinding(binding: Office.Binding) {
    return new Promise<Excel.Table>((resolve, reject) => {
        if (window["Excel"]) {
            Excel.run(async function (ctx) {
                const excelBinding = ctx.workbook.bindings.getItem(binding.id);
                const table = excelBinding.getTable();
                table.load("name");
                table.load("columns");

                await sync(ctx);
                await getTableColumns(table); // Lets load the columns for this table

                resolve(table);
            })
            .catch(reject);
        } else {
            reject("Not running in Excel!");
        }
    });
}

/**
 * Wraps the RequestContext sync call with an actual promise.
 * @param ctx The context to wrap
 */
export async function sync(ctx: Excel.RequestContext) {
    return new Promise((res, rej) => {
        ctx.sync().then(function() {
            setTimeout(res, 100); // Why is this silly delay necessary
        }).catch(rej);
    });
}

/**
 * Gets the data from the given office binding
 * @param binding the binding to get the data from
 */
export async function getDataFromBinding(binding: Office.Binding) {
    const data = await asyncWrapper(binding.getDataAsync)({
        valueFormat: Office.ValueFormat.Unformatted,
        filterType: Office.FilterType.OnlyVisible
    }) as any;
    return data;
}

/**
 * Provides a quick wrapper around Office calls that expect a callback that expects a Office.AsyncResult
 * @param toWrap A function that has the last parameter as a callback
 */
export function asyncWrapper<T extends Function>(toWrap: T): T {
    return <any>async function(...args: any[]) {
        return new Promise<any>((resolve, reject) => {
            toWrap.apply(this, args.concat([function(result: any) {
                if (result.error) {
                    reject(result.error);
                } else {
                    resolve(result.value);
                }
            }]));
        });
    };
}
