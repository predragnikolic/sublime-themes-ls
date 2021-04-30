const jsonc = require('jsonc-parser')
const fs = require('fs')

const text = fs.readFileSync('./theme.sublime-theme', 'utf8')
try {
    let root = jsonc.parseTree(text, [])
    if (!root) {
        console.log('empty file')
        return
    }

    let node = jsonc.findNodeAtOffset(root, 16)
    console.log(node.parent.parent)
} catch (e) {
    console.log(e)
}