# Angular Filter Library - Getting Started Guide

## What is this project?

This is an **Angular Filter Library** - a collection of reusable filter components for web applications. Think of it like a toolbox of search and filtering elements that you can easily add to any website or application.

### Simple Explanation

Imagine you're shopping online and want to:
- Search for a product (like "laptop")
- Filter by category (like "electronics") 
- Set a price range (like $100 to $500)

This project provides pre-built, customizable components that make it easy to add these kinds of filters to any Angular website, without having to build them from scratch.

### What can you do with this library?

- **Search**: Text input for searching content
- **Select Options**: Dropdowns or checkboxes to select categories
- **Range Filters**: Select minimum and maximum values (like price ranges)
- **Save Preferences**: Remember user's last filter settings
- **Share Links**: Create URL links with filter settings included

## 🚀 Quick Start - How to Run the Project

### Prerequisites (What you need first)
1. **Node.js** (download from [nodejs.org](https://nodejs.org) - choose LTS version)
2. **A command line tool** (like Command Prompt on Windows, Terminal on Mac/Linux)

### Step-by-Step Instructions

#### 1. Download the project
- If you downloaded a ZIP file: Extract it to a folder on your computer
- If using Git: Clone the repository

#### 2. Open your command line tool
- **Windows**: Press `Windows key + R`, type `cmd`, press Enter
- **Mac**: Press `Cmd + Space`, type `Terminal`, press Enter

#### 3. Navigate to the project folder
In your command line, type:
```bash
cd path/to/your/filter-workspace
```
Replace `path/to/your/filter-workspace` with the actual path where you extracted the folder.

For example, if it's on your Desktop:
```bash
cd C:\Users\YourName\Desktop\filter-workspace
```

#### 4. Install the required packages
Type this command and press Enter:
```bash
npm install
```
Wait until this process completes (it may take a few minutes).

#### 5. Run the project
Type this command and press Enter:
```bash
npm start
```

#### 6. View the project in your browser
Open your web browser (Chrome, Firefox, Edge, etc.) and go to:
```
http://localhost:4200
```

You should now see the demo application showing the filter components in action!

## 🛠️ What's Inside - The Filter Components

This project contains different types of filters:

### 1. Text Filter
- **What it does**: Allows users to type text to search
- **Example**: Search box for product names
- **Looks like**: Input box with a label

### 2. Options Filter  
- **What it does**: Allows users to select one or multiple options from a list
- **Example**: Select product categories (Electronics, Books, Clothing)
- **Looks like**: Dropdown menu or checkbox list

### 3. Compare Filter
- **What it does**: Allows users to set ranges (like price: $100-$500)
- **Example**: Price range slider or min/max inputs
- **Looks like**: Two input boxes for min and max values

## 📚 How to Use the Library in Your Own Project

If you want to use these filter components in your own Angular project:

1. **Install the library** (after building):
   ```bash
   npm install filter-lib
   ```

2. **Import the components** in your Angular component:
   ```typescript
   import { DftFilterComponent } from 'filter-lib';
   ```

3. **Define your filters**:
   ```typescript
   filterItems = [
     {
       name: 'search',
       type: 'text',
       label: 'Search Products',
       placeholder: 'Type to search...'
     }
   ];
   ```

4. **Use in your HTML template**:
   ```html
   <dft-filter [filters]="filterItems"></dft-filter>
   ```

## 🧪 Demo Application

The project includes a demo application that shows all filter types working together. When you run `npm start`, you'll see:

- **Live Filter Demo**: Interactive filters you can play with
- **URL Integration**: Filters are saved in the URL so you can share links
- **Local Storage**: Filters are remembered when you come back 
- **Reset/Apply Buttons**: Controls to manage your filter settings

## 🛠️ Useful Commands for Development

- `npm start` - Run the demo application
- `npm run build:lib` - Build the library for distribution
- `npm run watch:lib` - Automatically rebuild when you make changes
- `npm test` - Run tests (if available)

## 🧩 Project Structure (For Reference)

- `/projects/filter-lib` - The actual filter library code
- `/projects/demo-app` - The demo application showing how to use the library
- `/package.json` - Lists all dependencies needed



This library makes it easy to add professional-looking filters to your web applications. Instead of building search and filtering features from scratch, you can use these pre-made components and customize them as needed.

The demo application shows exactly how to use each type of filter, so you can use it as a guide when building your own projects.