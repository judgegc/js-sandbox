class Util {
    static isDmMsg(msg) {
        return msg.channel.type === 'dm';
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
}

module.exports = Util;