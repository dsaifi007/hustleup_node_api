var connection=require('./../config/mysql_conn');
var validation=require('./../validations/data-validations');
var status_codes=require('./../res_status/status-codes');
var encryption=require('./../data-encryption/encryption');
var reg_email=require('./../send_email_functions/registration-email');
var moment=require('moment');
var randomstring=require('randomstring');
var jwt = require('jsonwebtoken');
var fs=require('fs');

//Only For Headcoches
function new_user_signup(req, res) {
       //console.log("user data=="+JSON.stringify(req.body));
        var userData=req.body;
        if(validation.isEmptyObject(userData)){
            res.status(200).json(status_codes.no_data_found);
        }
        else{
            var email=userData.email;
            if(!validation.isFound(email)){
                res.status(200).json(status_codes.email_missing);
            }
            else{
                if(!validation.isValidEmailId(email)){
                    res.status(200).json(status_codes.invalid_email);
                }
                else{
                    email=email.toLowerCase();
                    userData.email=(userData.email).toLowerCase();
                    isUserExist(email,function(err,user){
                       if(err){
                           console.log(err);
                           res.status(200).json(status_codes.db_error_0001);
                       }
                       else{
                           //console.log("user="+JSON.stringify(user));
                           if(validation.isEmptyObject(user)){             //User can register
                               var pwd=userData.password;
                               if(!validation.isFound(pwd)){
                                   res.status(200).json(status_codes.password_missing);
                               }
                               else{
                                   var encryted_pwd=encryption.encrypt_password(pwd);
                                   userData.password=encryted_pwd;
                                   userData.roleId=2;     //For HeadCoach
                                   userData.createdAt=moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
                                   userData.updatedAt=moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
                                   connection.query('INSERT INTO ht_user_registration SET ?', userData, function (error, results, fields) {
                                       if(error){
                                           console.log(error);
                                           res.status(200).json(status_codes.db_error_0001);
                                       }
                                       else{
                                           reg_email.send_registration_email(userData,pwd);
                                           res.status(200).json(status_codes.account_created);
                                       }
                                   });
                               }
                           }
                           else{
                               res.status(200).json(status_codes.user_already_exist);
                           }
                       }
                    });
                }
            }
        }
}

function isUserExist(email,callback){
    email=email.trim();
    connection.query("Select * from ht_user_registration where email='"+email+"'", function (err, rows) {
        if(err){
            console.log(err);
            callback(true,err);

        }else{
            if(rows.length>0){
                var user=rows[0];
                callback(false,user);
            }
            else{
                callback(false,{});
            }
        }
    });
}

function user_login(req, res) {
   // console.log("login data=="+JSON.stringify(req.body));
    var loginData=req.body;
    if(validation.isEmptyObject(loginData)){
        res.status(200).json(status_codes.no_data_found);
    }
    else{
        if(validation.isFound(loginData.roleId)){
            var userName=loginData.userName;
            if(!validation.isFound(userName)){
                res.status(200).json(status_codes.username_missing);
            }
            else{
                var pwd=loginData.password;
                if(!validation.isFound(pwd)){
                    res.status(200).json(status_codes.password_missing);
                }
                else{
                    var encryted_pwd=encryption.encrypt_password(pwd);
                    loginData.password=encryted_pwd;
                    // console.log("loginData="+JSON.stringify(loginData));
                    connection.query("Select * from ht_user_registration where userName='"+loginData.userName+"' " +
                        "or email='"+loginData.userName+"' " +"and password='"+loginData.password+"'"+"and roleId='"+loginData.roleId+"'"
                        , function (err, rows) {
                        if(err){
                            console.log(err);
                            res.status(200).json(status_codes.db_error_0001);
                        }else{
                            if(rows.length>0){
                                var user=rows[0];
                                var tokenJson={
                                    id:user.id,
                                    teamId:user.teamId,
                                    roleId:user.roleId,
                                    parentId:user.parentId,
                                    userName:user.userName,
                                    email:user.email,
                                    password:user.password,
                                    status:user.status
                                };
                                user.token=jwt.sign(tokenJson,'hustle_up');
                                //Check For user subscription pack
                                connection.query("Select * from ht_subscription_configuration_manager where userId="+user.id+" and status='1'",
                                    function(err,subConfig){
                                        if(err){
                                            console.log(err);
                                            res.status(200).json(status_codes.db_error_0001);
                                        }
                                        else{
                                            if(subConfig.length>0){
                                                connection.query("Select duration_seconds from ht_subscription_master where id="+subConfig[0].subscriptionId+" and status='1'",
                                                    function(err,subPack){
                                                        if(err){
                                                            console.log(err);
                                                            res.status(200).json(status_codes.db_error_0001);
                                                        }
                                                        else{
                                                            var expiryDate=moment(moment(subConfig[0].createdAt).add(subPack[0].duration_seconds,'seconds')).format("YYYY-MM-DD HH:mm:ss");
                                                            var currentDate=moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
                                                            if(currentDate<expiryDate){
                                                                user.isSubscribe='Y';
                                                                user.expiryDate=expiryDate;
                                                                res.status(200).json(user);
                                                            }
                                                            else{
                                                                connection.query("Update hustle_up.ht_subscription_configuration_manager set status='0' where userId="+user.id+" and status='1'",
                                                                    function(err,result) {
                                                                        if (err) {
                                                                            console.log(err);
                                                                            res.status(200).json(status_codes.db_error_0001);
                                                                        }
                                                                        else{
                                                                            user.isSubscribe='N';
                                                                            res.status(200).json(user);
                                                                        }
                                                                    });
                                                            }
                                                        }
                                                    });
                                            }
                                            else{
                                                user.isSubscribe='N';
                                                res.status(200).json(user);
                                            }
                                        }
                                    });
                            }
                            else{
                                res.status(200).json(status_codes.incorrect_credentials);
                            }
                        }
                    });
                }
            }
        }
        else{
            res.status(200).json(status_codes.role_missing);
        }
    }
}

function user_forgot_password(req,res){
   // console.log("user data=="+JSON.stringify(req.body));
    var userData=req.body;
    if(validation.isEmptyObject(userData)){
        res.status(200).json(status_codes.no_data_found);
    }
    else{
        var email=userData.email;
        if(!validation.isFound(email)){
            res.status(200).json(status_codes.email_missing);
        }
        else{
            if(!validation.isValidEmailId(email)){
                res.status(200).json(status_codes.invalid_email);
            }
            else{
                email=email.toLowerCase();
                isUserExist(email,function(err,user){
                    if(err){
                        console.log(err);
                        res.status(200).json(status_codes.db_error_0001);
                    }
                    else{
                       // console.log("user="+JSON.stringify(user));
                        if(!validation.isEmptyObject(user)){             //User Exists
                            var random_pwd=randomstring.generate(12);
                            var encryt_random_pwd=encryption.encrypt_password(random_pwd);
                            var updatedAt=moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
                            connection.query("Update hustle_up.ht_user_registration set password='"+encryt_random_pwd
                                +"' , updatedAt='"+updatedAt+"' where email='"+email+"'",function(err,rows){
                                if(err){
                                    console.log(err);
                                    res.status(200).json(status_codes.db_error_0001);
                                }
                                else{
                                    reg_email.forgot_password_email(user,random_pwd);
                                    res.status(200).json(status_codes.password_updated);
                                }
                            });
                        }
                        else{
                            res.status(200).json(status_codes.no_user_found);
                        }
                    }
                });
            }
        }
    }
}

function user_change_password(req,res){
    var userData=req.body;
    if(!validation.isEmptyObject(userData)){
        if(validation.isFound(userData.email)){
            if(validation.isValidEmailId(userData.email)){
                if(validation.isFound(userData.oldpassword) && validation.isFound(userData.password)){
                    isUserExist(userData.email,function(err,user){
                        if(err){
                            console.log(err);
                            res.status(200).json(status_codes.db_error_0001);
                        }
                        else{
                            if(!validation.isEmptyObject(user)){             //User Exists
                                if(encryption.encrypt_password(userData.oldpassword)===user.password){
                                    var new_pwd=encryption.encrypt_password(userData.password);
                                    var updatedAt=moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
                                    connection.query("Update hustle_up.ht_user_registration set password='"+new_pwd
                                        +"' , updatedAt='"+updatedAt+"' where email='"+userData.email+"'",function(err,rows){
                                        if(err){
                                            console.log(err);
                                            res.status(200).json(status_codes.db_error_0001);
                                        }
                                        else{
                                            // reg_email.forgot_password_email(user,random_pwd);
                                            res.status(200).json(status_codes.password_updated);
                                        }
                                    });
                                }
                                else{
                                    res.status(200).json(status_codes.incorrect_password);
                                }
                            }
                            else{
                                res.status(200).json(status_codes.no_user_found);
                            }
                        }
                    });
                }
                else{
                    res.status(200).json(status_codes.password_missing);
                }
            }
            else{
                res.status(200).json(status_codes.invalid_email);
            }
        }
        else{
            res.status(200).json(status_codes.email_missing);
        }
    }
    else{
        res.status(200).json(status_codes.no_data_found);
    }
}

/*function new_team_registration(req, res) {
    var teamData=req.body;
    if(!validation.isEmptyObject(teamData)){
        var title=teamData.title;
        if(validation.isFound(title)){
            isTeamExist(title,function(err,temRes){
                if(err){
                    console.log(err);
                    res.status(200).json(status_codes.db_error_0001);
                }
                else{
                   if(validation.isEmptyObject(temRes)){              //Team can be created
                       teamData.createdAt=moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
                       teamData.updatedAt=moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
                       connection.query('INSERT INTO ht_team_registration SET ?', teamData, function (error, results, fields) {
                           if(error){
                               console.log(error);
                               res.status(200).json(status_codes.db_error_0001);
                           }
                           else{
                               // ht_position_parameter_child_rating_set updates

                               res.status(200).json(status_codes.team_created);
                           }
                       });
                   }
                   else{
                       res.status(200).json(status_codes.team_already_exist);
                   }
                }
            });
        }
        else{
            res.status(200).json(status_codes.team_name_missing);
        }
    }
    else{
        res.status(200).json(status_codes.no_data_found);
    }
}*/

function new_team_registration(req, res) {
    var teamData=req.body;
    if(!validation.isEmptyObject(teamData)){
        if(validation.allRequiredFieldsAvailable(teamData)){
            if(validation.isValidEmailId(teamData.primaryEmail)){
                isValidTeamName(teamData.title,function(err,temRes1){
                    if(err){
                        console.log(err);
                        res.status(200).json(status_codes.db_error_0001);
                    }
                    else{
                        if(validation.isEmptyObject(temRes1)){
                            isTeamExist(teamData.primaryEmail,function(err,temRes2){
                                if(err){
                                    console.log(err);
                                    res.status(200).json(status_codes.db_error_0001);
                                }
                                else{
                                   if(validation.isEmptyObject(temRes2)){
                                       if(validation.isFound(teamData.token)){
                                           jwt.verify(teamData.token, 'hustle_up',function(err, decoded) {
                                               if(err){
                                                   console.log(err.name+" - "+err.message);
                                                   res.status(200).json(status_codes.invalid_token);
                                               }
                                               else{
                                                   //console.log(decoded.id);
                                                   teamData.userId=decoded.id;
                                                   teamData.password=encryption.encrypt_password(teamData.password);
                                                   teamData.createdAt=moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
                                                   teamData.updatedAt=moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
                                                   delete teamData.token;
                                                   connection.query('INSERT INTO ht_team_registration SET ?', teamData, function (error, results, fields) {
                                                       if(error){
                                                           console.log(error);
                                                           res.status(200).json(status_codes.db_error_0001);
                                                       }
                                                       else{
                                                           // ht_position_parameter_child_rating_set updates
                                                            res.status(200).json(status_codes.team_created);
                                                       }
                                                   });
                                               }
                                           });
                                       }
                                       else{
                                           res.status(200).json(status_codes.token_not_found);
                                       }
                                   }
                                   else{
                                       res.status(200).json(status_codes.team_already_exist);
                                   }
                                }
                            });
                        }
                        else{
                            res.status(200).json(status_codes.duplicate_team_name);
                        }
                    }
                });
            }
            else{
                res.status(200).json(status_codes.invalid_email);
            }
        }
        else{
            res.status(200).json(status_codes.all_fields_required);
        }
    }
    else{
        res.status(200).json(status_codes.no_data_found);
    }
}

function isValidTeamName(teamName,callback){
    teamName=teamName.trim();
    connection.query("Select * from hustle_up.ht_team_registration where title='"+teamName+"'", function (err, rows) {
        if(err){
            console.log(err);
            callback(true,err);

        }else{
            if(rows.length>0){
                var team=rows[0];
                callback(false,team);
            }
            else{
                callback(false,{});
            }
        }
    });
}

function isTeamExist(email,callback){
    email=(email.trim()).toLowerCase();
    connection.query("Select * from hustle_up.ht_team_registration where primaryEmail='"+email+"'", function (err, rows) {
        if(err){
            console.log(err);
            callback(true,err);

        }else{
            if(rows.length>0){
                var team=rows[0];
                callback(false,team);
            }
            else{
                callback(false,{});
            }
        }
    });
}

function teams_list(req,res){
    var userData=req.body;
    if(!validation.isEmptyObject(userData)){
        if(validation.isFound(userData.token)){
            jwt.verify(userData.token,'hustle_up',function(err,decoded){
                if(err){
                    console.log(err.name+" - "+err.message);
                    res.status(200).json(status_codes.invalid_token);
                }
                else{
                    var email=decoded.email;
                    isUserExist(email,function(err,user){
                        if(err){
                            console.log(err);
                            res.status(200).json(status_codes.db_error_0001);
                        }
                        else{
                            if(!validation.isEmptyObject(user)){
                                connection.query("Select * from hustle_up.ht_team_registration where userId='"+user.userId+"' and status='1'",
                                    function(err,rows){
                                        if(err){
                                            console.log(err);
                                            res.status(200).json(status_codes.db_error_0001);
                                        }
                                        else{
                                            //console.log(JSON.stringify(rows));
                                            res.status(200).json(rows);
                                        }
                                    });
                            }
                            else{
                                res.status(200).json(status_codes.no_user_found);
                            }
                        }
                    });
                }
            });
        }
        else{
            res.status(200).json(status_codes.token_not_found);
        }
    }
    else{
        res.status(200).json(status_codes.no_data_found);
    }
}

function parameters_list(req,res){
    connection.query("SELECT para.id as parameterId,para.parameterTitle,pos.id as positionId" +
        ",pos.parentId,pos.positionTitle FROM hustle_up.ht_parameter_master para inner join " +
        "hustle_up.ht_position_master pos on para.id=pos.parameterId where para.status='1'",
        function(err,rows){
        if(err){
            console.log(err);
            res.status(200).json(status_codes.db_error_0001);
        }
        else{
           // console.log(rows.length);
           //res.status(200).json(rows);
            var finalArr=new Array();
            var parameters={};
            rows.map(function(rowData){
                parameters[rowData.parameterId]=rowData.parameterTitle;
            });
            for(key1 in parameters){
               // console.log(key1);
                var positions = new Array();
                rows.map(function (row1) {
                    if ((key1 == row1.parameterId) && (row1.parentId === null || row1.parentId === row1.positionId)) {
                        var skills = new Array();
                        rows.map(function (row2) {
                            if (row1.positionId == row2.parentId && row2.parentId != null && row2.parentId != row2.positionId) {
                                skills.push({skillId: row2.positionId, skillTitle: row2.positionTitle});
                            }
                        });
                        positions.push({positionId: row1.positionId, positionTitle: row1.positionTitle,skills:skills});
                    }
                });
                finalArr.push({parameterId:key1,parameterTitle:parameters[key1],positions:positions});
            }
            res.status(200).json(finalArr);
        }
    });
}

function subscription_list(req,res){
    connection.query("Select * from hustle_up.ht_subscription_master where status='1'",
        function(err,rows){
            if(err){
                console.log(err);
                res.status(200).json(status_codes.db_error_0001);
            }
            else{
                //console.log(JSON.stringify(rows));
                res.status(200).json(rows);
            }
        });
}

function subscribe_pack(req,res){
   var subscriptionData=req.body;
   if(!validation.isEmptyObject(subscriptionData)){
       if(validation.isFound(subscriptionData.subscriptionId)){
           if(validation.isFound(subscriptionData.token)){
               jwt.verify(subscriptionData.token, 'hustle_up',function(err,decoded){
                   if(err){
                       console.log(err.name+" - "+err.message);
                       res.status(200).json(status_codes.invalid_token);
                   }
                   else{
                       subscriptionData.userId=decoded.id;
                       subscriptionData.createdAt=moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
                       subscriptionData.updatedAt=moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
                       delete subscriptionData.token;
                       connection.query('INSERT INTO hustle_up.ht_subscription_configuration_manager SET ?', subscriptionData, function (error, results, fields) {
                           if(error){
                               console.log(error);
                               res.status(200).json(status_codes.db_error_0001);
                           }
                           else{
                               res.status(200).json(status_codes.pack_subscribed);
                           }
                       });
                   }
               });
           }
           else{
               res.status(200).json(status_codes.token_not_found);
           }
       }
       else{
           res.status(200).json(status_codes.subscription_not_found);
       }
   }
   else{
       res.status(200).json(status_codes.no_data_found);
   }
}

function season_category_list(req,res){
    connection.query("Select * from hustle_up.ht_season_category where status='1'",
        function(err,rows){
            if(err){
                console.log(err);
                res.status(200).json(status_codes.db_error_0001);
            }
            else{
                //console.log(JSON.stringify(rows));
                res.status(200).json(rows);
            }
        });
}

function invite_coaches(req,res){
   var inviteData=req.body;
   if(!validation.isEmptyObject(inviteData)){
       if(validation.isFound(inviteData.email) && inviteData.email.length>0){
           connection.query("Select configurationValue from ht_subscription_configuration_manager manager inner join " +
               "ht_subscription_configuration_master master on manager.subscriptionId=master.subscriptionId where " +
               "manager.userId="+inviteData.parentId+" and manager.status='1' and master.configurationName='COACH'",
               function(err,totalcoach){
                  if(err){
                      res.status(200).json(status_codes.db_error_0001);
                  }
                  else{
                      totalcoach=parseInt(totalcoach[0].configurationValue);
                      connection.query("SELECT count(*) as count FROM hustle_up.ht_user_registration WHERE parentId="+
                          inviteData.parentId+" and status='1'",function (err,invitedcoach){
                          if(err){
                              res.status(200).json(status_codes.db_error_0001);
                          }
                          else{
                              invitedcoach=parseInt(invitedcoach[0].count);
                              if(totalcoach>invitedcoach){
                                  if((totalcoach-invitedcoach)>=inviteData.email.length){
                                      inviteData.email.map(function(emailId){
                                          var random_pwd=randomstring.generate(12);
                                          var encryt_random_pwd=encryption.encrypt_password(random_pwd);
                                          var userData={
                                              roleId:3,            //For Coach Login
                                              teamId:inviteData.teamId,
                                              parentId:inviteData.parentId,
                                              userName:emailId,
                                              email:emailId,
                                              password:encryt_random_pwd,
                                              deviceType:inviteData.deviceType,
                                              deviceToken:inviteData.deviceToken,
                                              status:'1',
                                              createdAt:moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
                                              updatedAt:moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
                                          };
                                          connection.query("Insert into hustle_up.ht_user_registration set ?",userData,function(err,result){
                                              if(err){
                                                  res.status(200).json(status_codes.db_error_0001);
                                              }
                                              else{
                                                  reg_email.send_invite_email(userData,random_pwd);
                                              }
                                          });
                                      });
                                      res.status(200).json(status_codes.invitation_sent);
                                  }
                                  else{
                                      res.status(200).json(status_codes.invitation_limit_ecxeeded);
                                  }
                              }
                              else{
                                 res.status(200).json(status_codes.invitation_limit_reached);
                              }
                          }
                      });
                  }
               });
       }
       else{
           res.status(200).json(status_codes.email_missing);
       }
   }
   else{
       res.status(200).json(status_codes.no_data_found);
   }
}

function add_new_season(req,res){
    var seasonData=req.body;
    if(!validation.isEmptyObject(seasonData)){
        seasonData.createdAt=moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
        seasonData.updatedAt=moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
        connection.query("Insert Into hustle_up.ht_season_category Set ?",seasonData,function (err,results) {
            if(err){
                console.log(err);
                res.status(200).json(status_codes.db_error_0001);
            }
            else{
                res.status(200).json(status_codes.season_added);
            }
        });
    }
    else{
        res.status(200).json(status_codes.no_data_found);
    }
}

function asign_season(req,res){
    var asignedData=req.body;
    if(!validation.isEmptyObject(asignedData)){
        if(validation.allRequiredFieldsAvailable(asignedData)){
            isSeasonAsigned(asignedData.teamId,function(err,result){
                if(err){
                    console.log(err);
                    res.status(200).json(status_codes.db_error_0001);
                }
                else{
                   if(validation.isEmptyObject(result)){
                       if(validation.isFound(asignedData.token)){
                           jwt.verify(asignedData.token, 'hustle_up',function(err,decoded){
                               if(err){
                                   console.log(err.name+" - "+err.message);
                                   res.status(200).json(status_codes.invalid_token);
                               }
                               else{
                                   asignedData.userId=decoded.id;
                                   asignedData.roleId=decoded.roleId;
                                   asignedData.createdAt=moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
                                   asignedData.updatedAt=moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
                                   delete asignedData.token;
                                   connection.query('INSERT INTO hustle_up.ht_season_category_type_set SET ?', asignedData, function (error, results, fields) {
                                       if(error){
                                           console.log(error);
                                           res.status(200).json(status_codes.db_error_0001);
                                       }
                                       else{
                                           res.status(200).json(status_codes.season_asigned);
                                       }
                                   });
                               }
                           });
                       }
                       else{
                           res.status(200).json(status_codes.token_not_found);
                       }
                   }
                   else{
                      res.status(200).json(status_codes.season_already_asigned);
                   }
                }
            });
        }
        else{
               res.status(200).json(status_codes.all_fields_required);
        }
    }
    else{
        res.status(200).json(status_codes.no_data_found);
    }
}

function isSeasonAsigned(teamId,callback){
    connection.query("Select * from hustle_up.ht_season_category_type_set where teamId='"+teamId+"'",
        function (err, rows) {
        if(err){
            console.log(err);
            callback(true,err);

        }else{
            if(rows.length>0){
                var team=rows[0];
                callback(false,team);
            }
            else{
                callback(false,{});
            }
        }
    });
}

function user_notifications_list(req,res){
    var userData=req.body;
   // console.log(JSON.stringify(userData));
    if(!validation.isEmptyObject(userData)){
        if(validation.isFound(userData.token)){
            jwt.verify(userData.token,'hustle_up',function(err,decoded){
                if(err){
                    console.log(err.name+" - "+err.message);
                    res.status(200).json(status_codes.invalid_token);
                }
                else{
                    var email=decoded.email;
                    isUserExist(email,function(err,user){
                        if(err){
                            console.log(err);
                            res.status(200).json(status_codes.db_error_0001);
                        }
                        else{
                            if(!validation.isEmptyObject(user)){
                                connection.query("Select * from hustle_up.ht_user_notifications where userId='"+user.userId+"'",
                                    function(err,notifications){
                                        if(err){
                                            console.log(err);
                                            res.status(200).json(status_codes.db_error_0001);
                                        }
                                        else{
                                            res.status(200).json(notifications);
                                        }
                                    });
                            }
                            else{
                                res.status(200).json(status_codes.no_user_found);
                            }
                        }
                    });
                }
            });
        }
        else{
            res.status(200).json(status_codes.token_not_found);
        }
    }
    else{
        res.status(200).json(status_codes.no_data_found);
    }
}

function update_user_profile(req,res){
    var updatedData=req.body;
    if(!validation.isEmptyObject(updatedData)){
         if(validation.isFound(updatedData.token)){
             if(validation.isFound(updatedData.email)){
                 if(validation.isValidEmailId(updatedData.email)){
                     jwt.verify(updatedData.token,'hustle_up',function(err,decoded){
                         if(err){
                             console.log(err.name+" - "+err.message);
                             res.status(200).json(status_codes.invalid_token);
                         }
                         else{
                             decoded.email=((decoded.email).trim()).toLowerCase();
                             updatedData.email=((updatedData.email).trim()).toLowerCase();
                             delete updatedData.token;
                             if(decoded.email===updatedData.email){
                                connection.query("Update hustle_up.ht_user_registration set ? where email=?",[updatedData,decoded.email],
                                    function(err,result){
                                        if(err){
                                            res.status(200).json(status_codes.db_error_0001);
                                        }
                                        else{
                                            connection.query("Select * from ht_user_registration where email='"+decoded.email+"'",
                                                function(err,data){
                                                   if(err){
                                                       res.status(200).json(status_codes.db_error_0001);
                                                   }
                                                   else{
                                                       var tokenJson={
                                                           id:data[0].id,
                                                           teamId:data[0].teamId,
                                                           roleId:data[0].roleId,
                                                           parentId:data[0].parentId,
                                                           userName:data[0].userName,
                                                           email:data[0].email,
                                                           password:data[0].password,
                                                           status:data[0].status
                                                       };
                                                       var newtoken=jwt.sign(tokenJson,'hustle_up');
                                                       res.status(200).json({token:newtoken});
                                                   }
                                                });
                                        }
                                });
                             }
                             else{
                                 isUserExist(updatedData.email,function(err,user){
                                     if(err){
                                         res.status(200).json(status_codes.db_error_0001);
                                     }
                                     else{
                                         if(validation.isEmptyObject(user)){
                                             var link="http://"+req.headers.host;     //Send a verification link to old email
                                             reg_email.update_email_verification_link(decoded,link);

                                             //Perform Updation on click of Verify Link

                                             res.status(200).json(status_codes.working);
                                         }
                                         else{
                                             res.status(200).json(status_codes.user_already_exist);
                                         }
                                     }
                                 });
                             }
                         }
                     });
                 }
                 else{
                     res.status(200).json(status_codes.invalid_email);
                 }
             }
             else{
                 res.status(200).json(status_codes.email_missing);
             }
         }
         else{
             res.status(200).json(status_codes.token_not_found);
         }
    }
    else{
        res.status(200).json(status_codes.no_data_found);
    }
}


function users_list(req,res){  //Can get Players,Coches List on the basis on role id
   var user_type=req.body.user,roleId;
   if(validation.isFound(user_type)){
       if(user_type==='superadmin')
           roleId=1;
       if(user_type==='headcoach')
           roleId=2;
       if(user_type==='coach')
           roleId=3;
       if(user_type==='player')
           roleId=4;
       connection.query("Select * from ht_user_registration where roleId="+roleId,function(err,user){
           if(err)
               res.status(200).json(status_codes.db_error_0001);
           else{
               res.status(200).json(user);
           }
       });
   }
   else{
       res.status(200).json(status_codes.no_data_found);
   }
}

function add_parameters(req,res){
   var parameterData=req.body;
   if(!validation.isEmptyObject(parameterData)){
       if(validation.isFound(parameterData.token)){
           if(validation.isFound(parameterData.teamId)){
               if(validation.isFound(parameterData.parameterId)){
                   connection.query("Insert into hustle_up.ht_position_parameter_child_rating_set ?",parameterData,function(err,result){
                       if(err){
                           res.status(200).json(status_codes.db_error_0001);
                       }
                       else{
                           res.status(200).json(status_codes.parameters_added);
                       }
                   });
               }
               else{
                   res.status(200).json(status_codes.parameters_not_found);
               }
           }
           else {
               res.status(200).json(status_codes.team_name_missing);
           }
       }
       else{
           res.status(200).json(status_codes.token_not_found);
       }
   }
   else{
       res.status(200).json(status_codes.no_data_found);
   }
}

function profile_info(req,res) {
    var userData=req.body;
    if(validation.isFound(userData.userId)){
        connection.query("Select * from ht_user_registration where id=?",userData.userId,function(err,result){
            if(err){
                console.log(err);
                res.status(200).json(status_codes.db_error);
            }
            else{
                res.status(200).json(result);
            }
        });
    }
    else{
        res.status(200).json(status_codes.no_user_found);
    }
}

// by SD
function createNewTeam(req,res) {
    var team_data = req.body;
    if (!validation.isEmptyObject(team_data)) {
        var team_title = team_data.title.trim();
        if (validation.isFound(team_title)) {
            checkTeamTitleExist(team_title,function(err,result) {
                if (err) {
                  console.log(err);
                  res.status(200).json(status_codes.db_error);
                }
                else {
                      if (validation.isFound(team_data.primaryEmail.trim())) {
                              if (validation.isValidEmailId(team_data.primaryEmail)) {
                                if (validation.isEmptyObject(result)) {
                                  if (validation.isFound(team_data.password.trim())) {
                                    // Waiting for the token from ios;
                                    res.status(200).send("team password found");
                                    }
                                  else {
                                    res.status(200).send(status_codes.password_missing);
                                  }
                                }
                                else {
                                    res.status(200).json(status_codes.team_name_already_exist);
                                }
                              }
                              else {
                                console.log(err);
                                res.status(200).json(status_codes.invalid_email);
                              }
                        }
                    else {
                      console.log(err);
                      res.status(200).json(status_codes.email_missing);
                    }
                }
            });
        }
        else {
            res.status(200).json(status_codes.team_name_not_found);
        }
    }
    else {
        res.status(200).json(status_codes.no_data_found);
    }

}
function checkTeamTitleExist(team_title,callback)
{
  connection.query("select title from ht_team_registration where title = ?",team_title,function(err,result) {
    if (err) {
        console.log(err);
        res.status(200).json(status_codes.db_error);
    }
    else {
        if (result.length > 0) {
            callback(false,result[0].title.toLowerCase());
        }
        else {
            callback(false,{});
        }
    }
  });
}
function selectParameter(req,res){
  connection.query("SELECT para.id as parameterId,para.parameterTitle,pos.id as positionId" +
      ",pos.parentId,pos.positionTitle FROM hustle_up.ht_parameter_master para inner join " +
      "hustle_up.ht_position_master pos on para.id=pos.parameterId where para.status='1'",function(err,rows){
      var array=[];
      var para={};
      if(err){
          console.log(err);
          res.status(200).json(status_codes.db_error_0001);
      }
      else{
            rows.map(function(rows) {
                para[rows.parameterId]=rows.parameterTitle;
            })
            for(pid in para)
            {
              var ptitle=new Array();
              rows.map(function(data) {
                  if (pid==data.parameterId && data.parentId==null) {
                      ptitle[data.positionId]=data.positionTitle;
                  }
              });
              res.status(200).send({para,ptitle});
            }

      }
  });
}
module.exports.new_user_signup=new_user_signup;
module.exports.user_login=user_login;
module.exports.subscription_list=subscription_list;
module.exports.subscribe_pack=subscribe_pack;
module.exports.new_team_registration=new_team_registration;
module.exports.teams_list=teams_list;
module.exports.parameters_list=parameters_list;

module.exports.user_forgot_password=user_forgot_password;
module.exports.user_change_password=user_change_password;
module.exports.season_category_list=season_category_list;
module.exports.invite_coaches=invite_coaches;
module.exports.add_new_season=add_new_season;
module.exports.asign_season=asign_season;
module.exports.user_notifications_list=user_notifications_list;
module.exports.update_user_profile=update_user_profile;
module.exports.users_list=users_list;
module.exports.add_parameters=add_parameters;
module.exports.profile_info=profile_info;

module.exports.createNewTeam=createNewTeam;
module.exports.selectParameter=selectParameter;
