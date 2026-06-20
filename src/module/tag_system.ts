// module/tag_system.ts
import { KeyboardBuilder } from "vk-io";
import { tag_list } from "./datacenter/tag";

// Категории тегов
export const tag_categories = [
  { id: 1, name: 'Основа сюжета', tags: [1, 2] },
  { id: 2, name: 'Жанр (часть 1)', tags: [3, 4, 5, 6, 7, 8, 9, 10] },
  { id: 3, name: 'Жанр (часть 2)', tags: [11, 12, 13, 14, 15, 16, 17, 46] },
  { id: 4, name: 'Время действия', tags: [47, 48, 49] },
  { id: 5, name: 'Рейтинг сюжета', tags: [23, 24, 25, 26] },
  { id: 6, name: 'Особенности игры', tags: [35, 36, 37, 38, 39, 18] },
  { id: 7, name: 'Параметры игрока', tags: [27, 28, 29, 30, 31, 32, 33, 34] },
];

export async function getTagById(id: number): Promise<string | undefined> {
  const tag = tag_list.find(t => t.id === id);
  return tag ? tag.text : undefined;
}

export function getCategoryKeyboard(command: string) {
  const keyboard = new KeyboardBuilder();
  
  for (const category of tag_categories) {
    keyboard.textButton({
      label: category.name,
      payload: { command: command, categoryId: category.id },
      color: 'secondary'
    }).row();
  }
  
  keyboard.textButton({
    label: '🚫 Назад',
    payload: { command: 'main_menu' },
    color: 'negative'
  });
  
  return keyboard.oneTime().inline();
}

export function getTagsKeyboard(categoryId: number, selectedTags: number[], command: string) {
  const keyboard = new KeyboardBuilder();
  const category = tag_categories.find(c => c.id === categoryId);
  
  if (!category) {
    return keyboard.oneTime().inline();
  }
  
  let row = 0;
  for (const tagId of category.tags) {
    const tag = tag_list.find(t => t.id === tagId);
    if (!tag) continue;
    
    const isSelected = selectedTags.includes(tagId);
    keyboard.textButton({
      label: `${isSelected ? '✅' : '⬜'} ${tag.text}`,
      payload: { command: command, tagId: tagId, categoryId: categoryId },
      color: isSelected ? 'positive' : 'secondary'
    });
    
    row++;
    if (row % 2 === 0) {
      keyboard.row();
    }
  }
  
  if (row % 2 !== 0) {
    keyboard.row();
  }
  
  keyboard.textButton({
    label: '⬅ Назад к категориям',
    payload: { command: 'blank_config_tags_categories' },
    color: 'secondary'
  });
  
  return keyboard.oneTime().inline();
}