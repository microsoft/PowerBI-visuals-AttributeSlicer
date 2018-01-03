import * as type from "./type";
import * as formatting from "./formatting";
import * as dataview from "./dataview";
import * as svg from "./svg";

// These sub objects are using script-loader, we could just use exports-loader, but this way preserves typings

export {
    formatting,
    type,
    dataview,
    svg
};
