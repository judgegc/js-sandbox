#!/bin/bash
heroku container:push worker -a js-sandbox-bot
heroku container:release worker -a js-sandbox-bot