#!/usr/bin/env node
import figlet from "figlet";
import {Command} from "commander";
import fs from "fs";
import path from "path";
import {spawn} from 'node:child_process';
import {execSync} from 'child_process';
import {getAppDependencies} from "./readDependencies";

const program = new Command();

console.log(figlet.textSync("shalo"));
program
    .command('clone')
    .argument('<source>')
    .action(cloneRepo)
program
    .command('checkout')
    .action(checkout)
    .option('-a, --apps <app-name>', 'App Name for checkout')
    .option('-e, --exclude <app-name>', 'App Name for checkout')
    .option('-t, --team <config-file>', 'Name of the Team as in nxgit.yaml')
program
    .command('add')
    .argument('<appName>')
    .action(addApp)
program
    .command('clean')
    .action(disableSparseCheckout)
program.parse(process.argv);

async function disableSparseCheckout(name: any, command: { name: () => any; }){
    executeCommand(`git sparse-checkout disable`);
    const dirPath = path.join(__dirname, '/.git/index/sparse-checkout');
// Synchronously delete the directory
    try {
        fs.rmSync(dirPath, { recursive: true, force: true });
        console.log('Directory deleted successfully');
    } catch (err) {
        console.error('Error deleting directory:', err);
    }
    console.log('Removed NXGIT controlled checkout. Now you can use git!!');

}

async function addApp(name: any, command: { name: () => any; }){
    executeCommand(`git sparse-checkout add ${name}`);
    console.error('Called %s with name %o', command, name);

}

async function cloneRepo(name: any, command: { name: () => any; }){
    executeCommand(`git clone --filter=blob:none ${name}`);

}

function findAppDependencies(options: any): string[] {
    const appNames = options.apps !== '.' ? `${options.apps}` : '';
    const appNameArray: string | any[] = options.apps !== '' && options.apps?.includes(',') ? appNames.split(',') : [options.apps];
    // console.log(`options.apps ${options.apps}`)
    const dependentAppNames: string[] = []
    const excludedAppNames = options.exclude !== '' ? `${options.exclude}` : '';
    const excludedApps: string[] = options.exclude !== '' && options.exclude?.includes(',') ? excludedAppNames.split(',') : [options.exclude];
    // console.log('excludedApps ',excludedApps)
    if (options.apps.length > 0) {

        for (let i = 0; i < appNameArray?.length; i++) {
            const sharedComponentsArray = getAppDependencies(appNameArray[i]);
            // console.log('sharedComponentsArray ',sharedComponentsArray)
            const filteredAppsArray = sharedComponentsArray?.filter(obj =>
                !excludedApps.some(substring => obj.path.includes(substring))
            );
            // console.log(filteredAppsArray);
            if (filteredAppsArray) {
                for (let j = 0; j < filteredAppsArray?.length; j++) {
                    dependentAppNames.push(filteredAppsArray[j].path)
                }
            }
            if (filteredAppsArray) {
                console.log(`Dependencies for ${appNameArray[i]}:`, filteredAppsArray);
            }
        }

    }
    return dependentAppNames;
}

// function getNxVersion() {
//     try {
//         const versionOutput = execSync(`nx --version`, { encoding: 'utf8' }).trim();
//         return versionOutput;
//     } catch (error) {
//         console.error(`Error fetching Nx version: ${error}`);
//         return null;
//     }
// }


async function checkout(options: any) {
    const isCommandAvailable = checkCommandAvailability('nx');
    console.log('Called with options %o', options);

    // Ensure options.apps is defined and is an array
    if (!options.apps) {
        options.apps = [];
    }

    if (isCommandAvailable) {
        // Run the nx command first
        const command = 'nx';
        const args = ['graph', '--file=output.json'];

        // Spawn a new process
        const nxProcess = spawn(command, args);

        // Handle standard output
        nxProcess.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });

        // Handle standard error
        nxProcess.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });

        // Handle errors
        nxProcess.on('error', (error) => {
            console.error(`Error spawning process: ${error.message}`);
        });

        // Handle process exit
        nxProcess.on('close', (code) => {
            console.log(`Child process exited with code ${code}`);
            if (code !== 0) {
                console.log(`Command Failed nx with code ${code}`);
                return;
            }

            // Initialize and set sparse checkout
            initAndSetSparseCheckoutForApp(options);
        });
    } else {
        console.error("nx command unavailable. Please install nx");
        return;
    }
}

function initAndSetSparseCheckoutForApp(options: any) {
    const appFolderNames: string[] = findAppDependencies(options);
    console.log('appFolderNames', appFolderNames);

    // Initialize sparse checkout
    const gitSparseCheckoutInitSuccess = executeCommand('git sparse-checkout init --cone');
    console.log('gitSparseCheckoutInitSuccess ', gitSparseCheckoutInitSuccess);

    if (!gitSparseCheckoutInitSuccess) {
        return;
    }

    // Set sparse checkout
    console.log('appFolderNames.join(",") ', appFolderNames.join(" "));
    executeCommand(`git sparse-checkout set ${appFolderNames.join(" ")}`);

    console.log('Done');
    return;
}

// function initAndSetSparseCheckoutForApp(options: any) {
//     // Initialize sparse checkout
//     const gitSparseCheckoutInitSuccess = executeCommand('git sparse-checkout init --cone');
//     console.log('gitSparseCheckoutInitSuccess ', gitSparseCheckoutInitSuccess);

//     if (!gitSparseCheckoutInitSuccess) {
//         return;
//     }

//     // Run the nx command
//     const command = 'nx';
//     const args = ['graph', '--file=output.json'];

//     // Spawn a new process
//     const nxProcess = spawn(command, args);

//     // Handle standard output
//     nxProcess.stdout.on('data', (data) => {
//         console.log(`stdout: ${data}`);
//     });

//     // Handle standard error
//     nxProcess.stderr.on('data', (data) => {
//         console.error(`stderr: ${data}`);
//     });

//     // Handle errors
//     nxProcess.on('error', (error) => {
//         console.error(`Error spawning process: ${error.message}`);
//     });

//     // Handle process exit
//     nxProcess.on('close', (code) => {
//         console.log(`Child process exited with code ${code}`);
//         if (code !== 0) {
//             console.log(`Command Failed nx with code ${code}`);
//             return;
//         }

//         // Find app dependencies and set sparse checkout
//         const appFolderNames: string[] = findAppDependencies(options);
//         console.log('appFolderNames', appFolderNames);
//         console.log('appFolderNames.join(",") ', appFolderNames.join(" "));
//         executeCommand(`git sparse-checkout set ${appFolderNames.join(" ")}`);
//     });

//     console.log('Done');
//     return;
// }

// async function checkout(options: any) {
//     const isCommandAvailable = checkCommandAvailability('nx');
//     console.log('Called with options %o', options);

//     // Ensure options.apps is defined and is an array
//     if (!options.apps) {
//         options.apps = [];
//     }

//     if (isCommandAvailable) {
//         initAndSetSparseCheckoutForApp(options);
//     } else {
//         console.error("nx command unavailable. Please install nx");
//         return;
//     }
// }

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
        const stdout = execSync(`${command}`, { encoding: 'utf8' });
        console.log(`Command execution details: ${stdout.trim()}`);
        return true;
    } catch (error) {
        console.error(`Command execution failed: ${error}`);
        return false;
    }
}