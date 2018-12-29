var express = require('express');
var router = express.Router();
var users=require('./users');
var status_codes=require('../res_status/status-codes.json');
var passport=require('passport');
var test= require('./test');

/* GET home page. */
router.get('/', function(req, res, next) {
 // console.log("start server--"+req.headers.host);
  res.status(200).json(status_codes.working);
});

router.post('/user/signup',users.new_user_signup);
router.post('/user/login',users.user_login);
router.post('/subscriptionlist',users.subscription_list);
router.post('/user/subscribepack',users.subscribe_pack);
router.post('/team/registration',users.new_team_registration);
router.post('/teamlist',users.teams_list);
router.post('/parameterlist',users.parameters_list);

router.post('/user/forgotpassword',users.user_forgot_password);
router.post('/user/changepassword',users.user_change_password);
router.post('/seasoncategorylist',users.season_category_list);
router.post('/invitecoaches',users.invite_coaches);
router.post('/addseason',users.add_new_season);
router.post('/team/asignseason',users.asign_season);
router.post('/user/notificationslist',users.user_notifications_list);
router.post('/user/updateprofile',users.update_user_profile);
router.post('/userlist',users.users_list);
router.post('/addparameters',users.add_parameters);
router.post('/user/profile',users.profile_info);

router.post('/user/createteam',users.createNewTeam);
router.post('/user/parameter',users.selectParameter);
router.post("/t",test);
module.exports = router;
