import { compareTwoStrings } from "string-similarity";
import { DiceCoefficient, JaroWinklerDistance } from "natural";
import { Blank } from "@prisma/client";
import { generateSynonymSentences } from "./synonem";
import { Sleep } from "../helper";


const stopWords = new Set([
    'и', 'в', 'на', 'но', 'что', 'как',
    'это', 'с', 'за', 'от', 'по', 'для',
    'все', 'так', 'то', 'он', 'она', 'они',
    'к', 'кто', 'когда', 'где', 'чтобы', 
    'если', 'ли', 'или', 'да', 'нет', 
    'может', 'сейчас', 'у', 'при', 'из',
    'без', 'если', 'также', 'другой', 
    'всё', 'был', 'есть', 'будет', 
    'даже', 'всегда', 'никогда', 'лишь', 
    'только', 'больше', 'меньше', 'как', 
    'свой', 'себя', 'второй', 'первый', 
    'здесь', 'там', 'об', 'насколько', 
    'сначала', 'последний', 'всю', 
    'каждый', 'человек', 'который', 'всего', 
    'вокруг', 'между', 'перед', 'после', 
    'сама', 'теперь', 'нужен', 'такой', 
    'можно', 'было', 'вне', 'вперед', 
    'или', 'чем', 'чтобы', 'мне', 'вам', 
    'ему', 'ей', 'ими', 'поэтому', 'так', 
    'доказать', 'доказывать', 'всё', 
    'какой', 'какая', 'какие', 'заказ', 
    'чуть', 'куда', 'поэтому', 'вот', 
    'оба', 'всевозможный', 'единственный', 
    'мимо', 'через', 'только', 'другое'
]);
// Функция для очистки строки от лишних символов
function cleanString(input: string): string {
    return input.replace(/[^\w\sА-Яа-яЁё]/g, '').trim().toLowerCase();
}

// Функция для преобразования слова в его лемму
function toLemma(word: string): string {
    const nounEndings = [
        { suffix: 'ы', base: word.slice(0, -1) },  // мн.ч. (например, "столы")
        { suffix: 'и', base: word.slice(0, -1) },  // мн.ч. (например, "стулья")
        { suffix: 'а', base: word.slice(0, -1) },  // ед.ч. (например, "стол")
        { suffix: 'я', base: word.slice(0, -1) },  // ед.ч. (например, "дверь")
        { suffix: 'е', base: word.slice(0, -1) },  // предл. падеж (например, "столе")
        { suffix: 'у', base: word.slice(0, -1) },  // дат. падеж (например, "столу")
        { suffix: 'ом', base: word.slice(0, -2) }, // твор. падеж (например, "столом")
        { suffix: 'ах', base: word.slice(0, -2) }, // мн.ч. (например, "столах")
        { suffix: 'ях', base: word.slice(0, -2) }, // предл. падеж мн.ч. (например, "стульях")
        { suffix: 'ой', base: word.slice(0, -2) }, // ед.ч. (например, "новой")
        { suffix: 'и', base: word.slice(0, -2) },  // мн.ч. (например, "книги")
        { suffix: 'ою', base: word.slice(0, -2) }, // твор. падеж (например, "книгой")
        // Окончания для одушевленных существительных
        { suffix: 'и', base: word.slice(0, -1) },  // ед.ч. (например, "рыба")
        { suffix: 'ь', base: word.slice(0, -1) },  // мягкий знак (например, "конь")
        { suffix: 'я', base: word.slice(0, -1) },  // 1 л. ед.ч. (например, "мама")
        { suffix: 'е', base: word.slice(0, -1) },  // предл. падеж (например, "матери")
        // Дополнительные окончания
        { suffix: 'ой', base: word.slice(0, -2) }, // ед.ч. (например, "столовой")
        { suffix: 'ами', base: word.slice(0, -3) }, // твор. падеж мн.ч. (например, "столами")
        { suffix: 'ями', base: word.slice(0, -3) }  // твор. падеж (например, "дверями")
    ];

    const verbEndings = [
        // Настоящее время
        { suffix: 'ю', infinitive: 'ить' },  // 1-е лицо ед.ч. (например, "делаю")
        { suffix: 'ешь', infinitive: 'ить' }, // 2-е лицо ед.ч. (например, "делаешь")
        { suffix: 'ет', infinitive: 'ить' },  // 3-е лицо ед.ч. (например, "делает")
        { suffix: 'ем', infinitive: 'ить' },  // 1-е лицо мн.ч. (например, "делаем")
        { suffix: 'ете', infinitive: 'ить' }, // 2-е лицо мн.ч. (например, "делаете")
        { suffix: 'ют', infinitive: 'ить' },  // 3-е лицо мн.ч. (например, "делают")
    
        // Прошедшее время
        { suffix: 'л', infinitive: 'ить' },   // прошедшее время (мужской род, например, "делал")
        { suffix: 'ла', infinitive: 'ить' },  // прошедшее время (женский род, пример: "делала")
        { suffix: 'ло', infinitive: 'ить' },  // прошедшее время (средний род, пример: "делало")
        { suffix: 'ли', infinitive: 'ить' },  // прошедшее время (множественное число, пример: "делали")
    
        // Будущее время
        { suffix: 'у', infinitive: 'ить' },   // 1-е лицо ед.ч. (например, "сделаю")
        { suffix: 'ешь', infinitive: 'ить' },  // 2-е лицо ед.ч. (например, "сделаешь")
        { suffix: 'ет', infinitive: 'ить' },   // 3-е лицо ед.ч. (например, "сделает")
        { suffix: 'ем', infinitive: 'ить' },   // 1-е лицо мн.ч. (например, "сделаем")
        { suffix: 'ете', infinitive: 'ить' },  // 2-е лицо мн.ч. (например, "сделаете")
        { suffix: 'ут', infinitive: 'ить' },   // 3-е лицо мн.ч. (например, "сделают")
    
        // Дополнительные формы
        { suffix: 'ет', infinitive: 'еть' },   // 3-е лицо ед.ч. (например, "летит")
        { suffix: 'ем', infinitive: 'еть' },   // 1-е лицо мн.ч. (например, "летим")
        { suffix: 'ишь', infinitive: 'ить' },   // 2-е лицо ед.ч. (например, "знаешь")
        { suffix: 'ит', infinitive: 'ить' },    // 3-е лицо ед.ч. (например, "знает")
        { suffix: 'им', infinitive: 'еть' },    // 1-е лицо мн.ч. (например, "дремлем")
        { suffix: 'ите', infinitive: 'еть' },   // 2-е лицо мн.ч. (например, "дремлите")
        { suffix: 'и', infinitive: 'ить' },      // повелительное наклонение (например, "пойди")
        
        // Повелительное наклонение
        { suffix: 'и', infinitive: 'ать' },      // для инфинитивов (например, "беги")
        { suffix: 'те', infinitive: 'ить' },     // для мн.ч. (например, "делайте")
    
        // Разные окончания для диалектов или устных форм
        { suffix: 'ли', infinitive: 'ать' }      // устаревшие формы
    ];    
    
    const adjectiveEndings = [
        // Номинатив (именительный падеж)
        { suffix: 'ый', base: word.slice(0, -2) }, // м.р. ед.ч. (например, "красный")
        { suffix: 'ая', base: word.slice(0, -2) }, // ж.р. ед.ч. (например, "красная")
        { suffix: 'ое', base: word.slice(0, -2) }, // ср.р. ед.ч. (например, "красное")
    
        // Родительный падеж
        { suffix: 'ого', base: word.slice(0, -3) }, // м.р. ед.ч. (например, "красного")
        { suffix: 'ой', base: word.slice(0, -2) },   // ж.р. ед.ч. (например, "красной")
        { suffix: 'ого', base: word.slice(0, -2) }, // ср.р. ед.ч. (например, "красного")
    
        // Дательный падеж
        { suffix: 'ому', base: word.slice(0, -3) }, // м.р. ед.ч. (например, "красному")
        { suffix: 'ой', base: word.slice(0, -2) },   // ж.р. ед.ч. (например, "красной")
        { suffix: 'ому', base: word.slice(0, -2) }, // ср.р. ед.ч. (например, "красному")
    
        // Винительный падеж
        { suffix: 'ого', base: word.slice(0, -3) }, // м.р. ед.ч. (например, "красного")
        { suffix: 'ую', base: word.slice(0, -2) },  // ж.р. ед.ч. (например, "красную")
        { suffix: 'ое', base: word.slice(0, -2) },   // ср.р. ед.ч. (например, "красное")
    
        // Множественное число
        { suffix: 'ые', base: word.slice(0, -2) },  // м.р. мн.ч. (например, "красные")
        { suffix: 'ие', base: word.slice(0, -2) },  // для более редких форм (например, "синие")
        { suffix: 'ых', base: word.slice(0, -2) },  // м.р. мн.ч. (родительный падеж, например, "красных")
        { suffix: 'ие', base: word.slice(0, -2) },  // ж.р. мн.ч. (родительный падеж, например, "красных")
    
        // Краткие формы
        { suffix: 'а', base: word.slice(0, -1) },   // ж.р. (например, "умная")
        { suffix: 'о', base: word.slice(0, -1) },   // ср.р. (например, "умное")
        { suffix: 'ы', base: word.slice(0, -1) },   // мн.ч. (например, "умные")
    
        // Дополнительные окончания
        { suffix: 'ей', base: word.slice(0, -3) },  // род. падеж, ж.р. (например, "красной")
        { suffix: 'ыми', base: word.slice(0, -3) }, // мн.число (например, "красными")
    ];    

    // Проверяем существительные
    for (const ending of nounEndings) {
        if (word.endsWith(ending.suffix)) {
            return ending.base; // Возвращаем основание
        }
    }

    // Проверяем глаголы
    for (const ending of verbEndings) {
        if (word.endsWith(ending.suffix)) {
            return word.slice(0, -ending.suffix.length) + ending.infinitive; // Возвращаем инфинитив
        }
    }

    // Проверяем прилагательные
    for (const ending of adjectiveEndings) {
        if (word.endsWith(ending.suffix)) {
            return ending.base; // Возвращаем основание
        }
    }
    
    // Если окончание не распознано, возвращаем слово без изменений
    return word;
}

// Функция для обработки слов с учетом склонений
function normalizeWords(text: string): string[] {
    const cleanedText = cleanString(text);
    const words = cleanedText.split(/\s+/);
    const normalizedTerms: Set<string> = new Set();

    words.forEach(word => {
        if (word.length >= 4 && !stopWords.has(word)) {
            normalizedTerms.add(toLemma(word)); // Лемматизация для слов от 4 символов и более
        } else if (word.length < 4 && !stopWords.has(word)) {
            normalizedTerms.add(word); // Добавляем короткие слова без изменений
        }
    });

    return Array.from(normalizedTerms);
}

export async function Researcher_Better_Blank_Target(query: string, sentence: Blank): Promise<Match> {
    const normalizedQuery = normalizeWords(query).join(' ');
    const sentencesArray = sentence.text.split('.').map(s => s.trim()).filter(Boolean);
    const generatedSentences = generateSynonymSentences(normalizedQuery);

    const highestScores = await Promise.all(
        generatedSentences.map(async (generatedSentence) => {
            const normalizedGeneratedText = normalizeWords(generatedSentence).join(' ');

            // Для хранения оценок схожести
            let highestScore = 0;

            // Обрабатываем предложения в параллельном цикле
            await Promise.all(
                sentencesArray.map(async (text) => {
                    const normalizedText = normalizeWords(text).join(' ');
                    
                    // Оценка схожести по нескольким метрикам
                    const jaroWinklerScore = JaroWinklerDistance(normalizedGeneratedText, normalizedText, {});
                    const cosineScore = compareTwoStrings(normalizedGeneratedText, normalizedText);
                    const diceCoefficient = DiceCoefficient(normalizedGeneratedText, normalizedText);

                    // Итоговая оценка схожести
                    const overallScore = (
                        jaroWinklerScore * 0.2 +
                        cosineScore * 0.2 +
                        diceCoefficient * 0.6
                    );

                    highestScore = Math.max(highestScore, overallScore);
                    //console.log(`${normalizedGeneratedText} <-> ${normalizedText}: ${overallScore}`);
                })
            );

            return highestScore;
        })
    );

    const maxScore = Math.max(...highestScores);

    return {
        id: sentence.id,
        text: sentence.text,
        id_account: sentence.id_account,
        score: maxScore,
    };
}

export interface Match {
    id: number,
    text: string,
    id_account: number,
    score: number
}
