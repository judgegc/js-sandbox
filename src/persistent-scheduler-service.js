const SchedulerService = require('./scheduler-service');

class PersistentSchedulerService extends SchedulerService {
    constructor(customCommandsManager, client, storage) {
        super(customCommandsManager, client);
        this.INDEX_DELIM = '_';
        this.storage = storage.collection('scheduler');
    }

    async loadTasks() {
        this._tasks = (await this.storage.find().toArray()).map(x => ({ ...x, id: x._id }));
        this._calculateTaskDelay();
    }

    async schedule(serverId, channelId, commandName, args) {
        const id = super.schedule(serverId, channelId, commandName, args);
        await this.storage.insertOne({ _id: id, serverId, channelId, commandName, args: args });
        return id;
    }

    async cancel(taskId) {
        super.cancel(taskId);
        await this.storage.deleteOne({ _id: taskId });
    }
}

module.exports = PersistentSchedulerService;