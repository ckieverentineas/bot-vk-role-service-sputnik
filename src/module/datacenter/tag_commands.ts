// module/datacenter/tag_commands.ts
import prisma from "../prisma";
import { Send_Message } from "../helper";
import { Keyboard_Tag_Constructor, tag_list, getTagById } from "./tag";
import { tag_categories } from "./tag_categories";

export async function handleTagPage(context: any, payload: any) {
    const page = payload.page || 0;
    const command = payload.cmd || 'tagator_blank_config';
    const command_back = payload.back || 'main_menu';
    
    let userTags: number[] = [];
    let isBlankConfig = false;
    let isLikeConfig = false;
    let isUnlikeConfig = false;
    
    if (command === 'tagator_blank_config') {
        isBlankConfig = true;
        const user = await prisma.account.findFirst({ where: { idvk: context.userId } });
        if (!user) return;
        const blank = await prisma.blank.findFirst({ where: { id_account: user.id } });
        if (blank && blank.tag) {
            try {
                userTags = JSON.parse(blank.tag);
            } catch {
                userTags = [];
            }
        }
    } else if (command === 'tagator_research_config_like') {
        isLikeConfig = true;
        const user = await prisma.account.findFirst({ where: { idvk: context.userId } });
        if (!user) return;
        if (user.tag_like) {
            try {
                userTags = JSON.parse(user.tag_like);
            } catch {
                userTags = [];
            }
        }
    } else if (command === 'tagator_research_config_unlike') {
        isUnlikeConfig = true;
        const user = await prisma.account.findFirst({ where: { idvk: context.userId } });
        if (!user) return;
        if (user.tag_unlike) {
            try {
                userTags = JSON.parse(user.tag_unlike);
            } catch {
                userTags = [];
            }
        }
    }
    
    const categories = tag_categories;
    const keyboard = await Keyboard_Tag_Constructor(userTags, command, command_back, page, categories);
    
    let message = '';
    const category = categories[page];
    
    if (isBlankConfig) {
        message = `📎 Настройте теги своей анкеты:\n\n`;
    } else if (isLikeConfig) {
        message = `📎 Настройте теги, по которым будет искать тегатор:\n\n`;
    } else if (isUnlikeConfig) {
        message = `📎 Настройте теги, по которым НЕ будет искать тегатор:\n\n`;
    } else {
        message = `📎 Настройте теги:\n\n`;
    }
    
    if (category) {
        message += category.description + '\n\n';
    }
    
    const tagNames: string[] = [];
    for (const id of userTags) {
        const name = await getTagById(id);
        if (name) tagNames.push(name);
    }
    
    const selectedText = userTags.length > 0 
        ? `✅ ${isUnlikeConfig ? 'Исключено' : 'Выбрано'}: ${tagNames.join(', ')}\n`
        : `❌ Ничего не ${isUnlikeConfig ? 'исключено' : 'выбрано'}\n`;
    message += selectedText;
    
    await Send_Message(context.userId, message, keyboard);
}