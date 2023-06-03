import type { LinksFunction } from "@remix-run/node";
import {
  Link,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import stylesUrl from "~/styles/index.css";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesUrl }
];


export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <div style={{ textAlign: 'center' }}>
          <h1>
            <Link to="/" style={{ textDecoration: 'none' }}>📖</Link> <span className="title">Storytown</span>
          </h1>
        </div>
        <div style={{ maxWidth: '648px', margin: '0 auto', paddingInline: '16px' }}>
          <Outlet />
        </div>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
