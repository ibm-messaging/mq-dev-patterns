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


document.addEventListener('DOMContentLoaded', async function() {            
    let res = await performGetQMAddress();
    let address = res.data;
    if(res.status >=200 && res.status<300) {

    }          
    var addressElement = document.getElementById('mqConsoleBtn').getAttribute('connName');            
    mqConsoleBtn.setAttribute('connName', address);       
});

const openMQConsole = () => {                  
  var address = document.getElementById('mqConsoleBtn').getAttribute('connName');                      
  let URL = `https://${address}:9443/ibmmq/console/login.html`
  window.open(URL, '_blank').focus();
}

const performGetQMAddress = async () => {
  try {
    
    const response = await fetch(`http://localhost:8080/address`);

    if (!response.ok) {
      return { status: false, data: "Some errors occured" };
    }

    const data = await response.json(); 
    return { status: true, data: data.message };
  } catch (err) {
    return { status: false, data: err };
  }
};

const performSend = async (msg) => {
  try {
    const response = await fetch(
      `http://localhost:8080/send?msg=${encodeURIComponent(msg)}`
    );

    if (!response.ok) {
      return { status: false, data: "Some errors occured" };
    }

    const data = await response.json();
    return { status: true, data: data.message };
  } catch (err) {
    return { status: false, data: err.message };
  }
};

const performGet = async () => {
  try {
    const response = await fetch(`http://localhost:8080/recv`);

    if (!response.ok) {
      return { status: false, data: "Some errors occured" };
    }

    const data = await response.json();
    return { status: true, data: data.message };
  } catch (err) {
    return { status: false, data: err };
  }
};

async function sendMessage() {
  const messageInput = document.getElementById("message-input");
  const messageText = messageInput.value.trim();

  if (messageText === "") {
    alert("Please insert a valid message.");
    return;
  }

  const spinner = document.querySelector(".spinner");
  spinner.style.display = "block";
  let res = await performSend(messageText);

  if (res.status === true) {
    addMessage(res.data);
  } else {
    addMessage(res.data);
  }

  spinner.style.display = "none";
}

async function getMessage() {
  const spinner = document.querySelector(".spinner");
  spinner.style.display = "block";
  let msg = await performGet();
  addMessage(msg.data);
  spinner.style.display = "none";
}

const addMessage = (msg) => {
  const chatContainer = document.querySelector(".chat-container");
  const message = document.createElement("div");
  message.className = "message";
  message.textContent = msg;
  chatContainer.appendChild(message);
  chatContainer.scrollTop = chatContainer.scrollHeight;
};