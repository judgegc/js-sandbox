const jsonschema = require('jsonschema');

class EmbedValidator {
    constructor() {
        this._root = {
            type: 'object',
            properties: {
                content: { type: 'string' },
                embed: { $ref: '/Embed', required: true }
            }
        };
        this._embed = {
            id: '/Embed',
            type: 'object',
            properties: {
                title: { type: 'string' },
                type: { type: 'string' },
                description: { 'type': 'string' },
                url: { type: 'string' },
                timestamp: { type: 'date-time' },
                color: { type: 'number' },
                footer: { $ref: '/Footer' },
                image: { $ref: '/Image' },
                thumbnail: { $ref: '/Thumbnail' },
                video: { $ref: '/Video' },
                provider: { $ref: '/Provider' },
                author: { $ref: '/Author' },
                fields: { type: 'array', items: { $ref: '/Field' } }
            }
        };
        this._footer = {
            id: '/Footer',
            type: 'object',
            properties: {
                text: { type: 'string' },
                icon_url: { type: 'string' },
                proxy_icon_url: { type: 'string' }
            }
        };
        this._image = {
            id: '/Image',
            type: 'object',
            properties: {
                url: { type: 'string' },
                proxy_url: { type: 'string' },
                height: { type: 'number' },
                width: { type: 'number' }
            }
        };
        this._thumbnail = {
            id: '/Thumbnail',
            type: 'object',
            properties: {
                url: { type: 'string' },
                proxy_url: { type: 'string' },
                height: { type: 'number' },
                width: { type: 'number' }
            }
        };
        this._video = {
            id: '/Video',
            type: 'object',
            properties: {
                url: { type: 'string' },
                height: { type: 'number' },
                width: { type: 'number' }
            }
        };
        this._provider = {
            id: '/Provider',
            type: 'object',
            properties: {
                name: { type: 'number' },
                url: { type: 'string' }
            }
        };
        this._author = {
            id: '/Author',
            type: 'object',
            properties: {
                name: { type: 'string' },
                url: { type: 'string' },
                icon_url: { type: 'string' },
                proxy_icon_url: { type: 'string' }
            }
        };
        this._field = {
            id: '/Field',
            type: 'object',
            properties: {
                name: { type: 'string', required: true },
                value: { type: 'string', required: true },
                inline: { type: 'boolean' }
            }
        };
        this._schema = new jsonschema.Validator();
        this._schema.addSchema(this._footer);
        this._schema.addSchema(this._image);
        this._schema.addSchema(this._thumbnail);
        this._schema.addSchema(this._video);
        this._schema.addSchema(this._provider);
        this._schema.addSchema(this._author);
        this._schema.addSchema(this._field);
        this._schema.addSchema(this._embed);
    }

    validate(embed) {
        return this._schema.validate(embed, this._root)
    }
}

module.exports = EmbedValidator;