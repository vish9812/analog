# Check if Python 3 is installed
if (Get-Command python -ErrorAction SilentlyContinue) {
    Write-Output "Python 3 is already installed."
} else {
    Write-Output "Python 3 is not installed. Installing..."
    # Install Python 3
    winget install -e --id Python.Python.3.11
    Write-Output "Python 3 installed successfully."
}

# Start Python HTTP server
Write-Output "Starting Analog on port 20002..."
python -m http.server 20002
