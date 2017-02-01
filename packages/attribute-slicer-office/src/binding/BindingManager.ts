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
import { findCandidateTables, getDataFromBinding, asyncWrapper, assessTableSuitability, getTableForBinding } from "./utils";
import * as debug from "debug";
const log = debug("EssexOffice::ExcelBindingManager");

/**
 * Manages Excel bindings for the user of this class
 */
export class ExcelBindingManager {

    /**
     * Provides a namespace for all of the bindings that this manages
     */
    private bindingNamespace = "EssexOffice";

    /**
     * Gets called when a bindings data has changed
     */
    private onDataChanged?: () => void;

    /**
     * The list of bindings that this binding manager is managing
     */
    private bindingInfo: {
        binding: Office.Binding,
        columnIndexes: IRequirementColumnIndexMappings,
        dataListener?: any
    }[] = [];

    /**
     * The data requirements of the consumer
     */
    private dataRequirements: IDataRequirements;

    /**
     * Constructor for the binding manager
     * @param namespace The namespace to use when creating bindings
     * @param onDataChanged Gets called when a bindings data has changed
     */
    constructor(namespace: string, dataRequirements: IDataRequirements, onDataChanged?: () => void) {
        this.bindingNamespace = namespace;
        this.onDataChanged = onDataChanged;
        this.dataRequirements = dataRequirements;
    }

    /**
     * Attempt to auto bind to the worksheets using various methods of binding
     * @param dataRequirements The required data to be able to bind properly
     */
    public async autoBind() {
        this.clearBindings();

        const bindingInfo =
            await this.restoreBinding() || // Try to restore the previous binding first
            await this.bestGuessBinding() || // Then try to guess the best match
            await this.wizardBinding(); // Fall back to showing a wizard
        if (bindingInfo) {
            return this.getData();
        }
    }

    /**
     * Attempts to restore a previously saved binding that the user had saved
     */
    public async restoreBinding() {
    }

    /**
     * Attempts to bind to a best guess table that matches our data requirements
     * @param dataRequirements The required data to be able to bind properly
     */
    public async bestGuessBinding() {
        // We can only have one binding at a time
        this.clearBindings();

        // Try the first one for now
        const oDoc = Office.context.document;
        const candidates = await findCandidateTables(this.dataRequirements);
        if (candidates && candidates.length) {
            const candidate = candidates[0];
            const binding = await this.bindToTable(candidate.table, candidate.columnIndexes, Office.BindingType.Table);
            return {
                binding,
                columnIndexes: candidate.columnIndexes,
            };
        }
    }

    /**
     * Attempts to bind to a dataset via a wizard shown the the user
     */
    public async wizardBinding() {

        // We can only have one binding at a time
        this.clearBindings();

    }

    /**
     * Adds a binding to the specific table
     * @param table The table to add
     * @param bindingType The type of binding to create
     */
    public async bindToTable(
        table: Excel.Table,
        columnIndexes: IRequirementColumnIndexMappings,
        bindingType: Office.BindingType,
    ) {
        // We can only have one binding at a time
        this.clearBindings();

        const oDoc = Office.context.document;
        const tableName = table.name;
        const bindingName = `${this.bindingNamespace}.${tableName}`;
        const binding = await asyncWrapper(oDoc.bindings.addFromNamedItemAsync)(tableName, bindingType, {
            id: bindingName
        }) as any as Office.Binding;
        const bindingInfo = {
            binding,
            columnIndexes,
        } as any;

        // Check for data changes, see if it still meets the data requirements, if it doesn't, then remove it
        const that = this;
        bindingInfo.dataListener = async function () {
            log("dataListener");
            try {
                // Important! Using the `table` param here might not work, cause it seems to be
                // a cached version of the original table that we were bound to, so if a column is removed from the table
                // it will still show up under `table.columns`.
                const updatedTable = await getTableForBinding(binding);
                const suitability = await assessTableSuitability(updatedTable, that.dataRequirements);

                // If the table is no longer suitable, then remove the binding
                if (!suitability.valid) {
                    that.removeBinding(binding);
                } else {
                    // Reset the column indexes
                    bindingInfo.columnIndexes = suitability.columnIndexes;
                }

                // Let our listeners know that something has changed
                if (that.onDataChanged) {
                    that.onDataChanged();
                }
            } catch (e) {
                log("Error: ", e);
            }
        };

        binding.addHandlerAsync(Office.EventType.BindingDataChanged, bindingInfo.dataListener);
        this.bindingInfo.push(bindingInfo);
        return binding;
    }

    /**
     * Clears all of the current bindings
     */
    public clearBindings() {
        const oDoc = Office.context.document;
        this.bindingInfo.forEach((n, i) => {
            this.removeBinding(n.binding);
        });
        this.bindingInfo.length = 0;
    }

    /**
     * Gets the data from the current bindings
     */
    public async getData() {
        if (this.bindingInfo.length) {
            const { binding, columnIndexes } = this.bindingInfo[0];
            const data = await getDataFromBinding(binding);
            const columns = data.headers[0];
            const rows = data.rows;
            return {
                data,
                columnIndexes,
                columns,
                rows,
                bindings: [binding]
            };
        }
    }

    /**
     * Removes the given binding from the managers managment
     * @param binding The binding to remove
     */
    public removeBinding(binding: Office.Binding) {
        const oDoc = Office.context.document;
        for (var i = 0; i < this.bindingInfo.length; i++) {
            const bi = this.bindingInfo[i];
            if (bi.binding === binding) {
                this.bindingInfo.splice(i, 1);
                if (bi.dataListener) {
                    bi.binding.removeHandlerAsync(Office.EventType.BindingDataChanged, bi.dataListener);
                }
                oDoc.bindings.releaseByIdAsync(bi.binding.id);
            }
        }
    }
}
