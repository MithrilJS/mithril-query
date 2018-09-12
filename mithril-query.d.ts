declare var MithrilQuery: (...options: any[]) => MithrilQueryInstance

interface KeyEventOptions {
  target?: any
  value?: any
  altKey?: boolean
  shiftKey?: boolean
  ctrlKey?: boolean
  silent?: boolean
}

interface MithrilQueryInstance {
  rootNode: any
  redraw: () => void
  first: (selector: string) => any
  has: (selector: string) => boolean
  contains: (value: string) => string
  find: (selector: string) => any[]
  setValue: (selector: string, value: string, silent?: boolean) => void
  focus: (selector: string, event?: Event, silent?: boolean) => void
  click: (selector: string, event?: Event, silent?: boolean) => void
  blur: (selector: string, event: Event, silent?: boolean) => void
  mousedown: (selector: string, event: Event, silent?: boolean) => void
  mouseup: (selector: string, event: Event, silent?: boolean) => void
  mouseover: (selector: string, event: Event, silent?: boolean) => void
  mouseout: (selector: string, event: Event, silent?: boolean) => void
  mouseenter: (selector: string, event: Event, silent?: boolean) => void
  mouseleave: (selector: string, event: Event, silent?: boolean) => void
  contextmenu: (selector: string, event: Event, silent?: boolean) => void
  keydown: (selector: string, key: string, event: Event, silent?: boolean) => void
  keypress: (selector: string, key: string, event: Event, silent?: boolean) => void
  keyup: (selector: string, key: string, event: Event, silent?: boolean) => void
  trigger: (selector: string, eventName: string, event: Event, silent?: boolean) => void
  shouldHave: {
    at: {
      least: (minCount: number, selector: string) => boolean
    }
  }
  should: {
    not: {
      have: (selector: string) => boolean
      contain: (value: string) => boolean
    }
    have: {
      (expectedCount: number, selector: string): boolean

      at: {
        least: (minCount: number, selector: string) => boolean
      }
    }

    contain: (value: string) => boolean
  }
}

declare module 'mithril-query' {
  export = MithrilQuery
}
