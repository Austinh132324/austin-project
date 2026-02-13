import { useState } from 'react'
import { Link } from 'react-router-dom'
import '../styles/MarkdownPreview.css'

const SAMPLE = `# Markdown Previewer

## Features
- **Bold** and *italic* text
- [Links](https://austinshowell.dev)
- Inline \`code\` snippets

### Code Blocks
\`\`\`
function hello() {
  console.log("Hello, world!")
}
\`\`\`

### Lists
1. First item
2. Second item
3. Third item

> Blockquotes look like this

---

Built with love by Austin Howell.
`

function parseMarkdown(md: string): string {
  let html = md
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Headings
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr>')
    // Bold and italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // Wrap consecutive <li> tags
    .replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>')
    // Paragraphs
    .replace(/^(?!<[a-z])((?!<).+)$/gm, '<p>$1</p>')

  // Clean up extra whitespace
  html = html.replace(/\n{2,}/g, '\n')
  return html
}

export default function MarkdownPreview() {
  const [input, setInput] = useState(SAMPLE)

  const copyHtml = () => {
    navigator.clipboard.writeText(parseMarkdown(input))
  }

  return (
    <div className="md-page">
      <div className="md-top-bar">
        <Link to="/tools" className="md-back-link">Tools</Link>
        <h1>Markdown Preview</h1>
        <button className="md-copy-btn" onClick={copyHtml}>Copy HTML</button>
      </div>

      <div className="md-split">
        <div className="md-editor-pane">
          <div className="md-pane-header">Editor</div>
          <textarea
            className="md-textarea"
            value={input}
            onChange={e => setInput(e.target.value)}
            spellCheck={false}
          />
        </div>
        <div className="md-preview-pane">
          <div className="md-pane-header">Preview</div>
          <div
            className="md-preview"
            dangerouslySetInnerHTML={{ __html: parseMarkdown(input) }}
          />
        </div>
      </div>
    </div>
  )
}
