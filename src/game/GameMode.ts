export const GameMode = { SURVIVAL: 0, CREATIVE: 1 } as const
export type GameMode = (typeof GameMode)[keyof typeof GameMode]
