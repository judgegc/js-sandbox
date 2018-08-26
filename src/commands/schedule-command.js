//              0      1     2
//!schedule [add|rm] [cmd] [args?]
class ScheduleCommand {
    constructor(args, schedulerService) {
        this._args = args;
        this._schedulerService = schedulerService;
    }

    execute(client, msg) {
        if (this._args.length < 1)
            return Promise.reject();

        const [action, cmdOrHash, ...scheduleArgs] = this._args;

        if (action === 'add' && cmdOrHash) {
            this._schedulerService.schedule(msg.guild.id, msg.channel.id, cmdOrHash, scheduleArgs);
        } else if (action === 'rm' && cmdOrHash) {
            this._schedulerService.cancel(cmdOrHash);
        } else if (action === 'list') {
            return Promise.resolve(this._schedulerService.tasks().map(x => `${x.id} ${x.commandName} ${x.args}`).join('\n'));
        }

        return Promise.reject();
    }
}

module.exports = ScheduleCommand;