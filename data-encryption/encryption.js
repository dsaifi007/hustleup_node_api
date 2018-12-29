var crypto=require('crypto');

function encrypt_password(pwd){
    var md5 = crypto.createHash('md5').update(pwd).digest('hex');
    //console.log("md5 string="+md5);
    //var encrypt_pwd=new Buffer(md5,'hex').toString('base64');
   // console.log("base64 string="+encrypt_pwd);
    return md5;
};

module.exports.encrypt_password=encrypt_password;