import figlet from "figlet";
import { Command } from "commander";
import fs from "fs";
import path from "path";
import { spawn, execSync } from 'child_process';
import { getAppDependencies } from "./readDependencies";

const program = new Command();

console.log(figlet.textSync("shalo"));

program
    .command('clone <source>')
    .description('Clone a repository')
    .action(cloneRepo);

program
    .command('checkout')
    .description('Checkout a specific app')
    .option('-a, --apps <app-name>', 'App Name for checkout')
    .option('-e, --exclude <app-name>', 'App Name to exclude from checkout')
    .option('-t, --team <config-file>', 'Name of the Team as in nxgit.yaml')
    .action(checkout);

program
    .command('add <appName>')
    .description('Add a folder or app to the monorepo')
    .option('-f, --folder-only', 'Add only the folder without dependencies')
    .action(addApp);

program
    .command('clean')
    .description('Clean the repository')
    .action(disableSparseCheckout);

program.parse(process.argv);

async function disableSparseCheckout() {
    executeCommand('git sparse-checkout disable');
    const dirPath = path.join(__dirname, '/.git/index/sparse-checkout');
    try {
        fs.rmSync(dirPath, { recursive: true, force: true });
        console.log('Directory deleted successfully');
    } catch (err) {
        console.error('Error deleting directory:', err);
    }
    console.log('Removed NXGIT controlled checkout. Now you can use git!!');
}

async function addApp(name: string, options: any) {
    if (options.folderOnly) {
        const success = executeCommand(`git sparse-checkout add ${name}`);
        if (success) {
            console.log(`Added folder: ${name}`);
        } else {
            console.error(`Failed to add folder: ${name}. Please check if the folder name is correct.`);
        }
    } else {
        const dependencies = getAppDependencies(name);
        if (dependencies && dependencies.length > 0) {
            dependencies.forEach(dep => {
                const success = executeCommand(`git sparse-checkout add ${dep.path}`);
                if (success) {
                    console.log(`Added dependency: ${dep.path}`);
                } else {
                    console.error(`Failed to add dependency: ${dep.path}. Please check if the path is correct.`);
                }
            });
        } else {
            console.error(`No dependencies found for app: ${name}. Please check if the app name is correct.`);
        }
    }
}

async function cloneRepo(source: string) {
    const success = executeCommand(`git clone --filter=blob:none ${source}`);
    if (success) {
        console.log(`Cloned repository: ${source}`);
    } else {
        console.error(`Failed to clone repository: ${source}. Please check if the repository URL is correct.`);
    }
}

function findAppDependencies(options: any): string[] {
    const appNames = options.apps !== '.' ? `${options.apps}` : '';
    const appNameArray = options.apps !== '' && options.apps?.includes(',') ? appNames.split(',') : [options.apps];
    const dependentAppNames: string[] = [];
    const excludedAppNames = options.exclude !== '' ? `${options.exclude}` : '';
    const excludedApps = options.exclude !== '' && options.exclude?.includes(',') ? excludedAppNames.split(',') : [options.exclude];

    if (options?.apps?.length > 0) {
        for (let i = 0; i < appNameArray?.length; i++) {
            const sharedComponentsArray = getAppDependencies(appNameArray[i]);
            if (sharedComponentsArray) {
                const filteredAppsArray = sharedComponentsArray.filter(obj =>
                    !excludedApps.some(substring => obj.path.includes(substring))
                );
                if (filteredAppsArray.length > 0) {
                    for (let j = 0; j < filteredAppsArray.length; j++) {
                        dependentAppNames.push(filteredAppsArray[j].path);
                    }
                    console.log(`Dependencies for ${appNameArray[i]}:`, filteredAppsArray);
                }
            } else {
                console.warn(`No dependencies found for app: ${appNameArray[i]}`);
            }
        }
    } else {
        console.error("No apps specified, are you passing the app name with -a or --apps?");
    }
    return dependentAppNames;
}

function initAndSetSparseCheckoutForApp(options: any) {
    const command = 'nx';
    const args = ['graph', '--file=output.json'];

    const nxProcess = spawn(command, args);

    nxProcess.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    nxProcess.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });

    nxProcess.on('error', (error) => {
        console.error(`Error spawning process: ${error.message}`);
    });

    nxProcess.on('close', (code) => {
        console.log(`Child process exited with code ${code}`);
        if (code !== 0) {
            console.log(`Command Failed nx with code ${code}`);
            return;
        }
        const appFolderNames: string[] = findAppDependencies(options);
        console.log('appFolderNames', appFolderNames);
        const gitSparseCheckoutInitSuccess = executeCommand('git sparse-checkout init --cone');
        if (gitSparseCheckoutInitSuccess) {
            executeCommand(`git sparse-checkout set ${appFolderNames.join(" ")}`);
        }
    });

    console.log('Done');
}

async function checkout(options: any) {
    const isCommandAvailable = checkCommandAvailability('nx');
    console.log('Called with options %o', options);
    if (isCommandAvailable) {
        initAndSetSparseCheckoutForApp(options);
    } else {
        console.error("nx command unavailable. Please install nx");
    }
}

function checkCommandAvailability(command: string) {
    try {
        const stdout = execSync(`which ${command}`, { encoding: 'utf8' });
        console.log(`Command found: ${stdout.trim()}`);
        return true;
    } catch (error) {
        console.error(`Command not found: ${command}`);
        return false;
    }
}

function executeCommand(command: string) {
    try {
        const stdout = execSync(command, { encoding: 'utf8' });
        console.log(`Command execution details: ${stdout.trim()}`);
        return true;
    } catch (error) {
        console.error(`Command execution failed: ${error.message}`);
        return false;
    }
}

