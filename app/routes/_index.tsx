import type { V2_MetaFunction } from "@remix-run/node"
import { useNavigate } from "@remix-run/react"

export const meta: V2_MetaFunction = () => {
  return [
    { title: "Storytown" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};


export default function Index() {
  const navigate = useNavigate()
  return (
    <div>
      <h2>Welcome to Storytown</h2>
      <p>
        Collaborate with your friends to write stories. No account is needed,
        just create a story and then share the link. You can set custom time limits
        and contribution lengths.
      </p>
      <h3>How does the game work?</h3>
      <p>
        Players take turns contributing to a story while only being able to see
        one previous contribution. Once every player has contributed, a new round
        begins with a shorter time limit. When the time limit runs out, the story
        is finally revealed.
      </p>
      <div style={{ textAlign: 'end' }}>
        <button onClick={() => navigate("/new")}>Create new story</button>
      </div>
    </div>
  );
}
