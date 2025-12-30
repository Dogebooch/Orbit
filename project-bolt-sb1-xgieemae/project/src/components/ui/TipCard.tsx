import React, { useState } from 'react';
import { Lightbulb, AlertTriangle, Info, CheckCircle, X, ExternalLink, Sparkles } from 'lucide-react';

export type TipVariant = 'info' | 'warning' | 'success' | 'pro-tip';

interface TipCardProps {
  title: string;
  content: string;
  variant?: TipVariant;
  dismissible?: boolean;
  learnMoreUrl?: string;
  className?: string;
  onDismiss?: () => void;
}

const variantStyles: Record<TipVariant, {
  container: string;
  icon: React.ElementType;
  iconColor: string;
  titleColor: string;
  contentColor: string;
}> = {
  info: {
    container: 'bg-blue-900/20 border-blue-500/30',
    icon: Info,
    iconColor: 'text-blue-400',
    titleColor: 'text-blue-300',
    contentColor: 'text-blue-200',
  },
  warning: {
    container: 'bg-yellow-900/20 border-yellow-500/30',
    icon: AlertTriangle,
    iconColor: 'text-yellow-400',
    titleColor: 'text-yellow-300',
    contentColor: 'text-yellow-200',
  },
  success: {
    container: 'bg-green-900/20 border-green-500/30',
    icon: CheckCircle,
    iconColor: 'text-green-400',
    titleColor: 'text-green-300',
    contentColor: 'text-green-200',
  },
  'pro-tip': {
    container: 'bg-purple-900/20 border-purple-500/30',
    icon: Sparkles,
    iconColor: 'text-purple-400',
    titleColor: 'text-purple-300',
    contentColor: 'text-purple-200',
  },
};

export function TipCard({
  title,
  content,
  variant = 'info',
  dismissible = false,
  learnMoreUrl,
  className = '',
  onDismiss,
}: TipCardProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const styles = variantStyles[variant];
  const IconComponent = styles.icon;

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  return (
    <div
      className={`p-4 border rounded-lg animate-fade-in ${styles.container} ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <IconComponent className={`w-5 h-5 flex-shrink-0 mt-0.5 ${styles.iconColor}`} />
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-semibold ${styles.titleColor} mb-1`}>
            {title}
          </h4>
          <p className={`text-sm ${styles.contentColor}`}>
            {content}
          </p>
          {learnMoreUrl && (
            <a
              href={learnMoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1 text-sm mt-2 ${styles.iconColor} hover:underline`}
            >
              Learn more
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
        {dismissible && (
          <button
            onClick={handleDismiss}
            className={`flex-shrink-0 p-1 rounded hover:bg-white/10 transition-colors ${styles.iconColor}`}
            aria-label="Dismiss tip"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// Convenience components for common tip types
export function InfoTip(props: Omit<TipCardProps, 'variant'>) {
  return <TipCard {...props} variant="info" />;
}

export function WarningTip(props: Omit<TipCardProps, 'variant'>) {
  return <TipCard {...props} variant="warning" />;
}

export function SuccessTip(props: Omit<TipCardProps, 'variant'>) {
  return <TipCard {...props} variant="success" />;
}

export function ProTip(props: Omit<TipCardProps, 'variant'>) {
  return <TipCard {...props} variant="pro-tip" />;
}

