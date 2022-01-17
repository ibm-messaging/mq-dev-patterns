# IBM MQ Rust REST samples

These samples show how to call the IBM MQ REST messaging API from
Rust programs. Two samples are provided, one to POST (Put) a message and
the other to DELETE (Get destructively).

They use the `reqwest` crate (dependency package) as the interface to make
REST calls.

These samples have been tested on rust 1.56.1 and cargo 1.56.0.

## Building the samples

You need an environment with rustc and cargo installed. See https://www.rust-lang.org/tools/install and
https://doc.rust-lang.org/cargo/getting-started/installation.html for information on installing the
compiler and associated tools for your platform.

You can compile and run the samples directly from this github repository when cloned to
a local directory. The `RUNME.sh` script in the
same directory as this README file can be used as a trivial driver.

The first time the programs are compiled, all the the dependency `crates` are downloaded are compiled. Subsequent
executions will be a lot quicker.

You can also use `cargo build` to compile the programs, and saving the output under the `target`
directory for future executions.

## Sample envrest.json

We provide a default envrest.json file with the following settings:

* HOST - Host name or IP address of your queue manager's web server
* PORT - HTTP Listener port for your queue manager
* QMGR - Queue manager name
* QUEUE_NAME - Queue name
* CSRFTOKEN - MQ REST CSRF Token which can be any value
* APP_USER - User name that application uses to connect to MQ
* APP_PASSWORD - Password that the application uses to connect to MQ

Edit the JSON file with your local configuration parameters. The defaults are based on the
MQ Developer configuration.

The configuration file is assumed to be in the
common directory, above the individual samples. If you try to run the program from the wrong directory, there will a
"No such file or directory" error shown.

## Certificate Usage Warning

Connections to the web server are made over HTTPS, but keystores or certificates are needed for these
samples. This code permits any certificate to be presented by the web server; it is not validated - see the
use of the `danger_accept_invalid_certs` function.
This practice is acceptable for code samples but not for general, practical use.
Invalid certificates increase susceptibility to attacks and viruses whilst risking your encryption and mutual authentication.
