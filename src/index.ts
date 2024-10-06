#!/usr/bin/env node
import figlet from "figlet";
import { Command } from "commander";
import fs from "fs";
import path from "path";
import { spawn, execSync } from 'child_process';
import { getAppDependencies } from "./readDependencies";

const program = new Command();

// Display ASCII art for the tool name
console.log(figlet.textSync("shalo", { horizontalLayout: 'default', verticalLayout: 'default' }));

program
    .command('clone <source>')
    .description('Clone a repository')
    .action(cloneRepo);

program
    .command('checkout')
    .description('Checkout a specific app or folder')
    .option('-a, --apps <app-name>', 'App Name for checkout')
    .option('-e, --exclude <app-name>', 'App Name to exclude from checkout')
    .option('-f, --folder-only <folder-name>', 'Folder Name for checkout')
    .action(checkout);

program
    .command('add [name]')
    .description('Add a folder or NX project to the monorepo')
    .option('-f, --folder-only', 'Add only the folder without computing dependencies')
    .option('-a, --apps <app-name>', 'App Name to add with dependencies')
    .action(addApp);

program
    .command('clean')
    .description('Clean the repository by disabling sparse-checkout')
    .action(disableSparseCheckout);

program.parse(process.argv);

// Disable sparse checkout and clean up
async function disableSparseCheckout() {
    console.log('Disabling sparse-checkout...');
    executeCommand('git sparse-checkout disable');

    const dirPath = path.join(__dirname, '/.git/index/sparse-checkout');
    try {
        fs.rmSync(dirPath, { recursive: true, force: true });
        console.log('Directory .git/index/sparse-checkout deleted successfully.');
    } catch (err) {
        console.error('Error deleting sparse-checkout directory:', err.message);
    }
    console.log('Sparse-checkout disabled. Repository is now fully accessible.');
}

// Add an app or folder to sparse-checkout
async function addApp(name: string | undefined, options: { folderOnly?: boolean, apps?: string }) {
    if (!name && !options.apps) {
        console.error('❌ Error: You must provide a folder name or use the -a option to specify an app.');
        return;
    }

    if (options.folderOnly && name) {
        const folderToCheck = name 
        const folderExists = checkFolderExists(folderToCheck);
        if (!folderExists) {
            console.error(`❌ Error: Folder '${name}' does not exist in the repository.`);
            return;
        }
        if (executeCommand(`git sparse-checkout add ${name}`)) {
            console.log(`✅ Added folder: '${name}' to sparse-checkout.`);
        }
    } else if (options.apps) {
        const dependencies = getAppDependencies(options.apps);
        dependencies.unshift({ dependency: options.apps, path: options.apps });
        
        dependencies.forEach(dep => {
            if (executeCommand(`git sparse-checkout add ${dep.path}`)) {
                console.log(`✅ Added dependency: '${dep.path}' to sparse-checkout.`);
            }
        });
        console.log(`🔗 Added NX project: '${options.apps}' with dependencies:\n  - ${dependencies.map(dep => dep.path).join('\n  - ')}`);
    }
}

function checkFolderExists(folderName: string): boolean {
    try {
        const result = execSync(`git ls-tree -d HEAD ${folderName}`, { encoding: 'utf8' });
        return result.includes(folderName);
    } catch (error) {
        console.error(`Error: Unable to check folder existence for '${folderName}': ${error.message}`);
        return false;
    }
}

// Clone a repository
async function cloneRepo(source: string) {
    console.log(`Cloning repository from ${source}...`);
    executeCommand(`git clone --filter=blob:none ${source}`);
    console.log(`✅ Repository cloned: ${source}`);
}

// Find and return app dependencies based on options
function findAppDependencies(options: any): string[] {
    const appNames = options.apps !== '.' ? `${options.apps}` : '';
    const appNameArray = options.apps && options.apps.includes(',') ? appNames.split(',') : [options.apps];
    const dependentAppNames: string[] = [];
    const excludedAppNames = options.exclude ? `${options.exclude}` : '';
    const excludedApps = options.exclude && options.exclude.includes(',') ? excludedAppNames.split(',') : [options.exclude];

    if (appNameArray.length > 0) {
        for (const appName of appNameArray) {
            const sharedComponentsArray = getAppDependencies(appName);
            const filteredAppsArray = sharedComponentsArray.filter(obj =>
                !excludedApps.some(exclude => obj.path.includes(exclude))
            );

            if (filteredAppsArray.length > 0) {
                dependentAppNames.push(...filteredAppsArray.map(dep => dep.path));
            }
        }
    } else {
        console.error("Error: No apps specified. Use the -a or --apps option to pass app names.");
    }

    return dependentAppNames;
}

// Generate NX graph for the repository
function generateNxGraph(): Promise<void> {
    return new Promise((resolve, reject) => {
        const nxProcess = spawn('nx', ['graph', '--file=output.json']);

        nxProcess.stdout.on('data', (data) => {
            console.log(`NX stdout: ${data}`);
        });

        nxProcess.stderr.on('data', (data) => {
            console.error(`NX stderr: ${data}`);
        });

        nxProcess.on('error', (error) => {
            console.error(`Error spawning NX process: ${error.message}`);
            reject(error);
        });

        nxProcess.on('close', (code) => {
            if (code === 0) {
                console.log('✅ NX graph generated successfully.');
                resolve();
            } else {
                reject(new Error(`NX graph generation failed with exit code ${code}.`));
            }
        });
    });
}

// Initialize and set sparse-checkout for an app
async function initAndSetSparseCheckoutForApp(options: any) {
    try {
        await generateNxGraph();

        const appFolderNames = findAppDependencies(options);
        console.log('App folder names:', appFolderNames);

        const success = executeCommand('git sparse-checkout init --cone');
        if (success) {
            executeCommand(`git sparse-checkout set ${appFolderNames.join(" ")}`);
            console.log('✅ Sparse-checkout set with app folders.');
        }
    } catch (error) {
        console.error(`Error during sparse-checkout setup: ${error.message}`);
    }
}

// Checkout a specific folder or app
async function checkout(options: any) {
    try {
        await generateNxGraph();

        if (options.folderOnly) {
            console.log(`Checking out folder: ${options.folderOnly}`);
            executeCommand('git sparse-checkout init --cone');
            executeCommand(`git sparse-checkout set ${options.folderOnly}`);
            console.log(`✅ Folder checked out: ${options.folderOnly}`);
        } else {
            if (checkCommandAvailability('nx')) {
                initAndSetSparseCheckoutForApp(options);
            } else {
                console.error('Error: NX command is unavailable. Please install NX.');
            }
        }
    } catch (error) {
        console.error(`Checkout failed: ${error.message}`);
    }
}

// Check if a specific command is available
function checkCommandAvailability(command: string): boolean {
    try {
        const stdout = execSync(`which ${command}`, { encoding: 'utf8' });
        console.log(`✅ Command found: ${stdout.trim()}`);
        return true;
    } catch (error) {
        console.error(`Error: Command '${command}' not found.`);
        return false;
    }
}

// Execute a command and log the output
function executeCommand(command: string): boolean {
    try {
        const stdout = execSync(command, { encoding: 'utf8' });
        console.log(`✅ Command executed successfully:\n${stdout.trim()}`);
        return true;
    } catch (error) {
        console.error(`Error: Command execution failed:\n${error.message}`);
        return false;
    }
}
