const assert = require('assert');
const Discord = require('discord.js');

const ArgsParser = require('../src/args-parser');
const MessageParser = require('../src/message-parser');
const CommandProcessor = require('../src/command-processor');
const JsSandboxCommand = require('./../src/commands/js-sandbox-command');
const GcCommand = require('./../src/commands/gc-command');
const UnknownCommand = require('./../src/commands/unknown-command');
const StrToEmoji = require('./../src/str-to-emoji');
const settings = require('./../settings.json');
const ColorCommand = require('./../src/commands/color-command');

describe('ArgsParser', function () {
    describe('_tokenize()', function () {
        const parser = new ArgsParser();

        it('should return empty array', function () {
            assert.deepEqual([], parser._tokenize(''));
        });

        it('should return empty array', function () {
            assert.deepEqual([], parser._tokenize(' '));
        });

        it('should return empty array', function () {
            assert.deepEqual([], parser._tokenize('""'));
        });

        it('should return array with one token', function () {
            assert.deepEqual(['--all'], parser._tokenize('--all'));
        });

        it('should return array with one token without quotes', function () {
            assert.deepEqual(['Kotya Bot'], parser._tokenize('"Kotya Bot"'));
        });

        it('should return array with one token without quotes', function () {
            assert.deepEqual(['Ko  tya Bot'], parser._tokenize('"Ko  tya Bot"'));
        });

        it('should return array with one token contains quote', function () {
            assert.deepEqual(['Kotya\\" Bot'], parser._tokenize('"Kotya\\" Bot"'));
        });

        it('should return array with one token with backslash', function () {
            assert.deepEqual(['Kotya\\ Bot'], parser._tokenize('"Kotya\\ Bot"'));
        });

        it('should return array with one token with leading backslash', function () {
            assert.deepEqual(['\\Kotya\\ Bot'], parser._tokenize('"\\Kotya\\ Bot"'));
        });

        it('should return array with one token with two leading backslash', function () {
            assert.deepEqual(['\\\\Kotya\\ Bot'], parser._tokenize('"\\\\Kotya\\ Bot"'));
        });

        it('should return array with two tokens', function () {
            assert.deepEqual(['--bot', 'KotyaBot'], parser._tokenize('--bot KotyaBot'));
        });

        it('should return array with two tokens (more one space sep)', function () {
            assert.deepEqual(['--bot', 'KotyaBot'], parser._tokenize('--bot   KotyaBot'));
        });

        it('should return array with two tokens, simple and unquoted', function () {
            assert.deepEqual(['--bot', 'Kotya Bot'], parser._tokenize('--bot "Kotya Bot"'));
        });

        it('should return array with two unquoted tokens', function () {
            assert.deepEqual(['Python Bot', 'Kotya Bot'], parser._tokenize('"Python Bot" "Kotya Bot"'));
        });
    });
});

describe('MessageParser', function () {
    describe('parse', function () {
        const parser = new MessageParser();
        it('should return command without args', function () {
            assert.deepEqual({ type: 'command', name: 'watch', args: [] }, parser.parse('!watch'));
        });

        it('should return command with one args', function () {
            assert.deepEqual({ type: 'command', name: 'watch', args: ['1'] }, parser.parse('!watch 1'));
        });

        it('should return command with one args', function () {
            assert.deepEqual({ type: 'command', name: 'gc', args: ['--all'] }, parser.parse('!gc --all'));
        });

        it('should return command with two args', function () {
            assert.deepEqual({ type: 'command', name: 'gc', args: ['--name', 'Bot name'] }, parser.parse('!gc --name "Bot name"'));
        });

        it('should return js source code ', function () {
            assert.deepEqual({ type: 'source_code', language: 'js', content: 'console.log(42)' },
                parser.parse('```js\nconsole.log(42)\n```'));
        });

        it('should return unknown command', function () {
            assert.deepEqual({ type: 'unknown', content: 'Hi all!' }, parser.parse('Hi all!'));
        });

        it('should return unknown command', function () {
            assert.deepEqual({ type: 'unknown', content: '! Hi all!' }, parser.parse('! Hi all!'));
        });
    });
});
describe('Commands', function () {
    describe('JsSandboxCommand', function () {
        describe('execute', function () {
            const client = {};
            const msg = {
                channel: { type: 'dm', id: 0, name: 'test', nsfw: false },
                author: { username: 'tester', id: 0, descriminator: 0, bot: false }
            };

            it('should return execution result', function () {
                return new JsSandboxCommand('console.log(42)', [], settings['js-sandbox']['memory-limit']).execute(client, msg)
                    .then(x => assert(x === '42', 'Wrong answer. Expected 42'));
            });

            it('should return execution error', function () {
                return new JsSandboxCommand('aaa', [], settings['js-sandbox']['memory-limit']).execute(client, msg)
                    .then(x => assert(x === 'ReferenceError: aaa is not defined', 'Wrong answer. Expected 42'));
            });

            it('should return memory limit error', function () {
                return new JsSandboxCommand('var s = [1,2,3];while(true) { s = s.concat(s);}'
                    , [], settings['js-sandbox']['memory-limit']).execute(client, msg)
                    .then(x => assert(x === 'Error: Sandbox memory limit reached', 'Wrong answer. Expected 42'));
            });
        });
    });

    describe('ColorCommand', function () {
        const roles = new Map();
        const userRole = { name: 'color_10', calculatedPosition: 1, managed: false, delete: () => Promise.resolve(), setColor: () => Promise.resolve() };
        const botRole = { name: 'bot_role', calculatedPosition: 2, managed: true };
        roles.set('100', userRole);
        roles.set('101', botRole);

        const members = new Map();
        members.set('10', { roles: new Map([['100', roles.get('100')]]), addRole: () => Promise.resolve() });//user
        members.set('11', { roles: new Map([['101', roles.get('101')]]), addRole: () => Promise.resolve() });//bot

        const client = {
            user: {
                id: '11'
            }
        };
        const msg = {
            channel: {
                type: 'text', id: 0, name: 'test', nsfw: false,
                guild: {
                    roles: roles,
                    members: members,
                    createRole: (obj) => Promise.resolve()
                }
            },
            author: { username: 'tester', id: '10', descriminator: 0, bot: false }
        };
        describe('execute', function () {
            it('should return reject for no args', function () {
                return new ColorCommand([]).execute(client, msg)
                    .catch(e => assert.ok(true, 'rejected'));
            });

            it('should return reject for --purge with exist color role', function () {
                return new ColorCommand(['--purge']).execute(client, msg)
                    .catch(e => assert.ok(true, 'rejected'));
            });

            it('should return reject for --purge no exists color role', function () {
                roles.delete('100');
                return new ColorCommand(['--purge']).execute(client, msg)
                    .catch(e => roles.set('100', userRole), assert.ok(true, 'rejected'));
            });

            it('should return reject for no valid color', function () {
                return new ColorCommand(['notacolor']).execute(client, msg)
                    .catch(e => assert.ok(true, 'rejected'));
            });

            it('should return reject for valid color', function () {
                return new ColorCommand(['red']).execute(client, msg)
                    .catch(e => assert.ok(true, 'rejected'));
            });

            it('should return reject for rejected deleting role', function () {
                msg.channel.guild.roles.get('100').delete = () => Promise.reject();
                return new ColorCommand(['red']).execute(client, msg)
                    .catch(e => msg.channel.guild.roles.get('100').delete = () => Promise.resolve(), assert.ok(true, 'rejected'));
            });

            it('should return reject for dm message', function () {
                msg.channel.type = 'dm';
                return new ColorCommand([]).execute(client, msg)
                    .catch(e => assert.ok(true, 'rejected'));
            });
        });

        describe('_parseColor', function () {
            it('should return decimal color representation', function () {
                assert.equal(new ColorCommand([])._parseColor('red'), 16711680);
            });

            it('should return decimal color representation', function () {
                assert.equal(new ColorCommand([])._parseColor('#FF0000'), 16711680);
            });

            it('should return undefined', function () {
                assert.equal(new ColorCommand([])._parseColor('#MFF0AA'), undefined);
            });
        });

        describe('_genRoleName', function () {
            it('should return color role id', function () {
                assert.equal(new ColorCommand([])._genRoleName('12345'), 'color_12345');
            });
        });

        describe('_findColorRole', function () {
            it('should return color role object', function () {
                assert.equal(new ColorCommand([])._findColorRole(msg), roles.get('100'));
            });
        });
    });
});

describe('StrToEmoji', function () {
    describe('convert', function () {
        it('should return empty array', function () {
            assert.deepEqual([], new StrToEmoji().convert(''));
        });

        it('should return emojis array', function () {
            assert.deepEqual(['🇦', '🇨', '🇴', '🅾', '🇱', '🇹'], new StrToEmoji().convert('acoolt'));
        });

        it('should return empty array', function () {
            assert.deepEqual([], new StrToEmoji().convert('aaa'));
        });
    });
});

describe('CommandProcessor', function () {
    describe('process', function () {
        const cmdProc = new CommandProcessor();
        it('should return JsSandboxCommand instance', function () {
            assert.deepEqual(new JsSandboxCommand('console.log(42)', [], settings['js-sandbox']['memory-limit']),
                cmdProc.process({ type: 'source_code', language: 'js', content: 'console.log(42)' }));
        });

        it('should return GcCommand instance', function () {
            assert.deepEqual(new GcCommand([]),
                cmdProc.process({ type: 'command', name: 'gc', args: [] }));
        });

        it('should return UnknownCommand instance', function () {
            assert.deepEqual(new UnknownCommand([]),
                cmdProc.process({ type: 'unknown', content: 'Meow' }));
        });
    });
});