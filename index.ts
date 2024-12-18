// import * as ort from 'onnxruntime-web';
import * as readlineSync from 'readline-sync';
import { Chess } from 'chess.js';

import { parseUCICommand } from './a0lite/uci';
import { NeuralNetwork } from './a0lite/network';
import { board2planes } from './a0lite/planes';
import { policy2moves } from './a0lite/policy';

function main() {
    const network = new NeuralNetwork();
    while (true) {
        const command = readlineSync.question();
        const uciCommand = parseUCICommand(command);
    
        switch (uciCommand.type) {
            case 'uci':
                console.log('id name a0lite-js');
                console.log('id author Ishan Das Sharma');
                console.log('uciok');
                break;
            case 'quit':
                process.exit(0);
                break;
            case 'isready':
                network.loadModel('./nets/maia9.onnx');
                console.log('readyok');
                break;
            case 'ucinewgame':
                // Start a new game here
                const chess = new Chess();

                (async function playGame() {
                    if (!network.initialized()) {
                        await network.loadModel('./nets/maia9.onnx');
                    }

                    while (!chess.isGameOver()) {
                        const planes = board2planes(chess);
                        try {
                            const output = await network.predict([planes]);
                            if (output) {
                                // console.log('Prediction output:', output);
                                const moves = policy2moves(chess, output["/output/policy"].data);
                                const bestMove = Object.keys(moves).reduce((a, b) => moves[a] > moves[b] ? a : b);
                                console.log('bestmove', bestMove);
                                chess.move(bestMove);
                            } else {
                                console.log('Failed to get prediction.');
                            }
                        } catch (error) {
                            console.error('Error during prediction:', error);
                        }
                    }
                    console.log('Game over. Final PGN:', chess.pgn());
                })();
                break;
            case 'position':
                // Handle position command here
                break;
            case 'go':
                // Handle go command here
                break;
            default:
                console.log('Unknown command:', command);
                break;
        }
    }
}

main();