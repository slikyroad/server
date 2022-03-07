#!/bin/bash

# start-new.sh dir

# Step 1: Copy base
cp -r scripts/base output/$1

#Step 2: run yarn
cd output/$1 && yarn