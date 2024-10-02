"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAppDependencies = getAppDependencies;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Function to read and parse the JSON file
function readJsonFile(filePath) {
    try {
        // Read the file synchronously
        const data = fs.readFileSync(filePath, 'utf8');
        // Parse the JSON data
        const jsonData = JSON.parse(data);
        return jsonData;
    }
    catch (err) {
        console.error('Error reading or parsing the file:', err);
        return null;
    }
}
// Function to extract the array for "@shared/components"
function getAppDependencies(appName) {
    // Specify the path to your JSON file
    //console.log('Inside getAppDependencies')
    const filePath = path.join(__dirname, '..', 'output.json');
    // console.log('filePath ',filePath)
    // Read and parse the JSON file
    const jsonData = readJsonFile(filePath);
    // console.log('jsonData ',jsonData)
    if (!jsonData || !jsonData.graph || !jsonData.graph.dependencies) {
        console.error('Invalid JSON structure');
        return null;
    }
    // Access the dependencies
    const dependencies = jsonData.graph.dependencies;
    // Get the dependencies for "@shared/components"
    const sharedComponentsDependencies = dependencies[appName];
    const dependencyPaths = [];
    const nodes = jsonData.graph.nodes;
    dependencyPaths.push({ dependency: appName, path: nodes[appName].data.root });
    sharedComponentsDependencies === null || sharedComponentsDependencies === void 0 ? void 0 : sharedComponentsDependencies.forEach((dep) => {
        const node = nodes[dep.target];
        if (node && node.data && node.data.root) {
            dependencyPaths.push({ dependency: dep.source, path: node.data.root });
        }
        else {
            console.warn(`No path found for dependency: ${dep.target}`);
        }
    });
    // console.log('dependencyPaths',dependencyPaths)
    return dependencyPaths;
}
//# sourceMappingURL=readDependencies.js.map