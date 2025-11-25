export const copyToClipboard = (text: string) => {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return true;
  } catch (err) {
    console.error('Fallback: Oops, unable to copy', err);
    document.body.removeChild(textarea);
    return false;
  }
};

export const cleanTranscript = (text: string): string => {
  if (!text) return text;

  // Split into parts, keeping spaces and punctuation
  const parts = text.split(/(\s+|[.,!?;])/);
  const cleaned = [];
  let prevWord = '';

  for (const part of parts) {
    const word = part.trim().toLowerCase();
    if (word && word !== prevWord) {
      cleaned.push(part);
      prevWord = word;
    } else if (!word) {
      // Keep spaces and punctuation
      cleaned.push(part);
    }
  }

  let result = cleaned.join('');

  // Simple spelling corrections
  const corrections: { [key: string]: string } = {
    'evryone': 'everyone',
    'recofnizing': 'recognizing',
    'correted': 'corrected',
    'sentance': 'sentence',
    'hope hope': 'hope',
    'fine fine': 'fine',
    // Add more common corrections as needed
  };

  for (const [wrong, right] of Object.entries(corrections)) {
    result = result.replace(new RegExp(wrong, 'gi'), right);
  }

  return result;
};