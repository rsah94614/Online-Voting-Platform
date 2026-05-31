'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function ScrollObserver() {
  const pathname = usePathname()

  useEffect(() => {
    let observer: IntersectionObserver | null = null;
    
    // Small delay to ensure DOM elements are fully rendered after a route change
    const timeoutId = setTimeout(() => {
      const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }

      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            // Once visible, we can stop observing this element
            observer?.unobserve(entry.target)
          }
        })
      }, observerOptions)

      // Select all elements that should animate on scroll
      const animateElements = document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right')
      animateElements.forEach((el) => observer?.observe(el))
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      if (observer) observer.disconnect()
    }
  }, [pathname])

  return null
}
