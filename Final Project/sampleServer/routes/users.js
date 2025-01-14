var express = require('express');
const bodyParser = require('body-parser');
var User = require('../models/user');
var passport = require('passport');
var authenticate = require('../authenticate');

const cors = require('./cors');

var router = express.Router();
router.use(bodyParser.json());

/* GET users listing. */
router.options('*', cors.corsWithOptions, (req, res) => { res.sendStatus(200); });
router.get('/', cors.corsWithOptions, function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/signup', cors.corsWithOptions, function(req, res, next){
    User.register(new User({username: req.body.username}),
    req.body.password, (err, user) => {
        if(err){
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.json({err: err});
        }
        else{
            if(req.body.firstname){
                user.firstname = req.body.firstname;
            }
            if(req.body.lastname){
                user.lastname = req.body.lastname;
            }
            user.save((err, user) => {
                if(err){
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.json({err: err});
                    return;
                }
                passport.authenticate('local')(req, res, () => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json({success: true, status: 'Registration Successful!'});
                });
            });
        }
    });
});

// router.post('/login', function(req, res, next){
//     if(!req.session.user){
//         var authHeader = req.headers.authorization;
//         console.log(authHeader);
//
//         if (!authHeader){
//             var err = new Error('You are not authenticated!');
//             console.log(err);
//
//             res.setHeader('WWW-Authenticate', 'Basic');
//             err.status = 401;
//             return next(err);
//         }
//
//         var auth = new Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');
//         console.log(auth);
//
//         var username = auth[0];
//         var password = auth[1];
//         console.log(username);
//         console.log(password);
//
//         User.findOne({username: username})
//         .then((user) => {
//             if(user === null){
//                 var err = new Error('User ' + username + ' does not exist!');
//                 err.status = 403;
//                 return next(err);
//             }
//             else if(user.password !== password){
//                 var err = new Error('Your password is incorrect!');
//                 err.status = 403;
//                 return next(err);
//             }
//             else if(user.username === username && user.password === password){
//                 req.session.user = 'authenticated';
//                 res.statusCode = 200;
//                 res.setHeader('Content-Type', 'text/plain');
//                 res.end('You are authenticated!');
//             }
//         })
//         .catch((err) => next(err));
//     }
//     else{
//         res.statusCode = 200;
//         res.setHeader('Content-Type', 'text/plain');
//         res.end('You are already authenticated!');
//     }
// });

router.post('/login', cors.corsWithOptions, function(req, res, next){
    passport.authenticate('local', (err, user, info) => {
        if(err){
            return next(err);
        }

        if(!user){
            res.statusCode = 401;
            res.setHeader('Content-Type', 'application/json');
            res.json({
                success: false,
                status: 'Login unsuccessful',
                err: info
            });
        }

        req.logIn(user, (err) => {
            if(err){
                res.statusCode = 401;
                res.setHeader('Content-Type', 'application/json');
                res.json({
                    success: false,
                    status: 'Login unsuccessful',
                    err: "Could not login user"
                });
            }

            var token = authenticate.getToken({_id: req.user._id});
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json({
                success: true,
                status: 'Login successful',
                token: token
            });

        });

    }) (req, res, next);
});

router.get('/logout', function(req, res){
    if(req.session){
        req.session.destroy();
        res.clearCookie('session-id');
        res.redirect('/');
    }
    else{
        var err = new Error('You are not logged in!');
        err.statusCode = 403;
        next(err);
    }
});

router.get('/checkJWTToken', cors.corsWithOptions, (req, res) => {
    passport.authenticate('jwt', {session: false}, (err, user, info) => {
        if(err){
            return next(err);
        }

        if(!user){
            res.statusCode = 401;
            res.setHeader('Content-Type', 'application/json');
            return res.json({status: 'JWT invalid!', success: false, err: info});
        }
        else{
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.json({status: 'JWT valid!', success: true, user: user});
        }
    }) (req, res);
});

module.exports = router;
