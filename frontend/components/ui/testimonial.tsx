"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TestimonialProps extends React.HTMLAttributes<HTMLDivElement> {
  companyLogo?: string;
  quote: string;
  authorName: string;
  authorPosition: string;
  authorImage?: string;
  highlightedText?: string;
}

export const Testimonial = React.forwardRef<HTMLDivElement, TestimonialProps>(
  ({ 
    className, 
    companyLogo,
    quote,
    authorName,
    authorPosition,
    authorImage,
    highlightedText,
    ...props 
  }, ref) => {
    const formattedQuote = highlightedText
      ? quote.replace(
          highlightedText,
          `<strong class="font-semibold">${highlightedText}</strong>`
        )
      : quote;

    return (
      <div
        ref={ref}
        className={cn("py-16", className)}
        {...props}
      >
        <div className="max-w-screen-xl mx-auto px-4 lg:px-8">
          <div className="flex flex-col items-center">
            {companyLogo && (
              <div className="mb-7">
                <img
                  src={companyLogo}
                  alt="Company logo"
                  className="h-8 object-contain"
                />
              </div>
            )}
            <p 
              className="max-w-xl text-balance text-center text-xl sm:text-2xl text-foreground"
              dangerouslySetInnerHTML={{ __html: `"${formattedQuote}"` }}
            />
            <h5 className="mt-5 font-medium text-muted-foreground">
              {authorName}
            </h5>
            <h5 className="mt-1.5 font-medium text-foreground/40">
              {authorPosition}
            </h5>
            {authorImage && (
              <img
                src={authorImage}
                alt={authorName}
                className="mt-5 size-12 rounded-full object-cover bg-muted"
                referrerPolicy="no-referrer"
              />
            )}
          </div>
        </div>
      </div>
    );
  }
);

Testimonial.displayName = "Testimonial";