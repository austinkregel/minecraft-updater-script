#!/usr/bin/env bash
echo "args: $@";

if [ $1 == "paper" ]; then
    echo "Updating paper minecraft server!"
    node paper-mc-update.js
else
    echo "Updating vanilla minecraft server!"
    node vanilla-mc-update.js
fi