/**
 * Pretty prints a value
 */
export function prettyPrintValue (val: any) {
    "use strict";
    // Date check
    if (val && val.toISOString) {
        let dateVal = <Date>val;
        return (dateVal.getMonth() + 1) + "/" +
                dateVal.getDate() + "/" +
                dateVal.getFullYear() + " " +
                dateVal.getHours() + ":" + dateVal.getMinutes() + (dateVal.getHours() >= 12 ? "PM" : "AM");
    }
    return /* tslint:disable */ val === null /* tslint:enable */|| val === undefined ? "" : val + "";
}
