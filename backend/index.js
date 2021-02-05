const { listenRBTCSwapOut, swapIn } = require('./rsk/index');
const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');
const fs = require('fs');
const logger = require('morgan');

require('dotenv').config();

if (!fs.existsSync('./logs')) {
  console.log('[+] logs folder created');

  fs.mkdirSync('./logs');
}

const errorLogStream = fs.createWriteStream(`${__dirname}/logs/error.log`, { flags: 'a' });

process.on('uncaughtException', (err) => {
  const date = new Date();

  console.error(`+++++++ ${date} error found, logging event +++++++`);
  console.error(err.stack);

  errorLogStream.write(`${date} \n ${err.stack} \n\n`);
});

const accessLogStream = fs.createWriteStream(`${__dirname}/logs/access.log`, { flags: 'a' });

const app = express();

app.use(logger('combined', {
  stream: accessLogStream
}));

app.set('json spaces', 2);
app.use(logger('dev'));
app.use(cors());
app.use(bodyParser.json());

require('./utils/connection');

listenRBTCSwapOut();

(async function () {
  try {
    const response = await swapIn('0x8e5095532979FfDa5e9Dc692628A3Fa032d3b47C', '0.0001');

    console.log(response);
  } catch (error) {
    console.log(error);
  }
}())





//Routes
const order = require('./apis/order');
const webhooks = require('./apis/webhooks');

order(app);
webhooks(app);

app.listen(process.env.PORT, () => {
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Server URL: ${process.env.SERVER_URL}`);
  console.log(`Example app listening on port: ${process.env.PORT}`);
});

module.exports = app;
