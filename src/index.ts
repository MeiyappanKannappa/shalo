#!/usr/bin/env node
import figlet from "figlet";
import { Command } from "commander";
import fs from "fs";
import path from "path";
import { spawn, execSync } from 'child_process';
import { getAppDependencies } from "./readDependencies";

const program = new Command();

console.log(figlet.textSync("shalo"));

program
    .command('clone')
    .argument('<source>')
    .action(cloneRepo);

program
    .command('checkout')
    .option('-a, --apps <app-names>', 'Comma-separated list of app names for checkout')
    .option('-e, --exclude <app-names>', 'Comma-separated list of app names to exclude from checkout')
    .option('-t, --team <config-file>', 'Name of the team as in nxgit.yaml')
    .action(checkout);

program
    .command('add')
    .argument('<appName>')
    .action(addApp);

program
    .command('clean')
    .action(disableSparseCheckout);

program.parse(process.argv);

async function disableSparseCheckout() {
    executeCommand(`git sparse-checkout disable`);
    const dirPath = path.join(__dirname, '/.git/index/sparse-checkout');
    try {
        fs.rmSync(dirPath, { recursive: true, force: true });
        console.log('Directory deleted successfully');
    } catch (err) {
        console.error('Error deleting directory:', err);
    }
    console.log('Removed NXGIT controlled checkout. Now you can use git!!');
}

async function addApp(appName: string) {
    executeCommand(`git sparse-checkout add ${appName}`);
    console.error('Added app: %s', appName);
}

async function cloneRepo(source: string) {
    executeCommand(`git clone --filter=blob:none ${source}`);
}

function findAppDependencies(appNames: string[], excludedApps: string[]): string[] {
    const dependentAppNames: string[] = [];

    appNames.forEach(appName => {
        const sharedComponentsArray = getAppDependencies(appName);
        console.log('sharedComponentsArray: ', sharedComponentsArray);

        const filteredAppsArray = sharedComponentsArray?.filter(obj =>
            !excludedApps.some(substring => obj.path.includes(substring))
        );
        console.log('filteredAppsArray: ', filteredAppsArray);

        if (filteredAppsArray) {
            for (let j = 0; j < filteredAppsArray?.length; j++) {
                dependentAppNames.push(filteredAppsArray[j].path);
            }
        }
    });

    return dependentAppNames;
}

async function checkout(options: any) {
    const isCommandAvailable = checkCommandAvailability('nx');
    console.log('Called with options: ', options);

    if (!options.apps) {
        console.error('No apps specified for checkout.');
        return;
    }

    if (isCommandAvailable) {
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

            initAndSetSparseCheckoutForApp(options);
        });
    } else {
        console.error("nx command unavailable. Please install nx");
        return;
    }
}

function initAndSetSparseCheckoutForApp(options: any) {
    const appNames = options.apps.split(',');
    const excludedApps = options.exclude ? options.exclude.split(',') : [];
    const appFolderNames: string[] = findAppDependencies(appNames, excludedApps);
    console.log('appFolderNames', appFolderNames);

    const gitSparseCheckoutInitSuccess = executeCommand('git sparse-checkout init --cone');
    console.log('gitSparseCheckoutInitSuccess ', gitSparseCheckoutInitSuccess);

    if (!gitSparseCheckoutInitSuccess) {
        return;
    }

    console.log('appFolderNames.join(",") ', appFolderNames.join(" "));
    executeCommand(`git sparse-checkout set ${appFolderNames.join(" ")}`);

    console.log('Done');
    return;
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
        const stdout = execSync(`${command}`, { encoding: 'utf8' });
        console.log(`Command execution details: ${stdout.trim()}`);
        return true;
    } catch (error) {
        console.error(`Command execution failed: ${error}`);
        return false;
    }
}