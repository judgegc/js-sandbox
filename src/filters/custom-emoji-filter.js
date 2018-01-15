const Util = require('./../util');

class CustomEmojiFilter {
    constructor(response) {
        this.response = response;
    }
    filter(client) {
        return this.response
            .replace(/<?:(\w+):(?:\d+)?>?/gi, (m, emoji) => {
                for (const guild of [...client.guilds].map(x => x[1])) {
                    const emojiFull = guild.emojis.find('name', emoji);
                    if (emojiFull) {
                        return emojiFull;
                    }
                }
                return m;
            });
    }
}

module.exports = CustomEmojiFilter;