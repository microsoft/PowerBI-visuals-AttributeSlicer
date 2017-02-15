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
const CSS_MODULE = require("@essex/attribute-slicer/src/css/AttributeSlicer.scss");
import dataRequirements from "./dataRequirements";
import attributeSlicerTemplate from "./templates/AttributeSlicer.html";
import { AttributeSlicer, SlicerItem } from "@essex/attribute-slicer";
import { ExcelBindingManager, getDataFromBinding, IDataRequirements, ISettingsManager, SettingsManager, ILoadSpinnerTemplate } from "@essex/office-core";
import { IAttributeSlicerIndexMappings } from "./models";
import * as debug from "debug";
const log = debug("AttributeSlicerOffice::AttributeSlicerOffice");
const naturalSort = require("javascript-natural-sort");

/**
 * The office version of the Attribute Slicer
 */
export default class AttributeSlicerOffice {

    /**
     * The element of the AttributeSlicer
     */
    private element: JQuery;

    /**
     * The Attribute Slicer that we are wrapping
     */
    private attributeSlicer: AttributeSlicer;

    /**
     *  The binding manager
     */
    private bindingManager: ExcelBindingManager;

    /**
     * The settings manager for the attribute slicer
     */
    private settingsManager: ISettingsManager;

    /**
     * The load spinner for the slicer
     */
    private loadSpinner: ILoadSpinnerTemplate;

    /**
     * Constructor for the Office Attribute Slicer
     * @param parentElement The parent element of the Attribute Slicer
     * @param bindingManager The binding manager to use
     * @param attributeSlicer The Attribute Slicer instance to use
     * @param settingsManager The settings manager to use
     */
    constructor(parentElement: JQuery, bindingManager?: ExcelBindingManager, attributeSlicer?: AttributeSlicer, settingsManager?: ISettingsManager) {
        const className = CSS_MODULE && (CSS_MODULE.className || (CSS_MODULE.locals && CSS_MODULE.locals.className));
        if (className) {
            parentElement.addClass(className);
        }

        this.settingsManager = settingsManager || new SettingsManager("attribute-slicer");
        this.bindingManager = bindingManager || new ExcelBindingManager("attribute-slicer", dataRequirements, this.settingsManager, () => {
            this.loadDataFromBindingManager();
        });
        const template = attributeSlicerTemplate(this.bindingManager);
        this.element = template.element;
        this.loadSpinner = template.default.loadSpinner;
        this.attributeSlicer = attributeSlicer || new AttributeSlicer(this.element.find(".attribute-slicer-container"));
        this.attributeSlicer.fontSize = 14;
        this.init();
        parentElement.append(this.element);
    }

    /**
     * Initializes the Attribute Slicer office plugin
     */
    private async init() {
        await this.loadSpinner.show("Initializing");
        this.attributeSlicer.dimensions = {
            width: window.innerWidth,
            height: window.innerHeight,
        };
        window.addEventListener("resize", this.onResize.bind(this));

        // Auto bind on load
        await this.loadSpinner.show("Attempting to auto bind");
        await this.bindingManager.autoBind();
        await this.loadDataFromBindingManager();
        await this.loadSpinner.hide();
    }

    /**
     * Loads data from the given binding
     */
    public async loadDataFromBindingManager() {
        await this.loadSpinner.show("Loading data")
        const loadInfo = await this.bindingManager.getData();
        if (loadInfo) {
            const { columns, rows, columnIndexes } = loadInfo;
            this.loadFromRawData(columns, rows, <IAttributeSlicerIndexMappings>columnIndexes);
        } else {
            this.attributeSlicer.data = [];
        }
        await this.loadSpinner.hide();
    }

    /**
     * Loads the Attribute Slicer from the set of raw data
     * @param The column names
     * @param The raw row values
     * @param indexes The indexes to map row data into specific column data
     */
    public loadFromRawData(columns: string[], rows: any[][], indexes: IAttributeSlicerIndexMappings) {
        this.attributeSlicer.serverSideSearch = false;
        this.attributeSlicer.showSelections = false;
        this.attributeSlicer.showValues = true;

        const itemMap = {};
        const data: SlicerItem[] = [];
        let max: number;
        let min: number;
        let treatAsCount = false;
        rows.forEach((n, i) => {
            (<string>n[indexes.category] || "(Blank)").split(",").forEach(category => {
                const id = i + "";
                let item: SlicerItem = itemMap[category];
                if (!item) {
                    item = {
                        id,
                        match: category,
                        value: undefined,
                        equals: (b: any) => b.id === id,
                    }
                    itemMap[category] = item;
                    data.push(item);
                }
                if (indexes.value !== undefined) {
                    const rawValue = n[indexes.value];
                    const parsedValue = parseFloat(rawValue);
                    if (typeof item.value === "undefined") {
                        item.value = 0;
                    }
                    if (!isNaN(parsedValue) && typeof parsedValue !== undefined) {
                        item.value += parsedValue;
                    } else {
                        treatAsCount = true;
                        item.value++;
                    }
                }

            });
        });
        data.forEach(n => {
            if (n.value !== undefined) {
                n.valueSegments = [{
                    value: n.value,
                    displayValue: treatAsCount ? n.value : n.value.toFixed(2),
                    width: 100,
                    color: n.value < 0 ? "#e81123" : "#0078d7",
                }];
                if (max === undefined || n.value > max) {
                    max = n.value;
                }
                if (min === undefined || n.value < min) {
                    min = n.value;
                }
            }
        });
        const range = max - min;
        data.forEach(n => {
            let renderedValue = 100;
            if (range > 0) {
                const offset = 10;//min > 0 ? 10 : 0;
                renderedValue = (((n.value - min) / range) * (100 - offset)) + offset;
            }
            n.renderedValue = renderedValue;
        });
        data.sort((a, b) => indexes.value === undefined ? naturalSort(a.match, b.match) : b.value - a.value);
        this.attributeSlicer.data = data;
    }

    /**
     * Listener for the window resize event
     */
    private onResize() {
        this.attributeSlicer.dimensions = {
            width: window.innerWidth,
            height: window.innerHeight,
        };
    }
}
