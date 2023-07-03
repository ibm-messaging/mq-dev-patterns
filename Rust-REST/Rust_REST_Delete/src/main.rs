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

//Imports crates to allow program to utilize functions
mod file;
mod rest_get;
mod structures;
mod types;

use file::handler;
use file::read_mq_config_from_file;
use rest_get::rest_get;

fn main() {
    //Runs parsing function
    let mq_config = read_mq_config_from_file("../envrest.json").unwrap();
    //Starting Function
    //Throws errors such as connection if applicable
    match rest_get(mq_config) {
        Err(e) => handler(e),
        Ok(res) => {
            println!("Status: {}", res.status());
            println!("Headers: \n{:#?}\n", res.headers());
            let body = res.text_with_charset("utf-8");
            match body {
                Ok(body) => {
                    println!("Returned data:\n{:#?}\n", body)
                }
                Err(_) => {
                    println!("Cannot extract message contents.")
                }
            }
            return;
        }
    }
}
