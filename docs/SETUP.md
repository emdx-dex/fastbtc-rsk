# SETUP

## Prerequisites

### Clone the project

```
git clone git@github.com:emdx-dex/fastbtc-rsk.git
```

### Install the following dependencies:

* NodeJS
* NPM
* MongoDB

## Backend

In your terminal run

* Run `cd backend`
* Run `npm install`
* Run `cp .env.testnet .env`
* Run `node index.js`

Open another tab and run `node process/index.js` in order to run the update status process.

## Frontend

### For run VUEjs on devmode

In a new terminal tab run

* Run `cd frontend`
* Run `npm install`
* Run `cp .env.testnet .env`
* Run `npm run serve`

### For production ready assets

In a new terminal tab run

* Run `cd frontend`
* Run `npm install`
* Run `cp .env.testnet .env`
* Run `npm run build`

By default the frontend is served in `http://localhost:5556/`.


### Production PM2 setup

#### Backend server

In order to run backend server with pm2:

* `cd backend`
* `pm2 start "node index.js" --name "SOME_NAME"`

#### Oder update process

In order to run order-update process:

* `cd backend`
* `pm2 start "node process/index.js" --name "SOME_NAME"`

#### Useful commands

Some useful commands to interact with pm2:

* To view process list: `pm2 list`
* To monit process consumption: `pm2 monit`
* To stop/restart process: `pm2 stop/restart <id>`
* To view ALL logs: `pm2 logs`
* To view <id> process logs: `pm2 logs <id>`
* To flush log history: `pm2 flush`
* To save current process configuration and enable them on startup:

```
pm2 startup
pm2 save
```