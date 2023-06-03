import { RoomConfig } from "~/types";
import { redisClient } from "./redisClient.server";
import { v4 as uuidv4 } from "uuid";

export async function createRoom(config: RoomConfig, creatorId: string) {
  const roomId = uuidv4()
  const roomKey = `room:${roomId}`
  const roomUsersKey = `users:${roomId}`

  redisClient.hSet(roomKey, config)
  redisClient.rPush(roomUsersKey, creatorId)

  redisClient.expire(roomKey, 60 * 60 * 4)
  redisClient.expire(roomUsersKey, 60 * 60 * 4)

  return roomId
}

export async function addUserToRoom(roomId: string, userId: string) {
  const roomUsersKey = `users:${roomId}`
  await redisClient.rPush(roomUsersKey, userId)
  redisClient.publish(roomId, 'updated')
}

export async function updateRoom(roomId: string, config: RoomConfig) {
  const roomKey = `room:${roomId}`
  await redisClient.hSet(roomKey, config)
  redisClient.publish(roomId, 'updated')
}

export async function getRoom(roomId: string) {
  const roomKey = `room:${roomId}`
  const room = await redisClient.hGetAll(roomKey)
  return room as RoomConfig
}

export async function getRoomUsers(roomId: string) {
  const roomUsersKey = `users:${roomId}`
  const users = await redisClient.lRange(roomUsersKey, 0, -1)
  return users
}