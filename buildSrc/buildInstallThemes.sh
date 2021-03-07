#!/bin/bash

yarn buildThemes
cd ..
python3 dokitheme --set-theme "Franxx: Zero Two Dark"
