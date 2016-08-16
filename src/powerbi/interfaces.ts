import { SlicerItem } from "../interfaces";
import SelectableDataPoint = powerbi.visuals.SelectableDataPoint;
import TooltipEnabledDataPoint = powerbi.visuals.TooltipEnabledDataPoint;

/**
 * Represents a list item
 */
/* tslint:disable */
export interface ListItem extends SlicerItem, SelectableDataPoint, TooltipEnabledDataPoint { }

/**
 * The settings that are in one way or another stored in powerbi
 */
export interface ISettings {
    labelDisplayUnits: number;
    labelPrecision: number;
    singleSelect: boolean;
    brushSelectionMode: boolean;
    showSelections: boolean;
    showOptions: boolean;
    valueWidthPercentage: number;
    renderHorizontal: boolean;
    textSize: number;
    searchString: string;
}

/**
 * Represents slicer data
 */
export interface ISlicerVisualData {
    /**
     * The actual dataset
     */
    data: SlicerItem[];

    /**
     * Metadata which describes the data
     */
    metadata: { 
        /**
         * The name of the category column
         */
        categoryColumnName: string;

        /**
         * Whether or not there is even categories
         */
        hasCategories: boolean;
    };
};

export type SlicerItem = SlicerItem;
