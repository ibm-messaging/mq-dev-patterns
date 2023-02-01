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


$(document).ready(() => {
  console.log("Page is loaded");
  mqPageOps.handlersUI();
  mqPageOps.initialiseFields();
})

function MQPageOps () {}
var mqPageOps = new MQPageOps();

mqPageOps.handlersUI = function() {
  mqPageOps.handlersput();
  mqPageOps.handlersget();
}

mqPageOps.handlersput = function() {
  $('button#mqputbutton').click(function(event) {
    let message = $('input#message').val();
    let quantity = $('input#quantity').val();
    let status = "Submitting the message " + message + " " + quantity + " times";
    $('span#status').text(status);
    let data = {};
    data.message = message;
    data.quantity = quantity;
    console.log("performing Put Request for ", data);
    $.ajax({
      type: 'POST',
      url: '/api/mqput',
      data: data,
      success: mqPageOps.postOK,
      error: mqPageOps.notOK
    })
    event.preventDefault();
  });
}


mqPageOps.handlersget = function() {
  $('button#mqgetbutton').click(function(event) {
    let quantity = $('input#quantity').val();
    let status = "Getting " + quantity + " messages";
    $('span#status').text(status);
    let data = {};
    data.limit = quantity;
    console.log("performing Get Request for ", data);
    $.ajax({
      type: 'GET',
      url: '/api/mqget',
      data: data,
      success: mqPageOps.getOK,
      error: mqPageOps.notOK
    })
    event.preventDefault();
  });
}

mqPageOps.postOK = function(response) {
  console.log('API response is : ', response)
  let status = 'Message(s) sent sucessfully';
  if (response.status) {
    status = response.status;
  }
  console.log(status);
  $('span#status').text(status);
}

mqPageOps.getOK = function(response) {
  console.log('API response is : ', response)
  let status = 'Message(s) received sucessfully';
  if (response.status) {
    status = response.status;
  }
  console.log(status);

  if (response && Array.isArray(response)) {
    if (response.length > 0) {
      response.forEach(function(m){
        console.log(m);
        mqPageOps.appendToTable(m);
      });
      $('#results').show();
      $('#secondhr').show();
    } else {
      status = 'No Messages found';
    }
  } else {
    status = 'Response in unexpected format';
  }
  $('span#status').text(status);
}

mqPageOps.appendToTable = function (m) {
  let message = m.Message;
  let count = m.Count;
  newRow = mqPageOps.createNewRow(message, count);
  $('#messages').append(newRow);
}

mqPageOps.createNewRow = function(message, count) {
  return $(`<tr> <td>${message}</td> <td>${count}</td> </tr>`);
}

mqPageOps.notOK = function(err) {
  let status = 'REST API Call failed ';
  if (err.statusText) {
    status += err.statusText;
  }
  console.log('REST API Call failed : ', err);
  $('span#status').text(status);
}

mqPageOps.initialiseFields = function() {
  $('span#status').text("Will go here");
  $('#results').hide();
  $('#secondhr').hide();
}
