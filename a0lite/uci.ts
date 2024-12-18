import * as readlineSync from 'readline-sync';

export function parseUCICommand(command: string) {
    const tokens = command.trim().split(/\s+/);
    const commandType = tokens[0];

    switch (commandType) {
        case 'uci':
            return { type: 'uci' };
        case 'quit':
            return { type: 'quit' };
        case 'isready':
            return { type: 'isready' };
        case 'ucinewgame':
            return { type: 'ucinewgame' };
        case 'position':
            return { type: 'position', args: tokens.slice(1) };
        case 'go':
            return { type: 'go', args: tokens.slice(1) };
        default:
            return { type: 'unknown', command };
    }
}
