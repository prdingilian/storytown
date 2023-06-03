export type RoomConfig = {
  state: 'pending' | 'playing' | 'complete'
  name: string
  contributionLength: string
  timeLimit: number | string
  content: string
  currentUser: number | string
  nextTurn?: number | string
  previousContribution?: string
}

export type RoomData = {
  room: RoomConfig
  users: string[]
  currentUser: string
  isCurrentUser: boolean
}