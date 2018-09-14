/* eslint-env mocha */
'use strict'

const m = require('mithril/render/hyperscript')
const mTrust = require('mithril/render/trust')
const mq = require('./')
const keyCode = require('yields-keycode')
const expect = require('expect')

function noop() {}

describe('mithril query', function() {
  describe('basic selection of things', function() {
    let el,
      out,
      tagEl,
      concatClassEl,
      classEl,
      idEl,
      innerString,
      dataAttr,
      booleanEl
    let devilEl, idClassEl, arrayOfArrays, rawHtml, numbah, disabled
    let contentAsArray
    let msxOutput

    beforeEach(function() {
      tagEl = m('span', 123)
      concatClassEl = m('.onetwo')
      classEl = m('.one.two')
      idEl = m('#two')
      innerString = 'Inner String'
      devilEl = m('.three', 'DEVIL')
      idClassEl = m('#three.three')
      arrayOfArrays = m('#arrayArray')
      disabled = m('[disabled]')
      dataAttr = m('[data-foo=bar]')
      contentAsArray = m('.contentAsArray', m('.inner', [123, 'foobar']))
      rawHtml = mTrust('<div class="trusted"></div>')
      numbah = 10
      booleanEl = m('span', true)
      el = m('.root', [
        tagEl,
        concatClassEl,
        classEl,
        innerString,
        idEl,
        devilEl,
        idClassEl,
        [[arrayOfArrays]],
        undefined,
        dataAttr,
        numbah,
        booleanEl,
        rawHtml,
        disabled,
        msxOutput,
        contentAsArray,
      ])
      out = mq(el)
    })

    it('should allow to select by selectors', function() {
      expect(out.first('span')).toEqual(tagEl)
      expect(out.first('.one')).toEqual(classEl)
      expect(out.first('div > .one')).toEqual(classEl)
      expect(out.first('.two.one')).toEqual(classEl)
      expect(out.first('#two')).toEqual(idEl)
      expect(out.first('div#two')).toEqual(idEl)
      expect(out.first('.three#three')).toEqual(idClassEl)
      expect(out.first(':contains(DEVIL)')).toEqual(devilEl)
      expect(out.first('#arrayArray')).toEqual(arrayOfArrays)
      expect(out.first(':contains(123)')).toEqual(tagEl)
      expect(out.first(':contains(true)')).toEqual(booleanEl)
      expect(out.first(':contains(Inner String)').attrs.className).toEqual(
        'root'
      )
      out.should.have('.contentAsArray :contains(123foobar)')
      expect(out.first('[disabled]')).toEqual(disabled)
      expect(out.first('[data-foo=bar]')).toEqual(dataAttr)
      expect(out.find('[data-foo=no]')).toEqual([])
    })

    describe('traverse from a parent to its children for sibling selectors', function() {
      it('adjacent sibling combinator ', function() {
        let output = mq(m('div', [
          m('div.first'),
          m('div.second')
        ]))

        output.should.have('.first + .second')
        output.should.not.have('.second + .first')
      })

      it('general sibling combinator', function() {
        let output = mq(m('div', [
          m('span'),
          m('p'),
          m('span'),
          m('a'),
          m('span')
        ]))

        expect(output.find('p ~ span').length).toEqual(2)
      })
    })
  })

  describe('events', function() {
    let out, events, eventEl
    beforeEach(function() {
      events = {
        onclick: noop,
        onfocus: noop,
      }
      eventEl = m('input#eventEl', {
        onclick(evt) {
          events.onclick(evt)
        },
        onfocus(evt) {
          events.onfocus(evt)
        },
        oninput(evt) {
          events.oninput(evt)
        },
        myCustomEvent(evt) {
          events.myCustomEvent(evt)
        },
      })
      out = mq(m('.root', eventEl))
    })

    it('should react on click events', function(done) {
      events.onclick = function() {
        done()
      }
      out.click('#eventEl')
    })

    it('should react on focus events', function(done) {
      events.onfocus = function() {
        done()
      }
      out.focus('#eventEl')
    })

    it('should react on input events', function(done) {
      events.oninput = function(event) {
        expect(event.target.value).toBe('huhu')
        expect(event.currentTarget.value).toBe('huhu')
        done()
      }
      out.setValue('#eventEl', 'huhu')
    })

    it('should allow sending custom events', function(done) {
      events.myCustomEvent = function(event) {
        expect(event).toBe('pop')
        done()
      }
      out.trigger('#eventEl', 'myCustomEvent', 'pop')
    })
  })

  describe('contains', function() {
    it('should allow to select by content', function() {
      const out = mq(m('.containstest', ['Inner String', null, 123]))
      expect(out.contains('Inner String')).toBe(true)
      expect(out.contains(123)).toBe(true)
    })

    it('should return false if the content was not found', function() {
      const out = mq(m('.containstest', ['Inner String', null, 123]))
      expect(out.contains('Non Existent Inner String')).toBe(false)
    })

    describe('trusted content', function() {
      it('should allow to select by content', function() {
        const out = mq(
          m('.containstest', [mTrust('<p>Trusted String</p>'), 'Inner String'])
        )
        expect(out.contains('Inner String')).toBe(true)
        expect(out.contains('Trusted String')).toBe(true)
      })
    })
  })
})

describe('should style assertions', function() {
  let out

  beforeEach(function() {
    out = mq(m('.shouldtest', [m('span'), m('.one'), m('.two', 'XXXXX')]))
  })

  it('should not throw when as expected', function() {
    expect(out.should.have('span')).toBe(true)
    expect(function() {
      out.should.have('span')
    }).toNotThrow()
    expect(function() {
      out.should.have('.one')
    }).toNotThrow()
  })

  it('should throw when no element matches', function() {
    expect(function() {
      out.should.have('table')
    }).toThrow()
  })

  it('should throw when count is not exact', function() {
    expect(function() {
      out.should.have(100, 'div')
    }).toThrow()
  })

  it('should not throw when count is exact', function() {
    expect(function() {
      out.should.have(3, 'div')
    }).toNotThrow()
  })

  it('should not throw when containing string', function() {
    expect(function() {
      out.should.contain('XXXXX')
    }).toNotThrow()
  })

  it('should not throw when expecting unpresence of unpresent', function() {
    expect(function() {
      out.should.not.have('table')
    }).toNotThrow()
  })

  it('should throw when expecting unpresence of present', function() {
    expect(function() {
      out.should.not.have('span')
    }).toThrow()
  })

  it('should throw when containing unexpected string', function() {
    expect(function() {
      out.should.not.contain('XXXXX')
    }).toThrow()
  })

  it('should not throw when not containing string as expected', function() {
    expect(function() {
      out.should.not.contain('FOOOO')
    }).toNotThrow()
  })

  it('should not throw when there are enough elements', function() {
    expect(function() {
      out.should.have.at.least(3, 'div')
    }).toNotThrow()
  })

  it('should throw when not enough elements', function() {
    expect(function() {
      out.should.have.at.least(40000, 'div')
    }).toThrow()
  })

  it('should not throw when an array of selectors is present', function() {
    expect(function() {
      out.should.have(['div', '.one', '.two'])
    }).toNotThrow()
  })

  it('should not throw when matching an empty array of selectors', function() {
    expect(function() {
      out.should.have([])
    }).toNotThrow()
  })

  it('should throw when at least a selector is not present', function() {
    expect(function() {
      out.should.have(['.one', 'table'])
    }).toThrow()
  })
})

describe('null objects', function() {
  it('should ignore null objects', function() {
    function view() {
      return m('div', [null, m('input'), null])
    }
    mq({view}).should.have('input')
    expect(function() {
      mq({view}).should.have('input')
    }).toNotThrow()
  })
})

describe('autorender', function() {
  describe('autorerender component', function() {
    let out

    beforeEach(function() {
      const component = {
        oninit(vnode) {
          vnode.state = {
            visible: true,
            toggleMe() {
              vnode.state.visible = !vnode.state.visible
            },
          }
        },
        view(vnode) {
          return m(
            vnode.state.visible ? '.visible' : '.hidden',
            {
              onclick: vnode.state.toggleMe,
            },
            'Test'
          )
        },
      }
      out = mq(component)
    })

    it('should autorender', function() {
      out.should.have('.visible')
      out.click('.visible')
      out.should.have('.hidden')
      out.click('.hidden', null, true)
      out.should.have('.hidden')
    })

    it('should update boolean attributes', function() {
      out = mq({view: function() {
        return m('select', [m('option', { value: 'foo', selected: true })])
      }})
      out.should.have('option[selected]')
    })
  })

  describe('autorerender function', function() {
    it('should autorender function', function() {
      function view(vnode) {
        return m(
          vnode.state.visible ? '.visible' : '.hidden',
          {
            onclick() {
              vnode.state.visible = !vnode.state.visible
            },
          },
          'Test'
        )
      }

      const out = mq({
        oninit: vnode => vnode.state.visible = true,
        view
      })
      out.should.have('.visible')
      out.click('.visible')
      out.should.have('.hidden')
      out.click('.hidden', null, true)
      out.should.have('.hidden')
    })
  })
})

describe('access root element', function() {
  it('should be possible to access root element', function() {
    function view() {
      return m('div', ['foo', 'bar'])
    }
    const out = mq({view})
    expect(out.rootNode.tag).toEqual('div')
    expect(out.rootNode.children.length).toEqual(2)
    expect(out.rootNode.children[0].children).toEqual('foo')
    expect(out.rootNode.children[1].children).toEqual('bar')
  })
})

describe('trigger keyboard events', function() {
  it('should be possible to trigger keyboard events', function() {
    const component = {
      updateSpy: noop,
      oninit(vnode) {
        vnode.state = {
          visible: true,
          update(event) {
            if (event.keyCode === 123) vnode.state.visible = false
            if (event.keyCode === keyCode('esc')) vnode.state.visible = true
            component.updateSpy(event)
          },
        }
        return vnode.state
      },
      view(vnode) {
        return m(
          vnode.state.visible ? '.visible' : '.hidden',
          {
            onkeydown: vnode.state.update,
          },
          'describe'
        )
      },
    }
    const out = mq(component)
    component.updateSpy = function(event) {
      expect(event.target.value).toEqual('foobar')
      expect(event.altKey).toBe(true)
      expect(event.shiftKey).toBe(true)
      expect(event.ctrlKey).toBe(false)
    }
    out.keydown('div', 'esc', {
      target: { value: 'foobar' },
      altKey: true,
      shiftKey: true,
    })
    component.updateSpy = noop
    out.should.have('.visible')
    out.keydown('div', 123)
    out.should.have('.hidden')
  })
})

describe('onremove', function() {
  it('should not throw when init with rendered view', function() {
    const out = mq(m('span', 'random stuff'))
    expect(out.onremove).toNotThrow
  })
})

describe('components', function() {
  let out, myComponent, ES6Component

  beforeEach(function() {
    myComponent = {
      oninit(vnode) {
        vnode.state = {
          foo: vnode.attrs.data || 'bar',
          firstRender: true,
        }
      },
      onupdate(vnode) {
        vnode.state.firstRender = false
      },
      view(vnode) {
        return m(
          'aside',
          {
            className: vnode.state.firstRender ? 'firstRender' : '',
          },
          [vnode.attrs.data, 'hello', vnode.state.foo]
        )
      },
    }

    ES6Component = class {
      oninit(vnode) {
        this.hello = 'hello'
        vnode.state = {
          foo: vnode.attrs.data || 'bar',
          firstRender: true,
        }
      }
      onupdate(vnode) {
        vnode.state.firstRender = false
      }
      view(vnode) {
        return m(
          'aside',
          {
            className: vnode.state.firstRender ? 'firstRender' : '',
          },
          [vnode.attrs.data, this.hello, vnode.state.foo]
        )
      }
    }
  })

  describe('plain components', function() {
    it('should work without args', function() {
      out = mq(myComponent)
      out.should.have('aside')
      out.should.contain('hello')
    })

    it('should work with directly injected components', function() {
      out = mq(myComponent, { data: 'my super data' })
      out.should.have('aside')
      out.should.contain('my super data')
    })

    it('should work without oninit', function() {
      const simpleComponent = {
        view(vnode) {
          return m('span', vnode.attrs.data)
        },
      }
      out = mq(simpleComponent, { data: 'mega' })
      out.should.have('span')
      out.should.contain('mega')
    })

    it('should call onremove on globalonremove', function(done) {
      myComponent.onremove = function() {
        done()
      }
      const out = mq(myComponent)
      out.onremove()
    })
  })

  describe('closure components', function() {
    function closureComponent(vnode) {
      return {
        view() {
          return m('div', 'Hello from ' + vnode.attrs.name)
        },
      }
    }

    it('should support it as arguments', function() {
      out = mq(closureComponent, { name: 'Homer' })
      out.should.have('div:contains(Hello from Homer)')
    })

    it('should support it if embedded', function() {
      out = mq(m('aside', m(closureComponent, { name: 'Homer' })))
      out.should.have('div:contains(Hello from Homer)')
    })
  })

  describe('es6 components', function() {
    it('should work without args', function() {
      out = mq(ES6Component)
      out.should.have('aside')
      out.should.contain('hello')
    })

    it('should work with directly injected components', function() {
      out = mq(ES6Component, { data: 'my super data' })
      out.should.have('aside')
      out.should.contain('my super data')
    })

    it('should work without oninit', function() {
      class SimpleES6Component {
        view(vnode) {
          return m('div', 'Hello from ' + vnode.attrs.name)
        }
      }
      out = mq(SimpleES6Component, { name: 'Homer' })
      out.should.have('div:contains(Hello from Homer)')
    })

    it('should call onremove on globalonremove', function(done) {
      ES6Component.prototype.onremove = function() {
        done()
      }
      const out = mq(ES6Component)
      out.onremove()
    })
  })

  describe('es6 instantiated component', function() {
    it('should work without args', function() {
      out = mq(new ES6Component())
      out.should.have('aside')
      out.should.contain('hello')
    })

    it('should work with directly injected components', function() {
      out = mq(new ES6Component(), { data: 'my super data' })
      out.should.have('aside')
      out.should.contain('my super data')
    })

    it('should work without oninit', function() {
      class SimpleES6Component {
        view(vnode) {
          return m('div', 'Hello from ' + vnode.attrs.name)
        }
      }
      out = mq(new SimpleES6Component(), { name: 'Homer' })
      out.should.have('div:contains(Hello from Homer)')
    })

    it('should call Ponremove on globalonremove', function(done) {
      ES6Component.prototype.onremove = function() {
        done()
      }
      const out = mq(new ES6Component())
      out.onremove()
    })
  })

  describe('embedded components', function() {
    it('should work without args', function() {
      out = mq(
        m(
          'div',
          m({
            view() {
              return m('strong', 'bar')
            },
          })
        )
      )
      out.should.have('strong')
      out.should.contain('bar')
    })

    it('should work with args', function() {
      out = mq(m('span', m(myComponent, { data: 'my little data' })))
      out.should.have('aside')
      out.should.contain('my little data')
    })

    it('should work without oninit', function() {
      const simpleComponent = {
        view(vnode) {
          return m('span', vnode.attrs.data)
        },
      }
      out = mq(m('div', m(simpleComponent, { data: 'mega' })))
      out.should.have('span')
      out.should.contain('mega')
    })

    it('should call onremove on globalonremove', function(done) {
      myComponent.onremove = function() {
        done()
      }
      out = mq(m('span', m(myComponent)))
      out.onremove()
    })
  })

  describe('embedded es6 components', function() {
    it('should work without args', function() {
      out = mq(
        class {
          view() {
            return m(
              class {
                view() {
                  return m('strong', 'bar')
                }
              }
            )
          }
        }
      )
      out.should.have('strong')
      out.should.contain('bar')
    })

    it('should work with args', function() {
      out = mq(m('span', m(ES6Component, { data: 'test-data' })))
      out.should.have('aside')
      out.should.contain('test-data')
    })

    it('should work without oninit', function() {
      class SimpleES6Component {
        view(vnode) {
          return m('span', vnode.attrs.data)
        }
      }
      out = mq(m('div', m(SimpleES6Component, { data: 'mega' })))
      out.should.have('span')
      out.should.contain('mega')
    })

    it('should call onremove on globalonremove', function(done) {
      ES6Component.prototype.onremove = function() {
        done()
      }
      out = mq(m('span', m(ES6Component)))
      out.onremove()
    })
  })

  describe('embedded es6 instantiated components', function() {
    it('should work without args', function() {
      class C1 {
        view() {
          return m('strong', 'bar')
        }
      }
      class C2 {
        view() {
          return m(C1)
        }
      }
      out = mq(new C2())
      out.should.have('strong')
      out.should.contain('bar')
    })

    it('should work with args', function() {
      out = mq(m('span', m(new ES6Component(), { data: 'test-data' })))
      out.should.have('aside')
      out.should.contain('test-data')
    })

    it('should work without oninit', function() {
      class SimpleES6Component {
        view(vnode) {
          return m('span', vnode.attrs.data)
        }
      }
      out = mq(m('div', m(new SimpleES6Component(), { data: 'mega' })))
      out.should.have('span')
      out.should.contain('mega')
    })

    it('should call onremove on globalonremove', function(done) {
      ES6Component.prototype.onremove = function() {
        done()
      }
      out = mq(m('span', m(new ES6Component())))
      out.onremove()
    })
  })

  describe('state', function() {
    it('should preserve components state', function() {
      out = mq(m('div', m(myComponent, 'haha')))
      out.should.have('aside.firstRender')
      out.redraw()
      out.should.not.have('aside.firstRender')
    })

    it('should preserve es6 component state', function() {
      out = mq(m('div', m(ES6Component, 'haha')))
      out.should.have('aside.firstRender')
      out.redraw()
      out.should.not.have('aside.firstRender')
    })

    it('should preserve es6 instantiated component state', function() {
      out = mq(m('div', m(new ES6Component(), 'haha')))
      out.should.have('aside.firstRender')
      out.redraw()
      out.should.not.have('aside.firstRender')
    })
  })

  describe('state with multiple of same elements', function() {
    it('should preserve components state for every used component', function() {
      out = mq(m('div', [m(myComponent), m(myComponent)]))
      out.should.have(2, 'aside.firstRender')
      out.redraw()
      out.should.not.have('aside.firstRender')
    })

    it('should preserve es6 component state with multiples of the same element', function() {
      out = mq(m('div', [m(ES6Component), m(ES6Component)]))
      out.should.have(2, 'aside.firstRender')
      out.redraw()
      out.should.not.have('aside.firstRender')
    })

    it('should preserve es6 instantiated component state with multiples of the same elements', function() {
      out = mq(m('div', [m(new ES6Component()), m(new ES6Component())]))
      out.should.have(2, 'aside.firstRender')
      out.redraw()
      out.should.not.have('aside.firstRender')
    })
  })

  describe('components that return components', function() {
    it('should work', function() {
      out = mq(
        m(
          'div',
          m({
            view() {
              return m(myComponent)
            },
          })
        )
      )
      out.should.have('aside.firstRender')
    })
    it('should work with child selectors', function() {
      out = mq(
        m(
          'div',
          m({
            view() {
              return m('.foo', m(myComponent, 'kiki'))
            },
          })
        )
      )
      out.should.have('.foo aside.firstRender')
    })
  })

  describe('component with leading array', function() {
    it('should be able to query children within leading array component', function() {
      let comp1 = { view: () => m('.comp1', m(comp2)) }
      let comp2 = { view: () => [ m('.comp2') ] }
      let output = mq(m(comp1))
      output.should.have('.comp1 .comp2') // Nope!
    })
  })

  describe('initialisation', function() {
    it('should copy init args to state', function() {
      const myComponent = {
        label: 'foobar',
        view(vnode) {
          return m('div', vnode.state.label)
        },
      }
      out = mq(myComponent)
      out.should.contain('foobar')
    })

    it('should initialize all nested components', function() {
      let oninit = 0
      let view = 0

      const myComponent = {
        oninit() {
          oninit++
        },
        view(vnode) {
          view++
          return m('i', vnode.children)
        },
      }

      mq(m(myComponent, m(myComponent, m(myComponent))))

      expect(oninit).toBe(3)
      expect(view).toBe(3)
    })

    it('should ignore components that returns null', function() {
      const nullComponent = {
        view() {
          return null
        },
      }
      mq(m(nullComponent, m(myComponent))).should.not.have('aside.firstRender')
    })
  })
})

describe('Logging', function() {
  it('should log', function(done) {
    const span = m('span', m('strong.tick', 'huhu'), m('em#tack', 'haha'))
    function logFn(nodes) {
      expect(nodes).toEqual([span])
      done()
    }
    const out = mq(m('div', span, m('.bla', 'blup')))
    out.log('span', logFn)
  })
})

describe('Elements with nested arrays', function() {
  it('should flatten', function() {
    mq(m('.foo', ['bar', [m('.baz')]])).should.have('.foo .baz')
    mq(m('.foo', [[m('bar')]])).should.have('.foo bar')
  })
})

describe('Exposing vnode', function() {
  it('should expose vnode of root component', function() {
    const myComponent = {
      view(vnode) {
        vnode.state.baz = 'foz'
      },
    }
    const out = mq(myComponent)
    expect(out.vnode.state.baz).toEqual('foz')
  })
})

describe('keys', function() {
  it('should distinguish components with different keys', function() {
    const firstComponent = {
      view() {
        return m('.first')
      },
    }
    const secondComponent = {
      view() {
        return m('.second')
      },
    }
    let i = 0
    const rootComponent = {
      view() {
        return m(i === 0 ? firstComponent : secondComponent, { key: i })
      },
    }
    const out = mq(rootComponent)
    out.should.have('.first')

    i = 1
    out.redraw()
    out.should.have('.second')
  })
})

