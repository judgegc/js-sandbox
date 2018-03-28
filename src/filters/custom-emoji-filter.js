const Util = require('./../util');

class CustomEmojiFilter {
    constructor(response) {
        this.response = response;
    }
    filter(guilds, serverId) {
        return this.response
            .replace(/<?:(\w+):(?:\d+)?>?/gi, (m, emoji) => {
                const guildList = [...guilds];
                const serverIdx = guildList.findIndex(x => x[0] === serverId);
                const temp = guildList[serverIdx];
                guildList[serverIdx] = guildList[0];
                guildList[0] = temp;

                for (const guild of guildList.map(x => x[1])) {
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