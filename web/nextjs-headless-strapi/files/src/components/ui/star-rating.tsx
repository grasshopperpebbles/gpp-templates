import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  rating: number
  maxRating?: number
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  showCount?: boolean
  count?: number
  className?: string
  readonly?: boolean
  onChange?: (rating: number) => void
}

export function StarRating({
  rating,
  maxRating = 5,
  size = 'md',
  showValue = false,
  showCount = false,
  count,
  className,
  readonly = true,
  onChange
}: StarRatingProps) {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  const handleStarClick = (starRating: number) => {
    if (!readonly && onChange) {
      onChange(starRating)
    }
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex items-center">
        {[...Array(maxRating)].map((_, index) => {
          const starRating = index + 1
          const isFilled = starRating <= rating
          const isPartial = starRating - 0.5 <= rating && rating < starRating

          return (
            <button
              key={index}
              type="button"
              disabled={readonly}
              onClick={() => handleStarClick(starRating)}
              className={cn(
                'relative',
                !readonly && 'hover:scale-110 transition-transform cursor-pointer',
                readonly && 'cursor-default'
              )}
            >
              <Star
                className={cn(
                  sizeClasses[size],
                  'transition-colors',
                  isFilled 
                    ? 'fill-yellow-400 text-yellow-400' 
                    : 'fill-transparent text-gray-300'
                )}
              />
              {isPartial && (
                <div className="absolute inset-0 overflow-hidden w-1/2">
                  <Star
                    className={cn(
                      sizeClasses[size],
                      'fill-yellow-400 text-yellow-400'
                    )}
                  />
                </div>
              )}
            </button>
          )
        })}
      </div>
      
      {showValue && (
        <span className={cn('font-medium text-gray-700', textSizes[size])}>
          {rating.toFixed(1)}
        </span>
      )}
      
      {showCount && count !== undefined && (
        <span className={cn('text-gray-500', textSizes[size])}>
          ({count} {count === 1 ? 'review' : 'reviews'})
        </span>
      )}
    </div>
  )
}