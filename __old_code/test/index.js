'use strict'

const EasyGraphQLLoadTester = require('easygraphql-load-tester')
const fs = require('fs')
const path = require('path')

const schema = fs.readFileSync(
  path.join(__dirname, '../src/', 'schema.graphql'),
  'utf8'
)

let args = {
  summarySingle: {
    term: 'United States'
  }
}
const easyGraphQLLoadTester = new EasyGraphQLLoadTester(schema, args)

// const queries = [
//   {
//     name: 'summary(terms: ["United States"])',
//     query: `
//       {
//         summary(terms: ["United States"])
//       }
//     `
//   }
// ]

const options = {
  // customQueries: queries,
  selectedQueries: ['summarySingle'],
  withMutations: false,
  vus: 10
}

const testCases = easyGraphQLLoadTester.artillery(options)

module.exports = {
  testCases
}
