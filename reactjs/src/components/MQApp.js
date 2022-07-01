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

import {useEffect, useState} from "react";
import MQApiApp from "./MQApiApp";
import MQApiForm from "./MQApiForm";
import MQAppSetup from "./MQAppSetup";

// Currently only one configuration key is required, but if we more, eg.
// credentials, or a mechanism to allow a varing number of messages then
// the ALLKeys array and the containsAll function will check if all the
// values the app needs have been provided in the configuration.
const ALLKEYS = ["endpoint"];
const PARAMSKEY = "mq-api-params";

const containsAll = (params, keys) => keys.every(e => params[e]);


export default function MQApp() {
    const [start, setStart] = useState(false);
    const [apiParams, setApiParams] = useState({});
    const [haveConfig, setHaveConfig] = useState(false);
    const [status, setStatus] = useState('');


    // User has hit the confirm button, check if we have all the 
    // configuration settings, if so they the api polling can be started.
    const confirm = (params) => {
        console.log('Confirmed');
        console.log(params);

        if (containsAll(params, ALLKEYS)) {
            setHaveConfig(true);
            console.log('saving params');
            setApiParams(params);
        }    
    }

    const cancel = () => {
        console.log('Cancelled');
        setStart(false);
        setStatus('');
    }

    const stop = () => {
        console.log('Stopped');
        setStart(false);
        setStatus('');
    }

    const config = () => {
        console.log('Configuration');
        setStart(true);
        setHaveConfig(false);
        setStatus('');
    }

    const setErrorMsg = (msg) => {
        setStart(false);
        setStatus(msg);
    }


    // This use effect is only called once on application startup. The
    // configuration values are retrieved from the local storage stash.
    useEffect(() => {
        const rawSavedParams = localStorage.getItem(PARAMSKEY);
        console.log('raw saved params are ', rawSavedParams);
        if (rawSavedParams && 
                rawSavedParams.includes('endpoint') ) {
            const savedParams = JSON.parse(localStorage.getItem(PARAMSKEY));
            if (savedParams) {
                console.log('saved params are ', savedParams);
                setApiParams(savedParams);
            }
        }
    }, []);

    // This use effect is called every time the api parameters are changed.
    // The new values are stored in the local storage stash.
    useEffect(() => {
        if (apiParams && containsAll(apiParams, ALLKEYS)) {
            console.log('Saving params in storage ', apiParams);
            localStorage.setItem(PARAMSKEY, JSON.stringify(apiParams));
        }
    }, [apiParams]);

    // Depending on whether the start button has been pressed and if
    // all the api configuration has been specified, this component will 
    // show one of:
    //  - MQAppSetup component - to start app or change configuration
    //  - MQApiForm component - to edit the configuration
    //  - MQApiApp component - The message polling application
    
    return (
        <section>
            {!start &&
                <MQAppSetup 
                    status={status}
                    onStart={()=>setStart(true)} 
                    onConfig={config}/>
            }

            {start && !haveConfig && 
                <MQApiForm {...apiParams}
                    onConfirm={confirm} 
                    onCancel={cancel}
                />
            }

            {start && haveConfig && 
                <MQApiApp {...apiParams} 
                onStop={stop} 
                onError={(err)=>setErrorMsg(err)}
            /> 
            }

        </section>
    );
}