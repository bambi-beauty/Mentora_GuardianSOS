export const formatPhoneNumber = (input) => {
  const cleaned = input.replace(/\D/g, '');

  if (cleaned.startsWith('0')) {
    return '+27' + cleaned.slice(1);
  }
  if (cleaned.startsWith('27') && cleaned.length === 11) {
    return '+' + cleaned;
  }
  return input;
};
