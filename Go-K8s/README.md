
# Running IBM MQ with KEDA. 

## Contents
1.  [Pre-Requisites](#pre-requisites)
1.  [Install IBM MQ on Cloud](#install-ibm-mq-on-cloud)
1.  [Setting up the Sample App](#setting-up-the-sample-app)
1.  [Optional: Configure message numbers and sleep time](#optional-configure-message-numbers-and-sleep-time)
1.  [Installing KEDA](#installing-keda)
1.  [Running the Demo](#running-the-demo)
1.  [Sample App Limitations](#sample-app-limitations)

## Pre-Requisites
- A [docker hub](https://hub.docker.com/) account.
- Docker desktop running with Kubernetes enabled

## Install IBM MQ on Cloud
1. [Sign Up](https://cloud.ibm.com/registration) for an IBM Cloud Account.
1. Create an [IBM MQ on Cloud](https://cloud.ibm.com/catalog/services/mq?cm_sp=ibmdev-_-developer-tutorials-_-cloudreg) instance on your account.
1. Follow [this guide](https://developer.ibm.com/tutorials/mq-connect-app-queue-manager-cloud/) to:
	1. Create a Queue Manager
	1. Register an application
	1. Generate API and connection credentials

## Setting up the Sample App
1. Clone the Sample App Repo.
1. Create a `secrets.yaml` file inside the `deploy` folder using the following struct:

	```yaml
	apiVersion: v1
	kind: Secret
	metadata:
	  name: ibmmq-secret
	type: Opaque
	data:
	  APP_USER: # Your MQ app username
	  APP_PASSWORD: # Your MQ app password
	  ADMIN_USER: # Your MQ admin username
	  ADMIN_PASSWORD: # Your MQ admin password
	  ```

1. Replace the `APP_USER` `APP_PASSWORD` `ADMIN_USER` and `ADMIN_PASSWORD` fields with the corresponding credentials from your MQ application. The values need to be encoded in a Base64 format.
1. In the `deploy-producer.yaml` and `deploy-consumer.yaml` files, update the environment variables by supplying the `QMGR` `QUEUE_NAME` `HOST` `PORT` `CHANNEL` and `TOPIC_NAME` with the corresponding credentials from your MQ application.

## Optional: Configure message numbers and sleep time
- You can change the number of messages to send by editing the `args` field in the `deploy-producer.yaml` file.
- You can change the time each consumer sleeps before reading in the next message, this is useful for demonstrating scaling. To change the sleep time (in seconds) edit the `args` field in the `deploy-consumer.yaml` file.

## Installing KEDA
- Deploy KEDA 2.0.0 from GitHub:
	```
	kubectl apply -f https://github.com/kedacore/keda/releases/download/v2.0.0/keda-2.0.0.yaml
	```
	
## Running the Demo
1. Apply the secret YAML file:  
	```
	kubectl apply -f deploy/secrets.yaml
	```
1. Run the consumer:  
	```
	kubectl apply -f deploy/deploy-consumer.yaml
	```
	The application should automatically scale to 0, as there are no mesages on the queue. You can confirm this by running `kubectl get hpa` where the number of `replicas` should be 0.
	
1. Run the producer:  
	```
	kubectl apply -f deploy/deploy-producer.yaml
	```
1. Watch as KEDA scales the consumers to handle the message load:
	```
	kubectl get hpa -w
	```
	The consumers should scale up to handle the message load, then return to 0 once all of the messages have been consumed from the queue:
	```
	NAME                      REFERENCE                   TARGETS             MINPODS   MAXPODS   REPLICAS   AGE
	keda-hpa-ibmmq-consumer   Deployment/ibmmq-consumer   <unknown>/5 (avg)   1         30        0          0s
	keda-hpa-ibmmq-consumer   Deployment/ibmmq-consumer   64/5 (avg)          1         30        1          61s
	keda-hpa-ibmmq-consumer   Deployment/ibmmq-consumer   4250m/5 (avg)       1         30        4          2m1s
	keda-hpa-ibmmq-consumer   Deployment/ibmmq-consumer   <unknown>/5 (avg)   1         30        0          3m2s
	```

## Sample App Limitations 

#### IBM MQ Transactional Messaging
This sample supports the basic Put/Get MQ paradigm. If you wish to support more stable message handling and execution involving multiple stages, the [**transactional support**](https://www.ibm.com/support/knowledgecenter/en/SSFKSJ_9.0.0/com.ibm.mq.pro.doc/q023310_.htm) provided by IBM MQ may be of use. Processing is broken down into units of work which are rolled back if errors occur. 

#### Long Running Executions 
If your consumer application has long running or critical processes  that would be in danger of termination when scaling down, there are a number of options to guard against this. These include:
  * A [**configurable cooldown period**](https://github.ibm.com/kazada/sample-app/blob/master/deploy/deploy-consumer.yaml#L74) provided by KEDA in which pods will not be terminated even if there are no further messages to be received. 
  * [**Graceful termination of pods**](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#pod-termination) supported by Kubernetes. This includes grace period settings and container hooks to prevent early termination.
  * Scaling of [**Kubernetes Jobs**](https://keda.sh/docs/2.0/concepts/scaling-jobs/) within KEDA. An individual Kubernetes Job handles each message and will reliably run to completion. 
