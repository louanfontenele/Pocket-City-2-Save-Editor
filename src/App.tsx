import { Outlet } from "react-router-dom";
import { AppPageShell } from "@/components/app-page-shell";

/**
 * Root layout — wraps all routes with the sidebar shell.
 * Each page passes its own title/description via the AppPageShell it renders.
 */
export function App() {
  return <Outlet />;
}
