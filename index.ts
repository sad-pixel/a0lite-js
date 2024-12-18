import * as fs from 'fs';
import { parseUCICommand } from './a0lite/uci';
import { Engine } from './a0lite/engine';

const logStream = fs.createWriteStream('/Users/ishan/a0lite-log.txt', { flags: 'a' });

function logOutput(message: string) {
    console.log(message);
    logStream.write(message + '\n');
}

async function main() {
    // logOutput("a0lite-js v0.0.1");
    const engine = new Engine();
    await engine.loadDefaultModel();

    // for await (const command of console) {
    while (true) {
        const command = prompt('');
        if (command !== null) {
            const uciCommand = parseUCICommand(command);
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
                    if (!engine.isInitialized()) {
                        await engine.loadDefaultModel();
                    }
                    logOutput('readyok');
                    break;
                case 'ucinewgame':
                    if (!engine.isInitialized()) {
                        await engine.loadDefaultModel();
                    }
                    engine.newGame();
                    break;
                case 'position':
                    if (uciCommand.args && uciCommand.args.length > 0) {
                        if (uciCommand.args[0] === 'startpos') {
                            const moves = uciCommand.args[1] === 'moves' ? uciCommand.args.slice(2) : [];
                            engine.setPosition('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', moves);
                        } else {
                            const fen = uciCommand.args.slice(1, 7).join(' ');
                            const moves = uciCommand.args.length > 7 && uciCommand.args[7] === 'moves' ? uciCommand.args.slice(8) : [];
                            engine.setPosition(fen, moves);
                        }
                    }
                    break;
                case 'go':
                    const bestMove = await engine.getBestMove(true, 10000);
                    logOutput(`bestmove ${bestMove}`);
                    break;
                default:
                    logOutput('Unknown command: ' + command);
                    break;
            }
        }
    }
}

async function selfplay() {
    const engine1 = new Engine();
    const engine2 = new Engine();
    await engine1.init('./nets/badgyal.onnx');
    await engine2.init('./nets/maia9.onnx');

    let chess = engine1.getPosition();
    let useFirstEngine = true;
    while (!chess.isGameOver()) {
        try {
            const currentEngine = useFirstEngine ? engine1 : engine2;
            const bestMove = await currentEngine.getBestMove(false);
            logOutput('bestmove ' + bestMove);
            try {
                chess.move(bestMove);
                currentEngine.setPosition(chess.fen());
                (!useFirstEngine ? engine1 : engine2).setPosition(chess.fen());
            } catch {
                logOutput(chess.ascii());
                logOutput('Invalid move: ' + bestMove);
                break;
            }
        } catch (error) {
            logOutput('Error during prediction: ' + error);
        }
        useFirstEngine = !useFirstEngine;
    }
    logOutput('Game over. Final PGN: ' + chess.pgn());
}

async function uctselfplay() {
    const engine1 = new Engine();
    const engine2 = new Engine();
    await engine1.init('./nets/maia9.onnx');
    await engine2.init('./nets/badgyal.onnx');

    let chess = engine1.getPosition();
    let useFirstEngine = true;
    while (!chess.isGameOver()) {
        try {
            const currentEngine = useFirstEngine ? engine1 : engine2;
            const bestMove = await currentEngine.getBestMove(true, 100);
            logOutput('bestmove ' + bestMove);
            try {
                chess.move(bestMove);
                currentEngine.setPosition(chess.fen());
                (!useFirstEngine ? engine1 : engine2).setPosition(chess.fen());
            } catch {
                logOutput(chess.ascii());
                logOutput('Invalid move: ' + bestMove);
                break;
            }
        } catch (error) {
            logOutput('Error during search: ' + error);
        }
        useFirstEngine = !useFirstEngine;
    }
    logOutput('Game over. Final PGN: ' + chess.pgn());
}

const args = process.argv.slice(2);
if (args.includes('--selfplay')) {
    selfplay();
} else {
    main();
}