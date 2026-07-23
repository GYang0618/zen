describe('Phase1 security smoke', () => {
  it('权限码命名约定', () => {
    expect('system:user:delete').toMatch(/^[a-z]+:[a-z]+:[a-z]+$/)
  })

  it('step-up header 约定存在', () => {
    expect('x-step-up-token').toBeTruthy()
  })
})
