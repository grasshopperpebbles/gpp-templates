'use client'

import { useState } from 'react'
import { StarRating } from '@/components/ui/star-rating'
import { ReviewCard } from '@/components/review-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Review } from '@/lib/graphql'
import { MessageSquare, Star } from 'lucide-react'
import { ReviewForm } from '@/components/review-form'

interface ReviewsSectionProps {
  reviews: Review[]
  averageRating: number
  reviewCount: number
  productId: number // WooCommerce database ID
  productName?: string
  className?: string
}

export function ReviewsSection({
  reviews,
  averageRating,
  reviewCount,
  productId,
  productName = 'this product',
  className
}: ReviewsSectionProps) {
  const [showAll, setShowAll] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  
  // Show first 3 reviews by default
  const displayedReviews = showAll ? reviews : reviews.slice(0, 3)
  
  // Calculate rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(review => Math.floor(review.rating) === star).length,
    percentage: reviews.length > 0 
      ? (reviews.filter(review => Math.floor(review.rating) === star).length / reviews.length) * 100 
      : 0
  }))

  if (!reviews.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No reviews yet</p>
            <p className="text-sm text-muted-foreground">
              Be the first to review this product
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Reviews ({reviewCount})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Rating Summary */}
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Overall Rating */}
          <div className="text-center sm:text-left">
            <div className="text-4xl font-bold mb-1">
              {averageRating.toFixed(1)}
            </div>
            <StarRating 
              rating={averageRating} 
              size="lg" 
              className="justify-center sm:justify-start mb-1" 
            />
            <p className="text-sm text-muted-foreground">
              Based on {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
            </p>
          </div>

          {/* Rating Distribution */}
          <div className="flex-1 space-y-2">
            {ratingDistribution.map(({ star, count, percentage }) => (
              <div key={star} className="flex items-center gap-2 text-sm">
                <span className="w-6">{star}</span>
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-muted-foreground w-8">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          <h3 className="font-semibold">Customer Reviews</h3>
          {displayedReviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
          
          {reviews.length > 3 && !showAll && (
            <Button 
              variant="outline" 
              onClick={() => setShowAll(true)}
              className="w-full"
            >
              Show All {reviews.length} Reviews
            </Button>
          )}
          
          {showAll && reviews.length > 3 && (
            <Button 
              variant="outline" 
              onClick={() => setShowAll(false)}
              className="w-full"
            >
              Show Less
            </Button>
          )}
        </div>

        {/* Write Review CTA */}
        <div className="border-t pt-6">
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => setShowReviewForm(!showReviewForm)}
          >
            {showReviewForm ? 'Cancel' : 'Write a Review'}
          </Button>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Share your experience with this product
          </p>
        </div>
      </CardContent>
      
      {/* Review Form */}
      {showReviewForm && (
        <CardContent className="pt-0">
          <ReviewForm
            productId={productId}
            productName={productName}
            className="border-t pt-6"
          />
        </CardContent>
      )}
    </Card>
  )
}