export interface TestComponentProps {
  someProperty: number
  onSomeEvent: (someProperty: number) => void
  onAnotherEvent: (someProperty: number) => void
}

export const TestComponent = ({ someProperty, onSomeEvent, onAnotherEvent }: TestComponentProps) => {
  const handleClick = () => {
    // The first 2 branches.
    // The unit test checks less than 5 for the truthy case.
    // The cypress test will hit the implicit else here via the falsy case.
    if (someProperty < 5) {
      onSomeEvent(someProperty)
    }


    // The second 2 branches.
    // The cypress test checks greater than 10 for the truthy case.
    // The unit test will hit the implicit else here via the falsy case.
    if (someProperty > 10) {
      onAnotherEvent(someProperty)
    }
  }

  // A redundant ternary to force Istanbul to consider it as branches to be instrumented.
  // The unit and cypress tests hit the falsy case for a non-zero value.
  // The cypress test alone hits the truthy case for a zero value.
  const isDisabled = someProperty === 0 ? true : false

  return (
    <button onClick={handleClick} disabled={isDisabled}>
      Test Button
    </button>
  )
}
