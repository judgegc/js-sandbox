const crypto = require('crypto');

class Util {
    static isGuildTextChannel(msg) {
        return msg.channel.type === 'text';
    }

    static isInteger(val) {
        return /^\d+$/.test(val);
    }

    static hasOwnProperties(obj, props) {
        return props.every(p => obj.hasOwnProperty(p));
    }

    static escapeRegExp(text) {
        return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    }
    static objectToMap(obj) {
        const map = new Map();
        Object.keys(obj).forEach(key => {
            map.set(key, obj[key]);
        });
        return map;
    }

    static isStrBool(str) {
        const loVal = str.toLowerCase();
        return loVal === 'true' || loVal === 'false';
    }

    static strToBool(str) {
        const loVal = str.toLowerCase();
        return loVal === 'true';
    }

    static md5(msg) {
        return crypto.createHash('md5').update(msg).digest('hex');
    }
}

module.exports = Util;