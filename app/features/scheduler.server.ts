import { getRoom, getRoomUsers, updateRoom } from "./storyRoom.server"
import { timers } from "./timers.server"

export async function scheduleTimer(roomId: string, seconds: number) {
  cancelTimer(roomId)

  const expiration = new Date().getTime() + (seconds * 1000)
  const room = await getRoom(roomId)
  updateRoom(roomId, { ...room, nextTurn: expiration })

  const timeout = setInterval(async () => {
    if (new Date().getTime() > expiration) {
      const room = await getRoom(roomId)
      const users = await getRoomUsers(roomId)
      const expiration = new Date().getTime() + (seconds * 1000)

      room.currentUser = ((Number(room.currentUser) + 1) % users.length).toString()
      room.nextTurn = expiration

      await updateRoom(roomId, room)

      clearInterval(timeout)
      scheduleTimer(roomId, seconds)
    }
  }, 1000)

  timers.set(roomId, timeout)
}

export function cancelTimer(roomId: string) {
  const timeout = timers.get(roomId)

  if (timeout) clearInterval(timeout)
}