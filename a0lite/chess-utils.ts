import { Chess, WHITE, BLACK, PAWN, KNIGHT, BISHOP, ROOK, QUEEN, KING, type Piece } from 'chess.js';

export function mirrorBoardVertically(board: Chess): Chess {
    const mirroredBoard = new Chess();
    const currentFen = board.fen();
    const parts = currentFen.split(' ');

    // Mirror the board part of the FEN string
    const boardRows = parts[0].split('/');
    const mirroredRows = boardRows.reverse().map(row => 
        row.split('').map(char => 
            char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase()
        ).join('')
    ).join('/');

    // Construct the new FEN string with the mirrored board
    
    // Change the turn color in the FEN string
    // console.log(parts[1]);
    parts[1] = parts[1] === 'w' ? 'b' : 'w';
    parts[2] = parts[2].split('').map(char => 
        char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase()
    ).join('');
    // console.log(parts[1]);
    // Load the mirrored FEN into the new Chess instance
    const mirroredFen = [mirroredRows, ...parts.slice(1)].join(' ');
    mirroredBoard.load(mirroredFen);
    return mirroredBoard;
}

export const WPAWN: Piece = { type: PAWN, color: WHITE };
export const WKNIGHT: Piece = { type: KNIGHT, color: WHITE };
export const WBISHOP: Piece = { type: BISHOP, color: WHITE };
export const WROOK: Piece = { type: ROOK, color: WHITE };
export const WQUEEN: Piece = { type: QUEEN, color: WHITE };
export const WKING: Piece = { type: KING, color: WHITE };
export const BPAWN: Piece = { type: PAWN, color: BLACK };
export const BKNIGHT: Piece = { type: KNIGHT, color: BLACK };
export const BBISHOP: Piece = { type: BISHOP, color: BLACK };
export const BROOK: Piece = { type: ROOK, color: BLACK };
export const BQUEEN: Piece = { type: QUEEN, color: BLACK };
export const BKING: Piece = { type: KING, color: BLACK };

export type PieceType = 'WP' | 'WN' | 'WB' | 'WR' | 'WQ' | 'WK' | 'BP' | 'BN' | 'BB' | 'BR' | 'BQ' | 'BK';

export const pieceMap: { [key in PieceType]: { piece: Piece, step: number } } = {
    WP: { piece: WPAWN, step: 0 },
    WN: { piece: WKNIGHT, step: 1 },
    WB: { piece: WBISHOP, step: 2 },
    WR: { piece: WROOK, step: 3 },
    WQ: { piece: WQUEEN, step: 4 },
    WK: { piece: WKING, step: 5 },
    BP: { piece: BPAWN, step: 6 },
    BN: { piece: BKNIGHT, step: 7 },
    BB: { piece: BBISHOP, step: 8 },
    BR: { piece: BROOK, step: 9 },
    BQ: { piece: BQUEEN, step: 10 },
    BK: { piece: BKING, step: 11 }
};