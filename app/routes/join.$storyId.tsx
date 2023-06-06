import { ActionArgs, LoaderArgs, redirect } from "@remix-run/node"
import { userCookie } from "~/cookies"
import { v4 as uuidv4 } from "uuid"
import { addUserToRoom } from "~/features/storyRoom.server"

export const loader = async ({ request, params }: LoaderArgs) => {
  const cookieHeader = request.headers.get("Cookie")
  const cookie = await userCookie.parse(cookieHeader)

  if (!cookie) {
    const userId = uuidv4()
    const roomId = params.storyId
    return redirect(`/join/${roomId}`, {
      headers: {
        "Set-Cookie": await userCookie.serialize(userId),
      },
    })
  } else {
    return null
  }
}

export const action = async ({ request, params }: ActionArgs) => {
  const cookieHeader = request.headers.get("Cookie")
  const userIdCookie = await userCookie.parse(cookieHeader)

  const formData = await request.formData()
  const username = formData.get("username")
  const roomId = params.storyId!

  await addUserToRoom(roomId, `${userIdCookie}:${username}`)
  return redirect(`/story/${roomId}`)
}

export default function Join() {
  return (
    <form method="POST">
      <div className="form-field">
        <label>
          Username
          <input name="username" />
        </label>
      </div>

      <div style={{ textAlign: 'end' }}>
        <button style={{ marginTop: '16px' }} type="submit">Join</button>
      </div>
    </form>
  )
}
