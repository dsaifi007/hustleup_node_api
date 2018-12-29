var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'prerna.sonkar@rnf.tech',
        pass: 'prerna@123'
    }
});

module.exports={
        sendEmail:function (html,text,subject,receiver) {
            var mailOptions = {
                from:'"PRERNA SONKAR" prerna.sonkar@rnf.tech', // sender address
                to: [receiver], // list of receivers
                subject: subject, // Subject line
                text: text, // plaintext body
                html: html // html body
            };
            transporter.sendMail(mailOptions, function (err, info) {
                if (err) {
                    return console.log(err);
                }else{
                    return console.log("Email Sent Successfully<br> MessageId-"+info.messageId);
                }
            });
        }
    };