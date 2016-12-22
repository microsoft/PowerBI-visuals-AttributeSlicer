# AttributeSlicer

 Attribute Slicer lets you filter a dataset on a given column by selecting attribute values of interest. The initial display is a helpful overview that lists the most common values first and shows the overall distribution of values as a horizontal bar chart. Whenever you select an attribute value, it is moved to the list of applied filters and all records containing that value are added to the result set for further analysis.

> This visual is currently in beta testing and is undergoing active development.

## Getting Started
* Fork this repo
* Install [node.js 6+](https://nodejs.org)
* Run `npm install` on the project directory
* The `src` directory contains all of the visual's code.

## Building
* Running `npm run build` will do the following:
  * Compiles the `src` directory.
  * Creates a `.pbiviz` file in the `dist\powerbi` directory.
    * Go to [Power BI](https://app.powerbi.com/), and to import your new visual.
