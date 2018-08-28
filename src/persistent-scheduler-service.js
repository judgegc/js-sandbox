const SchedulerService = require('./scheduler-service');

class PersistentSchedulerService extends SchedulerService {
    constructor(customCommandsManager, client, storage) {
        super(customCommandsManager, client);
        this.storage = storage.collection('scheduler');
    }

    async loadTasks() {
        this._tasks = (await this.storage.find().toArray()).map(x => ({ ...x, id: x._id }));
        this._calculateTaskDelay();

        if (!this.isRunning())
            this.start();
    }

    async schedule(serverId, channelId, commandName, args) {
        const id = super.schedule(serverId, channelId, commandName, args);
        if (id === null)
            return null;

        await this.storage.insertOne({ _id: id, serverId, channelId, commandName, args: args });
        return id;
    }

    async cancel(taskId) {
        const canceled = super.cancel(taskId);
        if (!canceled)
            return false;

        await this.storage.deleteOne({ _id: taskId });
        return true;
    }
}

module.exports = PersistentSchedulerService;