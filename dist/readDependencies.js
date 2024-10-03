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
function readJsonFile(filePath) {
    try {
        console.log('Reading JSON file from:', filePath);
        const data = fs.readFileSync(filePath, 'utf8');
        const jsonData = JSON.parse(data);
        return jsonData;
    }
    catch (err) {
        console.error('Error reading or parsing the file:', err);
        return null;
    }
}
function getAppDependencies(appName) {
    const filePath = path.join(__dirname, '../../nvc-web-app/output.json');
    const jsonData = readJsonFile(filePath);
    if (!jsonData || !jsonData.graph || !jsonData.graph.dependencies) {
        console.error('Invalid JSON structure or missing dependencies');
        return null;
    }
    const dependencies = jsonData.graph.dependencies;
    const sharedComponentsDependencies = dependencies[appName];
    const dependencyPaths = [];
    if (!jsonData.graph.nodes[appName]) {
        console.error(`App not found: ${appName}`);
        return null;
    }
    const nodes = jsonData.graph.nodes;
    dependencyPaths.push({ dependency: appName, path: nodes[appName].data.root });
    if (!sharedComponentsDependencies) {
        console.warn(`No dependencies found for app: ${appName}`);
        return dependencyPaths;
    }
    sharedComponentsDependencies.forEach((dep) => {
        const node = nodes[dep.target];
        if (node && node.data && node.data.root) {
            dependencyPaths.push({ dependency: dep.source, path: node.data.root });
        }
        else {
            console.warn(`No path found for dependency: ${dep.target}`);
        }
    });
    return dependencyPaths;
}
//# sourceMappingURL=readDependencies.js.map