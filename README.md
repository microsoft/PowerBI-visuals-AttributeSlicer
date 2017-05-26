# AttributeSlicer

 Attribute Slicer lets you filter a dataset on a given column by selecting attribute values of interest. The initial display is a helpful overview that lists the most common values first and shows the overall distribution of values as a horizontal bar chart. Whenever you select an attribute value, it is moved to the list of applied filters and all records containing that value are added to the result set for further analysis.

 ![Attribute Slicer](/assets/screenshot.png?raw=true)

> This visual is currently in beta testing and is undergoing active development.

## Usage
* Install [node.js 6+](https://nodejs.org)
* Install [yarn](https://yarnpkg.com/lang/en/docs/install)
* Run `yarn` on the project directory, which will install all the dependencies
* Run `yarn test` which will lint, test, and compile the `attribute-slicer`, `attribute-slicer-react` and `attribute-slicer-powerbi` packages.
    * Compiling `attribute-slicer-powerbi` will also create a `.pbiviz` file in the `packages/attribute-slicer/powerbi/dist/powerbi` directory, which can be imported directly in [Power BI](https://app.powerbi.com/)
* Alternatively run `yarn test:powerbi`, which will do the same as `yarn test` but will exclude `attribute-slicer-react`.
