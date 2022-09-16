# IBM MQ Serverless Samples for AWS Lambda
These REST samples are written in Node.js and have been tested with
a SAM AWS Lambda runtime of `nodejs14.x`.

The application consists of a single Lambda function exposed as an AWS Gateway API,  defined in the `template.yaml`.

## MQ Server Configuration
The application configuration for MQ server is in the `template.yaml` file in the `Environment` `Variables` section. Set `HOSTNAME`, `QM_NAME` etc in for your MQ server.


## Testing locally
These samples can be tested offline locally using the [AWS Serverless Application Model Command Line Interface](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html). Follow the SAM install instructions to install SAM and its pre-requisites. 

You will not need to sign in to AWS to build and test this application. You will need to log into AWS if you want to deploy the application to AWS. Remember to delete any deployments when you no longer need them.

### Building the application
The application is built by running
`sam build`
from a command line in the directory that contains the `template.yaml` file.
This will create a `.aws-sam` directory that contains the application dependencies and build artifacts in the correct format for subsequent testing, packaging and deployment.

Check the `.aws-sam` directory. It should contain a `build/PutMessageFunction` directory containing the application and dependencies.

### Running the application locally
To start the application run
`sam local start-api`
from a command line in the directory that contains the `template.yaml` file.

You should see output similar to:
````
Mounting PutMessageFunction at http://127.0.0.1:3000/putmessage [GET]
You can now browse to the above endpoints to invoke your functions. You do not need to restart/reload SAM CLI while working on your functions, changes will be reflected instantly/automatically. You only need to restart SAM CLI if you update your AWS SAM template
2022-05-05 16:26:29  * Running on http://127.0.0.1:3000/ (Press CTRL+C to quit)

````

The application is exposed as a `GET` on http://127.0.0.1:3000/putmessage. You
can specify the message to post to MQ as a query string eg. http://127.0.0.1:3000/putmessage?msg=Message+from+MQ+Lambda+function


## Deploying the application
Before deploying the application, [configure](https://docs.aws.amazon.com/lambda/latest/dg/configuration-vpc.html) your AWS Lambda VPC to be able to connect to your MQ Server.

Deploy the application by running.
`sam deploy --guided`


## Undeploying the application
Delete the application from AWS when you no longer need it by running.
`sam delete`

Verify that the application and related stack is removed by checking on the AWS console.
