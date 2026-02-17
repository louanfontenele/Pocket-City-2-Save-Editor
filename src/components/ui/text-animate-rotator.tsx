"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { TextAnimate } from "@/components/ui/text-animate"

type TextAnimateRotatorProps = {
  words: string[]
  interval?: number
  className?: string
  animation?:
    | "fadeIn"
    | "blurIn"
    | "blurInUp"
    | "blurInDown"
    | "slideUp"
    | "slideDown"
    | "slideLeft"
    | "slideRight"
    | "scaleUp"
    | "scaleDown"
}

export function TextAnimateRotator({
  words,
  interval = 1400,
  className,
  animation = "slideUp",
}: TextAnimateRotatorProps) {
  const [index, setIndex] = React.useState(0)

  React.useEffect(() => {
    if (!words?.length) return
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % words.length)
    }, interval)
    return () => clearInterval(id)
  }, [words, interval])

  const word = words?.[index] ?? ""

  return (
    <TextAnimate
      key={`${index}-${word}`}
      by="text"
      animation={animation}
      duration={0.5}
      className={cn("inline-block", className)}
      startOnView={false}
      accessible={false}
    >
      {word}
    </TextAnimate>
  )
}

