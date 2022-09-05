# Development Operations API

## Purpose
The goal of operations API is to simplify the provisioning and maintenance of the kubernetes cluster and other services.

## Manual Setup
Before the API is deployed, there are a number of manual or semi-automated (scripted) steps which must be carried out to initialise the cluster:

- [ ] configure host os (not documented)
- [ ] set up docker (not documented)
- [ ] set up minikube (not documented)
- [x] set up nginx (`npm run start-nginx`)

## API

Prefix: `/development/operations/api/v1`

status | method | endpoint | description
-------|-------|----------|-------------
[ ]  | **POST**   | `/nodes/{nodeName}/databases` | Create a new database.
[ ]  | **DELETE** | `/nodes/{nodeName}/databases/{databaseName}` | Delete a database.
[x]  | **POST**   | `/nodes/{nodeName}/databases/{databaseName}/schemas` | Initialise a new schema in the selected database with two users: an admin and a regular user.
[x]  | **DELETE** | `/nodes/{nodeName}/databases/{databaseName}/schemas/{schemaName}` | Remove the schema and the two related users.

## Work / Next Steps

### Short Term
- [x] implement POST endpoint for database schema
- [x] implement DELETE endpoint for database schema
- [x] configure github action to build docker image
- [x] prepare kubernetes files (deployment, service, etc.)
- [x] decide how to run the deployments to the cluster (using `apply-all.sh`)
- [x] find how to authenticate to github docker registry during deployments ([link](https://kubernetes.io/docs/tasks/configure-pod-container/pull-image-private-registry/))
- [ ] implement tracing logs
- [ ] update code to call the correct host for the provided node

### Medium Term
- [ ] implement POST endpoint for database
- [ ] implement DELETE endpoint for database

### Long Term
- [ ] implement client library (only needed when implementing a consumer that provides a UI)
- [ ] implement asymmetric key encryption for credentials (v2)