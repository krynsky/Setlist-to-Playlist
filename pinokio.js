module.exports = {
  version: "8.0.0",
  title: "Setlist to Playlist",
  description: "Create Spotify playlists from Setlist.fm shows using your own API keys.",
  icon: "icon.svg",
  menu: async (kernel, info) => {
    const installed = info.exists("app/node_modules")
    const running = info.running("start.js")
    if (!installed) return [{ icon: "fa-solid fa-download", text: "Install", href: "install.js", default: true }]
    if (running) {
      const local = info.local("start.js")
      return [{ icon: "fa-solid fa-spin fa-circle-notch", text: "Running", href: "start.js" }, { icon: "fa-solid fa-globe", text: "Open app", href: local.url, target: "_blank", default: true }, { icon: "fa-solid fa-folder-open", text: "Configure API keys", href: "app/.env.local", fs: "open" }]
    }
    return [{ icon: "fa-solid fa-play", text: "Start", href: "start.js", default: true }, { icon: "fa-solid fa-folder-open", text: "Configure API keys", href: "app/.env.local", fs: "open" }, { icon: "fa-solid fa-rotate", text: "Update", href: "update.js" }, { icon: "fa-solid fa-plug-circle-xmark", text: "Reset dependencies", href: "reset.js" }]
  }
}
