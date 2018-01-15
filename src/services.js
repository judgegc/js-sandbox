class Services {
    constructor() {
        this.services = new Map();
    }

    register(name, instance) {
        this.services.set(name.toLowerCase(), instance);
    }

    resolve(name) {
        return this.services.get(name.toLowerCase());
    }
}

module.exports = new Services();