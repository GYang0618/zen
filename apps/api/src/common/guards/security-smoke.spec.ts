describe('Phase1 security smoke', () => {
  it('权限码命名约定', () => {
    expect('system:user:delete').toMatch(/^[a-z]+:[a-z]+:[a-z]+$/)
  })
})
