# **js-sandbox**

[Commands](#commands)

[Custom commands](#custom-commands)
* [Http](#http)
* [$arguments](#arguments)
* [$state](#state)
* [$in](#in)
* [$out](#out-flags)

[Installation](#how-to-install)

**Built-in modules**

* [Simple-statistics](https://github.com/simple-statistics/simple-statistics)
* [Pretty-ms](https://github.com/sindresorhus/pretty-ms)
* [request](https://github.com/expressjs/express)

## Commands

`!gc` - delete last 100 bot messages in current channel

`!mem` - current memory usage

`!say [channelId] [msg]`

`!react [channelId] [messageId] [reaction]`

`!rstr [channelId] [messageId] [text]`

`!servers` - list of servers where bot installed

`!mycolor [hexcolor|colorName] --purge`

`!cmdlist` - output all custom commands
`!cmdlist --my` - output own created custom commands

`!rmcmd [NAMECMD]` - remove your custom command

___

`channelId` is optional (default - current channel)

`reaction` is global or custom emoji. (Examples: :regional_indicator_a: )

`text` should contains only english letters


# Custom commands
Custom commands are a just normal code, which you can call using alias.


```javascript
'custom command'
'cmd=nameCmd'
'desc=this command output 42'
console.log(42);
```
The main difference is special comments at the beginning.
`'custom command'` tell that code would be regarded as custom command. 
At the next line, `'cmd=nameCmd'` set the alias name.
And `'desc=this command output 42'` is additional information shows in `!cmdlist`. `desc` is optional.

Use `!rmcmd nameCmd` for remove custom command.

## Http

In your code available function [request](https://github.com/expressjs/express). Example:

```js
'custom command'
'cmd=serverip'
request('http://api.ipify.org/?format=json', function (error, response, body) {
    if (!error && response.statusCode == 200) {
        console.log(body);
    }
})
```
```
!serverip
{"ip":"1.2.3.4"}
```

## $arguments
`$arguments` is a built in variable available only in custom commands. Contains user input data, passed with command. The type of `$arguments` is an [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array).
```js
'custom command'
'cmd=args'
console.log($arguments)
```
```
!args
[]
!args 1 2 3 4
["1","2","3","4"]
!args 1 "argument with space" 2
["1","argument with space","2"]
```

## $state

Also you can store some data between calls. 

For example. Next custom command prints, how many times it was called.
```js
'custom command'
'cmd=counter'
if($state.counter === undefined)
    $state.counter = 1; //initialize state variable
else
    $state.counter++; //increment state variable
console.log(`Counter: ${$state.counter}`)
```

```
!counter
Counter: 1
!counter
Counter: 2
!counter
Counter: 3
```

## $in

```ts
{
    members: {
        id: string;
        bot: boolean;
        username: string;
        displayName: string;
        displayColor: number;
        displayHexColor: string;
        avatar: string;
        defaultAvatarURL: string;
        displayAvatarURL: string;
        game: string;
        tag: string;
        status: string;
        discriminator: string;
        createdTimestamp: number;
        joinedTimestamp: number;
        roles: {
            color: number;
            createdTimestamp: number;
            editable: boolean;
            hexColor: string;
            hoist: boolean;
            id: string;
            managed: boolean;
            mentionable: boolean;
            name: string;
            permissions: number;
            position: number;
        }[];
    }[];
    channels: {
        id: string;
        name: string;
        type: string;
        createdTimestamp: number;
    }[];
    roles: {
        color: number;
        createdTimestamp: number;
        editable: boolean;
        hexColor: string;
        hoist: boolean;
        id: string;
        managed: boolean;
        mentionable: boolean;
        name: string;
        permissions: number;
        readablePermissions: string[];
        position: number;
    }[];
    emojis: {
        id: string;
        name: string;
        createdTimestamp: number;
        animated: boolean;
    }[];
    //channel where command was called
    channel: {
        id: string;
        name: string;
        nsfw: boolean;
    };
    //command caller
    author: {
        username: string;
        id: string;
        discriminator: string;
        bot: boolean;
    };
}
```


## Out flags
Control flow flags
### $out.channel
Usage:
```js
$out.channel = '1234567';
```

Example shows, how to redirect command response to another channel.
```js
'custom command'
'cmd=say'
if ($arguments.length >=2 ) {
    $out.channel = $arguments[0];
    console.log($arguments.slice(1).join(' '));
}
```
```
!say 123456 "Hi"
Hi
```
### $out.embed
Command response interpret as an embed object.

[Embed object](https://discordapp.com/developers/docs/resources/channel#embed-object-embed-structure)

Usage:
```js
$out.embed = true;
```
```js
$out.embed = true;
console.log({embed: {
    author: {
        name: 'Discord user'
    },
    fields: [
        {name: 'Title', value: 'some text'}
    ]
}});
```

# How to install
[Dev instance](https://discordapp.com/oauth2/authorize?client_id=368800242948243457&scope=bot&permissions=3072)
## **Own server**

Clone repository

`git clone https://github.com/judgegc/js-sandbox.git`

Go to `js-sandbox`

`cd js-sandbox`

### **With docker compose**
Build image

`docker-compose build`

Run containers as daemon: js-sandbox + mongodb

`docker-compose up -d`


### **Without docker compose**

Build app container with js-sandbox bot

```docker build -t jssanbox .```

Run mongodb container

`docker run --name mongo -d mongo:3.6.2`

Run app

`docker run --name jssanbox --link mongo:mongo -d --env-file envfile jssandbox`
