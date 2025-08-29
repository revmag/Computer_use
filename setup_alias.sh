#!/bin/bash

AGENT_PATH="$(pwd)/macos_agent.js"
SHELL_CONFIG=""

# Detect shell and config file
if [[ "$SHELL" == *"zsh"* ]]; then
    SHELL_CONFIG="$HOME/.zshrc"
elif [[ "$SHELL" == *"bash"* ]]; then
    SHELL_CONFIG="$HOME/.bash_profile"
fi

if [[ -n "$SHELL_CONFIG" ]]; then
    echo "Adding agent alias to $SHELL_CONFIG"
    echo "" >> "$SHELL_CONFIG"
    echo "# macOS Natural Language Agent" >> "$SHELL_CONFIG"
    echo "alias agent='osascript -l JavaScript \"$AGENT_PATH\"'" >> "$SHELL_CONFIG"
    echo "✅ Alias added! Restart terminal or run: source $SHELL_CONFIG"
    echo "Usage: agent \"your command here\""
else
    echo "⚠️ Could not detect shell config file. Add this manually:"
    echo "alias agent='osascript -l JavaScript \"$AGENT_PATH\"'"
fi
