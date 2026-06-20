// module/account/romance_preference.ts
import prisma from "../prisma";
import { Keyboard } from "vk-io";
import { answerTimeLimit } from "../..";
import { Logger } from "../helper";
import { romance_related_tags } from "../datacenter/tag";

export async function getRomancePreferences(userId: number): Promise<string[]> {
    const user = await prisma.account.findFirst({
        where: { idvk: userId }
    });
    
    if (!user) return [];
    try {
        return JSON.parse(user.romance_preference || '[]');
    } catch {
        return [];
    }
}

export async function setRomancePreferences(userId: number, preferences: string[]): Promise<void> {
    const user = await prisma.account.findFirst({
        where: { idvk: userId }
    });
    
    if (!user) return;
    
    await prisma.account.update({
        where: { id: user.id },
        data: { romance_preference: JSON.stringify(preferences) }
    });
}

export async function requestRomancePreference(context: any): Promise<string[] | false> {
    let selected: string[] = [];
    let finished = false;
    
    while (!finished) {
        const isMaleSelected = selected.includes('male');
        const isFemaleSelected = selected.includes('female');
        const isBothSelected = selected.includes('both');
        
        const keyboard = Keyboard.builder()
            .textButton({ 
                label: `${isMaleSelected ? '✅' : '⬜'} Мужские`, 
                payload: { command: 'romance_toggle_male' }, 
                color: isMaleSelected ? 'positive' : 'secondary' 
            })
            .textButton({ 
                label: `${isFemaleSelected ? '✅' : '⬜'} Женские`, 
                payload: { command: 'romance_toggle_female' }, 
                color: isFemaleSelected ? 'positive' : 'secondary' 
            })
            .row()
            .textButton({ 
                label: `${isBothSelected ? '✅' : '⬜'} Мужские и женские`, 
                payload: { command: 'romance_toggle_both' }, 
                color: isBothSelected ? 'positive' : 'secondary' 
            })
            .row()
            .textButton({ 
                label: '✅ Готово', 
                payload: { command: 'romance_done' }, 
                color: 'positive' 
            })
            .oneTime()
            .inline();
        
        let selectedText = '\n❌ пока ничего не выбрано';
        if (selected.length > 0) {
            const labels = selected.map(s => {
                if (s === 'male') return 'мужские';
                if (s === 'female') return 'женские';
                if (s === 'both') return 'мужские и женские';
                return s;
            });
            selectedText = `\n✅ выбрано: ${labels.join(', ')}`;
        }
        
        const answer = await context.question(
            `Укажите, какие персонажи будут участвовать в сюжете:\n\n` +
            `💡 Если вы указали в анкете несколько сюжетов — можно выбрать несколько вариантов.`,
            { keyboard, answerTimeLimit }
        );
        
        if (answer.isTimeout) {
            await context.send(`⏰ Время ожидания выбора истекло!`);
            return false;
        }
        
        if (answer.payload?.command === 'romance_toggle_male') {
            if (selected.includes('male')) {
                selected = selected.filter(s => s !== 'male');
            } else {
                selected.push('male');
            }
            continue;
        }
        
        if (answer.payload?.command === 'romance_toggle_female') {
            if (selected.includes('female')) {
                selected = selected.filter(s => s !== 'female');
            } else {
                selected.push('female');
            }
            continue;
        }
        
        if (answer.payload?.command === 'romance_toggle_both') {
            if (selected.includes('both')) {
                selected = selected.filter(s => s !== 'both');
            } else {
                selected.push('both');
            }
            continue;
        }
        
        if (answer.payload?.command === 'romance_done') {
            if (selected.length === 0) {
                await context.send(`⚠ Выберите хотя бы один вариант`);
                continue;
            }
            
            const labels = selected.map(s => {
                if (s === 'male') return 'яой';
                if (s === 'female') return 'юри';
                if (s === 'both') return 'гет';
                return s;
            });
            
            const confirmKeyboard = Keyboard.builder()
                .textButton({ label: '✅ Да, верно', payload: { command: 'romance_confirm_yes' }, color: 'positive' })
                .textButton({ label: '🔙 Назад', payload: { command: 'romance_confirm_no' }, color: 'secondary' })
                .oneTime()
                .inline();
            
            const confirm = await context.question(
                `Подтверждение\n\n` +
                `Вы выбрали: ${labels.join(', ')}\n\n` +
                `❓ Всё верно?`,
                { keyboard: confirmKeyboard, answerTimeLimit }
            );
            
            if (confirm.isTimeout) {
                await context.send(`⏰ Время ожидания подтверждения истекло!`);
                return false;
            }
            
            if (confirm.payload?.command === 'romance_confirm_no') {
                await context.send(`🔙 Возвращаемся к настройке...`);
                continue;
            }
            
            // Сохраняем
            finished = true;
            await setRomancePreferences(context.senderId, selected);
            await context.send(`✅ Сохранено: ${labels.join(', ')}`);
            await Logger(`(preferences) ~ user ${context.senderId} set preferences: ${selected.join(', ')}`);
            return selected;
        }
    }
    
    return selected;
}

export async function handleRomanticSelection(context: any, selectedTags: number[]): Promise<boolean> {
    const hasRelevant = selectedTags.some(tagId => romance_related_tags.includes(tagId));
    
    if (!hasRelevant) return true;
    
    const { isAgeVerified, requestAgeVerification } = require('./age_verification');
    const verified = await isAgeVerified(context.senderId);
    
    if (!verified) {
        const ageOk = await requestAgeVerification(context);
        if (!ageOk) return false;
    }
    
    const currentPrefs = await getRomancePreferences(context.senderId);
    
    if (currentPrefs.length === 0) {
        const prefs = await requestRomancePreference(context);
        if (prefs === false) return false;
    }
    
    return true;
}

export async function checkRomanceCompatibility(
    userPrefs: string[],
    blankTags: number[]
): Promise<boolean> {
    if (userPrefs.length === 0) return true;
    
    const hasMaleTags = blankTags.some(t => [41].includes(t));
    const hasFemaleTags = blankTags.some(t => [42].includes(t));
    const hasBothTags = blankTags.some(t => [40].includes(t));
    
    for (const pref of userPrefs) {
        if (pref === 'male' && hasMaleTags) return true;
        if (pref === 'female' && hasFemaleTags) return true;
        if (pref === 'both' && hasBothTags) return true;
    }
    
    return false;
}