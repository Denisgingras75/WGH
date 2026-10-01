import { describe, it, expect, vi } from 'vitest'
import { sanitizeSearchQuery, extractSafeFilename, isValidUUID } from './sanitize'

// Mock logger to prevent console output during tests
vi.mock('./logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

describe('sanitizeSearchQuery', () => {
  describe('basic sanitization', () => {
    it('should return empty string for null input', () => {
      expect(sanitizeSearchQuery(null)).toBe('')
    })

    it('should return empty string for undefined input', () => {
      expect(sanitizeSearchQuery(undefined)).toBe('')
    })

    it('should return empty string for non-string input', () => {
      expect(sanitizeSearchQuery(123)).toBe('')
      expect(sanitizeSearchQuery({})).toBe('')
      expect(sanitizeSearchQuery([])).toBe('')
    })

    it('should return empty string for empty string input', () => {
      expect(sanitizeSearchQuery('')).toBe('')
    })

    it('should trim whitespace from input', () => {
      expect(sanitizeSearchQuery('  pizza  ')).toBe('pizza')
      expect(sanitizeSearchQuery('\tburger\n')).toBe('burger')
    })

    it('should pass through normal text unchanged', () => {
      expect(sanitizeSearchQuery('Lobster Roll')).toBe('Lobster Roll')
      expect(sanitizeSearchQuery('tacos')).toBe('tacos')
    })
  })

  describe('SQL injection prevention', () => {
    it('should escape percent signs used in LIKE wildcards', () => {
      expect(sanitizeSearchQuery('100%')).toBe('100\\%')
      expect(sanitizeSearchQuery('%admin%')).toBe('\\%admin\\%')
    })

    it('should escape underscores used in LIKE single-char wildcards', () => {
      expect(sanitizeSearchQuery('a_b')).toBe('a\\_b')
      expect(sanitizeSearchQuery('___')).toBe('\\_\\_\\_')
    })

    it('should escape backslashes', () => {
      expect(sanitizeSearchQuery('path\\to\\file')).toBe('path\\\\to\\\\file')
    })

    it('should handle combined special characters', () => {
      expect(sanitizeSearchQuery('%_\\')).toBe('\\%\\_\\\\')
    })

    it('should handle SQL injection attempts', () => {
      // These should be safely escaped, not cause issues
      expect(sanitizeSearchQuery("'; DROP TABLE dishes;--")).toBe("'; DROP TABLE dishes;--")
      expect(sanitizeSearchQuery('%\' OR 1=1 --')).toBe("\\%' OR 1=1 --")
    })
  })

  describe('PostgREST filter injection prevention', () => {
    it('should strip dots used in PostgREST filter syntax', () => {
      expect(sanitizeSearchQuery('name.ilike.%')).toBe('nameilike\\%')
    })

    it('should strip commas used to chain PostgREST filters', () => {
      expect(sanitizeSearchQuery('pizza,category.eq.burger')).toBe('pizzacategoryeqburger')
    })

    it('should strip parentheses used in PostgREST grouping', () => {
      expect(sanitizeSearchQuery('(name.eq.test)')).toBe('nameeqtest')
    })

    it('should strip asterisks used in PostgREST wildcard', () => {
      expect(sanitizeSearchQuery('pizza*')).toBe('pizza')
    })

    it('should handle a full PostgREST injection attempt', () => {
      // Attempt to inject: name.ilike.%admin%,role.eq.admin
      const result = sanitizeSearchQuery('name.ilike.%admin%,role.eq.admin')
      expect(result).toBe('nameilike\\%admin\\%roleeqadmin')
      expect(result).not.toContain('.')
      expect(result).not.toContain(',')
    })
  })

  describe('length limiting', () => {
    it('should truncate to default max length (100)', () => {
      const longString = 'a'.repeat(150)
      const result = sanitizeSearchQuery(longString)
      expect(result.length).toBe(100)
    })

    it('should truncate to custom max length', () => {
      const longString = 'a'.repeat(100)
      const result = sanitizeSearchQuery(longString, 50)
      expect(result.length).toBe(50)
    })

    it('should not truncate strings shorter than max length', () => {
      expect(sanitizeSearchQuery('pizza', 50)).toBe('pizza')
    })

    it('should handle escape sequences that increase length', () => {
      // 10 percent signs = 10 chars, after escaping = 20 chars (\%)
      const tenPercents = '%'.repeat(10)
      const result = sanitizeSearchQuery(tenPercents, 5)
      // Should truncate BEFORE escaping, so we get 5 percent signs
      expect(result).toBe('\\%\\%\\%\\%\\%')
    })
  })
})

describe('extractSafeFilename', () => {
  describe('valid filenames', () => {
    it('should extract simple filename from URL', () => {
      const url = 'https://example.com/storage/v1/dishes/abc123.jpg'
      expect(extractSafeFilename(url, 'user-1')).toBe('abc123.jpg')
    })

    it('should extract UUID filename', () => {
      const url = 'https://example.com/path/550e8400-e29b-41d4-a716-446655440000.png'
      expect(extractSafeFilename(url, 'user-1')).toBe('550e8400-e29b-41d4-a716-446655440000.png')
    })

    it('should handle filenames with hyphens and underscores', () => {
      const url = 'https://example.com/dish-photo_v2.webp'
      expect(extractSafeFilename(url, 'user-1')).toBe('dish-photo_v2.webp')
    })

    it('should reject URL-encoded filenames (security: validates before decoding)', () => {
      // The function validates BEFORE decoding, which prevents URL encoding tricks
      const url = 'https://example.com/path/file%2Dname.jpg'
      expect(extractSafeFilename(url, 'user-1')).toBeNull()
    })

    it('should accept filenames that are already decoded', () => {
      const url = 'https://example.com/path/file-name.jpg'
      expect(extractSafeFilename(url, 'user-1')).toBe('file-name.jpg')
    })
  })

  describe('invalid inputs', () => {
    it('should return null for null URL', () => {
      expect(extractSafeFilename(null, 'user-1')).toBeNull()
    })

    it('should return null for undefined URL', () => {
      expect(extractSafeFilename(undefined, 'user-1')).toBeNull()
    })

    it('should return null for non-string URL', () => {
      expect(extractSafeFilename(123, 'user-1')).toBeNull()
    })

    it('should return null for invalid URL format', () => {
      expect(extractSafeFilename('not-a-url', 'user-1')).toBeNull()
    })

    it('should return null for URL with no filename', () => {
      expect(extractSafeFilename('https://example.com/', 'user-1')).toBeNull()
    })
  })

  describe('path traversal prevention', () => {
    it('should reject filenames with double dots', () => {
      const url = 'https://example.com/path/..%2F..%2Fetc%2Fpasswd'
      expect(extractSafeFilename(url, 'user-1')).toBeNull()
    })

    it('should reject filenames with forward slashes', () => {
      // After decoding, this becomes path/to/file which contains /
      const url = 'https://example.com/storage/path%2Fto%2Ffile.jpg'
      expect(extractSafeFilename(url, 'user-1')).toBeNull()
    })

    it('should reject filenames with backslashes', () => {
      const url = 'https://example.com/storage/path%5Cfile.jpg'
      expect(extractSafeFilename(url, 'user-1')).toBeNull()
    })

    it('should reject filenames with special characters', () => {
      const url = 'https://example.com/file<script>.jpg'
      expect(extractSafeFilename(url, 'user-1')).toBeNull()
    })

    it('should reject encoded path traversal attempts', () => {
      const url = 'https://example.com/%2e%2e%2f%2e%2e%2f'
      expect(extractSafeFilename(url, 'user-1')).toBeNull()
    })
  })
})

describe('isValidUUID', () => {
  describe('valid UUIDs', () => {
    it('should return true for valid UUID v4', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
    })

    it('should return true for UUID with all zeros', () => {
      expect(isValidUUID('00000000-0000-0000-0000-000000000000')).toBe(true)
    })

    it('should return true for UUID with all f\'s', () => {
      expect(isValidUUID('ffffffff-ffff-ffff-ffff-ffffffffffff')).toBe(true)
    })

    it('should be case insensitive', () => {
      expect(isValidUUID('550E8400-E29B-41D4-A716-446655440000')).toBe(true)
      expect(isValidUUID('550e8400-E29B-41d4-A716-446655440000')).toBe(true)
    })
  })

  describe('invalid UUIDs', () => {
    it('should return false for null', () => {
      expect(isValidUUID(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isValidUUID(undefined)).toBe(false)
    })

    it('should return false for non-string', () => {
      expect(isValidUUID(123)).toBe(false)
      expect(isValidUUID({})).toBe(false)
    })

    it('should return false for empty string', () => {
      expect(isValidUUID('')).toBe(false)
    })

    it('should return false for wrong length', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716')).toBe(false)
      expect(isValidUUID('550e8400-e29b-41d4-a716-4466554400001234')).toBe(false)
    })

    it('should return false for missing hyphens', () => {
      expect(isValidUUID('550e8400e29b41d4a716446655440000')).toBe(false)
    })

    it('should return false for hyphens in wrong positions', () => {
      expect(isValidUUID('550e84-00e29b-41d4a-716446-655440000')).toBe(false)
    })

    it('should return false for non-hex characters', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-44665544000g')).toBe(false)
      expect(isValidUUID('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx')).toBe(false)
    })

    it('should return false for SQL injection attempts', () => {
      expect(isValidUUID("'; DROP TABLE users;--")).toBe(false)
    })
  })
})
