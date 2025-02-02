import Vue from 'vue'
import { serialize } from 'cookie'
import colorSchemeComponent from './color-scheme'

Vue.component('<%= options.componentName %>', colorSchemeComponent)

const cookieKey = '<%= options.cookie.key %>'
const cookieOptions = JSON.parse('<%= JSON.stringify(options.cookie.options) %>')
const colorMode = window['<%= options.globalName %>']

export default function (ctx, inject) {
  const $colorMode = new Vue({
    data: {
      preference: colorMode.preference,
      value: colorMode.value,
      unknown: colorMode.preference === 'system'
    },
    watch: {
      preference (preference) {
        if (preference === 'system') {
          this.value = colorMode.getColorScheme()
          this._watchMedia()
        } else {
          this.value = preference
        }

        this._storePreference(preference)
      },
      value (newValue, oldValue) {
        colorMode.removeClass(oldValue)
        colorMode.addClass(newValue)
      }
    },
    created () {
      if (this.preference === 'system') {
        this._watchMedia()
      }
      if (window.localStorage) {
        this._watchStorageChange()
      }
    },
    methods: {
      _watchMedia () {
        if (this._mediaWatcher || !window.matchMedia) {
          return
        }

        this._darkWatcher = window.matchMedia('(prefers-color-scheme: dark)')
        this._darkWatcher.addListener((e) => {
          if (this.preference === 'system') {
            this.value = colorMode.getColorScheme()
          }
        })
      },
      _watchStorageChange () {
        window.addEventListener('storage', (e) => {
          if (e.key === cookieKey) {
            this.preference = e.newValue
          }
        })
      },
      _storePreference (preference) {
        // Cookies for SSR
        document.cookie = serialize(cookieKey, preference, cookieOptions)

        // Local storage to sync with other tabs
        if (window.localStorage) {
          window.localStorage.setItem(cookieKey, preference)
        }
      }
    }
  })

  if ($colorMode.unknown) {
    window.onNuxtReady(() => {
      $colorMode.unknown = false
    })
  }
  inject('colorMode', $colorMode)
}
