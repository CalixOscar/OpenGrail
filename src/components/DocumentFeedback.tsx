/* SPDX-License-Identifier: AGPL-3.0-or-later OR LicenseRef-OpenGrail-Commercial */
/* See LICENSE and LICENSE-COMMERCIAL.md for the applicable terms. */

import React, { useState, useEffect } from 'react';
import {
  ThumbsUp,
  ThumbsDown,
  MessageSquarePlus,
  Send,
  Github,
  Copy,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import type { GraphNode } from '../types/graph';

export interface DocumentFeedbackProps {
  node: GraphNode;
}

export function DocumentFeedback({ node }: DocumentFeedbackProps) {
  const storageKey = `opengrail_vote_${node.id}`;
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const [upCount, setUpCount] = useState(0);
  const [downCount, setDownCount] = useState(0);
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [issueType, setIssueType] = useState('Factual Error');
  const [details, setDetails] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved === 'up') {
      setUserVote('up');
      setUpCount(1);
    } else if (saved === 'down') {
      setUserVote('down');
      setDownCount(1);
    } else {
      setUserVote(null);
      setUpCount(0);
      setDownCount(0);
    }
  }, [storageKey]);

  const handleVote = (vote: 'up' | 'down') => {
    if (userVote === vote) {
      setUserVote(null);
      localStorage.removeItem(storageKey);
      if (vote === 'up') setUpCount((c) => Math.max(0, c - 1));
      if (vote === 'down') setDownCount((c) => Math.max(0, c - 1));
    } else {
      if (userVote === 'up') setUpCount((c) => Math.max(0, c - 1));
      if (userVote === 'down') setDownCount((c) => Math.max(0, c - 1));

      setUserVote(vote);
      localStorage.setItem(storageKey, vote);
      if (vote === 'up') setUpCount((c) => c + 1);
      if (vote === 'down') setDownCount((c) => c + 1);
    }
  };

  const generateReportText = () => {
    return [
      `### OpenGrail Correction Suggestion`,
      `**Tradition**: ${node.title} (\`${node.id}\`)`,
      `**Cluster**: ${node.cluster}`,
      `**Era / Origin**: ${node.eraStart} (${node.originYear})`,
      `**Location**: ${node.originGeo?.place_name || 'N/A'}`,
      `**Feedback Category**: ${issueType}`,
      `**Details**:`,
      details.trim() || 'No additional details provided.',
      sourceUrl.trim() ? `**Proposed Source URL**: ${sourceUrl.trim()}` : '',
      `\n*Submitted via OpenGrail Atlas Community Reader*`
    ].filter(Boolean).join('\n');
  };

  const handleCopy = () => {
    const text = generateReportText();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleGitHubIssue = () => {
    const title = encodeURIComponent(`[Correction] ${node.title} (${node.id}): ${issueType}`);
    const body = encodeURIComponent(generateReportText());
    const url = `https://github.com/CalixOscar/OpenGrail/issues/new?title=${title}&body=${body}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setSubmitted(true);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`OpenGrail Correction: ${node.title} (${issueType})`);
    const body = encodeURIComponent(generateReportText());
    window.location.href = `mailto:peter@calmdownoscar.com?subject=${subject}&body=${body}`;
    setSubmitted(true);
  };

  return (
    <div className="document-feedback">
      <div className="document-feedback__bar">
        <div className="document-feedback__vote-group">
          <span className="document-feedback__label">Accurate?</span>
          <button
            type="button"
            className={`document-feedback__vote-btn${userVote === 'up' ? ' document-feedback__vote-btn--active-up' : ''}`}
            onClick={() => handleVote('up')}
            title="Mark as accurate and helpful"
            aria-label="Upvote tradition information"
          >
            <ThumbsUp size={13} />
            {upCount > 0 && <span>{upCount}</span>}
          </button>
          <button
            type="button"
            className={`document-feedback__vote-btn${userVote === 'down' ? ' document-feedback__vote-btn--active-down' : ''}`}
            onClick={() => handleVote('down')}
            title="Flag inaccuracies or missing information"
            aria-label="Downvote tradition information"
          >
            <ThumbsDown size={13} />
            {downCount > 0 && <span>{downCount}</span>}
          </button>

          <button
            type="button"
            className="document-feedback__suggest-btn"
            onClick={() => {
              setShowSuggestModal((v) => !v);
              setSubmitted(false);
            }}
            title="Suggest an edit, add missing texts or report errors"
          >
            <MessageSquarePlus size={13} />
            <span>Suggest Edit</span>
          </button>
        </div>
      </div>

      {showSuggestModal && (
        <div className="document-feedback__form-box">
          <div className="document-feedback__form-header">
            <div className="document-feedback__form-title">
              <AlertCircle size={15} className="text-amber-400" />
              <h4>Propose Correction for <em>{node.title}</em></h4>
            </div>
            <button
              type="button"
              className="document-feedback__close-btn"
              onClick={() => setShowSuggestModal(false)}
              aria-label="Close suggestion form"
            >
              <X size={14} />
            </button>
          </div>

          {submitted ? (
            <div className="document-feedback__success">
              <Check size={20} className="text-emerald-400" />
              <p>Thank you for contributing! Your suggestion helps keep OpenGrail grounded and accurate.</p>
              <button
                type="button"
                className="document-feedback__reset-btn"
                onClick={() => {
                  setSubmitted(false);
                  setShowSuggestModal(false);
                  setDetails('');
                  setSourceUrl('');
                }}
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleEmailSubmit} className="document-feedback__form">
              <div className="document-feedback__field">
                <label htmlFor="issue-category">Issue Category</label>
                <select
                  id="issue-category"
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                >
                  <option value="Factual Error">Factual Error in Text</option>
                  <option value="Missing Lore / Deity">Missing Lore, Deity or Mythology</option>
                  <option value="Incorrect Image / Artifact">Incorrect Image or Misattributed Artifact</option>
                  <option value="Chronology / Geographic Date">Chronology, Date or Map Coordinate</option>
                  <option value="Missing Primary Text">Missing Canonical Primary Source</option>
                  <option value="Scholarly Source Recommendation">Scholarly Source Recommendation</option>
                </select>
              </div>

              <div className="document-feedback__field">
                <label htmlFor="issue-details">Details / Suggested Text</label>
                <textarea
                  id="issue-details"
                  rows={3}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Describe the discrepancy, missing lore, or correction..."
                  required
                />
              </div>

              <div className="document-feedback__field">
                <label htmlFor="issue-source">Scholarly Source / Verification URL (Optional)</label>
                <input
                  id="issue-source"
                  type="url"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://en.wikipedia.org/wiki/... or academic paper"
                />
              </div>

              <div className="document-feedback__actions">
                <button
                  type="button"
                  className="document-feedback__action-btn document-feedback__action-btn--github"
                  onClick={handleGitHubIssue}
                  title="Open a pre-filled GitHub Issue for review"
                >
                  <Github size={14} />
                  <span>Submit via GitHub</span>
                </button>

                <button
                  type="button"
                  className="document-feedback__action-btn document-feedback__action-btn--copy"
                  onClick={handleCopy}
                  title="Copy formatted markdown to clipboard"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? 'Copied!' : 'Copy Formatted'}</span>
                </button>

                <button
                  type="submit"
                  className="document-feedback__action-btn document-feedback__action-btn--submit"
                  title="Send via Email"
                >
                  <Send size={14} />
                  <span>Email</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
