import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { registerSchema, loginSchema } from '../../src/validators/authValidator.js';
import { createMeetingSchema, listMeetingsQuerySchema } from '../../src/validators/meetingValidator.js';

describe('validators', () => {
  describe('authValidator', () => {
    it('should validate correct registration payload', () => {
      const payload = {
        name: 'Soham',
        email: 'soham@example.com',
        password: 'Password123'
      };
      const parsed = registerSchema.parse(payload);
      assert.equal(parsed.name, 'Soham');
      assert.equal(parsed.email, 'soham@example.com');
    });

    it('should reject invalid email in registration', () => {
      assert.throws(() => {
        registerSchema.parse({
          name: 'Soham',
          email: 'not-an-email',
          password: 'Password123'
        });
      });
    });

    it('should reject short password in registration', () => {
      assert.throws(() => {
        registerSchema.parse({
          name: 'Soham',
          email: 'soham@example.com',
          password: '123'
        });
      });
    });

    it('should validate correct login payload', () => {
      const payload = {
        email: 'soham@example.com',
        password: 'Password123'
      };
      const parsed = loginSchema.parse(payload);
      assert.equal(parsed.email, 'soham@example.com');
    });
  });

  describe('meetingValidator', () => {
    it('should validate valid meeting creation', () => {
      const payload = {
        title: 'Sprint Planning',
        notes: 'Rahul will build the API by Friday.'
      };
      const parsed = createMeetingSchema.parse(payload);
      assert.equal(parsed.title, 'Sprint Planning');
      assert.equal(parsed.notes, 'Rahul will build the API by Friday.');
    });

    it('should reject empty meeting title or notes', () => {
      assert.throws(() => {
        createMeetingSchema.parse({
          title: '',
          notes: 'Some notes'
        });
      });

      assert.throws(() => {
        createMeetingSchema.parse({
          title: 'Title',
          notes: ''
        });
      });
    });

    it('should apply defaults for list meetings query', () => {
      const parsed = listMeetingsQuerySchema.parse({});
      assert.equal(parsed.page, 1);
      assert.equal(parsed.limit, 20);
      assert.equal(parsed.sortBy, 'meeting_date');
      assert.equal(parsed.order, 'desc');
    });
  });
});
