import { SlicerItem } from "./interfaces";
import { prettyPrintValue as pretty } from "./Utils";

/**
 * Returns an element for the given item
 */
export default function (item: SlicerItem, sizes: { category: number; value: number }) {
    "use strict";
    const { match, matchPrefix, matchSuffix, sections, renderedValue } = item;
    const categoryStyle = `display:inline-block;overflow:hidden;max-width:${sizes.category}%`;
    return $(`
        <div style="white-space:nowrap" class="item" style="cursor:pointer">
            <div style="margin-left: 5px;vertical-align:middle;height:100%" class="display-container">
                <span style="${categoryStyle}" title="${pretty(match)}" class="category-container">
                    <span class="matchPrefix">${pretty(matchPrefix)}</span>
                    <span class="match">${pretty(match)}</span>
                    <span class="matchSuffix">${pretty(matchSuffix)}</span>
                </span>
                <span style="display:inline-block;max-width:${sizes.value}%;height:100%" class="value-container">
                    <span style="display:inline-block;width:${renderedValue}%;height:100%">
                    ${
                        (sections || []).map(s => {
                            let color = s.color;
                            if (color) {
                                color = `background-color:${color};`;
                            }
                            const displayValue = s.displayValue || s.value || "0";
                            const style = `display:inline-block;width:${s.width}%;${color};height:100%`;
                            return `
                                <span style="${style}" title="${displayValue}" class="value-display">
                                    &nbsp;<span class="value">${displayValue}</span>
                                </span>
                            `.trim().replace(/\n/g, "");
                        }).join("")
                    }
                    </span>
                </span>
            </div>
        </div>
    `.trim().replace(/\n/g, ""));
}

