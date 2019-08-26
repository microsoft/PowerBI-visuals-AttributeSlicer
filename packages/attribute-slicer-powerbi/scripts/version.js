const fs = require('fs')
const path = require('path')
const BUILD_NUMBER = process.env.TRAVIS_BUILD_NUMBER || 'dev'
const packageJSON = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json')) + '')

const version = packageJSON.version + "+" + BUILD_NUMBER
fs.writeFileSync(path.join(__dirname, '../version.txt'), version)

console.log("Updated version.txt to " + version)

