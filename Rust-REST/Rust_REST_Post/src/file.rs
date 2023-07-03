use serde_json;
use std::error::Error;
use std::fs::File;
use std::io;
use std::io::BufReader;
use std::path::Path;

use crate::types::ListMQEndpoint;

pub fn read_mq_config_from_file<P: AsRef<Path>>(path: P) -> Result<ListMQEndpoint, Box<dyn Error>> {
    // Open the file in read-only mode with buffer.
    let file = File::open(path)?;
    let reader = BufReader::new(file);

    // Read the JSON contents of the file as an instance of `User`.
    let mq_config: ListMQEndpoint = serde_json::from_reader(reader)?;

    // Return the `User`.
    Ok(mq_config)
}

//Takes user input to be added to the body of the API request
pub fn body_input() -> String {
    println!("Insert Body Text: ");
    let mut body = String::new();
    match io::stdin().read_line(&mut body) {
        Ok(_) => {
            println!("Message: {}", body);
        }
        Err(error) => println!("error: {}", error),
    }
    return body;
}

//Handles connection error supported by reqwest crate.
pub fn handler(e: reqwest::Error) {
    println!("Error is {}", e);
}
