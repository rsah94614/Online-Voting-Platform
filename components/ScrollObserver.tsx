'use client'

import { useEffect } from 'react'

export default function ScrollObserver() {
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
          // Once visible, we can stop observing this element
          observer.unobserve(entry.target)
        }
      })
    }, observerOptions)

    // Select all elements that should animate on scroll
    const animateElements = document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right')
    animateElements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  return null
}
