use crate::{structures::request::Request, types::ListMQEndpoint};
use reqwest;

//Sends DELETE Request to destructively remove a message
pub fn rest_get(
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

    return res;
}
