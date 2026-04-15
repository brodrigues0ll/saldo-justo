export function formatBRL(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function calcBalance({ deposits = [], payments = [] }) {
  const totalDeposits = deposits.reduce((acc, t) => acc + t.amount, 0)
  const totalPayments = payments
    .filter(t => t.status === 'approved')
    .reduce((acc, t) => acc + t.amount, 0)
  return {
    totalDeposits,
    totalPayments,
    balance: totalDeposits - totalPayments,
  }
}
