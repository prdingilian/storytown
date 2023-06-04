import { LoaderArgs } from "@remix-run/node"
import { subClient } from "~/features/redisClient.server";

type SendFunction = (event: string, data: string) => void;
type CleanupFunction = () => void;
type InitFunction = (send: SendFunction) => CleanupFunction;

function eventStream(signal: AbortSignal, init: InitFunction) {
  let stream = new ReadableStream({
    start(controller) {
      let encoder = new TextEncoder()

      function send(event: string, data: string) {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\n`))
          controller.enqueue(encoder.encode(`data: ${data}\n\n`))
        } catch (e) {
          console.error(e)
        }
      }

      let cleanup = init(send)
      let closed = false
      function close() {
        if (closed) return
        cleanup()
        closed = true
        signal.removeEventListener("abort", close)
        controller.close()
      }

      signal.addEventListener("abort", close)
      if (signal.aborted) return close()
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}


export const loader = async ({ request, params }: LoaderArgs) => {
  return eventStream(request.signal, send => {
    subClient.subscribe(params.storyId!, (m) => {
      handleMessage(m)
    })

    function handleMessage(message: string) {
      send("message", message)
    }

    return () => {
      subClient.unsubscribe(params.storyId!)
    };
  });
}