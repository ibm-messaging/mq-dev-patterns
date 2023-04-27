# (c) Copyright IBM Corporation 2023
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License. 

#!/bin/bash
set -e

if curl -o com.ibm.mq.allclient-9.3.0.0.jar https://repo1.maven.org/maven2/com/ibm/mq/com.ibm.mq.allclient/9.3.0.0/com.ibm.mq.allclient-9.3.0.0.jar; then
    echo "com.ibm.mq.allclient-9.3.0.0.jar downloaded successfully"
else
    echo "Error downloading com.ibm.mq.allclient-9.3.0.0.jar"
fi

if curl -o javax.jms-api-2.0.1.jar https://repo1.maven.org/maven2/javax/jms/javax.jms-api/2.0.1/javax.jms-api-2.0.1.jar; then
    echo "javax.jms-api-2.0.1.jar downloaded successfully"
else
    echo "Error downloading javax.jms-api-2.0.1.jar"
fi

if curl -o json-20220320.jar https://repo1.maven.org/maven2/org/json/json/20220320/json-20220320.jar; then
    echo "json-20220320.jar downloaded successfully"
else
    echo "Error downloading json-20220320.jar"
fi
