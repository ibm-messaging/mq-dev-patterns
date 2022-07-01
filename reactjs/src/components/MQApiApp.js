/**
 * Copyright 2022 IBM Corp.
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

import { useEffect, useState } from "react";
import MQMessageList from "./MQMessageList";
import { useFetch } from "./useFetch";

const MSGLIMIT = 3;


export default function MQApiApp({
    endpoint, method,
    onStop = f => f,
    onError = f => f
}) {

    // The useFetch component will poll the uri, letting this component
    // know when there are new messages or if an error has occured. 
    const { loading, messages, error } 
        = useFetch(`https://${endpoint}${method}`);

    const [currMessages, setCurrMessages] = useState([]);

    // This useEffect is invoked whenever new messages are retured from the 
    // fetch. MSGLIMIT is 3, so we are expecting 0-3 messages to be returned
    // from the fetch, and we will already have 0-3 messages. The logic in
    // this useEffect determines which are the last 3 messages that need to 
    // be shown.
    useEffect(() => {
        let newSet = [];
        if (messages && Array.isArray(messages) && messages.length > 0) {
            newSet = [...messages];
        }

        console.log('New set of messages looks like : ');
        console.log(newSet);

        if (newSet.length < MSGLIMIT && currMessages.length > 0) {
            let freeSpaces = MSGLIMIT - newSet.length;
            let available = currMessages.length;
            let start = available - freeSpaces;

            if (start < 0) {
                start = 0;
            }

            newSet = [...currMessages.slice(start,available) , ...newSet]
            console.log('Modified set of messages looks like : ');
            console.log(newSet);
        }
        
        console.log('new set of messages is ', newSet.length);

        setCurrMessages(newSet);
        console.log('Messages have changed');
    },[messages]);


    return (
        <>
            {error && 
                <pre>{JSON.stringify(error, null, 2)}</pre>
            }
            {loading && !messages &&
                <div>loading messages...</div>
            }            
            {!messages && 
                <div>No messages found.</div>
            }
            {messages && 
                <MQMessageList messages={currMessages}/>
            }
            <div><button onClick={onStop}>Stop</button></div>
        </>
    );

}
