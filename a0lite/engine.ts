import { Chess } from 'chess.js';
import { NeuralNetwork } from './network';
import { board2planes } from './planes';
import { moves2bestmove, policy2moves } from './policy';
import { UCTSearch } from './search';
import { getModelPath } from './network';

export class Engine {
    private network: NeuralNetwork;
    private search: UCTSearch | null;
    private position: Chess;
    private moves: string[];

    constructor() {
        this.network = new NeuralNetwork();
        this.search = null;
        this.position = new Chess();
        this.moves = [];
    }

    public async init(modelPath: string): Promise<void> {
        await this.network.loadModel(modelPath);
        this.search = new UCTSearch(this.network);
    }

    public isInitialized(): boolean {
        return this.network.initialized();
    }

    public async loadDefaultModel(): Promise<void> {
        await this.init(getModelPath('badgyal.onnx'));
    }

    public newGame(): void {
        this.position = new Chess();
        this.moves = [];
    }

    public setPosition(fen: string, moves: string[] = []): void {
        this.position = new Chess(fen);
        this.moves = [];
        for (const move of moves) {
            try {
                this.position.move(move);
                this.moves.push(move);
            } catch (error) {
                console.error(`Invalid move: ${move}`);
                break;
            }
        }
    }

    public async getBestMove(useSearch: boolean = true, numSimulations: number = 1000000): Promise<string> {
        if (!this.network.initialized()) {
            throw new Error('Engine not initialized');
        }

        if (useSearch && this.search) {
            return await this.search.getBestMove(this.position, numSimulations);
        }

        const planes = board2planes(this.position);
        const output = await this.network.predict([planes]);
        
        if (!output) {
            throw new Error('Failed to get prediction');
        }

        const moves = policy2moves(this.position, output['/output/policy'].data);
        return moves2bestmove(moves);
    }

    public getPosition(): Chess {
        return new Chess(this.position.fen());
    }

    public getMoves(): string[] {
        return [...this.moves];
    }
}
