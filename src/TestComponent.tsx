export interface TestComponentProps {
  someProperty: number
  onSomeEvent: (someProperty: number) => void
}

export const TestComponent = ({ someProperty, onSomeEvent }: TestComponentProps) => {
  const handleClick = () => {
    if (someProperty > 0 && someProperty <= 5) {
      onSomeEvent(someProperty)
    }
  }

  // A redundant ternary to force Istanbul to consider it as a branch to be instrumented.
  const isDisabled = someProperty === 0 ? true : false

  return (
    <div>
      <button onClick={handleClick} disabled={isDisabled}>
        Test Button
      </button>
    </div>
  )
}
