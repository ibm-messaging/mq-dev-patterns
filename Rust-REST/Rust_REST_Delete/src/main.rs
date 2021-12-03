/*
* (c) Copyright IBM Corporation 2021
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/


//Imports crates to allow program to utilise functions
use reqwest;

use serde::Deserialize;

use std::error::Error;
use std::fs::File;
use std::io::BufReader;
use std::path::Path;

use base64::encode;

//Generates implementations for structs
#[derive(Deserialize, Debug, Clone)]
pub struct MQEndpoint {
    #[serde(rename = "HOST")]
    host: String,

    #[serde(rename = "PORT")]
    port: String,

    #[serde(rename = "CSRFTOKEN")]
    csrftoken: String,

    #[serde(rename = "QMGR")]
    qmgr: String,

    #[serde(rename = "QUEUE_NAME")]
    queue_name: String,

    #[serde(rename = "APP_USER")]
    app_user: String,

    #[serde(rename = "APP_PASSWORD")]
    app_password: String,
}

//Struct to allow access to parsed JSON values
#[derive(Deserialize, Debug, Clone)]
pub struct ListMQEndpoint {
    #[serde(rename = "MQ_ENDPOINTS")]
    list_of_mq_endpoints: Vec<MQEndpoint>,
}

//Trait for giving a type a default value
//struct provides a structure in which to fill out variables
#[derive(Default)]
struct Options {
    hostname: String,
    port: String,
    qmgr: String,
    queue_name: String,
    app_user: String,
    app_pass: String,
}
#[derive(Default)]
struct Request {
    url: String,
    base64: String,
    content_type: String,
    csrftoken: String,
}

//Implements the structure Options
//Creates setting functions - allocates values to variables below
impl Options {

    fn hostname_mut(&mut self) -> &mut String {
        &mut self.hostname
    }
    fn port_mut(&mut self) -> &mut String {
        &mut self.port
    }

    fn qmgr_mut(&mut self) -> &mut String {
        &mut self.qmgr
    }

    fn queue_name_mut(&mut self) -> &mut String {
        &mut self.queue_name
    }

    fn app_user_mut(&mut self) -> &mut String {
        &mut self.app_user
    }

    fn app_pass_mut(&mut self) -> &mut String {
        &mut self.app_pass
    }
}

//Implements the structure Request
//Creates functions - Forms part of the Client below
//base64 and content_type are both used within the headers for the API request
impl Request {
    fn url(mq: &ListMQEndpoint) -> String {
        //Forms start of URL
        let https = "https://".to_owned();
        let api_base = "/ibmmq/rest/v1/";

        //Assigns vector values to variables
        let host = &mq.list_of_mq_endpoints[0].host;
        let port = &mq.list_of_mq_endpoints[0].port;
        let qmgr = &mq.list_of_mq_endpoints[0].qmgr;
        let queue_name = &mq.list_of_mq_endpoints[0].queue_name;
        let app_user = &mq.list_of_mq_endpoints[0].app_user;
        let app_password = &mq.list_of_mq_endpoints[0].app_password;

        //Creates an instance of Options
        //Assigns variable values to mutable setter as string to concatenate
        let mut mq_endpoints = Options::default();
        *mq_endpoints.hostname_mut() = host.to_string();
        *mq_endpoints.port_mut() = port.to_string();
        *mq_endpoints.qmgr_mut() = qmgr.to_string();
        *mq_endpoints.queue_name_mut() = queue_name.to_string();
        *mq_endpoints.app_user_mut() = app_user.to_string();
        *mq_endpoints.app_pass_mut() = app_password.to_string();
        //Forms URL
        let url = https
            + &mq_endpoints.hostname
            + ":"
            + &mq_endpoints.port
            + api_base
            + "messaging/qmgr/"
            + &mq_endpoints.qmgr
            + "/queue/"
            + &mq_endpoints.queue_name
            + "/message";
        return url;
    }
    //Allows authenticaton parameters to be met via encoding
    //Imports user/pass values from json vector
    fn base64(mq: &ListMQEndpoint) -> String {
        let user = &mq.list_of_mq_endpoints[0].app_user;
        let pass = &mq.list_of_mq_endpoints[0].app_password;
        let basic_auth = "Basic ".to_string() + &encode(user.clone() + ":" + &pass);
        return basic_auth;
    }
    //Sets correct content type
    fn content_type() -> String {
        let content_type = "application/json".to_owned();
        return content_type;
    }
    //Assigns token header
    fn csrftoken(mq: &ListMQEndpoint) -> String {
        let csrftoken = &mq.list_of_mq_endpoints[0].csrftoken;
        return csrftoken.to_string();
    }
}

//Sends DELETE Request to destructively remove a message
fn rest_get(
    mq: ListMQEndpoint, //Function expecting Client Result
) -> Result<reqwest::blocking::Response, reqwest::Error> {
    //Creates an instance of Request struct
    //Calls functions passing borrowed variables in assigning to get.url/.base64/.content_type
    let get = Request {
        url: Request::url(&mq),
        base64: Request::base64(&mq),
        content_type: Request::content_type(),
        csrftoken: Request::csrftoken(&mq),
    };
    //Creates instance of ClientBuilder
    let client = reqwest::blocking::Client::builder()
        //Acceptable for samples, but not for general use
        //Invalid Certs sites may transmit cookies over unencrypted HTTP connections
        .danger_accept_invalid_certs(true)
        .build()?;
    //Sends get request and assigns header to Client
    //Delete used as a destructive get
    let res = client
        .delete(get.url)
        .header("Content-type", get.content_type)
        .header("Authorization", get.base64)
        .header("ibm-mq-rest-csrf-token", get.csrftoken)
        .send();

    return res

}

fn read_mq_config_from_file<P: AsRef<Path>>(path: P) -> Result<ListMQEndpoint, Box<dyn Error>> {
    // Open the file in read-only mode with buffer.
    let file = File::open(path)?;

    let reader = BufReader::new(file);

    // Read the JSON contents of the file as an instance of `ListMQEndpoint`.
    let mq_config: ListMQEndpoint = serde_json::from_reader(reader)?;

    // Return the `Vec`.
    Ok(mq_config)
}

//Handles connection error through reqwest crate.
fn handler(e: reqwest::Error) {
    println!("Error is {}", e);
}

fn main() {
    //Runs parsing function
    let mq_config = read_mq_config_from_file("../envrest.json").unwrap();
    //Starting Function
    //Throws errors such as connection if applicable
    match rest_get(mq_config){
        Err(e) => handler(e),
        Ok(res) => {
            println!("Status: {}", res.status());
            println!("Headers: \n{:#?}\n", res.headers());
            let body = res.text_with_charset("utf-8");
            match body {
                Ok(body) => {println!("Returned data:\n{:#?}\n", body)},
                Err(_) => {println!("Cannot extract message contents.")},
            }
            return;
        }
    }
}
