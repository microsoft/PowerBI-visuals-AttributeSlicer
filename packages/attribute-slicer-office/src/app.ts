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

import * as $ from "jquery";
import * as debug from "debug";
import * as uuid from "node-uuid";
import { Bookkeeper, SettingsManager, ExcelBindingManager } from "@essex/office-core";
import dataRequirements from "./dataRequirements";
import AttributeSlicerOffice from "./AttributeSlicerOffice";
const log = debug("Essex::AttributeSlicerOffice::App");
const NAMESPACE = "attribute-slicer";

// The initialize function must be run each time a new page is loaded
Office.initialize = function (reason) {
    $(document).ready(async function () {
        log("Initialized");
        setTimeout(async function() {
            const settingsManager = new SettingsManager(NAMESPACE);
            let id = await settingsManager.get("componentId");
            if (!id) {
                id = uuid.v4();
                await settingsManager.set("componentId", id);
            }

            let bookKeeper: Bookkeeper;
            if (reason === Office.InitializationReason.Inserted) {
                await Excel.run(async ctx => {
                    const activeWS = ctx.workbook.worksheets.getActiveWorksheet();
                    activeWS.load("name");

                    await ctx.sync();

                    bookKeeper = new Bookkeeper(id, "Attribute Slicer", activeWS.name);
                    await bookKeeper.initialize();

                    return ctx.sync();
                });
            }
            const bindingManager = new ExcelBindingManager(NAMESPACE, dataRequirements, bookKeeper, settingsManager);

            new AttributeSlicerOffice($("#app"), settingsManager, bindingManager);
        }, 10);
    });
};
