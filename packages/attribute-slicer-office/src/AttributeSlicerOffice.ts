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
import {
    IBindingManager,
    getDataFromBinding,
    IDataRequirements,
    IDataResult,
    ISettingsManager,
    SettingsManager,
    ILoadSpinnerTemplate,
    AggregationType,
} from "@essex/office-core";
import { OfficeSlicerItem } from "./models";
import * as debug from "debug";
import converter from "./dataConversion";
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
    private bindingManager: IBindingManager;

    /**
     * The settings manager for the attribute slicer
     */
    private settingsManager: ISettingsManager;

    /**
     * The load spinner for the slicer
     */
    private loadSpinner: ILoadSpinnerTemplate;

    /**
     * True if we are currently loading data
     */
    private loadingData = false;

    /**
     * True if we are currently loading data
     */
    private savingSelection = false;

    /**
     * Constructor for the Office Attribute Slicer
     * @param parentElement The parent element of the Attribute Slicer
     * @param settingsManager The settings manager to use
     * @param bindingManager The binding manager to use
     * @param attributeSlicer The Attribute Slicer instance to use
     */
    constructor(parentElement: JQuery, settingsManager: ISettingsManager, bindingManager: IBindingManager, attributeSlicer?: AttributeSlicer) {
        const className = CSS_MODULE && (CSS_MODULE.className || (CSS_MODULE.locals && CSS_MODULE.locals.className));
        if (className) {
            parentElement.addClass(className);
        }
        this.settingsManager = settingsManager;
        this.bindingManager = bindingManager;
        this.bindingManager.onDataChanged = this.loadDataFromBindingManager.bind(this);
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

        this.attributeSlicer.events.on("selectionChanged", async (items: OfficeSlicerItem[]) => {
            const criteria = (items || []).map(n => this.bindingManager.createCriteria("category", n.match, undefined, "eq"));
            if (this.loadingData) {
                return;
            }
            this.savingSelection = true;
            await this.settingsManager.set("selection", items.map(n => n.id));
            await this.bindingManager.applyFilter(criteria.length ? {
                criteria,
            }: undefined);
            this.savingSelection = false;
        });

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
        if (this.savingSelection) {
            return;
        }

        this.loadingData = true;
        await this.loadSpinner.show("Loading data");

        // Get the selection here, cause it will get overridden by the data load, so load before the data changes
        const selection = await this.settingsManager.get<string[]>("selection");

        const data = await this.bindingManager.getData<{ category: any; value: any}>();
        if (data) {
            this.loadFromRawData(data);
        } else {
            this.attributeSlicer.data = [];
        }

        await this.loadSpinner.show("Loading selection");

        if (selection) {
            if (selection.length > this.attributeSlicer.data.length) {
                log("Invalid selection!");
            } else {
                this.attributeSlicer.selectedItems = this.attributeSlicer.data.filter(n => selection.indexOf(n.id) >= 0);
            }
        }

        await this.loadSpinner.hide();
        this.loadingData = false;
    }

    /**
     * Loads the Attribute Slicer from the set of raw data
     * @param The column names
     * @param The raw row values
     * @param indexes The indexes to map row data into specific column data
     */
    public loadFromRawData(parsedData: IDataResult<{ category: any; value: any}>) {
        this.attributeSlicer.serverSideSearch = false;
        this.attributeSlicer.showSelections = false;
        this.attributeSlicer.showValues = true;

        const data = converter(parsedData);

        const hasValues = data.length > 0 && data[0].value !== undefined;
        this.attributeSlicer.showValues = hasValues;
        data.sort((a, b) => !hasValues ? naturalSort(a.match, b.match) : b.value - a.value);
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
