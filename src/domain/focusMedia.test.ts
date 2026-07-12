import { describe, expect, it } from 'vitest';
import { parseFocusMediaUrl } from './focusMedia';

describe('parseFocusMediaUrl', () => {
  it('normalizes supported YouTube URLs to privacy-enhanced embeds', () => {
    expect(parseFocusMediaUrl('https://youtu.be/4e839orj52w')).toEqual({
      kind: 'youtube',
      sourceUrl: 'https://youtu.be/4e839orj52w',
      videoId: '4e839orj52w',
      embedUrl: 'https://www.youtube-nocookie.com/embed/4e839orj52w?rel=0'
    });
    expect(parseFocusMediaUrl('https://www.youtube.com/watch?v=4e839orj52w').kind).toBe('youtube');
  });

  it('accepts direct audio URLs and rejects unsafe or unsupported sources', () => {
    expect(parseFocusMediaUrl('https://media.example/focus.mp3?download=1')).toEqual({
      kind: 'audio',
      sourceUrl: 'https://media.example/focus.mp3?download=1'
    });
    expect(parseFocusMediaUrl('javascript:alert(1)')).toEqual({
      kind: 'unsupported',
      sourceUrl: 'javascript:alert(1)'
    });
    expect(parseFocusMediaUrl('https://example.com/page')).toEqual({
      kind: 'unsupported',
      sourceUrl: 'https://example.com/page'
    });
  });
});
