/**
 * Generate a conventional commit message from task title
 */
export function generateCommitMessage(title: string): string {
  // Clean the task title
  const cleanTitle = title
    .replace(/^\[?\d+\.?\d*\]?\.?\s*/, '') // Remove task numbers like "1." or "[1.2]"
    .trim();

  // Determine commit type based on keywords
  let type = 'feat';
  const lowerTitle = cleanTitle.toLowerCase();
  
  if (lowerTitle.includes('fix') || lowerTitle.includes('bug')) {
    type = 'fix';
  } else if (lowerTitle.includes('refactor')) {
    type = 'refactor';
  } else if (lowerTitle.includes('test')) {
    type = 'test';
  } else if (lowerTitle.includes('doc') || lowerTitle.includes('readme')) {
    type = 'docs';
  } else if (lowerTitle.includes('style') || lowerTitle.includes('format')) {
    type = 'style';
  } else if (lowerTitle.includes('perf') || lowerTitle.includes('optim')) {
    type = 'perf';
  } else if (lowerTitle.includes('build') || lowerTitle.includes('ci') || lowerTitle.includes('deploy')) {
    type = 'ci';
  } else if (lowerTitle.includes('chore') || lowerTitle.includes('clean')) {
    type = 'chore';
  }

  // Format the title for commit message (lowercase, remove special chars)
  const formattedTitle = cleanTitle
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return `${type}: ${formattedTitle}`;
}

