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

  return (
    <div>
      <button onClick={handleClick} disabled={someProperty === 0}>
        Test Button
      </button>
    </div>
  )
}
