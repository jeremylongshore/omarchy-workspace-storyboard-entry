// Replace the final history entry and any visible exclusive temporary entry
// with a victim symlink as quickly as a same-UID process can enumerate them.
const fs = require("node:fs")
const [dir, victim, ready, attacked] = process.argv.slice(2)
if (ready) fs.writeFileSync(ready, "ready")
for (;;) {
  try {
    for (const name of fs.readdirSync(dir)) {
      if (name !== "history.jsonl" && !name.startsWith(".history.")) continue
      const candidate = `${dir}/${name}`
      try { fs.unlinkSync(candidate) } catch {}
      try { fs.symlinkSync(victim, candidate); if (attacked) fs.writeFileSync(attacked, "attacked") } catch {}
    }
  } catch {}
}
