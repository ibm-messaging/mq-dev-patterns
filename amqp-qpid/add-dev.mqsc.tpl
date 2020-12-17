* © Copyright IBM Corporation 2020
*
*
* Licensed under the Apache License, Version 2.0 (the "License");
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

* These are additional MQSC Settings for AMQP
* defining developer channel authentication rules for AMQP

* Developer authority records
* Modification of an existing container setting
* to switch on ALTUSR for GET on Queues to work
SET AUTHREC PRINCIPAL('app') OBJTYPE(QMGR) AUTHADD(CONNECT,INQ,ALTUSR)

SET CHLAUTH('SYSTEM.DEF.AMQP') TYPE(ADDRESSMAP) ADDRESS('*') USERSRC(CHANNEL) CHCKCLNT({{ .ChckClnt }}) DESCR('Allows connection via APP channel') ACTION(REPLACE)

SET AUTHREC PROFILE('SYSTEM.BASE.TOPIC') PRINCIPAL('app') OBJTYPE(TOPIC) AUTHADD(PUB,SUB)
SET AUTHREC PROFILE('SYSTEM.DEFAULT.MODEL.QUEUE') PRINCIPAL('app') OBJTYPE(QUEUE) AUTHADD(PUT,DSP)

ALTER CHANNEL(SYSTEM.DEF.AMQP) CHLTYPE(AMQP) MCAUSER('app')

* Start AMQP service
START SERVICE(SYSTEM.AMQP.SERVICE)
START CHANNEL(SYSTEM.DEF.AMQP)
