import {fireEvent, render, screen} from "@testing-library/react";
import {TestComponent} from "./TestComponent.tsx";
import { describe, it, expect, vi } from 'vitest'

describe('TestComponent', () => {
  /**
   * This test covers the onClick handler conditions where it
   * enters the if-statement and invokes the callback function.
   *
   * The Cypress component test covers the other branches to
   * reproduce the issue where full coverage is achieved via a
   * combination of Cypress and Vitest.
   */
  it.each([1, 3, 4, 5])('should call the onSomeEvent callback function onClick when someProperty is within range', (someProperty: number) => {
    const someEventHandler = vi.fn()

    render(
      <TestComponent
        onSomeEvent={someEventHandler}
        someProperty={someProperty}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Test Button' }))

    expect(someEventHandler).toHaveBeenCalledExactlyOnceWith(someProperty)
  })
})
