const _ = require('lodash');
const { registerAddress } = require('../../utils/blocknative');
const express = require('express');

const router = express.Router();

require('dotenv').config();

router.post('/', async (req, res) => {
  const address = req.body.address;

  // TODO: Validate this is a bitcoin address.
  if (_.isEmpty(address)) {
    return res.status(400).json({
      error: '\'address\' is a required parameter.'
    });
  }

  try {
    const msg = await registerAddress(address);

    return res.json({ data: msg });
  } catch (error) {
    return res.status(500).json({ error });
  }
});

module.exports = router;
