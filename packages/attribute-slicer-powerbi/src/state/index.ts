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

import { DEFAULT_STATE, IItemReference } from "@essex/attribute-slicer";
import {
	IAttributeSlicerState,
	IColorSettings,
	ColorMode,
	IColoredObject,
} from "../interfaces";
import { pixelConverter } from "powerbi-visuals-utils-typeutils";
import PowerBISettings from "./PowerBISettings";
import lodashGet from "lodash.get";
import { parseColoredInstances } from "./PowerBISettings/parseColoredInstances";
import {
	dataSupportsColorizedInstances,
	dataSupportsValueSegments,
} from "../dataConversion";
import powerbiVisualsApi from "powerbi-visuals-api";
import DataView = powerbiVisualsApi.DataView;
import colors from "../visual-utils/colors";
import ISelectionIdBuilder = powerbiVisualsApi.visuals.ISelectionIdBuilder;

const BUILD_VERSION: string = require("raw-loader!../../version.txt").default;

/**
 * Our internal state object
 */
export default class State implements IAttributeSlicerState {
	/**
	 * The currently selected search text
	 */
	public searchText?: string;

	/**
	 * The list of selected items
	 */
	public selectedItems?: IItemReference[];

	/**
	 * Whether or not the slicer should show the values column
	 */
	public showValues?: boolean;

	/**
	 * Whether or not data supports search
	 */
	public searchSupported?: boolean;

	/**
	 * If we are being rendered horizontally
	 */
	public horizontal?: boolean;

	/**
	 * The percentage based width of the value column 0 = hidden, 100 = whole screen
	 */
	public valueColumnWidth?: number;

	/**
	 * Hide Blank items
	 */
	public hideEmptyItems?: boolean;

	/**
	 * The text size in pt
	 */
	public textSize?: number;

	/**
	 * The font color used to display item text
	 */
	public itemTextColor?: string;

	/**
	 * If we should left align the text
	 */
	public leftAlignText?: boolean;

	/**
	 * If we should show the options area
	 */
	public showOptions?: boolean;

	/**
	 * If we should show the search box
	 */
	public showSearch?: boolean;

	/**
	 * The display units to use when rendering values
	 */
	public labelDisplayUnits?: number;

	/**
	 * The precision of the numbers to render
	 */
	public labelPrecision?: number;

	/**
	 * If we should single select
	 */
	public singleSelect?: boolean;

	/**
	 * If brushMode is enabled
	 */
	public brushMode?: boolean;

	/**
	 * If we should show the tokens
	 */
	public showSelections?: boolean;

	/**
	 * If the value displays should be always shown
	 */
	public displayValueLabels?: boolean;

	/**
	 * If the value text overflow should be visible
	 */
	public overflowValueLabels?: boolean;

	/**
	 * The set of settings for the colored objects
	 */
	public colors: IColorSettings;

	/**
	 * The scroll position of the visual
	 */
	public scrollPosition: [number, number] = [0, 0];

	/**
	 * Builds the set of enumeration objects for PowerBI
	 * @param objectName The object name to get the objects for
	 * @param dataView The dataview
	 */
	public buildEnumerationObjects(
		objectName: string,
		dataView: powerbiVisualsApi.DataView,
	): powerbiVisualsApi.VisualObjectInstanceEnumeration {
		const settings = <PowerBISettings>PowerBISettings.getDefault();

		// Construct a settings object from our internal state 
		settings.display.displayValueLabels = this.displayValueLabels;
		settings.display.hideEmptyItems = this.hideEmptyItems;
		settings.display.horizontal = this.horizontal;
		settings.display.labelDisplayUnits = this.labelDisplayUnits;
		settings.display.labelPrecision = this.labelPrecision;
		settings.display.overflowValueLabels = this.overflowValueLabels;
		settings.display.valueColumnWidth = this.valueColumnWidth;

		settings.general.itemTextColor = this.itemTextColor;
		settings.general.leftAlignText = this.leftAlignText;
		settings.general.showOptions = this.showOptions;
		settings.general.showSearch = this.showSearch;
		settings.general.textSize = pixelConverter.toPoint(
			this.textSize ? this.textSize : DEFAULT_STATE.textSize,
		);

		// Always override this
		settings.general.version = BUILD_VERSION;

		settings.selection.brushMode = this.brushMode;
		settings.selection.showSelections = this.showSelections;
		settings.selection.singleSelect = this.singleSelect;

		if (dataSupportsColorizedInstances(dataView)) {
			settings.dataPoint.colorMode = this.colors.colorMode;
			settings.dataPoint.reverseOrder = dataSupportsValueSegments(dataView)
				? this.colors.reverseOrder
				: undefined;

			if (this.colors.colorMode === ColorMode.Gradient) {
				if (dataSupportsGradients(dataView)) {
					settings.dataPoint.startColor = this.colors.gradient.startColor;
					settings.dataPoint.endColor = this.colors.gradient.endColor;
					settings.dataPoint.startValue = this.colors.gradient.startValue;
					settings.dataPoint.endValue = this.colors.gradient.endValue;
				}
			}
		} else {
			settings.dataPoint = undefined;
		}

		const instances = PowerBISettings.enumerateObjectInstances(settings, {
			objectName,
		});

		// Handle these specifically, DataViewObjectsParser does not support instancing like this
		if (
			this.colors.colorMode !== ColorMode.Gradient &&
			dataSupportsColorizedInstances(dataView)
		) {
			const colorInstances = this.colors.instanceColors.map((c, idx) => {
				const instanceColor = colors[idx] || "#ccc";
				const finalColor = c.color || instanceColor;
				return {
					displayName: c.name,
					selector: c.identity.getSelector(),
					properties: {
						fill: finalColor,
					},
				};
			});

			if (Array.isArray(instances)) {
				instances.push(...(<any>colorInstances));
			} else {
				instances.instances.push(...(<any>colorInstances));
			}
		}

		return instances;
	}

	/**
	 * Creates our state object from the powerbi setttings
	 * @param dataView The currently loaded powerbi dataview
	 * @param createBuilder The selection id builder...builder
	 */
	public static CREATE_FROM_POWERBI<T extends State>(
		dataView: powerbiVisualsApi.DataView,
		createBuilder: () => ISelectionIdBuilder,
	): T {
		const state = <T>State.CREATE();
		const settings = <PowerBISettings>PowerBISettings.parse(dataView);
		mergeDatapointSettings(createBuilder, dataView, state, settings);
		mergeSelectionSettings(dataView, state, settings);
		mergeDisplaySettings(state, settings);
		mergeGeneralSettings(dataView, state, settings);

		return state;
	}

	/**
	 * Creates a default instance of our state
	 */
	public static CREATE(): State {
		const state = new State();
		state.selectedItems = [];
		state.showValues = DEFAULT_STATE.showValues;
		state.searchSupported = false;
		state.horizontal = DEFAULT_STATE.horizontal;
		state.valueColumnWidth = DEFAULT_STATE.valueColumnWidth;
		state.hideEmptyItems = false;
		state.textSize = DEFAULT_STATE.textSize;
		state.itemTextColor = DEFAULT_STATE.itemTextColor;
		state.leftAlignText = DEFAULT_STATE.leftAlignText;
		state.showOptions = DEFAULT_STATE.showOptions;
		state.showSearch = DEFAULT_STATE.showSearch;
		state.labelDisplayUnits = 0;
		state.labelPrecision = 0;
		state.singleSelect = DEFAULT_STATE.singleSelect;
		state.brushMode = DEFAULT_STATE.brushMode;
		state.showSelections = DEFAULT_STATE.showSelections;
		state.displayValueLabels = DEFAULT_STATE.displayValueLabels;
		state.overflowValueLabels = DEFAULT_STATE.overflowValueLabels;
		state.colors = createColorSettings();
		return state;
	}
}

function getOrDefault(value: unknown, defaultValue: any) {
	if (value === undefined || value === "") {
		return defaultValue;
	}
	return value;
}

/**
 * Merges the given datapoint powerbi settings into our internal state
 * @param createIdBuilder Creates a builder that creates selection ids
 * @param dataView The currently loaded powerbi dataview
 * @param state The current state
 * @param settings The parsed settings from PowerBI
 */
function mergeDatapointSettings(
	createIdBuilder: () => ISelectionIdBuilder,
	dataView: DataView,
	state: State,
	settings: PowerBISettings,
) {
	state.colors = createColorSettings(
		settings.dataPoint.colorMode,
		parseColoredInstances(
			createIdBuilder,
			dataView,
			idx => colors[idx] || "#ccc",
			"dataPoint",
			"fill",
		),
		settings.dataPoint.startColor,
		settings.dataPoint.endColor,
		settings.dataPoint.startValue,
		settings.dataPoint.endValue,
		settings.dataPoint.reverseOrder,
	);
}

/**
 * Merges the given selection powerbi settings into our internal state
 * @param dataView The currently loaded powerbi dataview
 * @param state The current state
 * @param settings The parsed settings from PowerBI
 */
function mergeSelectionSettings(
	dataView: DataView,
	state: State,
	settings: PowerBISettings,
) {
	// parseColoredInstances
	state.brushMode = getOrDefault(settings.selection.brushMode, state.brushMode);
	state.showSelections = getOrDefault(
		settings.selection.showSelections,
		state.showSelections,
	);
	state.showValues = lodashGet(dataView, "categorical.values", []).length > 0;
	state.singleSelect = getOrDefault(
		settings.selection.singleSelect,
		state.singleSelect,
	);
}

/**
 * Merges the given display powerbi settings into our internal state
 * @param state The current state
 * @param settings The parsed settings from PowerBI
 */
function mergeDisplaySettings(state: State, settings: PowerBISettings) {
	state.displayValueLabels = getOrDefault(
		settings.display.displayValueLabels,
		state.displayValueLabels,
	);
	state.hideEmptyItems = getOrDefault(
		settings.display.hideEmptyItems,
		state.hideEmptyItems,
	);
	state.horizontal = getOrDefault(
		settings.display.horizontal,
		state.horizontal,
	);
	state.itemTextColor = getOrDefault(
		settings.general.itemTextColor,
		state.itemTextColor,
	);
	state.labelDisplayUnits = getOrDefault(
		settings.display.labelDisplayUnits,
		state.labelDisplayUnits,
	);
	state.labelPrecision = getOrDefault(
		settings.display.labelPrecision,
		state.labelPrecision,
	);
	state.overflowValueLabels = getOrDefault(
		settings.display.overflowValueLabels,
		state.overflowValueLabels,
	);
	state.valueColumnWidth = getOrDefault(
		settings.display.valueColumnWidth,
		state.valueColumnWidth,
	);
}

/**
 * Merges the given general powerbi settings into our internal state
 * @param dataView The currently loaded powerbi dataview
 * @param state The current state
 * @param settings The parsed settings from PowerBI
 */
function mergeGeneralSettings(
	dataView: DataView,
	state: State,
	settings: PowerBISettings,
) {
	const isSelfFilterEnabled: boolean = lodashGet(
		dataView,
		"metadata.objects.general.selfFilterEnabled",
		false,
	);

	state.leftAlignText = getOrDefault(
		settings.general.leftAlignText,
		state.leftAlignText,
	);
	state.scrollPosition = [0, 0];
	state.searchSupported =
		doesDataSupportSearch(dataView) && !isSelfFilterEnabled;
	state.searchText = (() => {
		const selfFilter: any = lodashGet(
			dataView,
			"metadata.objects.general.selfFilter",
		);
		if (selfFilter) {
			const filterValues: any = getFilterValues(dataView, "general.selfFilter");
			if (filterValues && filterValues.length) {
				return filterValues[0] || "";
			}
		}
		return "";
	})();
	state.selectedItems = parseSelectionFromPBI(dataView);
	state.showOptions = getOrDefault(
		settings.general.showOptions,
		state.showOptions,
	);
	state.showSearch = getOrDefault(
		settings.general.showSearch,
		state.showSearch,
	);
	const textSize = settings.general.textSize;
	state.textSize = textSize
		? pixelConverter.fromPointToPixel(textSize)
		: DEFAULT_STATE.textSize;
}

/**
 * Calculates whether or not the dataset supports search
 */
function doesDataSupportSearch(dv: DataView) {
	"use strict";
	const source = lodashGet(dv, "categorical.categories[0].source");
	const metadataCols = lodashGet(dv, "metadata.columns");
	const metadataSource =
		metadataCols &&
		metadataCols.filter((n: any) => n.roles && n.roles["Category"])[0];
	if (source && metadataSource) {
		return (
			source && metadataSource && metadataSource.type.text && source.type.text
		);
	}
	return false;
}

/**
 * Loads the selection from PowerBI
 */
function parseSelectionFromPBI(dv: DataView): IItemReference[] {
	"use strict";
	const filterValues = getFilterValues(dv, "general.filter");
	return filterValues.map(text => ({ id: text, text }));
}

function gradientEquals(obj: any, obj2: any): boolean {
	if (obj === obj2) {
		return true;
	} else if ((!obj && obj2) || (obj && !obj2)) {
		return false;
	} else {
		return (
			obj.startColor === obj2.startColor &&
			obj.endColor === obj2.endColor &&
			obj.startValue === obj2.startValue &&
			obj.endValue === obj2.endValue
		);
	}
}

function createColorSettings(
	colorMode?: ColorMode,
	instanceColors?: IColoredObject[],
	startColor?: string,
	endColor?: string,
	startValue?: number,
	endValue?: number,
	reverseOrder?: boolean,
): IColorSettings {
	const me = {
		colorMode: getOrDefault(colorMode, ColorMode.Instance),
		instanceColors: <IColoredObject[]>getOrDefault(instanceColors, []),
		gradient: {
			startColor: getOrDefault(startColor, "#bac2ff"),
			endColor: getOrDefault(endColor, "#0229bf"),
			startValue: startValue,
			endValue: endValue,
		},
		reverseOrder: getOrDefault(reverseOrder, false),
		equals: (other: IColorSettings) => {
			if (other) {
				const otherGradient = other.gradient || undefined;
				const gradient = me.gradient || undefined;
				if ((gradient && !otherGradient) || (otherGradient && !gradient)) {
					return false;
				}

				const otherInstances = other.instanceColors || [];
				const instanceColors = me.instanceColors || [];
				if (otherInstances.length !== instanceColors.length) {
					return false;
				}

				const anyInstanceChanges = instanceColors.some((n, j) => {
					const otherInstance = otherInstances[j];
					return (
						otherInstance.name !== n.name || otherInstance.color !== n.color
					);
				});

				return (
					!anyInstanceChanges &&
					gradientEquals(gradient, otherGradient) &&
					me.reverseOrder === other.reverseOrder &&
					me.colorMode === other.colorMode
				);
			}
			return false;
		},
	};
	return me;
}

/**
 * Gets the text values that form the current selection filter
 * @param dv The dataView
 * @param filterPath The path to the filter within the metadata objets
 */
function getFilterValues(dv: DataView, filterPath: string): string[] {
	const savedFilter: any = lodashGet(dv, `metadata.objects.${filterPath}`);
	if (savedFilter) {
		const values = findObjectPropValues(savedFilter, "value");
		return values.map((n: any) => {
			// This is also a little funky cause sometimes the actual value is nested under a 'value'
			// property, other times it is just the value
			let text = pretty(n);

			// Is an array
			if (n && n.splice) {
				text = pretty(n[0].value);

				// If we have a non empty value property
			} else if (n && (n.value !== undefined && n.value !== null)) {
				text = pretty(n.value);
			}
			return text;
		});
	}
	return [];
}

/**
 * Searches the entire heirarchy to find the given properties with the given property name
 * @param obj The object to search
 * @param searchProp The property to find
 */
function findObjectPropValues(obj: any, searchProp: string) {
	const values: any[] = [];
	if (typeof obj === "object" && obj !== undefined && obj !== null) {
		Object.keys(obj).forEach(prop => {
			const type = typeof obj[prop];
			if (type === "object") {
				values.push(...findObjectPropValues(obj[prop], searchProp));
			} else if (prop === searchProp) {
				values.push(obj[prop]);
			}
		});
	}
	return values;
}

/**
 * Returns true if gradients can be used with the data
 * @param dv The dataView to check
 */
export function dataSupportsGradients(dv: powerbiVisualsApi.DataView) {
	"use strict";

	// We can use gradients on ANY data that has more than one value, otherwise it doesn't make sense
	if (dataSupportsValueSegments(dv)) {
		return lodashGet(dv, "categorical.values.length", 0) > 0;
	}
	return false;
}

/**
 * Pretty prints a string value
 * @param val The value to pretty print
 */
function pretty(val: string) {
	if (val === null || val === undefined) {
		return "";
	}
	return val + "";
}
