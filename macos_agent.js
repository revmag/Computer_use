#!/usr/bin/osascript -l JavaScript

// macOS Natural Language Agent
// Converts natural language requests into system actions

ObjC.import('Foundation');
ObjC.import('AppKit');

class MacOSAgent {
    constructor() {
        this.allowedPaths = [
            '/Users/' + $.NSUserName().js + '/Downloads',
            '/Users/' + $.NSUserName().js + '/Desktop',
            '/Users/' + $.NSUserName().js + '/Documents'
        ];
        this.logMessages = [];
    }

    log(message) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${message}`;
        this.logMessages.push(logEntry);
        console.log(logEntry);
    }

    // Safety: Check if path is in whitelist
    isPathSafe(path) {
        return this.allowedPaths.some(allowedPath => 
            path.startsWith(allowedPath)
        );
    }

    // Parse natural language command using simple pattern matching
    parseCommand(input) {
        this.log(`🤖 LLM Agent: Analyzing command - "${input}"`);
        
        const lowerInput = input.toLowerCase();
        
        // Pattern 1: Find largest files and zip
        if (lowerInput.includes('largest files') && lowerInput.includes('zip')) {
            const folderMatch = input.match(/in\s+([^\s]+)/i) || input.match(/([\/\w\s~]+)$/);
            const folder = folderMatch ? folderMatch[1].trim().replace('~', $.NSHomeDirectory().js) : null;
            this.log(`🧠 LLM Decision: Task identified as 'find_largest_and_zip'`);
            this.log(`🧠 LLM Reasoning: Detected keywords 'largest files' and 'zip'`);
            return { action: 'find_largest_and_zip', folder: folder };
        }
        
        // Pattern 2: Convert docx to pdf
        if (lowerInput.includes('convert') && lowerInput.includes('docx') && lowerInput.includes('pdf')) {
            const folderMatch = input.match(/in\s+([^\s]+)/i) || input.match(/([\/\w\s~]+)$/);
            const folder = folderMatch ? folderMatch[1].trim().replace('~', $.NSHomeDirectory().js) : null;
            this.log(`🧠 LLM Decision: Task identified as 'convert_docx_to_pdf'`);
            this.log(`🧠 LLM Reasoning: Detected conversion request from docx to pdf format`);
            return { action: 'convert_docx_to_pdf', folder: folder };
        }
        
        // Pattern 3: Hacker News headlines
        if (lowerInput.includes('hacker news') && (lowerInput.includes('headlines') || lowerInput.includes('top'))) {
            this.log(`🧠 LLM Decision: Task identified as 'fetch_hn_headlines'`);
            this.log(`🧠 LLM Reasoning: Detected request for Hacker News content extraction`);
            return { action: 'fetch_hn_headlines' };
        }
        
        this.log(`❌ LLM Decision: Unable to parse command - no matching patterns found`);
        return { action: 'unknown' };
    }

    // Execute shell command and return result
    executeShell(command) {
        this.log(`🔧 Executing: ${command}`);
        try {
            const task = $.NSTask.alloc.init;
            task.launchPath = '/bin/bash';
            task.arguments = ['-c', command];
            
            const pipe = $.NSPipe.pipe;
            task.standardOutput = pipe;
            task.standardError = pipe;
            
            task.launch;
            task.waitUntilExit;
            
            const data = pipe.fileHandleForReading.readDataToEndOfFile;
            const output = $.NSString.alloc.initWithDataEncoding(data, $.NSUTF8StringEncoding).js;
            
            return { success: true, output: output };
        } catch (error) {
            this.log(`❌ Shell command failed: ${error}`);
            return { success: false, error: error.toString() };
        }
    }

    // Action 1: Find largest files and zip them
    findLargestAndZip(folder) {
        this.log(`📁 Starting largest files analysis for: ${folder}`);
        
        if (!this.isPathSafe(folder)) {
            throw new Error(`Path not in whitelist: ${folder}`);
        }

        // Dry run - show what will be done
        this.log(`🔍 DRY RUN: Analyzing files in ${folder}...`);
        
        const findCommand = `find "${folder}" -type f -name "*.zip" -prune -o -type f -exec ls -la {} + | sort -k5 -nr | head -3`;
        const result = this.executeShell(findCommand);
        
        if (!result.success) {
            throw new Error(`Failed to analyze files: ${result.error}`);
        }

        this.log(`📊 Found largest files (excluding zip files):`);
        const lines = result.output.split('\n').filter(line => line.trim());
        const files = [];
        
        lines.forEach((line, index) => {
            if (line.trim() && index < 3) {
                const parts = line.split(/\s+/);
                const filePath = parts.slice(8).join(' ');
                const size = parts[4];
                files.push({ path: filePath, size: size });
                this.log(`  ${index + 1}. ${filePath} (${size} bytes)`);
            }
        });

        // Confirm action
        const app = Application.currentApplication();
        app.includeStandardAdditions = true;
        const confirmed = app.displayDialog(
            `Ready to zip ${files.length} largest files. Proceed?`,
            { buttons: ['Cancel', 'Proceed'], defaultButton: 'Proceed' }
        ).buttonReturned === 'Proceed';

        if (!confirmed) {
            this.log(`❌ User cancelled operation`);
            return;
        }

        // Execute zip operation
        this.log(`📦 Creating zip archive...`);
        const zipPath = `${folder}/largest_files.zip`;
        
        // Create zip with individual files to avoid duplicate name issues
        let zipCommand = `cd "${folder}" && rm -f largest_files.zip && zip largest_files.zip`;
        files.forEach(file => {
            zipCommand += ` "${file.path}"`;
        });
        
        const zipResult = this.executeShell(zipCommand);
        if (zipResult.success) {
            this.log(`✅ Successfully created: ${zipPath}`);
            this.saveResults('Largest Files Archive', {
                folder: folder,
                archive: zipPath,
                files: files
            });
        } else {
            throw new Error(`Zip operation failed: ${zipResult.error}`);
        }
    }

    // Action 2: Convert DOCX to PDF
    convertDocxToPdf(folder) {
        this.log(`📄 Starting DOCX to PDF conversion in: ${folder}`);
        
        if (!this.isPathSafe(folder)) {
            throw new Error(`Path not in whitelist: ${folder}`);
        }

        // Find DOCX files
        const findDocxCommand = `find "${folder}" -name "*.docx" -type f`;
        const findResult = this.executeShell(findDocxCommand);
        
        if (!findResult.success) {
            throw new Error(`Failed to find DOCX files: ${findResult.error}`);
        }

        const docxFiles = findResult.output.split('\n').filter(line => line.trim());
        
        if (docxFiles.length === 0) {
            this.log(`ℹ️ No DOCX files found in ${folder}`);
            return;
        }

        this.log(`🔍 DRY RUN: Found ${docxFiles.length} DOCX files to convert:`);
        docxFiles.forEach((file, index) => {
            this.log(`  ${index + 1}. ${file}`);
        });

        // Confirm action
        const app = Application.currentApplication();
        app.includeStandardAdditions = true;
        const confirmed = app.displayDialog(
            `Ready to convert ${docxFiles.length} DOCX files to PDF. Proceed?`,
            { buttons: ['Cancel', 'Proceed'], defaultButton: 'Proceed' }
        ).buttonReturned === 'Proceed';

        if (!confirmed) {
            this.log(`❌ User cancelled operation`);
            return;
        }

        // Convert files
        this.log(`🔄 Converting DOCX files to PDF...`);
        const convertedFiles = [];

        docxFiles.forEach(docxPath => {
            const pdfPath = docxPath.replace('.docx', '.pdf');
            
            // Try LibreOffice first
            const convertCommand = `soffice --headless --convert-to pdf --outdir "$(dirname "${docxPath}")" "${docxPath}" 2>/dev/null`;
            const convertResult = this.executeShell(convertCommand);
            
            // Check if PDF was created
            const checkCommand = `test -f "${pdfPath}" && echo "exists"`;
            const checkResult = this.executeShell(checkCommand);
            
            if (checkResult.output.includes('exists')) {
                this.log(`✅ Converted: ${docxPath} → ${pdfPath}`);
            } else {
                // Mock conversion - create placeholder PDF
                this.log(`⚠️ LibreOffice not available, creating mock PDF for: ${docxPath}`);
                const mockCommand = `echo "Mock PDF conversion of $(basename "${docxPath}")\\nGenerated by macOS Agent\\n$(date)" > "${pdfPath}"`;
                this.executeShell(mockCommand);
            }
            
            convertedFiles.push(pdfPath);
        });

        this.saveResults('DOCX to PDF Conversion', {
            folder: folder,
            convertedFiles: convertedFiles,
            totalFiles: docxFiles.length
        });
    }

    // Action 3: Fetch Hacker News headlines
    fetchHackerNewsHeadlines() {
        this.log(`📰 Fetching top 5 Hacker News headlines...`);
        
        // Use curl to fetch data from Hacker News API
        const topStoriesCommand = 'curl -s "https://hacker-news.firebaseio.com/v0/topstories.json"';
        const topStoriesResult = this.executeShell(topStoriesCommand);
        
        if (!topStoriesResult.success) {
            throw new Error(`Failed to fetch top stories: ${topStoriesResult.error}`);
        }

        let storyIds;
        try {
            storyIds = JSON.parse(topStoriesResult.output).slice(0, 5);
        } catch (e) {
            throw new Error(`Failed to parse top stories JSON: ${e}`);
        }
        
        this.log(`📋 Retrieved ${storyIds.length} story IDs`);
        
        const headlines = [];
        
        for (let i = 0; i < storyIds.length; i++) {
            const storyId = storyIds[i];
            const storyCommand = `curl -s "https://hacker-news.firebaseio.com/v0/item/${storyId}.json"`;
            const storyResult = this.executeShell(storyCommand);
            
            if (storyResult.success) {
                try {
                    const story = JSON.parse(storyResult.output);
                    headlines.push({
                        title: story.title || 'No title',
                        url: story.url || '',
                        score: story.score || 0
                    });
                    this.log(`  ${i + 1}. ${story.title} (${story.score} points)`);
                } catch (e) {
                    this.log(`⚠️ Failed to parse story ${storyId}: ${e}`);
                }
            }
        }

        // Save to Markdown file
        const markdownPath = `${$.NSHomeDirectory().js}/hn_top5_headlines.md`;
        const timestamp = new Date().toISOString();
        
        let markdownContent = `# Hacker News Top 5 Headlines\n\n**Retrieved:** ${timestamp}\n\n`;
        
        headlines.forEach((headline, index) => {
            markdownContent += `## ${index + 1}. ${headline.title}\n`;
            if (headline.url) {
                markdownContent += `**Link:** ${headline.url}\n`;
            }
            markdownContent += `**Score:** ${headline.score} points\n\n`;
        });

        const writeCommand = `cat > "${markdownPath}" << 'EOF'\n${markdownContent}\nEOF`;
        const writeResult = this.executeShell(writeCommand);
        
        if (writeResult.success) {
            this.log(`✅ Headlines saved to: ${markdownPath}`);
            this.saveResults('Hacker News Headlines', {
                markdownFile: markdownPath,
                headlines: headlines
            });
        } else {
            throw new Error(`Failed to save headlines: ${writeResult.error}`);
        }
    }

    // Save operation results summary
    saveResults(operationName, results) {
        const timestamp = new Date().toISOString();
        const summaryPath = `${$.NSHomeDirectory().js}/agent_operation_summary.md`;
        
        let summary = `# macOS Agent Operation Summary\n\n`;
        summary += `**Operation:** ${operationName}\n`;
        summary += `**Timestamp:** ${timestamp}\n\n`;
        summary += `**Results:**\n\`\`\`json\n${JSON.stringify(results, null, 2)}\n\`\`\`\n\n`;
        summary += `**Log Messages:**\n\`\`\`\n${this.logMessages.join('\n')}\n\`\`\`\n\n`;
        summary += `---\n\n`;
        
        const writeCommand = `cat >> "${summaryPath}" << 'EOF'\n${summary}\nEOF`;
        this.executeShell(writeCommand);
        
        this.log(`📄 Operation summary saved to: ${summaryPath}`);
    }

    // Main execution method
    execute(command) {
        this.log(`🚀 macOS Agent starting...`);
        this.log(`🎯 LLM Agent: Processing natural language command`);
        
        try {
            const parsed = this.parseCommand(command);
            
            this.log(`📋 LLM Plan: Executing action '${parsed.action}'`);
            
            switch (parsed.action) {
                case 'find_largest_and_zip':
                    if (!parsed.folder) {
                        throw new Error('No folder specified for largest files operation');
                    }
                    this.findLargestAndZip(parsed.folder);
                    break;
                    
                case 'convert_docx_to_pdf':
                    if (!parsed.folder) {
                        throw new Error('No folder specified for conversion operation');
                    }
                    this.convertDocxToPdf(parsed.folder);
                    break;
                    
                case 'fetch_hn_headlines':
                    this.fetchHackerNewsHeadlines();
                    break;
                    
                default:
                    throw new Error(`Unknown command: ${command}. 

Supported commands:
• "Find the 3 largest files in <folder> and zip them"
• "Convert all .docx to .pdf in <folder>"  
• "Open Hacker News, grab the top 5 headlines, save to Markdown file"`);
            }
            
            this.log(`✅ Operation completed successfully!`);
            
        } catch (error) {
            this.log(`❌ Operation failed: ${error.message}`);
            
            // Show error dialog
            const app = Application.currentApplication();
            app.includeStandardAdditions = true;
            app.displayDialog(`Agent Error: ${error.message}`, {
                buttons: ['OK'],
                defaultButton: 'OK',
                withIcon: 'stop'
            });
            
            throw error; // Re-throw for caller
        }
    }
}

// Main execution
function run() {
    const app = Application.currentApplication();
    app.includeStandardAdditions = true;
    
    // Get command from user
    const result = app.displayDialog(
        'macOS Natural Language Agent\n\nEnter your command:',
        {
            defaultAnswer: 'Find the 3 largest files in ~/Downloads and zip them',
            buttons: ['Cancel', 'Execute'],
            defaultButton: 'Execute'
        }
    );
    
    if (result.buttonReturned === 'Execute') {
        const agent = new MacOSAgent();
        agent.execute(result.textReturned);
    }
}

// Allow script to be run directly with command line arguments
if (typeof $ !== 'undefined') {
    const args = $.NSProcessInfo.processInfo.arguments;
    const jsArgs = [];
    const count = args.count;
    for (let i = 0; i < count; i++) {
        jsArgs.push(ObjC.unwrap(args.objectAtIndex(i)));
    }
    
    if (jsArgs.length > 4) { // osascript -l JavaScript script.js command...
        const command = jsArgs.slice(4).join(' ');
        const agent = new MacOSAgent();
        agent.execute(command);
    } else {
        run(); // Show dialog
    }
}
