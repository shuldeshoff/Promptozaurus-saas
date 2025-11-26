// Алгоритмы разделения контента

// Разделение на равные части
export const splitIntoEqualParts = (text: string, partsCount: number, endingType: string, customDelimiter?: string): string[] => {
  if (!text || partsCount < 2) return [text];

  const avgPartSize = Math.ceil(text.length / partsCount);
  const parts: string[] = [];
  let startPos = 0;

  for (let i = 0; i < partsCount - 1; i++) {
    let endPos = startPos + avgPartSize;

    if (endingType === 'sentence') {
      const nextPeriod = text.indexOf('.', endPos);
      const nextExclamation = text.indexOf('!', endPos);
      const nextQuestion = text.indexOf('?', endPos);

      const possibleEndings = [nextPeriod, nextExclamation, nextQuestion].filter((pos) => pos !== -1);

      if (possibleEndings.length > 0) {
        endPos = Math.min(...possibleEndings) + 1;
      }
    } else if (endingType === 'paragraph') {
      const nextParagraph = text.indexOf('\n\n', endPos);
      if (nextParagraph !== -1) {
        endPos = nextParagraph + 2;
      } else {
        const nextLineBreak = text.indexOf('\n', endPos);
        if (nextLineBreak !== -1) {
          endPos = nextLineBreak + 1;
        }
      }
    } else if (endingType === 'delimiter' && customDelimiter) {
      const delimiterRegex = new RegExp(`(${customDelimiter}\\s*\\d*|${customDelimiter})`, 'i');
      const textAfterPos = text.substring(endPos);
      const match = textAfterPos.match(delimiterRegex);

      if (match && match.index !== undefined) {
        endPos = endPos + match.index;
      }
    }

    parts.push(text.substring(startPos, endPos));
    startPos = endPos;
  }

  parts.push(text.substring(startPos));
  return parts;
};

// Разделение по разделителю
export const splitByDelimiter = (text: string, delimiter: string, caseSensitive: boolean, includeDelimiter: boolean): string[] => {
  if (!text || !delimiter) return [text];

  const flags = caseSensitive ? 'g' : 'gi';
  const regex = new RegExp(delimiter, flags);

  if (includeDelimiter) {
    const parts: string[] = [];
    let lastIndex = 0;
    let match;

    const regexObj = new RegExp(delimiter, flags);

    while ((match = regexObj.exec(text)) !== null) {
      parts.push(text.substring(lastIndex, match.index));
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.filter((part) => part.length > 0);
  } else {
    return text.split(regex).filter((part) => part.length > 0);
  }
};

// Разделение по абзацам
export const splitByParagraphs = (text: string, paragraphsPerGroup: number, minParagraphSize: number): string[] => {
  if (!text) return [text];

  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  const filteredParagraphs = paragraphs.filter((p) => p.trim().length >= minParagraphSize);

  if (paragraphsPerGroup <= 1 || filteredParagraphs.length <= 1) {
    return filteredParagraphs.length > 0 ? filteredParagraphs : [text];
  }

  const groups: string[] = [];
  for (let i = 0; i < filteredParagraphs.length; i += paragraphsPerGroup) {
    const group = filteredParagraphs.slice(i, i + paragraphsPerGroup).join('\n\n');
    groups.push(group);
  }

  return groups;
};

// Разделение по шаблону (regex)
export const splitByPattern = (text: string, pattern: string, includeMatch: boolean): string[] => {
  if (!text || !pattern) return [text];

  try {
    const regex = new RegExp(pattern, 'gm');
    const matches: Array<{ index: number; length: number; text: string }> = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
      matches.push({
        index: match.index,
        length: match[0].length,
        text: match[0],
      });
    }

    if (matches.length === 0) return [text];

    const parts: string[] = [];
    let lastIndex = 0;

    for (let i = 0; i < matches.length; i++) {
      const currentMatch = matches[i];

      if (currentMatch.index > lastIndex) {
        parts.push(text.substring(lastIndex, currentMatch.index));
      }

      lastIndex = currentMatch.index;
      if (!includeMatch) {
        lastIndex += currentMatch.length;
      }

      if (i < matches.length - 1) {
        const endIndex = matches[i + 1].index;
        parts.push(text.substring(lastIndex, endIndex));
        lastIndex = endIndex;
      }
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.filter((part) => part.trim().length > 0);
  } catch (error) {
    console.error('Regular expression error:', error);
    return [text];
  }
};

