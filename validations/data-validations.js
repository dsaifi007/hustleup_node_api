var email_validator = require('email-validator');


function isEmptyObject(obj){
    var isempty=true;
    for(key in obj){
        if(isFound(obj[key])===true){
            isempty=false;
            return isempty;
        }
    }
    return isempty;
}
function isFound(att){
    if((att==='null')||(att===null)||(att===undefined)||(att===''))
        return false;
    else
        return true;
}

function allRequiredFieldsAvailable(obj){
    var res=true;
    for(key in obj){
        if(isFound(obj[key])===false){
            res=false;
            return res;
        }
    }
    return res;
}

function isValidEmailId(emailId){
    return email_validator.validate(emailId);
}

function walkclean(x) {
    var type = typeof x;
    if (x instanceof Array) {
        type = 'array';
    }
    if ((type == 'array') || (type == 'object')) {
        for (k in x) {
            var v = x[k];
            if ((v === '') && (type == 'object')) {
                delete x[k];
            } else {
                walkclean(v);
            }
        }
    }
}

module.exports.isEmptyObject=isEmptyObject;
module.exports.isFound=isFound;
module.exports.isValidEmailId=isValidEmailId;
module.exports.allRequiredFieldsAvailable=allRequiredFieldsAvailable;
module.exports.walkclean=walkclean;
