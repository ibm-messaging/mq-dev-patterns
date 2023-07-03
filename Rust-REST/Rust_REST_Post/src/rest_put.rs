use crate::{body_input, structures::request::Request, types::ListMQEndpoint};
use reqwest;

//Sends PUT Request
pub fn rest_put(
    mq: ListMQEndpoint, //Function expecting Client Result
) -> Result<reqwest::blocking::Response, reqwest::Error> {
    let message_load = body_input();

    //Creates an instance of Request struct
    //Calls functions passing variables in assigning to get.url/.base64/.content_type
    let put = Request {
        url: Request::url(&mq),
        base64: Request::base64(&mq),
        content_type: Request::content_type(),
        csrftoken: Request::csrftoken(&mq),
    };
    //Creates instance of ClientBuilder
    let client = reqwest::blocking::Client::builder()
        //Acceptable for samples, but not for general use
        .danger_accept_invalid_certs(true)
        .build()?;
    //Sends get request and assigns header to Client
    //Post used to send to correct url
    let res = client
        .post(put.url)
        .header("Content-type", put.content_type)
        .header("Authorization", put.base64)
        .header("ibm-mq-rest-csrf-token", put.csrftoken)
        .body(message_load)
        .send();

    return res;
}
