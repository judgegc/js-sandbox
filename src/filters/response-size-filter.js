const settings = require('./../../settings.json');

class ResponseSizeFilter {
    constructor(response) {
        this.response = response;
        this.responseMaxLines = Number.parseInt(settings['response-max-lines']);
        this.messageMaxLength = Number.parseInt(settings['message-max-length']);
    }
    filter() {
        if (!this.response) {
            return undefined;
        }
        if (this.response.split(/\r\n|\r|\n/)
            .filter(l => l.length).length > this.responseMaxLines) {
            return 'Response limit ' + this.responseMaxLines + ' lines.';
        } else if (this.response.length > this.messageMaxLength) {
            return 'Response too long.';
        }
        return this.response;
    }
}

module.exports = ResponseSizeFilter;