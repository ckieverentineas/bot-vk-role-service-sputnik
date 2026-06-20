// module/datacenter/tag.ts
import { KeyboardBuilder } from "vk-io";
import { tag_categories, TagCategory } from "./tag_categories";

export const tag_list = [
    { id: 1, text: '#фандом' },
    { id: 2, text: '#ориджинал' },
    { id: 3, text: '#научная_фантастика' },
    { id: 4, text: '#фантастика' },
    { id: 5, text: '#фэнтези' },
    { id: 6, text: '#приключения' },
    { id: 7, text: '#военное' },
    { id: 8, text: '#историческое' },
    { id: 9, text: '#детектив' },
    { id: 10, text: '#криминал' },
    { id: 11, text: '#экшен' },
    { id: 12, text: '#ужасы' },
    { id: 13, text: '#драма' },
    { id: 14, text: '#мистика' },
    { id: 15, text: '#психология' },
    { id: 16, text: '#повседневность' },
    { id: 17, text: '#романтика' },
    { id: 18, text: '#долговременная_игра' },
    { id: 23, text: '#14+' },
    { id: 24, text: '#16+' },
    { id: 25, text: '#18+' },
    { id: 26, text: '#18++' },
    { id: 27, text: '#мск/мск-1' },
    { id: 28, text: '#мск+1/2/3' },
    { id: 29, text: '#мск+4/5/6' },
    { id: 30, text: '#мск+7/8/9' },
    { id: 31, text: '#многострочник' },
    { id: 32, text: '#среднестрочник' },
    { id: 33, text: '#малострочник' },
    { id: 34, text: '#разнострочник' },
    { id: 35, text: '#реал' },
    { id: 36, text: '#внеролевое_общение' },
    { id: 37, text: '#литературный_стиль' },
    { id: 38, text: '#полурол' },
    { id: 39, text: '#джен' },
    { id: 40, text: '#гет' },
    { id: 41, text: '#яой' },
    { id: 42, text: '#юри' },
    { id: 43, text: '#актив' },
    { id: 44, text: '#пассив' },
    { id: 45, text: '#универсал' },
    { id: 46, text: '#(пост)апокалипсис' },
    { id: 47, text: '#прошлое' },
    { id: 48, text: '#настоящее' },
    { id: 49, text: '#будущее' },
];

export const age_required_tags = [17, 25, 26];
export const romance_related_tags = [17, 40, 41, 42];

export async function getTagById(id: number | string): Promise<string | undefined> {
    const tag = tag_list.find(t => t.id === Number(id));
    return tag ? tag.text : undefined;
}

export async function Keyboard_Tag_Constructor(
    selectedTags: number[],
    command: string,
    command_back: string,
    page: number = 0,
    allCategories: TagCategory[] = tag_categories
) {
    const keyboard = new KeyboardBuilder();
    const category = allCategories[page];
    const isLastPage = page === allCategories.length - 1;
    
    // Определяем тип для сохранения
    let type = 'blank';
    if (command === 'tagator_research_config_like') {
        type = 'like';
    } else if (command === 'tagator_research_config_unlike') {
        type = 'unlike';
    }
    
    if (!category) {
        keyboard.callbackButton({
            label: '✅ Готово',
            payload: { 
                command: 'save_tags',
                done: true,
                type: type
            },
            color: 'positive'
        });
        return keyboard.oneTime().inline();
    }
    
    let counter = 0;
    for (const tagId of category.tags) {
        let isSelected = selectedTags.includes(tagId);
        
        if (tagId === 17) {
            // Если выбран #романтика ИЛИ выбран любой подвид (40, 41, 42)
            const hasRomance = selectedTags.includes(17);
            const hasSubtype = selectedTags.some(t => [40, 41, 42].includes(t));
            isSelected = hasRomance || hasSubtype;
        }
        
        const tag = tag_list.find(t => t.id === tagId);
        const label = `${isSelected ? '✅' : '⬜'} ${tag ? tag.text : `#${tagId}`}`;
        
        keyboard.callbackButton({
            label: label,
            payload: { 
                command: command, 
                id: tagId,
                categoryIndex: page
            },
            color: isSelected ? 'positive' : 'secondary'
        });
        
        counter++;
        if (counter % 2 === 0) {
            keyboard.row();
        }
    }
    
    if (counter % 2 !== 0) {
        keyboard.row();
    }
    
    if (page > 0) {
        keyboard.callbackButton({
            label: '⬅ Назад',
            payload: { command: 'tag_page', page: page - 1, cmd: command, back: command_back },
            color: 'secondary'
        });
    }
    
    if (!isLastPage) {
        keyboard.callbackButton({
            label: 'Вперед ➡',
            payload: { command: 'tag_page', page: page + 1, cmd: command, back: command_back },
            color: 'secondary'
        });
    }
    
    if (isLastPage) {
        keyboard.row();
        keyboard.callbackButton({
            label: '✅ Готово',
            payload: { 
                command: 'save_tags',
                done: true,
                type: type
            },
            color: 'positive'
        });
    }
    
    return keyboard.oneTime().inline();
}