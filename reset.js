module.exports = { run: [{ method: "shell.run", params: { path: "app", message: ["{{platform === 'win32' ? 'rmdir /s /q node_modules' : 'rm -rf node_modules'}}", "npm ci"] } }] }
