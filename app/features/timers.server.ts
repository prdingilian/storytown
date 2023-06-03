let timers: Map<string, ReturnType<typeof setInterval>>

// this is needed because in development we don't want to restart
// the server with every change, but we want to make sure we don't
// create a new timers map with every change either.
declare global {
  var __timers: Map<string, ReturnType<typeof setInterval>> | undefined
}
if (process.env.NODE_ENV === "production") {
  timers = new Map();
} else {
  if (!global.__timers) {
    global.__timers = new Map();
  }
  timers = global.__timers;
}

export { timers }