import { ActionArgs, LoaderArgs, redirect } from "@remix-run/node"
import { v4 as uuidv4 } from "uuid"
import { userCookie } from "~/cookies"
import { createRoom } from "~/features/storyRoom.server"
import { RoomConfig } from "~/types"

export const action = async ({ request }: ActionArgs) => {
  const cookieHeader = request.headers.get("Cookie")
  const userCookieValue = await userCookie.parse(cookieHeader)
  const formData = await request.formData()

  const roomConfig: RoomConfig = {
    name: formData.get('storyName') as string,
    contributionLength: formData.get('contributionLength') as string,
    timeLimit: Number(formData.get('timeLimit')),
    content: '',
    currentUser: -1,
    state: 'pending'
  }

  const creatorId = `${userCookieValue}:${formData.get('username') as string}`
  const roomId = await createRoom(roomConfig, creatorId)

  return redirect(`/story/${roomId}`)
}

export const loader = async ({ request }: LoaderArgs) => {
  const cookieHeader = request.headers.get("Cookie")
  const cookie = await userCookie.parse(cookieHeader)

  if (!cookie) {
    const userId = uuidv4()
    return redirect("/new", {
      headers: {
        "Set-Cookie": await userCookie.serialize(userId),
      },
    })
  } else {
    return null
  }
}

export default function NewStory() {
  return (
    <div>
      <h2>Create new story</h2>
      <form method="POST">
        <div className="form-field">
          <label>
            Your username
            <div>
              <input name="username" maxLength={25} required />
            </div>
          </label>
        </div>

        <div className="form-field">
          <label>
            Story name
            <div>
              <input name="storyName" defaultValue='The Funky Skunk' required />
            </div>
          </label>
        </div>

        <div className="form-field">
          <label>
            Max contribution length (characters)
            <div>
              <input type="number" name="contributionLength" defaultValue={140} required />
            </div>
          </label>
        </div>

        <div className="form-field">
          <label>
            Initial time limit (seconds)
            <div>
              <input type="number" name="timeLimit" max={120} defaultValue={60} required />
            </div>
          </label>
        </div>

        <div style={{ textAlign: 'end' }}>
          <button style={{ marginTop: '16px' }}>Create</button>
        </div>
      </form>
    </div>
  )
}