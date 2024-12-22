import * as fs from 'fs';
import { parseUCICommand } from './a0lite/uci';
import { Engine } from './a0lite/engine';
import { getAllocatedTime } from './a0lite/time-management';

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
                    const wtime = parseInt(uciCommand.args![1]);
                    const btime = parseInt(uciCommand.args![3]);
                    const sideToMove = engine.sideToMove();
                    const timeRemaining = (sideToMove === 'w') ? wtime : btime;
                    const moveNumber = engine.getMovesCount();
                    const timeToUse = getAllocatedTime(moveNumber, timeRemaining)
                    const bestMove = await engine.getBestMove(true, 100000, timeToUse);
                    // console.log(engine.getPosition().ascii());
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
    await engine1.init('./nets/maia9.onnx');
    await engine2.init('./nets/lc0.onnx');

    // Load and parse ECO codes
    const ecoData = JSON.parse(await fs.readFileSync('./eco_codes_uci.json', 'utf8'));
    
    // Pick random opening position
    const randomOpening = ecoData[Math.floor(Math.random() * ecoData.length)];
    const uciMoves = randomOpening.UCIMoves.split(' ');

    let chess = engine1.getPosition();
    
    // Play out the opening moves
    for (const uciMove of uciMoves) {
        chess.move(uciMove);
    }

    // Set position for both engines
    engine1.setPositionWithHistory(chess);
    engine2.setPositionWithHistory(chess);

    logOutput(`Starting from opening: ${randomOpening.ECO}: ${randomOpening.Name} (FEN: ${chess.fen()})`);

    // Determine who plays which color based on number of opening moves
    const isEngine1White = chess.turn() === 'w';
    const whiteEngine = isEngine1White ? "Engine1" : "Engine2";
    const blackEngine = isEngine1White ? "Engine2" : "Engine1";

    let useFirstEngine = true;
    while (!chess.isGameOver()) {
        try {
            const currentEngine = useFirstEngine ? engine1 : engine2;
            const bestMove = await currentEngine.getBestMove(true, 100000, 500);
            logOutput('bestmove ' + bestMove);
            try {
                chess.move(bestMove);
                currentEngine.setPositionWithHistory(chess);
                (!useFirstEngine ? engine1 : engine2).setPositionWithHistory(chess);
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
    logOutput('Game over. Final PGN:');
    logOutput(`[White "${whiteEngine}"]`);
    logOutput(`[Black "${blackEngine}"]`);
    logOutput(chess.pgn());
}

const args = process.argv.slice(2);
if (args.includes('--selfplay')) {
    selfplay();
} else {
    main();
}