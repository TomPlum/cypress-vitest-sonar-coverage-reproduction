import { TestComponent } from './TestComponent'

describe('<TestComponent />', () => {
  const outsideCallbackBoundsCases = [-1, 6]

  outsideCallbackBoundsCases.forEach(someProperty => {
    it(`should be enabled and not call the callback function when someProperty is ${someProperty}`, () => {
      const onSomeEventCallback = cy.spy().as('onSomeEventCallback')

      cy.mount(<TestComponent onSomeEvent={onSomeEventCallback} someProperty={someProperty}/>)

      cy.get('button').should('be.enabled')
      cy.get('button').click()
      cy.get('@onSomeEventCallback').should('not.have.been.called')
    })
  })


  it(`should be disabled if someProperty is 0`, () => {
    const onSomeEventCallback = cy.spy().as('onSomeEventCallback')

    cy.mount(<TestComponent onSomeEvent={onSomeEventCallback} someProperty={0} />)

    cy.get('button').should('be.disabled')
  })
})
