/**
 * Represents a mapping between requirement names an column indexes
 */
export interface IRequirementColumnIndexMappings {

    /**
     * Mapping between the requirement name and the column index
     */
    [requirement: string]: number;
}

/**
 * Describes the data requirements of the component
 */
export interface IDataRequirements {
    fields: {
        name: string;
        type?: string;
        required?: boolean;
        isMatch?: (name: string, table: Excel.Table, column: Excel.TableColumn, colIdx: number) => {
            /**
             * Represents the quality of the column's ability to meet the data requirement for this field.
             */
            quality: number;
        };
    }[];
}
