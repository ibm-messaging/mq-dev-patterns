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


export default function MQApiApp({
    endpoint, method,
    onStop = f => f,
    onError = f => f
}) {

    const { loading, messages, error } 
        = useFetch(`https://${endpoint}${method}`);

    const [currMessages, setCurrMessages] = useState([]);

    useEffect(() => {
        let newSet = [];
        if (messages && Array.isArray(messages) && messages.length > 0) {
            newSet = [...messages];
        }

        console.log('New set of messages looks like : ');
        console.log(newSet);

        if (newSet.length < 3 && currMessages.length > 0) {
            let freeSpaces = 3 - newSet.length;
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

    // <div><button onClick={()=>onError('help!')}>Simulate Error</button></div>

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
