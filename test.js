/* eslint-env mocha */
'use strict'

const m = require('mithril/render/hyperscript')
const mTrust = require('mithril/render/trust')
const mq = require('./')
const keyCode = require('yields-keycode')
const expect = require('expect')
const ospec = require('ospec')
const BabelClassComponent = require('./fixtures/babel-class-component')
const BabelClassComponentWithDestructuring = require('./fixtures/babel-class-component-with-destructuring')
const WebpackBabelClassComponent = require('./fixtures/webpack-babel-transform-class-component')
const WebpackBabelClassComponentWithDestructuring = require('./fixtures/webpack-babel-transform-class-component-with-destructuring')
const WebpackBabelClassEsComponent = require('./fixtures/webpack-babel-transform-class-component-esmodules')
const WebpackBabelClassEsComponentWithDestructuring = require('./fixtures/webpack-babel-transform-class-component-esmodules-with-destructuring')

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
      booleanEl,
      unselected,
      selected,
      devilEl,
      idClassEl,
      arrayOfArrays,
      rawHtml,
      numbah,
      disabled,
      contentAsArray,
      contentAsDoubleArray,
      msxOutput

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
      unselected = m('option', { selected: false })
      selected = m('option', { selected: true })
      dataAttr = m('[data-foo=bar]')
      contentAsArray = m('.contentAsArray', m('.inner', [123, 'foobar']))
      contentAsDoubleArray = m('.contentAsDoubleArray', [['foobar']])
      rawHtml = mTrust('<div class="trusted"></div>')
      numbah = 10
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
        contentAsDoubleArray,
        unselected,
        selected,
      ])
      out = mq(el)
    })

    it('should allow to select by selectors', function() {
      out.should.have('span')
      out.should.have('.one')
      out.should.have('div > .one')
      out.should.have('.two.one')
      out.should.have('#two')
      out.should.have('div#two')
      out.should.have('.three#three')
      out.should.have(':contains(DEVIL)')
      out.should.have('#arrayArray')
      out.should.have(':contains(123)')
      out.should.have(':contains(Inner String)')
      out.should.have('.contentAsArray :contains(123foobar)')
      out.should.have('.contentAsDoubleArray:contains(foobar)')
      out.should.have('[disabled]')
      out.should.have('[data-foo=bar]')
      out.should.not.have('[data-foo=no]')
      out.should.have('option[selected]')
      out.should.have(2, 'option')
    })

    it('Should be able to parse identifier', function() {
      var output = mq(m('div', m('span#three.three')))
      output.should.have('span#three')
      output.should.have('span.three')
      output.should.have('.three#three')
      output.should.have('#three.three')
      output.should.have('div > #three')
      output.should.have('div > span#three')
      output.should.have('div > span#three.three')
    })

    describe('Should be able to parse class', function() {
      it('Should be able to parse multiple classes', function() {
        var output = mq(m('div', m('span.one.two')))
        output.should.have('.one')
        output.should.have('.two')
        output.should.have('.one.two')
        output.should.have('.two.one')
        output.should.have('div > .one')
        output.should.have('div > .two')
      })
    })

    describe('Should be able to parse content', function() {
      it('Should be able to parse basic content', function() {
        var output = mq(m('div', m('span', 'Some simple content')))
        output.should.have('span')
        output.should.have(':contains(Some simple content)')
        output.should.have('span:contains(Some simple content)')
        output.should.have('div > span:contains(Some simple content)')
      })

      it('Should be able to parse array content', function() {
        var output = mq(
          m('div', [m('.simple', [123, 'simple']), m('.double', [['double']])])
        )
        output.should.have('.simple:contains(123simple)')
        output.should.have(':contains(123simple)')
        output.should.have('div > .simple:contains(123simple)')

        output.should.have('.double:contains(double)')
        output.should.have(':contains(double)')
        output.should.have('div > .double:contains(double)')
      })

      it('Should be able to parse number content', function() {
        var output = mq(m('div', m('span', 123)))
        output.should.have('span')
        output.should.have(':contains(123)')
        output.should.have('span:contains(123)')
        output.should.have('div > span:contains(123)')
      })
    })

    describe('Should be able to parse attribute', function() {
      it('Should be able to parse basic attribute', function() {
        var output = mq(
          m('div', [m('input[disabled]'), m('span[data-foo=bar]')])
        )

        output.should.have('[disabled]')
        output.should.have('input[disabled]')
        output.should.have('div > input[disabled]')

        output.should.have('[data-foo=bar]')
        output.should.have('span[data-foo=bar]')
        output.should.have('div > span[data-foo=bar]')
      })

      it('Should be able to parse non-string attributes', function() {
        var output = mq(
          m(
            'div',
            m('input', {
              checked: true,
              disabled: false,
              number: 1234,
              object: {},
              array: [1, 2, 3, 4],
            })
          )
        )

        output.should.have('input[checked]')
        output.should.have('input')
        output.should.not.have('input[disabled]')
        output.should.have('input[number=1234]')
        output.should.have('input[object="[object Object]"]')
        output.should.have('input[array="1,2,3,4"]')
      })
    })

    describe('traverse from a parent to its children for sibling selectors', function() {
      it('adjacent sibling combinator ', function() {
        let output = mq(m('div', [m('div.first'), m('div.second')]))

        output.should.have('.first + .second')
        output.should.not.have('.second + .first')
      })

      it('general sibling combinator', function() {
        let output = mq(
          m('div', [m('span'), m('p'), m('span'), m('a'), m('span')])
        )
        expect(output.find('p ~ span').length).toEqual(2)
      })
    })
  })

  describe('events', function() {
    let out, onclick, onfocus, oninput, currentTarget

    beforeEach(function() {
      onclick = ospec.spy()
      onfocus = ospec.spy()
      oninput = ospec.spy(evt => (currentTarget = evt.currentTarget))
      out = mq(
        m('input#eventEl', {
          onclick,
          onfocus,
          oninput,
        })
      )
    })

    it('should react on click events', function() {
      out.click('#eventEl')
      expect(onclick.callCount).toBe(1)
    })

    it('should react on focus events', function() {
      out.focus('#eventEl')
      expect(onfocus.callCount).toBe(1)
    })

    it('should react on input events', function() {
      out.setValue('#eventEl', 'huhu')
      expect(oninput.callCount).toBe(1)
      const evt = oninput.args[0]
      expect(evt.target.value).toBe('huhu')

      // evt.currentTarget seems to get garbage collected to early,
      // so we save it in the event triggering phase and check the reference here
      expect(currentTarget.value).toBe('huhu')
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
    expect(() => out.should.have('span')).toNotThrow()
    expect(() => out.should.have('.one')).toNotThrow()
  })

  it('should throw when no element matches', function() {
    expect(() => out.should.have('table')).toThrow()
  })

  it('should throw when count is not exact', function() {
    expect(() => out.should.have(100, 'div')).toThrow()
  })

  it('should not throw when count is exact', function() {
    expect(() => out.should.have(3, 'div')).toNotThrow()
  })

  it('should not throw when containing string', function() {
    expect(() => out.should.contain('XXXXX')).toNotThrow()
  })

  it('should not throw when expecting unpresence of unpresent', function() {
    expect(() => out.should.not.have('table')).toNotThrow()
  })

  it('should throw when expecting unpresence of present', function() {
    expect(() => out.should.not.have('span')).toThrow()
  })

  it('should throw when containing unexpected string', function() {
    expect(() => out.should.not.contain('XXXXX')).toThrow()
  })

  it('should not throw when not containing string as expected', function() {
    expect(() => out.should.not.contain('FOOOO')).toNotThrow()
  })

  it('should not throw when there are enough elements', function() {
    expect(() => out.should.have.at.least(3, 'div')).toNotThrow()
  })

  it('should throw when not enough elements', function() {
    expect(() => out.should.have.at.least(40000, 'div')).toThrow()
  })

  it('should not throw when an array of selectors is present', function() {
    expect(() => out.should.have(['div', '.one', '.two'])).toNotThrow()
  })

  it('should not throw when matching an empty array of selectors', function() {
    expect(() => out.should.have([])).toNotThrow()
  })

  it('should throw when at least a selector is not present', function() {
    expect(() => out.should.have(['.one', 'table'])).toThrow()
  })
})

describe('null objects', function() {
  it('should ignore null objects', function() {
    function view() {
      return m('div', [null, m('input'), null])
    }
    mq({ view }).should.have('input')
    expect(() => mq({ view }).should.have('input')).toNotThrow()
  })
})

describe('autorender', function() {
  describe('autorerender component', function() {
    let out

    beforeEach(function() {
      const component = {
        oninit({ state }) {
          state.visible = true
          state.toggleMe = function() {
            state.visible = !state.visible
          }
        },
        view({ state }) {
          return m(
            state.visible ? '.visible' : '.hidden',
            {
              onclick: state.toggleMe,
            },
            'Test'
          )
        },
      }
      out = mq(component)
    })

    it('should autorender', async function() {
      out.should.have('.visible')
      out.click('.visible')
      out.should.not.have('.visible')
      out.should.have('.hidden')
      out.click('.hidden', { redraw: false })
      out.should.have('.hidden')
    })

    it('should update boolean attributes', function() {
      out = mq(m('select', [m('option', { value: 'foo', selected: true })]))
      out.should.have('option[selected]')
    })
  })

  describe('autorerender function', function() {
    it('should autorender function', function() {
      function view({ state }) {
        return m(
          state.visible ? '.visible' : '.hidden',
          {
            onclick() {
              state.visible = !state.visible
            },
          },
          'Test'
        )
      }

      const out = mq({
        oninit: ({ state }) => (state.visible = true),
        view,
      })
      out.should.have('.visible')
      out.click('.visible')
      out.should.have('.hidden')
      out.click('.hidden', { redraw: false })
      out.should.have('.hidden')
    })
  })
})

describe('access root element', function() {
  it('should be possible to access root element', function() {
    const out = mq(m('div', ['foo', 'bar']))
    expect(out.rootEl.children[0].tagName).toEqual('DIV')
    expect(out.rootEl.children[0].textContent).toEqual('foobar')
  })
})

describe('trigger keyboard events', function() {
  it('should be possible to trigger keyboard events', function() {
    const updateSpy = ospec.spy()
    const component = {
      visible: true,
      oninit: ({ state }) => {
        state.update = evt => {
          if (evt.keyCode === 123) state.visible = false
          if (evt.keyCode === keyCode('esc')) state.visible = true
          updateSpy(evt)
        }
      },
      view({ state }) {
        return m(
          state.visible ? '.visible' : '.hidden',
          { onkeydown: state.update },
          'describe'
        )
      },
    }
    const out = mq(component)
    out.keydown('div', 'esc', {
      altKey: true,
      shiftKey: true,
    })
    expect(updateSpy.callCount).toBe(1)
    const evt = updateSpy.args[0]
    expect(evt.altKey).toBe(true)
    expect(evt.shiftKey).toBe(true)
    expect(evt.ctrlKey).toBe(false)
    out.should.have('.visible')
    out.keydown('div', 123)
    out.should.have('.hidden')
  })
})

describe('lifecycles', function() {
  describe('oncreate/onupdate of vnodes', function() {
    it('should run oncreate', function() {
      let i = 0
      const oncreate = ospec.spy()
      const onupdate = ospec.spy()
      const out = mq({
        view: () => m('span', { oncreate, onupdate }, `random stuff ${i++}`),
      })
      expect(oncreate.callCount).toBe(1)
      expect(oncreate.args[0].dom.tagName).toBe('SPAN')
      expect(oncreate.args[0].dom.textContent).toBe('random stuff 0')
      expect(oncreate.args[0].dom.parentElement.tagName).toBe('BODY')
      expect(onupdate.callCount).toBe(0)
      out.redraw()
      expect(oncreate.callCount).toBe(1)
      expect(onupdate.callCount).toBe(1)
      expect(onupdate.args[0].dom.textContent).toBe('random stuff 1')
      out.redraw()
      expect(oncreate.callCount).toBe(1)
      expect(onupdate.callCount).toBe(2)
      expect(onupdate.args[0].dom.textContent).toBe('random stuff 2')
    })
  })

  describe('oncreate/onupdate of components', function() {
    it('should run oncreate', function() {
      const oncreate = ospec.spy()
      const onupdate = ospec.spy()
      const component = { view: () => 'comp', oncreate, onupdate }
      const out = mq(m(component))
      expect(oncreate.callCount).toBe(1)
      expect(onupdate.callCount).toBe(0)
      out.redraw()
      expect(oncreate.callCount).toBe(1)
      expect(onupdate.callCount).toBe(1)
      out.redraw()
      expect(oncreate.callCount).toBe(1)
      expect(onupdate.callCount).toBe(2)
    })
  })

  describe('onremove', function() {
    it('should not throw when init with rendered view', function() {
      const out = mq(m('span', 'random stuff'))
      expect(out.onremove).toNotThrow
    })
  })
})

describe('components', function() {
  let out, myComponent, ES6Component

  beforeEach(function() {
    myComponent = {
      oninit({ state, attrs }) {
        state.foo = attrs.data || 'bar'
        state.firstRender = true
      },
      onbeforeupdate({ state }) {
        state.firstRender = false
      },
      view({ state, attrs }) {
        return m(
          'aside',
          {
            className: state.firstRender ? 'firstRender' : '',
          },
          [attrs.data, 'hello', state.foo]
        )
      },
    }

    ES6Component = class {
      oninit({ state, attrs }) {
        this.hello = 'hello'
        state.foo = attrs.data || 'bar'
        state.firstRender = true
      }
      onbeforeupdate({ state, attrs }) {
        state.firstRender = false
      }
      view({ state, attrs }) {
        return m(
          'aside',
          {
            className: state.firstRender ? 'firstRender' : '',
          },
          [attrs.data, this.hello, state.foo]
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
        view({ attrs }) {
          return m('span', attrs.data)
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
    function closureComponent({ attrs }) {
      return {
        view() {
          return m('div', 'Hello from ' + attrs.name)
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
        view({ attrs }) {
          return m('div', 'Hello from ' + attrs.name)
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

  describe('babel transpiled es6 class components', function() {
    it('should work with simple components', function() {
      const out = mq(BabelClassComponent)
      out.should.have('div:contains(hello)')
    })

    it('should work with components with destructured options', function() {
      const out = mq(BabelClassComponentWithDestructuring)
      out.should.have('div:contains(hello)')
    })

    it('should work with transformed components in Webpack', function() {
      const out = mq(WebpackBabelClassComponent)
      out.should.have('div:contains(hello)')
    })

    it('should work with transformed components with destructured options in Webpack', function() {
      const out = mq(WebpackBabelClassComponentWithDestructuring)
      out.should.have('div:contains(hello)')
    })

    it('should work with transformed (useESModules) components in Webpack', function() {
      const out = mq(WebpackBabelClassEsComponent)
      out.should.have('div:contains(hello)')
    })

    it('should work with transformed (useESModules) components with destructured options in Webpack', function() {
      const out = mq(WebpackBabelClassEsComponentWithDestructuring)
      out.should.have('div:contains(hello)')
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
        view({ attrs }) {
          return m('div', 'Hello from ' + attrs.name)
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
        view({ attrs }) {
          return m('span', attrs.data)
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
        view({ attrs }) {
          return m('span', attrs.data)
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
        view({ attrs }) {
          return m('span', attrs.data)
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
      out = mq({ view: () => m('div', m(myComponent, 'haha')) })
      out.should.have('aside.firstRender')
      out.redraw()
      out.should.not.have('aside.firstRender')
    })

    it('should preserve es6 component state', function() {
      out = mq({ view: () => m('div', m(ES6Component, 'haha')) })
      out.should.have('aside.firstRender')
      out.redraw()
      out.should.not.have('aside.firstRender')
    })
  })

  describe('state with multiple of same elements', function() {
    it('should preserve components state for every used component', function() {
      out = mq({ view: () => m('div', [m(myComponent), m(myComponent)]) })
      out.should.have(2, 'aside.firstRender')
      out.redraw()
      out.should.not.have('aside.firstRender')
    })

    it('should preserve es6 component state with multiples of the same element', function() {
      out = mq({ view: () => m('div', [m(ES6Component), m(ES6Component)]) })
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
      let comp2 = { view: () => [m('.comp2')] }
      let output = mq(m(comp1))
      output.should.have('.comp1 .comp2') // Nope!
    })
  })

  describe('initialization', function() {
    it('should copy init args to state', function() {
      const myComponent = {
        label: 'foobar',
        view({ state }) {
          return m('div', state.label)
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
        view({ children }) {
          view++
          return m('i', children)
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

  it('should not confuse component instance index on redraw', function() {
    let showFirst = true

    const first = { view: () => m('div.first') }
    const second = { view: () => m('div.second') }

    var output = mq({
      view: () => m('div', [showFirst ? m(first) : m(second)]),
    })

    output.should.have('div.first')
    output.should.not.have('div.second')

    showFirst = false
    output.redraw()

    output.should.not.have('div.first')
    output.should.have('div.second')
  })
})

describe('Logging', function() {
  it('should log', function(done) {
    const span = m('span', m('strong.tick', 'huhu'), m('em#tack', 'haha'))
    function logFn(nodes) {
      expect(nodes.length).toEqual(1)
      done()
    }
    const out = mq({ view: () => m('div', span, m('.bla', 'blup')) })
    out.log('span', logFn)
  })
})

describe('Elements with nested arrays', function() {
  it('should flatten', function() {
    mq(m('.foo', ['bar', [m('.baz')]])).should.have('.foo .baz')
    mq(m('.foo', [[m('bar')]])).should.have('.foo bar')
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
