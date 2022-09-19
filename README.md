# Development Operations API

## Purpose
The goal of operations API is to simplify the provisioning and maintenance of the kubernetes cluster and other services.

## Manual Setup
Before the API is deployed, there are a number of manual or semi-automated (scripted) steps which must be carried out to initialise the cluster:

- [ ] configure host os (not documented)
- [ ] install docker (not documented)
- [ ] install minikube (not documented)
- [x] start up docker (`npm run start-docker`)
- [x] start up minikube (`npm run start-minikube`)
- [x] start up nginx (`npm run start-nginx`)

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
- [ ] update code to call the correct database host for the provided node
- [x] set up nginx with correct reverse proxy on the development cluster 
- [x] set up basic auth for nginx
- [x] document manual nginx setup process
- [x] implement correct reverse proxy configuration
- [x] setup remote kubectl access

### Medium Term
- [ ] implement POST endpoint for database
- [ ] implement DELETE endpoint for database

### Long Term
- [ ] implement client library (only needed when implementing a consumer that provides a UI)
- [ ] implement asymmetric key encryption for credentials (v2)

## References
UFW: https://www.cyberciti.biz/faq/how-to-open-firewall-port-on-ubuntu-linux-12-04-14-04-lts/
kubectl + nginx: https://faun.pub/accessing-a-remote-minikube-from-a-local-computer-fd6180dd66dd