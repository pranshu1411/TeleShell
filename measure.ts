import fs from 'node:fs';
import path from 'node:path';
import { Project, Node } from "ts-morph";

function measureReduction() {
    const filePath = path.resolve("modes/agent/tool-executor.ts");
    const query = "semanticSearch"; // Searching for a specific method

    const text = fs.readFileSync(filePath, "utf8");
    const fullTokens = Math.ceil(text.length / 4); // rough approximation of tokens (1 token ≈ 4 chars)
    
    console.log(`Analyzing file: ${filePath}`);
    console.log(`Full file length: ${text.length} characters (approx ${fullTokens} tokens)`);

    const project = new Project();
    project.addSourceFileAtPath(filePath);
    
    let nodeTokens = 0;
    let nodeTextLength = 0;
    
    for (const sourceFile of project.getSourceFiles()) {
        sourceFile.forEachDescendant(node => {
            if (
                Node.isFunctionDeclaration(node) ||
                Node.isClassDeclaration(node) ||
                Node.isInterfaceDeclaration(node) ||
                Node.isTypeAliasDeclaration(node) ||
                Node.isVariableDeclaration(node) ||
                Node.isMethodDeclaration(node) ||
                Node.isPropertyDeclaration(node) ||
                Node.isEnumDeclaration(node)
            ) {
                const nameNode = (node as any).getNameNode?.();
                const name = nameNode?.getText() || (node as any).getName?.();

                if (name === query) {
                    const nodeText = node.getText();
                    nodeTextLength = nodeText.length;
                    nodeTokens = Math.ceil(nodeTextLength / 4);
                }
            }
        });
    }

    if (nodeTokens > 0) {
        console.log(`\nFound AST Node for: ${query}`);
        console.log(`Node length: ${nodeTextLength} characters (approx ${nodeTokens} tokens)`);
        
        const reduction = ((fullTokens - nodeTokens) / fullTokens) * 100;
        console.log(`\nContext Token Reduction: ${reduction.toFixed(2)}%`);
        console.log(`(This represents the tokens saved by passing only the relevant code snippet instead of the entire file)`);
    } else {
        console.log(`Could not find AST Node for: ${query}`);
    }
}

measureReduction();
