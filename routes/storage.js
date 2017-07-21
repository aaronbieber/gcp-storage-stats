const config = require('app/config');
const express = require('express');
const router = express.Router();
const storage = require('app/storage');
const moment = require('moment');

router.get('/async', (req, res) => {
  res.render('async');
});

router.get('/files', (req, res) => {
  if ('x-appengine-cron' in req.headers
      || (req.session.passport
          && req.session.passport.user)
      || config.env == 'development') {

    var shouldSendMessage = false;
    if ('x-appengine-cron' in req.headers
        || ('sendSMS' in req.query
            && req.query.sendSMS == 1)) {
      shouldSendMessage = true;
    }

    console.log('Starting the file traversal...');
    var startTime = moment(Date.now());
    storage.storageList().then((data) => {
      var endTime = moment(Date.now());
      var duration = moment.duration(endTime.diff(startTime)).humanize();
      console.log('File traversal completed in ' + duration + '.');

      if (shouldSendMessage) {
        storage.sendMessage(data)
          .catch((err) => {
            console.log(err);
            res.status(500).send(err);
          });
      }

      return data;
    }).then((data) => {
      res.status(200).send(data);
    }).catch((err) => {
      console.log(err);
      res.status(500).send(err);
    });
  } else {
    res.status(401).send('<h1>Not Authorized</h1>');
  }
});

module.exports = router;
