# Scaling websocket testing through a simple chat application

This is a sample app to demonstrate how to create and scale a websocket application (using node.js and docker-compose). The application is made of several containers:

- nginx (serve statics, load balancer above the node.js containers)
- node.js (application server)
- redis as pub/sub layer between the server containers
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

- <http://localhost:9080> to access the web site
- <http://localhost:9081> to access the Mongo DB admin panel

Once containers are running, right click on container in VS Code to view logs or open a shell. For example, opening a shell on the backend container allows to `npm install` new dependencies, `npm update`... To run eslint:

    npm run lint
    npm run lint -- --fix   # to let eslint provide fixes automatically

## Run locally in production mode

Start/stop the app from the repository root folder:

    docker-compose -f docker-compose.yml up -d
    docker-compose -f docker-compose.yml down

In VSCode, you can simply right-click on `docker-compose.yml` and choose `Compose Up` (or `Compose Restart` or `Compose Down`).

Note that this will not rebuild the images locally: it will use the ones in local cache or download from docker hub if images are more recent. To rebuild local images:

    docker-compose build

## Run locally with multiple server instances

Let's use the magic of Docker Swarm to scale the application container. First, Swarm mode has to be active (all of this can be done on a proper Docker Swarm cluster of course):

    docker swarm init # just run once to intialize your swarm
    docker swarm leave --force # to stop the swarm once testing is over

Then, the services can be started and stopped using the same `docker-compose.yml` file:

    docker stack deploy -c ./docker-compose.yml chat  # start services
    docker stack rm chat  # stop services

`chat` is used here as the stack identifier, which will isolate the set of services together. It will take some time to get the containers started. Status can be followed through VSCode Docker panel, Docker Desktop UI or through the CLI:

    docker stack services chat

Containers communicate through redis (see [architecture diagram](doc/)). Messages can be followed in the server logs.

## CI pipeline

The github workflow is triggered when pushing commits on github: it automatically builds and publishes images to github container repository.

- [sfidanza/chat-frontend](https://github.com/sfidanza/sharks/pkgs/container/chat-frontend)
- [sfidanza/chat-backend](https://github.com/sfidanza/sharks/pkgs/container/chat-backend)

## References

- <https://hackernoon.com/scaling-websockets-9a31497af051>
- <https://tsh.io/blog/how-to-scale-websocket/>
- Server is applying a 60s timeout on websocket connections. Keepalive mechanism is inspired from:
  <https://www.npmjs.com/package/ws#how-to-detect-and-close-broken-connections>

## Todo

- Add responsive design to support mobiles
- Add login
- Fix /list-users (only listing users of current pod)
