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

import { useState, useEffect, useRef } from "react";
import { useMountedRef } from "./useMountedRef";

export function useFetch(uri) {
  const [messages, setMessages] = useState();
  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [msgURI] = useState(uri);
  const tickInterval = useRef();

  const isMounted = useMountedRef();


  // The tick is invoked periodically. 
  // Before running a fetch, this function determines if the component is 
  // currently mounted. For this Ref is used instead of State. If the 
  // component is no longer mounted the interval is cleared.
  const tick = () => {
      console.log('time to run something');
      if (!isMounted.current) {
          console.log('Not mounted');
          if (tickInterval.current) {
            console.log('Clearing interval ', tickInterval.current);
            clearInterval(tickInterval.current);
            tickInterval.current = 0;
          }
      } else {
        console.log('Still mounted, so continuing');

        if (!loading && msgURI) {
            setLoading(true);
            console.log('msgURI is ', msgURI);
            console.log('Starting fetch of messages');
            fetch(msgURI)
            .then(rep => {console.log('Have data from fetch'); return rep.json();})
            .then(setMessages)
            .then(() => setLoading(false))
            .catch((err) => {
                setLoading(false); 
                console.log('error fetching ', err);
                setError(err);
            });
        } else if (msgURI) {
            console.log('Still waiting on response from previous fetch');
        } else {
            console.log('msgURI not set');
        }
      }
  }

  // This useEffect starts the interval which will invoke the fetch
  // periodically.
  useEffect(() => {
    if (!uri) return;
    if (!isMounted.current) return;

    if (!tickInterval.current) {
        console.log('starting ticker');
        tickInterval.current = setInterval(tick, 10000);
        console.log('ticker is ', tickInterval.current);
    }
  }, [uri]);

  return {
    loading,
    messages,
    error
  };
}