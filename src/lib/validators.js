export function validateDebtor({ name }) {
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return 'Nome do devedor deve ter pelo menos 2 caracteres'
  }
  return null
}

export function validateTransaction({ type, amount, description }) {
  if (!['deposit', 'payment'].includes(type)) {
    return 'Tipo deve ser "deposit" ou "payment"'
  }
  if (typeof amount !== 'number' || amount <= 0) {
    return 'Valor deve ser um número positivo'
  }
  // Descrição obrigatória apenas para pagamentos
  if (type === 'payment' && (!description || typeof description !== 'string' || description.trim().length < 2)) {
    return 'Descrição do pagamento deve ter pelo menos 2 caracteres'
  }
  return null
}
