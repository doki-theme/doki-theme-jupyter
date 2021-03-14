#!/bin/bash

yarn buildThemes
cd ..
python3 dokitheme --set-theme "Franxx: Zero Two Dark"
#python3 dokitheme --set-theme "OreGairu: Yukinoshita Yukino"
