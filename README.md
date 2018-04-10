[![Build Status](https://travis-ci.org/Microsoft/PowerBI-visuals-AttributeSlicer.svg?branch=develop)](https://travis-ci.org/Microsoft/PowerBI-visuals-AttributeSlicer)

# AttributeSlicer

 Attribute Slicer lets you filter a dataset on a given column by selecting attribute values of interest. The initial display is a helpful overview that lists the most common values first and shows the overall distribution of values as a horizontal bar chart. Whenever you select an attribute value, it is moved to the list of applied filters and all records containing that value are added to the result set for further analysis.

 ![Attribute Slicer](/assets/screenshot.png?raw=true)

> This visual is experimental and not actively being developed, only major issues will be addressed.

## Usage
* Install [node.js 6+](https://nodejs.org)
* Install [yarn](https://yarnpkg.com/lang/en/docs/install)
* Run `yarn` on the project directory, which will install all the dependencies
* Run `yarn test` which will lint, test, and compile the `attribute-slicer` and `attribute-slicer-powerbi` packages.
    * Compiling `attribute-slicer-powerbi` will also create a `.pbiviz` file in the `packages/attribute-slicer/powerbi/dist` directory, which can be imported directly in [Power BI](https://app.powerbi.com/)
* Run `yarn start`, which will load the powerbi visual into live reload mode.
