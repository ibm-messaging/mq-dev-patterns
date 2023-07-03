use serde::Deserialize;

//Generates implementations for structs
#[derive(Deserialize, Debug, Clone)]
pub struct MQEndpoint {
    #[serde(rename = "HOST")]
    pub host: String,

    #[serde(rename = "PORT")]
    pub port: String,

    #[serde(rename = "CSRFTOKEN")]
    pub csrftoken: String,

    #[serde(rename = "QMGR")]
    pub qmgr: String,

    #[serde(rename = "QUEUE_NAME")]
    pub queue_name: String,

    #[serde(rename = "APP_USER")]
    pub app_user: String,

    #[serde(rename = "APP_PASSWORD")]
    pub app_password: String,
}

//Struct to allow access to parsed JSON values
#[derive(Deserialize, Debug, Clone)]
pub struct ListMQEndpoint {
    #[serde(rename = "MQ_ENDPOINTS")]
    pub list_of_mq_endpoints: Vec<MQEndpoint>,
}
