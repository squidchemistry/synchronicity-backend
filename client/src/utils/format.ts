/**
 * Format a number as currency
 */
export const formatCurrency = (value: number, currency = 'USD', minimumFractionDigits = 2): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits: minimumFractionDigits,
  }).format(value);
};

/**
 * Format a number with appropriate suffixes (K, M, B, T)
 */
export const formatNumber = (value: number, decimals = 2): string => {
  if (value === 0) return '0';

  const k = 1000;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['', 'K', 'M', 'B', 'T'];

  const i = Math.floor(Math.log(Math.abs(value)) / Math.log(k));

  if (i === 0) {
    return value.toFixed(dm);
  }

  return parseFloat((value / Math.pow(k, i)).toFixed(dm)) + sizes[i];
};

/**
 * Format a percentage value
 */
export const formatPercentage = (value: number, decimals = 2): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
};

/**
 * Format a large number as a readable string
 */
export const formatLargeNumber = (value: number): string => {
  if (value >= 1e12) {
    return (value / 1e12).toFixed(2) + 'T';
  }
  if (value >= 1e9) {
    return (value / 1e9).toFixed(2) + 'B';
  }
  if (value >= 1e6) {
    return (value / 1e6).toFixed(2) + 'M';
  }
  if (value >= 1e3) {
    return (value / 1e3).toFixed(2) + 'K';
  }
  return value.toFixed(2);
};

/**
 * Format a date string
 */
export const formatDate = (date: string | Date, options?: Intl.DateTimeFormatOptions): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };

  return dateObj.toLocaleDateString('en-US', options || defaultOptions);
};

/**
 * Format a relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays}d ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}mo ago`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears}y ago`;
};

/**
 * Get price change color class
 */
export const getPriceChangeColor = (change: number): string => {
  if (change > 0) return 'text-success-400';
  if (change < 0) return 'text-danger-400';
  return 'text-gray-400';
};

/**
 * Get price change background color class
 */
export const getPriceChangeBgColor = (change: number): string => {
  if (change > 0) return 'bg-success-500/10 text-success-400';
  if (change < 0) return 'bg-danger-500/10 text-danger-400';
  return 'bg-gray-500/10 text-gray-400';
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Format crypto amount with appropriate decimal places
 */
export const formatCryptoAmount = (amount: number, decimals?: number): string => {
  if (amount === 0) return '0';
  
  // Determine decimal places based on the amount
  let decimalPlaces = decimals;
  if (decimalPlaces === undefined) {
    if (amount >= 1) {
      decimalPlaces = 4;
    } else if (amount >= 0.01) {
      decimalPlaces = 6;
    } else {
      decimalPlaces = 8;
    }
  }
  
  return amount.toFixed(decimalPlaces).replace(/\.?0+$/, '');
};

/**
 * Format market cap rank
 */
export const formatMarketCapRank = (rank: number): string => {
  return `#${rank}`;
};

/**
 * Generate avatar initials from username
 */
export const generateAvatarInitials = (username: string): string => {
  return username
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

/**
 * Generate a random color for avatars
 */
export const generateAvatarColor = (seed: string): string => {
  const colors = [
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-orange-500',
  ];
  
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};