const Util = require('./../util');
const prettyMs = require('pretty-ms');
const Services = require('./../services');

//                       0                          1               2
//!emojistats [init|set|status] [enabled|interval|output] [value[s]]
class EmojiUsageStatsCommand {
    constructor(args) {
        this.args = args;
        this.collector = Services.resolve('emojicollector');
    }

    async execute(client, msg) {
        if (this.args.length < 1) {
            return Promise.reject();
        }

        switch (this.args[0]) {
            case 'init':
                //!emojistats init output interval enabled
                if (this.args.length >= 4 &&
                    Util.isInteger(this.args[1]) &&
                    Util.isInteger(this.args[2]) &&
                    Util.isStrBool(this.args[3])) {
                    this.collector.createServerRecord(msg.guild.id, {
                        output: this.args[1],
                        interval: Number.parseInt(this.args[2]),
                        enabled: Util.strToBool(this.args[3])
                    });
                }
                break;
            case 'set':
                //!emojistats set [enabled|interval|output] [newVal]
                if (this.args.length >= 3) {
                    this._setProperty(msg.guild.id);
                }

                break;
            case 'status':
                let status = '';
                const serverStats = this.collector.allStats.get(msg.guild.id);

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
        switch (this.args[1]) {
            case 'enabled':
                if (Util.isStrBool(this.args[2])) {
                    this.collector.setSettingsProperty(serverId, 'enabled', Util.strToBool(this.args[2]));
                }
                break;
            case 'interval':
                if (Util.isInteger(this.args[2])) {
                    this.collector.setSettingsProperty(serverId, 'interval', Number.parseInt(this.args[2]));
                }
                break;
            case 'output':
                this.collector.setSettingsProperty(serverId, 'output', this.args[2]);
                break;
            default:
                break;
        }
    }
}

module.exports = EmojiUsageStatsCommand;