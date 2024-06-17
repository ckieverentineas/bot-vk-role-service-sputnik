import { HearManager } from "@vk-io/hear";
import { randomInt } from "crypto";
import { Keyboard, KeyboardBuilder } from "vk-io";
import { IQuestionMessageContext } from "vk-io-question";
import { root } from ".";

export function registerUserRoutes(hearManager: HearManager<IQuestionMessageContext>): void {
	hearManager.hear(/init/, async (context: any) => {
		if (context.senderId != root) { return }
	})
}