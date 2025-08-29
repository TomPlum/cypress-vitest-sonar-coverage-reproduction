import { TestComponent } from './TestComponent'

describe('<TestComponent />', () => {
  it(`should be enabled and call onAnotherEvent when someProperty is greater than 10`, () => {
    cy.mount(
      <TestComponent
        someProperty={15}
        onSomeEvent={cy.spy().as('onSomeEventCallback')}
        onAnotherEvent={cy.spy().as('onAnotherEventCallback')}
      />
    )

    cy.get('button').should('be.enabled')
    cy.get('button').click()

    cy.get('@onSomeEventCallback').should('not.have.been.called')
    cy.get('@onAnotherEventCallback').should('have.been.calledOnceWithExactly', 15)
  })


  it(`should be disabled if someProperty is 0`, () => {
    cy.mount(
      <TestComponent
        someProperty={0}
        onSomeEvent={cy.spy().as('onSomeEventCallback')}
        onAnotherEvent={cy.spy().as('onAnotherEventCallback')}
      />
    )

    cy.get('button').should('be.disabled')
  })
})
