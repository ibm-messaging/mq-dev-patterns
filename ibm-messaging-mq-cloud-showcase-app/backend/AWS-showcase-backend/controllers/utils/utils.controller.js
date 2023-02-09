/**
 * Copyright 2022, 2023 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
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
 **/

const axios = require('axios');
const https = require('https');
const MQClient = require("../../processors/processing-app");
// Set Logging options
let debug_info = require('debug')('mqapp-utilscontroller:info');
let debug_warn = require('debug')('mqapp-utilscontoller:warn');
let mqclient = new MQClient();
//This const is assigned as a deep copy. This means if some changes occure 
// on the mqclient object, this configuration does not change.
const configuration = Object.assign({}, mqclient.getRESTConfiguration());
let HOST = "https://";
const ADMIN = "admin";
const END_POINT_ALL_DEPTHS = `:9443/ibmmq/console/internal/ibmmq/qmgr/QM1/queue?type=qlocal`;
//This get function is used to get the depth of the queues
async function get(req, res) {
    let queryData = req.query;
    let isForSubs = queryData.isForSubs || false;
    //Credential are obtained from the .env file   
    const CREDENTIAL = configuration['CREDENTIAL'];
    const END_POINT = HOST + configuration['HOST'] + END_POINT_ALL_DEPTHS;   
    // creating the REST request
    const axiosCommand = {
        url: END_POINT,
        method: "GET",
        auth: {
            username: ADMIN,
            password: CREDENTIAL['ADMIN_PASSWORD']                
        },
        headers: { //this headers is required 
            'Accept' : 'application/json',       
            'ibm-mq-rest-csrf-token': ''         
        },
        httpsAgent: new https.Agent({  
            rejectUnauthorized: false
        })
    };   
    try {
        //Send the REST request to MQ
        let request = await axios(axiosCommand);   
        // if a valid response has been returned, handle the results
        if (request && request.data) {
            // The result (result.data) is a list of all the queues names (and other info) stored within the queue manager.
            // In this list there are some default queues not needed. The resultAdapter will
            // take only the queue required for the frontend.
            let response = resultAdapter(request.data, isForSubs); 
            //Only the queues needed to the frontend are returned
            return res.json(response);
        } else {
            return res.status(525).send({
                error: "Error on handling response from the API CALL"
            });            
        }
        
    } catch(e) {
        return res.status(525).send({
            error: "Error on handling the API CALL"
        });
    }                                                        
}

//This function filters all the queues returned from the REST call
// and returns only those required.
function resultAdapter(result, isForSubs) {
    let response = [];
    // for each available queue 
    result.map( queue => {       
        //get its name     
        let name = queue['name'];        
        //filter logic
        let isToAppend = ((name.indexOf('DEV.QUEUE') > -1 && !isForSubs) || //getting depths for normal queues
                    (name.indexOf('APP.REPLIES') > -1 && !isForSubs) ) || // getting depths for tmp queues
                    (isForSubs && name.indexOf('SYSTEM.MANAGED.NDURABLE') > -1); //getting depths for subs non-durable queues
        //if the queue is to retur to the frontend
        if (isToAppend) {            
            // for each queue required for the frontend 
            // save its name and current depth as this JSON entry
            let singleQueueEntry = {
                'name': name,
                'depth': queue['currentdepth']
            };
            response.push(singleQueueEntry);
        } 
    })
    // response is a list of "singleQueueEntry" object 
    return response;
}

module.exports = {
    get
};