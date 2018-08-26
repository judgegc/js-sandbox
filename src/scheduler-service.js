const Util = require('./util');
const settings = require('../settings.json');

class SchedulerService {
    constructor(customCommandsManager, client) {
        this._customCommandsManager = customCommandsManager;
        this._client = client;

        this.TASK_DELAY = 60000;
        this.TASKS_PER_SERVER_LIMIT = 20;
        this._tasks = [];
        this._schedulerTick = this.TASK_DELAY;

        this._isRunning = false;
        this._taskTimer = null;

        this._taskIdx = 0;
    }

    _calculateTaskDelay() {
        this._schedulerTick = this.TASK_DELAY + (this._tasks.length - 1) * this.TASK_DELAY / 2;
    }

    async _tick() {
        const task = this._tasks[this._taskIdx];
        const command = this._customCommandsManager.getCommand(task.serverId, task.commandName);
        if (command) {
            const och = this._client.channels.get(task.channelId);
            if (och) {
                const fakeMsg = {
                    author: { ...this._client.user, id: '0', bot: false },
                    guild: och.guild,
                    channel: och,
                    content: `!${task.commandName}${task.args.length ? ' ' : ''}${task.args.join(' ')}`
                };
                this._client.emit('message', fakeMsg);
            } else {
                this.cancel(task.id);
            }
        }

        this._taskIdx = (this._taskIdx + 1) % this._tasks.length;

        if (this.isRunning()) {
            this._taskTimer = setTimeout(() => this._tick(), this._schedulerTick);
        }
    }

    schedule(serverId, channelId, commandName, args) {
        if (this._tasks.filter(x => x.serverId === serverId).length >= this.TASKS_PER_SERVER_LIMIT)
            return null;

        const id = Util.md5(serverId + channelId + commandName + args + Date.now());
        this._tasks.push({ id, serverId, channelId, commandName, args });

        this._calculateTaskDelay();

        if (!this.isRunning()) {
            this.start();
        }
        return id;
    }

    cancel(taskId) {
        const fidx = this._tasks.findIndex(x => x.id === taskId);

        if (fidx === -1)
            return;

        this._tasks.splice(fidx, 1);

        if (fidx < this._taskIdx)
            this._taskIdx = (this._taskIdx + 1) % this._tasks.length;

        if (!this.hasTasks()) {
            this.stop();
            return;
        }

        this._calculateTaskDelay();
    }

    hasTasks() {
        return this._tasks.length !== 0;
    }

    isRunning() {
        return this._isRunning;
    }

    tasks() {
        return this._tasks;
    }

    start() {
        if (this.isRunning())
            return;

        this._taskTimer = setTimeout(() => this._tick(), this._schedulerTick);
        this._isRunning = true;
    }

    stop() {
        if (this.isRunning()) {
            clearTimeout(this._taskTimer);
        }

        this._isRunning = false;
    }
}

module.exports = SchedulerService;