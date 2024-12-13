#!/bin/bash

# Check if Python 3 is installed
if command -v python3 &>/dev/null; then
    echo "Python 3 is already installed."
else
    echo "Python 3 is not installed. Installing..."
    # Install Python 3
    sudo apt update
    sudo apt install -y python3
    echo "Python 3 installed successfully."
fi

# Start Python HTTP server
echo "Starting Analog on http://localhost:20002"
python3 -m http.server --bind 127.0.0.1 20002
