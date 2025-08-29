
### macOS Natural Language Agent
A minimal macOS agent that converts natural-language requests into system actions using JavaScript for Automation (JXA) and AppleScript.


### Features

The agent can interpret and execute three types of natural-language commands:
```
“Find the 3 largest files in <folder> and zip them”
“Convert all .docx to .pdf in <folder>”
“Open Hacker News, grab the top 5 headlines, save to a Markdown file”
```
## Architecture

```
Natural Language Input
         ↓
  LLM-like Parser (Pattern Matching)
         ↓
   Safety Validation (Path Whitelist)
         ↓
   Dry Run + User Confirmation
         ↓
     Native macOS Execution
         ↓
   Logging + Results Summary
```

## Setup
```
macOS (tested on macOS 10.15+)
Terminal access
Internet connection (for the Hacker News API)
```

## Grant Necessary permissions

```
On macOS Ventura (13)+
System Settings → Privacy & Security → Full Disk Access → add/enable your Terminal (or iTerm).
System Settings → Privacy & Security → Automation → allow Terminal to control System Events and other required apps.
```


# Simple Setup Steps
1) Run your build script
```
bash build_script.sh
```

2) Go into the folder
```
cd macos-nl-agent
```

3) Try it out
### Option A: Interactive dialog
```
osascript -l JavaScript macos_agent.js
```

### Option B: Direct command (examples)
```
osascript -l JavaScript macos_agent.js "Open Hacker News, grab the top 5 headlines, save to Markdown file"
osascript -l JavaScript macos_agent.js "Find the 3 largest files in ~/Downloads and zip them"
osascript -l JavaScript macos_agent.js "Convert all .docx to .pdf in ~/Documents"
```

### Examples
Example 1: Find Largest Files
agent "Find the 3 largest files in ~/Downloads and zip them"

What it does:
```
Scans files in ~/Downloads (skips existing zip files)
Shows a dry run with file sizes
Asks for confirmation
Creates largest_files.zip containing the 3 largest files
Logs all operations
```


Example 2: Convert Documents
agent "Convert all .docx to .pdf in ~/Documents"

What it does
```
Scans for .docx files
Shows files in dry run first
Attempts conversion using LibreOffice (soffice) or Microsoft Word
If neither is available, performs a mock conversion (creates a .pdf.mock.txt)
Creates corresponding .pdf files next to the originals
```

Example 3: Hacker News Headlines
agent "Open Hacker News, grab the top 5 headlines, save to Markdown file"

What it does
```
Opens Hacker News in your default browser
Fetches top stories from the HN API
Retrieves details for the top 5 stories
Creates a nicely formatted Markdown file (titles, URLs, scores)
Saves to ~/hn_top5_headlines.md
```

## Safety Features
Path Whitelist

Operations are only allowed in safe directories by default:
```
~/Downloads
~/Desktop
~/Documents
```
You can extend or modify the whitelist inside macos_agent.js (look for an ALLOWLIST array).

Confirmation Dialogs
```
Shows a dry run (planned actions) before execution
Requires user confirmation for write/destructive operations
Clear, actionable error messages
```

Error Handling
```
Graceful failures with detailed context
“Mock” fallback for DOCX→PDF when converters aren’t present
Comprehensive logging and a final results summary
```
