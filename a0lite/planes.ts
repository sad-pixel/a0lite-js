import { Chess, WHITE, BLACK, PAWN, KNIGHT, BISHOP, ROOK, QUEEN, KING, type Piece, type Color } from 'chess.js';
import { mirrorBoardVertically, pieceMap, type PieceType } from './chess-utils';

function appendPlane(planes: number[][][], ones: boolean): number[][][] {
    const plane = ones ? Array(8).fill(Array(8).fill(1)) : Array(8).fill(Array(8).fill(0));
    return [...planes, plane];
}

export function board2planes(board_: Chess): number[][][] {
    const board = (board_.turn() as Color) ? board_ : mirrorBoardVertically(board_);
    let retval: number[][][] = Array.from({ length: 13 }, () => 
        Array.from({ length: 8 }, () => 
            Array(8).fill(0)
        )
    );

    const boardRef = board.board();

    for (let row = 7; row >= 0; row--) {
        for (let col = 0; col < 8; col++) {
            // console.log(row, col);
            const piece = boardRef[row][col];
            if (piece !== null) {
                const pieceKey = (piece.color.toUpperCase() + piece.type.toUpperCase()) as PieceType;
                const step = pieceMap[pieceKey].step;
                retval[step][7 - row][col] = 1;
            }
        }
    }
    
    const temp = JSON.parse(JSON.stringify(retval));
    for (let i = 0; i < 7; i++) {
        retval = retval.concat(temp);
    }

    retval = appendPlane(retval, board.getCastlingRights('w').k);
    retval = appendPlane(retval, board.getCastlingRights('w').q);
    retval = appendPlane(retval, board.getCastlingRights('b').k);
    retval = appendPlane(retval, board.getCastlingRights('b').q);
    retval = appendPlane(retval, !(board_.turn() === 'w'));

    retval = appendPlane(retval, false);
    retval = appendPlane(retval, false);
    retval = appendPlane(retval, true);

    return retval;
}
