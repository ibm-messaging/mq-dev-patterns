# IBM MQ Node.js Samples Unit Tests

The Unit test cases for the Node.js samples have been written in the Mocha JavaScript test framework, along with the Chai Assertion Library. All the dependenices for testing are present in the `devDependencies` section of the `package.json` file. To fetch them, simply run the following command : 

`npm i`

## Mocha

Mocha is a feature-rich JavaScript test framework running on Node.js and in the browser. It allows for flexible and accurate reporting, while mapping uncaught exceptions to the correct test cases.

### Installation
Mocha tries to find all the test files under the `test` directory by default. Thus, to leverage the full capabilities of Mocha, it is recommended to install Mocha globally via npm : <br>

`npm install --global mocha`

(Note : This is needed so that you can see the running of the test cases in the terminal)

After installing Mocha globally, simply run the `mocha` command in the terminal, navigating to the Node.js directory of your `mq-dev-patterns` clone : 

On Windows:

`<Path to mq-dev-patterns Clone>\mq-dev-patterns\Node.js> mocha`

On Linux/Mac:

`<Path to mq-dev-patterns Clone>/mq-dev-patterns/Node.js$ mocha`

This will lead to mocha searching for all the files ending in `test.js` in the `test` directory, and running them.

## Chai

Chai is a BDD/TDD assertion library for node and the browser that can be delightfully paired with any JavaScript testing framework like Mocha.

( Note : In the `package.json`, the version of Chai is `4.4.1`, since starting from `v5`, Chai is ESM only, and would require to instead use the `import` statement, that throws an error, since the samples in the repository all use the `require` statement to load in libraries. To learn more about this refer to the following link : [ERR_REQUIRE_ESM in v5](https://github.com/chaijs/chai/issues/1561) )

## Good to Know Points

- When testing these samples using IBM MQ on Cloud, it's been observed that due to some network latencies, certain functions like `connx`, `open`, `close` or `disc` could potentially timeout with the default time period of `2000 ms` defined by Chai while testing functions returning Promises. To tackle this, the test cases have been modified with a higher value of `timeout` being assigned to `5000 ms`. In a scenario where this is also not sufficient, you can modify it to a higher value like `10000 ms` to ensure that each of these Promises can be resolved for testing.

- The samples having common functions, for e.g. the `ccdtCheck` function present in the `basicget` as well as the `basicput` files have been tested only once, to avoid leading to duplicate testing, since Mocha will execute all the test files present in the `test` directory by default, unless mentioned explicitly, to test a particular test file.