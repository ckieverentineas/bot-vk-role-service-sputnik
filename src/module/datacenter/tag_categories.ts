// module/datacenter/tag_categories.ts
import { tag_list } from "./tag";

export interface TagCategory {
    id: number;
    name: string;
    description: string;
    tags: number[];
    multiSelect: boolean;
}

export const tag_categories: TagCategory[] = [
    {
        id: 1,
        name: 'Основа сюжета',
        description: 'Выберите основу сюжета (можно выбрать несколько):',
        tags: [1, 2],
        multiSelect: true
    },
    {
        id: 2,
        name: 'Жанр (часть 1)',
        description: 'Выберите жанры (можно выбрать несколько):',
        tags: [3, 4, 5, 6, 7, 8, 9, 10],
        multiSelect: true
    },
    {
        id: 3,
        name: 'Жанр (часть 2)',
        description: 'Выберите жанры (можно выбрать несколько):',
        tags: [11, 12, 13, 14, 15, 16, 17, 46],
        multiSelect: true
    },
    {
        id: 4,
        name: 'Время действия',
        description: 'Выберите время, в котором происходит сюжет (можно выбрать несколько):',
        tags: [47, 48, 49],
        multiSelect: true
    },
    {
        id: 5,
        name: 'Рейтинг сюжета',
        description: 'Выберите подходящий рейтинг (можно выбрать несколько):',
        tags: [23, 24, 25, 26],
        multiSelect: true
    },
    {
        id: 6,
        name: 'Особенности игры',
        description: 'Выберите особенности (можно выбрать несколько):',
        tags: [35, 36, 37, 38, 39, 18],
        multiSelect: true
    },
    {
        id: 7,
        name: 'Параметры игрока',
        description: 'Выберите ваши параметры как игрока (можно выбрать несколько):',
        tags: [27, 28, 29, 30, 31, 32, 33, 34],
        multiSelect: true
    }
];

export const romance_categories: TagCategory[] = [
    {
        id: 8,
        name: 'Предпочтения по персонажам',
        description: 'Выберите, какие персонажи могут участвовать в сюжете (можно выбрать несколько):',
        tags: [40, 41, 42],
        multiSelect: true
    },
    {
        id: 9,
        name: 'Роль в сюжете',
        description: 'Выберите вашу роль (можно выбрать несколько):',
        tags: [43, 44, 45],
        multiSelect: true
    }
];

export function getCategoryById(id: number): TagCategory | undefined {
    return [...tag_categories, ...romance_categories].find(c => c.id === id);
}

export function getCategoryTags(categoryId: number): number[] {
    const category = getCategoryById(categoryId);
    return category ? category.tags : [];
}

export function getTagLabel(tagId: number): string {
    const tag = tag_list.find(t => t.id === tagId);
    return tag ? tag.text : `#${tagId}`;
}