# IBM MQ Rust REST samples

These samples have been tested on rust 1.56.1 and cargo 1.56.0.

## Certification Warning

This code example operates by allowing invalid certifications in order to make a connection.

This practice is acceptable for code samples but not for general, practical use.

Invalid certifications increase susceptibility to attacks and viruses whilst risking your encryption and mutual authentication.

## Building the samples

The best way to build and compile these samples is to set up your environment with rustc and cargo installed. 

To run these files on the command line navigate to your chosen directory and run: 

```bash
$ cargo new project_name
$ cd project_name
```
This will create the directory “project_name”.

Inside the directory will be a folder called src and a Cargo.toml file.

## Editing the Cargo.toml file

Open cargo.toml in your text editor of choice, It should look like this:

```c
[package]
name = “project_name”
version  = “0.1.0”
edition = “2021”

[dependencies]
```

Underneath dependencies you will need to insert these crates for the code to work:
```c
- reqwest = { version = “0.11”, features = [“blocking”, “json”] }

- base64 = “0.13.0”

- http = “0.2.4”

- serde = { version = “1.0.104”, features = [“derive”] }

- serde_json = “1.0.48”
```

After this is done your Cargo.toml file should look like this:

```c
[package]
name = "project_name"
version = "0.1.0"
edition = "2021"

[dependencies]
reqwest = { version = "0.11", features = ["blocking", "json"] }
base64 = "0.13.0"
http = "0.2.4"
serde = { version = "1.0.104", features = ["derive"] }
serde_json = "1.0.48"
```
*We have provided a Template.toml file to act as a template. This will look the same as the instructions above*

We are now ready to build our project.


## Building our project

In your command line navigate to your project folder where your Cargo.toml file is. 

*Optional:
If you do not have an active ssh-agent running on your machine run the two commands above 'cargo build'.*

To build the project run this command:

```bash
$ eval 'ssh-agent -s'
$ ssh-add
$ cargo build
```

You should now be seeing all the crates you have added into Cargo.toml start to compile in your terminal.

This will produce a Cargo.lock file in your project. 

This keeps track of the exact versions of the dependencies in your project.


## Sample envrest.json

We provide a default envrest.json file with the following settings: 

* HOST - Host name or IP address of your queue manager

* PORT - HTTP Listener port for your queue manager

* QMGR - Queue manager name

* QUEUE_NAME - Queue name

* CSRFTOKEN - MQ REST CSRF Token

* APP_USER - User name that application uses to connect to MQ

* APP_PASSWORD - Password that the application uses to connect to MQ
 

## Running your project

Navigate to your "src" folder, once inside run this command to start the program.

```
$ cargo run
```
For the POST program user input will be required once the program is running.



 
