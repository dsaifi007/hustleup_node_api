var emailConfig=require('./../config/emailConfig');
var ejs=require('ejs');
var usersFile=require('./../routes/users');

function send_registration_email(userData,pwd){
    var subject="Hustle Up- Registration Details";
    var filename = "templates/registration-email.ejs";
    //var sender='"PRERNA SONKAR" prerna.sonkar@rnf.tech';
    var receiver=userData.email;
    ejs.renderFile(filename,{userName:userData.userName,email:userData.email,password:pwd},
        function (err, htmlData) {
            if (err) {
                console.log(err);
               // console.log('err in ejs');
            } else {
                //console.log('ejs rendered');
                emailConfig.sendEmail(htmlData, "", subject,receiver);
            }
        });
}

function forgot_password_email(userData,pwd){
    var subject="Hustle Up- Forgot Password";
    var filename = "templates/forgot-password-email.ejs";
    //var sender='"PRERNA SONKAR" prerna.sonkar@rnf.tech';
    var receiver=userData.email;
    ejs.renderFile(filename,{userName:userData.userName,password:pwd},
        function (err, htmlData) {
            if (err) {
                console.log(err);
                //console.log('err in ejs');
            } else {
               // console.log('ejs rendered');
                emailConfig.sendEmail(htmlData, "", subject,receiver);
            }
        });
}

function update_email_verification_link(user,link){
    var subject="Hustle Up- Update Email";
    var filename = "templates/verification-update-email.ejs";
    //var sender='"PRERNA SONKAR" prerna.sonkar@rnf.tech';
    var receiver=user.email;

    ejs.renderFile(filename,{userName:user.userName,link:link},
        function (err, htmlData) {
            if (err) {
                console.log(err);
                //console.log('err in ejs');
            } else {
                // console.log('ejs rendered');
                emailConfig.sendEmail(htmlData, "", subject,receiver);
            }
        });
}

function send_invite_email(userData,pwd){
    var subject="Hustle Up- Invitation";
    var filename = "templates/invitation-email.ejs";
    //var sender='"PRERNA SONKAR" prerna.sonkar@rnf.tech';
    var receiver=userData.email;
    ejs.renderFile(filename,{userName:userData.userName,email:userData.email,password:pwd},
        function (err, htmlData) {
            if (err) {
                console.log(err);
                // console.log('err in ejs');
            } else {
                //console.log('ejs rendered');
                emailConfig.sendEmail(htmlData, "", subject,receiver);
            }
        });
}

module.exports.send_registration_email=send_registration_email;
module.exports.forgot_password_email=forgot_password_email;
module.exports.update_email_verification_link=update_email_verification_link;
module.exports.send_invite_email=send_invite_email;