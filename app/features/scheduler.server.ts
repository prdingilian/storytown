import { getRoom, getRoomUsers, updateRoom } from "./storyRoom.server"
import { timers } from "./timers.server"

export async function scheduleTimer(roomId: string) {
  cancelTimer(roomId)
  const room = await getRoom(roomId)

  const timeout = setInterval(async () => {
    if (new Date().getTime() > Number(room.nextTurn)) {
      const room = await getRoom(roomId)
      const timeLimit = Number(room.timeLimit)
      const users = await getRoomUsers(roomId)
      const expiration = new Date().getTime() + (timeLimit * 1000)

      room.currentUser = ((Number(room.currentUser) + 1) % users.length).toString()
      room.nextTurn = expiration

      if (Number(room.currentUser) === 0) {
        room.timeLimit = (Number(room.timeLimit) - 2).toString()
      }

      if (Number(room.timeLimit) < 2) {
        room.state = 'complete'
        room.currentUser = -1
      }

      await updateRoom(roomId, room)

      clearInterval(timeout)

      if (room.state === 'playing') {
        scheduleTimer(roomId)
      }
    }
  }, 1000)

  timers.set(roomId, timeout)
}

export function cancelTimer(roomId: string) {
  const timeout = timers.get(roomId)

  if (timeout) clearInterval(timeout)
}