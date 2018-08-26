const Util = require('./../util');

class ChannelMentionResolver {
    constructor(response) {
        this.response = response;
    }

    resolve(msg) {
        return this.response
            .replace(/<?#(\w+)>?/gi, (m, name) => {
                if (Util.isInteger(name) &&
                    m[0] === '<' &&
                    m.slice(-1) === '>' &&
                    msg.guild.channels.get(name)) {
                    return m;
                }
                const channel = msg.guild.channels.find(x => x.name === name);
                return channel || m;
            });
    }
}

module.exports = ChannelMentionResolver;