#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const figlet_1 = __importDefault(require("figlet"));
const commander_1 = require("commander");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const node_child_process_1 = require("node:child_process");
const child_process_1 = require("child_process");
const readDependencies_1 = require("./readDependencies");
const program = new commander_1.Command();
console.log(figlet_1.default.textSync("shalo"));
program
    .command('clone')
    .argument('<source>')
    .action(cloneRepo);
program
    .command('checkout')
    .action(checkout)
    .option('-a, --apps <app-name>', 'App Name for checkout')
    .option('-e, --exclude <app-name>', 'App Name for checkout')
    .option('-t, --team <config-file>', 'Name of the Team as in nxgit.yaml');
program
    .command('add')
    .argument('<appName>')
    .action(addApp);
program
    .command('clean')
    .action(disableSparseCheckout);
program.parse(process.argv);
function disableSparseCheckout(name, command) {
    return __awaiter(this, void 0, void 0, function* () {
        executeCommand(`git sparse-checkout disable`);
        const dirPath = path_1.default.join(__dirname, '/.git/index/sparse-checkout');
        // Synchronously delete the directory
        try {
            fs_1.default.rmSync(dirPath, { recursive: true, force: true });
            console.log('Directory deleted successfully');
        }
        catch (err) {
            console.error('Error deleting directory:', err);
        }
        console.log('Removed NXGIT controlled checkout. Now you can use git!!');
    });
}
function addApp(name, command) {
    return __awaiter(this, void 0, void 0, function* () {
        executeCommand(`git sparse-checkout add ${name}`);
        console.error('Called %s with name %o', command, name);
    });
}
function cloneRepo(name, command) {
    return __awaiter(this, void 0, void 0, function* () {
        executeCommand(`git clone --filter=blob:none ${name}`);
    });
}
function findAppDependencies(options) {
    var _a, _b;
    const appNames = options.apps !== '.' ? `${options.apps}` : '';
    const appNameArray = options.apps !== '' && ((_a = options.apps) === null || _a === void 0 ? void 0 : _a.includes(',')) ? appNames.split(',') : [options.apps];
    // console.log(`options.apps ${options.apps}`)
    const dependentAppNames = [];
    const excludedAppNames = options.exclude !== '' ? `${options.exclude}` : '';
    const excludedApps = options.exclude !== '' && ((_b = options.exclude) === null || _b === void 0 ? void 0 : _b.includes(',')) ? excludedAppNames.split(',') : [options.exclude];
    // console.log('excludedApps ',excludedApps)
    if (options.apps.length > 0) {
        for (let i = 0; i < (appNameArray === null || appNameArray === void 0 ? void 0 : appNameArray.length); i++) {
            const sharedComponentsArray = (0, readDependencies_1.getAppDependencies)(appNameArray[i]);
            // console.log('sharedComponentsArray ',sharedComponentsArray)
            const filteredAppsArray = sharedComponentsArray === null || sharedComponentsArray === void 0 ? void 0 : sharedComponentsArray.filter(obj => !excludedApps.some(substring => obj.path.includes(substring)));
            // console.log(filteredAppsArray);
            if (filteredAppsArray) {
                for (let j = 0; j < (filteredAppsArray === null || filteredAppsArray === void 0 ? void 0 : filteredAppsArray.length); j++) {
                    dependentAppNames.push(filteredAppsArray[j].path);
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
function checkout(options) {
    return __awaiter(this, void 0, void 0, function* () {
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
            const nxProcess = (0, node_child_process_1.spawn)(command, args);
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
        }
        else {
            console.error("nx command unavailable. Please install nx");
            return;
        }
    });
}
function initAndSetSparseCheckoutForApp(options) {
    const appFolderNames = findAppDependencies(options);
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
function checkCommandAvailability(command) {
    try {
        const stdout = (0, child_process_1.execSync)(`which ${command}`, { encoding: 'utf8' });
        console.log(`Command found: ${stdout.trim()}`);
        return true;
    }
    catch (error) {
        console.error(`Command not found: ${command}`);
        return false;
    }
}
function executeCommand(command) {
    try {
        const stdout = (0, child_process_1.execSync)(`${command}`, { encoding: 'utf8' });
        console.log(`Command execution details: ${stdout.trim()}`);
        return true;
    }
    catch (error) {
        console.error(`Command execution failed: ${error}`);
        return false;
    }
}
//# sourceMappingURL=index.js.map