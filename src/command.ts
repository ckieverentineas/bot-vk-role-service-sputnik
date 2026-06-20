// command.ts
import { HearManager } from "@vk-io/hear";
import { randomInt } from "crypto";
import { Keyboard, KeyboardBuilder } from "vk-io";
import { IQuestionMessageContext } from "vk-io-question";
import { answerTimeLimit, chat_id, root, timer_text, token, vk } from ".";
import prisma from "./module/prisma";
import { 
    Accessed, checkGroupSubscriber, Confirm_User_Success, Group_Id_Get, 
    Input_Number, Keyboard_Index, Logger, Match, Online_Set, 
    Parser_IDVK, Researcher_Better_Blank, Researcher_Better_Blank_Target_Old, 
    Send_Message, User_Banned, User_Info, isAgeVerified, 
    getTagsForBlank,
    formatBlankWithTags
} from "./module/helper";
import { abusivelist, Censored_Activation, Censored_Activation_Pro } from "./module/blacklist";
import { Account, Blank, Mail } from "@prisma/client";
import { Blank_Browser, Blank_Cleaner, Blank_Like, Blank_Like_Donate, Blank_Report, Blank_Report_Admin, Blank_Unlike, checkBlankHasTags } from "./module/blank_swap";
import { Keyboard_Swap } from "./module/keyboard";
import { BlackList_Printer } from "./module/blacklist_user";
import { Researcher_Better_Blank_Target } from "./module/reseacher/resheacher_up";
import { ico_list } from "./module/icon_list";
import { Photo_Upload_Pro } from "./module/download_photo";
import { handleAgeVerification, requestAgeVerification } from './module/account/age_verification';
import { 
    getRomancePreferences, requestRomancePreference, 
    handleRomanticSelection, checkRomanceCompatibility, 
    setRomancePreferences
} from './module/account/romance_preference';
import { tag_categories } from "./module/datacenter/tag_categories";
import { Keyboard_Tag_Constructor, tag_list, age_required_tags, romance_related_tags } from "./module/datacenter/tag";
import { getTagById } from "./module/tag_system";

let group_id_now: number | null = null

export function commandUserRoutes(hearManager: HearManager<IQuestionMessageContext>): void {
    
    // ==================== ГЛАВНОЕ МЕНЮ ====================
    hearManager.hear(/!спутник|!Спутник/, async (context: any) => {
        if (context.peerType == 'chat') { return }
        group_id_now = group_id_now ? group_id_now : Number(await Group_Id_Get(token))
        const user_check = await prisma.account.findFirst({ where: { idvk: context.senderId } })
        if (!user_check) { return }
        await Online_Set(context)
        const user_inf = await User_Info(context)
        const blank_check = await prisma.blank.findFirst({ where: { id_account: user_check?.id } })
        const mail_check = await prisma.mail.findFirst({ where: { blank_to: blank_check?.id ?? 0, read: false, find: true } })
        
        const keyboard = new KeyboardBuilder()
        .textButton({ label: '📃 Моя анкета', payload: { command: 'card_enter' }, color: 'secondary' })
        .textButton({ label: `${mail_check ? '📬' : '📪'} Почта`, payload: { command: 'card_enter' }, color: 'secondary' }).row()
        .textButton({ label: '⚙ Цензура', payload: { command: 'shop_category_enter' }, color: 'negative' })
        .textButton({ label: '☠ Банхаммер', payload: { command: 'admin_enter' }, color: 'negative' }).row()
        
        if (await checkGroupSubscriber(context.senderId, group_id_now)) {
            keyboard
            .textButton({ label: '🌐 Тегатор', payload: { command: 'tagator_menu' }, color: 'primary' })
            .textButton({ label: '🔍 Поиск', payload: { command: 'inventory_enter' }, color: 'primary' }).row()
        }
        
        keyboard
        .textButton({ label: '🎲 Рандом', payload: { command: 'shop_category_enter' }, color: 'positive' })
        .textButton({ label: '📐 Пкметр', payload: { command: 'shop_category_enter' }, color: 'positive' }).row()
        
        if (await checkGroupSubscriber(context.senderId, group_id_now)) {
            keyboard.textButton({ label: '🔧 Плагины', payload: { command: 'plugins_enter' }, color: 'secondary' })
        }
        
        keyboard.callbackButton({ label: '🚫', payload: { command: 'exit' }, color: 'secondary' }).oneTime().inline()
        
        await Send_Message(user_check.idvk, `🛰 Вы в системе поиска соролевиков, ${user_inf.first_name}, что изволите?`, keyboard)
        await Logger(`(private chat) ~ enter in main menu system is viewed by <user> №${context.senderId}`)
    })

    // ==================== МЕНЮ ПЛАГИНОВ ====================
    hearManager.hear(/🔧 Плагины|!плагин|!Плагин/, async (context: any) => {
        if (context.peerType == 'chat') { return }
        const user_check = await prisma.account.findFirst({ where: { idvk: context.senderId } })
        if (!user_check) { return }
        await Online_Set(context)
        const user_inf = await User_Info(context)
        
        const keyboard = new KeyboardBuilder()
        
        if (user_check.donate) {
            keyboard.textButton({ label: '⚰ Архив', payload: { command: 'archive_enter' }, color: 'primary' })
        } else {
            keyboard.textButton({ label: '⚰ Архив 🔒', payload: { command: 'archive_locked' }, color: 'primary' })
        }
        
        keyboard.textButton({ label: '🎯 Снайпер', payload: { command: 'sniper_enter' }, color: 'primary' })
        keyboard.textButton({ label: '🌐 Браузер', payload: { command: 'browser_enter' }, color: 'primary' }).row
        
        if (await Accessed(context) != `user`) {
            keyboard.textButton({ label: '⚖ Модерация', payload: { command: 'admin_enter' }, color: 'secondary' }).row()
        }
        
        keyboard.callbackButton({ label: '🚫', payload: { command: 'exit' }, color: 'secondary' }).oneTime().inline()
        
        let message = `🛰 Добро пожаловать в меню расширенного функционала, ${user_inf.first_name}!\n\n`
        
        if (!user_check.donate) {
            message += `⚰ Архив — инверсированный режим поиска "!рандом" — здесь находятся просмотренные вами анкеты.\n` +
                    `🔒 Доступно только донатерам сообщества!\n\n`
        } else {
            message += `⚰ Архив — инверсированный режим поиска "!рандом" — здесь находятся просмотренные вами анкеты.\n\n`
        }
        
        message += `🎯 Снайпер — гипер-пространственный доступ к любой анкете по её номеру.\n` +
                    `🔓 Доступно всем пользователям, но с ежесуточным лимитом!\n\n`
        
        message += `🌐 Браузер — поиск анкет по ключевому слову/словам.\n` +
                    `🔓 Доступно всем пользователям!\n\n`
        
        await Send_Message(user_check.idvk, message, keyboard)
        await Logger(`(private chat) ~ enter in plugins menu by <user> №${context.senderId}`)
    })

    // ==================== ТЕГАТОР — ЗАПУСК ПОИСКА ПО КНОПКЕ ====================
    hearManager.hear(/🚀 Поехали|!поехали/, async (context: any) => {
        if (context.peerType == 'chat') { return }
        const user_check = await prisma.account.findFirst({ where: { idvk: context.senderId } })
        if (!user_check) { return }
        const blank_check = await prisma.blank.findFirst({ where: { id_account: user_check.id } })
        if (!blank_check) { return }
        
        const hasTags = await checkBlankHasTags(blank_check.id);
        if (!hasTags) {
            await context.send(`⚠ Сначала настройте теги анкеты (минимум 3)!`);
            return;
        }
        
        const tag_like = user_check.tag_like ? JSON.parse(user_check.tag_like) : [];
        if (tag_like.length < 1) {
            await Send_Message(user_check.idvk, 
                `⚠ Сначала настройте теги, по которым будем искать!`
            );
            return;
        }
        
        const tag_unlike = user_check.tag_unlike ? JSON.parse(user_check.tag_unlike) : [];
        const userPref = await getRomancePreferences(context.senderId);
        
        let blank_build = [];
        let counter = 0;
        
        for (const blank of await prisma.$queryRaw<Blank[]>`SELECT * FROM Blank WHERE banned = false ORDER BY random() ASC`) {
            if (blank.id_account == user_check.id) { continue }
            const vision_check = await prisma.vision.findFirst({ where: { id_blank: blank.id, id_account: user_check.id } })
            if (vision_check) { continue }
            
            const user_bl_ch = await prisma.account.findFirst({ where: { id: blank.id_account}})
            const black_list_my = await prisma.blackList.findFirst({ where: { id_account: user_check.id, idvk: user_bl_ch?.idvk ?? 0 } })
            if (black_list_my) { continue }
            const black_list_other = await prisma.blackList.findFirst({ where: { id_account: user_bl_ch?.id ?? 0, idvk: user_check.idvk } })
            if (black_list_other) { continue }
            
            let blankTags: number[] = [];
            if (blank.tag) {
                try {
                    blankTags = JSON.parse(blank.tag);
                } catch {}
            }
            
            if (blankTags.length === 0) { continue; }
            
            // Исключаем анкеты с нежелательными тегами
            let hasUnwanted = false;
            for (const tag of tag_unlike) {
                if (blankTags.includes(tag)) {
                    hasUnwanted = true;
                    break;
                }
            }
            if (hasUnwanted) { continue; }
            
            // Проверяем наличие желаемых тегов
            let hasWanted = false;
            for (const tag of tag_like) {
                if (blankTags.includes(tag)) {
                    hasWanted = true;
                    break;
                }
            }
            if (!hasWanted) { continue; }
            
            const compatible = await checkRomanceCompatibility(userPref, blankTags);
            if (!compatible) { continue; }
            
            if (counter > 50) { break; }
            blank_build.push(blank);
            counter++;
        }
        
        if (blank_build.length === 0) {
            await Send_Message(user_check.idvk, 
                `😿 Анкет по вашим тегам не найдено.\n` +
                `Попробуйте изменить критерии поиска.`
            );
            return;
        }
        
        let ender = true;
        await Logger(`(tagator) ~ starting search by @${user_check.idvk}`);
        
        while (ender && blank_build.length > 0) {
            const target = Math.floor(Math.random() * blank_build.length);
            const selector: Blank = blank_build[target];
            const blank_check2 = await prisma.blank.findFirst({ where: { id: selector.id } });
            
            if (!blank_check2) {
                blank_build.splice(target, 1);
                await Send_Message(user_check.idvk, `⚠ Анкета #${selector.id} была удалена.`);
                continue;
            }
            
            let censored = user_check.censored ? await Censored_Activation_Pro(selector.text) : selector.text;
            
            // Показываем теги анкеты
            let blankTags: number[] = [];
            if (selector.tag) {
                try {
                    blankTags = JSON.parse(selector.tag);
                } catch {}
            }
            const tagNames = (await Promise.all(blankTags.map(id => getTagById(id)))).filter(Boolean).join(', ');
            const tagLine = blankTags.length > 0 ? `\n🏷 Теги: ${tagNames}` : '';
            
            const baseText = `📜 Анкета: ${selector.id}\n💬 Содержание:\n${censored}`;
            const formatted = await formatBlankWithTags(user_check.idvk, selector.id, baseText);
            const text = formatted.text;

            const keyboard = await Keyboard_Swap(blank_build.length, user_check);
            if (formatted.showTagsButton) {
                keyboard.callbackButton({ 
                    label: '🏷 Показать теги', 
                    payload: { command: 'show_tags', idb: selector.id },
                    color: 'secondary' 
                }).row();
            }
            const corrected: any = blank_check2.photo.includes('photo') 
                ? await context.question(text, {keyboard, answerTimeLimit, attachment: blank_check2.photo}) 
                : await context.question(text, {keyboard, answerTimeLimit});
            
            if (corrected.isTimeout) {
                await context.send(`⏰ Время ожидания истекло!`);
                await Keyboard_Index(context, `⌛ Обновление...`);
                return;
            }
            
            const config: any = {
                '⛔ Мимо': Blank_Unlike,
                '✅ Отклик': Blank_Like,
                '✏ Письмо': Blank_Like_Donate,
                '⚠ Жалоба': Blank_Report,
                '🔪 Резать мразей как шаверму': Blank_Report_Admin
            };
            
            if (corrected.text in config) {
                const commandHandler = config[corrected.text];
                await commandHandler(context, user_check, selector, blank_build, target);
            } else {
                if (corrected.text == '🚫 Стоп' || corrected.text == '!стоп') {
                    await Send_Message(user_check.idvk, `✅ Поиск остановлен.`);
                    ender = false;
                } else {
                    await Send_Message(user_check.idvk, `💡 Жмите только по кнопкам!`);
                }
            }
        }
        
        if (blank_build.length === 0) {
            await Send_Message(user_check.idvk, `😿 Анкеты закончились, попробуйте другие теги.`);
        }
        
        await Logger(`(tagator) ~ search finished by @${user_check.idvk}`);
        await Keyboard_Index(context, `⌛ Тегатор-3000 завершил работу...`);
    })

    // ==================== АРХИВ (заблокирован) ====================
    hearManager.hear(/⚰ Архив 🔒/, async (context: any) => {
        if (context.peerType == 'chat') { return }
        const user_check = await prisma.account.findFirst({ where: { idvk: context.senderId } })
        if (!user_check) { return }
        
        const donatorsCount = await prisma.account.count({
            where: { donate: true }
        });
        
        const keyboard = new KeyboardBuilder()
            .textButton({ label: '🚫', payload: { command: 'exit' }, color: 'secondary' })
            .oneTime().inline();
        
        await Send_Message(user_check.idvk, 
            `🚫 Архив — инверсированный режим поиска "!рандом"\n\n` +
            `⚡ Здесь находятся просмотренные вами анкеты, которые вы могли пропустить или захотеть пересмотреть.\n\n` +
            `🔒 Доступно только донатерам сообщества!\n\n` +
            `🌟 Благодаря поддержке Спутника на разных этапах, на сегодняшний день доступ к расширенному функционалу имеют уже ${donatorsCount} ролевиков!\n\n`,
            keyboard
        )
    })

    // ==================== СНАЙПЕР ====================
    hearManager.hear(/🎯 Снайпер|!снайпер|!Снайпер/, async (context: any) => {
        if (context.peerType == 'chat') { return }
        const user_check = await prisma.account.findFirst({ where: { idvk: context.senderId } })
        const blank_check = await prisma.blank.findFirst({ where: { id_account: user_check?.id } })
        if (!user_check) { return }
        
        const donatorsCount = await prisma.account.count({
            where: { donate: true }
        });
        
        if (!blank_check) { 
            return await context.send(`⚠ Создайте анкету`) 
        }
        
        if (blank_check.banned) {
            await context.send(`💔 Ваша анкета заблокирована из-за жалоб до разбирательств`)
            return
        }
        
        const banned_me = await User_Banned(context)
        if (banned_me) { return }
        await Online_Set(context)
        
        let sniperUsageRecords = [];
        let startOfDay = null;
        let remainingShots = 3;
        
        if (!user_check.donate) {
            const now = new Date();
            const mskTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Moscow" }));
            startOfDay = new Date(mskTime);
            startOfDay.setHours(0, 0, 0, 0);
            
            sniperUsageRecords = await prisma.sniperUsage.findMany({
                where: {
                    id_account: user_check.id,
                    usage_date: {
                        gte: startOfDay
                    }
                }
            });
            
            remainingShots = 3 - sniperUsageRecords.length;
            
            if (remainingShots <= 0) {
                const keyboard = new KeyboardBuilder()
                    .textButton({ label: '🚫', payload: { command: 'exit' }, color: 'secondary' })
                    .oneTime().inline();
                    
                await Send_Message(user_check.idvk, 
                    `Вы уже использовали все свои ежедневные снайперские выстрелы по анкетам.\n\n` +
                    `⚡ Новые попытки будут доступны после 00:00 по МСК\n\n` +
                    `Станьте донатером для безлимитного доступа к снайперу!\n\n` +
                    `🌟 Благодаря поддержке Спутника на разных этапах, на сегодняшний день доступ к расширенному функционалу имеют уже ${donatorsCount} ролевиков!`,
                    keyboard
                );
                return;
            }
        }
        
        let blank_build = []
        let counter = 0
        
        const inputKeyboard = new KeyboardBuilder()
            .textButton({ label: '🚫', payload: { command: 'cancel_sniper' }, color: 'secondary' })
            .oneTime().inline();
        
        const input_text = await context.question(
            `Введите номер анкеты для доступа через гипер-пространство, игнорируя${await Accessed(context) != 'user' ? ' банхаммер и' : ''} просмотренный список.\n${ico_list['help'].ico}Можно вводить как "2043", так и "#2043".\n${ico_list['help'].ico}Отправьте сообщение в чат для изменения:\n\n${!user_check.donate ? `🎯 Осталось выстрелов сегодня: ${remainingShots}/3` : ''}`, 
            { 
                keyboard: inputKeyboard,
                answerTimeLimit: timer_text 
            }
        );
        
        if (input_text.isTimeout) { 
            await context.send(`⏰ Время ожидания ввода номера анкеты истекло! Холостой выстрел.`); 
            return;
        }
        
        if (input_text.text === '🚫' || input_text.text.toLowerCase().includes('стоп') || input_text.text.toLowerCase().includes('отмена') || input_text.text.trim() === '') {
            await context.send(`🎯 Гипер-пространственный наводчик деактивирован. Холостой выстрел не засчитан.`);
            await Keyboard_Index(context, `⌛ Есть, капитан... Выдаем кнопку вызова спутника...`);
            return;
        }
        
        let input_clean = input_text.text.trim();
        if (input_clean.startsWith('#')) {
            input_clean = input_clean.substring(1);
        }
        
        const input_blank = parseInt(input_clean);
        
        if (!input_blank || isNaN(input_blank)) { 
            await context.send(`❌ Неверный формат номера анкеты. Используйте "2043" или "#2043"\n\nХолостой выстрел не засчитан.`);
            await Keyboard_Index(context, `⌛ Есть, капитан... Выдаем кнопку вызова спутника...`);
            return;
        }
        
        const isAdmin = await Accessed(context) != 'user';
        
        if (!isAdmin) {
            const blank_get = await prisma.blank.findFirst({ 
                where: { 
                    id: input_blank, 
                    banned: false 
                } 
            });
            
            if (!blank_get) { 
                await context.send(`❌ Анкета не найдена/заблокирована/удалена\n\nХолостой выстрел не засчитан.`);
                await Keyboard_Index(context, `⌛ Есть, капитан... Выдаем кнопку вызова спутника...`);
                return;
            }
            
            const author_account = await prisma.account.findFirst({ 
                where: { id: blank_get.id_account } 
            });
            
            if (author_account) {
                const black_list_check = await prisma.blackList.findFirst({
                    where: {
                        id_account: user_check.id,
                        idvk: author_account.idvk
                    }
                });
                
                if (black_list_check) {
                    await context.send(`🚫 Автор этой анкеты находится в вашем черном списке. Снайпер не может пробить банхаммер!\n\nХолостой выстрел не засчитан.`);
                    await Keyboard_Index(context, `⌛ Есть, капитан... Выдаем кнопку вызова спутника...`);
                    return;
                }
                
                const black_list_other = await prisma.blackList.findFirst({
                    where: {
                        id_account: author_account.id,
                        idvk: user_check.idvk
                    }
                });
                
                if (black_list_other) {
                    await context.send(`🚫 Автор этой анкеты добавил вас в черный список. Снайпер не может пробить банхаммер!\n\nХолостой выстрел не засчитан.`);
                    await Keyboard_Index(context, `⌛ Есть, капитан... Выдаем кнопку вызова спутника...`);
                    return;
                }
            }
            
            blank_build.push(blank_get)
        } else {
            const blank_get = await prisma.blank.findFirst({ 
                where: { 
                    id: input_blank 
                } 
            });
            
            if (!blank_get) { 
                await context.send(`❌ Анкета не найдена/удалена\n\nХолостой выстрел не засчитан.`);
                await Keyboard_Index(context, `⌛ Есть, капитан... Выдаем кнопку вызова спутника...`);
                return;
            }
            
            blank_build.push(blank_get)
        }
        
        if (!user_check.donate && remainingShots > 0) {
            const now = new Date();
            const mskTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Moscow" }));
            
            await prisma.sniperUsage.create({
                data: {
                    id_account: user_check.id,
                    usage_date: mskTime,
                    used: true
                }
            });
        }
        
        let ender = true
        await Logger(`(private chat) ~ starting check sniper blank by <user> №${context.senderId} (admin: ${isAdmin})`)
        
        while (ender && blank_build.length > 0) {
            const target = Math.floor(Math.random() * blank_build.length)
            const selector: Blank = blank_build[target]
            const blank_check2 = await prisma.blank.findFirst({ where: { id: selector.id } })
            
            if (!blank_check2) { 
                blank_build.splice(target, 1)
                await Send_Message(user_check.idvk, `⚠ Внимание, следующая анкета была удалена владельцем в процессе просмотра и изъята из поиска:\n\n📜 Анкета: ${selector.id}\n💬 Содержание: ${selector.text}\n `)
                continue
            }
            
            let censored = user_check.censored ? await Censored_Activation_Pro(selector.text) : selector.text
            
            if (!isAdmin && blank_check2.banned) {
                blank_build.splice(target, 1)
                await Send_Message(user_check.idvk, `⚠ Анкета #${selector.id} была забанена модераторами и больше недоступна.`)
                continue
            }
            
            const baseText = `📜 Анкета из снайпера: ${selector.id}\n💬 Содержание:\n${censored}`;
            const formatted = await formatBlankWithTags(user_check.idvk, selector.id, baseText);
            const text = formatted.text;
            
            // Создаём клавиатуру с кнопкой показа тегов
            const keyboard = await Keyboard_Swap(blank_build.length, user_check);
            if (formatted.showTagsButton) {
                keyboard.textButton({ 
                    label: '🏷 Показать теги', 
                    payload: { command: 'show_tags', idb: selector.id },
                    color: 'secondary' 
                }).row();
            }
            
            const corrected: any = blank_check2.photo.includes('photo') 
                ? await context.question(text, {keyboard, answerTimeLimit, attachment: blank_check2.photo}) 
                : await context.question(text, {keyboard, answerTimeLimit})
            
            if (corrected.isTimeout) { 
                await context.send(`⏰ Время ожидания снайпера анкеты истекло!`); 
                await Keyboard_Index(context, `⌛ Обновление клавиатуры...`); 
                return 
            }
            
            const config: any = {
                '⛔ Мимо': Blank_Unlike,
                '✅ Отклик': Blank_Like,
                '✏ Письмо': Blank_Like_Donate,
                '⚠ Жалоба': Blank_Report,
                '🔪 Резать мразей как шаверму': Blank_Report_Admin,
                '🏷 Показать теги': async () => {
                    const tags = await getTagsForBlank(selector.id);
                    await Send_Message(user_check.idvk, `🏷 Теги анкеты #${selector.id}:\n\n${tags}`);
                    // Показываем снова ту же анкету
                    // (рекурсивно вызываем тот же вопрос)
                }
            }
            
            if (corrected.text in config) {
                const commandHandler = config[corrected.text];
                const ans = await commandHandler(context, user_check, selector, blank_build, target)
            } else {
                if (corrected.text == '🚫 Стоп' || corrected.text == '!стоп') {
                    await Send_Message(user_check.idvk, `✅ Успешная отмена режима снайпера`)
                    ender = false
                } else { 
                    await Send_Message(user_check.idvk, `💡 Жмите только по кнопкам с иконками!`) 
                }
            }
        }
        
        if (blank_build.length == 0) { 
            await Send_Message(user_check.idvk, `😿 Очередь анкет закончилась, попробуйте вызвать !снайпер еще раз, иначе приходите позже.`)
        }
        
        await Logger(`(private chat) ~ finished check sniper blank by <user> №${context.senderId}`)
        await Keyboard_Index(context, `⌛ Снайпер-снайпер-снайперок, в рот этого купидона! Выдаем кнопку вызова спутника...`)
    })

    // ==================== АРХИВ (для донатеров) ====================
    hearManager.hear(/⚰ Архив|!архив|!Архив/, async (context: any) => {
        if (context.peerType == 'chat') { return }
        const user_check = await prisma.account.findFirst({ where: { idvk: context.senderId } })
        const blank_check = await prisma.blank.findFirst({ where: { id_account: user_check?.id } })
        if (!user_check) { return }
        if (!user_check.donate) { return }
        if (!blank_check) { return await context.send(`⚠ Создайте анкету`) }
        if (blank_check.banned) {
            await context.send(`💔 Ваша анкета заблокирована из-за жалоб до разбирательств`)
            return
        }
        const banned_me = await User_Banned(context)
        if (banned_me) { return }
        await Online_Set(context)
        let blank_build = []
        let counter = 0
        for (const blank of await prisma.$queryRaw<Blank[]>`SELECT * FROM Blank WHERE banned = false ORDER BY random() ASC`) {
            if (blank.id_account == user_check.id) { continue }
            const vision_check = await prisma.vision.findFirst({ where: { id_blank: blank.id, id_account: user_check.id } })
            if (!vision_check) { continue }
            const user_bl_ch = await prisma.account.findFirst({ where: { id: blank.id_account}})
            const black_list_my = await prisma.blackList.findFirst({ where: { id_account: user_check.id, idvk: user_bl_ch?.idvk ?? 0 } })
            if (black_list_my) { continue }
            const black_list_other = await prisma.blackList.findFirst({ where: { id_account: user_bl_ch?.id ?? 0, idvk: user_check.idvk } })
            if (black_list_other) { continue }
            if (counter > 50) { break }
            blank_build.push(blank)
            counter++
        }
        let ender = true
        await Logger(`(private chat) ~ starting check archive blank by <user> №${context.senderId}`)
        while (ender && blank_build.length > 0) {
            const target = Math.floor(Math.random() * blank_build.length)
            const selector: Blank = blank_build[target]
            const blank_check2 = await prisma.blank.findFirst({ where: { id: selector.id } })
            if (!blank_check2) { 
                blank_build.splice(target, 1)
                await Send_Message(user_check.idvk, `⚠ Внимание, следующая анкета была удалена владельцем в процессе просмотра и изъята из поиска:\n\n📜 Анкета: ${selector.id}\n💬 Содержание: ${selector.text}\n `)
                continue
            }
            let censored = user_check.censored ? await Censored_Activation_Pro(selector.text) : selector.text
            
            const baseText = `📜 Анкета из архива: ${selector.id}\n💬 Содержание:\n${censored}`;
            const formatted = await formatBlankWithTags(user_check.idvk, selector.id, baseText);
            const text = formatted.text;
            
            const keyboard = await Keyboard_Swap(blank_build.length, user_check);
            if (formatted.showTagsButton) {
                keyboard.callbackButton({ 
                    label: '🏷 Показать теги', 
                    payload: { command: 'show_tags', idb: selector.id },
                    color: 'secondary' 
                }).row();
            }
            
            const corrected: any = blank_check2.photo.includes('photo') 
                ? await context.question(text, {keyboard, answerTimeLimit, attachment: blank_check2.photo}) 
                : await context.question(text, {keyboard, answerTimeLimit})
            if (corrected.isTimeout) { 
                await context.send(`⏰ Время ожидания архивного поиска анкеты истекло!`); 
                await Keyboard_Index(context, `⌛ Обновление клавиатуры...`); 
                return 
            }
            const config: any = {
                '⛔ Мимо': Blank_Unlike,
                '✅ Отклик': Blank_Like,
                '✏ Письмо': Blank_Like_Donate,
                '⚠ Жалоба': Blank_Report,
                '🔪 Резать мразей как шаверму': Blank_Report_Admin,
                '🏷 Показать теги': async () => {
                    const tags = await getTagsForBlank(selector.id);
                    const kb = new KeyboardBuilder()
                        .callbackButton({ label: '⬅ Назад', payload: { command: 'exit' }, color: 'secondary' })
                        .oneTime().inline();
                    await Send_Message(user_check.idvk, `🏷 Теги анкеты #${selector.id}:\n\n${tags}`, kb);
                }
            }
            if (corrected.text in config) {
                const commandHandler = config[corrected.text];
                const ans = await commandHandler(context, user_check, selector, blank_build, target)
            } else {
                if (corrected.text == '🚫 Стоп' || corrected.text == '!стоп') {
                    await Send_Message(user_check.idvk, `✅ Успешная отмена архивных анкет.`)
                    ender = false
                } else { await Send_Message(user_check.idvk, `💡 Жмите только по кнопкам с иконками!`) }
            }
        }
        if (blank_build.length == 0) { await Send_Message(user_check.idvk, `😿 Очередь анкет закончилась, попробуйте вызвать !архив еще раз, иначе приходите позже.`)}
        await Logger(`(private chat) ~ finished check archive blank by <user> №${context.senderId}`)
        await Keyboard_Index(context, `⌛ Архивариус, знание — сила, мудрость — идиллия! Выдаем кнопку вызова спутника...`)
    })

    // ==================== ПОЧТА ====================
    hearManager.hear(/📬 Почта|📪 Почта|!почта|!Почта/, async (context: any) => {
        if (context.peerType == 'chat') { return }
        const user_check = await prisma.account.findFirst({ where: { idvk: context.senderId } })
        if (!user_check) { return }
        const blank_check = await prisma.blank.findFirst({ where: { id_account: user_check?.id } })
        if (!blank_check) { return await context.send(`Чтобы воспользоваться почтой, нажмите кнопку в главном меню "📃 Моя анкета" или вызовите команду !анкета в чате для создания анкеты персонажа`)}
        if (blank_check.banned) {
            await context.send(`💔 Ваша анкета заблокирована из-за жалоб до разбирательств`)
            return
        }
        const banned_me = await User_Banned(context)
        if (banned_me) { return }
        await Online_Set(context)
        const mail_build = []
        for (const mail of await prisma.mail.findMany({ where: { blank_to: blank_check.id, read: false, find: true } })) {
            mail_build.push(mail)
        }
        let ender = true
        await Logger(`(private chat) ~ starting check self mail by <user> №${context.senderId}`)
        while (ender && mail_build.length > 0) {
            const target = Math.floor(Math.random() * mail_build.length)
            const selector: Mail = mail_build[target]
            const blank_to_check = await prisma.blank.findFirst({ where: { id: selector.blank_to } })
            const blank_from_check = await prisma.blank.findFirst({ where: { id: selector.blank_from } })
            if (!blank_to_check || !blank_from_check) { 
                const mail_skip = await prisma.mail.update({ where: { id: selector.id }, data: { read: true, find: false } })
                mail_build.splice(target, 1)
                await Send_Message(user_check.idvk, `⚠ Недавно ваша анкета #${blank_to_check?.id} понравилась ролевику с анкетой #${blank_from_check?.id}, но ваша или оппонента анкета не были найдены, сообщение было помечено не найденным\n `)
                continue
            }
            const account_to = await prisma.account.findFirst({ where: { id: blank_to_check.id_account } })
            const account_from = await prisma.account.findFirst({ where: { id: blank_from_check.id_account } })
            if (!account_to || !account_from) {
                const mail_skip = await prisma.mail.update({ where: { id: selector.id }, data: { read: true, find: false } })
                mail_build.splice(target, 1)
                await Send_Message(user_check.idvk, `⚠ Недавно ваша анкета #${blank_to_check?.id} понравилась ролевику с анкетой #${blank_from_check?.id}, но ваc или оппонента больше нет в системе, сообщение было помечено не найденным\n `)
                continue
            }
            let censored = user_check.censored ? await Censored_Activation_Pro(blank_from_check.text) : blank_from_check.text
            const text = `🔔 Ваша анкета #${blank_to_check.id} понравилась автору следующей анкеты:\n 📜 Анкета: ${blank_from_check.id}\n💬 Содержание:\n${censored}`
            const keyboard = new KeyboardBuilder()
            .textButton({ label: '👎', payload: { command: 'student' }, color: 'secondary' })
            .textButton({ label: '👍', payload: { command: 'citizen' }, color: 'secondary' }).row()
            .textButton({ label: '🚫Стоп', payload: { command: 'citizen' }, color: 'secondary' }).row()
            if (account_to.id_role != 1) {
                keyboard.textButton({ label: '🔪 Резать мразей как шаверму', color: 'secondary' }).row()
            } else {
                keyboard.textButton({ label: '⚠ Жалоба', color: 'secondary' }).row()
            }
            keyboard.oneTime().inline()
            const corrected: any = blank_from_check.photo.includes('photo') ? await context.question( text, {keyboard, answerTimeLimit, attachment: blank_from_check.photo}) : await context.question( text, {keyboard, answerTimeLimit})
            if (corrected.isTimeout) { await context.send(`⏰ Время ожидания разбора почты истекло!`); await Keyboard_Index(context, `⌛ Обновление клавиатуры...`); return }
            if (corrected.text == '🚫Стоп' || corrected.text == '!стоп') {
                await Send_Message(user_check.idvk, `✅ Успешная отмена просмотра почтового ящика анкет.`)
                ender = false
            }
            if (corrected.text == '👎' || corrected.text == '!дизлайк') {
                const mail_skip = await prisma.mail.update({ where: { id: selector.id }, data: { read: true } })
                mail_build.splice(target, 1)
                await Send_Message(user_check.idvk, `✅ Игнорируем анкету #${selector.blank_from} полностью.`)
                await Logger(`(private chat) ~ clicked unlike for <blank> #${blank_to_check.id} by <user> №${context.senderId}`)
            }
            if (corrected.text == '👍' || corrected.text == '!лайк') {
                const mail_skip = await prisma.mail.update({ where: { id: selector.id }, data: { read: true, status: true } })
                mail_build.splice(target, 1)
                await Send_Message(account_to.idvk, `🔊 Недавно вам понравилась анкета #${blank_from_check.id}, знайте, что это взаимно на вашу анкету #${blank_to_check.id}.\n Скорее пишите друг другу в личные сообщения и ловите флешбеки вместе, станьте врагами уже сегодня с https://vk.com/id${account_from.idvk} !`)
                await Send_Message(account_from.idvk, `🔊 Недавно вам понравилась анкета #${blank_to_check.id}, знайте, что это взаимно на вашу анкету #${blank_from_check.id}.\n Скорее пишите друг другу в личные сообщения и ловите флешбеки вместе, станьте врагами уже сегодня с https://vk.com/id${account_to.idvk} !`)
                await Logger(`(private chat) ~ clicked like for <blank> #${blank_to_check.id} by <user> №${context.senderId}`)
                const ans_selector = `🌐 Анкеты №${blank_from_check.id} + №${blank_to_check.id} = [ролевики никогда]!`
                await Send_Message(chat_id, ans_selector)
            }
            if (corrected.text == '⚠ Жалоба') {
                await Blank_Report(context, account_to, blank_from_check, mail_build, target)
            }
            if (corrected.text == '🔪 Резать мразей как шаверму') {
                await Blank_Report_Admin(context, account_to, blank_from_check, mail_build, target)
            }
        }
        if (mail_build.length == 0) { await Send_Message(user_check.idvk, `😿 Письма кончились, приходите позже.`)}
        await Logger(`(private chat) ~ finished check self mail by <user> №${context.senderId}`)
        await Keyboard_Index(context, `⌛ Киберсовиная почта на связи, выдаем кнопку вызова спутника...`)
    })

    // ==================== РАНДОМ ====================
    hearManager.hear(/🎲 Рандом|!рандом|!Рандом/, async (context: any) => {
        if (context.peerType == 'chat') { return }
        const user_check = await prisma.account.findFirst({ where: { idvk: context.senderId } })
        const blank_check = await prisma.blank.findFirst({ where: { id_account: user_check?.id } })
        if (!user_check) { return }
        if (!blank_check) { return await context.send(`⚠ Создайте анкету`) }
        
        const hasTags = await checkBlankHasTags(blank_check.id);
        if (!hasTags) {
            const keyboard = new KeyboardBuilder()
                .textButton({ label: '🧲Настроить теги', payload: { command: 'tagator_blank_config' }, color: 'secondary' })
                .textButton({ label: '🚫', payload: { command: 'exit' }, color: 'secondary' })
                .oneTime().inline();
            
            await Send_Message(user_check.idvk, 
                `⚠ Для использования поиска необходимо настроить теги анкеты!\n\n` +
                `Минимальное количество тегов: 3\n\n` +
                `Нажмите "Настроить теги", чтобы добавить теги к анкете.`,
                keyboard
            );
            return;
        }
        
        if (blank_check.banned) {
            await context.send(`💔 Ваша анкета заблокирована из-за жалоб до разбирательств`)
            return
        }
        const banned_me = await User_Banned(context)
        if (banned_me) { return }
        await Online_Set(context)
        let blank_build = []
        let counter = 0
        
        const userPref = await getRomancePreferences(context.senderId);
        
        for (const blank of await prisma.$queryRaw<Blank[]>`SELECT * FROM Blank WHERE banned = false ORDER BY random() ASC`) {
            if (blank.id_account == user_check.id) { continue }
            const vision_check = await prisma.vision.findFirst({ where: { id_blank: blank.id, id_account: user_check.id } })
            if (vision_check) { continue }
            const user_bl_ch = await prisma.account.findFirst({ where: { id: blank.id_account}})
            const black_list_my = await prisma.blackList.findFirst({ where: { id_account: user_check.id, idvk: user_bl_ch?.idvk ?? 0 } })
            if (black_list_my) { continue }
            const black_list_other = await prisma.blackList.findFirst({ where: { id_account: user_bl_ch?.id ?? 0, idvk: user_check.idvk } })
            if (black_list_other) { continue }
            
            let blankTags: number[] = [];
            if (blank.tag) {
                try {
                    blankTags = JSON.parse(blank.tag);
                } catch {}
            }
            
            const compatible = await checkRomanceCompatibility(userPref, blankTags);
            if (!compatible) { continue; }
            
            if (counter > 50) { break }
            blank_build.push(blank)
            counter++
        }
        let ender = true
        await Logger(`(private chat) ~ starting check random blank by <user> №${context.senderId}`)
        while (ender && blank_build.length > 0) {
            const target = Math.floor(Math.random() * blank_build.length)
            const selector: Blank = blank_build[target]
            const blank_check2 = await prisma.blank.findFirst({ where: { id: selector.id } })
            if (!blank_check2) { 
                blank_build.splice(target, 1)
                await Send_Message(user_check.idvk, `⚠ Внимание, следующая анкета была удалена владельцем в процессе просмотра и изъята из поиска:\n\n📜 Анкета: ${selector.id}\n💬 Содержание: ${selector.text}\n `)
                continue
            }
            let censored = user_check.censored ? await Censored_Activation_Pro(selector.text) : selector.text
            
            const baseText = `📜 Анкета: ${selector.id}\n💬 Содержание:\n${censored}`;
            const formatted = await formatBlankWithTags(user_check.idvk, selector.id, baseText);
            const text = formatted.text;
            
            const keyboard = await Keyboard_Swap(blank_build.length, user_check);
            if (formatted.showTagsButton) {
                keyboard.callbackButton({ 
                    label: '🏷 Показать теги', 
                    payload: { command: 'show_tags', idb: selector.id },
                    color: 'secondary' 
                }).row();
            }
            
            const corrected: any = blank_check2.photo.includes('photo') 
                ? await context.question(text, {keyboard, answerTimeLimit, attachment: blank_check2.photo}) 
                : await context.question(text, {keyboard, answerTimeLimit})
            if (corrected.isTimeout) { 
                await context.send(`⏰ Время ожидания случайного поиска анкеты истекло!`); 
                await Keyboard_Index(context, `⌛ Обновление клавиатуры...`); 
                return 
            }
            const config: any = {
                '⛔ Мимо': Blank_Unlike,
                '✅ Отклик': Blank_Like,
                '✏ Письмо': Blank_Like_Donate,
                '⚠ Жалоба': Blank_Report,
                '🔪 Резать мразей как шаверму': Blank_Report_Admin,
                '🏷 Показать теги': async () => {
                    const tags = await getTagsForBlank(selector.id);
                    const kb = new KeyboardBuilder()
                        .callbackButton({ label: '⬅ Назад', payload: { command: 'exit' }, color: 'secondary' })
                        .oneTime().inline();
                    await Send_Message(user_check.idvk, `🏷 Теги анкеты #${selector.id}:\n\n${tags}`, kb);
                }
            }
            if (corrected.text in config) {
                const commandHandler = config[corrected.text];
                const ans = await commandHandler(context, user_check, selector, blank_build, target)
            } else {
                if (corrected.text == '🚫 Стоп' || corrected.text == '!стоп') {
                    await Send_Message(user_check.idvk, `✅ Успешная отмена рандомных анкет.`)
                    ender = false
                } else { await Send_Message(user_check.idvk, `💡 Жмите только по кнопкам с иконками!`) }
            }
        }
        if (blank_build.length == 0) { await Send_Message(user_check.idvk, `😿 Очередь анкет закончилась, попробуйте вызвать !рандом еще раз, иначе приходите позже.`)}
        await Logger(`(private chat) ~ finished check random blank by <user> №${context.senderId}`)
        await Keyboard_Index(context, `⌛ В рот этого казино! Выдаем кнопку вызова спутника...`)
    })

    // ==================== ПОИСК ====================
    hearManager.hear(/🔍 Поиск|!поиск|!Поиск/, async (context: any) => {
        if (context.peerType == 'chat') { return }
        const user_check = await prisma.account.findFirst({ where: { idvk: context.senderId } })
        const blank_check = await prisma.blank.findFirst({ where: { id_account: user_check?.id } })
        if (!user_check) { return }
        if (!blank_check) { return await context.send(`⚠ Создайте анкету`) }
        
        const hasTags = await checkBlankHasTags(blank_check.id);
        if (!hasTags) {
            const keyboard = new KeyboardBuilder()
                .textButton({ label: '🧲Настроить теги', payload: { command: 'tagator_blank_config' }, color: 'secondary' })
                .textButton({ label: '🚫', payload: { command: 'exit' }, color: 'secondary' })
                .oneTime().inline();
            
            await Send_Message(user_check.idvk, 
                `⚠ Для использования поиска необходимо настроить теги анкеты!\n\n` +
                `Минимальное количество тегов: 3\n\n` +
                `Нажмите "Настроить теги", чтобы добавить теги к анкете.`,
                keyboard
            );
            return;
        }
        
        if (blank_check.banned) {
            await context.send(`💔 Ваша анкета заблокирована из-за жалоб до разбирательств`)
            return
        }
        const banned_me = await User_Banned(context)
        if (banned_me) { return }
        await Online_Set(context)
        let blank_build = []
        await context.send(`⌛ Ожидайте, подбираем анкеты...`)
        
        const userPref = await getRomancePreferences(context.senderId);
        
        for (const blank of await prisma.$queryRaw<Blank[]>`SELECT * FROM Blank WHERE banned = false ORDER BY random() ASC`) {
            if (blank.id_account == user_check.id) { continue }
            const vision_check = await prisma.vision.findFirst({ where: { id_blank: blank.id, id_account: user_check.id } })
            if (vision_check) { continue }
            const user_bl_ch = await prisma.account.findFirst({ where: { id: blank.id_account}})
            const black_list_my = await prisma.blackList.findFirst({ where: { id_account: user_check.id, idvk: user_bl_ch?.idvk ?? 0 } })
            if (black_list_my) { continue }
            const black_list_other = await prisma.blackList.findFirst({ where: { id_account: user_bl_ch?.id ?? 0, idvk: user_check.idvk } })
            if (black_list_other) { continue }
            
            let blankTags: number[] = [];
            if (blank.tag) {
                try {
                    blankTags = JSON.parse(blank.tag);
                } catch {}
            }
            
            const compatible = await checkRomanceCompatibility(userPref, blankTags);
            if (!compatible) { continue; }
            
            const result = await Researcher_Better_Blank_Target_Old(blank_check.text, blank);
            blank_build.push(result);
            blank_build.sort((a, b) => b.score - a.score)
            blank_build.length = Math.min(blank_build.length, 50); 
        }
        let ender = true
        await Logger(`(private chat) ~ starting check random blank by <user> №${context.senderId}`)
        while (ender && blank_build.length > 0) {
            const selector: Match = blank_build[0]
            const blank_check2 = await prisma.blank.findFirst({ where: { id: selector.id } })
            if (!blank_check2) { 
                blank_build.splice(0, 1)
                await Send_Message(user_check.idvk, `⚠ Внимание, следующая анкета была удалена владельцем в процессе просмотра и изъята из поиска:\n\n📜 Анкета: ${selector.id}\n💬 Содержание: ${selector.text}\n `)
                continue
            }
            let censored = user_check.censored ? await Censored_Activation_Pro(selector.text) : selector.text
            
            const baseText = `📜 Анкета: ${selector.id}\n🔎 Совпадение: ${(selector.score*100).toFixed(2)}%\n💬 Содержание:\n${censored}`;
            const formatted = await formatBlankWithTags(user_check.idvk, selector.id, baseText);
            const text = formatted.text;
            
            const keyboard = await Keyboard_Swap(blank_build.length, user_check);
            if (formatted.showTagsButton) {
                keyboard.callbackButton({ 
                    label: '🏷 Показать теги', 
                    payload: { command: 'show_tags', idb: selector.id },
                    color: 'secondary' 
                }).row();
            }
            
            const corrected: any = blank_check2.photo.includes('photo') 
                ? await context.question(text, {keyboard, answerTimeLimit, attachment: blank_check2.photo}) 
                : await context.question(text, {keyboard, answerTimeLimit})
            if (corrected.isTimeout) { 
                await context.send(`⏰ Время ожидания поиска анкеты истекло!`); 
                await Keyboard_Index(context, `⌛ Обновление клавиатуры...`); 
                return 
            }
            const config: any = {
                '⛔ Мимо': Blank_Unlike,
                '✅ Отклик': Blank_Like,
                '✏ Письмо': Blank_Like_Donate,
                '⚠ Жалоба': Blank_Report,
                '🔪 Резать мразей как шаверму': Blank_Report_Admin,
                '🏷 Показать теги': async () => {
                    const tags = await getTagsForBlank(selector.id);
                    const kb = new KeyboardBuilder()
                        .callbackButton({ label: '⬅ Назад', payload: { command: 'exit' }, color: 'secondary' })
                        .oneTime().inline();
                    await Send_Message(user_check.idvk, `🏷 Теги анкеты #${selector.id}:\n\n${tags}`, kb);
                }
            }
            if (corrected.text in config) {
                const commandHandler = config[corrected.text];
                const ans = await commandHandler(context, user_check, selector, blank_build, 0)
            } else {
                if (corrected.text == '🚫 Стоп' || corrected.text == '!стоп') {
                    await Send_Message(user_check.idvk, `✅ Успешная отмена поиска анкет.`)
                    ender = false
                } else { await Send_Message(user_check.idvk, `💡 Жмите только по кнопкам с иконками!`) }
            }
        }
        if (blank_build.length == 0) { await Send_Message(user_check.idvk, `😿 Очередь анкет закончилась, попробуйте вызвать !рандом еще раз, иначе приходите позже.`)}
        await Logger(`(private chat) ~ finished check random blank by <user> №${context.senderId}`)
        await Keyboard_Index(context, `⌛ А давайте закроем глаза и представим того самого человека... Выдаем кнопку вызова спутника...`)
    })

    // ==================== БРАУЗЕР ====================
    hearManager.hear(/🌐 Браузер|!браузер|!Браузер/, async (context: any) => {
        if (context.peerType == 'chat') { return }
        const user_check = await prisma.account.findFirst({ where: { idvk: context.senderId } })
        const blank_check = await prisma.blank.findFirst({ where: { id_account: user_check?.id } })
        if (!user_check) { return }
        if (!blank_check) { return await context.send(`⚠ Создайте анкету`) }
        
        const hasTags = await checkBlankHasTags(blank_check.id);
        if (!hasTags) {
            const keyboard = new KeyboardBuilder()
                .textButton({ label: '🧲Настроить теги', payload: { command: 'tagator_blank_config' }, color: 'secondary' })
                .textButton({ label: '🚫', payload: { command: 'exit' }, color: 'secondary' })
                .oneTime().inline();
            
            await Send_Message(user_check.idvk, 
                `⚠ Для использования браузера необходимо настроить теги анкеты!\n\n` +
                `Минимальное количество тегов: 3\n\n` +
                `Нажмите "Настроить теги", чтобы добавить теги к анкете.`,
                keyboard
            );
            return;
        }
        
        if (blank_check.banned) {
            await context.send(`💔 Ваша анкета заблокирована из-за жалоб до разбирательств`)
            return
        }
        const banned_me = await User_Banned(context)
        if (banned_me) { return }
        await Online_Set(context)
        if (!await checkGroupSubscriber(context.senderId, group_id_now)) {
            return
        }
        const ans = await Blank_Browser(context, user_check)
        if (!ans.status) { return await context.send(`🔧 Вы отменили поиск в браузере`) }
        let blank_build = []
        await context.send(`⌛ Ожидайте, подбираем анкеты...`)
        
        const userPref = await getRomancePreferences(context.senderId);
        
        for (const blank of await prisma.$queryRaw<Blank[]>`SELECT * FROM Blank WHERE banned = false ORDER BY random() ASC`) {
            if (blank.id_account == user_check.id) { continue }
            const vision_check = await prisma.vision.findFirst({ where: { id_blank: blank.id, id_account: user_check.id } })
            if (vision_check) { continue }
            const user_bl_ch = await prisma.account.findFirst({ where: { id: blank.id_account}})
            const black_list_my = await prisma.blackList.findFirst({ where: { id_account: user_check.id, idvk: user_bl_ch?.idvk ?? 0 } })
            if (black_list_my) { continue }
            const black_list_other = await prisma.blackList.findFirst({ where: { id_account: user_bl_ch?.id ?? 0, idvk: user_check.idvk } })
            if (black_list_other) { continue }
            
            let blankTags: number[] = [];
            if (blank.tag) {
                try {
                    blankTags = JSON.parse(blank.tag);
                } catch {}
            }
            
            const compatible = await checkRomanceCompatibility(userPref, blankTags);
            if (!compatible) { continue; }
            
            blank_build.push(await Researcher_Better_Blank_Target(ans.text.slice(0, 64), blank))
            blank_build.sort((a, b) => b.score - a.score)
            blank_build.length = Math.min(blank_build.length, 50); 
        }
        
        let ender = true
        await Logger(`(private chat) ~ starting check browser blank by <user> №${context.senderId}`)
        while (ender && blank_build.length > 0) {
            const selector: Match = blank_build[0]
            const blank_check2 = await prisma.blank.findFirst({ where: { id: selector.id } })
            if (!blank_check2) { 
                blank_build.splice(0, 1)
                await Send_Message(user_check.idvk, `⚠ Внимание, следующая анкета была удалена владельцем в процессе просмотра и изъята из поиска:\n\n📜 Анкета: ${selector.id}\n💬 Содержание: ${selector.text}\n `)
                continue
            }
            let censored = user_check.censored ? await Censored_Activation_Pro(selector.text) : selector.text
            
            const baseText = `📜 Анкета: ${selector.id}\n🔎 Совпадение: ${(selector.score*100).toFixed(2)}%\n💬 Содержание:\n${censored}`;
            const formatted = await formatBlankWithTags(user_check.idvk, selector.id, baseText);
            const text = formatted.text;
            
            const keyboard = await Keyboard_Swap(blank_build.length, user_check);
            if (formatted.showTagsButton) {
                keyboard.callbackButton({ 
                    label: '🏷 Показать теги', 
                    payload: { command: 'show_tags', idb: selector.id },
                    color: 'secondary' 
                }).row();
            }
            
            const corrected: any = blank_check2.photo.includes('photo') 
                ? await context.question(text, {keyboard, answerTimeLimit, attachment: blank_check2.photo}) 
                : await context.question(text, {keyboard, answerTimeLimit})
            if (corrected.isTimeout) { 
                await context.send(`⏰ Время ожидания серфинга анкет истекло!`); 
                await Keyboard_Index(context, `⌛ Обновление клавиатуры...`); 
                return 
            }
            const config: any = {
                '⛔ Мимо': Blank_Unlike,
                '✅ Отклик': Blank_Like,
                '✏ Письмо': Blank_Like_Donate,
                '⚠ Жалоба': Blank_Report,
                '🔪 Резать мразей как шаверму': Blank_Report_Admin,
                '🏷 Показать теги': async () => {
                    const tags = await getTagsForBlank(selector.id);
                    const kb = new KeyboardBuilder()
                        .callbackButton({ label: '⬅ Назад', payload: { command: 'exit' }, color: 'secondary' })
                        .oneTime().inline();
                    await Send_Message(user_check.idvk, `🏷 Теги анкеты #${selector.id}:\n\n${tags}`, kb);
                }
            }
            if (corrected.text in config) {
                const commandHandler = config[corrected.text];
                const ans2 = await commandHandler(context, user_check, selector, blank_build, 0)
            } else {
                if (corrected.text == '🚫 Стоп' || corrected.text == '!стоп') {
                    await Send_Message(user_check.idvk, `✅ Успешная отмена поиска анкет через браузер.`)
                    ender = false
                } else { await Send_Message(user_check.idvk, `💡 Жмите только по кнопкам с иконками!`) }
            }
        }
        if (blank_build.length == 0) { await Send_Message(user_check.idvk, `😿 Очередь анкет закончилась, попробуйте вызвать !браузер еще раз, иначе приходите позже.`)}
        await Logger(`(private chat) ~ finished check browser blank by <user> №${context.senderId}`)
        await Keyboard_Index(context, `⌛ Хватит искать и серфить? Нет, не хватит, выдаем кнопку вызова спутника...`)
    })

    // ==================== АНКЕТА ====================
    hearManager.hear(/📃 Моя анкета|!анкета|!Анкета/, async (context: any) => {
        if (context.peerType == 'chat') { return }
        const user_check = await prisma.account.findFirst({ where: { idvk: context.senderId } })
        if (!user_check) { return }
        const banned_me = await User_Banned(context)
        if (banned_me) { return }
        await Online_Set(context)
        const blank_check = await prisma.blank.findFirst({ where: { id_account: user_check.id } })
        if (!blank_check) {
            let ender = true
            let text_input = ``
            let status_check = ``
            await Logger(`(private chat) ~ starting creation self blank by <user> №${context.senderId}`)
            while (ender) {
                let censored = user_check.censored ? await Censored_Activation_Pro(text_input) : text_input
                const corrected: any = await context.question(`🧷 У вас еще нет анкеты, введите анкету от 30 до 3500 символов, английские символы запрещены: \n 💡Вы можете указать: пол, возраст, минимальный порог строк, желаемые жанры или же сюжет... другие нюансы.\n📝 Сейчас заполнено:\n${censored}\n\n${status_check}`,
                    {	
                        keyboard: Keyboard.builder()
                        .textButton({ label: '!сохранить', payload: { command: 'student' }, color: 'secondary' })
                        .textButton({ label: '!отмена', payload: { command: 'citizen' }, color: 'secondary' })
                        .oneTime().inline(),
                        answerTimeLimit
                    }
                )
                if (corrected.isTimeout) { await context.send(`⏰ Время ожидания создания анкеты истекло!`); await Keyboard_Index(context, `⌛ Обновление клавиатуры...`); return }
                if (corrected.text == '!сохранить') {
                    if (text_input.length < 30) { await context.send(`Анкету от 30 символов надо!`); continue }
                    ender = false
                } else {
                    if (corrected.text == '!отмена') {
                        await context.send(`🔧 Вы отменили создание анкеты`)
                        ender = false
                        await Keyboard_Index(context, `⌛ Обновление клавиатуры...`); 
                        return 
                    } else {
                        text_input = await Blank_Cleaner(corrected.text)
                        text_input = text_input.length < 3600 ? text_input : text_input.slice(0,3600)
                        status_check = `⚠ В анкете зарегистрировано ${text_input?.length} из ${corrected.text?.length} введенных вами символов, убедитесь в корректном отображении анкеты!`
                    }
                }
            }
            const corrected: any = await context.question(`🧷 Прикрепите не более 2 фотографий`,
                {	
                    keyboard: Keyboard.builder()
                    .textButton({ label: 'Буду без картинки', payload: { command: 'student' }, color: 'secondary' })
                    .oneTime().inline(),
                    answerTimeLimit
                }
            )
            if (corrected.isTimeout) { await context.send(`⏰ Время ожидания создания анкеты истекло!`); await Keyboard_Index(context, `⌛ Обновление клавиатуры...`); return }
            const photo_link = corrected.text && corrected.text == 'Буду без картинки' ? '' : await Photo_Upload_Pro(corrected)
            const save = await prisma.blank.create({ data: { text: text_input, id_account: user_check.id, photo: photo_link } })
            await context.send(`🔧 Вы успешно создали анкетку-конфетку под UID: ${save.id}`)
            
            const tagKeyboard = await Keyboard_Tag_Constructor([], 'tagator_blank_config', 'main_menu');
            await Send_Message(user_check.idvk, 
                `⚠ Теперь необходимо настроить теги для вашей анкеты.\n\n` +
                `Минимальное количество тегов: 3\n` +
                `Без тегов ваша анкета не будет показываться в поиске!\n\n` +
                `📎 Настройте теги своей анкеты:`,
                tagKeyboard
            );
            
        } else {
            const blank = await prisma.blank.findFirst({ where: { id_account: user_check.id } })
            await Logger(`(private chat) ~ starting self blank is viewed by <user> №${context.senderId}`)
            if (blank) {
                const datenow: any = new Date()
                const dateold: any = new Date(blank.crdate)
                const timeouter = 86400000
                const canEdit = datenow - dateold <= timeouter;
                
                const keyboard = new KeyboardBuilder()
                .textButton({ label: `⛔Удалить ${blank.id}`, payload: { command: 'card_enter' }, color: 'secondary' }).row()
                
                if (canEdit) {
                    keyboard.textButton({ label: `✏Изменить ${blank.id}`, payload: { command: 'inventory_enter' }, color: 'secondary' })
                }
                keyboard.row()
                
				keyboard.callbackButton({ label: `🧲Настроить теги ${blank.id}`, payload: { command: 'tagator_blank_config' }, color: 'secondary' }).row()
				keyboard.callbackButton({ label: `⚙Отображение тегов`, payload: { command: 'tag_display_settings' }, color: 'secondary' }).row()
                keyboard.callbackButton({ label: '🚫', payload: { command: 'exit' }, color: 'secondary' }).oneTime().inline()
                
                const count_vision = await prisma.vision.count({ where: { id_blank: blank.id } })
                const count_max_vision = await prisma.blank.count({})
                const count_success = await prisma.mail.count({ where: { blank_to: blank.id, read: true, status: true }})
                const count_ignore = await prisma.mail.count({ where: { blank_to: blank.id, read: true, status: false }})
                const count_wrong = await prisma.mail.count({ where: { blank_to: blank.id, read: true, find: false }})
                const count_unread = await prisma.mail.count({ where: { blank_to: blank.id, read: false }})
                const counter_warn = await prisma.report.count({ where: { id_blank: blank.id } })
                let censored = user_check.censored ? await Censored_Activation_Pro(blank.text) : blank.text
                
                let tagsText = '';
                if (blank.tag) {
                    try {
                        const tagIds = JSON.parse(blank.tag);
                        const tagNames = tagIds.map((id: number) => {
                            const tag = tag_list.find(t => t.id === id);
                            return tag ? tag.text : '';
                        }).filter(Boolean);
                        if (tagNames.length > 0) {
                            tagsText = `\n🏷 Теги: ${tagNames.join(', ')}`;
                        }
                    } catch {}
                }
                
                const message = `📜 Анкета: ${blank.id}\n💬 Содержание:\n${censored}\n👁 Просмотров: ${count_vision}/${-1+count_max_vision}\n⚠ Предупреждений: ${counter_warn}/3\n✅ Принятых: ${count_success}\n🚫 Игноров: ${count_ignore}\n⌛ Ожидает: ${count_unread}\n❗ Потеряшек: ${count_wrong}${tagsText}`
                
                if (blank.photo.includes('photo')) {
                    await Send_Message(user_check.idvk, message, keyboard, blank.photo)
                } else {
                    await Send_Message(user_check.idvk, message, keyboard)
                }
            }
        }
        await Logger(`(private chat) ~ finished self blank is viewed by <user> №${context.senderId}`)
        await Keyboard_Index(context, `⌛ Анкета — это повод рассказать о себе или о других?`)
    })

    // ==================== УДАЛЕНИЕ АНКЕТЫ ====================
    hearManager.hear(/⛔Удалить|!удалить/, async (context: any) => {
        if (context.peerType == 'chat') { return }
        const user_check = await prisma.account.findFirst({ where: { idvk: context.senderId } })
        if (!user_check) { return }
        const banned_me = await User_Banned(context)
        if (banned_me) { return }
        await Online_Set(context)
        const [cmd, value] = context.text.split(' ');
        const target = parseInt(value)
        const blank_check = await prisma.blank.findFirst({ where: { id_account: user_check.id, id: target } })
        if (!blank_check) { return }
        if (blank_check.banned) {
            await context.send(`💔 Ваша анкета заблокирована из-за жалоб до разбирательств`)
            return
        }
        const confirm: { status: boolean, text: String } = await Confirm_User_Success(context, `удалить свою анкету №${blank_check.id}?`)
        await context.send(`${confirm.text}`)
        if (!confirm.status) { return; }
        const blank_delete = await prisma.blank.delete({ where: { id: blank_check.id } })
        if (blank_delete) { 
            await Send_Message(user_check.idvk, `✅ Успешно удалено:\n📜 Анкета: ${blank_delete.id}\n💬 Содержание:\n${blank_delete.text}`)
            await Logger(`(private chat) ~ deleted self <blank> #${blank_delete.id} by <user> №${context.senderId}`)
        }
        await Keyboard_Index(context, `⌛ Удаление — мать учения, выдаем кнопку вызова спутника...`)
    })

    // ==================== ИЗМЕНЕНИЕ АНКЕТЫ ====================
    hearManager.hear(/✏Изменить|!изменить/, async (context: any) => {
        if (context.peerType == 'chat') { return }
        const user_check = await prisma.account.findFirst({ where: { idvk: context.senderId } })
        if (!user_check) { return }
        const banned_me = await User_Banned(context)
        if (banned_me) { return }
        await Online_Set(context)
        const [cmd, value] = context.text.split(' ');
        const target = parseInt(value)
        const blank_check = await prisma.blank.findFirst({ where: { id_account: user_check.id, id: target } })
        if (!blank_check) { return }
        if (blank_check.banned) {
            await context.send(`💔 Ваша анкета заблокирована из-за жалоб до разбирательств`)
            return
        }
        const datenow: any = new Date()
        const dateold: any = new Date(blank_check.crdate)
        const timeouter = 86400000
        if (datenow-dateold > timeouter) { return await context.send(`⚠ Анкете больше суток, редактирование запрещено`) }
        const confirm: { status: boolean, text: String } = await Confirm_User_Success(context, `изменить свою анкету №${blank_check.id}?`)
        await context.send(`${confirm.text}`)
        if (!confirm.status) { return; }
        let ender = true
        let text_input = blank_check.text
        let status_check = ``
        while (ender) {
            let censored = user_check.censored ? await Censored_Activation_Pro(text_input) : text_input
            const corrected: any = await context.question(`🧷 Вы редактируете анкету ${blank_check.id}, напоминаем, анкета должна быть до 4000 символов:\n📝 текущая анкета: ${censored}\n ${status_check}`,
                {	
                    keyboard: Keyboard.builder()
                    .textButton({ label: '!сохранить', payload: { command: 'student' }, color: 'secondary' })
                    .textButton({ label: '!отмена', payload: { command: 'citizen' }, color: 'secondary' })
                    .oneTime().inline(),
                    answerTimeLimit
                }
            )
            if (corrected.isTimeout) { await context.send(`⏰ Время ожидания редактирования анкеты истекло!`); await Keyboard_Index(context, `⌛ Обновление клавиатуры...`); return }
            if (corrected.text == '!сохранить') {
                if (text_input.length < 30) { await context.send(`⚠ Анкету от 30 символов надо!`); continue }
                ender = false
            } else {
                if (corrected.text == '!отмена') {
                    await context.send(`🔧 Вы отменили редактирование анкеты`)
                    ender = false
                    await Keyboard_Index(context, `⌛ Обновление клавиатуры...`); 
                    return 
                } else {
                    text_input = await Blank_Cleaner(corrected.text)
                    text_input = text_input.length < 3600 ? text_input : text_input.slice(0,3600)
                    status_check = `⚠ В анкете зарегистрировано ${text_input?.length} из ${corrected.text?.length} введенных вами символов, убедитесь в корректном отображении анкеты!`
                }
            }
        }
        const corrected: any = await context.question(`🧷 Прикрепите не более 2 фотографий`,
            {	
                keyboard: Keyboard.builder()
                .textButton({ label: 'Буду без картинки', payload: { command: 'student' }, color: 'secondary' })
                .oneTime().inline(),
                answerTimeLimit
            }
        )
        if (corrected.isTimeout) { await context.send(`⏰ Время ожидания создания анкеты истекло!`); await Keyboard_Index(context, `⌛ Обновление клавиатуры...`); return }
        const photo_link = corrected.text && corrected.text == 'Буду без картинки' ? '' : await Photo_Upload_Pro(corrected)
        const blank_edit = await prisma.blank.update({ where: { id: blank_check.id }, data: { text: text_input, photo: photo_link } })
        if (blank_edit.photo.includes('photo')) {
            await Send_Message(user_check.idvk, `✅ Успешно изменено:\n📜 Анкета: ${blank_edit.id}\n💬 Содержание:\n${blank_edit.text}`, undefined, blank_edit.photo)
        } else {
            await Send_Message(user_check.idvk, `✅ Успешно изменено:\n📜 Анкета: ${blank_edit.id}\n💬 Содержание:\n${blank_edit.text}`)
        }
        await Logger(`(private chat) ~ finished edit self <blank> #${blank_check.id} by <user> №${context.senderId}`)
        await Keyboard_Index(context, `⌛ Изменение — отец учения, выдаем кнопку вызова спутника...`)
    })

    // ==================== ЦЕНЗУРА ====================
    hearManager.hear(/⚙ Цензура|!цензура|!Цензура/, async (context: any) => {
        if (context.peerType == 'chat') { return }
        const user_check = await prisma.account.findFirst({ where: { idvk: context.senderId } })
        if (!user_check) { return }
        const banned_me = await User_Banned(context)
        if (banned_me) { return }
        await Online_Set(context)
        const censored_change = await prisma.account.update({ where: { id: user_check.id }, data: { censored: user_check.censored ? false : true } })
        if (censored_change) { 
            await Send_Message(user_check.idvk, `🔧 Цензура ${censored_change.censored ? 'активирована' : 'отключена'}`)
            await Logger(`(private chat) ~ changed status activity censored self by <user> №${context.senderId}`)
        }
        await Keyboard_Index(context, `⌛ Ух ты, сейчас как все запикается! Выдаем кнопку вызова спутника...`)
    })

    // ==================== ПРАВА (админ) ====================
    hearManager.hear(/!права|!Права/, async (context) => {
        if (context.peerType == 'chat') { return }
        if (context.isOutbox == false && (context.senderId == root || await Accessed(context) != 'user') && context.text) {
            const target: number = Number(await Parser_IDVK(context.text)) || 0
            if (target > 0) {
                const user: Account | null = await prisma.account.findFirst({ where: { idvk: target } })
                if (user) {
                    await Online_Set(context)
                    const login = await prisma.account.update({ where: { id: user.id }, data: { id_role: user.id_role == 1 ? 2 : 1 } })
                    await context.send(`🔧 @id${login.idvk}(Пользователь) ${login.id_role == 2 ? 'добавлен в лист администраторов' : 'убран из листа администраторов'}`)
                    await Send_Message(login.idvk, `🔧 Вы ${login.id_role == 2 ? 'добавлены в лист администраторов' : 'убраны из листа администраторов'}`)
                    await Send_Message(chat_id, `🔧 @id${login.idvk}(Пользователь) ${login.id_role == 2 ? 'добавлен в лист администраторов' : 'убран из листа администраторов'}`)
                    await Logger(`(private chat) ~ changed role <${login.id_role == 2 ? 'admin' : 'user'}> for #${login.idvk} by <admin> №${context.senderId}`)
                } else {
                    await context.send(`@id${target}(Пользователя) не существует`)
                    await Logger(`(private chat) ~ not found <user> #${target} by <admin> №${context.senderId}`)
                }
            }
        }
        await Keyboard_Index(context, `⌛ Сегодня дали права — завтра отжали!`)
    })

    // ==================== МОДЕРАЦИЯ ====================
    hearManager.hear(/⚖ Модерация|!модерация|!Модерация/, async (context: any) => {
        if (context.peerType == 'chat') { return }
        const user_check = await prisma.account.findFirst({ where: { idvk: context.senderId } })
        if (!user_check) { return }
        await Online_Set(context)
        const blank_check = await prisma.blank.findFirst({ where: { id_account: user_check?.id } })
        if (await Accessed(context) == 'user') { return }
        const blank_build = []
        for (const blank of await prisma.blank.findMany({ where: { banned: true } })) {
            blank_build.push(blank)
        }
        let ender = true
        await Logger(`(private chat) ~ starting check banned blanks by <admin> №${context.senderId}`)
        while (ender && blank_build.length > 0) {
            const target = Math.floor(Math.random() * blank_build.length)
            const selector: Blank = blank_build[target]
            for (const report of await prisma.report.findMany({ where: { id_blank: selector.id, status: 'wait' } })) {
                const user = await prisma.account.findFirst({ where: { id: report.id_account } })
                await context.send(`🗿 Жалоба от @id${user?.idvk}(КрысаХ):\n💬 Заявление: ${report.text}\n\n`)
            }
            const user_warned = await prisma.account.findFirst({ where: { id: selector.id_account } })
            const text = `⚖ Вершится суд над следующей анкетой и ее автором:\n📜 Анкета: ${selector.id}\n👤 Автор: https://vk.com/id${user_warned?.idvk}\n💬 Содержание:\n${selector.text}`
            const keyboard = new KeyboardBuilder()
            .textButton({ label: '⛔Отклонить', payload: { command: 'student' }, color: 'secondary' })
            .textButton({ label: '✅Заверить', payload: { command: 'citizen' }, color: 'secondary' }).row()
            .textButton({ label: '🚫Стоп', payload: { command: 'citizen' }, color: 'secondary' })
            .oneTime().inline()
            const corrected: any = selector.photo.includes('photo') ? await context.question( text, {keyboard, answerTimeLimit, attachment: selector.photo}) : await context.question( text, {keyboard, answerTimeLimit})
            if (corrected.isTimeout) { await context.send(`⏰ Время ожидания судебной системы истекло!`); await Keyboard_Index(context, `⌛ Обновление клавиатуры...`); return }
            if (corrected.text == '🚫Стоп' || corrected.text == '!стоп') {
                await Send_Message(user_check.idvk, `✅ Успешная отмена просмотра заблокированных анкет.`)
                ender = false
            }
            if (corrected.text == '⛔Отклонить' || corrected.text == '!отклонить') {
                for (const report of await prisma.report.findMany({ where: { id_blank: selector.id, status: 'wait' } })) {
                    await prisma.report.update({ where: { id: report.id }, data: { status: 'denied'}})
                    const user = await prisma.account.findFirst({ where: { id: report.id_account } })
                    await Send_Message(user!.idvk, `⛔ Ваша жалоба на анкету ${selector.id} отклонена.`)
                }
                const warn_skip = await prisma.blank.update({ where: { id: selector.id }, data: { banned: false } })
                blank_build.splice(target, 1)
                await Send_Message(user_warned!.idvk, `✅ Ваша анкета #${selector.id} была оправдана, доступ разблокирован.`)
                await Logger(`(private chat) ~ unlock for <blank> #${selector.id} by <admin> №${context.senderId}`)
                await Send_Message(user_check.idvk, `✅ Оправдали владельца анкеты #${selector.id}`)
            }
            if (corrected.text == '✅Заверить' || corrected.text == '!заверить') {
                for (const report of await prisma.report.findMany({ where: { id_blank: selector.id, status: 'wait' } })) {
                    await prisma.report.update({ where: { id: report.id }, data: { status: 'success'}})
                    const user = await prisma.account.findFirst({ where: { id: report.id_account } })
                    await Send_Message(user!.idvk, `✅ Ваша жалоба на анкету ${selector.id} принята, спасибо за службу.`)
                }
                const warn_skip = await prisma.blank.delete({ where: { id: selector.id } })
                blank_build.splice(target, 1)
                await Send_Message(user_warned!.idvk, `⛔ Ваша анкета #${selector.id} нарушает правила, она удалена, в следующий раз будьте бдительней, поставили вас на учет.`)
                await Logger(`(private chat) ~ warn success for <blank> #${selector.id} by <admin> №${context.senderId}`)
                await Send_Message(user_check.idvk, `✅ Выдали пред владельцу анкеты #${selector.id}`)
            }
        }
        if (blank_build.length == 0) { await Send_Message(user_check.idvk, `😿 Забаненные анкеты кончились, приходите позже.`)}
        await Logger(`(private chat) ~ finished check banned blanks by <admin> №${context.senderId}`)
        await Keyboard_Index(context, `⌛ Система правосудия — это отстойно... Выдаем кнопку вызова спутника...`)
    })

    // ==================== БАН (админ) ====================
    hearManager.hear(/!бан|!Бан/, async (context) => {
        if (context.peerType == 'chat') { return }
        if (context.isOutbox == false && (context.senderId == root || await Accessed(context) != 'user') && context.text) {
            const target = await Parser_IDVK(context.text)
            if (!target) { return }
            const user: Account | null = await prisma.account.findFirst({ where: { idvk: Number(target) } })
            if (user) {
                await Online_Set(context)
                const login = await prisma.account.update({ where: { id: user.id }, data: { banned: user.banned ? false : true } })
                await context.send(`🔧 @id${login.idvk}(Пользователь) ${login.banned ? 'добавлен в лист забаненных' : 'убран из листа забаненных'}`)
                await Send_Message(login.idvk, `🔧 Вы ${login.banned ? 'добавлены в лист забаненных' : 'убраны из листа забаненных'}`)
                await Send_Message(chat_id, `🔧 @id${login.idvk}(Пользователь) ${login.banned ? 'добавлен в лист забаненных' : 'убран из листа забаненных'}`)
                await Logger(`(private chat) ~ banned status changed <${login.banned ? 'true' : 'false'}> for #${login.idvk} by <admin> №${context.senderId}`)
                const blank_block = await prisma.blank.findFirst({ where: { id_account: login.id } })
                if (!blank_block) { return await Keyboard_Index(context, `⌛  У ламината не было анкеты!`)}
                const blank_del = await prisma.blank.delete({ where: { id: blank_block.id } })
                if (!blank_del) { return }
                await Send_Message(login.idvk, `🔧 Анкета ${blank_del.id} была удалена:\n ${blank_del.text}`)
            } else {
                await context.send(`⚠ @id${target}(Пользователя) не существует`)
                await Logger(`(private chat) ~ not found <user> #${target} for ban by <admin> №${context.senderId}`)
            }
        }
        await Keyboard_Index(context, `⌛  Забаньте меня полностью!`)
    })

    // ==================== ДОНАТЕР (админ) ====================
    hearManager.hear(/!донатер|!Донатер/, async (context) => {
        if (context.peerType == 'chat') { return }
        if (context.isOutbox == false && (context.senderId == root || await Accessed(context) != 'user') && context.text) {
            const target = await Parser_IDVK(context.text)
            if (!target) { return }
            const user: Account | null = await prisma.account.findFirst({ where: { idvk: Number(target) } })
            if (user) {
                await Online_Set(context)
                const login = await prisma.account.update({ where: { id: user.id }, data: { donate: user.donate ? false : true } })
                await context.send(`🔧 @id${login.idvk}(Пользователь) ${login.donate ? 'добавлен в лист донатеров' : 'убран из листа донатеров'}`)
                await Send_Message(login.idvk, `🔧 Вы ${login.donate ? 'добавлены в лист донатеров' : 'убраны из листа донатеров'}`)
                await Send_Message(chat_id, `🔧 @id${login.idvk}(Пользователь) ${login.donate ? 'добавлен в лист донатеров' : 'убран из листа донатеров'}`)
                await Logger(`(private chat) ~ donate status changed <${login.donate ? 'true' : 'false'}> for #${login.idvk} by <admin> №${context.senderId}`)
            } else {
                await context.send(`⚠ @id${target}(Пользователя) не существует`)
                await Logger(`(private chat) ~ not found <user> #${target} for donate status by <admin> №${context.senderId}`)
            }
        }
        await Keyboard_Index(context, `⌛ Мы ответственны за тех, кто задонатил!`)
    })

    // ==================== БАНХАММЕР ====================
    hearManager.hear(/☠ Банхаммер|!чс|!Чс/, async (context) => {
        if (context.peerType == 'chat') { return }
        await BlackList_Printer(context)
        await Keyboard_Index(context, `⌛ Туда их всех, не так ли?!`)
    })

    // ==================== ЕНОТИК (бэкап) ====================
    hearManager.hear(/!енотик/, async (context: any) => {
        if (context.peerType == 'chat') { return }
        const user_check = await prisma.account.findFirst({ where: { idvk: context.senderId } })
        if (!user_check) { return }
        if (context.senderId != root && user_check.id_role != 2) { return }
        await Online_Set(context)
        await context.sendDocuments({ value: `./prisma/dev.db`, filename: `dev.db` }, { message: '💡 Открывать на сайте: https://sqliteonline.com/' } );
        await vk.api.messages.send({
            peer_id: chat_id,
            random_id: 0,
            message: `‼ @id${context.senderId}(Admin) делает бекап баз данных dev.db.`
        })
        await Logger(`In private chat, did backup database by admin ${context.senderId}`)
        await Keyboard_Index(context, `⌛ Резервное копирование, как зарядка: сегодня делаешь — завтра нет!`)
    })

    // ==================== ТЕГИ — ОБРАБОТЧИК ПАГИНАЦИИ ====================
    hearManager.hear(/tag_page/, async (context: any) => {
        if (context.peerType == 'chat') { return }
        await handleTagPage(context, context.eventPayload);
    })

    // ==================== ТЕГИ — НАСТРОЙКА ПРЕДПОЧТЕНИЙ (что искать) ====================
    hearManager.hear(/tagator_research_config_like/, async (context: any) => {
        if (context.peerType == 'chat') { return }
        const user_check = await prisma.account.findFirst({ where: { idvk: context.senderId } })
        if (!user_check) { return }
        
        let currentTags: number[] = [];
        if (user_check.tag_like) {
            try {
                currentTags = JSON.parse(user_check.tag_like);
            } catch {}
        }
        
        const tagId = context.eventPayload?.id;
        if (tagId) {
            const id = Number(tagId);
            
            if (age_required_tags.includes(id)) {
                const verified = await isAgeVerified(context.senderId);
                if (!verified) {
                    const ageOk = await requestAgeVerification(context);
                    if (!ageOk) {
                        // Возвращаем меню без изменений
                        const keyboard = await Keyboard_Tag_Constructor(currentTags, 'tagator_research_config_like', 'tagator_menu', context.eventPayload?.page || 0);
                        await Send_Message(user_check.idvk, `🔞 Для выбора этого тега требуется подтверждение возраста.`, keyboard);
                        return;
                    }
                }
                
				if (romance_related_tags.includes(id)) {
					const prefs = await getRomancePreferences(context.senderId);
					if (prefs.length === 0) {
						const result = await requestRomancePreference(context);
						if (result === false) {
							const keyboard = await Keyboard_Tag_Constructor(currentTags, 'tagator_research_config_like', 'tagator_menu', context.eventPayload?.page || 0);
							await Send_Message(user_check.idvk, `⚠ Настройка предпочтений прервана.`, keyboard);
							return;
						}
					}
				}
            }
            
            if (currentTags.includes(id)) {
                currentTags = currentTags.filter(t => t !== id);
            } else {
                currentTags.push(id);
            }
            
            await prisma.account.update({
                where: { id: user_check.id },
                data: { tag_like: JSON.stringify(currentTags) }
            });
        }
        
        const page = context.eventPayload?.page || 0;
        const keyboard = await Keyboard_Tag_Constructor(currentTags, 'tagator_research_config_like', 'tagator_menu', page);
        
        let message = `📎 Настройте теги, по которым будет искать тегатор:\n\n`;
        const selectedText = currentTags.length > 0 
            ? `✅ Выбрано: ${currentTags.map(id => getTagById(id)).filter(Boolean).join(', ')}\n`
            : `❌ Ничего не выбрано\n`;
        message += selectedText;
        
        await Send_Message(user_check.idvk, message, keyboard);
        await Logger(`(tagator config) ~ configuring like tags for @${user_check.idvk}`);
    })

    // ==================== ТЕГИ — НАСТРОЙКА ИСКЛЮЧЕНИЙ (что НЕ искать) ====================
    hearManager.hear(/tagator_research_config_unlike/, async (context: any) => {
        if (context.peerType == 'chat') { return }
        const user_check = await prisma.account.findFirst({ where: { idvk: context.senderId } })
        if (!user_check) { return }
        
        let currentTags: number[] = [];
        if (user_check.tag_unlike) {
            try {
                currentTags = JSON.parse(user_check.tag_unlike);
            } catch {}
        }
        
        const tagId = context.eventPayload?.id;
        if (tagId) {
            const id = Number(tagId);
            if (currentTags.includes(id)) {
                currentTags = currentTags.filter(t => t !== id);
            } else {
                currentTags.push(id);
            }
            
            await prisma.account.update({
                where: { id: user_check.id },
                data: { tag_unlike: JSON.stringify(currentTags) }
            });
        }
        
        const page = context.eventPayload?.page || 0;
        const keyboard = await Keyboard_Tag_Constructor(currentTags, 'tagator_research_config_unlike', 'tagator_menu', page);
        
        let message = `📎 Настройте теги, по которым НЕ будет искать тегатор:\n\n`;
        const selectedText = currentTags.length > 0 
            ? `✅ Исключено: ${currentTags.map(id => getTagById(id)).filter(Boolean).join(', ')}\n`
            : `❌ Ничего не исключено\n`;
        message += selectedText;
        
        await Send_Message(user_check.idvk, message, keyboard);
        await Logger(`(tagator config) ~ configuring unlike tags for @${user_check.idvk}`);
    })

    // ==================== ТЕГИ — СБРОС ====================
    hearManager.hear(/tagator_research_config_reset/, async (context: any) => {
        if (context.peerType == 'chat') { return }
        const user_check = await prisma.account.findFirst({ where: { idvk: context.senderId } })
        if (!user_check) { return }
        
        await prisma.account.update({
            where: { id: user_check.id },
            data: { 
                tag_like: JSON.stringify([]),
                tag_unlike: JSON.stringify([])
            }
        });
        
        await context.send(`✅ Теги успешно сброшены!`);
        await Logger(`(tagator config) ~ reset tags for @${user_check.idvk}`);
    })

    // ==================== ТЕГАТОР — МЕНЮ ====================
    hearManager.hear(/🌐 Тегатор|!тегатор|!Тегатор/, async (context: any) => {
        if (context.peerType == 'chat') { return }
        const user_check = await prisma.account.findFirst({ where: { idvk: context.senderId } })
        if (!user_check) { return }
        
        const blank_check = await prisma.blank.findFirst({ where: { id_account: user_check.id } })
        if (!blank_check) {
            await context.send(`⚠ Сначала создайте анкету через !анкета`);
            return;
        }
        
        const hasTags = await checkBlankHasTags(blank_check.id);
        if (!hasTags) {
            const keyboard = new KeyboardBuilder()
                .callbackButton({ label: '🧲Настроить теги', payload: { command: 'tagator_blank_config' }, color: 'secondary' })
                .callbackButton({ label: '🚫', payload: { command: 'exit' }, color: 'secondary' })
                .oneTime().inline();
            
            await Send_Message(user_check.idvk, 
                `⚠ Для использования тегатора необходимо настроить теги анкеты!\n\n` +
                `Минимальное количество тегов: 3\n\n` +
                `Нажмите "Настроить теги", чтобы добавить теги к анкете.`,
                keyboard
            );
            return;
        }
        
        let tag_like = user_check.tag_like ? JSON.parse(user_check.tag_like) : [];
        let tag_unlike = user_check.tag_unlike ? JSON.parse(user_check.tag_unlike) : [];
        
        let tags = '✅ Теги, по которым будет производиться поиск анкет: ';
        for (const i of tag_like) {
            tags += `${await getTagById(i)} `;
        }
        tags += '\n\n⛔ Теги, по которым не будет производиться поиск анкет: ';
        for (const i of tag_unlike) {
            tags += `${await getTagById(i)} `;
        }
        
        const keyboard = new KeyboardBuilder()
            .textButton({ label: '🚀 Поехали', color: 'positive' }).row()       .callbackButton({ label: '✅ Выбрать теги', payload: { command: 'tagator_research_config_like' }, color: 'secondary' }).row()
            .callbackButton({ label: '⛔ Исключить теги', payload: { command: 'tagator_research_config_unlike' }, color: 'secondary' }).row()
            .callbackButton({ label: '🧹 Сбросить теги', payload: { command: 'tagator_research_config_reset' }, color: 'negative' }).row()
            .callbackButton({ label: '🚫 Назад', payload: { command: 'exit' }, color: 'secondary' })
            .oneTime().inline();
        
        await Send_Message(user_check.idvk, 
            `🔎 Добро пожаловать в поисковую систему «Тегатор-3000»\n\n` +
            `Перед началом не забудьте настроить, что ищете, и исключить, что вам точно не надо.\n\n${tags}`,
            keyboard
        );
        await Logger(`(tagator) ~ menu opened by @${user_check.idvk}`);
    })

    // ==================== ТЕГИ — ВОЗРАСТ (обработчики) ====================
    hearManager.hear(/age_confirm_yes|age_confirm_no/, async (context: any) => {
        if (context.peerType == 'chat') { return }
        // Обрабатывается в age_verification.ts через payload
        // Но здесь мы просто ловим, чтобы не было ошибок
        await Logger(`(age) ~ callback received: ${context.eventPayload?.command}`);
    })

    // ==================== ТЕГИ — РОМАНТИКА (обработчики) ====================
    hearManager.hear(/romance_male|romance_female|romance_both|romance_skip/, async (context: any) => {
        if (context.peerType == 'chat') { return }
        // Обрабатывается в romance_preference.ts через payload
        await Logger(`(romance) ~ callback received: ${context.eventPayload?.command}`);
    })

	// ==================== НАСТРОЙКА ТЕГОВ АНКЕТЫ (текстовая кнопка) ====================
	hearManager.hear(/🧲Настроить теги|!тегианкеты/, async (context: any) => {
		if (context.peerType == 'chat') { return }
		
		const user_check = await prisma.account.findFirst({ where: { idvk: context.senderId } })
		if (!user_check) { return }
		
		const blank_check = await prisma.blank.findFirst({ where: { id_account: user_check.id } })
		if (!blank_check) { 
			await Send_Message(user_check.idvk, `⚠ Сначала создайте анкету!`)
			return 
		}
		
		let currentTags: number[] = [];
		if (blank_check.tag) {
			try {
				currentTags = JSON.parse(blank_check.tag);
			} catch {}
		}
		
		const keyboard = await Keyboard_Tag_Constructor(currentTags, 'tagator_blank_config', 'main_menu', 0);
		
		let message = `📎 Настройте теги своей анкеты:\n\n`;
		const selectedText = currentTags.length > 0 
			? `✅ Выбрано: ${currentTags.map(id => getTagById(id)).filter(Boolean).join(', ')}\n`
			: `❌ Ничего не выбрано\n`;
		message += selectedText;
		
		await Send_Message(user_check.idvk, message, keyboard);
		await Logger(`(blank config) ~ configuring tags for blank #${blank_check.id} by @${user_check.idvk}`);
	})

    // ==================== НАСТРОЙКА ОТОБРАЖЕНИЯ ТЕГОВ (текстовая кнопка) ====================
    hearManager.hear(/⚙ Отображение|!настройкитегов/, async (context: any) => {
        if (context.peerType == 'chat') { return }
        
        const user_check = await prisma.account.findFirst({ where: { idvk: context.senderId } })
        if (!user_check) { return }
        
        const currentMode = user_check.tag_display_mode || 'smart';
        const currentPosition = user_check.tag_position || 'bottom';
        
        const keyboard = new KeyboardBuilder()
            .callbackButton({ 
                label: currentMode === 'smart' ? '✅ Умное' : 'Умное', 
                payload: { command: 'tag_display_mode', mode: 'smart' }, 
                color: currentMode === 'smart' ? 'positive' : 'secondary' 
            })
            .callbackButton({ 
                label: currentMode === 'hidden' ? '✅ Скрывать' : 'Скрывать', 
                payload: { command: 'tag_display_mode', mode: 'hidden' }, 
                color: currentMode === 'hidden' ? 'positive' : 'secondary' 
            }).row();
        
        if (currentMode === 'smart') {
            keyboard
                .callbackButton({ 
                    label: currentPosition === 'top' ? '✅ Сверху' : 'Сверху', 
                    payload: { command: 'tag_display_position', position: 'top' }, 
                    color: currentPosition === 'top' ? 'positive' : 'secondary' 
                })
                .callbackButton({ 
                    label: currentPosition === 'bottom' ? '✅ Снизу' : 'Снизу', 
                    payload: { command: 'tag_display_position', position: 'bottom' }, 
                    color: currentPosition === 'bottom' ? 'positive' : 'secondary' 
                }).row();
        }
        
        keyboard.callbackButton({ label: '🚫 Назад', payload: { command: 'exit' }, color: 'negative' });
        
        const explanation = `⚙️ Настройки отображения тегов при просмотре анкет других ролевиков:\n\n• Умное отображение — теги показываются в анкете, если помещаются, иначе кнопкой\n• Всегда скрывать — теги всегда показываются только по кнопке\n• Теги сверху/снизу — позиция тегов в анкете (только для умного режима)`;
        
        await Send_Message(user_check.idvk, explanation, keyboard.oneTime().inline());
        await Logger(`(tag display) ~ settings opened by @${user_check.idvk}`);
    })

    // ==================== КОСМОИНСТРУКЦИЯ (заглушка) ====================
    hearManager.hear(/🚀 Космоинструкция/, async (context: any) => {
        if (context.peerType == 'chat') { return }
        await context.send(
            `🚀 КОСМОИНСТРУКЦИЯ ПО СПУТНИКУ\n\n` +
            `📡 ЧТО ТАКОЕ СПУТНИК?\n` +
            `Бот для поиска соигроков для ролевых игр.\n\n` +
            `🛰 КАК ПОЛЬЗОВАТЬСЯ?\n` +
            `1. Создайте анкету через !анкета\n` +
            `2. Настройте теги (минимум 3)\n` +
            `3. Используйте поиск: !рандом, !поиск, !браузер, !тегатор\n\n` +
            `⚡ ДОПОЛНИТЕЛЬНО:\n` +
            `• !пкметр — подсчёт символов и строк\n` +
            `• !чс — черный список\n` +
            `• !почта — взаимные симпатии\n\n` +
            `📊 ПРОЦЕНТЫ — ЭТО ЛИМИТЫ\n` +
            `• Показывают, сколько % от лимита вы использовали\n` +
            `• 100% = достигнут лимит\n` +
            `• Меньше 100% = влезает в формат\n` +
            `• Больше 100% = нужно сокращать\n\n` +
            `💫 ПОДДЕРЖАТЬ РАЗРАБОТКУ\n` +
            `Донатеры получают доступ к Архиву и безлимитному Снайперу.\n\n` +
            `💳 Кнопка доната в группе Спутника.`
        );
    })
}

// ==================== ЭКСПОРТИРУЕМЫЕ ОБРАБОТЧИКИ ДЛЯ КНОПОК ====================


// ==================== СБРОС ТЕГОВ ====================
export async function handleTagatorResearchConfigReset(context: any, payload: any) {
    const user_check = await prisma.account.findFirst({ where: { idvk: context.userId } })
    if (!user_check) { return }
    
    await prisma.account.update({
        where: { id: user_check.id },
        data: { 
            tag_like: JSON.stringify([]),
            tag_unlike: JSON.stringify([])
        }
    });
    
    await Send_Message(user_check.idvk, `✅ Теги для тегатора успешно сброшены!`);
    await Logger(`(tagator config) ~ reset tags for @${user_check.idvk}`);
}

// ==================== НАСТРОЙКА ТЕГОВ АНКЕТЫ ====================
export async function handleBlankTagsConfig(context: any, payload: any) {
    const user_check = await prisma.account.findFirst({ where: { idvk: context.userId } })
    if (!user_check) { return }
    
    if (payload?.done === true) {
        return;
    }
    
    const blank_check = await prisma.blank.findFirst({ where: { id_account: user_check.id } })
    if (!blank_check) { 
        await Send_Message(user_check.idvk, `⚠ Сначала создайте анкету!`)
        return 
    }
    
    let currentTags: number[] = [];
    if (blank_check.tag) {
        try {
            currentTags = JSON.parse(blank_check.tag);
        } catch {
            currentTags = [];
        }
    }
    
    const tagId = payload?.id;
    if (tagId) {
        const id = Number(tagId);
        
        if (id === 17 && currentTags.includes(17)) {
            currentTags = currentTags.filter(t => t !== 17 && t !== 40 && t !== 41 && t !== 42);
        }
        else if (id === 17 && !currentTags.includes(17)) {
            currentTags.push(17);
        }
        else if ([40, 41, 42].includes(id)) {
            if (currentTags.includes(id)) {
                currentTags = currentTags.filter(t => t !== id);
            } else {
                currentTags.push(id);
            }
            if (currentTags.some(t => [40, 41, 42].includes(t))) {
                currentTags = currentTags.filter(t => t !== 17);
            }
        }
        else {
            if (currentTags.includes(id)) {
                currentTags = currentTags.filter(t => t !== id);
            } else {
                currentTags.push(id);
            }
        }
        
        await prisma.blank.update({
            where: { id: blank_check.id },
            data: { tag: JSON.stringify(currentTags) }
        });
    }
    
    let page = payload?.categoryIndex || 0;
    const categories = tag_categories;
    
    if (page >= categories.length) {
        page = categories.length - 1;
    }
    
    const keyboard = await Keyboard_Tag_Constructor(
        currentTags, 
        'tagator_blank_config', 
        'main_menu', 
        page, 
        categories
    );
    
    const category = categories[page];
    let message = `📎 Настройте теги своей анкеты:\n\n`;
    
    if (category) {
        message += category.description + '\n\n';
    }
    
    const tagNames: string[] = [];
    for (const id of currentTags) {
        const name = await getTagById(id);
        if (name) tagNames.push(name);
    }
    
    const selectedText = currentTags.length > 0 
        ? `✅ Выбрано: ${tagNames.join(', ')}\n`
        : `❌ Ничего не выбрано\n`;
    message += selectedText;
    
    await Send_Message(user_check.idvk, message, keyboard);
    await Logger(`(blank config) ~ configuring tags for blank #${blank_check.id} by @${user_check.idvk}`);
}

// ==================== НАСТРОЙКА ТЕГОВ ДЛЯ ПОИСКА (like) ====================
export async function handleTagatorResearchConfigLike(context: any, payload: any) {
    const user_check = await prisma.account.findFirst({ where: { idvk: context.userId } })
    if (!user_check) { return }
    
    if (payload?.done === true) {
        return;
    }
    
    let currentTags: number[] = [];
    if (user_check.tag_like) {
        try {
            currentTags = JSON.parse(user_check.tag_like);
        } catch {}
    }
    
    const tagId = payload?.id;
    if (tagId) {
        const id = Number(tagId);
        
        // Проверка возраста для тегов 18+
        if (age_required_tags.includes(id)) {
            const verified = await isAgeVerified(context.userId);
            if (!verified) {
                const keyboard = new KeyboardBuilder()
                    .callbackButton({ 
                        label: '✅ Подтвердить возраст', 
                        payload: { command: 'confirm_age_for_like', tagId: id }, 
                        color: 'positive' 
                    })
                    .callbackButton({ 
                        label: '🚫 Отмена', 
                        payload: { command: 'exit' }, 
                        color: 'secondary' 
                    })
                    .oneTime().inline();
                
                await Send_Message(user_check.idvk, 
                    `🔞 Для выбора этого тега требуется подтверждение возраста.`,
                    keyboard
                );
                return;
            }
        }
        
        if (romance_related_tags.includes(id)) {
            const verified = await isAgeVerified(context.userId);
            if (!verified) {
                const keyboard = new KeyboardBuilder()
                    .callbackButton({ 
                        label: '✅ Подтвердить возраст', 
                        payload: { command: 'confirm_age_for_like', tagId: id }, 
                        color: 'positive' 
                    })
                    .callbackButton({ 
                        label: '🚫 Отмена', 
                        payload: { command: 'exit' }, 
                        color: 'secondary' 
                    })
                    .oneTime().inline();
                
                await Send_Message(user_check.idvk, 
                    `🔞 Для выбора романтики необходимо подтверждение возраста.`,
                    keyboard
                );
                return;
            }
            
            const currentPrefs = await getRomancePreferences(context.userId);
            
            const keyboard = new KeyboardBuilder()
                .callbackButton({ 
                    label: currentPrefs.includes('male') ? '✅ Мужские' : '👨 Мужские', 
                    payload: { command: 'romance_toggle_male_from_like' }, 
                    color: currentPrefs.includes('male') ? 'positive' : 'secondary' 
                })
                .callbackButton({ 
                    label: currentPrefs.includes('female') ? '✅ Женские' : '👩 Женские', 
                    payload: { command: 'romance_toggle_female_from_like' }, 
                    color: currentPrefs.includes('female') ? 'positive' : 'secondary' 
                })
                .row()
                .callbackButton({ 
                    label: currentPrefs.includes('both') ? '✅ Мужские и женские' : '👫 Мужские и женские', 
                    payload: { command: 'romance_toggle_both_from_like' }, 
                    color: currentPrefs.includes('both') ? 'positive' : 'secondary' 
                })
                .row()
                .callbackButton({ 
                    label: '✅ Готово', 
                    payload: { command: 'romance_done_from_like' }, 
                    color: 'positive' 
                })
                .callbackButton({ 
                    label: '🚫 Отмена', 
                    payload: { command: 'exit' }, 
                    color: 'secondary' 
                })
                .oneTime().inline();
            
            const labels = currentPrefs.map(s => {
                if (s === 'male') return 'мужские';
                if (s === 'female') return 'женские';
                if (s === 'both') return 'мужские и женские';
                return s;
            });
            
            await Send_Message(user_check.idvk, 
                `Укажите состав персонажей в сюжете:\n\n` +
                `💡 Можно выбрать несколько вариантов.`,
                
                keyboard
            );
            return;
        }
        
        let unlikeTags: number[] = [];
        if (user_check.tag_unlike) {
            try {
                unlikeTags = JSON.parse(user_check.tag_unlike);
            } catch {}
        }
        
        // Если добавляем тег, который уже есть в unlike — удаляем его из unlike
        if (!currentTags.includes(id) && unlikeTags.includes(id)) {
            unlikeTags = unlikeTags.filter(t => t !== id);
            await prisma.account.update({
                where: { id: user_check.id },
                data: { tag_unlike: JSON.stringify(unlikeTags) }
            });
        }
        
        if (currentTags.includes(id)) {
            currentTags = currentTags.filter(t => t !== id);
        } else {
            currentTags.push(id);
        }
        
        await prisma.account.update({
            where: { id: user_check.id },
            data: { tag_like: JSON.stringify(currentTags) }
        });
    }
    
    let page = payload?.categoryIndex !== undefined ? payload.categoryIndex : (payload?.page || 0);
    const categories = tag_categories;
    
    if (page >= categories.length) {
        page = categories.length - 1;
    }
    
    const keyboard = await Keyboard_Tag_Constructor(
        currentTags, 
        'tagator_research_config_like', 
        'tagator_menu', 
        page, 
        categories
    );
    
    const category = categories[page];
    let message = `📎 Настройте теги, по которым будет искать тегатор:\n\n`;
    
    if (category) {
        message += category.description + '\n\n';
    }
    
    const tagNames: string[] = [];
    for (const id of currentTags) {
        const name = await getTagById(id);
        if (name) tagNames.push(name);
    }
    
    const selectedText = currentTags.length > 0 
        ? `✅ Выбрано для поиска: ${tagNames.join(', ')}\n`
        : `❌ Ничего не выбрано для поиска\n`;
    message += selectedText;
    
    await Send_Message(user_check.idvk, message, keyboard);
    await Logger(`(tagator config like) ~ configuring like tags (SEARCH) for @${user_check.idvk}`);
}


export async function handleRomanceToggleMaleFromUnlike(context: any, payload: any) {
    await handleRomanceToggleFromUnlike(context, 'male');
}

export async function handleRomanceToggleFemaleFromUnlike(context: any, payload: any) {
    await handleRomanceToggleFromUnlike(context, 'female');
}

export async function handleRomanceToggleBothFromUnlike(context: any, payload: any) {
    await handleRomanceToggleFromUnlike(context, 'both');
}

async function handleRomanceToggleFromUnlike(context: any, value: string) {
    const user_check = await prisma.account.findFirst({ where: { idvk: context.userId } })
    if (!user_check) { return }
    
    let currentPrefs: string[] = [];
    if (user_check.romance_preference) {
        try {
            currentPrefs = JSON.parse(user_check.romance_preference);
        } catch {}
    }
    
    if (currentPrefs.includes(value)) {
        currentPrefs = currentPrefs.filter(s => s !== value);
    } else {
        currentPrefs.push(value);
    }
    
    await setRomancePreferences(context.userId, currentPrefs);
    
    // Показываем обновлённое меню
    const keyboard = new KeyboardBuilder()
        .callbackButton({ 
            label: currentPrefs.includes('male') ? '✅ Мужские' : '👨 Мужские', 
            payload: { command: 'romance_toggle_male_from_unlike' }, 
            color: currentPrefs.includes('male') ? 'positive' : 'secondary' 
        })
        .callbackButton({ 
            label: currentPrefs.includes('female') ? '✅ Женские' : '👩 Женские', 
            payload: { command: 'romance_toggle_female_from_unlike' }, 
            color: currentPrefs.includes('female') ? 'positive' : 'secondary' 
        })
        .row()
        .callbackButton({ 
            label: currentPrefs.includes('both') ? '✅ Мужские и женские' : '👫 Мужские и женские', 
            payload: { command: 'romance_toggle_both_from_unlike' }, 
            color: currentPrefs.includes('both') ? 'positive' : 'secondary' 
        })
        .row()
        .callbackButton({ 
            label: '✅ Готово', 
            payload: { command: 'romance_done_from_unlike' }, 
            color: 'positive' 
        })
        .callbackButton({ 
            label: '🚫 Отмена', 
            payload: { command: 'exit' }, 
            color: 'secondary' 
        })
        .oneTime().inline();
    
    const labels = currentPrefs.map(s => {
        if (s === 'male') return 'мужские';
        if (s === 'female') return 'женские';
        if (s === 'both') return 'мужские и женские';
        return s;
    });
    
    await Send_Message(user_check.idvk, 
        `Какие взаимоотношения персонажей НЕ будут в сюжете?\n\n` +
        `💡 Можно выбрать несколько вариантов.`,
        keyboard
    );
}

export async function handleAgeConfirmForLike(context: any, payload: any) {
    const user_check = await prisma.account.findFirst({ where: { idvk: context.userId } })
    if (!user_check) { return }
    
    const { setAgeVerified } = require('./module/account/age_verification');
    await setAgeVerified(context.userId, true);
    
    await Send_Message(user_check.idvk, 
        `✅ Возраст подтверждён!\n\n` +
        `Теперь вы можете выбрать этот тег.`
    );
}

export async function handleAgeConfirmForUnlike(context: any, payload: any) {
    const user_check = await prisma.account.findFirst({ where: { idvk: context.userId } })
    if (!user_check) { return }
    
    const { setAgeVerified } = require('./module/account/age_verification');
    await setAgeVerified(context.userId, true);
    
    await Send_Message(user_check.idvk, 
        `✅ Возраст подтверждён!\n\n` +
        `Теперь вы можете исключить этот тег.`
    );
}

export async function handleSaveTags(context: any, payload: any) {
    const user_check = await prisma.account.findFirst({ where: { idvk: context.userId } })
    if (!user_check) { return }
    
    if (payload?.done !== true) {
        return;
    }
    
    const type = payload?.type || 'blank';
    
    let currentTags: number[] = [];
    let isBlankConfig = false;
    let isLikeConfig = false;
    let isUnlikeConfig = false;
    let blank_check = null;
    let saveMessage = '';
    let nextCommand = 'exit';
    
    if (type === 'blank') {
        isBlankConfig = true;
        blank_check = await prisma.blank.findFirst({ where: { id_account: user_check.id } })
        if (!blank_check) { 
            await Send_Message(user_check.idvk, `⚠ Анкета не найдена!`)
            return 
        }
        if (blank_check.tag) {
            try {
                currentTags = JSON.parse(blank_check.tag);
            } catch {}
        }
        saveMessage = 'анкеты';
        nextCommand = 'card_enter';
    } else if (type === 'like') {
        isLikeConfig = true;
        if (user_check.tag_like) {
            try {
                currentTags = JSON.parse(user_check.tag_like);
            } catch {}
        }
        saveMessage = 'для поиска';
        nextCommand = 'tagator_menu';
    } else if (type === 'unlike') {
        isUnlikeConfig = true;
        if (user_check.tag_unlike) {
            try {
                currentTags = JSON.parse(user_check.tag_unlike);
            } catch {}
        }
        saveMessage = 'для исключения';
        nextCommand = 'tagator_menu';
    } else {
        await Send_Message(user_check.idvk, `⚠ Неизвестный тип сохранения: ${type}`);
        return;
    }
    
    if (isBlankConfig || isLikeConfig) {
        const hasRomance = currentTags.includes(17);
        if (hasRomance) {
            // 1. Проверяем возраст
            const { isAgeVerified } = require('./module/account/age_verification');
            const verified = await isAgeVerified(context.userId);
            
            if (!verified) {
                const keyboard = new KeyboardBuilder()
                    .callbackButton({ 
                        label: '✅ Подтвердить возраст', 
                        payload: { command: 'confirm_age_from_save', type: type }, 
                        color: 'positive' 
                    })
                    .callbackButton({ 
                        label: '🚫 Отмена', 
                        payload: { command: 'exit' }, 
                        color: 'secondary' 
                    })
                    .oneTime().inline();
                
                await Send_Message(user_check.idvk, 
                    `🔞 Для сохранения тегов с романтикой необходимо подтверждение совершеннолетия.`,
                    keyboard
                );
                return;
            }
            
            const currentPrefs = await getRomancePreferences(context.userId);
            const labels = currentPrefs.map(s => {
                if (s === 'male') return 'мужские';
                if (s === 'female') return 'женские';
                if (s === 'both') return 'мужские и женские';
                return s;
            });
            
            const keyboard = new KeyboardBuilder()
                .callbackButton({ 
                    label: currentPrefs.includes('male') ? '✅ Мужские' : '👨 Мужские', 
                    payload: { command: 'romance_toggle_male_from_save', type: type }, 
                    color: currentPrefs.includes('male') ? 'positive' : 'secondary' 
                })
                .callbackButton({ 
                    label: currentPrefs.includes('female') ? '✅ Женские' : '👩 Женские', 
                    payload: { command: 'romance_toggle_female_from_save', type: type }, 
                    color: currentPrefs.includes('female') ? 'positive' : 'secondary' 
                })
                .row()
                .callbackButton({ 
                    label: currentPrefs.includes('both') ? '✅ Мужские и женские' : '👫 Мужские и женские', 
                    payload: { command: 'romance_toggle_both_from_save', type: type }, 
                    color: currentPrefs.includes('both') ? 'positive' : 'secondary' 
                })
                .row()
                .callbackButton({ 
                    label: '✅ Готово', 
                    payload: { command: 'romance_done_from_save', type: type }, 
                    color: 'positive' 
                })
                .callbackButton({ 
                    label: '🚫 Отмена', 
                    payload: { command: 'exit' }, 
                    color: 'secondary' 
                })
                .oneTime().inline();
            
            await Send_Message(user_check.idvk, 
                `Укажите, какие персонажи будут участвовать в сюжете:\n\n` +
                `💡 Если вы указали в анкете несколько сюжетов — можно выбрать несколько вариантов.`,
                keyboard
            );
            return;
        }
    }
    
    if (isBlankConfig && blank_check) {
        await prisma.blank.update({
            where: { id: blank_check.id },
            data: { tag: JSON.stringify(currentTags) }
        });
    } else if (isLikeConfig) {
        await prisma.account.update({
            where: { id: user_check.id },
            data: { tag_like: JSON.stringify(currentTags) }
        });
    } else if (isUnlikeConfig) {
        await prisma.account.update({
            where: { id: user_check.id },
            data: { tag_unlike: JSON.stringify(currentTags) }
        });
    }
    
    const tagNames: string[] = [];
    for (const id of currentTags) {
        const name = await getTagById(id);
        if (name) tagNames.push(name);
    }
    
    const typeLabel = isBlankConfig ? 'анкеты' : (isLikeConfig ? 'для поиска' : 'для исключения');
    const actionLabel = isUnlikeConfig ? 'Исключено' : 'Выбрано';
    
    const keyboard = new KeyboardBuilder()
        .callbackButton({ label: '🚫', payload: { command: 'exit' }, color: 'secondary' })
        .oneTime().inline();
    
    await Send_Message(user_check.idvk, 
        `✅ Теги ${typeLabel} сохранены!\n` +
        `📋 ${actionLabel}: ${tagNames.join(', ') || 'ничего не выбрано'}`,
        keyboard
    );
    
    await Logger(`(save tags) ~ tags saved for ${typeLabel} by @${user_check.idvk}`);
    
    if (nextCommand === 'card_enter') {
        await handleShowBlank(context, payload);
    } else if (nextCommand === 'tagator_menu') {
        await handleTagatorMenu(context, payload);
    }
}

// ==================== ПОКАЗАТЬ АНКЕТУ ====================
export async function handleShowBlank(context: any, payload: any) {
    const user_check = await prisma.account.findFirst({ where: { idvk: context.userId } })
    if (!user_check) { return }
    
    const blank = await prisma.blank.findFirst({ where: { id_account: user_check.id } })
    if (!blank) {
        await Send_Message(user_check.idvk, `⚠ Анкета не найдена!`)
        return
    }
    
    const count_vision = await prisma.vision.count({ where: { id_blank: blank.id } })
    const count_max_vision = await prisma.blank.count({})
    const count_success = await prisma.mail.count({ where: { blank_to: blank.id, read: true, status: true }})
    const count_ignore = await prisma.mail.count({ where: { blank_to: blank.id, read: true, status: false }})
    const count_wrong = await prisma.mail.count({ where: { blank_to: blank.id, read: true, find: false }})
    const count_unread = await prisma.mail.count({ where: { blank_to: blank.id, read: false }})
    const counter_warn = await prisma.report.count({ where: { id_blank: blank.id } })
    let censored = user_check.censored ? await Censored_Activation_Pro(blank.text) : blank.text
    
    let tagsText = '';
    if (blank.tag) {
        try {
            const tagIds = JSON.parse(blank.tag);
            const tagNames = tagIds.map((id: number) => {
                const tag = tag_list.find(t => t.id === id);
                return tag ? tag.text : '';
            }).filter(Boolean);
            if (tagNames.length > 0) {
                tagsText = `\n🏷 Теги: ${tagNames.join(', ')}`;
            }
        } catch {}
    }
    
    const datenow: any = new Date()
    const dateold: any = new Date(blank.crdate)
    const timeouter = 86400000
    const canEdit = datenow - dateold <= timeouter;
    
    const keyboard = new KeyboardBuilder()
        .textButton({ label: `⛔Удалить ${blank.id}`, payload: { command: 'card_enter' }, color: 'secondary' })
    
    if (canEdit) {
        keyboard.textButton({ label: `✏Изменить ${blank.id}`, payload: { command: 'inventory_enter' }, color: 'secondary' })
    }
    keyboard.row()
    
    keyboard.callbackButton({ label: `🧲Настроить теги ${blank.id}`, payload: { command: 'tagator_blank_config' }, color: 'secondary' }).row()
    keyboard.callbackButton({ label: `⚙Отображение тегов`, payload: { command: 'tag_display_settings' }, color: 'secondary' }).row()
    keyboard.callbackButton({ label: '🚫', payload: { command: 'exit' }, color: 'secondary' }).oneTime().inline()
    
    const message = `📜 Анкета: ${blank.id}\n💬 Содержание:\n${censored}\n👁 Просмотров: ${count_vision}/${-1+count_max_vision}\n⚠ Предупреждений: ${counter_warn}/3\n✅ Принятых: ${count_success}\n🚫 Игноров: ${count_ignore}\n⌛ Ожидает: ${count_unread}\n❗ Потеряшек: ${count_wrong}${tagsText}`
    
    if (blank.photo.includes('photo')) {
        await Send_Message(user_check.idvk, message, keyboard, blank.photo)
    } else {
        await Send_Message(user_check.idvk, message, keyboard)
    }
}

// ==================== МЕНЮ ТЕГАТОРА ====================
export async function handleTagatorMenu(context: any, payload: any) {
    const user_check = await prisma.account.findFirst({ where: { idvk: context.userId } })
    if (!user_check) { return }
    
    const blank_check = await prisma.blank.findFirst({ where: { id_account: user_check.id } })
    if (!blank_check) {
        await Send_Message(user_check.idvk, `⚠ Сначала создайте анкету через !анкета`);
        return;
    }
    
    const hasTags = await checkBlankHasTags(blank_check.id);
    if (!hasTags) {
        const keyboard = new KeyboardBuilder()
            .callbackButton({ label: '🧲Настроить теги', payload: { command: 'tagator_blank_config' }, color: 'secondary' })
            .callbackButton({ label: '🚫', payload: { command: 'exit' }, color: 'secondary' })
            .oneTime().inline();
        
        await Send_Message(user_check.idvk, 
            `⚠ Для использования тегатора необходимо настроить теги анкеты!\n\n` +
            `Минимальное количество тегов: 3\n\n` +
            `Нажмите "Настроить теги", чтобы добавить теги к анкете.`,
            keyboard
        );
        return;
    }
    
    let tag_like = user_check.tag_like ? JSON.parse(user_check.tag_like) : [];
    let tag_unlike = user_check.tag_unlike ? JSON.parse(user_check.tag_unlike) : [];
    
    let tags = '✅ Теги, по которым будет производиться поиск анкет: ';
    for (const i of tag_like) {
        tags += `${await getTagById(i)} `;
    }
    tags += '\n\n⛔ Теги, по которым не будет производиться поиск анкет: ';
    for (const i of tag_unlike) {
        tags += `${await getTagById(i)} `;
    }
    
    const keyboard = new KeyboardBuilder()
        .textButton({ label: '🚀 Поехали', color: 'positive' }).row()     .callbackButton({ label: '✅ Выбрать теги', payload: { command: 'tagator_research_config_like' }, color: 'secondary' }).row()
        .callbackButton({ label: '⛔ Исключить теги', payload: { command: 'tagator_research_config_unlike' }, color: 'secondary' }).row()
        .callbackButton({ label: '🧹 Сбросить теги', payload: { command: 'tagator_research_config_reset' }, color: 'negative' }).row()
        .callbackButton({ label: '🚫 Назад', payload: { command: 'exit' }, color: 'secondary' })
        .oneTime().inline();
    
    await Send_Message(user_check.idvk, 
        `🔎 Добро пожаловать в поисковую систему «Тегатор-3000»\n\n` +
        `Перед началом не забудьте настроить, что ищете, и исключить, что вам точно не надо.\n\n${tags}`,
        keyboard
    );
    await Logger(`(tagator) ~ menu opened by @${user_check.idvk}`);
}

// ==================== ПАГИНАЦИЯ ====================
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

export async function handleTagDisplayMode(context: any, payload: any) {
    const user_check = await prisma.account.findFirst({ where: { idvk: context.userId } })
    if (!user_check) { return }

    await prisma.account.update({
        where: { id: user_check.id },
        data: { 
            tag_display_mode: payload.mode,
            ...(payload.mode === 'hidden' ? { tag_position: 'bottom' } : {})
        }
    });

    const currentMode = payload.mode;
    const currentPosition = user_check.tag_position || 'bottom';
    
    const keyboard = new KeyboardBuilder()
        .callbackButton({ 
            label: currentMode === 'smart' ? '✅ Умное' : 'Умное', 
            payload: { command: 'tag_display_mode', mode: 'smart' }, 
            color: currentMode === 'smart' ? 'positive' : 'secondary' 
        })
        .callbackButton({ 
            label: currentMode === 'hidden' ? '✅ Скрывать' : 'Скрывать', 
            payload: { command: 'tag_display_mode', mode: 'hidden' }, 
            color: currentMode === 'hidden' ? 'positive' : 'secondary' 
        }).row();
    
    if (currentMode === 'smart') {
        keyboard
            .callbackButton({ 
                label: currentPosition === 'top' ? '✅ Сверху' : 'Сверху', 
                payload: { command: 'tag_display_position', position: 'top' }, 
                color: currentPosition === 'top' ? 'positive' : 'secondary' 
            })
            .callbackButton({ 
                label: currentPosition === 'bottom' ? '✅ Снизу' : 'Снизу', 
                payload: { command: 'tag_display_position', position: 'bottom' }, 
                color: currentPosition === 'bottom' ? 'positive' : 'secondary' 
            }).row();
    }
    
    keyboard.callbackButton({ label: '🚫 Назад', payload: { command: 'exit' }, color: 'negative' });
    
    const explanation = `⚙️ Настройки отображения тегов при просмотре анкет других ролевиков:\n\n• Умное отображение — теги показываются в анкете, если помещаются, иначе кнопкой\n• Всегда скрывать — теги всегда показываются только по кнопке\n• Теги сверху/снизу — позиция тегов в анкете (только для умного режима)`;
    
    await Send_Message(user_check.idvk, 
        `✅ Режим отображения тегов изменен на: ${currentMode === 'smart' ? 'Умное' : 'Скрывать'}\n\n${explanation}`, 
        keyboard
    );
}

// ==================== ОТОБРАЖЕНИЕ ТЕГОВ ====================
export async function handleTagDisplaySettings(context: any, payload: any) {
    const user_check = await prisma.account.findFirst({ where: { idvk: context.userId } })
    if (!user_check) { return }
    
    const currentMode = user_check.tag_display_mode || 'smart';
    const currentPosition = user_check.tag_position || 'bottom';
    
    const keyboard = new KeyboardBuilder()
        .callbackButton({ 
            label: currentMode === 'smart' ? '✅ Умное' : 'Умное', 
            payload: { command: 'tag_display_mode', mode: 'smart' }, 
            color: currentMode === 'smart' ? 'positive' : 'secondary' 
        })
        .callbackButton({ 
            label: currentMode === 'hidden' ? '✅ Скрывать' : 'Скрывать', 
            payload: { command: 'tag_display_mode', mode: 'hidden' }, 
            color: currentMode === 'hidden' ? 'positive' : 'secondary' 
        }).row();
    
    if (currentMode === 'smart') {
        keyboard
            .callbackButton({ 
                label: currentPosition === 'top' ? '✅ Сверху' : 'Сверху', 
                payload: { command: 'tag_display_position', position: 'top' }, 
                color: currentPosition === 'top' ? 'positive' : 'secondary' 
            })
            .callbackButton({ 
                label: currentPosition === 'bottom' ? '✅ Снизу' : 'Снизу', 
                payload: { command: 'tag_display_position', position: 'bottom' }, 
                color: currentPosition === 'bottom' ? 'positive' : 'secondary' 
            }).row();
    }
    
    keyboard.callbackButton({ label: '🚫 Назад', payload: { command: 'exit' }, color: 'negative' });
    
    const explanation = `⚙️ Настройки отображения тегов при просмотре анкет других ролевиков:\n\n• Умное отображение — теги показываются в анкете, если помещаются, иначе кнопкой\n• Всегда скрывать — теги всегда показываются только по кнопке\n• Теги сверху/снизу — позиция тегов в анкете (только для умного режима)`;
    
    await Send_Message(user_check.idvk, explanation, keyboard.oneTime().inline());
}

export async function handleTagDisplayPosition(context: any, payload: any) {
    const user_check = await prisma.account.findFirst({ where: { idvk: context.userId } })
    if (!user_check) { return }

    await prisma.account.update({
        where: { id: user_check.id },
        data: { tag_position: payload.position }
    });

    const currentMode = user_check.tag_display_mode || 'smart';
    const currentPosition = payload.position;
    
    const keyboard = new KeyboardBuilder()
        .callbackButton({ 
            label: currentMode === 'smart' ? '✅ Умное' : 'Умное', 
            payload: { command: 'tag_display_mode', mode: 'smart' }, 
            color: currentMode === 'smart' ? 'positive' : 'secondary' 
        })
        .callbackButton({ 
            label: currentMode === 'hidden' ? '✅ Скрывать' : 'Скрывать', 
            payload: { command: 'tag_display_mode', mode: 'hidden' }, 
            color: currentMode === 'hidden' ? 'positive' : 'secondary' 
        }).row();
    
    if (currentMode === 'smart') {
        keyboard
            .callbackButton({ 
                label: currentPosition === 'top' ? '✅ Сверху' : 'Сверху', 
                payload: { command: 'tag_display_position', position: 'top' }, 
                color: currentPosition === 'top' ? 'positive' : 'secondary' 
            })
            .callbackButton({ 
                label: currentPosition === 'bottom' ? '✅ Снизу' : 'Снизу', 
                payload: { command: 'tag_display_position', position: 'bottom' }, 
                color: currentPosition === 'bottom' ? 'positive' : 'secondary' 
            }).row();
    }
    
    keyboard.callbackButton({ label: '🚫 Назад', payload: { command: 'exit' }, color: 'negative' });
    
    const explanation = `⚙️ Настройки отображения тегов при просмотре анкет других ролевиков:\n\n• Умное отображение — теги показываются в анкете, если помещаются, иначе кнопкой\n• Всегда скрывать — теги всегда показываются только по кнопке\n• Теги сверху/снизу — позиция тегов в анкете (только для умного режима)`;
    
    await Send_Message(user_check.idvk, 
        `✅ Позиция тегов изменена на: ${currentPosition === 'top' ? 'Сверху' : 'Снизу'}\n\n${explanation}`, 
        keyboard
    );
}

export async function handleRomanceToggle(context: any, payload: any) {
    // Обрабатывается внутри requestRomancePreference
    await Logger(`(romance) ~ toggle received: ${payload?.command}`);
}

export async function handleRomanceDone(context: any, payload: any) {
    // Обрабатывается внутри requestRomancePreference
    await Logger(`(romance) ~ done received`);
}

export async function handleRomanceConfirm(context: any, payload: any) {
    // Обрабатывается внутри requestRomancePreference
    await Logger(`(romance) ~ confirm received: ${payload?.command}`);
}

export async function handleAgeConfirm(context: any, payload: any) {
    // Обрабатывается внутри age_verification.ts
    await Logger(`(age) ~ confirm received: ${payload?.command}`);
}

// ==================== ПОКАЗАТЬ ТЕГИ ====================
export async function handleShowTags(context: any, payload: any) {
    const user_check = await prisma.account.findFirst({ where: { idvk: context.userId } })
    if (!user_check) { return }
    
    const blankId = payload?.idb;
    if (!blankId) {
        await Send_Message(user_check.idvk, `⚠ Анкета не указана`);
        return;
    }
    
    const tags = await getTagsForBlank(blankId);
    
    if (!tags) {
        const keyboard = new KeyboardBuilder()
            .callbackButton({ label: '🚫', payload: { command: 'exit' }, color: 'secondary' })
            .oneTime().inline();
        await Send_Message(user_check.idvk, `🏷 У этой анкеты нет тегов`, keyboard);
        return;
    }
    
    const keyboard = new KeyboardBuilder()
        .callbackButton({ label: '⬅ Назад', payload: { command: 'exit' }, color: 'secondary' })
        .oneTime().inline();
    
    await Send_Message(user_check.idvk, `🏷 Теги анкеты #${blankId}:\n${tags}`, keyboard);
    await Logger(`(show tags) ~ showing tags for blank #${blankId} by @${user_check.idvk}`);
}

export async function handleAgeConfirmFromSave(context: any, payload: any) {
    const user_check = await prisma.account.findFirst({ where: { idvk: context.userId } })
    if (!user_check) { return }
    
    const { setAgeVerified } = require('./module/account/age_verification');
    await setAgeVerified(context.userId, true);
    
    await Send_Message(user_check.idvk, 
        `✅ Возраст подтверждён!\n` +
        `Теперь настройте предпочтения для романтики (пройдитесь по пути сохранения тегов ещё раз).`
    );
    
    // Открываем настройку предпочтений
    const type = payload?.type || 'blank';
    await handleSetupRomanceFromSave(context, { type: type });
}

export async function handleTagatorResearchConfigUnlike(context: any, payload: any) {
    const user_check = await prisma.account.findFirst({ where: { idvk: context.userId } })
    if (!user_check) { return }
    
    if (payload?.done === true) {
        return;
    }
    
    let currentTags: number[] = [];
    if (user_check.tag_unlike) {
        try {
            currentTags = JSON.parse(user_check.tag_unlike);
        } catch {}
    }
    
    const tagId = payload?.id;
    if (tagId) {
        const id = Number(tagId);
        
        // Проверка возраста для тегов 18+
        if (age_required_tags.includes(id)) {
            const verified = await isAgeVerified(context.userId);
            if (!verified) {
                const keyboard = new KeyboardBuilder()
                    .callbackButton({ 
                        label: '✅ Подтвердить возраст', 
                        payload: { command: 'confirm_age_for_unlike', tagId: id }, 
                        color: 'positive' 
                    })
                    .callbackButton({ 
                        label: '🚫 Отмена', 
                        payload: { command: 'exit' }, 
                        color: 'secondary' 
                    })
                    .oneTime().inline();
                
                await Send_Message(user_check.idvk, 
                    `🔞 Для исключения этого тега требуется подтверждение возраста.`,
                    keyboard
                );
                return;
            }
        }
        
        if (romance_related_tags.includes(id)) {
            const verified = await isAgeVerified(context.userId);
            if (!verified) {
                const keyboard = new KeyboardBuilder()
                    .callbackButton({ 
                        label: '✅ Подтвердить возраст', 
                        payload: { command: 'confirm_age_for_unlike', tagId: id }, 
                        color: 'positive' 
                    })
                    .callbackButton({ 
                        label: '🚫 Отмена', 
                        payload: { command: 'exit' }, 
                        color: 'secondary' 
                    })
                    .oneTime().inline();
                
                await Send_Message(user_check.idvk, 
                    `🔞 Для исключения романтики необходимо подтверждение возраста.`,
                    keyboard
                );
                return;
            }
            
            const currentPrefs = await getRomancePreferences(context.userId);
            
            const keyboard = new KeyboardBuilder()
                .callbackButton({ 
                    label: currentPrefs.includes('male') ? '✅ Мужские' : '👨 Мужские', 
                    payload: { command: 'romance_toggle_male_from_unlike' }, 
                    color: currentPrefs.includes('male') ? 'positive' : 'secondary' 
                })
                .callbackButton({ 
                    label: currentPrefs.includes('female') ? '✅ Женские' : '👩 Женские', 
                    payload: { command: 'romance_toggle_female_from_unlike' }, 
                    color: currentPrefs.includes('female') ? 'positive' : 'secondary' 
                })
                .row()
                .callbackButton({ 
                    label: currentPrefs.includes('both') ? '✅ Мужские и женские' : '👫 Мужские и женские', 
                    payload: { command: 'romance_toggle_both_from_unlike' }, 
                    color: currentPrefs.includes('both') ? 'positive' : 'secondary' 
                })
                .row()
                .callbackButton({ 
                    label: '✅ Готово', 
                    payload: { command: 'romance_done_from_unlike' }, 
                    color: 'positive' 
                })
                .callbackButton({ 
                    label: '🚫 Отмена', 
                    payload: { command: 'exit' }, 
                    color: 'secondary' 
                })
                .oneTime().inline();
            
            const labels = currentPrefs.map(s => {
                if (s === 'male') return 'мужские';
                if (s === 'female') return 'женские';
                if (s === 'both') return 'мужские и женские';
                return s;
            });
            
            await Send_Message(user_check.idvk, 
                `Какие взаимоотношения персонажей НЕ будут в сюжете?\n\n` +
                `💡 Можно выбрать несколько вариантов.`,
                keyboard
            );
            return;
        }
        
        if (currentTags.includes(id)) {
            currentTags = currentTags.filter(t => t !== id);
        } else {
            currentTags.push(id);
        }
        
        await prisma.account.update({
            where: { id: user_check.id },
            data: { tag_unlike: JSON.stringify(currentTags) }
        });
    }
    
    let page = payload?.categoryIndex !== undefined ? payload.categoryIndex : (payload?.page || 0);
    const categories = tag_categories;
    
    if (page >= categories.length) {
        page = categories.length - 1;
    }
    
    const keyboard = await Keyboard_Tag_Constructor(
        currentTags, 
        'tagator_research_config_unlike', 
        'tagator_menu', 
        page, 
        categories
    );
    
    const category = categories[page];
    let message = `📎 Настройте теги, по которым НЕ будет искать тегатор:\n\n`;
    
    if (category) {
        message += category.description + '\n\n';
    }
    
    const tagNames: string[] = [];
    for (const id of currentTags) {
        const name = await getTagById(id);
        if (name) tagNames.push(name);
    }
    
    const selectedText = currentTags.length > 0 
        ? `✅ Исключено из поиска: ${tagNames.join(', ')}\n`
        : `❌ Ничего не исключено из поиска\n`;
    message += selectedText;
    
    await Send_Message(user_check.idvk, message, keyboard);
    await Logger(`(tagator config unlike) ~ configuring unlike tags (EXCLUDE) for @${user_check.idvk}`);
}

export async function handleRomanceDoneFromUnlike(context: any, payload: any) {
    const user_check = await prisma.account.findFirst({ where: { idvk: context.userId } })
    if (!user_check) { return }
    
    const currentPrefs = await getRomancePreferences(context.userId);
    
    if (currentPrefs.length === 0) {
        await Send_Message(user_check.idvk, 
            `⚠ Вы не выбрали ни одного варианта.\n\n` +
            `Пожалуйста, выберите хотя бы один вариант для исключения.`
        );
        return;
    }
    
    const labels = currentPrefs.map(s => {
        if (s === 'male') return 'яой';
        if (s === 'female') return 'юри';
        if (s === 'both') return 'гет';
        return s;
    });
    
    const romanceTagIds: number[] = [];
    for (const pref of currentPrefs) {
        if (pref === 'male' && !romanceTagIds.includes(41)) romanceTagIds.push(41);
        if (pref === 'female' && !romanceTagIds.includes(42)) romanceTagIds.push(42);
        if (pref === 'both' && !romanceTagIds.includes(40)) romanceTagIds.push(40);
    }
    
    let currentTags: number[] = [];
    if (user_check.tag_unlike) {
        try {
            currentTags = JSON.parse(user_check.tag_unlike);
        } catch {}
    }
    
    currentTags = currentTags.filter(t => t !== 17);
    
    for (const tagId of romanceTagIds) {
        if (!currentTags.includes(tagId)) {
            currentTags.push(tagId);
        }
    }
    
    await prisma.account.update({
        where: { id: user_check.id },
        data: { tag_unlike: JSON.stringify(currentTags) }
    });
    
    const tagNames: string[] = [];
    for (const id of currentTags) {
        const name = await getTagById(id);
        if (name) tagNames.push(name);
    }
    
    const addedTags = romanceTagIds.map(id => getTagById(id)).filter(Boolean).join(', ');
    
    await Send_Message(user_check.idvk, 
        `✅ Предпочтения для исключения сохранены!\n` +
        `📋 Исключено: ${labels.join(', ')}`
    );
    
    await handleTagatorResearchConfigUnlike(context, { categoryIndex: 2 });
    
    await Logger(`(romance done unlike) ~ unlike tags saved (EXCLUDE) by @${user_check.idvk}`);
}

export async function handleSetupRomanceFromSave(context: any, payload: any) {
    const user_check = await prisma.account.findFirst({ where: { idvk: context.userId } })
    if (!user_check) { return }
    
    // Используем существующие функции из romance_preference.ts
    // Но без context.question() — показываем клавиатуру через callback
    const currentPrefs = await getRomancePreferences(context.userId);
    
    const keyboard = new KeyboardBuilder()
        .callbackButton({ 
            label: currentPrefs.includes('male') ? '✅ Мужские' : '👨 Мужские', 
            payload: { command: 'romance_toggle_male_from_save' }, 
            color: currentPrefs.includes('male') ? 'positive' : 'secondary' 
        })
        .callbackButton({ 
            label: currentPrefs.includes('female') ? '✅ Женские' : '👩 Женские', 
            payload: { command: 'romance_toggle_female_from_save' }, 
            color: currentPrefs.includes('female') ? 'positive' : 'secondary' 
        })
        .row()
        .callbackButton({ 
            label: currentPrefs.includes('both') ? '✅ Мужские и женские' : '👫 Мужские и женские', 
            payload: { command: 'romance_toggle_both_from_save' }, 
            color: currentPrefs.includes('both') ? 'positive' : 'secondary' 
        })
        .row()
        .callbackButton({ 
            label: '✅ Готово', 
            payload: { command: 'romance_done_from_save' }, 
            color: 'positive' 
        })
        .callbackButton({ 
            label: '🚫 Отмена', 
            payload: { command: 'exit' }, 
            color: 'secondary' 
        })
        .oneTime().inline();
    
    const labels = currentPrefs.map(s => {
        if (s === 'male') return 'мужские';
        if (s === 'female') return 'женские';
        if (s === 'both') return 'мужские и женские';
        return s;
    });
    
    await Send_Message(user_check.idvk, 
        `Укажите, какие персонажи будут участвовать в сюжете:\n\n` +
        `💡 Если вы указали в анкете несколько сюжетов — можно выбрать несколько вариантов.`,
        keyboard
    );
}

export async function handleRomanceToggleMaleFromSave(context: any, payload: any) {
    await handleRomanceToggleFromSave(context, 'male');
}

export async function handleRomanceToggleFemaleFromSave(context: any, payload: any) {
    await handleRomanceToggleFromSave(context, 'female');
}

export async function handleRomanceToggleBothFromSave(context: any, payload: any) {
    await handleRomanceToggleFromSave(context, 'both');
}

async function handleRomanceToggleFromSave(context: any, value: string) {
    const user_check = await prisma.account.findFirst({ where: { idvk: context.userId } })
    if (!user_check) { return }
    
    let currentPrefs: string[] = [];
    if (user_check.romance_preference) {
        try {
            currentPrefs = JSON.parse(user_check.romance_preference);
        } catch {}
    }
    
    if (currentPrefs.includes(value)) {
        currentPrefs = currentPrefs.filter(s => s !== value);
    } else {
        currentPrefs.push(value);
    }
    
    // Сохраняем через setRomancePreferences из romance_preference.ts
    await setRomancePreferences(context.userId, currentPrefs);
    
    // Показываем обновлённое меню
    const keyboard = new KeyboardBuilder()
        .callbackButton({ 
            label: currentPrefs.includes('male') ? '✅ Мужские' : '👨 Мужские', 
            payload: { command: 'romance_toggle_male_from_save' }, 
            color: currentPrefs.includes('male') ? 'positive' : 'secondary' 
        })
        .callbackButton({ 
            label: currentPrefs.includes('female') ? '✅ Женские' : '👩 Женские', 
            payload: { command: 'romance_toggle_female_from_save' }, 
            color: currentPrefs.includes('female') ? 'positive' : 'secondary' 
        })
        .row()
        .callbackButton({ 
            label: currentPrefs.includes('both') ? '✅ Мужские и женские' : '👫 Мужские и женские', 
            payload: { command: 'romance_toggle_both_from_save' }, 
            color: currentPrefs.includes('both') ? 'positive' : 'secondary' 
        })
        .row()
        .callbackButton({ 
            label: '✅ Готово', 
            payload: { command: 'romance_done_from_save' }, 
            color: 'positive' 
        })
        .callbackButton({ 
            label: '🚫 Отмена', 
            payload: { command: 'exit' }, 
            color: 'secondary' 
        })
        .oneTime().inline();
    
    const labels = currentPrefs.map(s => {
        if (s === 'male') return 'мужские';
        if (s === 'female') return 'женские';
        if (s === 'both') return 'мужские и женские';
        return s;
    });
    
    await Send_Message(user_check.idvk, 
        `Укажите, какие персонажи будут участвовать в сюжете:\n\n` +
        `💡 Если вы указали в анкете несколько сюжетов — можно выбрать несколько вариантов.`,
        keyboard
    );
}

export async function handleRomanceDoneFromSave(context: any, payload: any) {
    const user_check = await prisma.account.findFirst({ where: { idvk: context.userId } })
    if (!user_check) { return }
    
    const type = payload?.type || 'blank';
    const currentPrefs = await getRomancePreferences(context.userId);
    
    if (currentPrefs.length === 0) {
        await Send_Message(user_check.idvk, 
            `⚠ Вы не выбрали ни одного варианта.\n\n` +
            `Пожалуйста, выберите хотя бы один вариант.`
        );
        return;
    }
    
    const labels = currentPrefs.map(s => {
        if (s === 'male') return 'яой';
        if (s === 'female') return 'юри';
        if (s === 'both') return 'гет';
        return s;
    });
    
    const romanceTagIds: number[] = [];
    for (const pref of currentPrefs) {
        if (pref === 'male' && !romanceTagIds.includes(41)) romanceTagIds.push(41);
        if (pref === 'female' && !romanceTagIds.includes(42)) romanceTagIds.push(42);
        if (pref === 'both' && !romanceTagIds.includes(40)) romanceTagIds.push(40);
    }
    
    let currentTags: number[] = [];
    let isBlankConfig = false;
    let isLikeConfig = false;
    let blank_check = null;
    let nextCommand = 'exit';
    
    if (type === 'blank') {
        isBlankConfig = true;
        blank_check = await prisma.blank.findFirst({ where: { id_account: user_check.id } })
        if (!blank_check) { 
            await Send_Message(user_check.idvk, `⚠ Анкета не найдена!`)
            return 
        }
        if (blank_check.tag) {
            try {
                currentTags = JSON.parse(blank_check.tag);
            } catch {}
        }
        nextCommand = 'card_enter';
    } else if (type === 'like') {
        isLikeConfig = true;
        if (user_check.tag_like) {
            try {
                currentTags = JSON.parse(user_check.tag_like);
            } catch {}
        }
        nextCommand = 'tagator_menu';
    } else {
        await Send_Message(user_check.idvk, `⚠ Неизвестный тип: ${type}`);
        return;
    }
    
    if (currentTags.includes(17)) {
        currentTags = currentTags.filter(t => t !== 17);
    }
    
    // Добавляем конкретные теги романтики
    for (const tagId of romanceTagIds) {
        if (!currentTags.includes(tagId)) {
            currentTags.push(tagId);
        }
    }
    
    // Сохраняем
    if (isBlankConfig && blank_check) {
        await prisma.blank.update({
            where: { id: blank_check.id },
            data: { tag: JSON.stringify(currentTags) }
        });
    } else if (isLikeConfig) {
        await prisma.account.update({
            where: { id: user_check.id },
            data: { tag_like: JSON.stringify(currentTags) }
        });
    }
    
    const tagNames: string[] = [];
    for (const id of currentTags) {
        const name = await getTagById(id);
        if (name) tagNames.push(name);
    }
    
    const typeLabel = isBlankConfig ? 'анкеты' : 'для поиска';
    const finalKeyboard = new KeyboardBuilder()
        .callbackButton({ label: '🚫', payload: { command: 'exit' }, color: 'secondary' })
        .oneTime().inline();
    
    const addedTags = romanceTagIds.map(id => getTagById(id)).filter(Boolean).join(', ');
    
    await Send_Message(user_check.idvk, 
        `✅ Предпочтения сохранены!\n` +
        `📋 Выбрано: ${labels.join(', ')}`,
        finalKeyboard
    );
    
    await Logger(`(romance done save) ~ tags saved for ${typeLabel} by @${user_check.idvk}`);
    
    if (nextCommand === 'card_enter') {
        await handleShowBlank(context, payload);
    } else if (nextCommand === 'tagator_menu') {
        await handleTagatorMenu(context, payload);
    }
}

export async function handleRomanceToggleMaleFromLike(context: any, payload: any) {
    await handleRomanceToggleFromLike(context, 'male');
}

export async function handleRomanceToggleFemaleFromLike(context: any, payload: any) {
    await handleRomanceToggleFromLike(context, 'female');
}

export async function handleRomanceToggleBothFromLike(context: any, payload: any) {
    await handleRomanceToggleFromLike(context, 'both');
}

async function handleRomanceToggleFromLike(context: any, value: string) {
    const user_check = await prisma.account.findFirst({ where: { idvk: context.userId } })
    if (!user_check) { return }
    
    let currentPrefs: string[] = [];
    if (user_check.romance_preference) {
        try {
            currentPrefs = JSON.parse(user_check.romance_preference);
        } catch {}
    }
    
    if (currentPrefs.includes(value)) {
        currentPrefs = currentPrefs.filter(s => s !== value);
    } else {
        currentPrefs.push(value);
    }
    
    await setRomancePreferences(context.userId, currentPrefs);
    
    // Показываем обновлённое меню
    const keyboard = new KeyboardBuilder()
        .callbackButton({ 
            label: currentPrefs.includes('male') ? '✅ Мужские' : '👨 Мужские', 
            payload: { command: 'romance_toggle_male_from_like' }, 
            color: currentPrefs.includes('male') ? 'positive' : 'secondary' 
        })
        .callbackButton({ 
            label: currentPrefs.includes('female') ? '✅ Женские' : '👩 Женские', 
            payload: { command: 'romance_toggle_female_from_like' }, 
            color: currentPrefs.includes('female') ? 'positive' : 'secondary' 
        })
        .row()
        .callbackButton({ 
            label: currentPrefs.includes('both') ? '✅ Мужские и женские' : '👫 Мужские и женские', 
            payload: { command: 'romance_toggle_both_from_like' }, 
            color: currentPrefs.includes('both') ? 'positive' : 'secondary' 
        })
        .row()
        .callbackButton({ 
            label: '✅ Готово', 
            payload: { command: 'romance_done_from_like' }, 
            color: 'positive' 
        })
        .callbackButton({ 
            label: '🚫 Отмена', 
            payload: { command: 'exit' }, 
            color: 'secondary' 
        })
        .oneTime().inline();
    
    const labels = currentPrefs.map(s => {
        if (s === 'male') return 'мужские';
        if (s === 'female') return 'женские';
        if (s === 'both') return 'мужские и женские';
        return s;
    });
    
    await Send_Message(user_check.idvk, 
        `Укажите состав персонажей в сюжете:\n\n` +

        `💡 Можно выбрать несколько вариантов.`,
        keyboard
    );
}

export async function handleRomanceDoneFromLike(context: any, payload: any) {
    const user_check = await prisma.account.findFirst({ where: { idvk: context.userId } })
    if (!user_check) { return }
    
    const currentPrefs = await getRomancePreferences(context.userId);
    
    if (currentPrefs.length === 0) {
        await Send_Message(user_check.idvk, 
            `⚠ Вы не выбрали ни одного варианта.\n\n` +
            `Пожалуйста, выберите хотя бы один вариант.`
        );
        return;
    }
    
    const labels = currentPrefs.map(s => {
        if (s === 'male') return 'яой';
        if (s === 'female') return 'юри';
        if (s === 'both') return 'гет';
        return s;
    });
    
    const romanceTagIds: number[] = [];
    for (const pref of currentPrefs) {
        if (pref === 'male' && !romanceTagIds.includes(41)) romanceTagIds.push(41);
        if (pref === 'female' && !romanceTagIds.includes(42)) romanceTagIds.push(42);
        if (pref === 'both' && !romanceTagIds.includes(40)) romanceTagIds.push(40);
    }
    
    let currentTags: number[] = [];
    if (user_check.tag_like) {
        try {
            currentTags = JSON.parse(user_check.tag_like);
        } catch {}
    }
    
    currentTags = currentTags.filter(t => t !== 17 && t !== 40 && t !== 41 && t !== 42);
    
    // Добавляем конкретные теги романтики в поиск
    for (const tagId of romanceTagIds) {
        if (!currentTags.includes(tagId)) {
            currentTags.push(tagId);
        }
    }
    
    await prisma.account.update({
        where: { id: user_check.id },
        data: { tag_like: JSON.stringify(currentTags) }
    });
    
    const tagNames: string[] = [];
    for (const id of currentTags) {
        const name = await getTagById(id);
        if (name) tagNames.push(name);
    }
    
    const addedTags = romanceTagIds.map(id => getTagById(id)).filter(Boolean).join(', ');
    
    await Send_Message(user_check.idvk, 
        `✅ Предпочтения для поиска сохранены!\n` +
        `📋 Выбрано: ${labels.join(', ')}`
    );
    
    await handleTagatorResearchConfigLike(context, { categoryIndex: 2 });
    
    await Logger(`(romance done like) ~ like tags saved (SEARCH) by @${user_check.idvk}`);
}