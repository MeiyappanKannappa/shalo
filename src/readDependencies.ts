import * as fs from 'fs';
import * as path from 'path';

// Define interfaces to represent the structure of your JSON data
interface Dependency {
    source: string;
    target: string;
    type: string;
}

interface NodeData {
    root: string;
    // Add other properties if needed
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

// Function to read and parse the JSON file
function readJsonFile(filePath: string): JsonData | null {
    try {
        // Read the file synchronously
        const data = fs.readFileSync(filePath, 'utf8');

        // Parse the JSON data
        const jsonData: JsonData = JSON.parse(data);

        return jsonData;
    } catch (err) {
        console.error('Error reading or parsing the file:', err);
        return null;
    }
}

// Function to extract the array for "@shared/components"
export function getAppDependencies(appName: string ): { dependency: string; path: string }[] | null {
    // Specify the path to your JSON file
    //console.log('Inside getAppDependencies')
    const filePath = path.join(__dirname,'..', 'output.json');
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
    const dependencyPaths: { dependency: string; path: string }[] = [];
    const nodes = jsonData.graph.nodes;
    dependencyPaths.push({ dependency: appName, path: nodes[appName].data.root });
    sharedComponentsDependencies?.forEach((dep) => {
        const node = nodes[dep.target];
        if (node && node.data && node.data.root) {
            dependencyPaths.push({ dependency: dep.source, path: node.data.root });
        } else {
            console.warn(`No path found for dependency: ${dep.target}`);
        }
    });


    // console.log('dependencyPaths',dependencyPaths)
    return dependencyPaths;
}