import { KeyboardBuilder } from "vk-io";

export async function Keyboard_Swap(length: number) {
    const keyboard = new KeyboardBuilder()
    keyboard.textButton({ label: '⛔ Налево', color: 'secondary' })
    .textButton({ label: '✅ Направо', color: 'secondary' }).row()
    .textButton({ label: '🚫 Назад', color: 'secondary' }).row()
    .textButton({ label: `⌛ В очереди [${length}]`, color: 'secondary' }).row()
    .textButton({ label: '⚠ Жалоба', color: 'secondary' }).row()
    .oneTime().inline()
    return keyboard
}
