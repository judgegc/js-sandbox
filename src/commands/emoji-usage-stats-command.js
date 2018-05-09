const Util = require('./../util');

//                       0                          1               2
//!emjrating [init|set|status] [enabled|interval|output] [value[s]]
class EmojiUsageStatsCommand {
    constructor(args, emojiCollector) {
        this._args = args;
        this._collector = emojiCollector;
    }

    async execute(client, msg) {
        if (this._args.length < 1) {
            return Promise.reject();
        }

        switch (this._args[0]) {
            case 'init':
                //!emojistats init output interval enabled
                if (this._args.length >= 4 &&
                    Util.isInteger(this._args[1]) &&
                    Util.isInteger(this._args[2]) &&
                    Util.isStrBool(this._args[3])) {
                    this._collector.createServerRecord(msg.guild.id, {
                        output: this._args[1],
                        interval: Number.parseInt(this._args[2]),
                        enabled: Util.strToBool(this._args[3])
                    });
                }
                break;
            case 'set':
                //!emojistats set [enabled|interval|output] [newVal]
                if (this._args.length >= 3) {
                    this._setProperty(msg.guild.id);
                }

                break;
            case 'status':
                let status = '';
                const serverStats = this._collector.allStats.get(msg.guild.id);

                if (!serverStats) {
                    return Promise.resolve('Server not configured.');
                }
                const outputChannel = msg.guild.channels.get(serverStats.output);
                const chl = outputChannel && outputChannel.name || 'unknown';
                const flushDate = new Date(serverStats.flush);
                status += `Enabled: ${serverStats.enabled}\nInterval: ${serverStats.interval}\nOutput: #${chl}\nNext flush: ${flushDate}`;
                return Promise.resolve(status);
            default:
                break;
        }
        return Promise.reject();
    }

    _setProperty(serverId) {
        switch (this._args[1]) {
            case 'enabled':
                if (Util.isStrBool(this._args[2])) {
                    this._collector.setSettingsProperty(serverId, 'enabled', Util.strToBool(this._args[2]));
                }
                break;
            case 'interval':
                if (Util.isInteger(this._args[2])) {
                    this._collector.setSettingsProperty(serverId, 'interval', Number.parseInt(this._args[2]));
                }
                break;
            case 'output':
                this._collector.setSettingsProperty(serverId, 'output', this._args[2]);
                break;
            default:
                break;
        }
    }
}

module.exports = EmojiUsageStatsCommand;