// Swap the state directory pathname for a victim directory symlink. A helper
// that re-resolves the parent can publish into the victim; a pinned helper
// remains on its original inode or fails closed at O_NOFOLLOW traversal.
const fs = require("node:fs")
const [dir, victim] = process.argv.slice(2)
const parked = `${dir}.parked`
for (;;) {
  try {
    fs.renameSync(dir, parked)
    fs.symlinkSync(victim, dir, "dir")
    fs.unlinkSync(dir)
    fs.renameSync(parked, dir)
  } catch {
    try { if (fs.existsSync(parked) && !fs.existsSync(dir)) fs.renameSync(parked, dir) } catch {}
  }
}
