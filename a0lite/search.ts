import { Chess } from './chess.ts';
import { NeuralNetwork } from './network';
import { board2planes } from './planes';
import { policy2moves, moves2bestmove } from './policy';

interface Node {
    parent: Node | null;
    children: Map<string, Node>;
    move: string | null;
    isExpanded: boolean;
    totalValue: number;
    visits: number;
    prior: number;
    position: Chess;
    wdl: [number, number, number];
}

const FPU = -1.0;
const FPU_ROOT = 0.0;

export class UCTSearch {
    private network: NeuralNetwork;
    private cpuct: number = 3.1;
    
    constructor(network: NeuralNetwork) {
        this.network = network;
    }

    private Q(node: Node): number {
        return node.totalValue / (1 + node.visits);
    }

    private U(node: Node): number {
        return Math.sqrt(node.parent!.visits) * node.prior / (1 + node.visits);
    }

    private selectBestChild(node: Node): Node {
        let bestScore = -Infinity;
        let bestChild: Node | null = null;

        for (const child of node.children.values()) {
            const score = this.Q(child) + this.cpuct * this.U(child);
            if (score > bestScore) {
                bestScore = score;
                bestChild = child;
            }
        }
        return bestChild!;
    }

    private selectLeaf(root: Node): Node {
        let current = root;
        while (current.isExpanded && current.children.size > 0) {
            current = this.selectBestChild(current);
        }
        if (!current.position && current.parent) {
            current.position = current.parent.position.copy();
            current.position.move(current.move!);
        }
        return current;
    }

    private async expandNode(node: Node): Promise<[number, Map<string, number>]> {
        const planes = board2planes(node.position);
        const output = await this.network.predict([planes]);
        
        if (!output) {
            return [0, new Map()];
        }

        const moves = policy2moves(node.position, output['/output/policy'].data);
        const value = Number(output['/output/wdl'].data[0]);
        const wdl: [number, number, number] = [
            Number(output['/output/wdl'].data[0]),
            Number(output['/output/wdl'].data[1]), 
            Number(output['/output/wdl'].data[2])
        ];
        node.wdl = wdl;
        node.isExpanded = true;
        node.children = new Map();
        
        for (const [move, prior] of Object.entries(moves)) {
            const child: Node = {
                parent: node,
                children: new Map(),
                move: move,
                isExpanded: false,
                totalValue: node.parent === null ? FPU_ROOT : FPU,
                visits: 0,
                prior: prior,
                position: null!,
                wdl: [0, 0, 0]
            };
            node.children.set(move, child);
        }

        return [value, new Map(Object.entries(moves))];
    }

    private backup(node: Node, value: number): void {
        let current = node;
        let turnFactor = -1;
        while (current.parent !== null) {
            current.visits += 1;
            current.totalValue += value * turnFactor;
            current = current.parent;
            turnFactor *= -1;
        }
        current.visits += 1;
    }

    public async getBestMove(position: Chess, numSimulations: number = 800, timeLimit?: number): Promise<string> {
        const startTime = Date.now();
        let count = 0;

        const root: Node = {
            parent: null,
            children: new Map(),
            move: null,
            isExpanded: false,
            totalValue: FPU_ROOT,
            visits: 0,
            prior: 1.0,
            position: position.copy(),
            wdl: [0, 0, 0]
        };

        for (let i = 0; i < numSimulations; i++) {
            count++;
            
            if (timeLimit && Date.now() - startTime > timeLimit) {
                break;
            }

            const leaf = this.selectLeaf(root);
            const [value, childPriors] = await this.expandNode(leaf);
            this.backup(leaf, value);
        }

        return this.getBestMoveFromRoot(root);
    }

    private getBestMoveFromRoot(root: Node): string {
        let bestScore = -1;
        let bestMove = '';
        
        for (const [move, child] of root.children.entries()) {
            // Calculate a score that considers both visits and potential repetitions
            let score = child.visits;
            
            // Check if this move leads to a repetition by looking at position history
            let testPosition = root.position.copy();
            testPosition.move(move);

            // Early exit if a mate in 1 is found.
            if (testPosition.isCheckmate()) {
                console.log('info string using early mate in 1 exit');
                return move;
            }
            
            if (testPosition.isThreefoldRepetition()) {
                score *= 0.1;
                console.log('info string this move leads to 3fold: ', move);
                console.log('info string wdl', child.wdl);
                console.log('info string value', child.totalValue);
                console.log('info string visits', child.visits);
            } else {
                // Check if any legal moves after this one lead to 3fold
                const legalMoves = testPosition.moves();
                for (const nextMove of legalMoves) {
                    let nextPosition = testPosition.copy();
                    nextPosition.move(nextMove);
                    if (nextPosition.isThreefoldRepetition()) {
                        // Penalize moves that allow opponent to force 3fold
                        score *= 0.1;
                        console.log('info string opponent can force 3fold: ', nextMove);
                        break;
                    }
                }
            }
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        
        return bestMove;
    }
}
