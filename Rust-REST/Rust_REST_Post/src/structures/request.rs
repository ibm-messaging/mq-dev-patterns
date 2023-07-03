use crate::{structures::login::Options, types::ListMQEndpoint};
use base64::encode;

//Implements the structure Request
//Creates functions - Forms part of the Get Client below
//base64 and content_type are both used within the headers for the API request
pub struct Request {
    pub url: String,
    pub base64: String,
    pub content_type: String,
    pub csrftoken: String,
}

impl Request {
    pub fn url(mq: &ListMQEndpoint) -> String {
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
    pub fn base64(mq: &ListMQEndpoint) -> String {
        let user = &mq.list_of_mq_endpoints[0].app_user;
        let pass = &mq.list_of_mq_endpoints[0].app_password;
        let basic_auth = "Basic ".to_string() + &encode(user.clone() + ":" + &pass);
        return basic_auth;
    }
    //Sets correct content type
    pub fn content_type() -> String {
        let content_type = "application/json".to_owned();
        return content_type;
    }
    //Assigns token header
    pub fn csrftoken(mq: &ListMQEndpoint) -> String {
        let csrftoken = &mq.list_of_mq_endpoints[0].csrftoken;
        return csrftoken.to_string();
    }
}
