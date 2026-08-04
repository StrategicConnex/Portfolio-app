import React from 'react'

/**
 * Shared framer-motion mock helpers for Vitest.
 *
 * The real `motion.*` components consume animation props (initial, animate,
 * whileHover, variants, ...) internally. When tests mock them as plain DOM
 * elements, spreading those props onto a <div> / <a> / ... triggers React
 * warnings like "React does not recognize the `whileHover` prop on a DOM
 * element". This helper strips animation-only props so mocks stay clean.
 */

export const MOTION_SKIP_PROPS = [
  'initial',
  'animate',
  'exit',
  'transition',
  'variants',
  'custom',
  'whileHover',
  'whileTap',
  'whileDrag',
  'whileFocus',
  'whileInView',
  'viewport',
  'layout',
  'layoutId',
  'drag',
  'dragConstraints',
  'dragElastic',
  'dragMomentum',
  'dragTransition',
  'onDrag',
  'onDragStart',
  'onDragEnd',
  'onAnimationStart',
  'onAnimationComplete',
  'onAnimationRepeat',
  'onViewportEnter',
  'onViewportLeave',
]

/** Remove framer-motion-only props, keeping valid DOM attributes. */
export function stripMotionProps<T extends Record<string, unknown>>(props: T): T {
  const rest: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(props)) {
    if (!MOTION_SKIP_PROPS.includes(key)) {
      rest[key] = value
    }
  }
  return rest as T
}

type MotionTag = 'div' | 'nav' | 'a' | 'button' | 'li' | 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'ul'

/**
 * Build a `motion` mock object with the given subset of tags.
 * Each tag renders a plain DOM element with animation props stripped.
 */
export function createMotionMock(tags: MotionTag[]): Record<string, React.ComponentType<Record<string, unknown>>> {
  const mock: Record<string, React.ComponentType<Record<string, unknown>>> = {}
  for (const tag of tags) {
    mock[tag] = ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
      React.createElement(tag, stripMotionProps(props), children)
  }
  return mock
}

/** Common tags used across portfolio sections. */
export const COMMON_MOTION_TAGS: MotionTag[] = ['div', 'nav', 'a', 'button', 'li', 'h1', 'h2', 'h3', 'p', 'span', 'ul']

/** Props consumed by next/image that must not reach a plain <img> in tests. */
export const IMAGE_SKIP_PROPS = ['fill', 'priority', 'quality']

/**
 * Build a next/image mock that renders a plain <img> without next/image-only
 * props (fill, priority, sizes, quality) which React rejects as invalid
 * boolean attributes on a DOM element.
 */
export function createImageMock() {
  return {
    default: ({ alt, ...props }: Record<string, unknown>) => {
      const rest: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(props)) {
        if (!IMAGE_SKIP_PROPS.includes(key)) {
          rest[key] = value
        }
      }
      return React.createElement('img', { ...rest, alt: alt as string })
    },
  }
}
