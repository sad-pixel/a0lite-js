export function getAllocatedTime(numberOfMoves: number, timeRemaining: number) {
    if (numberOfMoves < 15) {
        return 0.025 * timeRemaining;
    } else if (numberOfMoves >= 15 && numberOfMoves < 50) {
        return 0.05 * timeRemaining;
    } else {
        return 0.01 * timeRemaining;
    }
}