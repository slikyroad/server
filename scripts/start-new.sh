#!/bin/bash

# start-new.sh dir

# Step 1: Copy base
mkdir -p generated
rm -rf generated/$1
cp -r scripts/base generated/$1

#Step 2: run yarn
cd generated/$1 && yarn