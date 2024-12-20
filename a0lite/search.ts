import { Chess } from './chess.ts';
import { NeuralNetwork } from './network';
import { board2planes } from './planes';
import { policy2moves, moves2bestmove } from './policy';

interface Node {
    parent: Node | null;
    children: Node[];
    move: string | null;
    visits: number;
    value: number;
    prior: number;
    position: Chess;
    wdl?: [number, number, number]; // Store win/draw/loss probabilities
}

export class UCTSearch {
    private network: NeuralNetwork;
    private cpuct: number = 3.1;
    private positionHistory: Set<string>;
    private legacyNetwork: boolean = false;
    
    constructor(network: NeuralNetwork, legacyNetwork: boolean = false) {
        this.network = network;
        this.positionHistory = new Set();
        this.legacyNetwork = legacyNetwork;
    }

    private async expandNode(node: Node): Promise<void> {
        const planes = board2planes(node.position);
        const output = await this.network.predict([planes]);
        
        if (!output) {
            return;
        }

        const moves = policy2moves(node.position, output['/output/policy'].data);
        let value = 0;
        if (this.legacyNetwork) {
            value = Number(output['/output/value'].data[0]);
            // Flip value if black to move since network evaluates from white's perspective
            if (node.position.turn() === 'b') {
                value = -value;
            }
        } else {
            const p_win = Number(output['/output/wdl'].data[0]);
            const p_draw = Number(output['/output/wdl'].data[1]);
            const p_loss = Number(output['/output/wdl'].data[2]);
            
            if (node.position.turn() === 'w') {
                value = p_win;
                node.wdl = [p_win, p_draw, p_loss];
            } else {
                value = p_loss; // From black's perspective, white's loss is black's win
                node.wdl = [p_loss, p_draw, p_win]; // Flip win/loss probabilities for black
            }
        }
        
        node.value = value;
        
        for (const [move, prior] of Object.entries(moves)) {
            const newPosition = node.position.copy();
            try {
                newPosition.move(move);
                // Skip moves that lead to repeated positions
                if (this.positionHistory.has(newPosition.fen())) {
                    continue;
                }
                const child: Node = {
                    parent: node,
                    children: [],
                    move: move,
                    visits: 0,
                    value: 0,
                    prior: prior,
                    position: newPosition
                };
                node.children.push(child);
            } catch (error) {
                console.error(`Invalid move during expansion: ${move}`);
            }
        }
    }

    private selectChild(node: Node): Node {
        let bestScore = -Infinity;
        let bestChild: Node | null = null;
        
        const parentVisits = Math.sqrt(node.visits);
        
        for (const child of node.children) {
            if (child.visits === 0) {
                return child;
            }
            
            const ucb = child.value + 
                       this.cpuct * child.prior * parentVisits / (1 + child.visits);
            
            if (ucb > bestScore) {
                bestScore = ucb;
                bestChild = child;
            }
        }
        
        return bestChild!;
    }

    private async search(root: Node, numSimulations: number, timeLimit?: number): Promise<void> {
        const startTime = Date.now();
        
        for (let i = 0; i < numSimulations; i++) {
            // Check if we've exceeded time limit
            if (timeLimit && Date.now() - startTime > timeLimit) {
                break;
            }
            
            let node = root;
            
            // Selection
            while (node.children.length > 0) {
                node = this.selectChild(node);
            }
            
            // Expansion
            if (node.visits > 0 && !node.position.isGameOver()) {
                await this.expandNode(node);
                if (node.children.length > 0) {
                    node = node.children[0];
                }
            }
            
            // Backpropagation
            let value = node.value;
            while (node !== null) {
                node.visits++;
                node.value += value;
                value = -value;
                if (node.parent === null) break;
                node = node.parent;
            }
        }
    }

    public async getBestMove(position: Chess, numSimulations: number = 800, timeLimit?: number): Promise<string> {
        // Reset position history for new search
        this.positionHistory = new Set();
        // Add current position to history
        this.positionHistory.add(position.fen());
        // console.log(this.positionHistory);
        const root: Node = {
            parent: null,
            children: [],
            move: null,
            visits: 0,
            value: 0,
            prior: 1.0,
            position: position.copy()
        };
        
        await this.expandNode(root);
        await this.search(root, numSimulations, timeLimit);
        
        // Select move with most visits
        let bestVisits = -1;
        let bestMove = '';
        let bestValue = 0;
        let bestWDL: [number, number, number] | undefined;
        
        for (const child of root.children) {
            if (child.visits > bestVisits) {
                bestVisits = child.visits;
                bestMove = child.move!;
                bestValue = child.value / child.visits;
                bestWDL = child.wdl;
            }
        }
        

        // console.log("value: ", bestValue);
        // console.log("wdl:", bestWDL);
        return bestMove;
    }
}
