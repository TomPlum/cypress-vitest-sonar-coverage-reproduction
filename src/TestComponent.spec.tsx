import {fireEvent, render, screen} from "@testing-library/react"
import {TestComponent} from "./TestComponent.tsx"
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
  it('should call the onSomeEvent callback function onClick when someProperty is less than 5', () => {
    const someEventHandler = vi.fn()
    const anotherEventHandler = vi.fn()

    render(
      <TestComponent
        someProperty={3}
        onSomeEvent={someEventHandler}
        onAnotherEvent={anotherEventHandler}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Test Button' }))

    expect(someEventHandler).toHaveBeenCalledExactlyOnceWith(3)
    expect(anotherEventHandler).not.toHaveBeenCalled()
  })

  /**
   * This test emulates what we have to do to fix the coverage issue by
   * adding a unit test for a case that is already covered in Cypress.
   */
  it.skip('should disable the button when someProperty is 0', () => {
    const someEventHandler = vi.fn()

    render(
      <TestComponent
        someProperty={0}
        onAnotherEvent={vi.fn()}
        onSomeEvent={someEventHandler}
      />
    )

    expect(screen.getByRole('button', { name: 'Test Button' })).toBeDisabled()
  })
})
