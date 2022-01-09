import { Action, parseActions } from './Action'
import { Event, parseEvents } from './Event'

export class Condition {
    step: string
    complete: boolean

    constructor(step: string, complete: boolean) {
        this.step = step
        this.complete = complete
    }
}


export class QuestStep {
    step: string
    trigger: string
    conditions: Condition[]
    actions: Action[]
    complete: boolean = false

    constructor(
        step: string, 
        trigger: string, 
        conditions: Condition[],
        actions: Action[]
    ) {
        this.step = step
        this.trigger = trigger
        this.conditions = conditions
        this.actions = actions
    }
}


export class Quest {
    name: string
    steps: QuestStep[]

    constructor(name: string, steps: QuestStep[]) {
        this.name = name
        this.steps = steps
    }

    /**
     * Try to update quest with given trigger
     */
    updateQuest(trigger: string): Action[] {
        let actions: Action[] = []

        // iter through steps and see if trigger is interesting 
        // & conditions are met
        for (let step of this.steps) {
            if (step.trigger == trigger && this.areConditionsMet(step)) {
                step.complete = true
                actions.push(...step.actions)
            }
        }

        return actions
    }

    areConditionsMet(step: QuestStep): boolean {
        for (let condition of step.conditions) {
            let conditionStep = this.steps.find(s => s.step == condition.step)
            if (conditionStep.complete != condition.complete)
                return false
        }
        return true
    }
}


const parseConditions = (rawConditions) => {
    const conditions = []

    for (const rawCondition of rawConditions) {
        conditions.push(
            new Condition(
                rawCondition.step, 
                rawCondition.complete))
    }

    return conditions
}


const parseSteps = (rawSteps: any[]) => {
    const steps: QuestStep[] = []

    for (const rawStep of rawSteps) {
        console.log(rawStep)
        
        steps.push(
            new QuestStep(
                rawStep.step, 
                rawStep.trigger, 
                parseConditions(rawStep.conditions),
                parseActions(rawStep.actions)))
    }

    return steps
}


export const parseQuests = (questsJSON: Array<any>) => {
    const quests: Array<Quest> = []

    for (const rawQuest of questsJSON) {
        console.log(rawQuest)

        quests.push(new Quest(
            rawQuest.name, 
            parseSteps(rawQuest.steps)))
    }

    return quests
}


export const getQuestSteps = (quests: Quest[]): QuestStep[] => {
    let steps: QuestStep[] = []

    for (let q of quests) {
        steps.push(...q.steps)
    }

    return steps
}
