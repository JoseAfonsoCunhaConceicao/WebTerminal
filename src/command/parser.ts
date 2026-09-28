import type { CommandInvocation } from "./invocation.js";

export function parseCommand(tokens: readonly string[]): CommandInvocation | null {
    const inputSize = tokens.length;

    if (inputSize === 0)
        return null;

    const command: string = tokens[0]!;
    const options: string[] = [];
    const args: string[] = [];
    let parsingOptions: boolean = true;
    
    for (let idx = 1; idx < inputSize; idx++) {

        const token = tokens[idx]!;

        if (parsingOptions) {
            if (token === '--')
                parsingOptions = false;
            else if (token.startsWith('-'))
                options.push(token);
            else
                args.push(token);
        } else 
            args.push(token);    
    }    
    
    return {command, options, arguments: args};
}