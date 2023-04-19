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

var Mutex = require('async-mutex').Mutex;
let debug_warn = require('debug')('mqapp-deque:warn');

const ABSOLUTE_RUNAWAY_LIMIT = 100;

class DeQueue {
    constructor() {        
        this.array = [];        
        this.mutex = new Mutex();
    }
    
    async push(message) {      
        if (this.array.length > ABSOLUTE_RUNAWAY_LIMIT) {
            debug_warn(`Message stack is dangerously overloaded ${message} ignored`);
            return false;
        }              
        await this.mutex.runExclusive( async () => {      
            this.array.push(message);            
        });
        return true;
    }

    async pop() {        
        return new Promise((resolve, reject) => {
            let deQueue = this;            
            return this.mutex.runExclusive(function() {
                let lastPop = deQueue.array.pop();                
                resolve(lastPop);                
            });            
        });                
    }

    async get(index) {
        await this.mutex.runExclusive( async () => { 
            if (this.array.length < index) {                
                return null;    
            }      
            return this.array[index];            
        });
    }

    async splice(index, count) {
        await this.mutex.runExclusive( async () => {            
            return this.array.splice(index,count);            
        });
    }    

    async _performSearch(appId, index) {
        return new Promise((resolve, reject) => {
            let deQueue = this;                        
            return this.mutex.runExclusive(function() {  
                let pointer = deQueue.array.findIndex( x => x.getAppId() === appId); 
                let result = null;                

                if (pointer >= 0 && (!index)) {                
                    result = deQueue.array[pointer];    
                } else if (index) {                              
                    result = pointer;
                }       

                let resolvedRes = (index) ? result : (result || -1); 
                resolve(resolvedRes);                                               
            });            
        });          
    }

    async findObjectByAppId(appId) {
        return await this._performSearch(appId, false);
    }

    async getIndexByAppId(appId) {
        return await this._performSearch(appId, true);
    }
}

module.exports = {DeQueue};