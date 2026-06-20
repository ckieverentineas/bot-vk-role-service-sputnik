// module/account/age_verification.ts
import prisma from "../prisma";
import { Keyboard } from "vk-io";
import { answerTimeLimit } from "../..";
import { Logger } from "../helper";

export async function isAgeVerified(userId: number): Promise<boolean> {
    const user = await prisma.account.findFirst({
        where: { idvk: userId }
    });
    
    if (!user) return false;
    return user.age_verified || false;
}

export async function setAgeVerified(userId: number, confirmed: boolean = true): Promise<void> {
    const user = await prisma.account.findFirst({
        where: { idvk: userId }
    });
    
    if (!user) return;
    
    await prisma.account.update({
        where: { id: user.id },
        data: { age_verified: confirmed }
    });
}

export async function requestAgeVerification(context: any): Promise<boolean> {
    const keyboard = Keyboard.builder()
        .textButton({ label: '✅ Да, подтверждаю', payload: { command: 'age_confirm_yes' }, color: 'positive' })
        .textButton({ label: '❌ Нет', payload: { command: 'age_confirm_no' }, color: 'negative' })
        .row()
        .oneTime()
        .inline();
    
    const answer = await context.question(
        `🔞 Подтверждение возраста\n\n` +
        `Вы выбрали контент, для просмотра которого требуется подтверждение совершеннолетия.\n\n` +
        `⚠ Нажимая "Да, подтверждаю", вы подтверждаете, что:\n` +
        `• Достигли 18 лет\n` +
        `• Понимаете, что контент создан пользователями\n` +
        `• Несёте ответственность за просматриваемый контент\n\n` +
        `💡 У вас есть 5 минут на принятие решения!`,
        { keyboard, answerTimeLimit }
    );
    
    if (answer.isTimeout) {
        await context.send(`⏰ Время ожидания подтверждения истекло!`);
        return false;
    }
    
    if (answer.payload?.command === 'age_confirm_yes') {
        await setAgeVerified(context.senderId, true);
        await context.send(`✅ Спасибо за подтверждение!`);
        await Logger(`(age) ~ user ${context.senderId} confirmed 18+`);
        return true;
    } else {
        await context.send(`❌ Без подтверждения совершеннолетия доступ к этому контенту ограничен.`);
        await Logger(`(age) ~ user ${context.senderId} denied age confirmation`);
        return false;
    }
}

export async function handleAgeVerification(context: any): Promise<boolean> {
    const verified = await isAgeVerified(context.senderId);
    
    if (!verified) {
        return await requestAgeVerification(context);
    }
    
    return true;
}