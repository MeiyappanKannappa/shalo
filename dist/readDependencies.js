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
        const data = fs.readFileSync(filePath, 'utf8');
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
    const projectRoot = process.cwd();
    const filePath = path.join(projectRoot, 'output.json');
    const jsonData = readJsonFile(filePath);
    if (!jsonData || !jsonData.graph || !jsonData.graph.dependencies) {
        console.error('Invalid JSON structure');
        return null;
    }
    const dependencies = jsonData.graph.dependencies;
    const sharedComponentsDependencies = dependencies[appName];
    const dependencyPaths = [];
    const nodes = jsonData.graph.nodes;
    if (nodes[appName] && nodes[appName].data) {
        dependencyPaths.push({ dependency: appName, path: nodes[appName].data.root });
    }
    else {
        console.error(`No data found for app: ${appName}`);
        return null;
    }
    sharedComponentsDependencies === null || sharedComponentsDependencies === void 0 ? void 0 : sharedComponentsDependencies.forEach((dep) => {
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