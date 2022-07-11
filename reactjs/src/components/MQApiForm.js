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

import { useInput } from "./MQHooks";

export default function MQApiForm(
    {   endpoint,
        onConfirm = f => f ,
        onCancel = f => f
    }) {

    const confirm = e => {
        e.preventDefault();
        onConfirm({ endpoint : endpointProps.value, 
                    method : '/api/mqget?limit=3' });
    }

    const cancel = e => {
        e.preventDefault();
        onCancel();
    }

    const endpointProps = useInput(endpoint);

    return (
        <form onSubmit={confirm}>
            <div>
                <span>https://</span>
                <input 
                    {...endpointProps}
                    placeholder="endpoint" 
                />
                <span>/api/messages?limit=3</span>
            </div>
            <div>
                <button type="submit">Confirm</button> 
                <button onClick={cancel}>Cancel</button>             
            </div> 
        </form>      
    );
}