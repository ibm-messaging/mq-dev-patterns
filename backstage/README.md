# IBM MQ for developers on Backstage 

## Setting up backstage
Backstage will run on linux or mac. For windows you create a vm using the Windows Subsystem for Linux. 

The backstage documentation has a [getting started section](https://backstage.io/docs/getting-started/)

## Persistence
The default backstage database is SQLite, an in-memory database. If you want your changes to backstage to persist then you will need to [switch backstage to use PostgreSQL](https://backstage.io/docs/tutorials/switching-sqlite-postgres/).

You can set up postgres in a container. The steps are:
- `podman pull postgres`
- `podman volume create postgredata`
- `podman run -itd -e POSTGRES_USER=ABC -e POSTGRES_PASSWORD=passw0rd -p 5432:5432 -v postgredata:/var/lib/postgresql/data --name postgresql postgres`
    - Where you have set the USER and PASSWORD
- Edit `app-config.yaml` and update the section `:backend :database`, with
    - *client:* pg
    - *connection:*
        - *host:* 127.0.0.1
        - *port:* 5432
        - *user:* ABC
        - *password:* passw0rd


## Registering the MQ components in backstage
To register this component in your backstage deployment, [elect to create an existing component](https://backstage.io/docs/getting-started/register-a-component) and
specify this url `https://github.com/ibm-messaging/mq-dev-patterns/blob/master/backstage/catalog-info.yaml` 

## Making updates to the MQ components
The [catalog-info.yaml](catalog-info.yaml) file in this repo is used to register MQ related catalog entities into Backstage. [Format documention can be found in the backstage documentation](https://backstage.io/docs/features/software-catalog/descriptor-format).

## Github tokens
The code templates require github personal access tokens. Add these to `app-config.local.yaml` eg.

````
integrations:
  github:
    - host: github.com
      token: ghp_456 # this should be the token from gitHub.com
````
