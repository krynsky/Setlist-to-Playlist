import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { isLoopbackHost } from "@/lib/local-settings";
import { SettingsForm } from "./settings-form";

export const metadata = {
  title: "Local settings",
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const requestHeaders = await headers();
  if (!isLoopbackHost(requestHeaders.get("host"))) notFound();

  return (
    <main className="settings-page">
      <section className="settings-card" aria-labelledby="settings-title">
        <p className="eyebrow">LOCAL SETUP</p>
        <h1 id="settings-title">Connect your accounts</h1>
        <p className="settings-intro">
          Add your own Setlist.fm API key and Spotify Client ID to run Setlist to Playlist on this computer.
        </p>
        <SettingsForm />
      </section>
    </main>
  );
}
