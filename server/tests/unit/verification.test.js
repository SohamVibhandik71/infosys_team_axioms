import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { verifyExtraction } from '../../src/services/verificationService.js';

describe('verificationService', () => {
  it('should verify supported actions and attach character offsets', async () => {
    const rawNotes = 'Rahul will complete the API documentation by Friday.';
    const mockExtraction = {
      summary: 'Rahul is assigned the API documentation.',
      actions: [
        {
          task: 'Complete API documentation',
          owner: 'Rahul',
          deadline: 'Friday',
          priority: 'high',
          confidence: 0.95,
          is_ambiguous: false,
          is_unassigned: false,
          evidence: {
            source_text: 'Rahul will complete the API documentation by Friday.'
          }
        }
      ],
      decisions: [],
      questions: [],
      dependencies: []
    };

    const { verifiedExtraction, verificationResult } = await verifyExtraction(mockExtraction, rawNotes);

    assert.equal(verificationResult.verification_status, 'verified');
    assert.equal(verifiedExtraction.actions[0].verified, true);
    assert.equal(verifiedExtraction.actions[0].owner, 'Rahul');
    assert.equal(verifiedExtraction.actions[0].evidence.start_position, 0);
  });

  it('should flag hallucinated owner and set is_unassigned = true', async () => {
    const rawNotes = 'Someone should deploy the application.';
    const mockExtraction = {
      summary: 'Deployment discussion.',
      actions: [
        {
          task: 'Deploy application',
          owner: 'John Doe', // Hallucinated owner not present anywhere in notes
          deadline: null,
          priority: 'medium',
          confidence: 0.85,
          is_ambiguous: false,
          is_unassigned: false,
          evidence: {
            source_text: 'Someone should deploy the application.'
          }
        }
      ],
      decisions: [],
      questions: [],
      dependencies: []
    };

    const { verifiedExtraction, verificationResult } = await verifyExtraction(mockExtraction, rawNotes);

    assert.equal(verifiedExtraction.actions[0].owner, null);
    assert.equal(verifiedExtraction.actions[0].is_unassigned, true);
    assert.equal(verificationResult.unsupported_items.length, 1);
    assert.equal(verificationResult.unsupported_items[0].entity_type, 'action_owner');
  });

  it('should detect conflicting owners for the same task', async () => {
    const rawNotes = 'Rahul will complete the API. Later, Priya will complete the API.';
    const mockExtraction = {
      summary: 'Conflicting assignments for API.',
      actions: [
        {
          task: 'Complete the API',
          owner: 'Rahul',
          deadline: 'Friday',
          priority: 'high',
          confidence: 0.9,
          evidence: { source_text: 'Rahul will complete the API.' }
        },
        {
          task: 'Complete the API',
          owner: 'Priya',
          deadline: 'Monday',
          priority: 'high',
          confidence: 0.9,
          evidence: { source_text: 'Priya will complete the API.' }
        }
      ],
      decisions: [],
      questions: [],
      dependencies: []
    };

    const { verificationResult } = await verifyExtraction(mockExtraction, rawNotes);

    assert.ok(verificationResult.conflicts.length > 0);
    assert.equal(verificationResult.conflicts[0].type, 'OWNER_CONFLICT');
  });

  it('should verify evidence spanning multiple lines or wrapped text from PDFs', async () => {
    const rawNotes = 'Alex agreed to handle the database\nmigration scripts and index optimization by Friday Oct 24th.';
    const mockExtraction = {
      summary: 'Database migration sync.',
      actions: [
        {
          task: 'Handle database migration scripts',
          owner: 'Alex',
          deadline: '2026-10-24',
          priority: 'high',
          confidence: 0.96,
          evidence: {
            source_text: 'Alex agreed to handle the database migration scripts and index optimization by Friday Oct 24th.'
          }
        }
      ],
      decisions: [],
      questions: [],
      dependencies: []
    };

    const { verifiedExtraction, verificationResult } = await verifyExtraction(mockExtraction, rawNotes);

    assert.equal(verificationResult.verification_status, 'verified');
    assert.equal(verifiedExtraction.actions[0].verified, true);
    assert.equal(verifiedExtraction.actions[0].evidence.start_position, 0);
    assert.equal(verifiedExtraction.actions[0].evidence.end_position, rawNotes.length);
  });
});
