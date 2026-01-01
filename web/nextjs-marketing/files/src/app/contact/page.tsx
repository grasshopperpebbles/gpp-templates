import type { Metadata } from "next";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with us",
};

export default function ContactPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Contact Us</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <h2 className="text-xl font-medium mb-4">Get in Touch</h2>
          <p className="text-zinc-600 mb-4">
            We'd love to hear from you. Send us a message and we'll respond as soon
            as possible.
          </p>
          
          <form className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-zinc-700 mb-1">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-zinc-700 mb-1">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={5}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2"
            >
              Send Message
            </button>
          </form>
          
          <p className="text-xs text-zinc-500 mt-4">
            Note: This is a basic contact form. You'll need to implement the form
            submission handler (e.g., API route, email service) based on your needs.
          </p>
        </Card>
        
        <div className="space-y-6">
          <Card>
            <h2 className="text-xl font-medium mb-4">Other Ways to Reach Us</h2>
            <div className="space-y-3 text-sm text-zinc-600">
              <div>
                <p className="font-medium text-zinc-900">Email</p>
                <p>contact@example.com</p>
              </div>
              <div>
                <p className="font-medium text-zinc-900">Phone</p>
                <p>+1 (555) 123-4567</p>
              </div>
              <div>
                <p className="font-medium text-zinc-900">Address</p>
                <p>
                  123 Main Street<br />
                  City, State 12345<br />
                  United States
                </p>
              </div>
            </div>
          </Card>
          
          <Card>
            <h2 className="text-xl font-medium mb-4">Business Hours</h2>
            <div className="space-y-2 text-sm text-zinc-600">
              <div className="flex justify-between">
                <span>Monday - Friday</span>
                <span>9:00 AM - 5:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span>Saturday</span>
                <span>10:00 AM - 2:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span>Sunday</span>
                <span>Closed</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
