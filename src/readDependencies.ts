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
        const data = fs.readFileSync(filePath, 'utf8');
        const jsonData: JsonData = JSON.parse(data);
        return jsonData;
    } catch (err) {
        console.error('Error reading or parsing the file:', err);
        return null;
    }
}

// Function to extract the array for "@shared/components"
export function getAppDependencies(appName: string): { dependency: string; path: string }[] | null {
    const projectRoot = process.cwd();
    const filePath = path.join(projectRoot, 'output.json');
    const jsonData = readJsonFile(filePath);

    if (!jsonData || !jsonData.graph || !jsonData.graph.dependencies) {
        console.error('Invalid JSON structure');
        return null;
    }

    const dependencies = jsonData.graph.dependencies;
    const sharedComponentsDependencies = dependencies[appName];
    const dependencyPaths: { dependency: string; path: string }[] = [];
    const nodes = jsonData.graph.nodes;

    if (nodes[appName] && nodes[appName].data) {
        dependencyPaths.push({ dependency: appName, path: nodes[appName].data.root });
    } else {
        console.error(`No data found for app: ${appName}`);
        return null;
    }

    sharedComponentsDependencies?.forEach((dep) => {
        const node = nodes[dep.target];
        if (node && node.data && node.data.root) {
            dependencyPaths.push({ dependency: dep.source, path: node.data.root });
        } else {
            console.warn(`No path found for dependency: ${dep.target}`);
        }
    });

    return dependencyPaths;
}