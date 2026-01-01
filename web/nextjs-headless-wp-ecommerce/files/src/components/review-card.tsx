import { StarRating } from '@/components/ui/star-rating'
import { Card, CardContent } from '@/components/ui/card'
import { Review } from '@/lib/graphql'

interface ReviewCardProps {
  review: Review
  className?: string
}

export function ReviewCard({ review, className }: ReviewCardProps) {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  // Remove HTML tags from content for display
  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, '')
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <StarRating rating={review.rating} size="sm" />
            <span className="font-medium text-sm">
              {review.author.node.name}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {formatDate(review.date)}
          </span>
        </div>
        
        <p className="text-sm text-gray-700 leading-relaxed">
          {stripHtml(review.content)}
        </p>
      </CardContent>
    </Card>
  )
}