#!/bin/bash
echo "Building DungeonSpire..."
mkdir -p dist
cp -r src dist/
cp -r data dist/
cp -r assets dist/
echo "Build complete."