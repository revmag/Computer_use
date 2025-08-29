#!/bin/bash

echo "🎬 macOS Natural Language Agent Demo"
echo "====================================="
echo ""

AGENT_PATH="./macos_agent.js"

echo "1️⃣ Demo: Find largest files and zip them"
echo "Command: Find the 3 largest files in ~/Downloads and zip them"
echo ""
read -p "Press Enter to continue..."
osascript -l JavaScript "$AGENT_PATH" "Find the 3 largest files in ~/Downloads and zip them"

echo ""
echo "2️⃣ Demo: Convert DOCX to PDF"
echo "Command: Convert all .docx to .pdf in ~/Documents"
echo ""
read -p "Press Enter to continue..."
osascript -l JavaScript "$AGENT_PATH" "Convert all .docx to .pdf in ~/Documents"

echo ""
echo "3️⃣ Demo: Fetch Hacker News headlines"
echo "Command: Open Hacker News, grab the top 5 headlines, save to Markdown file"
echo ""
read -p "Press Enter to continue..."
osascript -l JavaScript "$AGENT_PATH" "Open Hacker News, grab the top 5 headlines, save to Markdown file"

echo ""
echo "✅ Demo completed! Check ~/agent_operation_summary.md for results"
