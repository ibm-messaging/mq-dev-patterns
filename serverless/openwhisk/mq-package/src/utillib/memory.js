/**
 * Copyright 2021 IBM Corp.
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

const openwhisk = require('openwhisk');


// This class is acting as the persistent storage manager.
// It interfaces with the underlying cloudant database using Cloudant
// openwhisk actions.
class MQMemory {

  constructor(db, key) {
    this._db = db;
    this._key = key;
  }

  check() {
    console.log("Memory function invoked");
  }

  readPersistMemory() {
    let ow = openwhisk();
    return new Promise((resolve, reject) => {
      console.log("Seeing if record already exisits in persitent storage");
      ow.actions.invoke({
            name: 'mqCloudant/read-document',
            blocking: true,
            result: true,
            params: {
              dbname: this._db,
              id: this._key
            }
        })
        .then((result) => {
          console.log("Memory document Found");
          console.log(result);
          resolve(result);
        })
        .catch((err) => {
          console.log("Error retrieving memory document");
          console.log(err.statusCode);
          console.log(err);
          resolve({});
        });
    });
  }


  updatePersistMemory(doc, regTriggers) {
    let ow = openwhisk();
    return new Promise((resolve, reject) => {
      console.log("Updating document in persitent storage");
      doc.mqtriggers = regTriggers;
      ow.actions.invoke({
            name: 'mqCloudant/update-document',
            blocking: false,
            result: true,
            params: {
              dbname: this._db,
              doc: doc
            }
        })
        .then((result) => {
          console.log("Memory document updated in DB");
          console.log(result);
          resolve(result);
        })
        .catch((err) => {
          console.log("Error updating document in DB");
          console.log(err.statusCode);
          console.log(err);
          resolve({});
        });
    });
  }


  createPersistMemory(regTriggers) {
    let ow = openwhisk();
    return new Promise((resolve, reject) => {
      console.log("Saving document to persitent storage");
      ow.actions.invoke({
            name: 'mqCloudant/create-document',
            blocking: false,
            result: true,
            params: {
              dbname: this._db,
              doc: {
                _id: this._key,
                name: this._key,
                mqtriggers : regTriggers
              }
            }
        })
        .then((result) => {
          console.log("Memory document created in DB");
          console.log(result);
          resolve(result);
        })
        .catch((err) => {
          console.log("Error creating document in DB");
          console.log(err.statusCode);
          console.log(err);
          resolve({});
        });
    });
  }


  persistMemory(regTriggers) {
    return new Promise((resolve, reject) => {
      this.readPersistMemory()
      .then((result) => {
        if (Object.keys(result).length > 0) {
          console.log("We have document from db");
          console.log(result);
          return this.updatePersistMemory(result, regTriggers);
        } else {
          console.log("No document from db");
          return this.createPersistMemory(regTriggers);
        }
      }).then((result) => {
        resolve({});
      }).catch((err) => {
        console.log("Error in db document process");
        resolve({});
      });
    });
  }

}

module.exports = MQMemory;
