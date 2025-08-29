# Cypress & Vitest Coverage Merging Reproduction

## Context

Our front-end codebases generally have two main sets of automated tests;

- Unit Tests (Usually via Jest or Vitest etc.)
- Cypress Tests (E2E or Component tests)

Although we generally take a Cypress-first approach, we have some files in the front-end codebases that
have more exhaustive tests done via unit tests only. So together the two types of tests are used to produce
full coverage of the codebase.

SonarCloud is our source-of-truth for the coverage of our codebases and is integrated into pull-requests
to gate merges. The issue is that Sonar is not reporting the correct coverage figures for certain metrics
(line, statement, function, branch etc.).

The current configuration that this codebase and others (like PE and Designer) are using is to tell Sonar where
the file paths are for the `lcov.info` (line-coverage) files that are produced by the testing tools.

```properties
# sonar-project.properties
sonar.javascript.lcov.reportPaths=coverage-cypress/worker-*/lcov.info, coverage-unit/worker-*/coverage-unit-dir/lcov.info
```

The CircleCI config has `parallelism` enabled for both sets of tests and so each worker outputs its own directory
with the name `worker-${id}`, hence the `*` wildcard in the pattern.

## Investigation

### Part 1 - Manual LCOV File Merging

When introspecting the coverage files produced by both Vitest and Cypress, we can see that the individual reports
are correct. It's only once SonarCloud merges them together that the data is corrupted and reports incorrectly.

We tried manually merging the reports ourselves and feeding Sonar a single path to the merged file, but we hit more
issues here. Tools like [`lcov`](https://www.npmjs.com/package/lcov) and [`lcov-result-merger`](https://www.npmjs.com/package/lcov-result-merger)
seems to produce the wrong information (the latter actually loses all branch data).

Our final attempt was to merge the JSON output from the coverage tool and use the NYC tool to merge them together and
produce a single LCOV file.

```bash
#!/bin/bash -eo pipefail

# Copy all of the coverage-final.json files from each CircleCI worker
mkdir .nyc_output
for file in $(find /home/circleci/project/{coverage-cypress,coverage-unit}/worker-* -name "coverage-final.json"); do
  dir_path=$(dirname "$file")
  echo dir_path=$dir_path
  cp "$file" ".nyc_output/${dir_path//\//-}-coverage-final.json"
done

# Use the NYC tool to merge the JSON files together into a single LCOV file
npx nyc report --reporter=lcov --report-dir=coverage-for-cy-and-unit-lcov

# Delete the old .nyc_output directory
rm -r .nyc_output
```

### Part 2 - Inspecting the LCOV Files

It seems that the instrumentation done by Istanbul is different between Vitest and Cypress.
The below is a (square) Venn-diagram that illustrates the issue;

```
      Cypress                             Vitest
+------------------+---------------+------------------+
|   19 Branches    |  24 Branches  |    24 Branches   |
|   (IDs 0-18)     |  (IDs 0-23)   |    (IDs 0-23)    |
|  100% Coverage   | 80% Coverage  |   80% Coverage   |
+------------------+---------------+------------------+
```

So once the two are merged, the unique 5 branches (IDs `19-23`) from Vitest are added into the file alongside
the 19 (IDs `0-18`) from Cypress, all of which aren't covered, which lowers the overall coverage even though Cypress
coverage 100% of them (according to its instrumentation).

Cypress is configured to use the `vite` bundler in `cypress.config.ts` and we register the [`vite-plugin-istanbul`](https://www.npmjs.com/package/vite-plugin-istanbul)
plugin in our `vite.config.mts` file with the `cypress` option set to `true`.  Under-the-hood, this plugin is
using [`"istanbul-lib-instrument": "^6.0.3"`](https://github.com/iFaxity/vite-plugin-istanbul/blob/next/package.json#L45).

Vitest is also configured to use Istanbul via the `test.coverage.provider` property in `vite.config.mts`, which is
supported by the [`@vitest/coverage-istanbul`](https://www.npmjs.com/package/@vitest/coverage-istanbul) plugin.
Under-the-hood, this plugin also uses [`"istanbul-lib-instrument": "^6.0.3"`](https://github.com/vitest-dev/vitest/blob/main/packages/coverage-istanbul/package.json#L50)

The branch discrepancy seems to be caused by `if` statements that have implicit `else` blocks. For example

```javascript
1   const someVar = 'variable'
2  
3   if (someVar === 'variable') {
4       // Do something
5   }
6
7   // The rest of the code...
```

Line `3` has a single binary branch where `someVar` either matches `'variable'` or it doesn't. Two conditions with
two tests needed. Cypress will see this as one branch with two cases and will consider both covered (since we have two tests).
Vitest will see it as two branches with four cases where only two are covered, leaving the coverage at 50%.

### Part 3 - Switching Vitest Coverage to V8

We'd configured Vitest to use the Istanbul coverage tool (since that's what we were using with Jest before the migration).
This maintained backwards compatability and also keeps Cypress/Vitest using the same tool. We tried switching the Vitest's
default coverage tool (`[@vitest/coverage-v8`](https://www.npmjs.com/package/@vitest/coverage-v8)) to see if that produced
different results in the LCOV file.

This actually fixed the issue where there was a discrepancy in the number of branches identified between Vitest and Cypress.
Locally, when producing the merged LCOV file and running it though a graphical viewer, the coverage seemed correct. It
put the codebase at about 97.8% which is what we would expect. However, when pushing this upstream and running this
solution in CI, all the Cypress coverage was missing and dropped the PR branch in question down from 90%+ to ~3%.

After printing out the LCOV files produced by the CI pipeline and running them through the viewer, it seems that they
are different. To keep our local and CI environments inline, we upgraded the node version from `v18.x` to `v22.6.0` to
matching our local environments where it was working. This had no effect. We also confirmed all versions of relevant
packages were the same.

The last CI run produced a file that the LCOV graphical viewer says is covered at about 85%, yet Sonar says its 3%.
So we're suspecting there might be an issue with the SonarScanner CLI.

### Part 4 - SonarCloud and the SonarScanner CLI

We're still not sure if there is an issue with SonarCloud itself, but some of the scenarios we tested suggest that there might be.

Here are some excerpts from the SonarCloud job output on the CI pipeline:

```bash
# Version info
INFO: SonarScanner 5.0.1.3006
INFO: Java 17.0.7 Eclipse Adoptium (64-bit)
INFO: Linux 5.15.0-1057-aws amd64

# Project configuration
INFO: Project configuration:
INFO:   Excluded sources: **/build-wrapper-dump.json, **/*.spec.*, **/*.cy.*
INFO:   Included tests: **/*.spec.*, **/*.cy.*
INFO:   Excluded sources for coverage: **/*.stories.tsx, **/*.cy.tsx, src/storybook/**, **/*.handlers.*, **/*.responses.*, **/__mocks__/**/*, **/__fixtures__/**/*, src/api/handlers/**, src/setupTests.ts, src/__test-utils__/pact.config.ts, */_cypress/**, src/__test-utils__/index.tsx
INFO:   Excluded sources for duplication: **/*.handlers.*, **/__mocks__/**/*, **/__fixtures__/**/*, **/*.spec.*
INFO: 835 files indexed

# The sensor picking up all files from the reportPaths property
INFO: Sensor JavaScript/TypeScript Coverage [javascript]
INFO: Analysing [/home/circleci/project/coverage-for-cy-and-unit-lcov/lcov.info]
INFO: Sensor JavaScript/TypeScript Coverage [javascript] (done) | time=73ms

#  Another example when we were not manually merging and had some parallelism on
INFO: Analysing [
  /home/circleci/project/coverage-unit/worker-0/coverage-unit-dir/lcov.info, 
  /home/circleci/project/coverage-unit/worker-1/coverage-unit-dir/lcov.info,
  /home/circleci/project/coverage-cypress/worker-0/lcov.info
]
```

## Next Steps

- Better understand what the LCOV file should look like. The issue seems to be with branches only. Should there be two entries in each branch array (for an if statement with condition), or two?
- Find a way to align both Cypress and Vitest so that they produce LCOV reports in the same format. It could be related to the underlying Istanbul instrumentation libraries, or maybe even the source-mapping logic, or both.
- Why is our CI environment behaving differently from our local one? This would help us better diagnose the issue.

## Solution

TBD

## References

- An LCOV file viewer https://lcov-viewer.netlify.app/
