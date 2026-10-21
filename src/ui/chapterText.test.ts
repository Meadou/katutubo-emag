import { describe, expect, it } from 'vitest'
import { blocks, sentenceWith, splitLede, sentences } from './chapterText'

describe('splitLede', () => {
  it('takes the first sentence as the lede and keeps every other word', () => {
    const { lede, rest } = splitLede('<p>The T\'boli live around <strong>Lake Sebu</strong> in Mindanao. They weave.</p>\n<p>More.</p>')
    expect(lede).toBe('The T\'boli live around <strong>Lake Sebu</strong> in Mindanao.')
    expect(rest).toBe('<p>They weave.</p>\n<p>More.</p>')
  })
  it('keeps a one-sentence paragraph whole', () => {
    expect(splitLede('<p>Only one.</p><p>Next.</p>')).toEqual({ lede: 'Only one.', rest: '<p>Next.</p>' })
  })
})

describe('sentenceWith', () => {
  it('finds the sentence naming a term', () => {
    const html = '<p>The <strong>mumbaki</strong> are ritual specialists. The <strong>bulul</strong> are carved figures.</p>'
    expect(sentenceWith(html, 'bulul')).toBe('The bulul are carved figures.')
    expect(sentenceWith(html, 'absent')).toBeNull()
  })
})

describe('sentences', () => {
  it('splits a chapter into its plain-text sentences, in order, without tags', () => {
    expect(sentences('<p>Many honor a <strong>supreme being</strong>. Rituals mark planting!</p><p>Respect the forest?</p>'))
      .toEqual(['Many honor a supreme being.', 'Rituals mark planting!', 'Respect the forest?'])
  })
})

describe('sentences and entities', () => {
  it('decodes the entities the Markdown renderer writes', () => {
    expect(sentences('<p>Traditional T&#39;boli belief &amp; &quot;custom&quot; &lt;here&gt;.</p>'))
      .toEqual(['Traditional T\'boli belief & "custom" <here>.'])
  })
})

describe('blocks', () => {
  it('splits a chapter body into its paragraphs, quotes and lists, in order and whole', () => {
    const html = '<p>One <strong>two</strong>.</p>\n<blockquote>\n<p>A quote.</p>\n</blockquote>\n<ul>\n<li>a</li>\n<li>b</li>\n</ul>\n<p>Last.</p>\n'
    expect(blocks(html)).toEqual(['<p>One <strong>two</strong>.</p>', '<blockquote>\n<p>A quote.</p>\n</blockquote>', '<ul>\n<li>a</li>\n<li>b</li>\n</ul>', '<p>Last.</p>'])
  })
  it('has nothing to split in an empty body', () => {
    expect(blocks('')).toEqual([])
    expect(blocks('  \n ')).toEqual([])
  })
})
