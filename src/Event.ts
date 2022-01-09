import { Action, parseAction } from './Action'

export class Event {
    trigger: string;
    actions: Array<Action>

    constructor(trigger: string, actions: Array<any>) {
        this.trigger = trigger;
        this.actions = actions;
    }
}


export const parseEvents = (eventsJSON: Array<any>): Event[] => {
    const events: Array<Event> = []
  
    for (const rawEvent of eventsJSON) {
      const event = new Event(rawEvent.trigger, [])
      for (const { type, value } of rawEvent.actions) {
        event.actions.push(parseAction(type, value))
      }
      events.push(event)
    }
    
    return events
}


export const eventsContainsTrigger = (events: Event[], trigger: string): boolean => {
    for (let event of events) {
        if (event.trigger == trigger)
            return true
    }

    return false
}