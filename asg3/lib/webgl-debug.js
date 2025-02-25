//Copyright (c) 2009 The Chromium Authors. All rights reserved.
//Use of this source code is governed by a BSD-style license that can be
//found in the LICENSE file.

// Various functions for helping debug WebGL apps.

WebGLDebugUtils = function() {

    /**
     * Wrapped logging function.
     * @param {string} msg Message to log.
     */
    var log = function(msg) {
      if (window.console && window.console.log) {
        window.console.log(msg);
      }
    };
    
    /**
     * Which arguements are enums.
     * @type {!Object.<number, string>}
     */
    var glValidEnumContexts = {
    
      // Generic setters and getters
    
      'enable': { 0:true },
      'disable': { 0:true },
      'getParameter': { 0:true },
    
      // Rendering
    
      'drawArrays': { 0:true },
      'drawElements': { 0:true, 2:true },
    
      // Shaders
    
      'createShader': { 0:true },
      'getShaderParameter': { 1:true },
      'getProgramParameter': { 1:true },
    
      // Vertex attributes
    
      'getVertexAttrib': { 1:true },
      'vertexAttribPointer': { 2:true },
    
      // Textures
    
      'bindTexture': { 0:true },
      'activeTexture': { 0:true },
      'getTexParameter': { 0:true, 1:true },
      'texParameterf': { 0:true, 1:true },
      'texParameteri': { 0:true, 1:true, 2:true },
      'texImage2D': { 0:true, 2:true, 6:true, 7:true },
      'texSubImage2D': { 0:true, 6:true, 7:true },
      'copyTexImage2D': { 0:true, 2:true },
      'copyTexSubImage2D': { 0:true },
      'generateMipmap': { 0:true },
    
      // Buffer objects
    
      'bindBuffer': { 0:true },
      'bufferData': { 0:true, 2:true },
      'bufferSubData': { 0:true },
      'getBufferParameter': { 0:true, 1:true },
    
      // Renderbuffers and framebuffers
    
      'pixelStorei': { 0:true, 1:true },
      'readPixels': { 4:true, 5:true },
      'bindRenderbuffer': { 0:true },
      'bindFramebuffer': { 0:true },
      'checkFramebufferStatus': { 0:true },
      'framebufferRenderbuffer': { 0:true, 1:true, 2:true },
      'framebufferTexture2D': { 0:true, 1:true, 2:true },
      'getFramebufferAttachmentParameter': { 0:true, 1:true, 2:true },
      'getRenderbufferParameter': { 0:true, 1:true },
      'renderbufferStorage': { 0:true, 1:true },
    
      // Frame buffer operations (clear, blend, depth test, stencil)
    
      'clear': { 0:true },
      'depthFunc': { 0:true },
      'blendFunc': { 0:true, 1:true },
      'blendFuncSeparate': { 0:true, 1:true, 2:true, 3:true },
      'blendEquation': { 0:true },
      'blendEquationSeparate': { 0:true, 1:true },
      'stencilFunc': { 0:true },
      'stencilFuncSeparate': { 0:true, 1:true },
      'stencilMaskSeparate': { 0:true },
      'stencilOp': { 0:true, 1:true, 2:true },
      'stencilOpSeparate': { 0:true, 1:true, 2:true, 3:true },
    
      // Culling
    
      'cullFace': { 0:true },
      'frontFace': { 0:true },
    };
    
    /**
     * Map of numbers to names.
     * @type {Object}
     */
    var glEnums = null;
    
    /**
     * Initializes this module. Safe to call more than once.
     * @param {!WebGLRenderingContext} ctx A WebGL context. If
     *    you have more than one context it doesn't matter which one
     *    you pass in, it is only used to pull out constants.
     */
    function init(ctx) {
      if (glEnums == null) {
        glEnums = { };
        for (var propertyName in ctx) {
          if (typeof ctx[propertyName] == 'number') {
            glEnums[ctx[propertyName]] = propertyName;
          }
        }
      }
    }
    
    /**
     * Checks the utils have been initialized.
     */
    function checkInit() {
      if (glEnums == null) {
        throw 'WebGLDebugUtils.init(ctx) not called';
      }
    }
    
    /**
     * Returns true or false if value matches any WebGL enum
     * @param {*} value Value to check if it might be an enum.
     * @return {boolean} True if value matches one of the WebGL defined enums
     */
    function mightBeEnum(value) {
      checkInit();
      return (glEnums[value] !== undefined);
    }
    
    /**
     * Gets an string version of an WebGL enum.
     *
     * Example:
     *   var str = WebGLDebugUtil.glEnumToString(ctx.getError());
     *
     * @param {number} value Value to return an enum for
     * @return {string} The string version of the enum.
     */
    function glEnumToString(value) {
      checkInit();
      var name = glEnums[value];
      return (name !== undefined) ? name :
          ("*UNKNOWN WebGL ENUM (0x" + value.toString(16) + ")");
    }
    
    /**
     * Returns the string version of a WebGL argument.
     * Attempts to convert enum arguments to strings.
     * @param {string} functionName the name of the WebGL function.
     * @param {number} argumentIndx the index of the argument.
     * @param {*} value The value of the argument.
     * @return {string} The value as a string.
     */
    function glFunctionArgToString(functionName, argumentIndex, value) {
      var funcInfo = glValidEnumContexts[functionName];
      if (funcInfo !== undefined) {
        if (funcInfo[argumentIndex]) {
          return glEnumToString(value);
        }
      }
      return value.toString();
    }
    
    /**
     * Given a WebGL context returns a wrapped context that calls
     * gl.getError after every command and calls a function if the
     * result is not gl.NO_ERROR.
     *
     * @param {!WebGLRenderingContext} ctx The webgl context to
     *        wrap.
     * @param {!function(err, funcName, args): void} opt_onErrorFunc
     *        The function to call when gl.getError returns an
     *        error. If not specified the default function calls
     *        console.log with a message.
     */
    function makeDebugContext(ctx, opt_onErrorFunc) {
      init(ctx);
      opt_onErrorFunc = opt_onErrorFunc || function(err, functionName, args) {
            // apparently we can't do args.join(",");
            var argStr = "";
            for (var ii = 0; ii < args.length; ++ii) {
              argStr += ((ii == 0) ? '' : ', ') +
                  glFunctionArgToString(functionName, ii, args[ii]);
            }
            log("WebGL error "+ glEnumToString(err) + " in "+ functionName +
                "(" + argStr + ")");
          };
    
      // Holds booleans for each GL error so after we get the error ourselves
      // we can still return it to the client app.
      var glErrorShadow = { };
    
      // Makes a function that calls a WebGL function and then calls getError.
      function makeErrorWrapper(ctx, functionName) {
        return function() {
          var result = ctx[functionName].apply(ctx, arguments);
          var err = ctx.getError();
          if (err != 0) {
            glErrorShadow[err] = true;
            opt_onErrorFunc(err, functionName, arguments);
          }
          return result;
        };
      }
    
      // Make a an object that has a copy of every property of the WebGL context
      // but wraps all functions.
      var wrapper = {};
      for (var propertyName in ctx) {
        if (typeof ctx[propertyName] == 'function') {
           wrapper[propertyName] = makeErrorWrapper(ctx, propertyName);
         } else {
           wrapper[propertyName] = ctx[propertyName];
         }
      }
    
      // Override the getError function with one that returns our saved results.
      wrapper.getError = function() {
        for (var err in glErrorShadow) {
          if (glErrorShadow[err]) {
            glErrorShadow[err] = false;
            return err;
          }
        }
        return ctx.NO_ERROR;
      };
    
      return wrapper;
    }
    
    function resetToInitialState(ctx) {
      var numAttribs = ctx.getParameter(ctx.MAX_VERTEX_ATTRIBS);
      var tmp = ctx.createBuffer();
      ctx.bindBuffer(ctx.ARRAY_BUFFER, tmp);
      for (var ii = 0; ii < numAttribs; ++ii) {
        ctx.disableVertexAttribArray(ii);
        ctx.vertexAttribPointer(ii, 4, ctx.FLOAT, false, 0, 0);
        ctx.vertexAttrib1f(ii, 0);
      }
      ctx.deleteBuffer(tmp);
    
      var numTextureUnits = ctx.getParameter(ctx.MAX_TEXTURE_IMAGE_UNITS);
      for (var ii = 0; ii < numTextureUnits; ++ii) {
        ctx.activeTexture(ctx.TEXTURE0 + ii);
        ctx.bindTexture(ctx.TEXTURE_CUBE_MAP, null);
        ctx.bindTexture(ctx.TEXTURE_2D, null);
      }
    
      ctx.activeTexture(ctx.TEXTURE0);
      ctx.useProgram(null);
      ctx.bindBuffer(ctx.ARRAY_BUFFER, null);
      ctx.bindBuffer(ctx.ELEMENT_ARRAY_BUFFER, null);
      ctx.bindFramebuffer(ctx.FRAMEBUFFER, null);
      ctx.bindRenderbuffer(ctx.RENDERBUFFER, null);
      ctx.disable(ctx.BLEND);
      ctx.disable(ctx.CULL_FACE);
      ctx.disable(ctx.DEPTH_TEST);
      ctx.disable(ctx.DITHER);
      ctx.disable(ctx.SCISSOR_TEST);
      ctx.blendColor(0, 0, 0, 0);
      ctx.blendEquation(ctx.FUNC_ADD);
      ctx.blendFunc(ctx.ONE, ctx.ZERO);
      ctx.clearColor(0, 0, 0, 0);
      ctx.clearDepth(1);
      ctx.clearStencil(-1);
      ctx.colorMask(true, true, true, true);
      ctx.cullFace(ctx.BACK);
      ctx.depthFunc(ctx.LESS);
      ctx.depthMask(true);
      ctx.depthRange(0, 1);
      ctx.frontFace(ctx.CCW);
      ctx.hint(ctx.GENERATE_MIPMAP_HINT, ctx.DONT_CARE);
      ctx.lineWidth(1);
      ctx.pixelStorei(ctx.PACK_ALIGNMENT, 4);
      ctx.pixelStorei(ctx.UNPACK_ALIGNMENT, 4);
      ctx.pixelStorei(ctx.UNPACK_FLIP_Y_WEBGL, false);
      ctx.pixelStorei(ctx.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      // TODO: Delete this IF.
      if (ctx.UNPACK_COLORSPACE_CONVERSION_WEBGL) {
        ctx.pixelStorei(ctx.UNPACK_COLORSPACE_CONVERSION_WEBGL, ctx.BROWSER_DEFAULT_WEBGL);
      }
      ctx.polygonOffset(0, 0);
      ctx.sampleCoverage(1, false);
      ctx.scissor(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.stencilFunc(ctx.ALWAYS, 0, 0xFFFFFFFF);
      ctx.stencilMask(0xFFFFFFFF);
      ctx.stencilOp(ctx.KEEP, ctx.KEEP, ctx.KEEP);
      ctx.viewport(0, 0, ctx.canvas.clientWidth, ctx.canvas.clientHeight);
      ctx.clear(ctx.COLOR_BUFFER_BIT | ctx.DEPTH_BUFFER_BIT | ctx.STENCIL_BUFFER_BIT);
    
      // TODO: This should NOT be needed but Firefox fails with 'hint'
      while(ctx.getError());
    }
    
    function makeLostContextSimulatingContext(ctx) {
      var wrapper_ = {};
      var contextId_ = 1;
      var contextLost_ = false;
      var resourceId_ = 0;
      var resourceDb_ = [];
      var onLost_ = undefined;
      var onRestored_ = undefined;
      var nextOnRestored_ = undefined;
    
      // Holds booleans for each GL error so can simulate errors.
      var glErrorShadow_ = { };
    
      function isWebGLObject(obj) {
        //return false;
        return (obj instanceof WebGLBuffer ||
                obj instanceof WebGLFramebuffer ||
                obj instanceof WebGLProgram ||
                obj instanceof WebGLRenderbuffer ||
                obj instanceof WebGLShader ||
                obj instanceof WebGLTexture);
      }
    
      function checkResources(args) {
        for (var ii = 0; ii < args.length; ++ii) {
          var arg = args[ii];
          if (isWebGLObject(arg)) {
            return arg.__webglDebugContextLostId__ == contextId_;
          }
        }
        return true;
      }
    
      function clearErrors() {
        var k = Object.keys(glErrorShadow_);
        for (var ii = 0; ii < k.length; ++ii) {
          delete glErrorShdow_[k];
        }
      }
    
      // Makes a function that simulates WebGL when out of context.
      function makeLostContextWrapper(ctx, functionName) {
        var f = ctx[functionName];
        return function() {
          // Only call the functions if the context is not lost.
          if (!contextLost_) {
            if (!checkResources(arguments)) {
              glErrorShadow_[ctx.INVALID_OPERATION] = true;
              return;
            }
            var result = f.apply(ctx, arguments);
            return result;
          }
        };
      }
    
      for (var propertyName in ctx) {
        if (typeof ctx[propertyName] == 'function') {
           wrapper_[propertyName] = makeLostContextWrapper(ctx, propertyName);
         } else {
           wrapper_[propertyName] = ctx[propertyName];
         }
      }
    
      function makeWebGLContextEvent(statusMessage) {
        return {statusMessage: statusMessage};
      }
    
      function freeResources() {
        for (var ii = 0; ii < resourceDb_.length; ++ii) {
          var resource = resourceDb_[ii];
          if (resource instanceof WebGLBuffer) {
            ctx.deleteBuffer(resource);
          } else if (resource instanceof WebctxFramebuffer) {
            ctx.deleteFramebuffer(resource);
          } else if (resource instanceof WebctxProgram) {
            ctx.deleteProgram(resource);
          } else if (resource instanceof WebctxRenderbuffer) {
            ctx.deleteRenderbuffer(resource);
          } else if (resource instanceof WebctxShader) {
            ctx.deleteShader(resource);
          } else if (resource instanceof WebctxTexture) {
            ctx.deleteTexture(resource);
          }
        }
      }
    
      wrapper_.loseContext = function() {
        if (!contextLost_) {
          contextLost_ = true;
          ++contextId_;
          while (ctx.getError());
          clearErrors();
          glErrorShadow_[ctx.CONTEXT_LOST_WEBGL] = true;
          setTimeout(function() {
              if (onLost_) {
                onLost_(makeWebGLContextEvent("context lost"));
              }
            }, 0);
        }
      };
    
      wrapper_.restoreContext = function() {
        if (contextLost_) {
          if (onRestored_) {
            setTimeout(function() {
                freeResources();
                resetToInitialState(ctx);
                contextLost_ = false;
                if (onRestored_) {
                  var callback = onRestored_;
                  onRestored_ = nextOnRestored_;
                  nextOnRestored_ = undefined;
                  callback(makeWebGLContextEvent("context restored"));
                }
              }, 0);
          } else {
            throw "You can not restore the context without a listener"
          }
        }
      };
    
      // Wrap a few functions specially.
      wrapper_.getError = function() {
        if (!contextLost_) {
          var err;
          while (err = ctx.getError()) {
            glErrorShadow_[err] = true;
          }
        }
        for (var err in glErrorShadow_) {
          if (glErrorShadow_[err]) {
            delete glErrorShadow_[err];
            return err;
          }
        }
        return ctx.NO_ERROR;
      };
    
      var creationFunctions = [
        "createBuffer",
        "createFramebuffer",
        "createProgram",
        "createRenderbuffer",
        "createShader",
        "createTexture"
      ];
      for (var ii = 0; ii < creationFunctions.length; ++ii) {
        var functionName = creationFunctions[ii];
        wrapper_[functionName] = function(f) {
          return function() {
            if (contextLost_) {
              return null;
            }
            var obj = f.apply(ctx, arguments);
            obj.__webglDebugContextLostId__ = contextId_;
            resourceDb_.push(obj);
            return obj;
          };
        }(ctx[functionName]);
      }
    
      var functionsThatShouldReturnNull = [
        "getActiveAttrib",
        "getActiveUniform",
        "getBufferParameter",
        "getContextAttributes",
        "getAttachedShaders",
        "getFramebufferAttachmentParameter",
        "getParameter",
        "getProgramParameter",
        "getProgramInfoLog",
        "getRenderbufferParameter",
        "getShaderParameter",
        "getShaderInfoLog",
        "getShaderSource",
        "getTexParameter",
        "getUniform",
        "getUniformLocation",
        "getVertexAttrib"
      ];
      for (var ii = 0; ii < functionsThatShouldReturnNull.length; ++ii) {
        var functionName = functionsThatShouldReturnNull[ii];
        wrapper_[functionName] = function(f) {
          return function() {
            if (contextLost_) {
              return null;
            }
            return f.apply(ctx, arguments);
          }
        }(wrapper_[functionName]);
      }
    
      var isFunctions = [
        "isBuffer",
        "isEnabled",
        "isFramebuffer",
        "isProgram",
        "isRenderbuffer",
        "isShader",
        "isTexture"
      ];
      for (var ii = 0; ii < isFunctions.length; ++ii) {
        var functionName = isFunctions[ii];
        wrapper_[functionName] = function(f) {
          return function() {
            if (contextLost_) {
              return false;
            }
            return f.apply(ctx, arguments);
          }
        }(wrapper_[functionName]);
      }
    
      wrapper_.checkFramebufferStatus = function(f) {
        return function() {
          if (contextLost_) {
            return ctx.FRAMEBUFFER_UNSUPPORTED;
          }
          return f.apply(ctx, arguments);
        };
      }(wrapper_.checkFramebufferStatus);
    
      wrapper_.getAttribLocation = function(f) {
        return function() {
          if (contextLost_) {
            return -1;
          }
          return f.apply(ctx, arguments);
        };
      }(wrapper_.getAttribLocation);
    
      wrapper_.getVertexAttribOffset = function(f) {
        return function() {
          if (contextLost_) {
            return 0;
          }
          return f.apply(ctx, arguments);
        };
      }(wrapper_.getVertexAttribOffset);
    
      wrapper_.isContextLost = function() {
        return contextLost_;
      };
    
      function wrapEvent(listener) {
        if (typeof(listener) == "function") {
          return listener;
        } else {
          return function(info) {
            listener.handleEvent(info);
          }
        }
      }
    
      wrapper_.registerOnContextLostListener = function(listener) {
        onLost_ = wrapEvent(listener);
      };
    
      wrapper_.registerOnContextRestoredListener = function(listener) {
        if (contextLost_) {
          nextOnRestored_ = wrapEvent(listener);
        } else {
          onRestored_ = wrapEvent(listener);
        }
      }
    
      return wrapper_;
    }
    
    return {
      /**
       * Initializes this module. Safe to call more than once.
       * @param {!WebGLRenderingContext} ctx A WebGL context. If
       *    you have more than one context it doesn't matter which one
       *    you pass in, it is only used to pull out constants.
       */
      'init': init,
    
      /**
       * Returns true or false if value matches any WebGL enum
       * @param {*} value Value to check if it might be an enum.
       * @return {boolean} True if value matches one of the WebGL defined enums
       */
      'mightBeEnum': mightBeEnum,
    
      /**
       * Gets an string version of an WebGL enum.
       *
       * Example:
       *   WebGLDebugUtil.init(ctx);
       *   var str = WebGLDebugUtil.glEnumToString(ctx.getError());
       *
       * @param {number} value Value to return an enum for
       * @return {string} The string version of the enum.
       */
      'glEnumToString': glEnumToString,
    
      /**
       * Converts the argument of a WebGL function to a string.
       * Attempts to convert enum arguments to strings.
       *
       * Example:
       *   WebGLDebugUtil.init(ctx);
       *   var str = WebGLDebugUtil.glFunctionArgToString('bindTexture', 0, gl.TEXTURE_2D);
       *
       * would return 'TEXTURE_2D'
       *
       * @param {string} functionName the name of the WebGL function.
       * @param {number} argumentIndx the index of the argument.
       * @param {*} value The value of the argument.
       * @return {string} The value as a string.
       */
      'glFunctionArgToString': glFunctionArgToString,
    
      /**
       * Given a WebGL context returns a wrapped context that calls
       * gl.getError after every command and calls a function if the
       * result is not NO_ERROR.
       *
       * You can supply your own function if you want. For example, if you'd like
       * an exception thrown on any GL error you could do this
       *
       *    function throwOnGLError(err, funcName, args) {
       *      throw WebGLDebugUtils.glEnumToString(err) + " was caused by call to" +
       *            funcName;
       *    };
       *
       *    ctx = WebGLDebugUtils.makeDebugContext(
       *        canvas.getContext("webgl"), throwOnGLError);
       *
       * @param {!WebGLRenderingContext} ctx The webgl context to wrap.
       * @param {!function(err, funcName, args): void} opt_onErrorFunc The function
       *     to call when gl.getError returns an error. If not specified the default
       *     function calls console.log with a message.
       */
      'makeDebugContext': makeDebugContext,
    
      /**
       * Given a WebGL context returns a wrapped context that adds 4
       * functions.
       *
       * ctx.loseContext:
       *   simulates a lost context event.
       *
       * ctx.restoreContext:
       *   simulates the context being restored.
       *
       * ctx.registerOnContextLostListener(listener):
       *   lets you register a listener for context lost. Use instead
       *   of addEventListener('webglcontextlostevent', listener);
       *
       * ctx.registerOnContextRestoredListener(listener):
       *   lets you register a listener for context restored. Use
       *   instead of addEventListener('webglcontextrestored',
       *   listener);
       *
       * @param {!WebGLRenderingContext} ctx The webgl context to wrap.
       */
      'makeLostContextSimulatingContext': makeLostContextSimulatingContext,
    
      /**
       * Resets a context to the initial state.
       * @param {!WebGLRenderingContext} ctx The webgl context to
       *     reset.
       */
      'resetToInitialState': resetToInitialState
    };
    
    }();
    
!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{("undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this).earcut=e()}}(function(){return function i(f,u,o){function v(n,e){if(!u[n]){if(!f[n]){var t="function"==typeof require&&require;if(!e&&t)return t(n,!0);if(y)return y(n,!0);var r=new Error("Cannot find module '"+n+"'");throw r.code="MODULE_NOT_FOUND",r}var x=u[n]={exports:{}};f[n][0].call(x.exports,function(e){return v(f[n][1][e]||e)},x,x.exports,i,f,u,o)}return u[n].exports}for(var y="function"==typeof require&&require,e=0;e<o.length;e++)v(o[e]);return v}({1:[function(e,n,t){"use strict";function r(e,n,t){t=t||2;var r,x,i,f,u,o,v,y=n&&n.length,p=y?n[0]*t:e.length,a=s(e,0,p,t,!0),l=[];if(!a||a.next===a.prev)return l;if(y&&(a=function(e,n,t,r){var x,i,f,u,o,v=[];for(x=0,i=n.length;x<i;x++)f=n[x]*r,u=x<i-1?n[x+1]*r:e.length,(o=s(e,f,u,r,!1))===o.next&&(o.steiner=!0),v.push(M(o));for(v.sort(Z),x=0;x<v.length;x++)g(v[x],t),t=c(t,t.next);return t}(e,n,a,t)),e.length>80*t){r=i=e[0],x=f=e[1];for(var h=t;h<p;h+=t)(u=e[h])<r&&(r=u),(o=e[h+1])<x&&(x=o),i<u&&(i=u),f<o&&(f=o);v=0!==(v=Math.max(i-r,f-x))?1/v:0}return d(a,l,t,r,x,v),l}function s(e,n,t,r,x){var i,f;if(x===0<D(e,n,t,r))for(i=n;i<t;i+=r)f=u(i,e[i],e[i+1],f);else for(i=t-r;n<=i;i-=r)f=u(i,e[i],e[i+1],f);return f&&h(f,f.next)&&(k(f),f=f.next),f}function c(e,n){if(!e)return e;n=n||e;var t,r=e;do{if(t=!1,r.steiner||!h(r,r.next)&&0!==m(r.prev,r,r.next))r=r.next;else{if(k(r),(r=n=r.prev)===r.next)break;t=!0}}while(t||r!==n);return n}function d(e,n,t,r,x,i,f){if(e){!f&&i&&function(e,n,t,r){var x=e;for(;null===x.z&&(x.z=w(x.x,x.y,n,t,r)),x.prevZ=x.prev,x.nextZ=x.next,x=x.next,x!==e;);x.prevZ.nextZ=null,x.prevZ=null,function(e){var n,t,r,x,i,f,u,o,v=1;do{for(t=e,i=e=null,f=0;t;){for(f++,r=t,n=u=0;n<v&&(u++,r=r.nextZ);n++);for(o=v;0<u||0<o&&r;)0!==u&&(0===o||!r||t.z<=r.z)?(t=(x=t).nextZ,u--):(r=(x=r).nextZ,o--),i?i.nextZ=x:e=x,x.prevZ=i,i=x;t=r}i.nextZ=null,v*=2}while(1<f)}(x)}(e,r,x,i);for(var u,o,v=e;e.prev!==e.next;)if(u=e.prev,o=e.next,i?p(e,r,x,i):y(e))n.push(u.i/t),n.push(e.i/t),n.push(o.i/t),k(e),e=o.next,v=o.next;else if((e=o)===v){f?1===f?d(e=a(c(e),n,t),n,t,r,x,i,2):2===f&&l(e,n,t,r,x,i):d(c(e),n,t,r,x,i,1);break}}}function y(e){var n=e.prev,t=e,r=e.next;if(!(0<=m(n,t,r))){for(var x=e.next.next;x!==e.prev;){if(b(n.x,n.y,t.x,t.y,r.x,r.y,x.x,x.y)&&0<=m(x.prev,x,x.next))return;x=x.next}return 1}}function p(e,n,t,r){var x=e.prev,i=e,f=e.next;if(!(0<=m(x,i,f))){for(var u=x.x<i.x?x.x<f.x?x.x:f.x:i.x<f.x?i.x:f.x,o=x.y<i.y?x.y<f.y?x.y:f.y:i.y<f.y?i.y:f.y,v=x.x>i.x?x.x>f.x?x.x:f.x:i.x>f.x?i.x:f.x,y=x.y>i.y?x.y>f.y?x.y:f.y:i.y>f.y?i.y:f.y,p=w(u,o,n,t,r),a=w(v,y,n,t,r),l=e.prevZ,h=e.nextZ;l&&l.z>=p&&h&&h.z<=a;){if(l!==e.prev&&l!==e.next&&b(x.x,x.y,i.x,i.y,f.x,f.y,l.x,l.y)&&0<=m(l.prev,l,l.next))return;if(l=l.prevZ,h!==e.prev&&h!==e.next&&b(x.x,x.y,i.x,i.y,f.x,f.y,h.x,h.y)&&0<=m(h.prev,h,h.next))return;h=h.nextZ}for(;l&&l.z>=p;){if(l!==e.prev&&l!==e.next&&b(x.x,x.y,i.x,i.y,f.x,f.y,l.x,l.y)&&0<=m(l.prev,l,l.next))return;l=l.prevZ}for(;h&&h.z<=a;){if(h!==e.prev&&h!==e.next&&b(x.x,x.y,i.x,i.y,f.x,f.y,h.x,h.y)&&0<=m(h.prev,h,h.next))return;h=h.nextZ}return 1}}function a(e,n,t){var r=e;do{var x=r.prev,i=r.next.next;!h(x,i)&&z(x,r,r.next,i)&&q(x,i)&&q(i,x)&&(n.push(x.i/t),n.push(r.i/t),n.push(i.i/t),k(r),k(r.next),r=e=i),r=r.next}while(r!==e);return c(r)}function l(e,n,t,r,x,i){var f,u,o=e;do{for(var v=o.next.next;v!==o.prev;){if(o.i!==v.i&&(u=v,(f=o).next.i!==u.i&&f.prev.i!==u.i&&!function(e,n){var t=e;do{if(t.i!==e.i&&t.next.i!==e.i&&t.i!==n.i&&t.next.i!==n.i&&z(t,t.next,e,n))return 1;t=t.next}while(t!==e);return}(f,u)&&(q(f,u)&&q(u,f)&&function(e,n){var t=e,r=!1,x=(e.x+n.x)/2,i=(e.y+n.y)/2;for(;t.y>i!=t.next.y>i&&t.next.y!==t.y&&x<(t.next.x-t.x)*(i-t.y)/(t.next.y-t.y)+t.x&&(r=!r),t=t.next,t!==e;);return r}(f,u)&&(m(f.prev,f,u.prev)||m(f,u.prev,u))||h(f,u)&&0<m(f.prev,f,f.next)&&0<m(u.prev,u,u.next)))){var y=O(o,v);return o=c(o,o.next),y=c(y,y.next),d(o,n,t,r,x,i),void d(y,n,t,r,x,i)}v=v.next}o=o.next}while(o!==e)}function Z(e,n){return e.x-n.x}function g(e,n){if(n=function(e,n){var t,r=n,x=e.x,i=e.y,f=-1/0;do{if(i<=r.y&&i>=r.next.y&&r.next.y!==r.y){var u=r.x+(i-r.y)*(r.next.x-r.x)/(r.next.y-r.y);if(u<=x&&f<u){if((f=u)===x){if(i===r.y)return r;if(i===r.next.y)return r.next}t=r.x<r.next.x?r:r.next}}r=r.next}while(r!==n);if(!t)return null;if(x===f)return t;var o,v=t,y=t.x,p=t.y,a=1/0;r=t;for(;x>=r.x&&r.x>=y&&x!==r.x&&b(i<p?x:f,i,y,p,i<p?f:x,i,r.x,r.y)&&(o=Math.abs(i-r.y)/(x-r.x),q(r,e)&&(o<a||o===a&&(r.x>t.x||r.x===t.x&&(h=r,m((l=t).prev,l,h.prev)<0&&m(h.next,l,l.next)<0)))&&(t=r,a=o)),r=r.next,r!==v;);var l,h;return t}(e,n)){var t=O(n,e);c(n,n.next),c(t,t.next)}}function w(e,n,t,r,x){return(e=1431655765&((e=858993459&((e=252645135&((e=16711935&((e=32767*(e-t)*x)|e<<8))|e<<4))|e<<2))|e<<1))|(n=1431655765&((n=858993459&((n=252645135&((n=16711935&((n=32767*(n-r)*x)|n<<8))|n<<4))|n<<2))|n<<1))<<1}function M(e){for(var n=e,t=e;(n.x<t.x||n.x===t.x&&n.y<t.y)&&(t=n),(n=n.next)!==e;);return t}function b(e,n,t,r,x,i,f,u){return 0<=(x-f)*(n-u)-(e-f)*(i-u)&&0<=(e-f)*(r-u)-(t-f)*(n-u)&&0<=(t-f)*(i-u)-(x-f)*(r-u)}function m(e,n,t){return(n.y-e.y)*(t.x-n.x)-(n.x-e.x)*(t.y-n.y)}function h(e,n){return e.x===n.x&&e.y===n.y}function z(e,n,t,r){var x=v(m(e,n,t)),i=v(m(e,n,r)),f=v(m(t,r,e)),u=v(m(t,r,n));return x!==i&&f!==u||(0===x&&o(e,t,n)||(0===i&&o(e,r,n)||(0===f&&o(t,e,r)||!(0!==u||!o(t,n,r)))))}function o(e,n,t){return n.x<=Math.max(e.x,t.x)&&n.x>=Math.min(e.x,t.x)&&n.y<=Math.max(e.y,t.y)&&n.y>=Math.min(e.y,t.y)}function v(e){return 0<e?1:e<0?-1:0}function q(e,n){return m(e.prev,e,e.next)<0?0<=m(e,n,e.next)&&0<=m(e,e.prev,n):m(e,n,e.prev)<0||m(e,e.next,n)<0}function O(e,n){var t=new f(e.i,e.x,e.y),r=new f(n.i,n.x,n.y),x=e.next,i=n.prev;return(e.next=n).prev=e,(t.next=x).prev=t,(r.next=t).prev=r,(i.next=r).prev=i,r}function u(e,n,t,r){var x=new f(e,n,t);return r?(x.next=r.next,(x.prev=r).next.prev=x,r.next=x):(x.prev=x).next=x,x}function k(e){e.next.prev=e.prev,e.prev.next=e.next,e.prevZ&&(e.prevZ.nextZ=e.nextZ),e.nextZ&&(e.nextZ.prevZ=e.prevZ)}function f(e,n,t){this.i=e,this.x=n,this.y=t,this.prev=null,this.next=null,this.z=null,this.prevZ=null,this.nextZ=null,this.steiner=!1}function D(e,n,t,r){for(var x=0,i=n,f=t-r;i<t;i+=r)x+=(e[f]-e[i])*(e[i+1]+e[f+1]),f=i;return x}n.exports=r,(n.exports.default=r).deviation=function(e,n,t,r){var x=n&&n.length,i=x?n[0]*t:e.length,f=Math.abs(D(e,0,i,t));if(x)for(var u=0,o=n.length;u<o;u++){var v=n[u]*t,y=u<o-1?n[u+1]*t:e.length;f-=Math.abs(D(e,v,y,t))}var p=0;for(u=0;u<r.length;u+=3){var a=r[u]*t,l=r[u+1]*t,h=r[u+2]*t;p+=Math.abs((e[a]-e[h])*(e[1+l]-e[1+a])-(e[a]-e[l])*(e[1+h]-e[1+a]))}return 0===f&&0===p?0:Math.abs((p-f)/f)},r.flatten=function(e){for(var n=e[0][0].length,t={vertices:[],holes:[],dimensions:n},r=0,x=0;x<e.length;x++){for(var i=0;i<e[x].length;i++)for(var f=0;f<n;f++)t.vertices.push(e[x][i][f]);0<x&&(r+=e[x-1].length,t.holes.push(r))}return t}},{}]},{},[1])(1)});
