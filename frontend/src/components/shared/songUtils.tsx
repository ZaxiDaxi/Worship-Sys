export function splitLineByWordsWithIndex(text: string) {
    const regex = /(\S+|\s+)/g;
    const tokens: Array<{ token: string; start: number }> = [];
    let match;
    let currentIndex = 0;
    while ((match = regex.exec(text)) !== null) {
      const tokenText = match[0];
      tokens.push({ token: tokenText, start: currentIndex });
      currentIndex += tokenText.length;
    }
    return tokens;
  }
  
  export function isMinorKey(k: string) {
    return k.endsWith("m");
  }
  