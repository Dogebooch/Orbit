import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import { Card, Button, StageTips } from '../ui';
import {
  RefreshCw,
  Plus,
  Calendar,
  MessageSquare,
  ThumbsUp,
  AlertTriangle,
  Lightbulb,
  ChevronDown,
  ChevronRight,
  Trash2,
  Edit2,
  Check,
  X,
  BarChart3,
  TrendingUp,
  Users,
  ClipboardList,
} from 'lucide-react';

interface MaintenanceReview {
  id: string;
  project_id: string;
  review_date: string;
  week_start_date: string;
  week_end_date: string;
  user_feedback_summary: {
    positive_themes: string[];
    pain_points: string[];
    feature_requests: string[];
  };
  technical_health: {
    error_rates: string;
    spikes_patterns: string;
    performance_notes: string;
  };
  notes: string;
  created_at: string;
  updated_at: string;
}

interface UserFeedback {
  id: string;
  project_id: string;
  feedback_type: 'positive' | 'pain_point' | 'feature_request';
  content: string;
  source: string;
  priority: number;
  status: 'new' | 'reviewed' | 'addressed';
  created_at: string;
  updated_at: string;
}

type FeedbackFilter = 'all' | 'positive' | 'pain_point' | 'feature_request';
type StatusFilter = 'all' | 'new' | 'reviewed' | 'addressed';

const FEEDBACK_GUIDANCE = [
  {
    title: 'In-App Feedback',
    description: 'Add a feedback button or form within your app',
    tips: [
      'Keep it simple - 1-2 questions max',
      'Ask "What\'s the one thing we could improve?"',
      'Trigger after successful task completion',
    ],
  },
  {
    title: 'User Interviews',
    description: 'Schedule 15-30 minute calls with active users',
    tips: [
      'Ask open-ended questions',
      'Listen more than you talk (80/20 rule)',
      'Record with permission for later review',
    ],
  },
  {
    title: 'Support Channel Analysis',
    description: 'Review support tickets, emails, and chat logs',
    tips: [
      'Look for recurring themes',
      'Categorize by feature area',
      'Note emotional intensity',
    ],
  },
  {
    title: 'Analytics Review',
    description: 'Analyze user behavior data',
    tips: [
      'Identify drop-off points',
      'Track feature adoption rates',
      'Monitor error rates by feature',
    ],
  },
];

export function MaintenanceStage() {
  const { currentProject } = useApp();
  const [reviews, setReviews] = useState<MaintenanceReview[]>([]);
  const [feedback, setFeedback] = useState<UserFeedback[]>([]);
  const [expandedReview, setExpandedReview] = useState<string | null>(null);
  const [feedbackFilter, setFeedbackFilter] = useState<FeedbackFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showNewReview, setShowNewReview] = useState(false);
  const [showNewFeedback, setShowNewFeedback] = useState(false);
  const [editingReview, setEditingReview] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // New review form state
  const [newReview, setNewReview] = useState({
    week_start_date: '',
    week_end_date: '',
    positive_themes: '',
    pain_points: '',
    feature_requests: '',
    error_rates: '',
    spikes_patterns: '',
    performance_notes: '',
    notes: '',
  });

  // New feedback form state
  const [newFeedback, setNewFeedback] = useState({
    feedback_type: 'positive' as 'positive' | 'pain_point' | 'feature_request',
    content: '',
    source: '',
    priority: 3,
  });

  // Load data from database
  useEffect(() => {
    if (currentProject) {
      loadReviews();
      loadFeedback();
    }
  }, [currentProject]);

  const loadReviews = async () => {
    if (!currentProject) return;

    const { data, error } = await supabase
      .from('maintenance_reviews')
      .select('*')
      .eq('project_id', currentProject.id)
      .order('review_date', { ascending: false });

    if (!error && data) {
      setReviews(data);
    }
  };

  const loadFeedback = async () => {
    if (!currentProject) return;

    const { data, error } = await supabase
      .from('user_feedback')
      .select('*')
      .eq('project_id', currentProject.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setFeedback(data);
    }
  };

  const createReview = async () => {
    if (!currentProject || !newReview.week_start_date || !newReview.week_end_date) return;

    const reviewData = {
      project_id: currentProject.id,
      week_start_date: newReview.week_start_date,
      week_end_date: newReview.week_end_date,
      user_feedback_summary: {
        positive_themes: newReview.positive_themes.split('\n').filter(Boolean),
        pain_points: newReview.pain_points.split('\n').filter(Boolean),
        feature_requests: newReview.feature_requests.split('\n').filter(Boolean),
      },
      technical_health: {
        error_rates: newReview.error_rates,
        spikes_patterns: newReview.spikes_patterns,
        performance_notes: newReview.performance_notes,
      },
      notes: newReview.notes,
    };

    const { error } = await supabase.from('maintenance_reviews').insert(reviewData);

    if (!error) {
      setShowNewReview(false);
      setNewReview({
        week_start_date: '',
        week_end_date: '',
        positive_themes: '',
        pain_points: '',
        feature_requests: '',
        error_rates: '',
        spikes_patterns: '',
        performance_notes: '',
        notes: '',
      });
      loadReviews();
      setLastSaved(new Date());
    }
  };

  const deleteReview = async (id: string) => {
    const { error } = await supabase.from('maintenance_reviews').delete().eq('id', id);
    if (!error) {
      loadReviews();
    }
  };

  const createFeedback = async () => {
    if (!currentProject || !newFeedback.content) return;

    const feedbackData = {
      project_id: currentProject.id,
      ...newFeedback,
    };

    const { error } = await supabase.from('user_feedback').insert(feedbackData);

    if (!error) {
      setShowNewFeedback(false);
      setNewFeedback({
        feedback_type: 'positive',
        content: '',
        source: '',
        priority: 3,
      });
      loadFeedback();
      setLastSaved(new Date());
    }
  };

  const updateFeedbackStatus = async (id: string, status: 'new' | 'reviewed' | 'addressed') => {
    const { error } = await supabase
      .from('user_feedback')
      .update({ status })
      .eq('id', id);

    if (!error) {
      loadFeedback();
      setLastSaved(new Date());
    }
  };

  const deleteFeedback = async (id: string) => {
    const { error } = await supabase.from('user_feedback').delete().eq('id', id);
    if (!error) {
      loadFeedback();
    }
  };

  const filteredFeedback = feedback.filter((f) => {
    const matchesType = feedbackFilter === 'all' || f.feedback_type === feedbackFilter;
    const matchesStatus = statusFilter === 'all' || f.status === statusFilter;
    return matchesType && matchesStatus;
  });

  const getFeedbackIcon = (type: string) => {
    switch (type) {
      case 'positive':
        return <ThumbsUp className="w-4 h-4 text-green-400" />;
      case 'pain_point':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'feature_request':
        return <Lightbulb className="w-4 h-4 text-amber-400" />;
      default:
        return <MessageSquare className="w-4 h-4 text-primary-400" />;
    }
  };

  const getFeedbackTypeLabel = (type: string) => {
    switch (type) {
      case 'positive':
        return 'Positive Feedback';
      case 'pain_point':
        return 'Pain Point';
      case 'feature_request':
        return 'Feature Request';
      default:
        return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-900/50 text-blue-300';
      case 'reviewed':
        return 'bg-amber-900/50 text-amber-300';
      case 'addressed':
        return 'bg-green-900/50 text-green-300';
      default:
        return 'bg-primary-800 text-primary-300';
    }
  };

  const hasData = reviews.length > 0 || feedback.length > 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-primary-100 flex items-center gap-3">
          <RefreshCw className="w-8 h-8 text-primary-400" />
          Maintenance & Growth
        </h1>
        <p className="text-primary-400 mt-2">
          Track user feedback, monitor technical health, and conduct weekly reviews.
        </p>
      </div>

      <StageTips stage="maintenance" isComplete={hasData} maxTips={2} />

      {/* Weekly Review Section */}
      <Card>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-primary-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-400" />
              Weekly Maintenance Reviews
            </h2>
            <p className="text-sm text-primary-400 mt-1">
              Document your weekly review process to track project health
            </p>
          </div>
          <Button onClick={() => setShowNewReview(!showNewReview)}>
            <Plus className="w-4 h-4 mr-1" />
            New Review
          </Button>
        </div>

        {/* New Review Form */}
        {showNewReview && (
          <div className="mb-6 p-4 bg-primary-800/50 rounded-lg border border-primary-700 space-y-4">
            <h3 className="font-semibold text-primary-100">Create Weekly Review</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-primary-300 mb-1">Week Start</label>
                <input
                  type="date"
                  value={newReview.week_start_date}
                  onChange={(e) => setNewReview({ ...newReview, week_start_date: e.target.value })}
                  className="w-full px-3 py-2 bg-primary-900 border border-primary-700 rounded-lg text-primary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm text-primary-300 mb-1">Week End</label>
                <input
                  type="date"
                  value={newReview.week_end_date}
                  onChange={(e) => setNewReview({ ...newReview, week_end_date: e.target.value })}
                  className="w-full px-3 py-2 bg-primary-900 border border-primary-700 rounded-lg text-primary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="border-t border-primary-700 pt-4">
              <h4 className="font-medium text-primary-200 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                User Feedback Summary
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-green-400 mb-1">
                    <ThumbsUp className="w-3 h-3 inline mr-1" />
                    Positive Themes
                  </label>
                  <textarea
                    value={newReview.positive_themes}
                    onChange={(e) => setNewReview({ ...newReview, positive_themes: e.target.value })}
                    placeholder="What's working well (one per line)"
                    rows={3}
                    className="w-full px-3 py-2 bg-primary-900 border border-primary-700 rounded-lg text-primary-100 placeholder-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-red-400 mb-1">
                    <AlertTriangle className="w-3 h-3 inline mr-1" />
                    Pain Points
                  </label>
                  <textarea
                    value={newReview.pain_points}
                    onChange={(e) => setNewReview({ ...newReview, pain_points: e.target.value })}
                    placeholder="What needs fixing (one per line)"
                    rows={3}
                    className="w-full px-3 py-2 bg-primary-900 border border-primary-700 rounded-lg text-primary-100 placeholder-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-amber-400 mb-1">
                    <Lightbulb className="w-3 h-3 inline mr-1" />
                    Feature Requests
                  </label>
                  <textarea
                    value={newReview.feature_requests}
                    onChange={(e) => setNewReview({ ...newReview, feature_requests: e.target.value })}
                    placeholder="What users want added (one per line)"
                    rows={3}
                    className="w-full px-3 py-2 bg-primary-900 border border-primary-700 rounded-lg text-primary-100 placeholder-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-primary-700 pt-4">
              <h4 className="font-medium text-primary-200 mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Technical Health
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-primary-300 mb-1">Error Rates</label>
                  <textarea
                    value={newReview.error_rates}
                    onChange={(e) => setNewReview({ ...newReview, error_rates: e.target.value })}
                    placeholder="Any spikes or patterns in errors"
                    rows={2}
                    className="w-full px-3 py-2 bg-primary-900 border border-primary-700 rounded-lg text-primary-100 placeholder-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-primary-300 mb-1">Spikes/Patterns</label>
                  <textarea
                    value={newReview.spikes_patterns}
                    onChange={(e) => setNewReview({ ...newReview, spikes_patterns: e.target.value })}
                    placeholder="Notable usage spikes or patterns"
                    rows={2}
                    className="w-full px-3 py-2 bg-primary-900 border border-primary-700 rounded-lg text-primary-100 placeholder-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-primary-300 mb-1">Performance Notes</label>
                  <textarea
                    value={newReview.performance_notes}
                    onChange={(e) => setNewReview({ ...newReview, performance_notes: e.target.value })}
                    placeholder="Performance observations"
                    rows={2}
                    className="w-full px-3 py-2 bg-primary-900 border border-primary-700 rounded-lg text-primary-100 placeholder-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm text-primary-300 mb-1">Additional Notes</label>
              <textarea
                value={newReview.notes}
                onChange={(e) => setNewReview({ ...newReview, notes: e.target.value })}
                placeholder="Any other observations or action items"
                rows={2}
                className="w-full px-3 py-2 bg-primary-900 border border-primary-700 rounded-lg text-primary-100 placeholder-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowNewReview(false)}>
                Cancel
              </Button>
              <Button onClick={createReview} disabled={!newReview.week_start_date || !newReview.week_end_date}>
                Save Review
              </Button>
            </div>
          </div>
        )}

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-primary-400">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No weekly reviews yet. Create your first review to start tracking.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-primary-800/50 rounded-lg border border-primary-700 overflow-hidden"
              >
                <button
                  onClick={() => setExpandedReview(expandedReview === review.id ? null : review.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-primary-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {expandedReview === review.id ? (
                      <ChevronDown className="w-4 h-4 text-primary-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-primary-400" />
                    )}
                    <div className="text-left">
                      <div className="font-medium text-primary-100">
                        Week of {new Date(review.week_start_date).toLocaleDateString()} -{' '}
                        {new Date(review.week_end_date).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-primary-400">
                        Reviewed on {new Date(review.review_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-primary-500">
                      {review.user_feedback_summary.positive_themes.length +
                        review.user_feedback_summary.pain_points.length +
                        review.user_feedback_summary.feature_requests.length}{' '}
                      feedback items
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteReview(review.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                </button>

                {expandedReview === review.id && (
                  <div className="p-4 border-t border-primary-700 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-3 bg-green-900/20 rounded-lg">
                        <h5 className="text-sm font-medium text-green-400 mb-2 flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3" />
                          Positive Themes
                        </h5>
                        <ul className="text-sm text-primary-300 space-y-1">
                          {review.user_feedback_summary.positive_themes.length > 0 ? (
                            review.user_feedback_summary.positive_themes.map((theme, i) => (
                              <li key={i}>• {theme}</li>
                            ))
                          ) : (
                            <li className="text-primary-500 italic">None recorded</li>
                          )}
                        </ul>
                      </div>
                      <div className="p-3 bg-red-900/20 rounded-lg">
                        <h5 className="text-sm font-medium text-red-400 mb-2 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Pain Points
                        </h5>
                        <ul className="text-sm text-primary-300 space-y-1">
                          {review.user_feedback_summary.pain_points.length > 0 ? (
                            review.user_feedback_summary.pain_points.map((point, i) => (
                              <li key={i}>• {point}</li>
                            ))
                          ) : (
                            <li className="text-primary-500 italic">None recorded</li>
                          )}
                        </ul>
                      </div>
                      <div className="p-3 bg-amber-900/20 rounded-lg">
                        <h5 className="text-sm font-medium text-amber-400 mb-2 flex items-center gap-1">
                          <Lightbulb className="w-3 h-3" />
                          Feature Requests
                        </h5>
                        <ul className="text-sm text-primary-300 space-y-1">
                          {review.user_feedback_summary.feature_requests.length > 0 ? (
                            review.user_feedback_summary.feature_requests.map((req, i) => (
                              <li key={i}>• {req}</li>
                            ))
                          ) : (
                            <li className="text-primary-500 italic">None recorded</li>
                          )}
                        </ul>
                      </div>
                    </div>

                    <div className="p-3 bg-primary-900/50 rounded-lg">
                      <h5 className="text-sm font-medium text-primary-200 mb-2 flex items-center gap-1">
                        <BarChart3 className="w-3 h-3" />
                        Technical Health
                      </h5>
                      <div className="grid grid-cols-3 gap-4 text-sm text-primary-300">
                        <div>
                          <span className="text-primary-500">Error Rates:</span>{' '}
                          {review.technical_health.error_rates || 'Not recorded'}
                        </div>
                        <div>
                          <span className="text-primary-500">Spikes/Patterns:</span>{' '}
                          {review.technical_health.spikes_patterns || 'Not recorded'}
                        </div>
                        <div>
                          <span className="text-primary-500">Performance:</span>{' '}
                          {review.technical_health.performance_notes || 'Not recorded'}
                        </div>
                      </div>
                    </div>

                    {review.notes && (
                      <div className="p-3 bg-primary-900/50 rounded-lg">
                        <h5 className="text-sm font-medium text-primary-200 mb-1">Notes</h5>
                        <p className="text-sm text-primary-300">{review.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* User Feedback Collection Section */}
      <Card>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-primary-100 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary-400" />
              User Feedback Collection
            </h2>
            <p className="text-sm text-primary-400 mt-1">
              Track and categorize feedback from your users
            </p>
          </div>
          <Button onClick={() => setShowNewFeedback(!showNewFeedback)}>
            <Plus className="w-4 h-4 mr-1" />
            Add Feedback
          </Button>
        </div>

        {/* New Feedback Form */}
        {showNewFeedback && (
          <div className="mb-6 p-4 bg-primary-800/50 rounded-lg border border-primary-700 space-y-4">
            <h3 className="font-semibold text-primary-100">Add User Feedback</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-primary-300 mb-1">Feedback Type</label>
                <select
                  value={newFeedback.feedback_type}
                  onChange={(e) =>
                    setNewFeedback({
                      ...newFeedback,
                      feedback_type: e.target.value as 'positive' | 'pain_point' | 'feature_request',
                    })
                  }
                  className="w-full px-3 py-2 bg-primary-900 border border-primary-700 rounded-lg text-primary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="positive">Positive Feedback</option>
                  <option value="pain_point">Pain Point</option>
                  <option value="feature_request">Feature Request</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-primary-300 mb-1">Priority (1-5)</label>
                <select
                  value={newFeedback.priority}
                  onChange={(e) => setNewFeedback({ ...newFeedback, priority: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-primary-900 border border-primary-700 rounded-lg text-primary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value={1}>1 - Low</option>
                  <option value={2}>2</option>
                  <option value={3}>3 - Medium</option>
                  <option value={4}>4</option>
                  <option value={5}>5 - High</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-primary-300 mb-1">Feedback Content</label>
              <textarea
                value={newFeedback.content}
                onChange={(e) => setNewFeedback({ ...newFeedback, content: e.target.value })}
                placeholder="What did the user say or report?"
                rows={3}
                className="w-full px-3 py-2 bg-primary-900 border border-primary-700 rounded-lg text-primary-100 placeholder-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm text-primary-300 mb-1">Source (optional)</label>
              <input
                type="text"
                value={newFeedback.source}
                onChange={(e) => setNewFeedback({ ...newFeedback, source: e.target.value })}
                placeholder="e.g., User interview, Support ticket, In-app feedback"
                className="w-full px-3 py-2 bg-primary-900 border border-primary-700 rounded-lg text-primary-100 placeholder-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowNewFeedback(false)}>
                Cancel
              </Button>
              <Button onClick={createFeedback} disabled={!newFeedback.content}>
                Save Feedback
              </Button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-4 mb-4">
          <div>
            <label className="block text-xs text-primary-500 mb-1">Type</label>
            <select
              value={feedbackFilter}
              onChange={(e) => setFeedbackFilter(e.target.value as FeedbackFilter)}
              className="px-3 py-1.5 bg-primary-800 border border-primary-700 rounded-lg text-sm text-primary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Types</option>
              <option value="positive">Positive</option>
              <option value="pain_point">Pain Points</option>
              <option value="feature_request">Feature Requests</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-primary-500 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="px-3 py-1.5 bg-primary-800 border border-primary-700 rounded-lg text-sm text-primary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="reviewed">Reviewed</option>
              <option value="addressed">Addressed</option>
            </select>
          </div>
        </div>

        {/* Feedback List */}
        {filteredFeedback.length === 0 ? (
          <div className="text-center py-8 text-primary-400">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No feedback collected yet. Start adding user feedback to track.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredFeedback.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3 bg-primary-800/50 rounded-lg border border-primary-700"
              >
                <div className="mt-1">{getFeedbackIcon(item.feedback_type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-primary-300">
                      {getFeedbackTypeLabel(item.feedback_type)}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                    <span className="text-xs text-primary-500">Priority: {item.priority}</span>
                  </div>
                  <p className="text-sm text-primary-100">{item.content}</p>
                  {item.source && (
                    <p className="text-xs text-primary-500 mt-1">Source: {item.source}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <select
                    value={item.status}
                    onChange={(e) =>
                      updateFeedbackStatus(item.id, e.target.value as 'new' | 'reviewed' | 'addressed')
                    }
                    className="px-2 py-1 bg-primary-900 border border-primary-700 rounded text-xs text-primary-100 focus:outline-none"
                  >
                    <option value="new">New</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="addressed">Addressed</option>
                  </select>
                  <button
                    onClick={() => deleteFeedback(item.id)}
                    className="p-1 hover:bg-primary-700 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Feedback Collection Guidance */}
      <Card>
        <h2 className="text-xl font-semibold text-primary-100 mb-4 flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-primary-400" />
          User Feedback Collection Guide
        </h2>
        <p className="text-sm text-primary-400 mb-6">
          Best practices and methods for collecting valuable user feedback
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FEEDBACK_GUIDANCE.map((method) => (
            <div key={method.title} className="p-4 bg-primary-800/50 rounded-lg border border-primary-700">
              <h3 className="font-semibold text-primary-100 mb-1">{method.title}</h3>
              <p className="text-sm text-primary-400 mb-3">{method.description}</p>
              <ul className="space-y-1">
                {method.tips.map((tip, i) => (
                  <li key={i} className="text-sm text-primary-300 flex items-start gap-2">
                    <TrendingUp className="w-3 h-3 mt-1 text-primary-500 flex-shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      {/* Weekly Review Template Reference */}
      <Card>
        <h2 className="text-xl font-semibold text-primary-100 mb-4">Weekly Review Template</h2>
        <p className="text-sm text-primary-400 mb-4">
          Copy this template for your weekly maintenance reviews
        </p>
        <pre className="text-xs bg-primary-900 p-4 rounded overflow-x-auto text-primary-300">
{`## Weekly Maintenance Review

**Week of:** [Start Date] - [End Date]
**Review Date:** [Today's Date]

## User Feedback Summary

### Positive feedback themes:
- [What's working well]
- [Features users love]

### Pain points:
- [What needs fixing]
- [User frustrations]

### Feature requests:
- [What users want added]
- [Enhancement suggestions]

## Technical Health

### Error rates:
- [Any spikes or patterns]
- [Recurring issues]

### Performance:
- [Load times]
- [Resource usage]

### Monitoring notes:
- [Alerts triggered]
- [Anomalies detected]

## Action Items

- [ ] [Priority action 1]
- [ ] [Priority action 2]
- [ ] [Priority action 3]

## Notes

[Additional observations or decisions]`}
        </pre>
        <Button
          variant="ghost"
          className="mt-4"
          onClick={() => {
            navigator.clipboard.writeText(`## Weekly Maintenance Review

**Week of:** [Start Date] - [End Date]
**Review Date:** [Today's Date]

## User Feedback Summary

### Positive feedback themes:
- [What's working well]
- [Features users love]

### Pain points:
- [What needs fixing]
- [User frustrations]

### Feature requests:
- [What users want added]
- [Enhancement suggestions]

## Technical Health

### Error rates:
- [Any spikes or patterns]
- [Recurring issues]

### Performance:
- [Load times]
- [Resource usage]

### Monitoring notes:
- [Alerts triggered]
- [Anomalies detected]

## Action Items

- [ ] [Priority action 1]
- [ ] [Priority action 2]
- [ ] [Priority action 3]

## Notes

[Additional observations or decisions]`);
          }}
        >
          Copy Template
        </Button>
      </Card>

      {lastSaved && (
        <div className="text-xs text-primary-500 text-right">
          Last saved: {lastSaved.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}

