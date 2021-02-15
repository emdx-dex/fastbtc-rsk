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

Open another tab and run `node process/update-status.js` in order to run the update status process.

## Frontend

In a new terminal tab run

* Run `cd frontend`
* Run `npm install`
* Run `cp .env.testnet .env`
* Run `npm run serve`

By default the frontend is served in `http://localhost:5556/`.
