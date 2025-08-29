import { TestComponent } from './TestComponent'

describe('<TestComponent />', () => {
  it('should be disabled', () => {
    const onSomeEventCallabck = cy.spy().as('onSomeEventCallback')

    cy.mount(<TestComponent onSomeEvent={onSomeEventCallabck} someProperty={0}/>)

    cy.get('button').should('be.disabled')

  })

  it('should be enabled and not call the callback', () => {
    const onSomeEventCallabck = cy.spy().as('onSomeEventCallback')

    cy.mount(<TestComponent onSomeEvent={onSomeEventCallabck} someProperty={6}/>)

    cy.get('button').should('be.enabled')

    cy.get('button').click()

    cy.get('@onSomeEventCallback').should('not.have.been.called')

  })
})