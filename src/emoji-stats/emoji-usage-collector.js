const EventEmitter = require('events');

const prettyMs = require('pretty-ms');

const CustomEmojiFilter = require('./../filters/custom-emoji-filter');
const Util = require('./../util');

const Services = require('./../services');

class EmojiUsageCollector extends EventEmitter {
    constructor(client, stats) {
        super();

        this.MIN_INTERVAL = 10000;

        this.client = client;
        this.stats = stats;

        this.flushTimer;

        this.newMessage = msg => this.onMessage(msg);
        this.updateMessage = (oldMsg, newMsg) => this.onUpdateMessage(oldMsg, newMsg);
        this.deleteMessage = (msg) => this.onMessageDelete(msg);
        /*
        Тут должен быть хэндлер для messageDeleteBulk
        */
        this.addReaction = (reaction, user) => this.onAddReaction(reaction, user);
        this.removeReaction = (reaction, user) => this.onRemoveReaction(reaction, user);

        this._isRun = false;
    }

    get isRun() {
        return this._isRun;
    }

    get allStats() {
        return this.stats;
    }

    init() {
        if (!this.isRun && this.hasEnabled()) {
            this._start();
        }
    }

    _start() {
        if (this.isRun) {
            throw new Error('Collector has already started');
        }
        console.log('Start');
        this.client.on('message', this.newMessage);
        this.client.on('messageUpdate', this.updateMessage);
        this.client.on('messageDelete', this.deleteMessage);
        this.client.on('messageReactionAdd', this.addReaction);
        this.client.on('messageReactionRemove', this.removeReaction);

        this.sheduleNearestFlush();
        this._isRun = true;
        this.emit('start');
    }

    _stop() {
        console.log('Stop');
        this.client.removeListener('message', this.newMessage);
        this.client.removeListener('messageUpdate', this.updateMessage);
        this.client.removeListener('messageDelete', this.deleteMessage);
        this.client.removeListener('messageReactionAdd', this.addReaction);
        this.client.removeListener('messageReactionRemove', this.removeReaction);

        clearTimeout(this.flushTimer);
        this._isRun = false;
        this.emit('stop');
    }

    /**
     * @param {string} serverId
     * @param {Object} settings
     */
    changeSettings(serverId, settings) {
        const serverSettings = this.stats.get(serverId);
        if (serverSettings) {
            for (const prop in settings) {
                if (!settings.hasOwnProperty(prop)) {
                    continue;
                }
                serverSettings[prop] = settings[prop];
            }
        } else {
            throw new Error('Configure server with incomplete settings');
        }

        if (!this._isRun && this.hasEnabled()) {
            this._start();
        }
        this.sheduleNearestFlush();
        this.emit('settingsUpdate');
    }

    onAddReaction(reaction, user) {
        if (!Util.isGuildTextChannel(reaction.message)) {
            return;
        }

        if (this.client.user.id === user.id || user.bot) {
            return;
        }

        if (!this._isEnabled(reaction.message)) {
            return;
        }

        if (reaction.emoji.id && reaction.message.guild.emojis.has(reaction.emoji.id)) {
            this._updateStats(reaction.message.guild.id, new Map([[reaction.emoji.name, 1]]));
        }
    }

    onRemoveReaction(reaction, user) {
        if (!Util.isGuildTextChannel(reaction.message)) {
            return;
        }

        if (this.client.user.id === user.id || user.bot) {
            return;
        }

        if (!this._isEnabled(reaction.message)) {
            return;
        }

        if (reaction.emoji.id && reaction.message.guild.emojis.has(reaction.emoji.id)) {
            this._updateStats(reaction.message.guild.id, new Map([[reaction.emoji.name, -1]]));
        }
    }

    onMessage(msg) {
        if (!Util.isGuildTextChannel(msg)) {
            return;
        }

        if (this.client.user.id === msg.author.id || msg.author.bot) {
            return;
        }

        if (!this._isEnabled(msg)) {
            return;
        }

        const msgEmojis = this._extractEmojis(msg.content, msg.guild.emojis);
        if (!msgEmojis.size) {
            return;
        }

        this._updateStats(msg.guild.id, msgEmojis);
    }

    onUpdateMessage(oldMsg, newMsg) {
        if (!Util.isGuildTextChannel(oldMsg)) {
            return;
        }

        if (this.client.user.id === oldMsg.author.id || oldMsg.author.bot) {
            return;
        }

        if (!this._isEnabled(oldMsg)) {
            return;
        }

        const serverStats = this.stats.get(oldMsg.guild.id);
        if (oldMsg.createdTimestamp < serverStats.flush - serverStats.interval) {
            return;
        }

        const oldEmojis = this._extractEmojis(oldMsg.content, oldMsg.guild.emojis);
        const newEmojis = this._extractEmojis(newMsg.content, newMsg.guild.emojis);

        const diff = new Map();
        newEmojis.forEach((count, name) => {
            const oldCount = oldEmojis.get(name);
            if (oldCount) {
                diff.set(name, count - oldCount);
            } else {
                diff.set(name, count);
            }
        });

        oldEmojis.forEach((count, name) => {
            if (!newEmojis.has(name)) {
                diff.set(name, -count);
            }
        });

        this._updateStats(oldMsg.guild.id, diff);
    }

    onMessageDelete(msg) {
        if (!Util.isGuildTextChannel(msg)) {
            return;
        }

        if (this.client.user.id === msg.author.id || msg.author.bot) {
            return;
        }

        if (!this._isEnabled(msg)) {
            return;
        }

        const serverStats = this.stats.get(msg.guild.id);
        if (msg.createdTimestamp < serverStats.flush - serverStats.interval) {
            return;
        }

        const deletedEmojis = this._extractEmojis(msg.content, msg.guild.emojis);

        msg.reactions.forEach((count, name) => {
            const deletedCount = deletedEmojis.get(name);
            deletedEmojis.set(name, deletedCount ? deletedCount + count : count);
        });

        deletedEmojis.forEach((count, name, map) => {
            map.set(name, -count);
        });

        this._updateStats(msg.guild.id, deletedEmojis);
    }

    _isEnabled(msg) {
        const serverStats = this.stats.get(msg.guild.id);
        return serverStats && serverStats.enabled;
    }

    _isSettingsCompleted(settings) {
        return Util.hasOwnProperties(settings, ['output', 'interval']);
    }

    setSettingsProperty(serverId, property, value) {
        const serverStats = this.stats.get(serverId);
        if (!serverStats) {
            throw new Error('Server not initialize');
        }
        if (property === 'output' && !this._isValidChannel(serverId, value)) {
            throw new Error('Invalid channel id');
        }

        if (property === 'interval' && !this._isValidInterval(value)) {
            throw new RangeError(`Interval should be equal or greater than ${this.MIN_INTERVAL}`);
        }

        serverStats[property] = value;

        this._checkTasks();

        if (this.isRun) {
            this.sheduleNearestFlush();
        }

        this.emit('settingsUpdate', { serverId: serverId, settings: { [property]: value } });
    }

    createServerRecord(serverId, initSettings) {
        if (!this._isValidChannel(serverId, initSettings.output)) {
            throw new Error('Invalid channel id');
        }

        if (!this._isValidInterval(initSettings.interval)) {
            throw new RangeError(`Interval should be equal or greater than ${this.MIN_INTERVAL}`);
        }

        this.stats.set(serverId, {
            output: initSettings.output,
            interval: initSettings.interval,
            enabled: initSettings.enabled,
            flush: Date.now() + initSettings.interval,
            usage: new Map()
        });

        this._checkTasks();

        if (this.isRun) {
            this.sheduleNearestFlush();
        }

        this.emit('settingsUpdate', { serverId: serverId, settings: initSettings });
    }

    _checkTasks() {
        if (this.isRun && !this.hasEnabled()) {
            this._stop();
        } else if (!this.isRun && this.hasEnabled()) {
            this._start();
        }
    }

    _flush(serverId) {
        const serverStats = this.stats.get(serverId);

        if (!serverStats.usage.size) {
            return;
        }

        const emojiStatsStr = [...serverStats.usage]
            .sort((e1, e2) => e2[1] - e1[1])
            .map(e => `:${e[0]}: —  ${e[1]}`)
            .join('\n');
        const intervalStr = prettyMs(serverStats.interval);
        const statStr = `Interval: ${intervalStr}\n${emojiStatsStr}`;

        const statResponse = new CustomEmojiFilter(statStr).filter(this.client);

        const outChannel = this.client.channels.get(serverStats.output);
        if (outChannel) {
            outChannel.send(statResponse);
            serverStats.usage.clear();
            this.emit('flush');
        } else {
            console.log('Invalid output channel id');
        }
    }

    sheduleNearestFlush() {
        const serverId = this.getNearestFlushId();
        if (!serverId) {
            console.log('!!!Not earest flush id!!!');
            return;
        }
        clearTimeout(this.flushTimer);
        this.flushTimer = setTimeout(() => {
            this._flush(serverId);
            this.stats.get(serverId).flush = Date.now() + this.stats.get(serverId).interval;
            this.sheduleNearestFlush();
        }, Math.max(this.stats.get(serverId).flush - Date.now()), 0);
    }
    /**
    * @returns {string}
    */
    getNearestFlushId() {
        const enabledSrvs = [...this.stats].filter(s => s[1].enabled);
        if (!enabledSrvs.length) {
            return undefined;
        }

        return enabledSrvs
            .reduce((nearest, current) => current[1].flush < nearest[1].flush ? current : nearest)[0];
    }

    /**
     * Update usage statistic for specific server
     * @param {string} serverId
     * @param {Map<string, number>} changes
     */
    _updateStats(serverId, changes) {
        const serverStats = this.stats.get(serverId);
        if (!serverStats) {
            console.log('!Impossible!');
            return;
        }

        [...changes].forEach(pair => {
            const oldCount = serverStats.usage.get(pair[0]);
            if (oldCount !== undefined) {
                const newCount = oldCount + pair[1];
                if (newCount > 0) {
                    serverStats.usage.set(pair[0], newCount);
                } else {
                    serverStats.usage.delete(pair[0]);
                }
            } else if (pair[1] > 0) {
                serverStats.usage.set(pair[0], pair[1]);
            }
        });
    }
    /**
 * @param {string} str
 * @param {Object} emojis
 * @returns {Object<string, number>}
 */
    _extractEmojis(str, emojis) {
        let found;
        const result = new Map();
        const regex = /<?:(\w+):(?:\d+)?>?/gi;
        while ((found = regex.exec(str))) {
            const count = result.get(found[1]);
            if (count !== undefined) {
                result.set(found[1], count + 1);
            } else if (emojis.exists('name', found[1])) {
                result.set(found[1], 1);
            }
        }
        return result;
    }

    _isValidChannel(serverId, channelId) {
        const server = this.client.guilds.get(serverId);
        if (!server) {
            return false;
        }

        return server.channels.has(channelId);
    }

    _isValidInterval(interval) {
        return interval >= this.MIN_INTERVAL;
    }

    hasEnabled() {
        return [...this.stats]
            .map(s => s[1])
            .some(s => s.enabled);
    }
}

module.exports = EmojiUsageCollector;