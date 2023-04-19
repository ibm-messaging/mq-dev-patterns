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

 const { Subscriber } = require("../../models/Subscriber");
 const { Publisher } = require("../../models/Publisher");
 const { DeQueue } = require("../../models/DeQue");
 
 
 //Set Logging options
 let debug_info = require('debug')('mqapp-pubsubcontroller:info');
 let debug_warn = require('debug')('mqapp-pubsubcontroller:warn');
 let subscribers = new DeQueue();
 let publishers = new DeQueue();
 let isPublishing = false;
 
 // This function:
 // 1) subscribes an applicaiton which has not been already scubscribed
 // 2) re-subscribes an application which has been aleady subscribed
 async function sub(req, res, next) { 
    let querydata = req.body;    
    let appId = querydata.appId;
    let topic = querydata.topic;

    if (!appId || !topic) { 
        return res.status(500).send({
            error : "sub : please provide valid inputs"
        });
    }
    
    let subscriber = await subscriberObjectAleadyExistingFromAppId(appId);  
    // if the application has been aleady subscribed
    if (subscriber !== -1) {  
        // get the subscriber object
        let subscriberIndex = await subscriberIndexAleadyExistingFromAppId(appId); 
        debug_info(`Subscriber found at index ${subscriberIndex}`);
        // remove from our list before disabling the connection, so that don't have
        // condition where we have a breaking connection in our list.
        await subscribers.splice(subscriberIndex, 1);
        // refresh the application subscription
        debug_info("Refreshing the subscription");

        subscriber.deleteSubscription()
        .then(async () => {   
            subscriber.makeSubscription(topic)
            .then(async (res_) => {  
                //subsription refreshed successfuly
                await subscribers.push(subscriber);                    
                return res.json({
                    status : "Sub changed"
                })
            })
            .catch((err) => {        
                return res.status(500).send({
                    error : err
                });
            }); 
        });        
    } else {
        debug_info(`New Subscriber for topic ${topic} with appID ${appId}`); 
        //creating a new subscriber
        let newSub = new Subscriber(appId); 

        if (newSub == null) {
            debug_warn("Error creating new subscriber!")
            return res.json({
                status : "Error creating new subscriber"
            });
        }
        await subscribers.push(newSub);

        //create the new subscrption
        newSub.makeSubscription(topic)
        .then((res_) => {                   
            debug_info("Returning 250 due to the new sub created");
            return res.status(250).send({
                status : "Subscribed"
            })
        })
        .catch((err) => {  
            debug_warn(`Error on make subscription ${err}`);      
            return res.status(500).send({
                error : err
            });
        });
    }
}
 
//This function unsubscribe a subscriber from its applicationId
async function unsub(req, res, next) {
    let querydata = req.query;    
    let appId = querydata.appId;  

    if (!appId) { 
        return res.status(500).send({
            error : "Please provide a valid appId"
        });
    }   

    let subscriber = await subscriberObjectAleadyExistingFromAppId(appId);        
    //If the subscriber does not exist
    if (subscriber === -1) {
        return res.status(500).send({
            error : "The requested sub does not exist."
        });        
    }    

    let subscriberIndex = await subscriberIndexAleadyExistingFromAppId(appId); 
    debug_info(`Subscriber found at index ${subscriberIndex}`);

    //delete subscribtion 
    subscriber.deleteSubscription()            
    .then(async () => {
        await subscribers.splice(subscriberIndex,1);
        //Success on unsub
        res.json({
            status : "Unsubscribed"
        });
    })
    .catch((err) => {
        debug_warn(`Error on unsubscribe ${err}`);
        res.status(500).send({
            error : "An error occured on unsubscribing"
        });
        console.log(err);
    }); 
}

//This function:
//1) If the application provided is an existing subscriber this function returns the last message availbable for the topic provided
//2) If the application provided is not a subscriber this function subscribes it to the toic provided
async function getLastSubMessage(req, res, next) {
    let querydata = req.body;    
    let appId = querydata.appId;
    let topic = querydata.topic;

    if (!appId || !topic ) { 
        return res.status(500).send({
            error : "Please provide valid inputs"
        });
    }

    let subscriber = await subscriberObjectAleadyExistingFromAppId(appId);        
    //if the subscriber exits get the last message available for the topic provided
    if (subscriber !== -1) {
        debug_info("This is an existing subscriber, looking for message");  
        //get the last message for the topic provided
        subscriber.getMessages(1)
        .then((_lastMessage) => {
            debug_info(`returning last message ${_lastMessage}`);
            debug_info(_lastMessage);
            return res.json({_lastMessage});
        });   
    } else { 
        // Since this application is not subscribed to the topic provided yet,
        // we create a new subscriber rather than looking for messages.
        let newSub = new Subscriber(appId);
        await subscribers.push(newSub);
        //creating a new subscription
        newSub.makeSubscription(topic)
        .then((res_) => {        
            // This status code 250 is a non-standard code. 
            // It is used by the frontend to understand that this function did subscribe
            // the app to the topic provided rather than returning a message.
            debug_info("Returning 250 due to the new sub created");
            return res.status(250).send({
                status : "Subscribed"
            });
        })
        .catch((err) => {  
            debug_warn(`Error on make subscription ${err}`);      
            return res.status(500).send({
                error : err
            });
        }); 
    } 
}

// This function publish a message to a topic.
async function pub(req, res, next) {   
    let data = req.body;
    let topic = data.topic;
    let _message = data.message || 'Default Message from pubsub'
    let _quantityString = data.quantity || "1";
    let quantity = parseInt(_quantityString);
    let appId = data.appId;

    if (!appId || !topic || !quantity) {
        return res.status(500).send({
            error : "Please provide valid inputs"
        });
    }

    if ( quantity < 0 ) {
        debug_info('negating the negative quantity provided!');
        quantity *= -1; 
    } else if (quantity === 0) {
        quantity = 1;
    } 
    
    let publisher = await publisherObjectAleadyExistingFromAppId(appId);  
    //if the pub is already existing and at we are not publishing
    if(publisher !== -1 && !isPublishing) {
        //Set this published as busy
        isPublishing = true;
        //Publish the message
        publisher.publishMessages(topic, quantity, _message)
        .then((pubRes) => {
            debug_info(`publishMessage response is ${pubRes}`);     
            isPublishing = false;   
            return res.json(pubRes);
        })
        .catch((err) => {
            debug_warn(`publishMessage error is ${err}`);
            isPublishing = false;
            return res.status(500).send({
                error : err
            });
        })

    } else if(!isPublishing) { //if there are not publishers and we are not in a middle of a publishing transaction
        //Set that we are publishing
        isPublishing = true;        
        //create a new publisher
        let newPub = new Publisher(appId, topic);

        if (newPub === null) {
            debug_warn("Error creating new publisher!")
            return res.json({
                status : "Error creating new publisher"
            });
        }

        //Add the publisher to the list of publishers
        await publishers.push(newPub);
        //Publish the message
        newPub.publishMessages(topic, quantity, _message)
        .then((pubRes) => {            
            debug_info(`publishMessage response is ${pubRes}`);        
            //The publishing transaction has been completed
            isPublishing = false;
            return res.json(pubRes);
        })
        .catch((err) => {
            debug_warn(`publishMessage error is ${err}`);
            isPublishing = false;
            return res.status(500).send({
                error : err
            });
        }); 
        
    } else {
        isPublishing = false;
        return res.json(null);
    }      
}
//This function returns a subscriber object from its appId
async function subscriberObjectAleadyExistingFromAppId(appId) {    
    return await subscribers.findObjectByAppId(appId)
    .then((subscriber) => subscriber)        
    .catch((err) => {
        debug_warn(`Error on looking for the subscriber ${appId}`);
        return -1;
    });
}
//This function returns the subscriber array index from its appId
async function subscriberIndexAleadyExistingFromAppId(appId) {    
    return await subscribers.getIndexByAppId(appId)
    .then((subscriber) => subscriber)        
    .catch((err) => {
        debug_warn(`Error on looking for the subscriber ${appId}`);
        return -1;
    });
}
// This function return a publisher object from its appId
async function publisherObjectAleadyExistingFromAppId(appId) {    
    return await publishers.findObjectByAppId(appId)
    .then((subscriber) => subscriber)        
    .catch((err) => {
        debug_warn(`Error on looking for the subscriber ${appId}`);
        return -1;
    });
}
 
module.exports = {
    sub,
    unsub,
    pub,    
    getLastSubMessage
};