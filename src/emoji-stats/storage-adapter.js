const Util = require('./../util');

class StorageAdapter {
    /**
  * @typedef {Object} Settings
  * @property {boolean} [enabled] Is gathering stats enabled
  * @property {number} [interval] Interval between unloading in milliseconds
  * @property {string} [output] Channel id for unloading statistics
  */

    constructor(db) {
        this.storage = db.collection('emoji_stats');
    }

    /**
    * @param {string} serverId
    * @param {Settings} settings
    */
    async updateSettings(serverId, settings) {
        if (Object.keys(settings).length) {
            await this.storage.updateOne({ _id: serverId }, { $set: settings }, { upsert: true });
        }
    }

    /**
     * Update all statistics
     * @param {Map<string, Object>} stats
     */
    async updateAllStats(stats) {
        const bulk = [...stats]
            .map(s => ({
                updateOne: {
                    filter: { _id: s[0] },
                    update: { $set: { flush: s[1].flush, usage: s[1].usage } },
                }
            }));

        await this.storage.bulkWrite(bulk);
    }

    async loadAll() {
        const stats = new Map();
        (await this.storage.find().toArray())
            .forEach(doc => {
                stats.set(doc._id, this._extractStatObj(doc));
            });
        return stats;
    }

    /**
     * @param {Object} obj
     */
    _extractStatObj(obj) {
        const stats = {};
        for (const prop in obj) {
            if (prop === '_id') {
                continue;
            }
            if (prop === 'usage') {
                stats[prop] = Util.objectToMap(obj[prop]);
                continue;
            }
            stats[prop] = obj[prop];
        }
        return stats;
    }
}

module.exports = StorageAdapter;