import { PrismaClient } from '@prisma/client';
import prisma from '../prisma';
import * as fs from 'fs';

export async function collectUniqueWordsAndFrequency() {
    // Получаем все записи из модели Blank
    const blanks = await prisma.blank.findMany({
        
    });

    // Словарь для хранения слов и их частоты
    const wordFrequency: { [key: string]: number } = {};

    // Обрабатываем каждое поле text
    let i = 0
    blanks.forEach(blank => {
        i++
        console.log(`Бланк №${blank.id} выгружается. #${i}`)
        const words = blank.text
            .toLowerCase() // Приводим к нижнему регистру
            .match(/[\wа-яА-ЯёЁ]+/g); // Извлекаем слова (убираем пунктуацию)

        if (words) {
            words.forEach(word => {
                if (wordFrequency[word]) {
                    wordFrequency[word]++;
                } else {
                    wordFrequency[word] = 1;
                }
            });
        }
    });

    // Преобразуем словарь в массив и сортируем по частоте
    const sortedWordFrequency = Object.entries(wordFrequency)
        .sort((a, b) => b[1] - a[1]); // Сортируем по убыванию частоты

    // Записываем в текстовый файл
    const output = sortedWordFrequency.map(([word, freq]) => `${word}: ${freq}`).join('\n');
    fs.writeFileSync('word_frequency.txt', output, 'utf8');

    console.log('Частота слов записана в word_frequency.txt');

    await prisma.$disconnect();
}

/* Запускаем функцию
collectUniqueWordsAndFrequency().catch(e => {
    console.error(e);
    process.exit(1);
});*/
