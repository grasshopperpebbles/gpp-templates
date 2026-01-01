'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { graphqlClient, GET_PAGE_BY_SLUG, type PageResponse } from '@/lib/graphql'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

interface FAQItem {
  question: string
  answer: string
}

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQItem[]>([])
  const [pageTitle, setPageTitle] = useState('FAQ')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchFAQ() {
      try {
        const data = await graphqlClient.query<PageResponse>(GET_PAGE_BY_SLUG, {
          slug: 'faq'
        })

        setPageTitle(data.page.title)

        // Parse HTML content to extract FAQ items
        const parser = new DOMParser()
        const doc = parser.parseFromString(data.page.content, 'text/html')

        // Look for question/answer patterns
        // Assuming questions are in H2/H3 tags and answers are in following content
        const faqItems: FAQItem[] = []
        const headings = doc.querySelectorAll('h2, h3')

        headings.forEach((heading) => {
          const question = heading.textContent?.trim() || ''

          // Get content until next heading
          let answer = ''
          let nextElement = heading.nextElementSibling

          while (nextElement && !['H2', 'H3'].includes(nextElement.tagName)) {
            answer += nextElement.outerHTML || ''
            nextElement = nextElement.nextElementSibling
          }

          if (question && answer) {
            faqItems.push({ question, answer })
          }
        })

        // If no headings found, try to parse as simple Q&A pairs
        if (faqItems.length === 0) {
          const paragraphs = doc.querySelectorAll('p')
          let currentQuestion = ''

          paragraphs.forEach((p) => {
            const text = p.textContent?.trim() || ''
            // Check if this looks like a question (ends with ?)
            if (text.endsWith('?')) {
              currentQuestion = text
            } else if (currentQuestion && text) {
              faqItems.push({ question: currentQuestion, answer: p.outerHTML })
              currentQuestion = ''
            }
          })
        }

        setFaqs(faqItems)
      } catch (error) {
        console.error('Error fetching FAQ:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFAQ()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">{pageTitle}</span>
      </div>

      {/* Page Content */}
      <article className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-8">{pageTitle}</h1>

        {faqs.length > 0 ? (
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="prose prose-sm max-w-none">
                    {faq.answer.replace(/<[^>]*>/g, '').trim()}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <p className="text-muted-foreground">No FAQ items found.</p>
        )}
      </article>
    </div>
  )
}
