# PromptyFlow - User Guide
**Website: http://promptyflow.com/**

## Table of Contents
1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Application Interface](#application-interface)
4. [Working with Projects](#working-with-projects)
5. [Context Blocks](#context-blocks)
6. [Creating Prompts](#creating-prompts)
7. [Templates](#templates)
8. [AI Integration](#ai-integration)
9. [Keyboard Shortcuts](#keyboard-shortcuts)
10. [Tips and Best Practices](#tips-and-best-practices)
11. [Troubleshooting](#troubleshooting)

## Introduction

**PromptyFlow** is a professional tool for creating, organizing, and managing prompts for AI models. The application allows you to structure large volumes of contextual information and create complex multi-stage prompts.

### Key Features:
- 📁 Project management with auto-save
- 🧩 Three-level context organization system
- 📝 Powerful prompt editor with templates
- 🤖 Integration with 5 AI providers
- 🌐 Full support for Russian and English languages
- 🔒 Secure API key storage

## Getting Started

### Installation
1. Download the installer for your operating system
2. Run the installation and follow the instructions
3. After installation, launch PromptyFlow

### First Launch
On first launch, the application will:
- Create necessary folders for projects and templates
- Load default templates
- Open a new empty project

### Language Selection
The interface language can be changed at any time:
1. Click the language button in the top right corner
2. Select the desired language from the dropdown menu
3. The interface will instantly switch to the selected language

## Application Interface

The application has a three-panel structure:

### 1. Left Panel - Navigation
- **Projects Tab**: list of saved projects
- **Project Templates Tab**: ready-made templates for quick start

### 2. Central Panel - Blocks
- **Context Tab**: manage context blocks
- **Prompt Tab**: manage prompt blocks

### 3. Right Panel - Editor
Displays the active element for editing:
- Context block/item/sub-item
- Prompt block with template and settings

### Resizing Panels
You can adjust panel sizes:
- Hover the cursor over the border between panels
- Hold the left mouse button and drag the border
- Sizes will be saved for the current session

## Working with Projects

### Creating a New Project
1. Click "New Project" in the menu or use Ctrl+N
2. Enter the project name
3. The project will automatically save to the projects folder

### Opening a Project
1. Go to the "Projects" tab in the left panel
2. Click on the desired project from the list
3. The project will load with all data

### Saving a Project
- **Auto-save**: occurs when changes are made
- **Manual save**: Ctrl+S or "Save" button
- **Save As**: creates a copy with a new name

### Import and Export
- **Export**: saves the project to a selected folder
- **Import**: loads a project from an external .json file

### Project Templates
Use ready templates for quick start:
1. Open the "Project Templates" tab
2. Select a suitable template
3. Click "Load Template"
4. The template will open as a new project

## Context Blocks

### Three-Level Structure

#### Level 1: Context Blocks
Main sections of your context:
- Click "➕ Add Block" to create
- Double-click the name to edit
- Use "🗑️" to delete

#### Level 2: Context Items
Subsections within blocks:
- Click "➕" inside a block to add an item
- Each item has a title and content
- Character counter is displayed

#### Level 3: Sub-items
Additional detail:
- Click "➕ sub-item" inside an item
- Useful for breaking down large texts
- Independent management of each sub-item

### Editing Context
1. Select an element in the central panel
2. Edit content in the right panel
3. Changes are saved automatically

### Splitting Large Texts
For texts over 2000 characters:
1. Click the "Split" button in the editor
2. Configure splitting parameters:
   - By characters
   - By paragraphs
   - By sentences
3. Text will automatically split into sub-items

### Context Operations
- **Copy**: select text and use Ctrl+C
- **Paste**: Ctrl+V in the editor field
- **Selection**: checkboxes to include in prompt
- **Moving**: drag and drop elements (in development)

## Creating Prompts

### Adding a Prompt Block
1. Go to the "Prompt" tab
2. Click "➕ Add Prompt"
3. Enter the prompt name

### Prompt Structure
A prompt consists of:
- **Template**: main text with `{{context}}` placeholder
- **Selected context**: checked items from context blocks

### Writing a Template
1. Enter text in the "Prompt Template" field
2. Use `{{context}}` where context should be inserted
3. Example:
```
Analyze the following text:

{{context}}

Answer the questions:
1. Main topic
2. Key points
3. Conclusions
```

### Selecting Context
1. In the "Context Selection" section, check needed:
   - Entire blocks
   - Individual items
   - Specific sub-items
2. Counter shows total character count

### Compiling a Prompt
- **"Compile"**: combines template and context
- **"With Tags"**: wraps context in XML tags for structuring
- **"Copy Result"**: copies ready prompt to clipboard

### Managing Prompts
- Create multiple prompts in one project
- Switch between them in the central panel
- Each prompt saves its own context set

## Templates

### Using Ready Templates
1. Click "📁 Load Template" in the prompt editor
2. A list of available .txt files will appear
3. Hover over a template for preview
4. Click to load into current prompt

### Searching Templates
- Use the search field in the templates menu
- Search by file name
- Results filter in real-time

### Creating Your Templates
1. Write a template in the editor
2. Click "💾 Save as Template"
3. Enter file name
4. Template will save to templates folder

### Organizing Templates
- Templates are stored in the `templates` folder
- You can create subfolders for categories
- Only .txt files are supported

### Variables in Templates
Use placeholders:
- `{{context}}` - for context insertion
- `{{date}}` - current date (in development)
- `{{project}}` - project name (in development)

## AI Integration

### Supported Providers
1. **OpenAI** - GPT-3.5, GPT-4
2. **Anthropic** - Claude 3
3. **OpenRouter** - multiple models
4. **Google Gemini** - Gemini Pro
5. **xAI Grok** - Grok models

### Setting Up API Keys
1. Click "⚙️ AI Settings" in the top menu
2. Select a provider
3. Enter API key
4. Click "Test Connection"
5. Key will save in secure storage

### Sending Prompt to AI
1. Compile the prompt
2. Click "🤖 Send to AI"
3. Select model from list
4. Wait for response
5. Response will appear in modal window

### Working with Responses
- **Copy**: save response to clipboard
- **Add to Context**: create new item with response
- **Save**: export to file

### Model Settings
In the AI dialog you can configure:
- Temperature (creativity)
- Maximum tokens
- Top-p (diversity)
- System prompt

## Keyboard Shortcuts

### Main Commands
- **Ctrl+S** - Save project
- **Ctrl+N** - New project
- **Ctrl+O** - Open project
- **Ctrl+E** - Fullscreen editor
- **Ctrl+Z** - Undo
- **Ctrl+Y** - Redo

### Editing
- **Ctrl+C** - Copy
- **Ctrl+V** - Paste
- **Ctrl+X** - Cut
- **Ctrl+A** - Select all
- **Ctrl+F** - Search (in development)

### Navigation
- **Tab** - Switch between panels
- **↑/↓** - Navigate through list
- **Enter** - Open/edit
- **Delete** - Delete selected item
- **Escape** - Close dialog/menu

## Tips and Best Practices

### Organizing Context
1. **Use descriptive names** for blocks and items
2. **Group related information** in one block
3. **Break down large texts** into logical parts
4. **Use sub-items** for detail

### Effective Prompts
1. **Be specific** in instructions
2. **Structure requests** with lists or points
3. **Specify response format** (list, table, code)
4. **Use examples** for better understanding

### Working with Large Projects
1. **Create separate prompts** for different tasks
2. **Use templates** for repeating structures
3. **Regularly save** important projects
4. **Export backups** of critical data

### Token Optimization
1. **Select only needed context** to save tokens
2. **Remove redundant information** from context
3. **Use concise formulations** in prompts
4. **Monitor character counter** when compiling

## Troubleshooting

### Application Won't Start
- Check system requirements
- Reinstall the application
- Delete settings folder in `%AppData%/PromptyFlow`

### Project Won't Save
- Check access rights to projects folder
- Ensure disk is not full
- Try "Save As" with a new name

### API Key Not Working
- Verify key correctness
- Check account balance
- Review API provider limits
- Try connection test

### Prompt Won't Compile
- Check for `{{context}}` in template
- Ensure at least one context item is selected
- Verify template syntax

### Data Loss
- Auto-save is enabled by default
- Backups are created automatically
- Check `backups` folder in projects directory

### Language Issues
- Switch language through menu
- Clear browser cache (for Electron)
- Check localization files

## Feedback

If you have questions or suggestions:
- 🌐 Website: http://promptyflow.com/
- 📧 Email: support@promptyflow.com
- 🐛 Bug reports: GitHub Issues
- 💬 Community: Discord server

---

**Documentation Version**: 1.0.0  
**Last Updated**: 2025  
**© PromptyFlow Team**