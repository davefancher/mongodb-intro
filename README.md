# Intro to MongoDB

Relational databases have long been the defacto standard for data management. In recent years, a number of competing technologies have started gaining favor. Among these technologies lies MongoDB, a robust document database designed to naturally fit into a variety of development environments. By storing data as documents that reflect the structures as they exist within our applications, MongoDB changes how we approach data storage and retrieval.

Let's explore data management with MongoDB. We'll discuss how collections and the document model require different thought processes than more traditional relational structures. We'll then discuss managing data through CRUD operations and the aggregation pipeline. We'll also look at some performance tuning considerations and even some common schema patterns. At the end of our discussion you should have a solid understanding of some core MongoDB concepts, how MongoDB could fit into your environment, and a foundation for further study.

## Prerequisites

### NPM Packages

Install the NPM packages `npm i`

### MongoDB (Optional if you already have access to MongoDB)

* [Install Docker](https://docs.docker.com/get-docker/)
* Install the  MongoDB container
    * `docker run --name mongodb-local -d -p 27017:27017 mongo:latest`

### MongoDB Tools
* [Install the MongoDB CLI Tools](https://www.mongodb.com/try/download/database-tools)
* (Optional) [Install MongoDB Compass](https://www.mongodb.com/try/download/compass)
* (Optional) [Install the MongDB VS Code Extension](https://www.mongodb.com/docs/mongodb-vscode/install/)

### Sample Data
* [Download the Sample Mflix Archive](https://atlas-education.s3.amazonaws.com/sample_mflix.archive)
* Restore the Sample Mflix Archive
    * `mongorestore --archive={{path to archive}}`