# Scaling websocket testing through a simple chat application

This is a sample app to demonstrate how to create and scale a websocket application (using node.js and docker-compose). The application is made of several containers:

- nginx (serve statics, load balancer above the node.js containers)
- node.js (application server)
- MongoDB
- mongo-express for DB administration

Target:

- Demonstrate a sample chat app with one server container
- Scale it with multiple server containers

## Run locally in dev mode

To start/stop the app locally in dev mode, simply run:

    docker-compose up -d --build
    docker-compose down

This will implicitly use `docker-compose.override.yml`, which adds support for debugging and maps the local source files into the containers so you can edit the source live. Two ports are exposed:

- <http://localhost:8080> to access the web site
- <http://localhost:8081> to access the Mongo DB admin panel

## Run locally in production mode

Start/stop the app from the repository root folder:

    docker-compose -f docker-compose.yml up -d
    docker-compose -f docker-compose.yml down

Note: in VSCode, you can simply right-click on `docker-compose.yml` and choose `Compose Up` (or `Compose Restart` or `Compose Down`).

## Run locally with multiple server instances

Let's use the magic of Docker Swarm to scale the application container. First, Swarm mode has to be active (all of this can be done on a proper Docker Swarm cluster of course):

    docker swarm init # just run once to intialize your swarm
    docker swarm leave # to stop the swarm once testing is over

Then, the services can be started and stopped using the same `docker-compose.yml` file:

    docker stack deploy -c .\docker-compose.yml chat  # start services
    docker stack rm chat  # stop services

`chat` is used here as the stack identifier, which will isolate the set of services together. It will take some time to get the containers started. Status can be followed through VSCode Docker panel, Docker Desktop UI or through the CLI:

    docker stack services chat

Obviously, with this setup, users can not talk correctly with each others anymore, as each server only knows users connected to itself. We need a communication mechanism between servers as well.

## Publish to dockerhub

TODO: setup a dockerhub repository for each image with auto-build on commit:

- [sfidanza/chat-frontend](https://hub.docker.com/repository/docker/sfidanza/chat-frontend)
- [sfidanza/chat-backend](https://hub.docker.com/repository/docker/sfidanza/chat-backend)

## References

- <https://hackernoon.com/scaling-websockets-9a31497af051>
- <https://tsh.io/blog/how-to-scale-websocket/>
