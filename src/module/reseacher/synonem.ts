const sinonoms: string[][] = [
    ["радость", "счастье", "удовольствие", "веселье"],
    ["грусть", "печаль", "тоска", "меланхолия"],
    ["красивый", "симпатичный"],
    ["автомобиль", "машина"],
    ["экшон", "экшн"],
    ["эротика", "эротичность"],
    ["фандом", "фэндом"]
];

export function generateSynonymSentences(sentence: string): string[] {
    const wordsWithPunctuation = sentence.split(/(\s+|[,])/); // Сохраняем знаки препинания
    const results: string[] = [];

    // Создаем отображение слов на их синонимы
    const synonymGroups: { [key: string]: string[] } = {};
    sinonoms.forEach(group => {
        group.forEach(synonym => {
            synonymGroups[synonym] = group;
        });
    });

    function backtrack(index: number, current: string[]): void {
        if (index === wordsWithPunctuation.length) {
            results.push(current.join('').trim()); // Объединяем с учетом пробелов и знаков
            return;
        }

        const word = wordsWithPunctuation[index];
        if (synonymGroups[word.trim()]) {
            const synonyms = synonymGroups[word.trim()];
            for (const synonym of synonyms) {
                current.push(synonym);
                backtrack(index + 1, current);
                current.pop();
            }
        } else {
            current.push(word);
            backtrack(index + 1, current);
            current.pop();
        }
    }

    backtrack(0, []);
    return results;
}

/* Пример использования
const sentence = "Меня распирает то радость, то грусть, а иногда автомобиль";
const result = generateSynonymSentences(sentence);
console.log(result);*/
