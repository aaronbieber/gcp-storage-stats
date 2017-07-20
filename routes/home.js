var express = require('express');
var router = express.Router();

router.get('/', (req, res) => {
  var user;
  if (req.session.passport && req.session.passport.user) {
    user = req.session.passport.user.name;
    console.log(req.session.passport);
  }

  res.render('index', {user: user});
});

module.exports = router;
