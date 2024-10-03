import * as fs from 'fs';
import * as path from 'path';

interface Dependency {
    source: string;
    target: string;
    type: string;
}

interface NodeData {
    root: string;
}

interface JsonData {
    graph: {
        dependencies: {
            [key: string]: Dependency[];
        };
        nodes: {
            [key: string]: {
                data: NodeData;
            };
        };
    };
}

function readJsonFile(filePath: string): JsonData | null {
    try {
        console.log('Reading JSON file from:', filePath);
        const data = fs.readFileSync(filePath, 'utf8');
        const jsonData: JsonData = JSON.parse(data);
        return jsonData;
    } catch (err) {
        console.error('Error reading or parsing the file:', err);
        return null;
    }
}

export function getAppDependencies(appName: string): { dependency: string; path: string }[] | null {
    const filePath = path.join(__dirname, '../../nvc-web-app/output.json');
    const jsonData = readJsonFile(filePath);

    if (!jsonData || !jsonData.graph || !jsonData.graph.dependencies) {
        console.error('Invalid JSON structure or missing dependencies');
        return null;
    }

    const dependencies = jsonData.graph.dependencies;
    const sharedComponentsDependencies = dependencies[appName];
    const dependencyPaths: { dependency: string; path: string }[] = [];

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
        } else {
            console.warn(`No path found for dependency: ${dep.target}`);
        }
    });

    return dependencyPaths;
}