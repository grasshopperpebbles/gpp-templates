'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { StarRating } from '@/components/ui/star-rating'
import { MessageSquare, Star } from 'lucide-react'

interface ReviewFormProps {
  productId: number // WooCommerce database ID
  productName: string
  onSubmit?: (review: ReviewSubmission) => Promise<void>
  className?: string
}

interface ReviewSubmission {
  rating: number
  title: string
  content: string
  authorName: string
  authorEmail: string
}

export function ReviewForm({ productId, productName, onSubmit, className }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [authorEmail, setAuthorEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (rating === 0) {
      alert('Please select a rating')
      return
    }
    
    if (!content.trim()) {
      alert('Please write a review')
      return
    }

    setIsSubmitting(true)

    try {
      const reviewData: ReviewSubmission = {
        rating,
        title,
        content,
        authorName,
        authorEmail
      }

      if (onSubmit) {
        await onSubmit(reviewData)
      } else {
        // Submit to WooCommerce via API route
        const response = await fetch('/api/reviews/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productId,
            rating,
            title,
            content,
            authorName,
            authorEmail,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to submit review')
        }
      }

      setIsSubmitted(true)
    } catch (error) {
      console.error('Error submitting review:', error)
      alert('Failed to submit review. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <div className="mb-4">
            <MessageSquare className="h-12 w-12 text-green-600 mx-auto" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Thank you for your review!</h3>
          <p className="text-muted-foreground">
            Your review has been submitted and is awaiting approval.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          Write a Review for {productName}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Share your experience with this product
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rating */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Overall Rating *
            </Label>
            <StarRating
              rating={rating}
              readonly={false}
              onChange={setRating}
              size="lg"
              className="mb-2"
            />
            <p className="text-xs text-muted-foreground">
              Click the stars to rate this product
            </p>
          </div>

          {/* Review Title */}
          <div>
            <Label htmlFor="review-title" className="text-sm font-medium">
              Review Title (Optional)
            </Label>
            <Input
              id="review-title"
              type="text"
              placeholder="Summarize your review..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Review Content */}
          <div>
            <Label htmlFor="review-content" className="text-sm font-medium">
              Your Review *
            </Label>
            <Textarea
              id="review-content"
              placeholder="Tell us what you think about this product..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              required
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {content.length}/1000 characters
            </p>
          </div>

          {/* Author Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="author-name" className="text-sm font-medium">
                Your Name *
              </Label>
              <Input
                id="author-name"
                type="text"
                placeholder="Your name"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="author-email" className="text-sm font-medium">
                Email Address *
              </Label>
              <Input
                id="author-email"
                type="email"
                placeholder="your@email.com"
                value={authorEmail}
                onChange={(e) => setAuthorEmail(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Your email won&apos;t be published
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              type="submit"
              disabled={isSubmitting || rating === 0}
              className="w-full"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-muted-foreground text-center">
            By submitting this review, you agree that it contains your honest opinion 
            and that you have used or experienced this product.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}