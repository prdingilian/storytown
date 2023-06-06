import { ActionArgs, LoaderArgs, redirect } from "@remix-run/node"
import { Form, useLoaderData, useNavigate, useParams } from "@remix-run/react"
import { userCookie } from "~/cookies"
import { useEffect, useRef, useState } from "react"
import { RoomData } from "~/types"
import { cancelTimer, scheduleTimer } from "~/features/scheduler.server"
import { getRoom, getRoomUsers, updateRoom } from "~/features/storyRoom.server"
import { Users } from "~/components/Users"

export const loader = async ({ params, request }: LoaderArgs) => {
  const room = await getRoom(params.storyId!)
  const users = await getRoomUsers(params.storyId!)

  const cookieHeader = request.headers.get("Cookie")
  const userIdCookie = await userCookie.parse(cookieHeader)

  if (!userIdCookie || !(users.filter(u => u.includes(userIdCookie)).length)) {
    return redirect(`/join/${params.storyId}`)
  }

  const currentUserIndex = room.currentUser as unknown as number
  const currentUser = users[currentUserIndex] as string

  const isCurrentUser = currentUser?.includes(userIdCookie)

  return { room, users, currentUser, isCurrentUser }
}

export const action = async ({ request, params }: ActionArgs) => {
  try {
    const room = await getRoom(params.storyId!)
    const users = await getRoomUsers(params.storyId!)

    // Start the game if needed
    if (room.state === 'pending') {
      room.state = 'playing'
      room.currentUser = 0
      const expiration = new Date().getTime() + (Number(room.timeLimit) * 1000)
      room.nextTurn = expiration
      await updateRoom(params.storyId!, room)
      scheduleTimer(params.storyId!)
      return null
    }

    const formData = await request.formData()
    const contribution = formData.get('contribution')

    // Add the submitted contribution
    if (contribution) {
      room.content += ` ${contribution}`
      room.previousContribution = contribution as string
    }

    // Set the next user
    room.currentUser = ((Number(room.currentUser) + 1) % users.length).toString()

    // Decrement the time limit
    if (Number(room.currentUser) === 0) {
      room.timeLimit = (Number(room.timeLimit) - 2).toString()
    }

    // End the game if the time limit ran out
    if (Number(room.timeLimit) < 2) {
      room.state = 'complete'
      room.currentUser = -1
    }

    // Set the new expiration time for the next turn
    const expiration = new Date().getTime() + (Number(room.timeLimit) * 1000)
    room.nextTurn = expiration

    // Save the updated room
    await updateRoom(params.storyId!, room)

    // Update or cancel the game timer as needed
    if (room.state === 'playing') {
      scheduleTimer(params.storyId!)
    } else if (room.state === 'complete') {
      cancelTimer(params.storyId!)
    }

    return null
  } catch (e) {
    console.error(e)
  }
}

export default function Story() {
  const { storyId } = useParams()
  const navigate = useNavigate()
  const { room, users, currentUser, isCurrentUser } = useLoaderData<RoomData>()
  let currentUsername: string = '';
  if (currentUser) {
    const [_, username] = currentUser.split(":")
    currentUsername = username
  }
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const bottomRef = useRef<HTMLParagraphElement>(null)
  const [storyCopied, setStoryCopied] = useState(false)
  const [characterCount, setCharacterCount] = useState(0)

  // Effect for subscribing to the room's event source
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data === 'updated') {
        // we got a server event which means the story has been updated
        // just need to re run the loader
        navigate(".")
      }
    }

    const eventSource = new EventSource(`/events/${storyId}`)
    eventSource.addEventListener('message', handler)

    return () => {
      eventSource.removeEventListener('message', handler)
      eventSource.close()
    }
  }, [room, isCurrentUser])

  const [timer, setTimer] = useState<number>()

  // Effect for the countdown timer
  useEffect(() => {
    if (isCurrentUser) {
      const timeLimit = Number(room.timeLimit)

      if (timeLimit) {
        const currentTime = new Date().getTime()
        const timeRemaining = Number(room.nextTurn) - currentTime
        setTimer(Math.ceil(timeRemaining / 1000))

        const interval = setInterval(() => {
          const currentTime = new Date().getTime()
          const timeRemaining = Number(room.nextTurn) - currentTime
          setTimer(Math.ceil(timeRemaining / 1000))
        }, 1000)

        return () => {
          clearInterval(interval)
        }

      }
    }
  }, [isCurrentUser, room.timeLimit, room.nextTurn])

  // Effect for focus management
  useEffect(() => {
    if (isCurrentUser) {
      setCharacterCount(0)
      formRef.current?.reset()
      inputRef.current?.focus()
      inputRef.current?.scrollIntoView()
    } else {
      bottomRef.current?.scrollIntoView()
    }
  }, [isCurrentUser])

  if (room.state === 'pending') {
    return (
      <div>
        <h2>{room.name}</h2>
        <p>
          Share the link to invite friends. Once everyone is here, start the game!
          Players can still join once the game has been started.
        </p>
        <Users users={users} currentUser={currentUser} />
        <Form method="POST">
          <div style={{ textAlign: 'end' }}>
            <button>Start the game</button>
          </div>
        </Form>
      </div>
    )
  }

  return (
    <div style={{ paddingBottom: '16px' }}>
      <h2>{room.name}</h2>
      <p style={{
        whiteSpace: 'pre-line',
        color: room.state === 'playing' ? 'transparent' : 'inherit',
        textShadow: room.state === 'playing' ? '0 0 14px rgba(0,0,0,0.5)' : 'none',
        transition: 'all 3s ease-in-out'
      }}>{room.state === 'playing' ? room.content.replace(/[aeiou]/gi, 'z') : room.content}</p>

      <hr />

      <Users users={users} currentUser={currentUser} />

      {room.state === 'playing' && (
        <div>
          {isCurrentUser ? (
            <Form ref={formRef} method="POST">
              <div>
                <label>
                  <b>Previous contribution:</b>
                  <div style={{ paddingBottom: '8px' }}>
                    {room.previousContribution}
                  </div>
                  <div>
                    <textarea
                      ref={inputRef}
                      name='contribution'
                      maxLength={Number(room.contributionLength)}
                      style={{ width: '100%', height: '150px' }}
                      onChange={e => setCharacterCount(e.target.value.length)}
                    />
                  </div>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                <div style={{ fontWeight: '200' }}>
                  <div>✏️ {Number(room.contributionLength) - characterCount}</div>
                  {timer ? <div className={timer < 6 ? 'animate-fade-fast' : ''}>🕰️ {Math.max(timer, 0)}</div> : null}
                </div>
                <button type="submit">Submit</button>
              </div>
            </Form>
          ) : (
            <p className="animate-fade-slow" ref={bottomRef}>{currentUsername} is working on it...</p>
          )}
        </div>)
      }

      {room.state === 'complete' && (
        <div>
          <i>Congratulations on finishing your story! This page will expire soon so make sure to copy your story if you want
            to keep it.</i>
          <div style={{ textAlign: 'end', paddingTop: '16px' }}>
            <button onClick={async () => {
              await navigator.clipboard.writeText(room.content)
              setStoryCopied(true)
            }}>{storyCopied ? 'Copied!' : 'Copy story'}</button>
          </div>
        </div>
      )}
    </div>
  )
}