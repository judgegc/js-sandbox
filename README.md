# **js-sandbox**

[Commands](#commands)

[Custom commands](#custom-commands)

[Http](#http)

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
And `'desc=this command output 42'` is additional information shows in `!cmdlist`. `desc` is optionsl.

Use `!rmcmd nameCmd` for remove custom command.


## Http

In your code available function [request](https://github.com/expressjs/express). Example:

```js
'custom command'
'cmd=curl'
request('http://api.ipify.org/?format=json', function (error, response, body) {
    if (!error && response.statusCode == 200) {
        console.log(body);
    }
})
```
```
{"ip":"1.2.3.4"}
```

## State

Also you can store some data between calls. 

For example. Next custom command prints, how many times it was called.
```js
'custom command'
'cmd=counter'
if(state.counter === undefined)
    state.counter = 1; //initialize state variable
else
    state.counter++; //increment state variable
console.log(`Counter: ${state.counter}`)
```

```
!counter
Counter: 1
!counter
Counter: 2
!counter
Counter: 3
```

# How to install

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
