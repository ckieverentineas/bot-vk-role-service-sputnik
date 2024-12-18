import { Keyboard } from "vk-io";
import { answerTimeLimit, chat_id } from "..";
import prisma from "./prisma";
import { Keyboard_Index, Logger, Send_Message, User_Info } from "./helper";

export async function User_Registration(context: any) {
    //согласие на обработку
	const answer: any = await context.question(`⚠ Что вам следует знать о Спутнике: \n⭐ Любая форма рекламы запрещена;\n⭐ Мы не поддерживаем ненормативную лексику; \n⭐ При написании анкеты избегайте непристойных и грязных слов и выражений;\n⭐ Весь пошлый контент крайне рекомендуется оставить для личной переписки;\n⭐ Помните, что Спутник — бот для поиска соигрока, а не площадка для личных бесед;\n⭐ Соблюдайте уважение к участникам сообщества.\n🚀 Коротко: рекомендуется без мата, пошлости и флуда в анкетах. Спутник — не притон.\n📜 Распишитесь здесь о своем согласии на обработку персональных данных и подтвердите, что вы обязуетесь соблюдать вышеизложенные рекомендации.\n💬 В тот же миг в ваших руках магическим образом появился пергамент.\n💡 У вас есть 10 минут на принятие решения!`,
        {	
            keyboard: Keyboard.builder()
            .textButton({ label: '✏', payload: { command: 'Согласиться' }, color: 'positive' }).row()
            .textButton({ label: '👣', payload: { command: 'Отказаться' }, color: 'negative' }).oneTime(),
            answerTimeLimit
        }
    );
    if (answer.isTimeout) { return await context.send(`⏰ Время ожидания подтверждения согласия истекло!`) }
    if (!/да|yes|Согласиться|конечно|✏/i.test(answer.text|| '{}')) {
        await context.send('⌛ Вы отказались дать свое согласие. Если что, заглядывайте на чай');
        return;
    }
    //приветствие игрока
    const visit: any = await context.question(`⌛ Поставив свою подпись, вы увидели Хранителя Спутника, который что-то писал на листке пергамента.`,
        { 	
            keyboard: Keyboard.builder()
            .textButton({ label: '🖐 Подойти и поздороваться', payload: { command: 'Согласиться' }, color: 'positive' }).row()
            .textButton({ label: '⏰ Ждать, пока Хранитель закончит', payload: { command: 'Отказаться' }, color: 'negative' }).oneTime().inline(),
            answerTimeLimit
        }
    );
    if (visit.isTimeout) { return await context.send(`⏰ Время ожидания активности истекло!`) }
    const save = await prisma.account.create({	data: {	idvk: context.senderId } })
    const info = await User_Info(context)
    await context.send(`⌛ Хранитель вас увидел и сказал:\n — Добро пожаловать в Спутник! \n ⚖Вы зарегистрировались в системе, ${info.first_name}\n 🕯 GUID: ${save.id}. \n 🎥 idvk: ${save.idvk}\n ⚰ Дата Регистрации: ${save.crdate}\n`)
    await Logger(`In database created new user with uid [${save.id}] and idvk [${context.senderId}]`)
    /*await context.send(`⚠ Настоятельно рекомендуем ознакомиться с инструкцией эксплуатации системы "Центробанк Магомира":`,{ 	
        keyboard: Keyboard.builder()
        .urlButton({ label: '⚡ Инструкция', url: `https://vk.com/@bank_mm-instrukciya-po-polzovaniu-botom-centrobanka-magomira` }).row().inline(),
        answerTimeLimit
    })*/
    const ans_selector = `⁉ @id${save.idvk}(${info.first_name}) легально регистрируется в Спутнике под GUID: ${save.id}!`
    await Send_Message(chat_id, ans_selector)
    await Keyboard_Index(context, `💡 Подсказка: Базовая команда [!спутник] без квадратных скобочек!`)
}