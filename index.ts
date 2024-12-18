// import * as ort from 'onnxruntime-web';
import * as readlineSync from 'readline-sync';
import * as readline from 'readline';
import * as fs from 'fs';

import { Chess } from 'chess.js';

import { parseUCICommand } from './a0lite/uci';
import { getModelPath, NeuralNetwork } from './a0lite/network';
import { board2planes } from './a0lite/planes';
import { moves2bestmove, policy2moves } from './a0lite/policy';

const logStream = fs.createWriteStream('/Users/ishan/a0lite-log.txt', { flags: 'a' });

function logOutput(message: string) {
    console.log(message);
    logStream.write(message + '\n');
}

async function main() {
    // logOutput("a0lite-js v0.0.1");
    const network = new NeuralNetwork();
    let pos = '';
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: true
    });

    for await (const command of rl) {
        if (command !== undefined) {
            const uciCommand = parseUCICommand(command);
            const chess = new Chess();
            switch (uciCommand.type) {
                case 'uci':
                    logOutput('id name a0lite-js');
                    logOutput('id author Ishan Das Sharma');
                    logOutput('uciok');
                    break;
                case 'quit':
                    process.exit(0);
                    break;
                case 'isready':
                    await network.loadModel(getModelPath('maia9.onnx'));
                    logOutput('readyok');
                    break;
                case 'ucinewgame':
                    if (!network.initialized()) {
                        await network.loadModel(getModelPath('maia9.onnx'));
                    }
                    chess.reset();
                    break;
                case 'position':
                    if (uciCommand.args && uciCommand.args.length > 0) {
                        if (uciCommand.args[0] === 'startpos') {
                            chess.reset()
                            pos = chess.fen();
                        } else {
                            pos = uciCommand.args.slice(1).join(' ');
                        }
                    }
                    break;
                case 'go':
                    chess.reset()
                    chess.load(pos);
                    const planes = board2planes(chess);
                    const output = await network.predict([planes]);
                    if (output) {
                        const moves = policy2moves(chess, output['/output/policy'].data);
                        const bestMove = moves2bestmove(moves);
                        logOutput(`bestmove ${bestMove}`);
                    }
                    break;
                default:
                    logOutput('Unknown command: ' + command);
                    break;
            }
        }
    }
}

async function selfplay() {
    const network = new NeuralNetwork();
    await network.loadModel('./nets/badgyal.onnx');

    let chess = new Chess();
    while (!chess.isGameOver()) {
        const planes = board2planes(chess);
        try {
            const output = await network.predict([planes]);
            if (output) {
                const moves = policy2moves(chess, output["/output/policy"].data);
                const bestMove = moves2bestmove(moves);
                logOutput('bestmove ' + bestMove);
                try {
                    chess.move(bestMove);
                } catch {
                    logOutput(chess.ascii());
                    logOutput('Invalid move: ' + bestMove);
                    logOutput(JSON.stringify(moves));
                    break;
                }
            } else {
                logOutput('Failed to get prediction.');
            }
        } catch (error) {
            logOutput('Error during prediction: ' + error);
        }
    }
    logOutput('Game over. Final PGN: ' + chess.pgn());
}

const args = process.argv.slice(2);
if (args.includes('--selfplay')) {
    selfplay();
} else {
    main();
}