#!/bin/bash
# Simple deployment script for The 9-Minute Foundation

echo "Installing dependencies..."
pip install -r requirements.txt

echo "Starting server..."
python main.py
