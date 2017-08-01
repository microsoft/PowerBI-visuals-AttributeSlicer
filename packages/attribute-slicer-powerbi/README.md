[![CircleCI](https://circleci.com/gh/Microsoft/PowerBI-visuals-AttributeSlicer/tree/master.svg?style=svg)](https://circleci.com/gh/Microsoft/PowerBI-visuals-AttributeSlicer/tree/master)

# Attribute Slicer -- PowerBI

This is the PowerBI visual version of the Attribute Slicer.

> This visual is currently in beta testing and is undergoing active development.

## Usage
* Fork this repo
* Install [node.js 6+](https://nodejs.org)
* Install [yarn](https://yarnpkg.com/)
* Run `yarn && yarn test` in the `../attribute-slicer` directory.
* Run `yarn && yarn test` in this directory.
    * This will generate a `pbiviz` file in the `dist\` directory, which can then be imported into PowerBI.
* Run `yarn start` in this directory.
    * This will start a local dev server that enables live debugging and reload
