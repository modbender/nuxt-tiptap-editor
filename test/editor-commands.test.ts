/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { Editor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'

describe('TipTap editor commands', () => {
  let editor: Editor

  beforeEach(() => {
    editor = new Editor({
      content: '<p>Hello World</p>',
      extensions: [
        StarterKit,
        Image,
      ],
    })
  })

  afterEach(() => {
    editor.destroy()
  })

  describe('text formatting commands', () => {
    it('toggleBold applies bold formatting', () => {
      editor.commands.setContent('<p>test text</p>')
      editor.commands.selectAll()
      editor.commands.toggleBold()

      expect(editor.isActive('bold')).toBe(true)
      expect(editor.getHTML()).toContain('<strong>')
    })

    it('toggleItalic applies italic formatting', () => {
      editor.commands.setContent('<p>test text</p>')
      editor.commands.selectAll()
      editor.commands.toggleItalic()

      expect(editor.isActive('italic')).toBe(true)
      expect(editor.getHTML()).toContain('<em>')
    })

    it('toggleStrike applies strikethrough formatting', () => {
      editor.commands.setContent('<p>test text</p>')
      editor.commands.selectAll()
      editor.commands.toggleStrike()

      expect(editor.isActive('strike')).toBe(true)
      expect(editor.getHTML()).toContain('<s>')
    })

    it('toggleCode applies inline code formatting', () => {
      editor.commands.setContent('<p>test text</p>')
      editor.commands.selectAll()
      editor.commands.toggleCode()

      expect(editor.isActive('code')).toBe(true)
      expect(editor.getHTML()).toContain('<code>')
    })

    it('unsetAllMarks removes all formatting', () => {
      editor.commands.setContent('<p><strong><em>formatted</em></strong></p>')
      editor.commands.selectAll()
      editor.commands.unsetAllMarks()

      expect(editor.getHTML()).not.toContain('<strong>')
      expect(editor.getHTML()).not.toContain('<em>')
    })
  })

  describe('heading commands', () => {
    it('toggleHeading level 1 creates h1', () => {
      editor.commands.setContent('<p>Heading</p>')
      editor.commands.focus()
      editor.commands.selectAll()
      editor.commands.toggleHeading({ level: 1 })

      expect(editor.getHTML()).toContain('<h1>')
    })

    it('toggleHeading level 2 creates h2', () => {
      editor.commands.setContent('<p>Heading</p>')
      editor.commands.focus()
      editor.commands.selectAll()
      editor.commands.toggleHeading({ level: 2 })

      expect(editor.getHTML()).toContain('<h2>')
    })

    it('toggleHeading level 3 creates h3', () => {
      editor.commands.setContent('<p>Heading</p>')
      editor.commands.focus()
      editor.commands.selectAll()
      editor.commands.toggleHeading({ level: 3 })

      expect(editor.getHTML()).toContain('<h3>')
    })

    it('toggleHeading toggles back to paragraph', () => {
      editor.commands.setContent('<h1>Heading</h1>')
      editor.commands.focus()
      editor.commands.selectAll()
      editor.commands.toggleHeading({ level: 1 })

      // After toggling, content should include a paragraph
      expect(editor.getHTML()).toContain('<p>')
    })
  })

  describe('list commands', () => {
    it('toggleBulletList creates unordered list', () => {
      editor.commands.setContent('<p>Item</p>')
      editor.commands.focus()
      editor.commands.selectAll()
      editor.commands.toggleBulletList()

      const html = editor.getHTML()
      expect(html).toContain('<ul>')
      expect(html).toContain('<li>')
    })

    it('toggleOrderedList creates ordered list', () => {
      editor.commands.setContent('<p>Item</p>')
      editor.commands.focus()
      editor.commands.selectAll()
      editor.commands.toggleOrderedList()

      const html = editor.getHTML()
      expect(html).toContain('<ol>')
      expect(html).toContain('<li>')
    })
  })

  describe('block commands', () => {
    it('toggleBlockquote creates blockquote', () => {
      editor.commands.setContent('<p>Quote</p>')
      editor.commands.focus()
      editor.commands.selectAll()
      editor.commands.toggleBlockquote()

      const html = editor.getHTML()
      expect(html).toContain('<blockquote>')
    })

    it('toggleCodeBlock creates code block', () => {
      editor.commands.setContent('<p>code</p>')
      editor.commands.focus()
      editor.commands.selectAll()
      editor.commands.toggleCodeBlock()

      const html = editor.getHTML()
      expect(html).toContain('<pre>')
    })

    it('setHorizontalRule inserts hr', () => {
      editor.commands.setContent('<p>Before</p>')
      editor.commands.setHorizontalRule()

      expect(editor.getHTML()).toContain('<hr>')
    })
  })

  describe('link extension commands', () => {
    it('setLink applies link to selection', () => {
      editor.commands.setContent('<p>click here</p>')
      editor.commands.selectAll()
      editor.commands.setLink({ href: 'https://example.com' })

      expect(editor.isActive('link')).toBe(true)
      expect(editor.getHTML()).toContain('href="https://example.com"')
    })

    it('unsetLink removes link', () => {
      editor.commands.setContent('<p><a href="https://example.com">link</a></p>')
      editor.commands.selectAll()
      editor.commands.unsetLink()

      expect(editor.isActive('link')).toBe(false)
      expect(editor.getHTML()).not.toContain('<a ')
    })
  })

  describe('image extension commands', () => {
    it('setImage inserts image', () => {
      editor.commands.setContent('<p></p>')
      editor.commands.setImage({ src: 'https://example.com/image.jpg', alt: 'Test image' })

      expect(editor.getHTML()).toContain('<img')
      expect(editor.getHTML()).toContain('src="https://example.com/image.jpg"')
    })
  })

  describe('history commands', () => {
    it('undo reverts last change', () => {
      editor.commands.setContent('<p>Original</p>')
      editor.commands.selectAll()
      editor.commands.toggleBold()

      expect(editor.getHTML()).toContain('<strong>')

      editor.commands.undo()

      expect(editor.getHTML()).not.toContain('<strong>')
    })

    it('redo reapplies undone change', () => {
      editor.commands.setContent('<p>Original</p>')
      editor.commands.selectAll()
      editor.commands.toggleBold()
      editor.commands.undo()
      editor.commands.redo()

      expect(editor.getHTML()).toContain('<strong>')
    })

    it('can().undo() returns correct state', () => {
      editor.commands.setContent('<p>Original</p>')

      // After making a change, should be able to undo
      editor.commands.selectAll()
      editor.commands.toggleBold()

      expect(editor.can().undo()).toBe(true)
    })
  })

  describe('content commands', () => {
    it('setContent replaces editor content', () => {
      editor.commands.setContent('<p>New content</p>')

      expect(editor.getHTML()).toContain('New content')
    })

    it('clearContent empties editor', () => {
      editor.commands.setContent('<p>Content</p>')
      editor.commands.clearContent()

      // TipTap always maintains at least an empty paragraph
      expect(editor.getText().trim()).toBe('')
    })

    it('insertContent adds content at cursor', () => {
      editor.commands.setContent('<p>Hello</p>')
      editor.commands.focus('end')
      editor.commands.insertContent(' World')

      expect(editor.getText()).toContain('Hello World')
    })
  })

  describe('editor state', () => {
    it('isEmpty returns true for empty editor', () => {
      editor.commands.clearContent()

      expect(editor.isEmpty).toBe(true)
    })

    it('isEmpty returns false for editor with content', () => {
      editor.commands.setContent('<p>Content</p>')

      expect(editor.isEmpty).toBe(false)
    })

    it('getHTML returns HTML string', () => {
      editor.commands.setContent('<p>Test</p>')

      expect(typeof editor.getHTML()).toBe('string')
      expect(editor.getHTML()).toContain('<p>')
    })

    it('getText returns plain text', () => {
      editor.commands.setContent('<p><strong>Bold</strong> text</p>')

      expect(editor.getText()).toContain('Bold text')
      expect(editor.getText()).not.toContain('<strong>')
    })

    it('getJSON returns JSON representation', () => {
      editor.commands.setContent('<p>Test</p>')
      const json = editor.getJSON()

      expect(json).toHaveProperty('type', 'doc')
      expect(json).toHaveProperty('content')
    })
  })
})
