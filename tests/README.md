This directory contains scripts to drive simple testing of the components in other directories for this repo.

The intention is to quickly validate that updates to, say, the JMS examples still work. In particular, that changes to
dependency versions do not break those samples.
* Not all options for an example are exercised. If an example has a major feature added, then it is hoped that example
  is explicitly tested before inclusion. And any related testcases can be included in that example's directory.
* Not all directories (currently) have test scripts.

Most tests will require access to a queue manager. That will be setup and run as a container. Environment variables and
a cutdown JSON config file in the testing framework control the connection.

The `runContainer.sh` script gets that container running. Options to the `runTest.sh` script say whether to start/stop
the container or keep an existing image running.

## Running the tests

The `runTest.sh` script is the main interface. You can give it the full or partial name of the tests to run. If no tests
are named, you are presented with a list of the available options.

For example:

```
runTest.sh python springmvc
```

There is deliberately no "run all the tests" option, because the likelihood is you are only changing one or two
directories at a time. So you can focus on those.

The return code from `runTest` is non-zero if any failures occur.

## The individual test scripts
The test scripts are named approximately after the directory they are testing. They should follow the same pattern:
* Write a log file to the `./logs` directory. You ought to review the log file to make sure output is as expected, even
  with an OK return code.
* Do any initialisation of the MQ objects. Though the hope is that running the scripts - at least in the successful case
  - will leave the queues etc in a state suitable for subsequent tests
* Set the configuration either from the JSON file in this directory, or make the equivalent values available
* Exit with a non-zero return code if any of the testing fails